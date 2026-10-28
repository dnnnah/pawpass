import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }) }));

import { PasswordResetForm } from "./PasswordResetForm";

describe("estado de un enlace de recuperación vencido", () => {
  it("explica qué ocurrió y ofrece volver a pedir el enlace", () => {
    const html = renderToStaticMarkup(createElement(PasswordResetForm, {
      nextPath: "/mis-mascotas",
      expired: true,
    }));

    expect(html).toContain("venció o ya se utilizó");
    expect(html).toContain("solicitar otro enlace");
    expect(html).not.toContain("Guardar nueva contraseña");
  });
});
