import type { PetProfile } from "@/types/pet";
import type { Shelter } from "@/types/shelter";

/**
 * Puertos de datos de directorio (FASE 9A).
 *
 * Describen QUÉ necesita la aplicación del catálogo de mascotas y refugios,
 * nunca de dónde vienen los datos. La implementación actual vive en
 * `src/lib/infra/directory/` (JSON estático); una futura implementación
 * Supabase/DB debe superar este mismo contrato sin tocar UI ni servicios.
 *
 * Convenciones (alineadas con `domain/shelter.ts`):
 * - Los identificadores se reciben trimmed y comparan contra `id` o
 *   `identificacion.codigoPublico` (alias estable de la URL canónica).
 * - "No existe" se representa SIEMPRE con `null`, nunca con `undefined`.
 * - Los datos inválidos se detectan al cargar la fuente (adapter), no aquí.
 *
 * Nota sobre `listProfilePets` / `listAdoptionPets`: hoy corresponden a dos
 * ficheros estáticos disjuntos (`mascotas.json` y `adopciones.mock.json`),
 * que es una limitación del prototipo. Con backend real ambas se
 * responderán desde la misma tabla filtrando por estado; ese es el momento
 * de simplificar el puerto, no antes.
 */
export type PetDirectory = {
  listProfilePets(): Promise<PetProfile[]>;
  listAdoptionPets(): Promise<PetProfile[]>;
  findProfilePet(identifier: string): Promise<PetProfile | null>;
  findAdoptionPet(identifier: string): Promise<PetProfile | null>;
};

export type ShelterDirectory = {
  listShelters(): Promise<Shelter[]>;
};
