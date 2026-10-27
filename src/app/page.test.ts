import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import Home from "./page";

vi.mock("@/components/layout/AppShell", () => ({ AppShell: ({ children }: { children: React.ReactNode }) => createElement("main", null, children) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

describe("home de PawPass", () => {
  it("mantiene las secciones principales y ofrece acceso público a una ficha QR", async () => {
    const html = renderToStaticMarkup(await Home());
    const sectionLinks = [...html.matchAll(/href="(\/(?:mis-mascotas|perdidas|mascotas|adopciones))"/g)].map((match) => match[1]);

    expect(sectionLinks).toEqual(["/mis-mascotas", "/perdidas", "/mascotas", "/adopciones"]);
    expect(html).toContain("Mis mascotas");
    expect(html).toContain("Perdidas");
    expect(html).toContain("Mascotas");
    expect(html).toContain("Adopciones");
    expect(html).toContain("PawPass guarda el carnet de tu mascota");
    expect(html).toContain("Código o enlace PawPass");
    expect(html).toContain("Buscar ficha");
    expect(html).toContain("Abrir cámara para escanear QR");
  });
});
