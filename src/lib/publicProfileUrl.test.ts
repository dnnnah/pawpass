import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getPublicProfilePath,
  getPublicProfileUrl,
  getVoluntaryProfilePath,
  normalizePublicProfileCode,
  resolvePublicProfileCode,
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

describe("getVoluntaryProfilePath", () => {
  it("enlaza solo el perfil que devuelve el contrato público para un estado permitido", () => {
    expect(getVoluntaryProfilePath("PC-LUCCA-001", "en_casa", "PC-LUCCA-001")).toBe("/perfil/PC-LUCCA-001");
    expect(getVoluntaryProfilePath("PC-LUCCA-001", "en_casa", null)).toBeNull();
    expect(getVoluntaryProfilePath("PC-LUCCA-001", "perdido", "PC-LUCCA-001")).toBe("/perfil/PC-LUCCA-001");
    expect(getVoluntaryProfilePath("PC-LUCCA-001", "en_casa", "PC-OTRA-001")).toBeNull();
  });
});

describe("código público desde entrada manual o QR", () => {
  it("normaliza el código y acepta únicamente el formato público", () => {
    expect(normalizePublicProfileCode(" pc-lucca-001 ")).toBe("PC-LUCCA-001");
    expect(normalizePublicProfileCode("PC-CHICHARRONA-001")).toBe("PC-CHICHARRONA-001");
    expect(normalizePublicProfileCode("https://evil.example/p/PC-LUCCA-001")).toBeNull();
    expect(normalizePublicProfileCode("PC-LUCCA-1")).toBeNull();
  });

  it("acepta solo enlaces a fichas de PawPass del dominio canónico o del sitio actual", () => {
    expect(resolvePublicProfileCode("https://pet-carnet.vercel.app/p/PC-LUCCA-001")).toBe("PC-LUCCA-001");
    expect(resolvePublicProfileCode("https://evil.example/p/PC-LUCCA-001")).toBeNull();
    expect(resolvePublicProfileCode("https://pet-carnet.vercel.app/p/PC-LUCCA-001?next=https://evil.example")).toBeNull();
    expect(resolvePublicProfileCode("/p/PC-LUCCA-001", "https://preview.example")).toBe("PC-LUCCA-001");
  });
});

describe("getPublicProfileUrl", () => {
  const pet = {
    id: "lucca",
    identificacion: { codigoPublico: "PC-LUCCA-001" },
  };

  it("genera la URL canónica a partir del código público", () => {
    expect(getPublicProfileUrl("PC-LUCCA-001")).toBe("https://pet-carnet.vercel.app/p/PC-LUCCA-001");
  });

  it("acepta un perfil y NO depende de pet.id", () => {
    expect(getPublicProfileUrl(pet)).toBe("https://pet-carnet.vercel.app/p/PC-LUCCA-001");
    expect(getPublicProfileUrl(pet)).not.toContain("lucca");
  });

  it("usa codigoPublico aunque pet.id sea distinto", () => {
    const petWithDifferentId = { id: "otro-slug", identificacion: { codigoPublico: "PC-FREYA-001" } };
    expect(getPublicProfileUrl(petWithDifferentId)).toBe("https://pet-carnet.vercel.app/p/PC-FREYA-001");
  });

  it("compone la URL completa cuando existe NEXT_PUBLIC_APP_URL", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://pawpass.example");
    expect(getPublicProfileUrl(pet)).toBe("https://pawpass.example/p/PC-LUCCA-001");
  });

  it("normaliza la base URL sin barra final", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://pawpass.example///");
    expect(getPublicProfileUrl(pet)).toBe("https://pawpass.example/p/PC-LUCCA-001");
  });

  it("usa solo el origen cuando la base trae una ruta extra", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://pawpass.example/subruta///");
    expect(getPublicProfileUrl(pet)).toBe("https://pawpass.example/p/PC-LUCCA-001");
  });

  it("usa el dominio canónico cuando la base URL está vacía", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    expect(getPublicProfileUrl(pet)).toBe("https://pet-carnet.vercel.app/p/PC-LUCCA-001");
  });

  it("retorna null ante datos inválidos (fuera del contrato)", () => {
    expect(getPublicProfileUrl("")).toBeNull();
    expect(getPublicProfileUrl({ identificacion: { codigoPublico: "" } })).toBeNull();
    expect(
      getPublicProfileUrl({ identificacion: { codigoPublico: undefined as unknown as string } }),
    ).toBeNull();
  });

  it("no genera QR público con localhost en producción", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
    expect(getPublicProfileUrl(pet)).toBe("https://pet-carnet.vercel.app/p/PC-LUCCA-001");
  });

  it("usa el dominio canónico en producción si NEXT_PUBLIC_APP_URL es un preview", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://pawpass-git-feature.vercel.app");
    expect(getPublicProfileUrl(pet)).toBe("https://pet-carnet.vercel.app/p/PC-LUCCA-001");
  });
});

describe("resolvePublicProfileBaseUrl", () => {
  it("usa el dominio canónico sin variable de entorno", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", undefined);
    expect(resolvePublicProfileBaseUrl()).toBe("https://pet-carnet.vercel.app");
  });
});

describe("URLs públicas de los datos reales (nunca pet.id)", () => {
  it("cada perfil de mascotas.json genera su URL canónica por codigoPublico", () => {
    for (const pet of mascotas) {
      const url = getPublicProfileUrl(pet);
      expect(url).toBe(`https://pet-carnet.vercel.app/p/${encodeURIComponent(pet.identificacion.codigoPublico)}`);
      expect(url).not.toContain(pet.id);
    }
  });
});
