export type PetIdentityInput = {
  name: string;
  species: string;
  birthDate: string;
  breed: string;
  gender: string;
  size: string;
  color: string;
  weightKg: string;
  sterilized: string;
  microchip: string;
  distinctiveTraits: string;
  identificationNotes: string;
};

export type PetHealthInput = {
  allergies: string;
  conditions: string;
  medications: string;
  specialDiet: string;
  behavior: string;
  emergencyCareNote: string;
};

export type PetVaccineInput = {
  name: string;
  applicationDate: string;
  nextDose: string;
  batch: string;
  documentId: string;
};

export type PetDewormingInput = {
  product: string;
  date: string;
  nextDate: string;
  dose: string;
  veterinarian: string;
  origin: string;
  documentId: string;
};

export type PetConsultationInput = {
  date: string;
  reason: string;
  diagnosis: string;
  treatment: string;
  medications: string;
  veterinarian: string;
  origin: string;
  documentIds: string[];
};

export type PetIdentityErrors = Partial<Record<keyof PetIdentityInput, string>>;
export type PetHealthErrors = Partial<Record<keyof PetHealthInput, string>>;
export type PetVaccineErrors = Partial<Record<keyof PetVaccineInput, string>>;
export type PetDewormingErrors = Partial<Record<keyof PetDewormingInput, string>>;
export type PetConsultationErrors = Partial<Record<keyof PetConsultationInput, string>>;

const PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const DOCUMENT_TYPES = new Set([...PHOTO_TYPES, "application/pdf"]);
const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;

function validIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function trimmed(value: string): string {
  return value.trim();
}

export function normalizePetList(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map(trimmed)
    .filter(Boolean);
}

export function validatePetIdentity(input: PetIdentityInput, today: string): PetIdentityErrors {
  const errors: PetIdentityErrors = {};
  const name = trimmed(input.name);
  if (!name || name.length > 120) errors.name = "El nombre es obligatorio y no puede superar 120 caracteres.";
  if (input.species !== "perro" && input.species !== "gato") errors.species = "Selecciona perro o gato.";
  if (!validIsoDate(input.birthDate)) errors.birthDate = "Escribe una fecha de nacimiento válida.";
  else if (input.birthDate > today) errors.birthDate = "La fecha no puede estar en el futuro.";

  if (trimmed(input.breed).length > 120) errors.breed = "La raza no puede superar 120 caracteres.";
  if (input.gender && input.gender !== "macho" && input.gender !== "hembra") errors.gender = "Selecciona una opción válida.";
  if (input.size && !["miniatura", "pequeno", "mediano", "grande"].includes(input.size)) errors.size = "Selecciona una opción válida.";
  if (trimmed(input.color).length > 120) errors.color = "El color no puede superar 120 caracteres.";

  if (trimmed(input.weightKg)) {
    const weight = Number(input.weightKg);
    if (!Number.isFinite(weight) || weight <= 0 || weight > 500) errors.weightKg = "El peso debe ser mayor que 0 y no superar 500 kg.";
  }

  if (input.sterilized && input.sterilized !== "true" && input.sterilized !== "false") {
    errors.sterilized = "Selecciona una opción válida.";
  }
  if (trimmed(input.microchip).length > 50) errors.microchip = "El microchip no puede superar 50 caracteres.";
  const traits = normalizePetList(input.distinctiveTraits);
  if (traits.length > 30 || new TextEncoder().encode(JSON.stringify(traits)).length > 8000) {
    errors.distinctiveTraits = "Reduce la cantidad o longitud de los rasgos distintivos.";
  }
  if (trimmed(input.identificationNotes).length > 2000) {
    errors.identificationNotes = "Las notas no pueden superar 2,000 caracteres.";
  }

  return errors;
}

export function validatePetHealth(input: PetHealthInput): PetHealthErrors {
  const errors: PetHealthErrors = {};
  const lists: Array<[keyof PetHealthInput, string]> = [
    ["allergies", input.allergies],
    ["conditions", input.conditions],
    ["medications", input.medications],
  ];

  for (const [field, value] of lists) {
    const items = normalizePetList(value);
    if (items.length > 100 || new TextEncoder().encode(JSON.stringify(items)).length > 12000) {
      errors[field] = "Reduce la cantidad o longitud de los elementos.";
    }
  }

  const textFields: Array<[keyof PetHealthInput, string]> = [
    ["specialDiet", input.specialDiet],
    ["behavior", input.behavior],
    ["emergencyCareNote", input.emergencyCareNote],
  ];
  for (const [field, value] of textFields) {
    if (trimmed(value).length > 2000) errors[field] = "El texto no puede superar 2,000 caracteres.";
  }

  return errors;
}

