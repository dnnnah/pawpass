import { describe, expect, it } from "vitest";
import { safeAuthNextPath } from "./authRedirect";

describe("retorno después de iniciar sesión", () => {
  it.each([null, "", "https://otro.test", "//otro.test", "/\\otro.test", "/\notro.test"])("lleva a mis mascotas ante un retorno no válido", value => {
    expect(safeAuthNextPath(value)).toBe("/mis-mascotas");
  });
  it("conserva una ruta privada interna y sus parámetros", () => {
    expect(safeAuthNextPath("/cuenta/mascotas/pet-1?seccion=vacunas")).toBe("/cuenta/mascotas/pet-1?seccion=vacunas");
  });
});
