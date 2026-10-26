import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AccountSettingsForm } from "./AccountSettingsForm";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

describe("datos personales de la cuenta", () => {
  it("muestra el nombre y correo reales de acceso como controles editables", () => {
    const html = renderToStaticMarkup(createElement(AccountSettingsForm, {
      fullName: "Ana Rivera", email: "ana@example.com", userId: "user-1",
    }));
    expect(html).toContain('value="Ana Rivera"');
    expect(html).toContain('value="ana@example.com"');
    expect(html).toContain("Guardar nombre");
    expect(html).toContain("Actualizar correo de acceso");
  });
});
