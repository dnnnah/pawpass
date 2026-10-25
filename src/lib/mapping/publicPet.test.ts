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
    email: "contacto@example.com",
  },
  contactMethod: "phone",
  zone: "Colonia Roma",
  emergencyCareNote: "No ofrecer pollo.",
  vaccinationStatus: "al_dia",
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
      zone: "Colonia Roma",
      emergencyCareNote: "No ofrecer pollo.",
      vaccinationStatus: "al_dia",
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
        email: null,
      },
      recentPhotos: Array.from({ length: 6 }, (_, index) => ({ url: `/foto-${index}.jpg` })),
    });
  });

  it("expone el canal QR elegido y los cuidados básicos aunque siga en casa", () => {
    const card = toPublicPetCard({
      ...lostPayload,
      status: "en_casa",
      contactMethod: "email",
      contact: { name: "Donnovan", phone: "5512345678", whatsapp: "5215512345678", email: "contacto@example.com" },
      lost: lostPayload.lost,
    });

    expect(card?.contact).toEqual({ name: "Donnovan", phone: null, whatsapp: null, email: "contacto@example.com" });
    expect(card?.zone).toBe("Colonia Roma");
    expect(card?.emergencyCareNote).toBe("No ofrecer pollo.");
    expect(card?.vaccinationStatus).toBeNull();
    expect(card?.lost).toBeNull();
  });

  it("no revela campos de contacto distintos al canal QR seleccionado", () => {
    const card = toPublicPetCard({
      ...lostPayload,
      contactMethod: "phone",
      privacy: { ...lostPayload.privacy, mostrarNombreContacto: false },
    });

    expect(card?.contact).toEqual({ name: null, phone: "5512345678", whatsapp: null, email: null });
  });

  it("rechaza identificadores y enums inválidos", () => {
    expect(toPublicPetCard({ ...lostPayload, publicCode: "" })).toBeNull();
    expect(toPublicPetCard({ ...lostPayload, species: "Conejo" })).toBeNull();
    expect(toPublicPetCard({ ...lostPayload, status: "desaparecido" })).toBeNull();
  });
});
