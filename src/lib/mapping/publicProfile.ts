import type { PetSpecies, PetStatus } from "@/types/pet";
import type { PublicProfile, PublicProfileCard } from "@/types/publicProfile";
import type { PhysicalPetCard, PhysicalPetCardFormato } from "@/types/carnet";
import { getPublicProfileUrl } from "@/lib/publicProfileUrl";
import { toE164Digits } from "@/lib/phone";
import { todayIsoDate } from "@/lib/domain/dateRules";

const speciesValues: readonly PetSpecies[] = ["Perro", "Gato"];
const statusValues: readonly PetStatus[] = ["en_casa", "perdido", "en_adopcion", "adoptado", "rescatado", "fallecido"];
const printOrientations: Record<PhysicalPetCardFormato, "vertical" | "horizontal"> = {
  tarjeta_imprimible: "vertical",
  credencial: "horizontal",
  placa_dije: "vertical",
};

function record(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
function text(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}
function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean) : [];
}
function nullableBool(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

export function toPublicProfileCard(raw: unknown): PublicProfileCard | null {
  const row = record(raw);
  const publicCode = text(row.publicCode);
  const name = text(row.name);
  const species = row.species;
  const status = row.status;
  if (!publicCode || !name || !speciesValues.includes(species as PetSpecies) || !statusValues.includes(status as PetStatus)) return null;
  return {
    publicCode,
    name,
    species: species as PetSpecies,
    status: status as PetStatus,
    breed: text(row.breed),
    zone: text(row.zone),
    photoUrl: text(row.photoUrl),
  };
}

/** Applies a second allowlist at the application boundary; unknown SQL fields never reach the page. */
export function toPublicProfile(raw: unknown): PublicProfile | null {
  const row = record(raw);
  const card = toPublicProfileCard(row);
  if (!card) return null;

  const contact = record(row.contact);
  const healthRaw = row.health === null ? null : record(row.health);
  const health = healthRaw ? {
    allergies: strings(healthRaw.allergies),
    conditions: strings(healthRaw.conditions),
    medications: strings(healthRaw.medications),
    diet: text(healthRaw.diet),
    behavior: text(healthRaw.behavior),
  } : null;
  const vaccines = Array.isArray(row.vaccines) ? row.vaccines.flatMap((item) => {
    const vaccine = record(item);
    const name = text(vaccine.name);
    const applicationDate = text(vaccine.applicationDate);
    return vaccine.visible === true && name && applicationDate
      ? [{ name, applicationDate, nextDose: text(vaccine.nextDose) }]
      : [];
  }).slice(0, 100) : [];
  const photos = Array.isArray(row.photos) ? row.photos.flatMap((item) => {
    const photo = record(item);
    const url = text(photo.url);
    return photo.visible === true && url ? [{ url }] : [];
  }).slice(0, 12) : [];
  const documents = Array.isArray(row.documents) ? row.documents.flatMap((item) => {
    const document = record(item);
    const name = text(document.name);
    const url = text(document.url);
    if (document.visible !== true || !name || !url || document.category === "foto") return [];
    return [{
      name,
      category: text(document.category) ?? "otro",
      type: text(document.type) ?? "archivo",
      date: text(document.date),
      description: text(document.description),
      url,
    }];
  }).slice(0, 100) : [];

  return {
    ...card,
    birthDate: text(row.birthDate),
    gender: text(row.gender),
    size: text(row.size),
    color: text(row.color),
    sterilized: nullableBool(row.sterilized),
    traits: strings(row.traits).slice(0, 20),
    microchip: text(row.microchip),
    emergencyCareNote: text(row.emergencyCareNote),
    contact: {
      name: text(contact.name),
      phone: text(contact.phone),
      whatsapp: text(contact.whatsapp),
      secondaryPhone: text(contact.secondaryPhone),
      email: text(contact.email),
      whatsappMessage: text(contact.whatsappMessage),
    },
    health,
    vaccines,
    photos,
    documents,
  };
}

/** Builds the printable card exclusively from fields already allowlisted for the public profile. */
export function toPublicPhysicalPetCard(
  profile: PublicProfile,
  formato: PhysicalPetCardFormato = "tarjeta_imprimible",
  today?: string,
): PhysicalPetCard {
  const qrUrl = getPublicProfileUrl(profile.publicCode);
  const whatsappUrl = profile.contact.whatsapp
    ? `https://wa.me/${toE164Digits(profile.contact.whatsapp)}`
    : null;

  return {
    mascota: {
      nombre: profile.name,
      especie: profile.species,
      raza: profile.breed,
      fotoUrl: profile.photoUrl,
      genero: profile.gender,
      talla: profile.size,
      color: profile.color,
      pesoKg: null,
      fechaNacimiento: profile.birthDate,
      rasgosDistintivos: profile.traits,
      esterilizado: profile.sterilized === true,
      verificado: false,
    },
    identificacion: { codigoPublico: profile.publicCode, microchip: profile.microchip },
    qr: { url: qrUrl, disponible: Boolean(qrUrl) },
    estado: {
      status: profile.status,
      esTerminal: profile.status === "adoptado" || profile.status === "fallecido",
      perdido: profile.status === "perdido",
    },
    contacto: {
      nombrePublico: profile.contact.name,
      telefono: profile.contact.phone,
      telefonoSecundario: profile.contact.secondaryPhone,
      email: profile.contact.email,
      whatsapp: profile.contact.whatsapp,
      whatsappUrl,
      zonaSegura: profile.zone,
      zonaHabitual: null,
    },
    emergencia: {
      activo: profile.status === "perdido",
      zonaPerdida: null,
      fechaPerdida: null,
      mensaje: profile.emergencyCareNote,
      recompensa: null,
      instrucciones: [],
    },
    salud: {
      alergias: profile.health?.allergies ?? [],
      condicionesMedicas: profile.health?.conditions ?? [],
      medicamentosActuales: profile.health?.medications ?? [],
      vacunas: profile.vaccines.map((vaccine) => ({ nombre: vaccine.name, estatus: null })),
      desparasitaciones: [],
      historialMedico: [],
      veterinario: null,
    },
    print: { formato, orientacion: printOrientations[formato], qrMinimoMm: 25 },
    generadoEn: todayIsoDate(today),
  };
}
