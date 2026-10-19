import { describe, expect, it } from "vitest";
import { staticPetDirectory } from "@/lib/infra/directory/staticPets";

describe("staticPetDirectory", () => {
  describe("listProfilePets", () => {
    it("devuelve los perfiles de la fuente estática", async () => {
      const pets = await staticPetDirectory.listProfilePets();

      expect(pets.length).toBeGreaterThan(0);
      expect(pets.every((pet) => typeof pet.id === "string")).toBe(true);
    });

    it("expone perfiles ya validados por el contrato de dominio", async () => {
      for (const pet of await staticPetDirectory.listProfilePets()) {
        expect(pet.identificacion.codigoPublico).toMatch(/^PC-/);
      }
    });
  });

  describe("listAdoptionPets", () => {
    it("devuelve el catálogo de adopción del prototipo", async () => {
      expect((await staticPetDirectory.listAdoptionPets()).length).toBeGreaterThan(0);
    });

    it("es un conjunto disjunto de los perfiles propios", async () => {
      const profileIds = new Set((await staticPetDirectory.listProfilePets()).map((pet) => pet.id));
      const overlapping = (await staticPetDirectory.listAdoptionPets())
        .filter((pet) => profileIds.has(pet.id));

      expect(overlapping).toEqual([]);
    });
  });

  describe("findProfilePet", () => {
    it("resuelve por id interno", async () => {
      const pet = await staticPetDirectory.findProfilePet("lucca");

      expect(pet?.identificacion.codigoPublico).toBe("PC-LUCCA-001");
    });

    it("resuelve por codigoPublico (alias estable de la ruta canónica)", async () => {
      expect((await staticPetDirectory.findProfilePet("PC-LUCCA-001"))?.id).toBe("lucca");
    });

    it("ignora espacios alrededor del identificador", async () => {
      expect((await staticPetDirectory.findProfilePet("  PC-LUCCA-001  "))?.id).toBe("lucca");
    });

    it("devuelve null ante un identificador desconocido", async () => {
      expect(await staticPetDirectory.findProfilePet("no-existe-xyz")).toBeNull();
    });

    it("devuelve null y nunca undefined ante identificadores vacíos", async () => {
      expect(await staticPetDirectory.findProfilePet("")).toBeNull();
      expect(await staticPetDirectory.findProfilePet("   ")).toBeNull();
    });
  });

  describe("findAdoptionPet", () => {
    it("resuelve una mascota del catálogo de adopción", async () => {
      const [firstAdoption] = await staticPetDirectory.listAdoptionPets();
      const found = await staticPetDirectory.findAdoptionPet(firstAdoption.id);

      expect(found?.id).toBe(firstAdoption.id);
    });

    it("no encuentra mascotas que solo existen como perfil propio", async () => {
      expect(await staticPetDirectory.findAdoptionPet("lucca")).toBeNull();
    });

    it("devuelve null ante un identificador desconocido", async () => {
      expect(await staticPetDirectory.findAdoptionPet("no-existe-xyz")).toBeNull();
    });
  });
});
