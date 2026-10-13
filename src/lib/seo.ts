import type { Metadata } from "next";
import { getPublicProfileUrl } from "@/lib/publicProfileUrl";
import type { PetProfile } from "@/types/pet";

export function getPetProfileSeoTitle(pet: PetProfile): string {
  return pet.emergencia.perdido
    ? `${pet.mascota.nombre} está perdido | PawPass`
    : `${pet.mascota.nombre} | PawPass`;
}

export function getPetProfileSeoDescription(pet: PetProfile): string {
  const base = `Perfil público de ${pet.mascota.nombre}, ${pet.mascota.raza} · ${pet.mascota.especie}.`;
  return pet.emergencia.perdido ? `${base} Esta mascota está en modo perdido.` : base;
}

export function buildPetProfileMetadata(pet: PetProfile): Metadata {
  const title = getPetProfileSeoTitle(pet);
  const description = getPetProfileSeoDescription(pet);
  const publicProfileUrl = getPublicProfileUrl(pet);
  const photo = pet.mascota.fotoPerfilUrl?.trim();

  const ogImage = photo
    ? [{ url: photo, alt: pet.mascota.nombre }]
    : undefined;

  return {
    title,
    description,
    alternates: {
      canonical: publicProfileUrl ?? undefined,
    },
    openGraph: {
      title,
      description,
      url: publicProfileUrl ?? undefined,
      type: "website",
      siteName: "PawPass",
      locale: "es_MX",
      images: ogImage,
    },
    twitter: {
      card: photo ? "summary_large_image" : "summary",
      title,
      description,
      images: ogImage,
    },
  };
}