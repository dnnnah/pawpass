import { describe, expect, it } from "vitest";
import { normalizeAccountPetRow } from "./pets";

describe("normalizeAccountPetRow", () => {
  it("convierte el registro anidado que devuelve Supabase", () => {
    expect(
      normalizeAccountPetRow({
        pet_id: "pet-1",
        rol: "tutor",
        started_at: "2026-10-01T00:00:00.000Z",
        pets: {
          id: "pet-1",
          codigo_publico: "PC-LUCCA-001",
          nombre: "Lucca",
          especie: "perro",
          estado: "en_casa",
          slug: "lucca",
          raza: "Mestizo",
        },
      }),
    ).toEqual({
      id: "pet-1",
      publicCode: "PC-LUCCA-001",
      name: "Lucca",
      species: "perro",
      status: "en_casa",
      slug: "lucca",
      breed: "Mestizo",
      role: "tutor",
      startedAt: "2026-10-01T00:00:00.000Z",
    });
  });

  it("acepta la forma de relación como arreglo y limpia campos opcionales", () => {
    expect(
      normalizeAccountPetRow({
        pet_id: "pet-2",
        rol: "administrador",
        started_at: "2026-10-02T00:00:00.000Z",
        pets: [
          {
            id: "pet-2",
            codigo_publico: "PC-NALA-001",
            nombre: " Nala ",
            especie: "gato",
            estado: "perdido",
            slug: "",
            raza: null,
          },
        ],
      }),
    ).toMatchObject({
      name: "Nala",
      slug: null,
      breed: null,
      species: "gato",
    });
  });

  it("descarta registros incompletos sin romper el panel", () => {
    expect(normalizeAccountPetRow({ pet_id: "pet-3", pets: null })).toBeNull();
    expect(normalizeAccountPetRow({ pet_id: "pet-4", pets: { nombre: "Sin id" } })).toBeNull();
  });
});
