import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { PetCarnetEditor } from "./PetCarnetEditor";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

describe("controles de publicación del carnet", () => {
  it("presenta los historiales privados con consentimiento público desactivado por defecto", () => {
    const html = renderToStaticMarkup(createElement(PetCarnetEditor, {
      pet: { id: "pet-1", name: "Luna", species: "perro", birthDate: "", breed: "", gender: "", size: "", color: "", weightKg: "", sterilized: null, microchip: "", distinctiveTraits: [], identificationNotes: "" },
      health: { allergies: [], conditions: [], medications: [], specialDiet: "", behavior: "", emergencyCareNote: "" },
      vaccines: [], documents: [],
      dewormings: [{ id: "dew-1", product: "Milbemax", date: "2026-03-10", nextDate: "2026-06-10", dose: "1 tableta", veterinarian: "Dra. Pérez", origin: "", documentId: "", visiblePublic: false }],
      consultations: [{ id: "visit-1", date: "2026-03-11", reason: "Revisión general", diagnosis: "Sin hallazgos", treatment: "", medications: [], veterinarian: "Dra. Pérez", origin: "", documentIds: [], visiblePublic: false }],
      canEdit: true, privacy: { showHealth: false, showFiles: false },
    }));
    expect(html).toContain("Desparasitaciones");
    expect(html).toContain("Milbemax");
    expect(html).toContain("Historial de consultas");
    expect(html).toContain("Revisión general");
    expect(html).toContain("Guardar desparasitación");
    expect(html).toContain("Guardar consulta");
    expect(html).toContain(">Editar</button>");
    expect(html).toContain("Eliminar");
    expect(html).toContain("Compartir esta desparasitación en el perfil público voluntario");
    expect(html).toContain("Compartir esta consulta en el perfil público voluntario");
    expect(html).not.toContain("Compartir los documentos asociados a esta consulta");
    expect(html).not.toContain("checked=\"\"");
  });
  it("permite a un tutor activo leer historiales sin ofrecer edición", () => {
    const html = renderToStaticMarkup(createElement(PetCarnetEditor, {
      pet: { id: "pet-1", name: "Luna", species: "perro", birthDate: "", breed: "", gender: "", size: "", color: "", weightKg: "", sterilized: null, microchip: "", distinctiveTraits: [], identificationNotes: "" },
      health: { allergies: [], conditions: [], medications: [], specialDiet: "", behavior: "", emergencyCareNote: "" },
      vaccines: [], documents: [], dewormings: [{ id: "dew-1", product: "Milbemax", date: "2026-03-10", nextDate: "", dose: "", veterinarian: "", origin: "", documentId: "", visiblePublic: false }],
      consultations: [{ id: "visit-1", date: "2026-03-11", reason: "Revisión", diagnosis: "", treatment: "", medications: [], veterinarian: "", origin: "", documentIds: [], visiblePublic: false }],
      canEdit: false, privacy: { showHealth: false, showFiles: false },
    }));
    expect(html).toContain("Milbemax");
    expect(html).toContain("Revisión");
    expect(html).toContain("solo lectura");
    expect(html).not.toContain("Editar desparasitación");
    expect(html).not.toContain("Registrar consulta");
  });
  it("separa la publicación de salud y archivos sin quitar el permiso individual", () => {
    const html = renderToStaticMarkup(createElement(PetCarnetEditor, {
      pet: { id: "pet-1", name: "Luna", species: "perro", birthDate: "", breed: "", gender: "", size: "", color: "", weightKg: "", sterilized: null, microchip: "", distinctiveTraits: [], identificationNotes: "" },
      health: { allergies: [], conditions: [], medications: [], specialDiet: "", behavior: "", emergencyCareNote: "" },
      vaccines: [],
      dewormings: [], consultations: [],
      documents: [{ id: "file-1", name: "Cartilla", category: "salud", type: "pdf", bucketId: "pawpass-documentos", objectPath: "file-1/cartilla.pdf", mimeType: "application/pdf", size: 1024, date: "", description: "", signedUrl: null, visiblePublic: true }],
      canEdit: true,
      privacy: { showHealth: false, showFiles: true },
    }));
    expect(html).toContain("Mostrar el resumen de salud en el perfil público voluntario");
    expect(html).toContain("Mostrar los archivos seleccionados en el perfil público voluntario");
    expect(html).toContain("Compartir este archivo en el perfil público voluntario");
    expect(html).toContain("Las fotos se mantienen privadas hasta que elijas compartirlas una por una.");
    expect(html).toContain("La nota del QR se controla por separado.");
  });

  it("explica que una foto se autoriza individualmente antes de compartirla", () => {
    const html = renderToStaticMarkup(createElement(PetCarnetEditor, {
      pet: { id: "pet-1", name: "Luna", species: "perro", birthDate: "", breed: "", gender: "", size: "", color: "", weightKg: "", sterilized: null, microchip: "", distinctiveTraits: [], identificationNotes: "" },
      health: { allergies: [], conditions: [], medications: [], specialDiet: "", behavior: "", emergencyCareNote: "" },
      vaccines: [],
      dewormings: [], consultations: [],
      documents: [{ id: "photo-1", name: "Paseo", category: "foto", type: "imagen", bucketId: "pawpass-fotos", objectPath: "photo-1/paseo.jpg", mimeType: "image/jpeg", size: 1024, date: "", description: "", signedUrl: "https://fotos.test/paseo.jpg", visiblePublic: false }],
      canEdit: true,
      privacy: { showHealth: false, showFiles: false },
    }));
    expect(html).toContain("Compartir esta foto en el perfil público voluntario");
  });
});
