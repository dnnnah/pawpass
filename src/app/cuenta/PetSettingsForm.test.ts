import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PetSettingsForm } from "./PetSettingsForm";

function render(initialPublished: boolean) {
  return renderToStaticMarkup(createElement(PetSettingsForm, {
    petId: "luna-id",
    petName: "Luna",
    publicCode: "PC-LUNA-7",
    canEdit: true,
    initialPublished,
  }));
}

describe("acceso al perfil público voluntario", () => {
  it("muestra el estado inactivo y deja visible la acción para elegir qué compartir", () => {
    const html = render(false);
    expect(html).toContain("Perfil público voluntario · Inactivo");
    expect(html).toContain("Tú eliges qué datos, fotos y archivos autorizas.");
    expect(html).toContain("Activar y elegir qué compartir");
  });

  it("permite abrir el perfil público real cuando ya está activo", () => {
    const html = render(true);
    expect(html).toContain("Perfil público voluntario · Activo");
    expect(html).toContain('href="/perfil/PC-LUNA-7"');
    expect(html).toContain("Editar qué compartes");
  });
});
