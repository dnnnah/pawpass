export type AuthMode = "login" | "signup";

export type AuthInput = {
  mode: AuthMode;
  email: string;
  password: string;
  confirmPassword?: string;
};

export type AuthErrors = {
  email?: string;
  password?: string;
  confirmPassword?: string;
};

export function validateAuthInput(input: AuthInput): AuthErrors {
  const errors: AuthErrors = {};
  const email = input.email.trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Escribe un correo válido.";
  }

  if (!input.password) {
    errors.password = "Escribe tu contraseña.";
  } else if (input.password.length < 8) {
    errors.password = "La contraseña debe tener al menos 8 caracteres.";
  }

  if (input.mode === "signup" && input.password !== input.confirmPassword) {
    errors.confirmPassword = "Las contraseñas no coinciden.";
  }

  return errors;
}
