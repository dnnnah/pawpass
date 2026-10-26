import { afterEach, describe, expect, it, vi } from "vitest";
import { getEnabledOAuthProviders } from "./authProviders";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

function mockSettings(settings: unknown, status = 200) {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(settings), { status })));
}

describe("métodos OAuth disponibles", () => {
  it("solo permite proveedores habilitados explícitamente por Auth", async () => {
    mockSettings({ external: { google: true, apple: false } });
    await expect(getEnabledOAuthProviders()).resolves.toEqual({ google: true, apple: false });
  });

  it("no habilita proveedores con datos ausentes o valores distintos de true", async () => {
    mockSettings({ external: { google: "false" } });
    await expect(getEnabledOAuthProviders()).resolves.toEqual({ google: false, apple: false });
  });

  it("rechaza errores de Auth en vez de asumir que OAuth está disponible", async () => {
    mockSettings({ error: "unavailable" }, 503);
    await expect(getEnabledOAuthProviders()).rejects.toThrow("métodos de acceso");
  });
});
