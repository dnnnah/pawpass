import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AdoptionPublicationForm } from "./AdoptionPublicationForm";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

describe("publicación voluntaria de adopción", () => {
  it("muestra la acción y exige consentimiento antes de publicar", () => {
    const html = renderToStaticMarkup(createElement(AdoptionPublicationForm, {
      petId: "pet-1", petName: "Nala", status: "en_casa", canEdit: true, publicationActive: false,
    }));
    expect(html).toContain("Publicar en adopción");
    expect(html).toContain("Quiero mostrar estos datos y la foto principal");
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>[\s\S]*?Publicar en adopción/);
    expect(html).toContain("El carnet, el QR, la salud, los documentos y los teléfonos o correos privados no se muestran");
  });

  it("muestra el estado activo y la acción para dejar de publicar", () => {
    const html = renderToStaticMarkup(createElement(AdoptionPublicationForm, {
      petId: "pet-1", petName: "Nala", status: "en_adopcion", canEdit: true, publicationActive: true,
    }));
    expect(html).toContain("En adopción");
    expect(html).toContain("Dejar de mostrar en adopción");
    expect(html).not.toContain("Quiero mostrar estos datos y la foto principal");
  });
});
