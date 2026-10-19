import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  describeRouteCache,
  hasShellCache,
  isRouteCached,
  type RouteAvailability,
} from "@/lib/pwa/cacheApi";

/**
 * La Cache Storage se simula a mano porque no hay jsdom en este proyecto. El
 * simulador resuelve las claves como lo hace la especificación —una clave
 * relativa se normaliza contra el origen— que es precisamente donde estuvo el
 * bug: un payload RSC guardado por `pathname` y un documento guardado por URL
 * completa terminaban en la MISMA entrada.
 */

const ORIGIN = "https://pawpass.example";
const CACHE_NAME = "pawpass-v4";
const ROUTE_CACHE_NAME = "pawpass-routes-v4";

type MatchOptions = { ignoreSearch?: boolean; ignoreVary?: boolean };

type FakeCache = {
  store: Map<string, unknown>;
  put: (key: string, value: unknown) => Promise<void>;
  match: (key: string, options?: MatchOptions) => Promise<unknown | undefined>;
};

/** Resuelve una clave como la Cache Storage: relativa contra el origen. */
function normalizeKey(key: string): string {
  try {
    return new URL(key, ORIGIN).href;
  } catch {
    return key;
  }
}

/** Quita el query de una clave, como hace `ignoreSearch`. */
function stripSearch(key: string): string {
  try {
    const url = new URL(key, ORIGIN);
    url.search = "";
    return url.href;
  } catch {
    return key;
  }
}

function createFakeCache(): FakeCache {
  const store = new Map<string, unknown>();
  return {
    store,
    async put(key, value) {
      store.set(normalizeKey(key), value);
    },
    async match(key, options) {
      const normalized = normalizeKey(key);
      if (store.has(normalized)) return store.get(normalized);
      if (options?.ignoreSearch) {
        // `ignoreSearch` compara AMBOS lados sin query: la clave buscada y la
        // guardada. Sin esto, una ruta ya visitada con `?_rsc=` parecería no
        // existir y el guardia bloquearía el enlace sin conexión.
        const wanted = stripSearch(normalized);
        for (const [storedKey, value] of store) {
          if (stripSearch(storedKey) === wanted) return value;
        }
      }
      return undefined;
    },
  };
}

let cachesByName: Map<string, FakeCache>;
const originalCaches = Object.getOwnPropertyDescriptor(globalThis, "caches");

function installFakeCaches(): void {
  cachesByName = new Map([
    [CACHE_NAME, createFakeCache()],
    [ROUTE_CACHE_NAME, createFakeCache()],
  ]);

  const fake: CacheStorage = {
    async open(name: string) {
      const existing = cachesByName.get(name);
      if (existing) return existing as unknown as Cache;
      const created = createFakeCache();
      cachesByName.set(name, created);
      return created as unknown as Cache;
    },
    async has(name: string) {
      return cachesByName.has(name);
    },
    async keys() {
      return [...cachesByName.keys()];
    },
    async delete(name: string) {
      return cachesByName.delete(name);
    },
    async match(key: string, options?: MatchOptions) {
      // `caches.match()` busca en TODAS las cachés, a diferencia de
      // `cache.match()`. `hasShellCache` depende de esa diferencia.
      for (const cache of cachesByName.values()) {
        const found = await cache.match(key, options);
        if (found !== undefined) return found;
      }
      return undefined;
    },
  } as unknown as CacheStorage;

  Object.defineProperty(globalThis, "caches", { value: fake, configurable: true });
}

function documentCache(): FakeCache {
  return cachesByName.get(CACHE_NAME) as FakeCache;
}

function routeCache(): FakeCache {
  return cachesByName.get(ROUTE_CACHE_NAME) as FakeCache;
}

beforeEach(() => {
  installFakeCaches();
});

afterEach(() => {
  if (originalCaches) Object.defineProperty(globalThis, "caches", originalCaches);
  else delete (globalThis as Record<string, unknown>).caches;
});

