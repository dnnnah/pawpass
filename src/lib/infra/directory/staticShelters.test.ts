import { describe, expect, it } from "vitest";
import { staticShelterDirectory } from "@/lib/infra/directory/staticShelters";

describe("staticShelterDirectory", () => {
  it("devuelve el catálogo de refugios de la fuente estática", async () => {
    const shelters = await staticShelterDirectory.listShelters();

    expect(shelters.length).toBeGreaterThan(0);
    expect(shelters.every((shelter) => typeof shelter.id === "string")).toBe(true);
  });

  it("expone refugios ya validados por el contrato de dominio", async () => {
    for (const shelter of await staticShelterDirectory.listShelters()) {
      expect(shelter.nombre.trim()).not.toBe("");
      expect(shelter.mascotas.length).toBeGreaterThan(0);
    }
  });

  it("es estable entre llamadas (misma fuente, sin recomputar)", async () => {
    const first = await staticShelterDirectory.listShelters();
    const second = await staticShelterDirectory.listShelters();

    expect(first).toBe(second);
  });
});
