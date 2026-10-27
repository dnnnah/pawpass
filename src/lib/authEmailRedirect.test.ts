import { describe, expect, it } from "vitest";
import { buildAuthEmailCallbackUrl } from "./authEmailRedirect";

describe("retorno de correos de Auth", () => {
  it("usa el dominio canónico en producción aunque la solicitud venga de una preview", () => {
    expect(buildAuthEmailCallbackUrl({
      pathname: "/auth/callback",
      query: { flow: "recovery", next: "/cuenta?tab=perfil" },
      isProduction: true,
      browserOrigin: "https://pawpass-git-preview.vercel.app",
      productionOrigin: "https://pet-carnet.vercel.app",
    })).toBe("https://pet-carnet.vercel.app/auth/callback?flow=recovery&next=%2Fcuenta%3Ftab%3Dperfil");
  });

  it("conserva el origen local en desarrollo para que el enlace vuelva al entorno abierto", () => {
    expect(buildAuthEmailCallbackUrl({
      pathname: "/auth/callback",
      query: { next: "/mis-mascotas" },
      isProduction: false,
      browserOrigin: "http://localhost:3000",
      productionOrigin: "https://pet-carnet.vercel.app",
    })).toBe("http://localhost:3000/auth/callback?next=%2Fmis-mascotas");
  });
});
