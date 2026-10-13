import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { InstallStateSnapshot } from "@/lib/pwa/installStore";

/**
 * Estos tests importan el store **después** de montar un `window` falso, con
 * `vi.resetModules()`, porque el comportamiento que hay que comprobar ocurre al
 * evaluarse el módulo: es justo ahí donde se registran las escuchas y se lee el
 * estado de "ya instalada". Si el store se importara arriba del todo, en Node no
 * habría `window` y los listeners nunca se registrarían, y el test pasaría sin
 * haber probado nada.
 */

type Listeners = Map<string, Set<(event?: unknown) => void>>;

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, "navigator");

let listeners: Listeners;
let storage: Map<string, string>;
let installRequests = 0;

function installFakeWindow(
  options: { onLine?: boolean; standalone?: boolean; storageThrows?: boolean } = {}
) {
  listeners = new Map();
  storage = new Map();
  installRequests = 0;

  const storageLike = {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => void storage.set(key, value),
    removeItem: (key: string) => void storage.delete(key),
  };

  const win = {
    // `isAppInstalled()` usa `window.matchMedia`, no el global: sin esto el
    // stub no sería el que la app realmente consulta.
    matchMedia(query: string) {
      return {
        matches: query.includes("display-mode: standalone") && Boolean(options.standalone),
        media: query,
        addEventListener() {},
        removeEventListener() {},
      };
    },
    // `getBrowserStorage()` lee `window.localStorage`, no el global. Ponerlo
    // solo en `globalThis` haría que estas pruebas no ejercitaran el storage.
    localStorage: options.storageThrows
      ? {
          getItem() {
            throw new Error("almacenamiento bloqueado");
          },
          setItem() {
            throw new Error("almacenamiento bloqueado");
          },
          removeItem() {
            throw new Error("almacenamiento bloqueado");
          },
        }
      : storageLike,
    addEventListener(type: string, handler: (event?: unknown) => void) {
      const set = listeners.get(type) ?? new Set();
      set.add(handler);
      listeners.set(type, set);
    },
    removeEventListener(type: string, handler: (event?: unknown) => void) {
      listeners.get(type)?.delete(handler);
    },
  };

  Object.defineProperty(globalThis, "window", { value: win, configurable: true });
  Object.defineProperty(globalThis, "navigator", {
    value: {
      get onLine() {
        return options.onLine ?? true;
      },
      get userAgent() {
        return "Mozilla/5.0 (X11; Linux x86_64) Chrome/131.0.0.0 Safari/537.36";
      },
    },
    configurable: true,
  });
  Object.defineProperty(globalThis, "matchMedia", {
    value: win.matchMedia,
    configurable: true,
  });
  Object.defineProperty(globalThis, "localStorage", {
    value: storageLike,
    configurable: true,
  });
}

function emit(type: string, event?: unknown) {
  for (const handler of [...(listeners.get(type) ?? [])]) {
    handler(event);
  }
}

function makeInstallEvent(outcome: "accepted" | "dismissed" = "accepted") {
  installRequests += 1;
  return {
    type: "beforeinstallprompt",
    defaultPrevented: false,
    preventDefault() {
      this.defaultPrevented = true;
    },
    prompt: async () => undefined,
    userChoice: Promise.resolve({ outcome, platform: "web" }),
  };
}

async function loadStore() {
  vi.resetModules();
  return await import("@/lib/pwa/installStore");
}

function snapshotOf(store: Awaited<ReturnType<typeof loadStore>>): InstallStateSnapshot {
  return store.getInstallStateSnapshot();
}

beforeEach(() => {
  installFakeWindow();
});

afterEach(() => {
  vi.resetModules();
  if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow);
  else delete (globalThis as Record<string, unknown>).window;
  if (originalNavigator) Object.defineProperty(globalThis, "navigator", originalNavigator);
  else delete (globalThis as Record<string, unknown>).navigator;
  delete (globalThis as Record<string, unknown>).matchMedia;
  delete (globalThis as Record<string, unknown>).localStorage;
});

