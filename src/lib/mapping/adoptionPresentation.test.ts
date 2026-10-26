import { beforeAll, describe, expect, it } from "vitest";
import { buildAdoptionCatalogEntry, filterAdoptablePets } from "@/lib/domain/adoption";
import { findShelterForPet } from "@/lib/domain/shelter";
import {
  buildCatalogCard,
  buildShelterPetCard,
  normalizeSocialUrl,
} from "@/lib/mapping/adoptionPresentation";
import { getAdoptionDemoPets } from "@/lib/services/pets/queries";
import { getMockShelters } from "@/lib/services/shelters/queries";
import type { PetProfile } from "@/types/pet";

describe("buildCatalogCard", () => {
  let card: ReturnType<typeof buildCatalogCard>;

  beforeAll(async () => {
    const pets = await getAdoptionDemoPets();
    const shelters = await getMockShelters();
    const mila = pets.find((pet) => pet.id === "mila");

    if (!mila) {
      throw new Error("Falta la mascota mock 'mila'");
    }

    card = buildCatalogCard(buildAdoptionCatalogEntry(mila, findShelterForPet(mila.id, shelters)));
  });

  it("mapea los campos del catálogo", () => {
    expect(card.petId).toBe("mila");
    expect(card.name).toBe("Mila");
    expect(card.species).toBe("Perro");
    expect(card.breed).toBe("Mestizo");
    expect(card.gender).toBe("Hembra");
    expect(card.size).toBe("Mediano");
    expect(card.code).toBe("PC-MILA-001");
    expect(card.verified).toBe(true);
    expect(card.shelterName).toBe("Patitas con Causa");
    expect(card.href).toBe("/adopciones/mila");
  });

  it("calcula una edad legible", () => {
    expect(card.age).toMatch(/\d/);
    expect(card.age.length).toBeGreaterThan(0);
  });

  it("usa la zona del refugio cuando la mascota pertenece a uno", () => {
    expect(card.zone).toContain("Roma Norte");
  });
});

describe("buildShelterPetCard", () => {
  let pets: PetProfile[];

  beforeAll(async () => {
    pets = await getAdoptionDemoPets();
  });

  it("marca como adoptable a una mascota en adopción", () => {
    const mila = pets.find((pet) => pet.id === "mila");
    if (mila) {
      const card = buildShelterPetCard(mila);
      expect(card.adoptable).toBe(true);
      expect(card.statusLabel).toBe("En adopción");
      expect(card.adoptionHref).toBe("/adopciones/PC-MILA-001");
    }
  });

  it("nunca marca como adoptable a una mascota fallecida", () => {
    const canela = pets.find((pet) => pet.id === "canela");
    if (canela) {
      const card = buildShelterPetCard(canela);
      expect(card.adoptable).toBe(false);
      expect(card.statusLabel).toBe("En memoria");
    }
  });

  it("nunca marca como adoptable a una mascota perdida", () => {
    const bruno = pets.find((pet) => pet.id === "bruno");
    if (bruno) {
      const card = buildShelterPetCard(bruno);
      expect(card.adoptable).toBe(false);
      expect(card.statusLabel).toBe("Perdido");
    }
  });
});

describe("filterAdoptablePets sobre los mocks", () => {
  it("solo deja disponibles a las mascotas en adopción sin modo perdido ni estado terminal", async () => {
    const adoptable = filterAdoptablePets(await getAdoptionDemoPets());
    const ids = adoptable.map((pet) => pet.id).sort();
    expect(ids).toEqual(["luna", "mila", "rocky", "simba", "toby"]);
  });
});

describe("normalizeSocialUrl", () => {
  it("normaliza URLs sin protocolo", () => {
    expect(normalizeSocialUrl("facebook.com/patitas")).toBe("https://facebook.com/patitas");
    expect(normalizeSocialUrl("https://instagram.com/patitas")).toBe("https://instagram.com/patitas");
  });

  it("devuelve vacío para cadenas vacías", () => {
    expect(normalizeSocialUrl("   ")).toBe("");
  });
});
