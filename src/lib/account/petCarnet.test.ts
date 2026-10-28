import { describe, expect, it } from "vitest";
import {
  normalizePetList,
  validatePetFile,
  validatePetHealth,
  validatePetIdentity,
  validatePetVaccine,
  validatePetDeworming,
  validatePetConsultation,
  type PetHealthInput,
  type PetIdentityInput,
  type PetVaccineInput,
  type PetDewormingInput,
  type PetConsultationInput,
} from "./petCarnet";

const identity: PetIdentityInput = {
  name: "Nala",
  species: "gato",
  birthDate: "2022-03-12",
  breed: "Criolla",
  gender: "hembra",
  size: "mediano",
  color: "Atigrada",
  weightKg: "4.25",
  sterilized: "true",
  microchip: "985121000000001",
  distinctiveTraits: "Mancha blanca en el pecho\nCola corta",
  identificationNotes: "Se asusta con los cohetes.",
};

const health: PetHealthInput = {
  allergies: "Pollo\nPolen",
  conditions: "",
  medications: "",
  specialDiet: "No come pollo.",
  behavior: "",
  emergencyCareNote: "No administrar medicamentos sin consultar a su dueño.",
};

const vaccine: PetVaccineInput = {
  name: "Rabia",
  applicationDate: "2025-02-10",
  nextDose: "2026-02-10",
  batch: "RAB-104",
  documentId: "",
};

const deworming: PetDewormingInput = {
  product: "Milbemax",
  date: "2026-03-10",
  nextDate: "2026-06-10",
  dose: "1 tableta",
  veterinarian: "Dra. Pérez",
  origin: "veterinario",
  documentId: "",
};

const consultation: PetConsultationInput = {
  date: "2026-03-10",
  reason: "Revisión general",
  diagnosis: "Sin hallazgos",
  treatment: "",
  medications: "",
  veterinarian: "Dra. Pérez",
  origin: "veterinario",
  documentIds: [],
};

describe("carnet privado: validación de datos", () => {
  it("rechaza una fecha de nacimiento futura y un peso fuera del rango de la ficha", () => {
    expect(validatePetIdentity({ ...identity, birthDate: "2030-01-01", weightKg: "0" }, "2026-10-25")).toMatchObject({
      birthDate: expect.any(String),
      weightKg: expect.any(String),
    });
  });

  it("convierte listas multilínea en valores limpios sin entradas vacías", () => {
    expect(normalizePetList(" Pollo \n\nPolen\n  ")).toEqual(["Pollo", "Polen"]);
  });

  it("limita textos médicos y la nota de cuidados a los límites almacenados", () => {
    expect(validatePetHealth({ ...health, emergencyCareNote: "x".repeat(2001) }).emergencyCareNote).toBeTruthy();
  });

  it("rechaza una vacuna aplicada en el futuro o con próxima dosis anterior a su aplicación", () => {
    expect(validatePetVaccine({ ...vaccine, applicationDate: "2027-01-01" }, "2026-10-25").applicationDate).toBeTruthy();
    expect(validatePetVaccine({ ...vaccine, nextDose: "2025-02-09" }, "2026-10-25").nextDose).toBeTruthy();
  });

  it("valida desparasitaciones con fechas y producto requeridos", () => {
    expect(validatePetDeworming(deworming, "2026-10-25")).toEqual({});
    expect(validatePetDeworming({ ...deworming, product: " ", date: "2027-01-01", nextDate: "2026-01-01" }, "2026-10-25")).toMatchObject({
      product: expect.any(String), date: expect.any(String), nextDate: expect.any(String),
    });
  });

  it("valida consultas médicas y limita los campos opcionales", () => {
    expect(validatePetConsultation(consultation, "2026-10-25")).toEqual({});
    expect(validatePetConsultation({ ...consultation, reason: "", diagnosis: "x".repeat(8001), date: "no-fecha" }, "2026-10-25")).toMatchObject({
      reason: expect.any(String), diagnosis: expect.any(String), date: expect.any(String),
    });
  });

  it("acepta los extremos de tamaño permitidos para fotos y documentos y rechaza tipos o tamaños inválidos", () => {
    expect(validatePetFile({ type: "image/webp", size: 1 }, "foto")).toBeNull();
    expect(validatePetFile({ type: "image/jpeg", size: 5 * 1024 * 1024 }, "foto")).toBeNull();
    expect(validatePetFile({ type: "application/pdf", size: 10 * 1024 * 1024 }, "documento")).toBeNull();
    expect(validatePetFile({ type: "image/gif", size: 10 }, "foto")).toBeTruthy();
    expect(validatePetFile({ type: "application/pdf", size: 10 * 1024 * 1024 + 1 }, "documento")).toBeTruthy();
  });

  it("acepta los datos de identidad, salud y vacuna válidos", () => {
    expect(validatePetIdentity(identity, "2026-10-25")).toEqual({});
    expect(validatePetHealth(health)).toEqual({});
    expect(validatePetVaccine(vaccine, "2026-10-25")).toEqual({});
  });
});
