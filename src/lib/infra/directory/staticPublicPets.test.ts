import { describe, expect, it } from "vitest";
import { staticPublicPetDirectory } from "@/lib/infra/directory/staticPublicPets";

describe("staticPublicPetDirectory", () => {
  it("resuelve una ficha por código público", async () => {
    const card = await staticPublicPetDirectory.findPublicPet("  PC-LUCCA-001 ");

    expect(card?.publicCode).toBe("PC-LUCCA-001");
    expect(card?.name).toBe("Lucca");
    expect(card?.contact).toMatchObject({ phone: "5646091856", whatsapp: null, email: null });
  });

  it("devuelve null para una mascota inexistente", async () => {
    await expect(staticPublicPetDirectory.findPublicPet("PC-NO-EXISTE-999")).resolves.toBeNull();
  });

  it("también resuelve códigos del catálogo de adopción", async () => {
    await expect(staticPublicPetDirectory.findPublicPet("PC-BRUNO-001")).resolves.toMatchObject({
      name: "Bruno",
      status: "perdido",
    });
  });

  it("incluye solo mascotas perdidas en el directorio estático de rescate", async () => {
    const pets = await staticPublicPetDirectory.listLostPets();
    expect(pets.length).toBeGreaterThan(0);
    expect(pets.every((pet) => pet.status === "perdido" && pet.lost !== null)).toBe(true);
  });
});
