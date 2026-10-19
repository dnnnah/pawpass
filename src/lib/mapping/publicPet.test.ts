import { describe, expect, it } from "vitest";
import { toPublicPetCard } from "@/lib/mapping/publicPet";

const lostPayload = {
  publicCode: "PC-LUCCA-001",
  photoUrl: "/pets/lucca.jpeg",
  name: " Lucca ",
  species: "Perro",
  breed: "Schnauzer",
  status: "perdido",
  privacy: {
    mostrarNombreContacto: true,
    mostrarTelefono: true,
    mostrarWhatsapp: false,
    mostrarZona: true,
    mostrarEmergencia: true,
  },
  lost: {
    zona: " Parque México ",
    fechaPerdida: "2026-10-18",
    mensaje: "Avísame si lo ves",
    instrucciones: ["No lo persigas", "Llama al tutor", 42],
  },
  contact: {
    name: "Donnovan",
    phone: "5512345678",
    whatsapp: "5215512345678",
    email: "privado@example.com",
  },
  recentPhotos: Array.from({ length: 8 }, (_, index) => ({ url: `/foto-${index}.jpg` })),
  health: { alergias: ["privado"] },
};

describe("toPublicPetCard", () => {
  it("expone solo contacto consentido cuando la mascota está perdida", () => {
    expect(toPublicPetCard(lostPayload)).toEqual({
      publicCode: "PC-LUCCA-001",
      photoUrl: "/pets/lucca.jpeg",
      name: "Lucca",
      species: "Perro",
      breed: "Schnauzer",
      status: "perdido",
      lost: {
        zona: "Parque México",
        fechaPerdida: "2026-10-18",
        mensaje: "Avísame si lo ves",
        instrucciones: ["No lo persigas", "Llama al tutor"],
      },
      contact: {
        name: "Donnovan",
        phone: "5512345678",
        whatsapp: null,
      },
      recentPhotos: Array.from({ length: 6 }, (_, index) => ({ url: `/foto-${index}.jpg` })),
    });
  });

  it("no expone contacto ni pérdida fuera del estado perdido", () => {
    const card = toPublicPetCard({
      ...lostPayload,
      status: "en_casa",
      contact: { name: "Donnovan", phone: "5512345678", whatsapp: "5215512345678" },
      lost: lostPayload.lost,
    });

    expect(card?.contact).toBeNull();
    expect(card?.lost).toBeNull();
  });

  it("omite contacto cuando no hay ningún canal autorizado", () => {
    const card = toPublicPetCard({
      ...lostPayload,
      privacy: {
        mostrarNombreContacto: true,
        mostrarTelefono: false,
        mostrarWhatsapp: false,
        mostrarZona: true,
        mostrarEmergencia: true,
      },
    });

    expect(card?.contact).toBeNull();
  });

  it("rechaza identificadores y enums inválidos", () => {
    expect(toPublicPetCard({ ...lostPayload, publicCode: "" })).toBeNull();
    expect(toPublicPetCard({ ...lostPayload, species: "Conejo" })).toBeNull();
    expect(toPublicPetCard({ ...lostPayload, status: "desaparecido" })).toBeNull();
  });
});
