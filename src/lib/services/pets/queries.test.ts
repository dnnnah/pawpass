import { describe, expect, it } from "vitest";
import {
  getAdoptionDemoPets,
  getAllPets,
  getAllProfilePets,
  getPetById,
  getPetByIdAny,
} from "@/lib/services/pets/queries";

describe("getPetById", () => {
  it("resuelve por id interno existente", async () => {
    expect((await getPetById("lucca"))?.identificacion.codigoPublico).toBe("PC-LUCCA-001");
  });

  it("resuelve por codigoPublico como alias estable (ruta canónica)", async () => {
    expect((await getPetById("PC-LUCCA-001"))?.id).toBe("lucca");
  });

  it("resuelve ignorando espacios alrededor del identificador", async () => {
    expect((await getPetById("  PC-LUCCA-001  "))?.id).toBe("lucca");
  });

  it("retorna null ante un identificador desconocido", async () => {
    expect(await getPetById("no-existe-xyz")).toBeNull();
  });

  it("normaliza a null en lugar de undefined (contrato uniforme)", async () => {
    expect(await getPetById("no-existe-xyz")).not.toBeUndefined();
    expect(await getPetById("")).toBeNull();
  });
});

describe("getPetByIdAny", () => {
  it("resuelve una mascota con perfil propio", async () => {
    expect((await getPetByIdAny("lucca"))?.id).toBe("lucca");
  });

  it("resuelve por codigoPublico de un perfil propio", async () => {
    expect((await getPetByIdAny("PC-LUCCA-001"))?.id).toBe("lucca");
  });

  it("resuelve como fallback una mascota del catálogo de adopción", async () => {
    const [firstAdoption] = await getAdoptionDemoPets();

    expect((await getPetByIdAny(firstAdoption.id))?.id).toBe(firstAdoption.id);
  });

  it("prioriza el perfil propio sobre el catálogo de adopción", async () => {
    const own = await getPetByIdAny("lucca");
    const byPublicCode = await getPetByIdAny("PC-LUCCA-001");

    expect(own).toEqual(byPublicCode);
  });

  it("retorna null cuando la mascota no existe en ninguna fuente", async () => {
    expect(await getPetByIdAny("no-existe-xyz")).toBeNull();
  });

  it("retorna null y nunca undefined ante identificadores vacíos", async () => {
    expect(await getPetByIdAny("")).toBeNull();
    expect(await getPetByIdAny("   ")).toBeNull();
  });
});

describe("getAllProfilePets", () => {
  it("concatena perfiles propios y catálogo de adopción", async () => {
    const [all, adoption, profile] = await Promise.all([
      getAllPets(),
      getAdoptionDemoPets(),
      getAllProfilePets(),
    ]);

    expect(profile).toHaveLength(all.length + adoption.length);
  });

  it("no contiene identificadores duplicados", async () => {
    const ids = (await getAllProfilePets()).map((pet) => pet.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("mantiene los perfiles propios antes que el catálogo de adopción", async () => {
    const [pets, all] = await Promise.all([getAllProfilePets(), getAllPets()]);

    expect(pets.slice(0, all.length)).toEqual(all);
  });
});
