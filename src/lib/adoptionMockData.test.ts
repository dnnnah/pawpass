import { describe, expect, it } from "vitest";
import { filterAdoptablePets } from "@/lib/domain/adoption";
import { getAdoptionDemoPets, getAllPets } from "@/lib/services/pets/queries";
import { getMockShelters } from "@/lib/services/shelters/queries";

describe("datos mock del prototipo de adopción", () => {
  it("carga perfiles mock válidos", async () => {
    const pets = await getAdoptionDemoPets();
    expect(pets.length).toBeGreaterThan(0);
    expect(new Set(pets.map((pet) => pet.identificacion.codigoPublico)).size).toBe(pets.length);
  });

  it("incluye casos demostrativos para el dominio", async () => {
    const pets = await getAdoptionDemoPets();
    expect(pets.some((pet) => pet.estado === "en_adopcion")).toBe(true);
    expect(pets.some((pet) => pet.estado === "fallecido")).toBe(true);
    expect(pets.some((pet) => pet.estado === "perdido")).toBe(true);
  });

  it("expone mascotas disponibles para el catálogo", async () => {
    const adoptable = filterAdoptablePets(await getAdoptionDemoPets());
    expect(adoptable.length).toBeGreaterThanOrEqual(3);
  });

  it("carga refugios mock válidos", async () => {
    const shelters = await getMockShelters();
    expect(shelters.length).toBeGreaterThan(0);
    expect(new Set(shelters.map((shelter) => shelter.id)).size).toBe(shelters.length);
  });

  it("referencia mascotas que existen en los mocks", async () => {
    const pets = await getAdoptionDemoPets();
    const petIds = new Set(pets.map((pet) => pet.id));

    for (const shelter of await getMockShelters()) {
      for (const petId of shelter.mascotas) {
        expect(petIds.has(petId), `El refugio ${shelter.id} referencia la mascota inexistente ${petId}`).toBe(true);
      }
    }
  });

  it("al menos un refugio tiene una mascota adoptable", async () => {
    const pets = await getAdoptionDemoPets();
    const adoptableIds = new Set(filterAdoptablePets(pets).map((pet) => pet.id));

    const hasAdoptable = (await getMockShelters()).some((shelter) =>
      shelter.mascotas.some((petId) => adoptableIds.has(petId)),
    );
    expect(hasAdoptable).toBe(true);
  });

  it("no comparte IDs ni códigos con las mascotas reales", async () => {
    const demo = await getAdoptionDemoPets();
    const real = await getAllPets();
    const realIds = new Set(real.map((pet) => pet.id));
    const realCodes = new Set(real.map((pet) => pet.identificacion.codigoPublico));

    for (const pet of demo) {
      expect(realIds.has(pet.id), `id ${pet.id} ya existe en mascotas.json`).toBe(false);
      expect(realCodes.has(pet.identificacion.codigoPublico), `código ${pet.identificacion.codigoPublico} ya existe en mascotas.json`).toBe(false);
    }
  });
});