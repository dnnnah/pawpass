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

export function validateAuthEmail(email: string): Pick<AuthErrors, "email"> {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? {} : { email: "Escribe un correo válido." };
}

export function validateAuthInput(input: AuthInput): AuthErrors {
  const errors: AuthErrors = { ...validateAuthEmail(input.email) };
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

export function validateNewPassword(password: string, confirmPassword: string): AuthErrors {
  const errors: AuthErrors = {};
  if (!password) errors.password = "Escribe tu nueva contraseña.";
  else if (password.length < 8) errors.password = "La contraseña debe tener al menos 8 caracteres.";
  if (password !== confirmPassword) errors.confirmPassword = "Las contraseñas no coinciden.";
  return errors;
}
