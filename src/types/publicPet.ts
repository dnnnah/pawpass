import type { PetSpecies, PetStatus } from "./pet";

export type PublicPetCard = {
  publicCode: string;
  photoUrl: string | null;
  name: string;
  species: PetSpecies;
  breed: string | null;
  status: PetStatus;
  zone: string | null;
  emergencyCareNote: string | null;
  vaccinationStatus: "al_dia" | "pendiente" | "sin_informacion" | null;
  lost: {
    zona: string | null;
    fechaPerdida: string | null;
    mensaje: string | null;
    instrucciones: string[];
  } | null;
  contact: {
    name: string | null;
    phone: string | null;
    whatsapp: string | null;
    email: string | null;
  } | null;
  recentPhotos: { url: string }[];
};