describe("captura del evento de instalación", () => {
  it("registra las escuchas al evaluarse el módulo, sin esperar a React", async () => {
    // El punto crítico de todo el store: si las escuchas se pusieran al
    // suscribirse, un evento anterior a la hidratación se perdería.
    const store = await loadStore();
    expect(listeners.get("beforeinstallprompt")?.size).toBe(1);
    expect(listeners.get("appinstalled")?.size).toBe(1);
    expect(store).toBeDefined();
  });

  it("recoge un `beforeinstallprompt` emitido antes de que nadie se suscriba", async () => {
    const store = await loadStore();

    // Nadie está escuchando al store todavía: el evento llega igual.
    emit("beforeinstallprompt", makeInstallEvent());

    expect(snapshotOf(store).canInstall).toBe(true);
  });

  it("evita el mini-infobar del propio navegador", async () => {
    await loadStore();
    const event = makeInstallEvent();

    emit("beforeinstallprompt", event);

    // Sin `preventDefault` el navegador muestra su propio aviso y el CTA de la
    // app queda duplicado en pantalla.
    expect(event.defaultPrevented).toBe(true);
  });

  it("avisa a los suscriptores sin diferencia de cuántos haya", async () => {
    const store = await loadStore();
    const a = vi.fn();
    const b = vi.fn();
    const unsubscribeA = store.subscribeInstallState(a);
    const unsubscribeB = store.subscribeInstallState(b);

    emit("beforeinstallprompt", makeInstallEvent());

    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
    unsubscribeA();
    unsubscribeB();
  });

  it("no duplica listeners si el módulo se suscribe muchas veces", async () => {
    const store = await loadStore();

    const unsubscribers = Array.from({ length: 20 }, () => store.subscribeInstallState(() => undefined));
    expect(listeners.get("beforeinstallprompt")?.size).toBe(1);

    unsubscribers.forEach((unsubscribe) => unsubscribe());
  });

  it("reacciona a `appinstalled` cerrando el CTA", async () => {
    const store = await loadStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribeInstallState(listener);

    emit("beforeinstallprompt", makeInstallEvent());
    emit("appinstalled");

    expect(snapshotOf(store)).toEqual({ canInstall: false, installed: true, dismissed: false });
    unsubscribe();
  });
});

describe("app ya instalada", () => {
  it("la detecta al arrancar, sin esperar a ningún evento", async () => {
    // Quien ya tiene PawPass instalado y lo abre desde su pantalla de inicio
    // no recibirá `appinstalled` en toda la sesión. Si no se lee el modo
    // standalone al arrancar, vería el aviso de instalar una app ya instalada.
    installFakeWindow({ standalone: true });
    const store = await loadStore();

    expect(snapshotOf(store).installed).toBe(true);
  });

  it("no ofrece instalar aunque el navegador emita el evento", async () => {
    installFakeWindow({ standalone: true });
    const store = await loadStore();

    emit("beforeinstallprompt", makeInstallEvent());

    expect(snapshotOf(store)).toEqual({ canInstall: false, installed: true, dismissed: false });
  });

  it("no marca instalada una app abierta en pestaña normal", async () => {
    const store = await loadStore();
    expect(snapshotOf(store).installed).toBe(false);
  });
});

describe("instalación", () => {
  it("abre el diálogo nativo y marca instalada si la aceptan", async () => {
    const store = await loadStore();
    emit("beforeinstallprompt", makeInstallEvent());

    const outcome = await store.promptInstall();

    expect(outcome).toBe("accepted");
    expect(installRequests).toBe(1);
    expect(snapshotOf(store).canInstall).toBe(false);
  });

  it("deja el CTA disponible si cierran el diálogo sin instalar", async () => {
    // Cerrar el diálogo no es instalar. Si el CTA desapareciera, quien cambió
    // de idea se quedaría sin forma de reintentarlo en esa sesión.
    const store = await loadStore();
    emit("beforeinstallprompt", makeInstallEvent("dismissed"));

    const outcome = await store.promptInstall();

    expect(outcome).toBe("dismissed");
    expect(snapshotOf(store).canInstall).toBe(true);
  });

  it("es inocuo si no hay diálogo disponible", async () => {
    const store = await loadStore();

    await expect(store.promptInstall()).resolves.toBe("unavailable");
    expect(installRequests).toBe(0);
  });

  it("degrada sin lanzar si el navegador rechaza el diálogo", async () => {
    const store = await loadStore();
    emit("beforeinstallprompt", {
      preventDefault() {},
      prompt: async () => {
        throw new Error("gesto no permitido");
      },
      userChoice: Promise.resolve({ outcome: "dismissed", platform: "web" }),
    });

    // Un throw aquí llegaría a la UI como un error sin manejar.
    await expect(store.promptInstall()).resolves.toBe("unavailable");
  });

  it("no vuelve a disparar el diálogo con un segundo clic", async () => {
    const store = await loadStore();
    emit("beforeinstallprompt", makeInstallEvent());

    await store.promptInstall();
    await store.promptInstall();

    expect(installRequests).toBe(1);
  });
});

