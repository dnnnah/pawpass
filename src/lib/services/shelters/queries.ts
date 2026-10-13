/**
 * API de consulta de refugios (FASE 9A).
 *
 * Contrapartida de `services/pets/queries.ts` para el catálogo de refugios.
 * Sin dependencias de React, Next.js ni del sistema de archivos.
 */

import type { ShelterDirectory } from "@/lib/domain/directory/types";
import { staticShelterDirectory } from "@/lib/infra/directory/staticShelters";
import type { Shelter } from "@/types/shelter";

/**
 * Fuente activa del catálogo de refugios. Sustituir aquí es el único punto de
 * cambio necesario para migrar a Supabase.
 */
const directory: ShelterDirectory = staticShelterDirectory;

/** Refugios disponibles en la fuente de datos. */
export async function getMockShelters(): Promise<Shelter[]> {
  return directory.listShelters();
}
