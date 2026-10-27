import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AdoptionPetCard } from "./AdoptionPetCard";
import type { AdoptionCatalogCard } from "@/lib/mapping/adoptionPresentation";

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => createElement("img", props),
}));

function buildCard(overrides: Partial<AdoptionCatalogCard> = {}): AdoptionCatalogCard {
  return {
    petId: "mila",
    name: "Mila",
    species: "Perro",
    breed: "Mestizo",
    gender: "Hembra",
    size: "Mediano",
    age: "5 años",
    image: "/pets/alix.jpeg",
    code: "PC-MILA-001",
    zone: "Roma Norte, CDMX",
    verified: true,
    shelterId: "patitas-con-causa",
    shelterName: "Patitas con Causa",
    href: "/perfil/mila",
    ...overrides,
  };
}

function renderCard(card: AdoptionCatalogCard): string {
  return renderToStaticMarkup(createElement(AdoptionPetCard, { card }));
}

describe("AdoptionPetCard", () => {
  it("muestra el nombre, la etiqueta de adopción y el refugio", () => {
    const html = renderCard(buildCard());
    expect(html).toContain("Mila");
    expect(html).toContain("En adopción");
    expect(html).toContain("Perro");
    expect(html).toContain("Patitas con Causa");
    expect(html).toContain("Mediano");
  });

  it("muestra el sello de verificado solo cuando corresponde", () => {
    expect(renderCard(buildCard())).toContain("Verificado");
    expect(renderCard(buildCard({ verified: false }))).not.toContain("Verificado");
  });

  it("enlaza al perfil de la mascota", () => {
    const html = renderCard(buildCard());
    expect(html).toContain('href="/perfil/mila"');
  });

  it("muestra 'Adopción directa' cuando no hay refugio", () => {
    const html = renderCard(
      buildCard({ shelterId: null, shelterName: null, zone: "Nápoles, CDMX" }),
    );
    expect(html).toContain("Adopción directa");
    expect(html).toContain("Nápoles, CDMX");
  });

  it("incluye texto alternativo de la foto", () => {
    const html = renderCard(buildCard());
    expect(html).toContain('alt="Foto de Mila"');
    expect(html).toContain('src="/pets/alix.jpeg"');
    expect(html).toContain("object-contain");
    expect(html).toContain("aspect-[4/3]");
    expect(html).toContain('sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"');
  });
});
