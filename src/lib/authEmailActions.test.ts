import { describe, expect, it, vi } from "vitest";
import { requestMagicLink, requestPasswordRecovery } from "./authEmailActions";

describe("solicitudes de acceso por correo", () => {
  it("envía Magic Link sin permitir crear una cuenta nueva", async () => {
    const signInWithOtp = vi.fn().mockResolvedValue({ data: {}, error: null });
    const client = { auth: { signInWithOtp, resetPasswordForEmail: vi.fn() } };

    await requestMagicLink(client, "persona@example.com", "https://pet-carnet.vercel.app/auth/callback?next=%2Fmis-mascotas");

    expect(signInWithOtp).toHaveBeenCalledWith({
      email: "persona@example.com",
      options: {
        shouldCreateUser: false,
        emailRedirectTo: "https://pet-carnet.vercel.app/auth/callback?next=%2Fmis-mascotas",
      },
    });
  });

  it("envía recuperación a un callback interno configurado", async () => {
    const resetPasswordForEmail = vi.fn().mockResolvedValue({ data: {}, error: null });
    const client = { auth: { signInWithOtp: vi.fn(), resetPasswordForEmail } };

    await requestPasswordRecovery(client, "persona@example.com", "https://pet-carnet.vercel.app/auth/callback?flow=recovery");

    expect(resetPasswordForEmail).toHaveBeenCalledWith("persona@example.com", {
      redirectTo: "https://pet-carnet.vercel.app/auth/callback?flow=recovery",
    });
  });
});
