import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ authorize: vi.fn(), adminFactory: vi.fn(), deleteUser: vi.fn() }));
vi.mock("@/app/api/_account", () => ({ authorizeDeletion: mocks.authorize }));
vi.mock("@/lib/infra/supabase/admin", () => ({ createSupabaseAdminClient: mocks.adminFactory }));
import { DELETE } from "./route";

function accountAccess(count: number | null, error: object | null = null) {
  const chain = { select: vi.fn(), eq: vi.fn(), is: vi.fn().mockResolvedValue({ count, error }) };
  chain.select.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  return { user: { id: "current-user" }, supabase: { from: vi.fn().mockReturnValue(chain), auth: { signOut: vi.fn().mockResolvedValue({ error: null }) } } };
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("SUPABASE_SECRET_KEY", "test-secret");
  mocks.adminFactory.mockReturnValue({ auth: { admin: { deleteUser: mocks.deleteUser } } });
  mocks.deleteUser.mockResolvedValue({ error: null });
});
afterEach(() => vi.unstubAllEnvs());

describe("eliminar la cuenta autenticada", () => {
  it("no usa privilegios de administrador sin una sesión autorizada", async () => {
    mocks.authorize.mockResolvedValue(new Response(null, { status: 401 }));
    expect((await DELETE(new Request("https://app.test/api/cuenta"))).status).toBe(401);
    expect(mocks.adminFactory).not.toHaveBeenCalled();
  });
  it("bloquea la eliminación mientras haya mascotas asociadas", async () => {
    mocks.authorize.mockResolvedValue(accountAccess(2));
    expect((await DELETE(new Request("https://app.test/api/cuenta"))).status).toBe(409);
    expect(mocks.adminFactory).not.toHaveBeenCalled();
  });
  it("no elimina si no pudo comprobar las asociaciones", async () => {
    mocks.authorize.mockResolvedValue(accountAccess(null, {}));
    expect((await DELETE(new Request("https://app.test/api/cuenta"))).status).toBe(503);
    expect(mocks.deleteUser).not.toHaveBeenCalled();
  });
  it("elimina exclusivamente al usuario que confirmó con su sesión", async () => {
    mocks.authorize.mockResolvedValue(accountAccess(0));
    expect((await DELETE(new Request("https://app.test/api/cuenta"))).status).toBe(200);
    expect(mocks.deleteUser).toHaveBeenCalledWith("current-user");
  });
  it("no confirma éxito si Auth rechaza la eliminación", async () => {
    mocks.authorize.mockResolvedValue(accountAccess(0));
    mocks.deleteUser.mockResolvedValue({ error: { message: "internal" } });
    expect((await DELETE(new Request("https://app.test/api/cuenta"))).status).toBe(503);
  });
  it("explica la falta de una credencial privada sin intentar eliminar", async () => {
    vi.stubEnv("SUPABASE_SECRET_KEY", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    mocks.authorize.mockResolvedValue(accountAccess(0));
    const response = await DELETE(new Request("https://app.test/api/cuenta"));
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ error: expect.stringContaining("credencial privada") });
    expect(mocks.adminFactory).not.toHaveBeenCalled();
    expect(mocks.deleteUser).not.toHaveBeenCalled();
  });
});