export function validatePetVaccine(input: PetVaccineInput, today: string): PetVaccineErrors {
  const errors: PetVaccineErrors = {};
  const name = trimmed(input.name);
  if (!name || name.length > 200) errors.name = "Escribe el nombre de la vacuna (máximo 200 caracteres).";

  if (!validIsoDate(input.applicationDate)) errors.applicationDate = "Escribe una fecha de aplicación válida.";
  else if (input.applicationDate > today) errors.applicationDate = "La fecha de aplicación no puede estar en el futuro.";

  if (input.nextDose) {
    if (!validIsoDate(input.nextDose)) errors.nextDose = "Escribe una fecha válida para la próxima dosis.";
    else if (validIsoDate(input.applicationDate) && input.nextDose < input.applicationDate) {
      errors.nextDose = "La próxima dosis no puede ser anterior a la aplicación.";
    }
  }

  if (trimmed(input.batch).length > 120) errors.batch = "El lote no puede superar 120 caracteres.";
  return errors;
}

export function validatePetDeworming(input: PetDewormingInput, today: string): PetDewormingErrors {
  const errors: PetDewormingErrors = {};
  const product = trimmed(input.product);
  if (!product || product.length > 200) errors.product = "Escribe el producto (máximo 200 caracteres).";
  if (!validIsoDate(input.date)) errors.date = "Escribe una fecha de aplicación válida.";
  else if (input.date > today) errors.date = "La fecha de aplicación no puede estar en el futuro.";
  if (input.nextDate) {
    if (!validIsoDate(input.nextDate)) errors.nextDate = "Escribe una fecha válida para la próxima aplicación.";
    else if (validIsoDate(input.date) && input.nextDate < input.date) errors.nextDate = "La próxima aplicación no puede ser anterior a la fecha registrada.";
  }
  if (trimmed(input.dose).length > 200) errors.dose = "La dosis no puede superar 200 caracteres.";
  if (trimmed(input.veterinarian).length > 200) errors.veterinarian = "El nombre no puede superar 200 caracteres.";
  if (trimmed(input.origin).length > 120) errors.origin = "El origen no puede superar 120 caracteres.";
  return errors;
}

export function validatePetConsultation(input: PetConsultationInput, today: string): PetConsultationErrors {
  const errors: PetConsultationErrors = {};
  if (!validIsoDate(input.date)) errors.date = "Escribe una fecha de consulta válida.";
  else if (input.date > today) errors.date = "La fecha de consulta no puede estar en el futuro.";
  const reason = trimmed(input.reason);
  if (!reason || reason.length > 2000) errors.reason = "Escribe el motivo (máximo 2,000 caracteres).";
  if (trimmed(input.diagnosis).length > 8000) errors.diagnosis = "El diagnóstico no puede superar 8,000 caracteres.";
  if (trimmed(input.treatment).length > 8000) errors.treatment = "El tratamiento no puede superar 8,000 caracteres.";
  if (trimmed(input.veterinarian).length > 200) errors.veterinarian = "El nombre no puede superar 200 caracteres.";
  if (trimmed(input.origin).length > 120) errors.origin = "El origen no puede superar 120 caracteres.";
  const medications = normalizePetList(input.medications);
  if (medications.length > 100 || new TextEncoder().encode(JSON.stringify(medications)).length > 12000) {
    errors.medications = "Reduce la cantidad o longitud de los medicamentos.";
  }
  if (input.documentIds.length > 30 || new Set(input.documentIds).size !== input.documentIds.length) {
    errors.documentIds = "Revisa los documentos seleccionados.";
  }
  return errors;
}

export function validatePetFile(
  file: { type: string; size: number },
  kind: "foto" | "documento",
): string | null {
  const allowedTypes = kind === "foto" ? PHOTO_TYPES : DOCUMENT_TYPES;
  const maxSize = kind === "foto" ? MAX_PHOTO_SIZE : MAX_DOCUMENT_SIZE;
  if (!allowedTypes.has(file.type)) {
    return kind === "foto"
      ? "La foto debe ser JPEG, PNG o WebP."
      : "El archivo debe ser PDF, JPEG, PNG o WebP.";
  }
  if (!Number.isSafeInteger(file.size) || file.size < 1 || file.size > maxSize) {
    return kind === "foto" ? "La foto no puede superar 5 MiB." : "El documento no puede superar 10 MiB.";
  }
  return null;
}
