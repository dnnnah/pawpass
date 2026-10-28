import { afterEach, describe, expect, it, vi } from "vitest";
import { loadPublicLostPets } from "./lostDirectory";

afterEach(() => vi.unstubAllEnvs());

describe("directorio de alertas perdidas", () => {
  it("no sustituye datos reales por fixtures si falta Supabase en producción", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");

    const result = await loadPublicLostPets();

    expect(result.pets).toEqual([]);
    expect(result.error).toMatch(/Supabase|alertas/i);
  });
});
