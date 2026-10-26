import type { PublicPetDirectory } from "@/lib/domain/directory/types";
import { toPublicPetCard } from "@/lib/mapping/publicPet";
import { toPublicProfile, toPublicProfileCard } from "@/lib/mapping/publicProfile";
import type { PublicProfileDirectory } from "@/types/publicProfile";

type SupabaseRpcError = {
  message?: string;
  code?: string;
};

export type PublicPetRpcClient = {
  rpc(
    functionName: "obtener_ficha_publica" | "listar_mascotas_perdidas" | "obtener_perfil_publico" | "listar_perfiles_publicos",
    args: { p_codigo: string } | { p_limite: number; p_offset: number },
  ): PromiseLike<{ data: unknown; error: SupabaseRpcError | null }>;
  storage?: {
    from(bucket: "pawpass-fotos" | "pawpass-documentos"): {
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

const historicalPublicPhotoByCode: Readonly<Record<string, string>> = {
  "PC-LUCCA-001": "/pets/lucca.jpeg",
  "PC-NIKO-002": "/pets/niko.jpeg",
  "PC-ALIX-003": "/pets/alix.jpeg",
  "PC-LOKI-001": "/pets/loki.jpeg",
  "PC-VISERYS-001": "/pets/viserys.jpeg",
};

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

function historicalPublicPhoto(raw: unknown): string | null {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;
  const payload = raw as Record<string, unknown>;
  const publicCode = payload.publicCode;
  const photoUrl = payload.photoUrl;
  if (typeof publicCode !== "string" || typeof photoUrl !== "string" || paths(payload, "photoPath").length > 0) {
    return null;
  }
  return historicalPublicPhotoByCode[publicCode] === photoUrl ? photoUrl : null;
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
export function createSupabasePublicPetDirectory(client: PublicPetRpcClient): PublicPetDirectory & PublicProfileDirectory {
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
    async listPublicProfiles() {
      const { data, error } = await client.rpc("listar_perfiles_publicos", { p_limite: 50, p_offset: 0 });
      if (error) throw new SupabasePublicPetDirectoryError(error.message ?? "No se pudo cargar el directorio público.");
      if (!Array.isArray(data)) return [];
      return Promise.all(data.map(async (raw) => {
        const card = toPublicProfileCard(raw);
        if (!card) return null;
        const photoPath = paths(raw, "photoPath")[0];
        if (!photoPath) return { ...card, photoUrl: historicalPublicPhoto(raw) };
        if (!client.storage) return { ...card, photoUrl: null };
        try {
          const { data: signed } = await client.storage.from("pawpass-fotos").createSignedUrl(photoPath, 300);
          return signed?.signedUrl ? { ...card, photoUrl: signed.signedUrl } : { ...card, photoUrl: historicalPublicPhoto(raw) };
        } catch {
          return { ...card, photoUrl: historicalPublicPhoto(raw) };
        }
      })).then((cards) => cards.filter((card): card is NonNullable<typeof card> => card !== null));
    },
    async findPublicProfile(publicCode) {
      const normalized = publicCode.trim();
      if (!normalized) return null;
      const { data, error } = await client.rpc("obtener_perfil_publico", { p_codigo: normalized });
      if (error) throw new SupabasePublicPetDirectoryError(error.message ?? "No se pudo cargar el perfil público.");
      const raw = unwrapRpcData(data);
      if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;
      const payload = raw as Record<string, unknown>;
      const primaryPath = paths(payload, "photoPath")[0];
      const signPath = async (bucket: "pawpass-fotos" | "pawpass-documentos", path: unknown) => {
        if (typeof path !== "string" || !path || !client.storage) return null;
        try {
          const { data: signed } = await client.storage.from(bucket).createSignedUrl(path, 300);
          return signed?.signedUrl ?? null;
        } catch {
          return null;
        }
      };
      const [photoUrl, photos, documents] = await Promise.all([
        signPath("pawpass-fotos", primaryPath),
        Promise.all((Array.isArray(payload.photos) ? payload.photos : []).map(async (item) => {
          const row = typeof item === "object" && item !== null ? item as Record<string, unknown> : {};
          const url = row.visible === true ? await signPath("pawpass-fotos", row.path) : null;
          return url ? { visible: true, url } : null;
        })),
        Promise.all((Array.isArray(payload.documents) ? payload.documents : []).map(async (item) => {
          const row = typeof item === "object" && item !== null ? item as Record<string, unknown> : {};
          const bucket = row.bucket === "pawpass-fotos" ? "pawpass-fotos" : "pawpass-documentos";
          const url = row.visible === true ? await signPath(bucket, row.path) : null;
          return url ? { ...row, url } : null;
        })),
      ]);
      const signedPhotos = photos.filter((item): item is { visible: true; url: string } => item !== null);
      // QR's primary photo is also the identity image for the voluntary profile.
      const profile = toPublicProfile({
        ...payload,
        photoUrl: photoUrl ?? historicalPublicPhoto(payload),
        photos: signedPhotos,
        documents: documents.filter((item) => item !== null),
      });
      return profile;
    },
  };
}
