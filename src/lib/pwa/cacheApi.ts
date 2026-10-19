/**
 * Lectura de la Cache Storage del service worker (FASE 7B).
 *
 * La UI necesita responder a una pregunta: "¿esta ruta está disponible sin
 * conexión?". Responderla exige la Cache Storage, que es una API del navegador;
 * este módulo la encapsula para que ningún componente toque `caches` directamente.
 *
 * Hay dos cachés, no una, y confundirlas fue un bug real. `public/sw.js` guarda
 * los documentos en una y los payloads RSC en otra porque comparten clave de
 * caché al resolverse: en la misma, el payload machacaba el HTML y una recarga
 * sin señal devolvía la portada en vez del perfil. Por eso las consultas de este
 * módulo se dirigen a una caché concreta en lugar de usar `caches.match()`, que
 * busca en todas y no distinguiría un payload de un documento.
 *
 * Igual que el resto de la capa, nunca lanza: sin Cache Storage (navegador sin
 * soporte, SSR, permisos) responde `false`, que es la respuesta conservadora (no
 * se promete nada que no se ha verificado).
 */

/** Caché de documentos y estáticos. Debe coincidir con `public/sw.js`. */
const CACHE_NAME = "pawpass-v3";

/** Caché de payloads RSC del App Router. Debe coincidir con `public/sw.js`. */
const ROUTE_CACHE_NAME = "pawpass-routes-v3";

/**
 * Qué copias locales existen de una ruta. La distinción importa: el payload RSC
 * solo sirve para moverse entre páginas sin recargar, mientras que el documento
 * es lo único que puede abrir una URL en frío.
 */
export type RouteAvailability = {
  /** Hay HTML cacheado: la URL se puede abrir incluso recargando. */
  document: boolean;
  /** Hay payload RSC: se puede navegar dentro de la app sin recargar. */
  payload: boolean;
};

function getCaches(): CacheStorage | null {
  if (typeof caches === "undefined") {
    return null;
  }
  return caches;
}

async function matchIn(cacheName: string, pathname: string): Promise<boolean> {
  const store = getCaches();
  if (!store) return false;

  try {
    const cache = await store.open(cacheName);
    // `ignoreSearch` porque Next.js añade parámetros internos (`?_rsc=`) que no
    // cambian el contenido de la ruta.
    return Boolean(await cache.match(pathname, { ignoreSearch: true }));
  } catch {
    return false;
  }
}

/**
 * `true` si hay **alguna** copia local utilizable de esa ruta. Responde a lo que
 * la UI pregunta: ¿puedo llevar a esta persona allí sin conexión?
 */
export async function isRouteCached(pathname: string): Promise<boolean> {
  const availability = await describeRouteCache(pathname);
  return availability.document || availability.payload;
}

/**
 * Describe qué copias existen, para que quien navega elija entre moverse sin
 * recargar (`payload`) y abrir la URL de verdad (`document`).
 */
export async function describeRouteCache(pathname: string): Promise<RouteAvailability> {
  const store = getCaches();
  if (!store) return { document: false, payload: false };

  // Se consultan en paralelo: son dos readings independientes y en un móvil
  // sin señal cada apertura de caché puede tardar.
  const [document, payload] = await Promise.all([
    matchIn(CACHE_NAME, pathname),
    matchIn(ROUTE_CACHE_NAME, pathname),
  ]);

  return { document, payload };
}

/**
 * `true` si hay al menos una entrada del shell en caché. Lo usa la UI para no
 * prometer navegación offline cuando ni la portada está cacheada.
 */
export async function hasShellCache(): Promise<boolean> {
  const store = getCaches();
  if (!store) return false;

  try {
    const cache = await store.open(CACHE_NAME);
    // Se consulta la caché de documentos, no `caches.match()`: el match global
    // también encuentra payloads RSC, y daría por cacheada una portada que en
    // realidad solo existe como payload de navegación.
    return Boolean(await cache.match("/"));
  } catch {
    return false;
  }
}
