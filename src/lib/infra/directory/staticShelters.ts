/**
 * Adapter de directorio de refugios sobre datos estáticos (FASE 9A).
 *
 * Contrapartida de `staticPets.ts` para el catálogo de refugios. Valida al
 * cargar y expone el puerto `ShelterDirectory`.
 */

import shelters from "@/data/shelters.mock.json";
import { assertValidShelters } from "@/lib/shelterValidation";
import type { ShelterDirectory } from "@/lib/domain/directory/types";
import type { Shelter } from "@/types/shelter";

assertValidShelters(shelters);

const shelterList: Shelter[] = shelters;

export const staticShelterDirectory: ShelterDirectory = {
  listShelters: async () => shelterList,
};
