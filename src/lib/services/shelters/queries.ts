/**
 * API de consulta de refugios (FASE 9A).
 *
 * Contrapartida de `services/pets/queries.ts` para el catálogo de refugios.
 * Sin dependencias de React, Next.js ni del sistema de archivos.
 */

import type { ShelterDirectory } from "@/lib/domain/directory/types";
import { staticShelterDirectory } from "@/lib/infra/directory/staticShelters";
import { createSupabaseShelterDirectory } from "@/lib/infra/directory/supabaseShelters";
import { hasSupabaseEnv } from "@/lib/infra/supabase/env";
import { createSupabaseAnonClient } from "@/lib/infra/supabase/anon";
import type { Shelter } from "@/types/shelter";

/** Refugios públicos reales; JSON solo en instalaciones sin Supabase. */
export async function getShelters(): Promise<Shelter[]> {
  if (!hasSupabaseEnv()) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("El directorio de refugios necesita Supabase configurado.");
    }
    return staticShelterDirectory.listShelters();
  }
  const client = createSupabaseAnonClient();
  const directory: ShelterDirectory = createSupabaseShelterDirectory({
    rpc: (functionName, args) => client.rpc(functionName, args),
  });
  return directory.listShelters();
}

/** Compatibilidad de nombre para los consumers del prototipo. */
export const getMockShelters = getShelters;
