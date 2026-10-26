import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import Home from "./page";

vi.mock("@/components/layout/AppShell", () => ({ AppShell: ({ children }: { children: React.ReactNode }) => createElement("main", null, children) }));

describe("home de PawPass", () => {
  it("muestra solo las cuatro secciones principales", async () => {
    const html = renderToStaticMarkup(await Home());
    const sectionLinks = [...html.matchAll(/href="(\/(?:mis-mascotas|perdidas|mascotas|adopciones))"/g)].map((match) => match[1]);

    expect(sectionLinks).toEqual(["/mis-mascotas", "/perdidas", "/mascotas", "/adopciones"]);
    expect(html).toContain("Mis mascotas");
    expect(html).toContain("Perdidas");
    expect(html).toContain("Mascotas");
    expect(html).toContain("Adopciones");
    expect(html).not.toContain("Cómo funciona");
    expect(html).not.toContain("Mascotas para conocer");
  });
});
