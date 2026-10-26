import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { PetCarnetEditor } from "./PetCarnetEditor";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

describe("controles de publicación del carnet", () => {
  it("separa la publicación de salud y archivos sin quitar el permiso individual", () => {
    const html = renderToStaticMarkup(createElement(PetCarnetEditor, {
      pet: { id: "pet-1", name: "Luna", species: "perro", birthDate: "", breed: "", gender: "", size: "", color: "", weightKg: "", sterilized: null, microchip: "", distinctiveTraits: [], identificationNotes: "" },
      health: { allergies: [], conditions: [], medications: [], specialDiet: "", behavior: "", emergencyCareNote: "" },
      vaccines: [],
      documents: [{ id: "file-1", name: "Cartilla", category: "salud", type: "pdf", bucketId: "pawpass-documentos", objectPath: "file-1/cartilla.pdf", mimeType: "application/pdf", size: 1024, date: "", description: "", signedUrl: null, visiblePublic: true }],
      canEdit: true,
      privacy: { showHealth: false, showFiles: true },
    }));
    expect(html).toContain("Mostrar el resumen de salud en el perfil público voluntario");
    expect(html).toContain("Mostrar los archivos seleccionados en el perfil público voluntario");
    expect(html).toContain("Compartir este archivo en el perfil público voluntario");
    expect(html).toContain("La nota del QR se controla por separado.");
  });
});
