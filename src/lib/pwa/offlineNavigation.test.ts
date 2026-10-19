import { describe, expect, it } from "vitest";
import {
  resolveInternalTarget,
  resolveLinkPrecheck,
  resolveOfflineNavigation,
  toCacheKey,
} from "@/lib/pwa/offlineNavigation";

const ORIGIN = "https://pawpass.example";
const CURRENT = `${ORIGIN}/perfil/lucca`;

describe("resolveLinkPrecheck", () => {
  it("inspecciona un enlace interno solo cuando no hay conexión", () => {
    expect(
      resolveLinkPrecheck({
        connectivity: "offline",
        modifiedActivation: false,
        internal: true,
        sameDocument: false,
      })
    ).toBe("inspect");
  });

  it("no intercepta con conexión: el navegador no tiene por qué enterarse", () => {
    for (const connectivity of ["online", "unknown"] as const) {
      expect(
        resolveLinkPrecheck({
          connectivity,
          modifiedActivation: false,
          internal: true,
          sameDocument: false,
        })
      ).toBe("ignore");
    }
  });

  it("no intercepta si el clic lleva modificador (abrir en otra pestaña)", () => {
    expect(
      resolveLinkPrecheck({
        connectivity: "offline",
        modifiedActivation: true,
        internal: true,
        sameDocument: false,
      })
    ).toBe("ignore");
  });

  it("no intercepta destinos externos", () => {
    expect(
      resolveLinkPrecheck({
        connectivity: "offline",
        modifiedActivation: false,
        internal: false,
        sameDocument: false,
      })
    ).toBe("ignore");
  });

  it("no intercepta un salto dentro de la misma página", () => {
    // `href="#contacto"` debe seguir llevando a la sección, también sin señal.
    expect(
      resolveLinkPrecheck({
        connectivity: "offline",
        modifiedActivation: false,
        internal: true,
        sameDocument: true,
      })
    ).toBe("ignore");
  });
});

describe("resolveOfflineNavigation", () => {
  it("permite navegar con copia local", () => {
    expect(resolveOfflineNavigation({ connectivity: "offline", cached: true })).toBe("allow");
  });

  it("detiene la navegación sin conexión cuando no hay copia local", () => {
    expect(resolveOfflineNavigation({ connectivity: "offline", cached: false })).toBe("block");
  });

  it("con conexión nunca detiene, haya copia o no", () => {
    expect(resolveOfflineNavigation({ connectivity: "online", cached: false })).toBe("allow");
  });

  it("nunca detiene por una suposición: `unknown` deja pasar", () => {
    // Durante SSR y el primer render cliente no se sabe el estado de la red.
    // Bloquear ahí convertiría una duda en una pantalla de error.
    expect(resolveOfflineNavigation({ connectivity: "unknown", cached: false })).toBe("allow");
  });

  it("no distingue online de offline en la respuesta cuando hay red", () => {
    const transicion = [
      resolveOfflineNavigation({ connectivity: "offline", cached: true }),
      resolveOfflineNavigation({ connectivity: "online", cached: true }),
    ];
    expect(transicion).toEqual(["allow", "allow"]);
  });
});

describe("resolveInternalTarget", () => {
  it("clasifica un enlace interno relativo", () => {
    const target = resolveInternalTarget("/adopciones", CURRENT);
    expect(target).toEqual({
      internal: true,
      pathname: "/adopciones",
      sameDocument: false,
    });
  });

  it("reconoce un enlace interno absoluto del mismo origen", () => {
    expect(resolveInternalTarget(`${ORIGIN}/login`, CURRENT)?.internal).toBe(true);
  });

  it("rechaza un destino de otro origen", () => {
    const target = resolveInternalTarget("https://ejemplo.com/pets", CURRENT);
    expect(target?.internal).toBe(false);
  });

  it("detecta protocolo no http (mailto, tel, whatsapp)", () => {
    for (const href of ["tel:+5255555555", "mailto:a@b.com", "https://wa.me/5255"]) {
      expect(resolveInternalTarget(href, CURRENT)?.internal, href).toBe(false);
    }
  });

  it("trata un salto de fragmento como la misma página", () => {
    expect(resolveInternalTarget("#contacto", CURRENT)?.sameDocument).toBe(true);
    expect(resolveInternalTarget("#contacto", CURRENT)?.pathname).toBe("/perfil/lucca");
  });

  it("no es la misma página si cambia la ruta, aunque cambie solo el fragmento", () => {
    expect(resolveInternalTarget("/adopciones#filtro", CURRENT)?.sameDocument).toBe(false);
  });

  it("no es la misma página si cambia el query", () => {
    expect(resolveInternalTarget("/perfil/lucca?tab=salud", CURRENT)?.sameDocument).toBe(false);
  });

  it("devuelve null para entradas inválidas en vez de lanzar", () => {
    for (const href of [null, undefined, "", "http://"]) {
      expect(resolveInternalTarget(href, CURRENT), String(href)).toBeNull();
    }
  });

  it("acepta una ruta relativa rara, porque el navegador también la acepta", () => {
    // `::::` no es inválido para `new URL`: se resuelve como ruta relativa.
    // Rechazarlo aquí haría que este enlace se ignorara offline mientras el
    // navegador lo habría resuelto sin problema. La única fuente de verdad es
    // lo que hace el navegador, y este test la fija a propósito.
    expect(resolveInternalTarget("::::", CURRENT)).toEqual({
      internal: true,
      pathname: "/perfil/::::",
      sameDocument: false,
    });
  });

  it("devuelve null si la URL actual no es válida", () => {
    expect(resolveInternalTarget("/adopciones", "no-es-una-url")).toBeNull();
  });
});

describe("toCacheKey", () => {
  it("deja la raíz como está", () => {
    expect(toCacheKey("/")).toBe("/");
    expect(toCacheKey("")).toBe("/");
  });

  it("quita la barra final para no perder la entrada en caché", () => {
    expect(toCacheKey("/adopciones/")).toBe("/adopciones");
    expect(toCacheKey("/perfil/lucca/")).toBe("/perfil/lucca");
  });

  it("no toca las rutas con identificador", () => {
    expect(toCacheKey("/perfil/PC-LUCCA-001")).toBe("/perfil/PC-LUCCA-001");
    expect(toCacheKey("/refugios/patitas-con-causa")).toBe("/refugios/patitas-con-causa");
  });

  it("una ruta de solo barras vuelve a la raíz", () => {
    expect(toCacheKey("//")).toBe("/");
    expect(toCacheKey("///")).toBe("/");
  });
});
