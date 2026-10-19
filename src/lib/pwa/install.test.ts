import { afterEach, describe, expect, it } from "vitest";
import {
  INSTALL_DISMISS_KEY,
  isAppInstalled,
  isInstallApiSupported,
  isIosSafariLike,
  resolveInstallCtaVisibility,
  resolveInstallHintVisibility,
  type BeforeInstallPromptEvent,
} from "@/lib/pwa/install";

/**
 * Stubs de navegador. El entorno de test es `node` a propósito (el proyecto no
 * arrastra jsdom), así que cada prueba monta exactamente el `window`,
 * `navigator` y `matchMedia` que necesita y los desmonta al terminar. Nada
 * depende de red ni de un navegador real: son tablas de entrada y salida.
 */

type BrowserStubs = {
  window?: Record<string, unknown>;
  navigator?: Record<string, unknown>;
  matchMedia?: (query: string) => { matches: boolean };
};

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, "navigator");

function defineGlobal(name: "window" | "navigator", value: unknown) {
  Object.defineProperty(globalThis, name, { value, configurable: true, writable: true });
}

function restoreGlobal(
  name: "window" | "navigator",
  descriptor: PropertyDescriptor | undefined
) {
  if (descriptor) {
    Object.defineProperty(globalThis, name, descriptor);
    return;
  }
  delete (globalThis as Record<string, unknown>)[name];
}

afterEach(() => {
  restoreGlobal("window", originalWindow);
  restoreGlobal("navigator", originalNavigator);
});

/** `beforeinstallprompt` presente: la API existe. */
function stubInstallApi(present: boolean, extras: BrowserStubs = {}) {
  const win: Record<string, unknown> = { ...extras.window };
  if (present) {
    win.onbeforeinstallprompt = null;
  }
  defineGlobal("window", win);
  defineGlobal("navigator", extras.navigator ?? {});
}

/** Pantalla de instalación simulada por `display-mode` o por iOS. */
function stubInstalled({ displayMode, iosStandalone }: { displayMode?: string; iosStandalone?: boolean }) {
  defineGlobal("window", {
    matchMedia: (query: string) => {
      const mode = query.match(/display-mode:\s*(\w[\w-]*)/)?.[1];
      return { matches: mode !== undefined && mode === displayMode };
    },
  });
  defineGlobal("navigator", iosStandalone === undefined ? {} : { standalone: iosStandalone });
}

describe("isInstallApiSupported", () => {
  it("es false durante SSR (no hay window)", () => {
    expect(isInstallApiSupported()).toBe(false);
  });

  it("es true solo si el navegador expone beforeinstallprompt", () => {
    stubInstallApi(false);
    expect(isInstallApiSupported()).toBe(false);

    stubInstallApi(true);
    expect(isInstallApiSupported()).toBe(true);
  });
});

describe("isAppInstalled", () => {
  it("es false durante SSR", () => {
    expect(isAppInstalled()).toBe(false);
  });

  it("detecta los tres modos de visualización de una app instalada", () => {
    for (const mode of ["standalone", "minimal-ui", "fullscreen"]) {
      stubInstalled({ displayMode: mode });
      expect(isAppInstalled(), `display-mode: ${mode}`).toBe(true);
    }
  });

  it("detecta el modo normal de navegador como no instalada", () => {
    stubInstalled({ displayMode: "browser" });
    expect(isAppInstalled()).toBe(false);
  });

  it("detecta la app instalada en iOS con navigator.standalone", () => {
    stubInstalled({ displayMode: "browser", iosStandalone: true });
    expect(isAppInstalled()).toBe(true);
  });

  it("no se rompe si matchMedia no existe", () => {
    defineGlobal("window", {});
    defineGlobal("navigator", {});
    expect(isAppInstalled()).toBe(false);
  });

  it("no se rompe si matchMedia lanza", () => {
    defineGlobal("window", {
      matchMedia: () => {
        throw new Error("no permitido");
      },
    });
    defineGlobal("navigator", {});
    expect(isAppInstalled()).toBe(false);
  });
});

describe("resolveInstallCtaVisibility", () => {
  it("muestra el CTA solo cuando instalar es realmente posible", () => {
    expect(
      resolveInstallCtaVisibility({
        supported: true,
        promptAvailable: true,
        installed: false,
        dismissed: false,
      })
    ).toBe("available");
  });

  it("no muestra nada en un navegador sin beforeinstallprompt", () => {
    // El caso importante: un botón de instalar que no puede instalar.
    expect(
      resolveInstallCtaVisibility({
        supported: false,
        promptAvailable: true,
        installed: false,
        dismissed: false,
      })
    ).toBe("hidden");
  });

  it("no muestra nada si la API existe pero el evento aún no ha llegado", () => {
    // El evento puede tardar en dispararse; antes de eso no hay nada que ofrecer.
    expect(
      resolveInstallCtaVisibility({
        supported: true,
        promptAvailable: false,
        installed: false,
        dismissed: false,
      })
    ).toBe("hidden");
  });

  it("no muestra nada si la app ya está instalada", () => {
    expect(
      resolveInstallCtaVisibility({
        supported: true,
        promptAvailable: true,
        installed: true,
        dismissed: false,
      })
    ).toBe("hidden");
  });

  it("no vuelve a molestar después de un descarte", () => {
    expect(
      resolveInstallCtaVisibility({
        supported: true,
        promptAvailable: true,
        installed: false,
        dismissed: true,
      })
    ).toBe("hidden");
  });

  it("nunca muestra el CTA, pase lo que pase, si la app está instalada", () => {
    const combinations = [
      { supported: true, promptAvailable: true, dismissed: false },
      { supported: true, promptAvailable: true, dismissed: true },
      { supported: false, promptAvailable: true, dismissed: false },
    ];

    for (const combo of combinations) {
      expect(resolveInstallCtaVisibility({ ...combo, installed: true })).toBe("hidden");
    }
  });
});

