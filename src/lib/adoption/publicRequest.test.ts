import { describe, expect, it } from "vitest";
import { validatePublicAdoptionRequest } from "./publicRequest";

const VALID_REQUEST = {
  petId: "pet-123",
  name: "  Ana Pérez  ",
  phone: "55 1234 5678",
  email: " ana@example.com ",
  reason: "Tengo espacio y tiempo para cuidar a la mascota.",
  website: "",
};

describe("validatePublicAdoptionRequest", () => {
  it("normalizes the minimum fields for an anonymous application", () => {
    expect(validatePublicAdoptionRequest(VALID_REQUEST)).toEqual({
      valid: true,
      value: {
        petId: "pet-123",
        name: "Ana Pérez",
        phone: "5512345678",
        email: "ana@example.com",
        reason: "Tengo espacio y tiempo para cuidar a la mascota.",
      },
    });
  });

  it("allows an omitted email but requires name, phone, and reason", () => {
    const result = validatePublicAdoptionRequest({ ...VALID_REQUEST, email: "", name: "", phone: "", reason: "" });
    expect(result).toEqual({
      valid: false,
      errors: {
        name: "Indica tu nombre.",
        phone: "Escribe un teléfono válido.",
        reason: "Cuéntanos brevemente por qué te interesa.",
      },
    });
  });

  it("rejects malformed email and oversized free text", () => {
    const result = validatePublicAdoptionRequest({
      ...VALID_REQUEST,
      email: "no-es-correo",
      reason: "x".repeat(2001),
    });
    expect(result.valid).toBe(false);
    if (result.valid || !("errors" in result)) return;
    expect(result.errors).toEqual({
      email: "Escribe un correo válido o déjalo vacío.",
      reason: "El motivo no puede superar 2000 caracteres.",
    });
  });

  it("rejects a populated honeypot without returning a normal validation result", () => {
    expect(validatePublicAdoptionRequest({ ...VALID_REQUEST, website: "spam.example" })).toEqual({
      valid: false,
      blocked: true,
    });
  });

  it("rejects missing pet IDs and non-object input", () => {
    expect(validatePublicAdoptionRequest({ ...VALID_REQUEST, petId: " " })).toEqual({
      valid: false,
      errors: { petId: "No se encontró la mascota." },
    });
    expect(validatePublicAdoptionRequest(null)).toEqual({
      valid: false,
      errors: { form: "Revisa los datos e intenta de nuevo." },
    });
  });
});
