import type { PublicPetDirectory } from "@/lib/domain/directory/types";
import { toPublicPetCard } from "@/lib/mapping/publicPet";

type SupabaseRpcError = {
  message?: string;
  code?: string;
};

export type PublicPetRpcClient = {
  rpc(
    functionName: "obtener_ficha_publica" | "listar_mascotas_perdidas",
    args: { p_codigo: string } | { p_limite: number; p_offset: number },
  ): PromiseLike<{ data: unknown; error: SupabaseRpcError | null }>;
  storage?: {
    from(bucket: "pawpass-fotos"): {
      createSignedUrl(path: string, expiresIn: number): PromiseLike<{ data: { signedUrl: string } | null; error: unknown }>;
    };
  };
};

export class SupabasePublicPetDirectoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SupabasePublicPetDirectoryError";
  }
}

function unwrapRpcData(data: unknown): unknown {
  // PostgREST returns the jsonb value directly. The array branch keeps the
  // adapter tolerant of clients that wrap a single RPC row in an array.
  return Array.isArray(data) && data.length === 1 ? data[0] : data;
}

function paths(raw: unknown, field: "photoPath" | "recentPhotoPaths"): string[] {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return [];
  const value = (raw as Record<string, unknown>)[field];
  const items = field === "photoPath" ? [value] : Array.isArray(value) ? value : [];
  return items.filter((item): item is string => typeof item === "string" && item.length > 0).slice(0, 6);
}

async function signPhotoPaths(client: PublicPetRpcClient, raw: unknown, card: NonNullable<ReturnType<typeof toPublicPetCard>>) {
  if (!client.storage) return card;
  const photoPaths = paths(raw, "photoPath");
  const recentPaths = paths(raw, "recentPhotoPaths");
  const sign = async (path: string) => {
    try {
      const { data } = await client.storage!.from("pawpass-fotos").createSignedUrl(path, 300);
      return data?.signedUrl ?? null;
    } catch {
      return null;
    }
  };
  const [photoUrl, recentUrls] = await Promise.all([
    photoPaths[0] ? sign(photoPaths[0]) : Promise.resolve(null),
    Promise.all(recentPaths.map(sign)),
  ]);
  return {
    ...card,
    photoUrl: photoUrl ?? card.photoUrl,
    recentPhotos: recentUrls.filter((url): url is string => Boolean(url)).map((url) => ({ url })),
  };
}

/**
 * Directory adapter for the anonymous QR contract.
 *
 * The database function is the privacy boundary: it returns only the fields
 * needed by `PublicPetCard`. The mapper applies the same boundary once more so
 * a future SQL change cannot accidentally widen what reaches the UI.
 */
export function createSupabasePublicPetDirectory(client: PublicPetRpcClient): PublicPetDirectory {
  return {
    async findPublicPet(publicCode) {
      const normalized = publicCode.trim();
      if (!normalized) return null;

      const { data, error } = await client.rpc("obtener_ficha_publica", {
        p_codigo: normalized,
      });

      if (error) {
        throw new SupabasePublicPetDirectoryError(
          error.message ?? "No se pudo consultar la ficha pública en Supabase.",
        );
      }

      const raw = unwrapRpcData(data);
      const card = toPublicPetCard(raw);
      return card ? signPhotoPaths(client, raw, card) : null;
    },
    async listLostPets() {
      const { data, error } = await client.rpc("listar_mascotas_perdidas", { p_limite: 50, p_offset: 0 });
      if (error) {
        throw new SupabasePublicPetDirectoryError(error.message ?? "No se pudo cargar el directorio de mascotas perdidas.");
      }
      if (!Array.isArray(data)) return [];
      return Promise.all(data.map(async (raw) => {
        const card = toPublicPetCard(raw);
        return card?.status === "perdido" ? signPhotoPaths(client, raw, card) : null;
      })).then((cards) => cards.filter((card): card is NonNullable<typeof card> => card !== null));
    },
  };
}
