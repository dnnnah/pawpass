import { describe, expect, it, vi } from "vitest";
import { submitAdoptionRequest } from "./submitAdoptionRequest";

describe("submitAdoptionRequest", () => {
  it("llama la RPC con los campos normalizados y devuelve el folio", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: "request-123", error: null });

    await expect(
      submitAdoptionRequest(
        { rpc },
        {
          publicCode: "  PC-MILA-001 ",
          name: "  Ana López  ",
          phone: " 5512345678 ",
          email: " ana@example.com ",
          reason: "  Puedo ofrecerle un hogar estable.  ",
        },
      ),
    ).resolves.toEqual({ id: "request-123", error: null });

    expect(rpc).toHaveBeenCalledWith("solicitar_adopcion", {
      p_codigo: "PC-MILA-001",
      p_nombre: "Ana López",
      p_telefono: "5512345678",
      p_email: "ana@example.com",
      p_motivo: "Puedo ofrecerle un hogar estable.",
    });
  });

  it("envía null cuando el correo opcional está vacío", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: "request-123", error: null });

    await submitAdoptionRequest(
      { rpc },
      {
        publicCode: "PC-MILA-001",
        name: "Ana",
        phone: "5512345678",
        email: "  ",
        reason: "Quiero adoptar.",
      },
    );

    expect(rpc).toHaveBeenCalledWith(
      "solicitar_adopcion",
      expect.objectContaining({ p_email: null }),
    );
  });

  it("oculta el detalle interno cuando Supabase devuelve un error", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "permission denied for function solicitar_adopcion" },
    });

    await expect(
      submitAdoptionRequest(
        { rpc },
        {
          publicCode: "PC-MILA-001",
          name: "Ana",
          phone: "5512345678",
          email: null,
          reason: "Quiero adoptar.",
        },
      ),
    ).resolves.toEqual({
      id: null,
      error: "No pudimos enviar la solicitud. Intenta de nuevo.",
    });
  });

  it("rechaza una respuesta sin folio aunque no tenga error", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: null });

    await expect(
      submitAdoptionRequest(
        { rpc },
        {
          publicCode: "PC-MILA-001",
          name: "Ana",
          phone: "5512345678",
          email: null,
          reason: "Quiero adoptar.",
        },
      ),
    ).resolves.toEqual({
      id: null,
      error: "No pudimos enviar la solicitud. Intenta de nuevo.",
    });
  });
});