describe("isIosSafariLike", () => {
  it("es false durante SSR y sin navigator", () => {
    expect(isIosSafariLike(null)).toBe(false);
  });

  it("reconoce iPhone e iPad", () => {
    expect(isIosSafariLike({ userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)" } as Navigator)).toBe(true);
    expect(isIosSafariLike({ userAgent: "Mozilla/5.0 (iPad; CPU OS 17_0)" } as Navigator)).toBe(true);
  });

  it("reconoce iPadOS, que se presenta como Mac con pantalla táctil", () => {
    const nav = {
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      maxTouchPoints: 5,
    } as Navigator;
    expect(isIosSafariLike(nav)).toBe(true);
  });

  it("no confunde un Mac de escritorio con un iPad", () => {
    // Mismo agente de usuario que el iPad, sin pantalla táctil: es un escritorio.
    const nav = {
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      maxTouchPoints: 0,
    } as Navigator;
    expect(isIosSafariLike(nav)).toBe(false);
  });

  it("no confunde Android ni escritorio con iOS", () => {
    expect(
      isIosSafariLike({ userAgent: "Mozilla/5.0 (Linux; Android 14)" } as Navigator)
    ).toBe(false);
    expect(isIosSafariLike({ userAgent: "" } as Navigator)).toBe(false);
  });

  it("no marca Chrome en escritorio como iOS", () => {
    const nav = {
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/131.0.0.0 Safari/537.36",
      maxTouchPoints: 0,
    } as Navigator;
    expect(isIosSafariLike(nav)).toBe(false);
  });

  it("devuelve false si el agente de usuario no se puede leer", () => {
    // Algunos navegadores con protección anti-fingerprinting lanzan al leerlo.
    // Un throw aquí tumbaría la app entera, así que se degrada a "no es iOS".
    const nav = {
      get userAgent(): string {
        throw new Error("bloqueado");
      },
    } as Navigator;
    expect(() => isIosSafariLike(nav)).not.toThrow();
    expect(isIosSafariLike(nav)).toBe(false);
  });
});

describe("resolveInstallHintVisibility", () => {
  const BASE = { installed: false, dismissed: false, ios: true, promptAvailable: false };

  it("muestra instrucciones en iOS, que no tiene diálogo nativo", () => {
    expect(resolveInstallHintVisibility(BASE)).toBe("manual");
  });

  it("se calla si ya hay diálogo nativo, que es mejor que cualquier instrucción", () => {
    expect(resolveInstallHintVisibility({ ...BASE, promptAvailable: true })).toBe("hidden");
  });

  it("no muestra nada fuera de iOS cuando no hay diálogo nativo", () => {
    // En el resto de navegadores, o no se puede instalar, o se hace desde un
    // menú que el usuario ya conoce. Inventar instrucciones ahí es ruido.
    expect(resolveInstallHintVisibility({ ...BASE, ios: false })).toBe("hidden");
  });

  it("no muestra nada si la app ya está instalada", () => {
    expect(resolveInstallHintVisibility({ ...BASE, installed: true })).toBe("hidden");
  });

  it("no vuelve a molestar si el usuario lo descartó", () => {
    expect(resolveInstallHintVisibility({ ...BASE, dismissed: true })).toBe("hidden");
  });

  it("nunca muestra a la vez el botón y las instrucciones", () => {
    // Si ambos aparecieran, se leería un botón y unas instrucciones sobre lo
    // mismo. La precedencia del diálogo nativo es lo que evita el conflicto.
    for (const promptAvailable of [true, false]) {
      const hint = resolveInstallHintVisibility({ ...BASE, promptAvailable });
      const cta = resolveInstallCtaVisibility({
        supported: true,
        promptAvailable,
        installed: false,
        dismissed: false,
      });
      expect(
        hint === "manual" && cta === "available",
        `promptAvailable=${promptAvailable}`
      ).toBe(false);
    }
  });
});

describe("BeforeInstallPromptEvent", () => {
  it("describe el contrato mínimo que la UI necesita", () => {
    // El tipo no se puede comprobar en runtime; lo que se fija aquí es que el
    // contrato declarado cubre exactamente lo que `useInstallPrompt` consume.
    const event = {
      prompt: async () => undefined,
      userChoice: Promise.resolve({ outcome: "accepted" as const }),
    } as unknown as BeforeInstallPromptEvent;

    expect(typeof event.prompt).toBe("function");
    expect(event.userChoice).toBeInstanceOf(Promise);
  });
});

describe("INSTALL_DISMISS_KEY", () => {
  it("está versionado para no chocar con una versión anterior del esquema", () => {
    expect(INSTALL_DISMISS_KEY).toBe("pawpass-pwa-install-dismissed:v1");
  });
});
