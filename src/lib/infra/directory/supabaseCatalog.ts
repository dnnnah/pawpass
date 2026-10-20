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
  fotoUrl?: unknown;
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

function normalizeEntry(value: unknown): AdoptionCatalogEntry | null {
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

  if (!petId || !codigoPublico || !nombre || !especie || !genero || !talla || !fechaNacimiento) {
    return null;
  }

  return {
    petId,
    nombre,
    especie,
    raza,
    genero,
    talla,
    fotoUrl: typeof row.fotoUrl === "string" ? row.fotoUrl.trim() : "",
    codigoPublico,
    fechaNacimiento,
    zona: typeof row.zona === "string" ? row.zona.trim() : "",
    verificado: row.verificado === true,
    shelterId:
      typeof row.shelterId === "string" && row.shelterId.trim() ? row.shelterId.trim() : null,
    shelterNombre:
      typeof row.shelterNombre === "string" && row.shelterNombre.trim()
        ? row.shelterNombre.trim()
        : null,
  };
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
      return Array.isArray(rows)
        ? rows.map(normalizeEntry).filter((entry): entry is AdoptionCatalogEntry => entry !== null)
        : [];
    },
  };
}
