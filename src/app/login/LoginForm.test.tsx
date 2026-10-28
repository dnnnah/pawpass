import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }) }));

import { LoginForm } from "./LoginForm";

describe("opciones de acceso por correo", () => {
  it("expone recuperación de contraseña y Magic Link en el acceso existente", () => {
    const html = renderToStaticMarkup(createElement(LoginForm, {
      oauthProviders: { google: true, apple: false },
    }));

    expect(html).toContain("Olvidé mi contraseña");
    expect(html).toContain("Enviar enlace de acceso sin contraseña");
    expect(html).toContain("Iniciar sesión");
    expect(html).toContain("Crear cuenta");
  });
});
