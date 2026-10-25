import type { PetSpecies, PetStatus } from "@/types/pet";
import type { PublicProfile, PublicProfileCard } from "@/types/publicProfile";

const speciesValues: readonly PetSpecies[] = ["Perro", "Gato"];
const statusValues: readonly PetStatus[] = ["en_casa", "perdido", "en_adopcion", "adoptado", "rescatado", "fallecido"];

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
