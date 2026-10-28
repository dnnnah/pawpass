import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import Loading from "./loading";

vi.mock("@/components/layout/AppShell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => createElement("main", null, children),
}));

describe("loading global de rutas", () => {
  it("muestra feedback accesible mientras una ruta dinámica carga sus datos", () => {
    const html = renderToStaticMarkup(Loading());

    expect(html).toContain('role="status"');
    expect(html).toContain("Cargando PawPass");
  });
});
