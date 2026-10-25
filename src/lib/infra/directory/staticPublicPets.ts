import profilePets from "@/data/mascotas.json";
import adoptionPets from "@/data/adopciones.mock.json";
import type { PublicPetDirectory } from "@/lib/domain/directory/types";
import { toStaticPublicPetCard } from "@/lib/mapping/publicPet";
import type { PetProfile } from "@/types/pet";

// JSON imports widen enum-like fields to `string`; runtime validation belongs
// to the adapter boundary, while the demo data is maintained as PetProfile.
const pets = [...profilePets, ...adoptionPets] as unknown as PetProfile[];

export const staticPublicPetDirectory: PublicPetDirectory = {
  findPublicPet: async (publicCode) => {
    const normalized = publicCode.trim();
    const pet = pets.find((candidate) => candidate.identificacion.codigoPublico === normalized);
    return pet ? toStaticPublicPetCard(pet) : null;
  },
  listLostPets: async () => pets
    .filter((pet) => pet.estado === "perdido" || pet.emergencia.perdido)
    .map(toStaticPublicPetCard),
};
