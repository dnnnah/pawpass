import { describe, expect, it, vi } from "vitest";
import { changePetStatus, validateLostAlertInput } from "./petStatus";

describe("validateLostAlertInput", () => {
  it("acepta zona, fecha de hoy y recompensa opcional", () => {
    const today = new Date().toISOString().slice(0, 10);

    expect(
      validateLostAlertInput({
        zone: "Parque México",
        date: today,
        message: "Avisar a la familia",
        reward: "500",
      }),
    ).toEqual({});
  });

  it("rechaza una alerta sin zona, con fecha futura o recompensa negativa", () => {
    expect(
      validateLostAlertInput({
        zone: "",
        date: "2999-01-01",
        message: "",
        reward: "-1",
      }),
    ).toEqual({
      zone: "Indica la zona donde se perdió.",
      date: "La fecha no puede estar en el futuro.",
      reward: "La recompensa debe ser un número igual o mayor que cero.",
    });
  });
});

describe("changePetStatus", () => {
  it("persiste el estado perdido con los datos de la alerta", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: null });

    await expect(
      changePetStatus(
        { rpc },
        "pet-1",
        {
          status: "perdido",
          zone: " Parque México ",
          date: "2026-10-19",
          message: "Avisar",
          reward: "500",
        },
      ),
    ).resolves.toBeNull();

    expect(rpc).toHaveBeenCalledWith("cambiar_estado_mascota", {
      p_pet: "pet-1",
      p_estado: "perdido",
      p_fecha: "2026-10-19",
      p_zona: "Parque México",
      p_mensaje: "Avisar",
      p_recompensa: 500,
    });
  });

  it("cierra la alerta al devolver la mascota a casa", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: null });

    await expect(
      changePetStatus(
        { rpc },
        "pet-1",
        { status: "en_casa", zone: "", date: "", message: "", reward: "" },
      ),
    ).resolves.toBeNull();

    expect(rpc).toHaveBeenCalledWith("cambiar_estado_mascota", {
      p_pet: "pet-1",
      p_estado: "en_casa",
      p_fecha: null,
      p_zona: null,
      p_mensaje: null,
      p_recompensa: null,
    });
  });
});
