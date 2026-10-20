import { buildAdoptionCatalogEntry, filterAdoptablePets } from "@/lib/domain/adoption";
import { findShelterForPet } from "@/lib/domain/shelter";
import { hasSupabaseEnv } from "@/lib/infra/supabase/env";
import { createSupabaseAnonClient } from "@/lib/infra/supabase/anon";
import { createSupabaseAdoptionCatalog } from "./supabaseCatalog";
import { staticPetDirectory } from "./staticPets";
import { staticShelterDirectory } from "./staticShelters";
import type { AdoptionCatalogEntry } from "@/types/adoption";

async function listStaticCatalog(): Promise<AdoptionCatalogEntry[]> {
  const [pets, shelters] = await Promise.all([
    staticPetDirectory.listAdoptionPets(),
    staticShelterDirectory.listShelters(),
  ]);

  return filterAdoptablePets(pets).map((pet) =>
    buildAdoptionCatalogEntry(pet, findShelterForPet(pet.id, shelters)),
  );
}

/**
 * Selects the public catalog source once at the infrastructure boundary.
 * A database outage keeps the demo usable while the adapter remains replaceable.
 */
export async function listActiveAdoptionCatalog(): Promise<AdoptionCatalogEntry[]> {
  if (!hasSupabaseEnv()) return listStaticCatalog();

  try {
    return await createSupabaseAdoptionCatalog({
      rpc: (functionName, args) => createSupabaseAnonClient().rpc(functionName, args),
    }).listAdoptionCatalog();
  } catch {
    return listStaticCatalog();
  }
}
