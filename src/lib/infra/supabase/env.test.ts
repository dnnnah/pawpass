import { afterEach, describe, expect, it, vi } from "vitest";
import { getSupabaseEnv, hasSupabaseEnv } from "@/lib/infra/supabase/env";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("entorno de Supabase", () => {
  it("expone url y anon key cuando están configuradas", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "public-anon-key");

    expect(hasSupabaseEnv()).toBe(true);
    expect(getSupabaseEnv()).toEqual({
      url: "https://example.supabase.co",
      anonKey: "public-anon-key",
    });
  });

  it("prefiere la publishable key moderna cuando está disponible", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable-key");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "legacy-anon-key");

    expect(getSupabaseEnv()).toEqual({
      url: "https://example.supabase.co",
      anonKey: "sb_publishable-key",
    });
  });

  it("no está disponible y lanza si falta configuración", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");

    expect(hasSupabaseEnv()).toBe(false);
    expect(() => getSupabaseEnv()).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });

  it("no está disponible si falta solo una de las dos variables", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");

    expect(hasSupabaseEnv()).toBe(false);
  });

  it("acepta solo la publishable key", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable-key");

    expect(hasSupabaseEnv()).toBe(true);
  });

  it("rechaza un identificador de proyecto en lugar de una URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "gjolkedvspnmueqatqyt");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable-key");

    expect(hasSupabaseEnv()).toBe(false);
    expect(() => getSupabaseEnv()).toThrow(/URL HTTPS/);
  });
});
