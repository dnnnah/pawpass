import { describe, expect, it, vi } from "vitest";
import { setPetAdoptionPublication } from "./adoptionPublication";

describe("setPetAdoptionPublication", () => {
  it("publishes an owned pet through the constrained adoption RPC", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: null });
    const result = await setPetAdoptionPublication({ rpc }, "pet-1", true);

    expect(result).toBeNull();
    expect(rpc).toHaveBeenCalledWith("cambiar_estado_adopcion", {
      p_pet: "pet-1",
      p_estado: "en_adopcion",
      p_refugio: null,
    });
  });

  it("publishes through an authorized shelter membership", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: null });
    const result = await setPetAdoptionPublication({ rpc }, "pet-1", true, "shelter-1");

    expect(result).toBeNull();
    expect(rpc).toHaveBeenCalledWith("cambiar_estado_adopcion", {
      p_pet: "pet-1",
      p_estado: "en_adopcion",
      p_refugio: "shelter-1",
    });
  });

  it("retires a listing and hides internal errors behind a generic message", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: "private detail" } });
    const result = await setPetAdoptionPublication({ rpc }, "pet-1", false);

    expect(rpc).toHaveBeenCalledWith("cambiar_estado_adopcion", {
      p_pet: "pet-1",
      p_estado: "en_casa",
      p_refugio: null,
    });
    expect(result).toBe("No pudimos actualizar la publicación. Intenta de nuevo.");
  });
});

describe("errores recuperables al publicar", () => {
  it.each([
    ["Sube una foto válida antes de publicar en adopción", "foto en el carnet privado"],
    ["Agrega un correo de entrega válido antes de publicar", "correo de contacto válido"],
    ["Una alerta de pérdida activa bloquea la publicación de adopción", "alerta de pérdida activa"],
  ])("explica el requisito que falta", async (message, expected) => {
    const rpc = vi.fn().mockResolvedValue({ error: { message } });
    expect(await setPetAdoptionPublication({ rpc }, "pet-1", true)).toContain(expected);
  });
});
