import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  exchange: vi.fn(),
  getUser: vi.fn(),
  upsert: vi.fn(),
  hasEnv: vi.fn(),
}));
vi.mock("next/headers", () => ({ cookies: async () => ({ getAll: () => [], set: vi.fn() }) }));
vi.mock("@/lib/infra/supabase/env", () => ({ hasSupabaseEnv: mocks.hasEnv }));
vi.mock("@/lib/infra/supabase/server", () => ({
  createSupabaseServerClient: () => ({
    auth: { exchangeCodeForSession: mocks.exchange, getUser: mocks.getUser },
    from: () => ({ upsert: mocks.upsert }),
  }),
}));

import { GET } from "./route";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.hasEnv.mockReturnValue(true);
  mocks.exchange.mockResolvedValue({ error: null });
  mocks.getUser.mockResolvedValue({ data: { user: { id: "owner-1", user_metadata: {} } } });
  mocks.upsert.mockResolvedValue({ error: null });
});

describe("callback de Supabase Auth", () => {
  it("envía recuperación válida al formulario de contraseña nueva y conserva el destino interno", async () => {
    const response = await GET(new Request("https://pet-carnet.vercel.app/auth/callback?code=pkce-code&flow=recovery&next=%2Fcuenta%3Ftab%3Dperfil"));

    expect(mocks.exchange).toHaveBeenCalledWith("pkce-code");
    expect(response.headers.get("location")).toBe("https://pet-carnet.vercel.app/restablecer-contrasena?next=%2Fcuenta%3Ftab%3Dperfil");
  });

  it("muestra el estado de enlace vencido dentro de recuperación", async () => {
    const response = await GET(new Request("https://pet-carnet.vercel.app/auth/callback?flow=recovery&error=access_denied&error_code=otp_expired&next=%2Fmis-mascotas"));
    const location = new URL(response.headers.get("location")!);

    expect(location.pathname).toBe("/restablecer-contrasena");
    expect(location.searchParams.get("error")).toBe("expired");
    expect(location.searchParams.get("next")).toBe("/mis-mascotas");
    expect(mocks.exchange).not.toHaveBeenCalled();
  });
});
