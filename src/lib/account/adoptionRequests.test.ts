import { describe, expect, it, vi } from "vitest";
import {
  listAccountAdoptionRequests,
  normalizeAccountAdoptionRequestRow,
  reviewAdoptionRequest,
} from "./adoptionRequests";

const PET = {
  id: "pet-1",
  codigo_publico: "PC-MILA-001",
  nombre: "Mila",
  especie: "perro",
  slug: "mila",
};

describe("normalizeAccountAdoptionRequestRow", () => {
  it("mapea una solicitud y detecta si fue enviada o recibida", () => {
    expect(
      normalizeAccountAdoptionRequestRow(
        {
          id: "request-1",
          pet_id: "pet-1",
          applicant_id: "user-1",
          nombre: "Ana López",
          telefono: "5512345678",
          email: null,
          motivo: "Puedo ofrecerle un hogar estable.",
          estado: "enviada",
          created_at: "2026-10-19T12:00:00.000Z",
          updated_at: "2026-10-19T12:00:00.000Z",
          pets: PET,
        },
        "user-1",
      ),
    ).toEqual({
      id: "request-1",
      petId: "pet-1",
      pet: {
        id: "pet-1",
        publicCode: "PC-MILA-001",
        name: "Mila",
        species: "perro",
        slug: "mila",
      },
      applicantId: "user-1",
      name: "Ana López",
      phone: "5512345678",
      email: null,
      reason: "Puedo ofrecerle un hogar estable.",
      status: "enviada",
      createdAt: "2026-10-19T12:00:00.000Z",
      updatedAt: "2026-10-19T12:00:00.000Z",
      role: "applicant",
    });
  });

  it("descarta estados desconocidos y mascotas incompletas", () => {
    expect(
      normalizeAccountAdoptionRequestRow(
        {
          id: "request-1",
          pet_id: "pet-1",
          applicant_id: "user-1",
          nombre: "Ana",
          telefono: "5512345678",
          motivo: "Motivo",
          estado: "desconocido",
          created_at: "2026-10-19T12:00:00.000Z",
          updated_at: "2026-10-19T12:00:00.000Z",
          pets: [],
        },
        "user-2",
      ),
    ).toBeNull();
  });
});

describe("listAccountAdoptionRequests", () => {
  it("normaliza solo filas válidas y convierte errores en un resultado seguro", async () => {
    const read = vi.fn().mockResolvedValue({
      data: [
        {
          id: "request-1",
          pet_id: "pet-1",
          applicant_id: "user-1",
          nombre: "Ana",
          telefono: "5512345678",
          email: "ana@example.com",
          motivo: "Motivo",
          estado: "en_revision",
          created_at: "2026-10-19T12:00:00.000Z",
          updated_at: "2026-10-19T12:00:00.000Z",
          pets: PET,
        },
        { id: "bad" },
      ],
      error: null,
    });

    await expect(listAccountAdoptionRequests({ read }, "user-1")).resolves.toEqual({
      requests: [
        expect.objectContaining({ id: "request-1", role: "applicant", status: "en_revision" }),
      ],
      error: null,
    });
  });

  it("no expone el detalle de un error de Supabase", async () => {
    const read = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "permission denied" },
    });

    await expect(listAccountAdoptionRequests({ read }, "user-1")).resolves.toEqual({
      requests: [],
      error: "No pudimos cargar tus solicitudes de adopción. Intenta de nuevo.",
    });
  });
});

describe("reviewAdoptionRequest", () => {
  it("llama la RPC de revisión con el estado solicitado", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: null });

    await expect(
      reviewAdoptionRequest({ rpc }, "request-1", "aprobada"),
    ).resolves.toEqual({ error: null });
    expect(rpc).toHaveBeenCalledWith("revisar_adopcion", {
      p_solicitud: "request-1",
      p_estado: "aprobada",
    });
  });

  it("devuelve un error genérico cuando la RPC falla", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "No autorizado" },
    });

    await expect(
      reviewAdoptionRequest({ rpc }, "request-1", "rechazada"),
    ).resolves.toEqual({ error: "No pudimos actualizar la solicitud. Intenta de nuevo." });
  });
});
