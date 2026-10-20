import type { AdoptionCatalogEntry } from "@/types/adoption";
import { listActiveAdoptionCatalog } from "@/lib/infra/directory/activeAdoptionCatalog";

/** Catálogo público de adopción con Supabase y fallback de demo. */
export async function getAdoptionCatalogEntries(): Promise<AdoptionCatalogEntry[]> {
  return listActiveAdoptionCatalog();
}
