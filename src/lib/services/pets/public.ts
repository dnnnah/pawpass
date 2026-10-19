import { staticPublicPetDirectory } from "@/lib/infra/directory/staticPublicPets";
import type { PublicPetDirectory } from "@/lib/domain/directory/types";
import type { PublicPetCard } from "@/types/publicPet";

/**
 * Resolves the public card through an injected directory. The static adapter
 * remains the default so the portfolio demo works without credentials; the
 * route injects Supabase when the public environment is configured.
 */
export async function getPublicPetCard(
  publicCode: string,
  directory: PublicPetDirectory = staticPublicPetDirectory,
): Promise<PublicPetCard | null> {
  return directory.findPublicPet(publicCode);
}
