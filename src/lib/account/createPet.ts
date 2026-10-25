export type ContactMethod = "phone" | "whatsapp" | "email";

export type CreatePetInput = {
  name: string;
  species: string;
  birthDate: string;
  contactMethod: ContactMethod | "";
  contactValue: string;
  photo: File | null;
};

export type CreatePetErrors = {
  name?: string;
  species?: string;
  birthDate?: string;
  contactValue?: string;
  photo?: string;
};

export type CreatePetResult = {
  id: string | null;
  documentId: string | null;
  objectPath: string | null;
  publicCode: string | null;
  error: string | null;
};

type RpcClient = {
  rpc: (
    functionName: string,
    params: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message?: string } | null }>;
};

type PhotoStorage = {
  upload: (
    path: string,
    photo: File,
  ) => Promise<{ error: { message?: string } | null }>;
};

const GENERIC_CREATE_ERROR = "No pudimos registrar la mascota. Revisa los datos e intenta de nuevo.";
export const PHOTO_UPLOAD_ERROR = "La mascota quedó guardada, pero no pudimos subir la foto. Intenta subirla de nuevo.";
const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
const PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function normalizeContact(method: CreatePetInput["contactMethod"], value: string): string {
  const trimmed = value.trim();
  if (method === "phone" || method === "whatsapp") {
    return trimmed.replace(/[\s()-]/g, "");
  }
  return trimmed.toLowerCase();
}

export function validateCreatePetInput(input: CreatePetInput): CreatePetErrors {
  const errors: CreatePetErrors = {};
  const name = input.name.trim();

  if (!name) {
    errors.name = "Escribe el nombre de tu mascota.";
  } else if (name.length > 120) {
    errors.name = "El nombre no puede superar 120 caracteres.";
  }

  if (input.species !== "perro" && input.species !== "gato") {
    errors.species = "Selecciona perro o gato.";
  }

  if (!input.birthDate) {
    errors.birthDate = "Escribe la fecha de nacimiento.";
  } else if (!isIsoDate(input.birthDate)) {
    errors.birthDate = "Escribe una fecha válida.";
  } else if (input.birthDate > new Date().toISOString().slice(0, 10)) {
    errors.birthDate = "La fecha no puede estar en el futuro.";
  }

  const contact = normalizeContact(input.contactMethod, input.contactValue);
  if (input.contactMethod === "email") {
    if (contact.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) {
      errors.contactValue = "Escribe un correo válido.";
    }
  } else if (input.contactMethod === "phone" || input.contactMethod === "whatsapp") {
    const digits = contact.startsWith("+") ? contact.slice(1) : contact;
    if (!/^\+?\d{10,15}$/.test(contact) || digits.length < 10 || digits.length > 15) {
      errors.contactValue = "Escribe un teléfono válido con código de país o 10 a 15 dígitos.";
    }
  } else {
    errors.contactValue = "Elige cómo pueden contactarte.";
  }

  if (!input.photo || !PHOTO_TYPES.has(input.photo.type) || input.photo.size < 1 || input.photo.size > MAX_PHOTO_SIZE) {
    errors.photo = "La foto debe ser JPEG, PNG o WebP y pesar hasta 5 MiB.";
  }

  return errors;
}

function parseCreatePetResult(value: unknown): Omit<CreatePetResult, "error"> | null {
  if (typeof value !== "object" || value === null) return null;
  const result = value as Record<string, unknown>;
  if (
    typeof result.petId !== "string" ||
    typeof result.documentId !== "string" ||
    typeof result.objectPath !== "string" ||
    typeof result.publicCode !== "string"
  ) return null;

  return {
    id: result.petId,
    documentId: result.documentId,
    objectPath: result.objectPath,
    publicCode: result.publicCode,
  };
}

export async function createAccountPet(
  client: RpcClient,
  input: CreatePetInput,
): Promise<CreatePetResult> {
  if (Object.keys(validateCreatePetInput(input)).length > 0 || !input.photo) {
    return { id: null, documentId: null, objectPath: null, publicCode: null, error: GENERIC_CREATE_ERROR };
  }

  const contactValue = normalizeContact(input.contactMethod, input.contactValue);
  const { data, error } = await client.rpc("crear_mascota", {
    p_nombre: input.name.trim(),
    p_especie: input.species,
    p_nacimiento: input.birthDate,
    p_medio_contacto: input.contactMethod,
    p_valor_contacto: contactValue,
    p_foto_nombre: input.photo.name.slice(0, 200),
    p_foto_mime: input.photo.type,
    p_foto_tamano: input.photo.size,
  });

  const result = parseCreatePetResult(data);
  if (error || !result) {
    return { id: null, documentId: null, objectPath: null, publicCode: null, error: GENERIC_CREATE_ERROR };
  }

  return { ...result, error: null };
}

export async function uploadAccountPetPhoto(
  storage: PhotoStorage,
  result: Pick<CreatePetResult, "objectPath">,
  photo: File,
): Promise<string | null> {
  if (!result.objectPath) return GENERIC_CREATE_ERROR;
  const { error } = await storage.upload(result.objectPath, photo);
  return error ? PHOTO_UPLOAD_ERROR : null;
}

export function buildPetQrUrl(publicCode: string, origin: string): string {
  return new URL(`/p/${encodeURIComponent(publicCode)}`, origin).toString();
}
