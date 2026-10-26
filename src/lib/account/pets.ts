import type { PetStatus } from "@/types/pet";

export type AccountPet = {
  id: string;
  publicCode: string;
  name: string;
  species: "perro" | "gato";
  status: PetStatus;
  slug: string | null;
  breed: string | null;
  photoUrl?: string | null;
  adoptionPublished?: boolean;
  role: string;
  startedAt: string;
};

/** Alertas primero; dentro de cada grupo se conserva el orden de registro. */
export function prioritizeAccountPets(pets: readonly AccountPet[]): AccountPet[] {
  return [...pets].sort((a, b) => Number(b.status === "perdido") - Number(a.status === "perdido"));
}

type AccountPetRow = {
  pet_id?: unknown;
  rol?: unknown;
  started_at?: unknown;
  pets?: unknown;
};

type AccountPetData = {
  id?: unknown;
  codigo_publico?: unknown;
  nombre?: unknown;
  especie?: unknown;
  estado?: unknown;
  slug?: unknown;
  raza?: unknown;
  adopcion_publicada?: unknown;
};

const petStatuses = new Set<PetStatus>([
  "en_casa",
  "perdido",
  "en_adopcion",
  "adoptado",
  "rescatado",
  "fallecido",
]);

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function asText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function resolvePet(value: unknown): AccountPetData | null {
  if (Array.isArray(value)) return asRecord(value[0]) as AccountPetData | null;
  return asRecord(value) as AccountPetData | null;
}

export function normalizeAccountPetRow(value: unknown): AccountPet | null {
  const row = asRecord(value) as AccountPetRow | null;
  const pet = resolvePet(row?.pets);
  const id = asText(pet?.id) ?? asText(row?.pet_id);
  const publicCode = asText(pet?.codigo_publico);
  const name = asText(pet?.nombre);
  const species = pet?.especie === "perro" || pet?.especie === "gato" ? pet.especie : null;
  const status = petStatuses.has(pet?.estado as PetStatus) ? (pet?.estado as PetStatus) : null;
  const startedAt = asText(row?.started_at);

  if (!id || !publicCode || !name || !species || !status || !startedAt) return null;

  return {
    id,
    publicCode,
    name,
    species,
    status,
    slug: asText(pet?.slug),
    breed: asText(pet?.raza),
    adoptionPublished: pet?.adopcion_publicada === true,
    role: asText(row?.rol) ?? "tutor",
    startedAt,
  };
}
