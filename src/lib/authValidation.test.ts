import { describe, expect, it } from "vitest";
import { validateAuthEmail, validateAuthInput, validateNewPassword } from "@/lib/authValidation";

describe("validateAuthInput", () => {
  it("requiere un correo y una contraseña válidos", () => {
    expect(validateAuthInput({ mode: "login", email: "", password: "" })).toEqual({
      email: "Escribe un correo válido.",
      password: "Escribe tu contraseña.",
    });
  });

  it("valida la confirmación al crear una cuenta", () => {
    expect(
      validateAuthInput({
        mode: "signup",
        email: "persona@example.com",
        password: "corta",
        confirmPassword: "distinta",
      }),
    ).toEqual({ password: "La contraseña debe tener al menos 8 caracteres.", confirmPassword: "Las contraseñas no coinciden." });
  });

  it("acepta un formulario completo de acceso", () => {
    expect(
      validateAuthInput({ mode: "login", email: " persona@example.com ", password: "segura123" }),
    ).toEqual({});
  });

  it("valida una nueva contraseña y su confirmación antes de guardarla", () => {
    expect(validateNewPassword("corta", "otra")).toEqual({ password: "La contraseña debe tener al menos 8 caracteres.", confirmPassword: "Las contraseñas no coinciden." });
    expect(validateNewPassword("segura123", "segura123")).toEqual({});
  });

  it("valida el correo sin exigir contraseña para solicitar un enlace", () => {
    expect(validateAuthEmail("persona@example.com")).toEqual({});
    expect(validateAuthEmail("no-es-correo")).toEqual({ email: "Escribe un correo válido." });
  });
});
