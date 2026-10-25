import type { PetSpecies, PetStatus } from "@/types/pet";

export type PublicProfileCard = {
  publicCode: string;
  name: string;
  species: PetSpecies;
  breed: string | null;
  status: PetStatus;
  zone: string | null;
  photoUrl: string | null;
};

export type PublicProfile = PublicProfileCard & {
  birthDate: string | null;
  gender: string | null;
  size: string | null;
  color: string | null;
  sterilized: boolean | null;
  traits: string[];
  microchip: string | null;
  emergencyCareNote: string | null;
  contact: {
    name: string | null;
    phone: string | null;
    whatsapp: string | null;
    secondaryPhone: string | null;
    email: string | null;
    whatsappMessage: string | null;
  };
  health: {
    allergies: string[];
    conditions: string[];
    medications: string[];
    diet: string | null;
    behavior: string | null;
  } | null;
  vaccines: Array<{ name: string; applicationDate: string; nextDose: string | null }>;
  photos: Array<{ url: string }>;
  documents: Array<{ name: string; category: string; type: string; date: string | null; description: string | null; url: string }>;
};

export type PublicProfileDirectory = {
  listPublicProfiles(): Promise<PublicProfileCard[]>;
  findPublicProfile(publicCode: string): Promise<PublicProfile | null>;
};
