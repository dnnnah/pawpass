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
 * Fixtures are limited to local development and tests, never production.
 */
export async function listActiveAdoptionCatalog(): Promise<AdoptionCatalogEntry[]> {
  if (!hasSupabaseEnv()) {
    if (process.env.NODE_ENV === "production") {
      throw new SupabaseAdoptionCatalogConfigurationError("El catálogo de adopción necesita Supabase configurado.");
    }
    return listStaticCatalog();
  }

  const client = createSupabaseAnonClient();
  return createSupabaseAdoptionCatalog({
    rpc: (functionName, args) => client.rpc(functionName, args),
    storage: client.storage,
  }).listAdoptionCatalog();
}

export class SupabaseAdoptionCatalogConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SupabaseAdoptionCatalogConfigurationError";
  }
}
