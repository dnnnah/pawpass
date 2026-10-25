import type { PetSpecies, PetStatus } from "@/types/pet";
import type { PetProfile } from "@/types/pet";
import type { PublicPetCard } from "@/types/publicPet";

const PET_SPECIES: readonly PetSpecies[] = ["Perro", "Gato"];
const PET_STATUSES: readonly PetStatus[] = [
  "en_casa",
  "perdido",
  "en_adopcion",
  "adoptado",
  "rescatado",
  "fallecido",
];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export type PublicPetPayload = {
  publicCode: string;
  photoUrl?: string | null;
  name: string;
  species: PetSpecies;
  breed?: string | null;
  status: PetStatus;
  contactMethod?: "phone" | "whatsapp" | "email" | null;
  zone?: string | null;
  emergencyCareNote?: string | null;
  vaccinationStatus?: "al_dia" | "pendiente" | "sin_informacion" | null;
  privacy?: {
    mostrarNombreContacto?: boolean;
    mostrarTelefono?: boolean;
    mostrarWhatsapp?: boolean;
    mostrarZona?: boolean;
    mostrarEmergencia?: boolean;
  };
  lost?: {
    zona?: string | null;
    fechaPerdida?: string | null;
    mensaje?: string | null;
    instrucciones?: string[] | null;
  } | null;
  contact?: {
    name?: string | null;
    phone?: string | null;
    whatsapp?: string | null;
    email?: string | null;
  } | null;
  recentPhotos?: Array<{ url?: string | null }> | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nullableText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text === "" ? null : text;
}

function nullableDate(value: unknown): string | null {
  const text = nullableText(value);
  return text !== null && ISO_DATE.test(text) ? text : null;
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean);
}

function isPetSpecies(value: unknown): value is PetSpecies {
  return typeof value === "string" && (PET_SPECIES as readonly string[]).includes(value);
}

function isPetStatus(value: unknown): value is PetStatus {
  return typeof value === "string" && (PET_STATUSES as readonly string[]).includes(value);
}

function mapPrivacy(raw: unknown) {
  const privacy = isRecord(raw) ? raw : {};
  return {
    mostrarNombreContacto: privacy.mostrarNombreContacto === true,
    mostrarTelefono: privacy.mostrarTelefono === true,
    mostrarWhatsapp: privacy.mostrarWhatsapp === true,
    mostrarZona: privacy.mostrarZona === true,
    mostrarEmergencia: privacy.mostrarEmergencia === true,
  };
}

/**
 * Normaliza y vuelve a aplicar las reglas de exposición de la ficha QR.
 * El mapper no confía en campos privados que lleguen mezclados en el payload.
 */
export function toPublicPetCard(raw: unknown): PublicPetCard | null {
  if (!isRecord(raw)) return null;

  const publicCode = nullableText(raw.publicCode);
  const name = nullableText(raw.name);
  const species = raw.species;
  const status = raw.status;

  if (!publicCode || !name || !isPetSpecies(species) || !isPetStatus(status)) {
    return null;
  }

  const privacy = mapPrivacy(raw.privacy);
  const lostRaw = isRecord(raw.lost) ? raw.lost : null;
  const isLost = status === "perdido" && lostRaw !== null;
  const lost = isLost
    ? {
        zona: nullableText(lostRaw.zona),
        fechaPerdida: nullableDate(lostRaw.fechaPerdida),
        mensaje: nullableText(lostRaw.mensaje),
        instrucciones: stringList(lostRaw.instrucciones),
      }
    : null;

  const contactRaw = isRecord(raw.contact) ? raw.contact : {};
  const contactMethod = raw.contactMethod;
  const contactValue = contactMethod === "phone"
    ? nullableText(contactRaw.phone)
    : contactMethod === "whatsapp"
      ? nullableText(contactRaw.whatsapp)
      : contactMethod === "email"
        ? nullableText(contactRaw.email)
        : null;
  const contact = contactValue
    ? {
        name: privacy.mostrarNombreContacto ? nullableText(contactRaw.name) : null,
        phone: contactMethod === "phone" ? contactValue : null,
        whatsapp: contactMethod === "whatsapp" ? contactValue : null,
        email: contactMethod === "email" ? contactValue : null,
      }
    : null;

  const recentPhotos = Array.isArray(raw.recentPhotos)
    ? raw.recentPhotos
        .map((photo) => (isRecord(photo) ? nullableText(photo.url) : null))
        .filter((url): url is string => url !== null)
        .slice(0, 6)
        .map((url) => ({ url }))
    : [];

  return {
    publicCode,
    photoUrl: nullableText(raw.photoUrl),
    name,
    species,
    breed: nullableText(raw.breed),
    status,
    zone: nullableText(raw.zone),
    emergencyCareNote: nullableText(raw.emergencyCareNote),
    vaccinationStatus: isLost && ["al_dia", "pendiente", "sin_informacion"].includes(String(raw.vaccinationStatus))
      ? raw.vaccinationStatus as PublicPetCard["vaccinationStatus"]
      : null,
    lost,
    contact,
    recentPhotos,
  };
}

/** Adapter de compatibilidad para la demo estática mientras Supabase no está configurado. */
export function toStaticPublicPetCard(pet: PetProfile): PublicPetCard {
  const isLost = pet.estado === "perdido" || pet.emergencia.perdido;
  const contact = pet.contacto.telefonoPrincipal
    ? { phone: pet.contacto.telefonoPrincipal }
    : pet.contacto.whatsapp
      ? { whatsapp: pet.contacto.whatsapp }
      : pet.contacto.email
        ? { email: pet.contacto.email }
        : null;
  const recentPhotos = pet.documentos
    .filter((document) => document.categoria === "foto" && document.visiblePublico)
    .slice(0, 6)
    .map((document) => ({ url: document.url }));

  return {
    publicCode: pet.identificacion.codigoPublico,
    photoUrl: pet.mascota.fotoPerfilUrl || null,
    name: pet.mascota.nombre,
    species: pet.mascota.especie,
    breed: pet.mascota.raza || null,
    status: pet.estado,
    zone: isLost ? pet.emergencia.zonaPerdida || null : pet.contacto.zonaSegura || pet.contacto.zonaHabitual || null,
    emergencyCareNote: null,
    vaccinationStatus: isLost ? "sin_informacion" : null,
    lost: isLost
      ? {
          zona: pet.emergencia.zonaPerdida || null,
          fechaPerdida: pet.emergencia.fechaPerdida || null,
          mensaje: pet.emergencia.mensajeEmergencia || null,
          instrucciones: pet.emergencia.instrucciones,
        }
      : null,
    contact: contact ? { name: pet.contacto.nombrePublico || null, phone: contact.phone ?? null, whatsapp: contact.whatsapp ?? null, email: contact.email ?? null } : null,
    recentPhotos,
  };
}
