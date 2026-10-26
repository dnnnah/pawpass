import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { toPublicProfile } from "@/lib/mapping/publicProfile";
import { PublicProfileView } from "./PublicProfileView";

vi.mock("@/components/layout/AppShell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => children,
}));

afterEach(() => vi.unstubAllEnvs());

describe("presentación del perfil público", () => {
  it("recupera la ficha histórica y el QR sin mostrar historial privado ni el bloque de carnet", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://pawpass.example");
    const profile = toPublicProfile({
      publicCode: "PC-LUCCA-001",
      name: "Lucca",
      species: "Perro",
      status: "en_casa",
      photoUrl: "/pets/lucca.jpeg",
      breed: "Schnauzer miniatura",
      contact: { name: "Responsable de Lucca", phone: "5512345678" },
      vaccines: [{ visible: true, name: "Rabia", applicationDate: "2025-01-15", nextDose: null }],
      health: null,
      photos: [],
      documents: [
        { visible: true, name: "Cartilla compartida", category: "vacunas", type: "pdf", date: null, description: null, url: "https://files.example/cartilla.pdf" },
        { visible: false, name: "Expediente privado", category: "salud", type: "pdf", date: null, description: null, url: "https://files.example/privado.pdf" },
      ],
      medicalHistory: [{ diagnosis: "Dato privado" }],
      veterinarian: { name: "Dato veterinario fuera del alcance" },
    });

    const html = renderToStaticMarkup(createElement(PublicProfileView, { profile: profile! }));

    expect(html).toContain('aria-label="Secciones del perfil"');
    expect(html).toContain('src="/pets/lucca.jpeg"');
    expect(html).toContain('id="info"');
    expect(html).toContain('id="contacto"');
    expect(html).toContain('id="documentos"');
    expect(html).toContain('aria-label="Código QR del perfil público de Lucca"');
    expect(html).not.toContain("Carnet físico");
    expect(html).not.toContain("Estudio del carnet");
    expect(html).not.toContain('aria-label="Carnet"');
    expect(html).not.toContain("QR no disponible");
    expect(html).not.toContain("bg-success-soft");
    expect(html).toContain("Cartilla compartida");
    expect(html).not.toContain("Expediente privado");
    expect(html).not.toContain("Al día");
    expect(html).not.toContain("/vacunas");
    expect(html).not.toContain("Dato privado");
    expect(html).not.toContain("Dato veterinario fuera del alcance");
    expect(html).not.toContain("Veterinario");
  });
});
