import type { PublicPetCard } from "@/types/publicPet";
import { prioritizeAccountPets, type AccountPet } from "./pets";

export function splitLostPetLists(ownedPets: readonly AccountPet[], publicPets: readonly PublicPetCard[]) {
  const owned = prioritizeAccountPets(ownedPets.filter((pet) => pet.status === "perdido"));
  const ownedCodes = new Set(owned.map((pet) => pet.publicCode));
  const seen = new Set(ownedCodes);
  const community = publicPets.filter((pet) => {
    if (pet.status !== "perdido" || seen.has(pet.publicCode)) return false;
    seen.add(pet.publicCode);
    return true;
  });
  return { owned, community };
}
