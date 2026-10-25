import { describe, expect, it } from "vitest";
import { normalizeShelterAdoptionPets } from "./shelterAdoptionPets";

describe("normalizeShelterAdoptionPets", () => {
  it("keeps only the limited identity and adoption state returned to a member", () => {
    expect(normalizeShelterAdoptionPets([
      { id: "pet-1", publicCode: "PC-1-001", name: "Mila", species: "Gato", status: "en_casa", email: "private@example.test" },
      { id: "pet-2", publicCode: "PC-2-001", name: "Rex", species: "Perro", status: "en_adopcion" },
      { id: "bad", publicCode: "", name: "", species: "pez", status: "en_casa" },
    ])).toEqual([
      { id: "pet-1", publicCode: "PC-1-001", name: "Mila", species: "Gato", status: "en_casa" },
      { id: "pet-2", publicCode: "PC-2-001", name: "Rex", species: "Perro", status: "en_adopcion" },
    ]);
  });

  it("returns an empty list for malformed RPC data", () => {
    expect(normalizeShelterAdoptionPets(null)).toEqual([]);
  });
});