describe("describeRouteCache", () => {
  it("no encuentra nada en una caché vacía", async () => {
    await expect(describeRouteCache("/perfil/lucca")).resolves.toEqual({
      document: false,
      payload: false,
    });
  });

  it("distingue el documento del payload RSC", async () => {
    await documentCache().put(`${ORIGIN}/perfil/lucca`, "<html>perfil</html>");

    const conDocumento: RouteAvailability = await describeRouteCache("/perfil/lucca");
    expect(conDocumento).toEqual({ document: true, payload: false });

    await routeCache().put("/perfil/lucca", "payload rsc");

    const conAmbos: RouteAvailability = await describeRouteCache("/perfil/lucca");
    expect(conAmbos).toEqual({ document: true, payload: true });
  });

  it("el payload RSC no puede pisar el documento de la misma ruta", async () => {
    // Este es el regresión del bug original: documento y payload comparten clave
    // de caché al normalizarse. Con una sola caché, el payload reemplazaba al
    // HTML y una recarga sin señal devolvía la portada en lugar del perfil.
    await documentCache().put(`${ORIGIN}/perfil/lucca`, "<html>perfil</html>");
    await routeCache().put("/perfil/lucca", "payload rsc");

    // Las dos claves normalizan al mismo valor: así que si compartieran caché,
    // una habría machacado a la otra.
    expect(normalizeKey("/perfil/lucca")).toBe(normalizeKey(`${ORIGIN}/perfil/lucca`));
    expect(documentCache().store.get(normalizeKey("/perfil/lucca"))).toBe("<html>perfil</html>");
    expect(routeCache().store.get(normalizeKey("/perfil/lucca"))).toBe("payload rsc");

    await expect(describeRouteCache("/perfil/lucca")).resolves.toEqual({
      document: true,
      payload: true,
    });
  });

  it("ignora los parámetros internos de Next.js", async () => {
    // `?_rsc=` cambia entre despliegues. Si se buscara con la query, una ruta
    // ya visitada parecería no estar en caché y el guardia la bloquearía.
    await documentCache().put(`${ORIGIN}/adopciones?tab=perros`, "<html>adopciones</html>");

    const result = await describeRouteCache("/adopciones?tab=gatos");
    expect(result.document).toBe(true);
  });

  it("no confunde una ruta con otra que la contiene", async () => {
    await documentCache().put(`${ORIGIN}/perfil/lucca`, "<html>lucca</html>");

    await expect(describeRouteCache("/perfil/otro-mascota")).resolves.toEqual({
      document: false,
      payload: false,
    });
  });

  it("responde false en vez de lanzar cuando no hay Cache Storage", async () => {
    delete (globalThis as Record<string, unknown>).caches;

    // Sin `caches` (SSR, o un navegador sin soporte) la respuesta conservadora
    // es `false`: no se promete nada que no se ha verificado.
    await expect(describeRouteCache("/perfil/lucca")).resolves.toEqual({
      document: false,
      payload: false,
    });
  });

  it("degrada a false si la Cache Storage lanza", async () => {
    Object.defineProperty(globalThis, "caches", {
      value: {
        open() {
          throw new Error("almacenamiento bloqueado por permisos");
        },
      },
      configurable: true,
    });

    await expect(describeRouteCache("/perfil/lucca")).resolves.toEqual({
      document: false,
      payload: false,
    });
  });
});

describe("isRouteCached", () => {
  it("es true con cualquiera de las dos copias", async () => {
    await documentCache().put(`${ORIGIN}/refugios`, "<html>refugios</html>");
    await expect(isRouteCached("/refugios")).resolves.toBe(true);

    installFakeCaches();
    await routeCache().put("/refugios", "payload rsc");
    await expect(isRouteCached("/refugios")).resolves.toBe(true);
  });

  it("es false sin ninguna copia", async () => {
    await expect(isRouteCached("/adopciones")).resolves.toBe(false);
  });
});

describe("hasShellCache", () => {
  it("es true solo si existe la portada como documento", async () => {
    await expect(hasShellCache()).resolves.toBe(false);

    await documentCache().put(`${ORIGIN}/`, "<html>inicio</html>");
    await expect(hasShellCache()).resolves.toBe(true);
  });

  it("es false si solo hay un payload RSC de la portada, no el documento", async () => {
    // `caches.match("/")` global encuentra el payload de la caché de rutas y
    // daría por buena una portada que no se puede abrir en frío. Prometer
    // navegación offline cuando no hay documento es peor que no prometerla.
    await routeCache().put("/", "payload rsc de la portada");

    await expect(hasShellCache()).resolves.toBe(false);
  });

  it("es false si la portada no está aunque exista la caché", async () => {
    await documentCache().put(`${ORIGIN}/otra-cosa`, "x");
    await expect(hasShellCache()).resolves.toBe(false);
  });

  it("es false sin Cache Storage", async () => {
    delete (globalThis as Record<string, unknown>).caches;
    await expect(hasShellCache()).resolves.toBe(false);
  });
});
