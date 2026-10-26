export type PublicAdoptionRequest = {
  petId: string;
  name: string;
  phone: string;
  email: string;
  reason: string;
};

export type PublicAdoptionRequestErrors = Partial<
  Record<"petId" | "name" | "phone" | "email" | "reason" | "form", string>
>;

export type PublicAdoptionRequestValidation =
  | { valid: true; value: PublicAdoptionRequest }
  | { valid: false; blocked: true }
  | { valid: false; errors: PublicAdoptionRequestErrors };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function stringField(input: Record<string, unknown>, field: string): string {
  return typeof input[field] === "string" ? (input[field] as string).trim() : "";
}

export function validatePublicAdoptionRequest(input: unknown): PublicAdoptionRequestValidation {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { valid: false, errors: { form: "Revisa los datos e intenta de nuevo." } };
  }

  const raw = input as Record<string, unknown>;
  if (stringField(raw, "website")) return { valid: false, blocked: true };

  const petId = stringField(raw, "petId");
  const name = stringField(raw, "name").replace(/\s+/g, " ");
  const phone = stringField(raw, "phone").replace(/[\s()-]/g, "");
  const email = stringField(raw, "email").toLowerCase();
  const reason = stringField(raw, "reason");
  const errors: PublicAdoptionRequestErrors = {};
  const phoneDigits = phone.replace(/\D/g, "");

  if (!petId || petId.length > 120) errors.petId = "No se encontró la mascota.";
  if (!name) errors.name = "Indica tu nombre.";
  else if (name.length > 120) errors.name = "El nombre no puede superar 120 caracteres.";
  if (phoneDigits.length < 10 || phoneDigits.length > 15 || !/^\+?[0-9]+$/.test(phone)) {
    errors.phone = "Escribe un teléfono válido.";
  }
  if (email && (email.length > 254 || !EMAIL_PATTERN.test(email))) {
    errors.email = "Escribe un correo válido o déjalo vacío.";
  }
  if (!reason) errors.reason = "Cuéntanos brevemente por qué te interesa.";
  else if (reason.length > 2000) errors.reason = "El motivo no puede superar 2000 caracteres.";

  if (Object.keys(errors).length > 0) return { valid: false, errors };

  return {
    valid: true,
    value: { petId, name, phone, email, reason },
  };
}
