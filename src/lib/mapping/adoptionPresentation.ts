import { resolveAdoptionAvailability } from "@/lib/domain/adoption";
import { getPetAgeText } from "@/lib/dateFormat";
import { getPetStatusMeta, type PetStatusTone } from "@/lib/mapping/petStatusPresentation";
import type { AdoptionCatalogEntry } from "@/types/adoption";
import type { PetProfile } from "@/types/pet";

export type AdoptionCatalogCard = {
  petId: string;
  name: string;
  species: string;
  breed: string;
  gender: string;
  size: string;
  age: string;
  image: string;
  code: string;
  zone: string;
  verified: boolean;
  shelterId: string | null;
  shelterName: string | null;
  href: string;
};

export function buildCatalogCard(entry: AdoptionCatalogEntry): AdoptionCatalogCard {
  return {
    petId: entry.petId,
    name: entry.nombre,
    species: entry.especie,
    breed: entry.raza,
    gender: entry.genero,
    size: entry.talla,
    age: getPetAgeText(entry.fechaNacimiento),
    image: entry.fotoUrl,
    code: entry.codigoPublico,
    zone: entry.zona,
    verified: entry.verificado,
    shelterId: entry.shelterId,
    shelterName: entry.shelterNombre,
    href: `/adopciones/${entry.petId}`,
  };
}

export type ShelterPetCardPresentation = {
  petId: string;
  name: string;
  species: string;
  breed: string;
  image: string;
  code: string;
  statusLabel: string;
  statusTone: PetStatusTone;
  adoptable: boolean;
  profileHref: string;
  adoptionHref: string;
};

export function buildShelterPetCard(pet: PetProfile): ShelterPetCardPresentation {
  const availability = resolveAdoptionAvailability({
    estado: pet.estado,
    emergencia: pet.emergencia,
    alert: null,
  });
  const meta = getPetStatusMeta(availability.effectiveStatus);

  return {
    petId: pet.id,
    name: pet.mascota.nombre,
    species: pet.mascota.especie,
    breed: pet.mascota.raza,
    image: pet.mascota.fotoPerfilUrl,
    code: pet.identificacion.codigoPublico,
    statusLabel: meta.label,
    statusTone: meta.tone,
    adoptable: availability.available,
    profileHref: `/perfil/${pet.id}`,
    adoptionHref: `/adopciones/${pet.identificacion.codigoPublico}`,
  };
}

export function normalizeSocialUrl(url: string): string {
  const trimmed = url.trim();
  if (trimmed === "") {
    return "";
  }
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}
