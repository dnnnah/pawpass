import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getPublicProfilePath,
  getPublicProfileUrl,
  resolvePublicProfileBaseUrl,
} from "./publicProfileUrl";
import mascotas from "@/data/mascotas.json";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getPublicProfilePath", () => {
  it("genera la ruta canónica con codigoPublico", () => {
    expect(getPublicProfilePath("PC-LUCCA-001")).toBe("/p/PC-LUCCA-001");
  });

  it("normaliza espacios al inicio y al final", () => {
    expect(getPublicProfilePath("  PC-LUCCA-001  ")).toBe("/p/PC-LUCCA-001");
  });

  it("retorna null ante código vacío, en blanco o ausente", () => {
    expect(getPublicProfilePath("")).toBeNull();
    expect(getPublicProfilePath("   ")).toBeNull();
    expect(getPublicProfilePath(null)).toBeNull();
    expect(getPublicProfilePath(undefined)).toBeNull();
  });
});

describe("getPublicProfileUrl", () => {
  const pet = {
    id: "lucca",
    identificacion: { codigoPublico: "PC-LUCCA-001" },
  };

  it("genera la URL canónica a partir del código público", () => {
    expect(getPublicProfileUrl("PC-LUCCA-001")).toBe("/p/PC-LUCCA-001");
  });

  it("acepta un perfil y NO depende de pet.id", () => {
    expect(getPublicProfileUrl(pet)).toBe("/p/PC-LUCCA-001");
    expect(getPublicProfileUrl(pet)).not.toContain("lucca");
  });

  it("usa codigoPublico aunque pet.id sea distinto", () => {
    const petWithDifferentId = { id: "otro-slug", identificacion: { codigoPublico: "PC-FREYA-001" } };
    expect(getPublicProfileUrl(petWithDifferentId)).toBe("/p/PC-FREYA-001");
  });

  it("compone la URL completa cuando existe NEXT_PUBLIC_APP_URL", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://pawpass.example");
    expect(getPublicProfileUrl(pet)).toBe("https://pawpass.example/p/PC-LUCCA-001");
  });

  it("normaliza la base URL sin barra final", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://pawpass.example///");
    expect(getPublicProfileUrl(pet)).toBe("https://pawpass.example/p/PC-LUCCA-001");
  });

  it("colapsa a ruta relativa si la base URL está vacía", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    expect(getPublicProfileUrl(pet)).toBe("/p/PC-LUCCA-001");
  });

  it("retorna null ante datos inválidos (fuera del contrato)", () => {
    expect(getPublicProfileUrl("")).toBeNull();
    expect(getPublicProfileUrl({ identificacion: { codigoPublico: "" } })).toBeNull();
    expect(
      getPublicProfileUrl({ identificacion: { codigoPublico: undefined as unknown as string } }),
    ).toBeNull();
  });
});

describe("resolvePublicProfileBaseUrl", () => {
  it("retorna cadena vacía sin variable de entorno", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", undefined);
    expect(resolvePublicProfileBaseUrl()).toBe("");
  });
});

describe("URLs públicas de los datos reales (nunca pet.id)", () => {
  it("cada perfil de mascotas.json genera su URL canónica por codigoPublico", () => {
    for (const pet of mascotas) {
      const url = getPublicProfileUrl(pet);
      expect(url).toContain(pet.identificacion.codigoPublico);
      expect(url).not.toContain(pet.id);
    }
  });
});
