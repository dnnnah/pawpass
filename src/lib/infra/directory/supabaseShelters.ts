import type { ShelterDirectory } from "@/lib/domain/directory/types";
import type { Shelter } from "@/types/shelter";

type SupabaseRpcError = { message?: string };
type ShelterRpcClient = {
  rpc(
    functionName: "listar_refugios_publicos",
    args: { p_limite: number; p_offset: number },
  ): PromiseLike<{ data: unknown; error: SupabaseRpcError | null }>;
};

type RawShelter = {
  id?: unknown;
  nombre?: unknown;
  descripcion?: unknown;
  ubicacion?: unknown;
  contacto?: unknown;
  redes?: unknown;
  logoUrl?: unknown;
  mascotas?: unknown;
  verificado?: unknown;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class SupabaseShelterDirectoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SupabaseShelterDirectoryError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function unwrap(data: unknown): unknown {
  return Array.isArray(data) && data.length === 1 && Array.isArray(data[0]) ? data[0] : data;
}

function normalizeShelter(value: unknown): Shelter | null {
  if (!isRecord(value)) return null;
  const row = value as RawShelter;
  const id = typeof row.id === "string" ? row.id.trim() : "";
  const nombre = typeof row.nombre === "string" ? row.nombre.trim() : "";
  if (!id || !nombre) return null;
  if (!isRecord(row.contacto)) return null;

  const rawEmail = row.contacto.email;
  const email = rawEmail === null || rawEmail === undefined ? null : typeof rawEmail === "string" ? rawEmail.trim() : "invalid";
  if (email && !EMAIL_PATTERN.test(email)) return null;

  const redes = Array.isArray(row.redes)
    ? row.redes.filter((item): item is string => typeof item === "string" && item.trim() !== "").map((item) => item.trim())
    : [];
  const mascotas = Array.isArray(row.mascotas)
    ? row.mascotas.filter((item): item is string => typeof item === "string" && item.trim() !== "").map((item) => item.trim())
    : [];

  return {
    id,
    nombre,
    descripcion: typeof row.descripcion === "string" ? row.descripcion.trim() : "",
    ubicacion: typeof row.ubicacion === "string" ? row.ubicacion.trim() : "",
    contacto: {
      nombreResponsable:
        typeof row.contacto.nombreResponsable === "string" ? row.contacto.nombreResponsable.trim() : "",
      telefono: typeof row.contacto.telefono === "string" ? row.contacto.telefono.trim() : "",
      whatsapp: typeof row.contacto.whatsapp === "string" ? row.contacto.whatsapp.trim() : "",
      email,
    },
    redes,
    logoUrl: typeof row.logoUrl === "string" && row.logoUrl.trim() ? row.logoUrl.trim() : null,
    mascotas,
    verificado: row.verificado === true,
  };
}

export function createSupabaseShelterDirectory(client: ShelterRpcClient): ShelterDirectory {
  return {
    async listShelters() {
      const { data, error } = await client.rpc("listar_refugios_publicos", {
        p_limite: 100,
        p_offset: 0,
      });
      if (error) {
        throw new SupabaseShelterDirectoryError(
          error.message ?? "No se pudo consultar el directorio público de refugios.",
        );
      }
      const rows = unwrap(data);
      if (!Array.isArray(rows)) return [];
      return rows.map(normalizeShelter).filter((shelter): shelter is Shelter => shelter !== null);
    },
  };
}
