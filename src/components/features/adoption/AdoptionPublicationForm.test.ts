import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AdoptionPublicationForm } from "./AdoptionPublicationForm";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/lib/infra/supabase/env", () => ({ hasSupabaseEnv: () => false }));

function render(publicationActive: boolean) {
  return renderToStaticMarkup(createElement(AdoptionPublicationForm, {
    petId: "mila",
    petName: "Mila",
    status: publicationActive ? "en_adopcion" : "en_casa",
    canEdit: true,
    publicationActive,
  }));
}

describe("lenguaje de publicación en adopción", () => {
  it("describe una publicación activa como en adopción y permite dejar de mostrarla", () => {
    const html = render(true);
    expect(html).toContain("En adopción");
    expect(html).toContain("Dejar de mostrar en adopción");
    expect(html).not.toContain("catálogo");
  });

  it("explica y nombra la acción para publicar en adopción", () => {
    const html = render(false);
    expect(html).toContain("Publicar en adopción");
    expect(html).not.toContain("catálogo");
  });
});
