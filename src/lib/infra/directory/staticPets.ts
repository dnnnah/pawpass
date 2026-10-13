/**
 * Adapter de directorio de mascotas sobre datos estáticos (FASE 9A).
 *
 * Es la ÚNICA capa que conoce la existencia de `src/data/*.json`. Valida los
 * datos al cargar (fail-fast en desarrollo y build) y expone el puerto
 * `PetDirectory` para que servicios y UI no dependan de la fuente.
 *
 * Para migrar a Supabase: implementar `PetDirectory` en un nuevo módulo de
 * `src/lib/infra/directory/` y cambiar la instancia en `services/pets`.
 */

import adoptionPets from "@/data/adopciones.mock.json";
import profilePets from "@/data/mascotas.json";
import { assertValidPetProfiles } from "@/lib/dataValidation";
import type { PetDirectory } from "@/lib/domain/directory/types";
import type { PetProfile } from "@/types/pet";

assertValidPetProfiles(profilePets);
assertValidPetProfiles(adoptionPets);

const registeredPets: PetProfile[] = profilePets;
const adoptionDemoPets: PetProfile[] = adoptionPets;

function normalizeIdentifier(identifier: string): string {
  return identifier.trim();
}

function matchesIdentifier(pet: PetProfile, normalized: string): boolean {
  return pet.id === normalized || pet.identificacion.codigoPublico === normalized;
}

function findByIdentifier(pets: PetProfile[], identifier: string): PetProfile | null {
  const normalized = normalizeIdentifier(identifier);

  return pets.find((pet) => matchesIdentifier(pet, normalized)) ?? null;
}

export const staticPetDirectory: PetDirectory = {
  listProfilePets: async () => registeredPets,
  listAdoptionPets: async () => adoptionDemoPets,
  findProfilePet: async (identifier) => findByIdentifier(registeredPets, identifier),
  findAdoptionPet: async (identifier) => findByIdentifier(adoptionDemoPets, identifier),
};