describe("descarte del aviso", () => {
  it("deja de ofrecer instalar y no vuelve a molestar", async () => {
    const store = await loadStore();
    emit("beforeinstallprompt", makeInstallEvent());

    store.dismissInstallPrompt();

    expect(snapshotOf(store).dismissed).toBe(true);
    expect(snapshotOf(store).canInstall).toBe(false);
  });

  it("el descarte sobrevive a recargar la página", async () => {
    const first = await loadStore();
    first.dismissInstallPrompt();

    // Nueva carga de página: mismo almacenamiento, store nuevo.
    const reloaded = await loadStore();

    expect(snapshotOf(reloaded).dismissed).toBe(true);
  });

  it("no tira el diálogo pendiente, para que no quede nada a medias", async () => {
    const store = await loadStore();
    emit("beforeinstallprompt", makeInstallEvent());

    store.dismissInstallPrompt();

    await expect(store.promptInstall()).resolves.toBe("unavailable");
  });

  it("aguanta un almacenamiento que lanza", async () => {
    // La navegación privada en Safari lanza en localStorage. Si esto reventara,
    // la app entera se caería en el peor sitio posible: un almacenamiento
    // bloqueado no puede impedir usar el carnet.
    installFakeWindow({ storageThrows: true });
    const store = await loadStore();
    emit("beforeinstallprompt", makeInstallEvent());

    expect(() => store.dismissInstallPrompt()).not.toThrow();
    expect(snapshotOf(store).dismissed).toBe(true);
  });

  it("el descarte se pierde sin storage, pero la app sigue funcionando", async () => {
    // Sin storage el descarte no persiste entre recargas. Es el precio de la
    // privacidad: preferimos volver a preguntar a fingir que ya se guardó.
    installFakeWindow({ storageThrows: true });
    const first = await loadStore();
    first.dismissInstallPrompt();
    expect(snapshotOf(first).dismissed).toBe(true);

    const reloaded = await loadStore();
    expect(snapshotOf(reloaded).dismissed).toBe(false);
  });
});

describe("estabilidad de la instantánea", () => {
  it("mantiene la misma referencia mientras nada cambia", async () => {
    const store = await loadStore();

    // `useSyncExternalStore` compara por identidad: un objeto nuevo en cada
    // lectura provocaría un bucle de render infinito.
    expect(store.getInstallStateSnapshot()).toBe(store.getInstallStateSnapshot());
  });

  it("la instantánea de servidor es estable y no promete instalación", async () => {
    const store = await loadStore();

    const server = store.getServerInstallStateSnapshot();
    expect(server).toBe(store.getServerInstallStateSnapshot());
    // Prometer instalación en el HTML inicial provocaría un salto al hidratar.
    expect(server.canInstall).toBe(false);
    expect(server.installed).toBe(false);
  });

  it("solo crea objetos nuevos cuando el estado cambia de verdad", async () => {
    const store = await loadStore();
    const before = store.getInstallStateSnapshot();

    emit("beforeinstallprompt", makeInstallEvent());
    const after = store.getInstallStateSnapshot();

    expect(after).not.toBe(before);
    expect(store.getInstallStateSnapshot()).toBe(after);
  });
});
