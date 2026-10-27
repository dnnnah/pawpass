import { describe, expect, it } from "vitest";
import { getActiveSiteNavigationHref } from "./siteNavigation";

describe("destino activo del menú principal", () => {
  it.each([
    ["/cuenta/mascotas/pet-1", "/mis-mascotas"],
    ["/cuenta/mascotas/pet-1/alerta", "/mis-mascotas"],
    ["/cuenta", "/cuenta"],
    ["/cuenta/ajustes", "/cuenta"],
    ["/perfil/PC-LUCCA-001", "/mascotas"],
    ["/perfil/PC-LUCCA-001/carnet", "/mascotas"],
    ["/perdidas", "/perdidas"],
    ["/login", "/login"],
    ["/p/PC-LUCCA-001", null],
  ] as const)("resuelve %s a un solo destino", (pathname, expected) => {
    expect(getActiveSiteNavigationHref(pathname, pathname !== "/login")).toBe(expected);
  });
});
