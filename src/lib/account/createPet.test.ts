import { describe, expect, it, vi } from "vitest";
import { createAccountPet, validateCreatePetInput } from "./createPet";

describe("validateCreatePetInput", () => {
  it("acepta una mascota con nombre, especie y fecha opcional", () => {
    expect(
      validateCreatePetInput({
        name: " Nala ",
        species: "gato",
        birthDate: "2022-04-12",
      }),
    ).toEqual({});
  });

  it("rechaza nombre vacío, especie desconocida y fecha futura", () => {
    expect(
      validateCreatePetInput({
        name: "  ",
        species: "ave",
        birthDate: "2999-01-01",
      }),
    ).toEqual({
      name: "Escribe el nombre de tu mascota.",
      species: "Selecciona perro o gato.",
      birthDate: "La fecha no puede estar en el futuro.",
    });
  });
});

describe("createAccountPet", () => {
  it("llama la RPC con los campos normalizados y devuelve el id", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: "pet-123", error: null });

    await expect(
      createAccountPet(
        { rpc },
        { name: "  Nala  ", species: "gato", birthDate: "" },
      ),
    ).resolves.toEqual({ id: "pet-123", error: null });

    expect(rpc).toHaveBeenCalledWith("crear_mascota", {
      p_nombre: "Nala",
      p_especie: "gato",
      p_nacimiento: null,
    });
  });

  it("convierte el error de Supabase en un resultado utilizable por el formulario", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "name must not be empty" },
    });

    await expect(
      createAccountPet(
        { rpc },
        { name: "Nala", species: "gato", birthDate: "" },
      ),
    ).resolves.toEqual({
      id: null,
      error: "No pudimos registrar la mascota. Revisa los datos e intenta de nuevo.",
    });
  });
});
