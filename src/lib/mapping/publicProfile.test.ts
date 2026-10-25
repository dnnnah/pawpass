import { describe, expect, it } from "vitest";
import { toPublicProfile, toPublicProfileCard } from "@/lib/mapping/publicProfile";

describe("toPublicProfile", () => {
  it("mantiene solo campos aprobados y elementos marcados para publicación", () => {
    const profile = toPublicProfile({
      publicCode: "PC-LOLA-123", name: "Lola", species: "Perro", status: "en_casa",
      birthDate: "2022-05-04", traits: ["Mancha blanca"],
      contact: { name: null, phone: "+525512345678", whatsapp: null, email: null },
      health: { allergies: ["Pollo"], conditions: [], medications: [], diet: "Alimento especial", behavior: "Tranquila" },
      vaccines: [
        { visible: true, name: "Rabia", applicationDate: "2025-05-01", nextDose: "2026-05-01" },
        { visible: false, name: "Privada", applicationDate: "2025-01-01", nextDose: null },
      ],
      photos: [
        { visible: true, url: "https://storage.test/photo" },
        { visible: false, url: "https://storage.test/private-photo" },
      ],
      documents: [
        { visible: true, name: "Cartilla", category: "vacunas", type: "pdf", url: "https://storage.test/cartilla" },
        { visible: false, name: "Expediente privado", category: "salud", type: "pdf", url: "https://storage.test/private" },
      ],
      veterinarian: { name: "No mostrar" },
      privateOwnerEmail: "privado@example.test",
    });

    expect(profile).toMatchObject({
      publicCode: "PC-LOLA-123", name: "Lola", contact: { phone: "+525512345678" },
      health: { allergies: ["Pollo"], diet: "Alimento especial" },
      vaccines: [{ name: "Rabia", applicationDate: "2025-05-01" }],
      photos: [{ url: "https://storage.test/photo" }],
      documents: [{ name: "Cartilla", url: "https://storage.test/cartilla" }],
    });
    expect(profile?.documents).toHaveLength(1);
    expect(profile?.photos).toHaveLength(1);
    expect(profile?.vaccines).toHaveLength(1);
    expect(profile).not.toHaveProperty("veterinarian");
    expect(profile).not.toHaveProperty("privateOwnerEmail");
  });

  it("rechaza registros de perfil incompletos o inválidos", () => {
    expect(toPublicProfileCard({ publicCode: "", name: "Lola", species: "Perro", status: "en_casa" })).toBeNull();
    expect(toPublicProfile({ publicCode: "PC-1", name: "Lola", species: "Conejo", status: "en_casa" })).toBeNull();
  });
});
