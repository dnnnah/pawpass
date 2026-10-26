import type { AdoptionCatalogEntry } from "@/types/adoption";

type SupabaseRpcError = {
  message?: string;
  code?: string;
};

export type AdoptionCatalogRpcClient = {
  rpc(
    functionName: "listar_catalogo_publico",
    args: { p_limite: number; p_offset: number },
  ): PromiseLike<{ data: unknown; error: SupabaseRpcError | null }>;
  storage?: {
    from(bucket: "pawpass-fotos"): {
      createSignedUrl(path: string, expiresIn: number): PromiseLike<{
        data: { signedUrl: string } | null;
        error: unknown;
      }>;
    };
  };
};

type RawCatalogEntry = {
  petId?: unknown;
  codigoPublico?: unknown;
  nombre?: unknown;
  especie?: unknown;
  raza?: unknown;
  genero?: unknown;
  talla?: unknown;
  fechaNacimiento?: unknown;
  edadMeses?: unknown;
  photoPath?: unknown;
  zona?: unknown;
  verificado?: unknown;
  shelterId?: unknown;
  shelterNombre?: unknown;
};

export class SupabaseAdoptionCatalogError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SupabaseAdoptionCatalogError";
  }
}

function unwrapRpcData(data: unknown): unknown {
  return Array.isArray(data) && data.length === 1 && Array.isArray(data[0]) ? data[0] : data;
}

function normalizeEntry(value: unknown): { entry: AdoptionCatalogEntry; photoPath: string } | null {
  if (!value || typeof value !== "object") return null;
  const row = value as RawCatalogEntry;
  const petId = typeof row.petId === "string" ? row.petId.trim() : "";
  const codigoPublico = typeof row.codigoPublico === "string" ? row.codigoPublico.trim() : "";
  const nombre = typeof row.nombre === "string" ? row.nombre.trim() : "";
  const especie = row.especie === "Perro" || row.especie === "Gato" ? row.especie : null;
  const raza = typeof row.raza === "string" ? row.raza.trim() : "";
  const genero = row.genero === "Macho" || row.genero === "Hembra" ? row.genero : null;
  const talla =
    row.talla === "Pequeño" ||
    row.talla === "Mediano" ||
    row.talla === "Grande" ||
    row.talla === "Miniatura"
      ? row.talla
      : null;
  const fechaNacimiento =
    typeof row.fechaNacimiento === "string" ? row.fechaNacimiento.trim() : "";

  const edadMeses = typeof row.edadMeses === "number" && Number.isInteger(row.edadMeses) && row.edadMeses >= 0 ? row.edadMeses : undefined;

  if (!petId || !codigoPublico || !nombre || !especie || (edadMeses === undefined && !fechaNacimiento)) {
    return null;
  }

  return {
    entry: {
      petId,
      nombre,
      especie,
      raza,
      genero,
      talla,
      fotoUrl: "",
      codigoPublico,
      ...(edadMeses !== undefined ? { edadMeses } : { fechaNacimiento }),
      zona: typeof row.zona === "string" ? row.zona.trim() : "",
      verificado: row.verificado === true,
      shelterId:
        typeof row.shelterId === "string" && row.shelterId.trim() ? row.shelterId.trim() : null,
      shelterNombre:
        typeof row.shelterNombre === "string" && row.shelterNombre.trim()
          ? row.shelterNombre.trim()
          : null,
    },
    photoPath: typeof row.photoPath === "string" ? row.photoPath.trim() : "",
  };
}

async function signedPrimaryPhoto(
  client: AdoptionCatalogRpcClient,
  photoPath: string,
): Promise<string> {
  if (!photoPath || !client.storage) return "";
  try {
    const { data } = await client.storage.from("pawpass-fotos").createSignedUrl(photoPath, 300);
    return data?.signedUrl ?? "";
  } catch {
    return "";
  }
}

export function createSupabaseAdoptionCatalog(client: AdoptionCatalogRpcClient) {
  return {
    async listAdoptionCatalog(): Promise<AdoptionCatalogEntry[]> {
      const { data, error } = await client.rpc("listar_catalogo_publico", {
        p_limite: 100,
        p_offset: 0,
      });

      if (error) {
        throw new SupabaseAdoptionCatalogError(
          error.message ?? "No se pudo consultar el catálogo de adopción en Supabase.",
        );
      }

      const rows = unwrapRpcData(data);
      if (!Array.isArray(rows)) return [];
      const entries = rows.map(normalizeEntry).filter((row): row is NonNullable<typeof row> => row !== null);
      return Promise.all(
        entries.map(async ({ entry, photoPath }) => ({
          ...entry,
          fotoUrl: await signedPrimaryPhoto(client, photoPath),
        })),
      );
    },
  };
}
