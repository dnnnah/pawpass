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
      createSignedUrls?(paths: string[], expiresIn: number): PromiseLike<{
        data: Array<{ path: string | null; signedUrl: string | null; error: string | null }> | null;
        error: unknown;
      }>;
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
  // The bundled Bruno demo seed has the same legacy portrait URL as its static record.
  "PC-BRUNO-001": "/pets/lucca.jpeg",
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

function historicalPublicPhoto(raw: unknown, allowQrDemoFallback = false): string | null {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;
  const payload = raw as Record<string, unknown>;
  const publicCode = payload.publicCode;
  const photoUrl = payload.photoUrl;
  if (typeof publicCode !== "string" || paths(payload, "photoPath").length > 0) {
    return null;
  }
  const knownPhotoUrl = historicalPublicPhotoByCode[publicCode];
  if (!knownPhotoUrl) return null;
  if (photoUrl === knownPhotoUrl) return knownPhotoUrl;
  return allowQrDemoFallback && photoUrl == null ? knownPhotoUrl : null;
}

type PublicPetEntry = { raw: unknown; card: NonNullable<ReturnType<typeof toPublicPetCard>> };

async function signPhotoPaths(client: PublicPetRpcClient, entries: PublicPetEntry[], allowQrDemoFallback = false) {
  const entryPaths = entries.map(({ raw }) => ({ primary: paths(raw, "photoPath")[0] ?? null, recent: paths(raw, "recentPhotoPaths") }));
  const uniquePaths = [...new Set(entryPaths.flatMap(({ primary, recent }) => [primary, ...recent]).filter((path): path is string => Boolean(path)))];
  const signedUrlByPath = new Map<string, string>();

  if (uniquePaths.length > 0 && client.storage) {
    try {
      const result = await client.storage.from("pawpass-fotos").createSignedUrls?.(uniquePaths, 300);
      for (const entry of result?.data ?? []) {
        if (!entry.error && entry.path && entry.signedUrl) signedUrlByPath.set(entry.path, entry.signedUrl);
      }
    } catch {
      // Preserve the card if Storage is temporarily unavailable.
    }
  }

  return entries.map(({ raw, card }, index) => {
    const { primary, recent } = entryPaths[index];
    return {
      ...card,
      photoUrl: (primary ? signedUrlByPath.get(primary) : null)
        ?? card.photoUrl
        ?? historicalPublicPhoto(raw, allowQrDemoFallback),
      recentPhotos: recent
        .map((path) => signedUrlByPath.get(path))
        .filter((url): url is string => Boolean(url))
        .map((url) => ({ url })),
    };
  });
}

async function signPublishedPhotoPaths(client: PublicPetRpcClient, photoPaths: string[]): Promise<Map<string, string>> {
  const signedByPath = new Map<string, string>();
  const uniquePaths = [...new Set(photoPaths.filter(Boolean))];
  if (!uniquePaths.length || !client.storage) return signedByPath;

  try {
    const bucket = client.storage.from("pawpass-fotos");
    if (bucket.createSignedUrls) {
      const result = await bucket.createSignedUrls(uniquePaths, 300);
      for (const item of result.data ?? []) {
        if (item.path && item.signedUrl && !item.error) signedByPath.set(item.path, item.signedUrl);
      }
      return signedByPath;
    }
  } catch {
    // Retry each allowed photo below if the batch endpoint is unavailable.
  }

  await Promise.all(uniquePaths.map(async (path) => {
    try {
      const { data } = await client.storage?.from("pawpass-fotos").createSignedUrl(path, 300) ?? { data: null };
      if (data?.signedUrl) signedByPath.set(path, data.signedUrl);
    } catch {
      // Keep the rest of the public profile available if one image fails.
    }
  }));
  return signedByPath;
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
      if (!card) return null;
      return (await signPhotoPaths(client, [{ raw, card }], true))[0];
    },
    async listLostPets() {
      const { data, error } = await client.rpc("listar_mascotas_perdidas", { p_limite: 50, p_offset: 0 });
      if (error) {
        throw new SupabasePublicPetDirectoryError(error.message ?? "No se pudo cargar el directorio de mascotas perdidas.");
      }
      if (!Array.isArray(data)) return [];
      const entries = data.flatMap((raw) => {
        const card = toPublicPetCard(raw);
        return card?.status === "perdido" ? [{ raw, card }] : [];
      });
      return signPhotoPaths(client, entries, true);
    },
    async listPublicProfiles() {
      const { data, error } = await client.rpc("listar_perfiles_publicos", { p_limite: 50, p_offset: 0 });
      if (error) throw new SupabasePublicPetDirectoryError(error.message ?? "No se pudo cargar el directorio público.");
      if (!Array.isArray(data)) return [];
      const entries = data.flatMap((raw) => {
        const card = toPublicProfileCard(raw);
        return card ? [{ raw, card }] : [];
      });
      const signedByPath = await signPublishedPhotoPaths(client, entries.map(({ raw }) => paths(raw, "photoPath")[0] ?? ""));
      return entries.map(({ raw, card }) => {
        const photoPath = paths(raw, "photoPath")[0];
        return { ...card, photoUrl: (photoPath ? signedByPath.get(photoPath) : null) ?? card.photoUrl ?? historicalPublicPhoto(raw) };
      });
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
      const publicPhotoPaths = (Array.isArray(payload.photos) ? payload.photos : []).flatMap((item) => {
        const row = typeof item === "object" && item !== null ? item as Record<string, unknown> : {};
        return row.visible === true && typeof row.path === "string" && row.path ? [row.path] : [];
      });
      const signedPhotoByPath = await signPublishedPhotoPaths(client, [primaryPath ?? "", ...publicPhotoPaths]);
      const signPath = async (bucket: "pawpass-fotos" | "pawpass-documentos", path: unknown) => {
        if (typeof path !== "string" || !path || !client.storage) return null;
        try {
          const { data: signed } = await client.storage.from(bucket).createSignedUrl(path, 300);
          return signed?.signedUrl ?? null;
        } catch {
          return null;
        }
      };
      const [photos, documents] = await Promise.all([
        Promise.resolve(publicPhotoPaths.map((path) => {
          const url = signedPhotoByPath.get(path);
          return url ? { visible: true as const, url } : null;
        })),
        Promise.all((Array.isArray(payload.documents) ? payload.documents : []).map(async (item) => {
          const row = typeof item === "object" && item !== null ? item as Record<string, unknown> : {};
          const bucket = row.bucket === "pawpass-fotos" ? "pawpass-fotos" : "pawpass-documentos";
          const url = row.visible === true ? await signPath(bucket, row.path) : null;
          return url ? { ...row, url } : null;
        })),
      ]);
      // The public RPC keeps a stable oldest-first order; the gallery leads with the newest share.
      const signedPhotos = photos.filter((item): item is { visible: true; url: string } => item !== null).reverse();
      // QR's primary photo is also the identity image for the voluntary profile.
      const profile = toPublicProfile({
        ...payload,
        photoUrl: (primaryPath ? signedPhotoByPath.get(primaryPath) : null) ?? historicalPublicPhoto(payload),
        photos: signedPhotos,
        documents: documents.filter((item) => item !== null),
      });
      return profile;
    },
  };
}
