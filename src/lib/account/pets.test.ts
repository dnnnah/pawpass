import { describe, expect, it } from "vitest";
import { normalizeAccountPetRow, prioritizeAccountPets, type AccountPet } from "./pets";

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
      adoptionPublished: false,
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

describe("prioridad de las mascotas de la cuenta", () => {
  it("pone las perdidas primero sin mutar ni alterar el orden dentro de cada grupo", () => {
    const pet = (id: string, status: AccountPet["status"]): AccountPet => ({
      id, status, publicCode: `PC-${id}`, name: id, species: "perro", slug: null,
      breed: null, role: "administrador", startedAt: "2026-10-25T12:00:00Z",
    });
    const original = [pet("casa", "en_casa"), pet("alerta-1", "perdido"), pet("adopcion", "en_adopcion"), pet("alerta-2", "perdido")];
    expect(prioritizeAccountPets(original).map(item => item.id)).toEqual(["alerta-1", "alerta-2", "casa", "adopcion"]);
    expect(original.map(item => item.id)).toEqual(["casa", "alerta-1", "adopcion", "alerta-2"]);
  });
});
