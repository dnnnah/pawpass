import { describe, expect, it } from "vitest";
import { splitLostPetLists } from "./lostPets";
import type { AccountPet } from "./pets";
import type { PublicPetCard } from "@/types/publicPet";

const ownerPet = (publicCode: string, status: AccountPet["status"]): AccountPet => ({
  id: publicCode, publicCode, name: publicCode, status, species: "perro", slug: null, breed: null,
  role: "administrador", startedAt: "2026-10-26T00:00:00Z",
});
const publicPet = (publicCode: string): PublicPetCard => ({
  publicCode, name: publicCode, species: "Perro", breed: null, photoUrl: null, status: "perdido",
  zone: null, lost: null, contact: null, emergencyCareNote: null, recentPhotos: [], vaccinationStatus: null,
});

describe("prioridad y deduplicación del directorio de rescate", () => {
  it("muestra primero las alertas propias y retira sus códigos del listado público", () => {
    const result = splitLostPetLists(
      [ownerPet("PC-CASA-001", "en_casa"), ownerPet("PC-MIA-001", "perdido")],
      [publicPet("PC-MIA-001"), publicPet("PC-OTRA-001")],
    );
    expect(result.owned.map((pet) => pet.publicCode)).toEqual(["PC-MIA-001"]);
    expect(result.community.map((pet) => pet.publicCode)).toEqual(["PC-OTRA-001"]);
  });
});
