/* PawPass — Service Worker (FASE 7)
 *
 * Estrategia conservadora y segura para uso en campo:
 *   1. Navegaciones (documentos HTML): network-first, fallback a la copia
 *      cachead localmente y, en último caso, al shell raíz ("/").
 *   2. Assets estáticos con hash/medios públicos (/_next/static, /pets,
 *      /docs, /_next/image, /icon.svg, /manifest.webmanifest):
 *      stale-while-revalidate.
 *   3. Peticiones de navegación interna del App Router (RSC): network-first con
 *      la misma política que los documentos. Sin esta regla, moverse entre
 *      secciones con el móvil sin señal muere en un error de red aunque la ruta
 *      ya esté cacheada, porque ese payload no pasa por
 *      `request.mode === "navigate"`.
 *   4. Todo lo demás: se ignora. No se cachean respuestas de datos API ni
 *      estados potencialmente inconsistentes.
 *
 * REGLAS:
 *   - Sólo GET y sólo mismo-origen.
 *   - Nunca se cachea una respuesta que no sea `ok`. Los errores de red
 *     nunca se materializan en caché.
 *   - El shell completo no se precachea de forma fija: el instalador guarda
 *     los recursos raíz de forma tolerante (sin abortar en 404 parciales) y
 *     el resto se llena conforme el usuario visita, para respetar el
 *     alcance de la app (páginas SSG, sin backend).
 *
 * Al desplegar una versión nueva, incrementa VERSION para invalidar las
 * cachés antiguas del navegador.
 */

/* v3 separa en dos caches lo que antes se mezclaba en una: los payloads RSC
   (indexados por `pathname`) pisaban los documentos (indexados por URL), y el
   fallback de `caches.match()` acababa sirviendo un payload RSC como HTML,
   dejando la página en blanco. Con la separación y con el fallback limitado a
   la caché de documentos, ambos fallos desaparecen. Al subir de versión, las
   cachés de la v2 se borran y se reprecargan al navegar. */
const VERSION = "v3";
const CACHE_NAME = `pawpass-${VERSION}`;

/* Los payloads RSC van a una caché APARTE, y no es un detalle menor.
 *
 * Un documento se guarda con su URL completa (`https://host/perfil/lucca`) y
 * un payload RSC con solo el `pathname` (`/perfil/lucca`). En la misma caché,
 * la Cache Storage resuelve la clave relativa contra el ámbito del service
 * worker y ambas terminan siendo la MISMA entrada: el payload machaca el HTML.
 *
 * El síntoma en campo era silencioso y grave: se visitaba un perfil, se
 * navegaba dentro de la app, y al recargar sin señal el documento ya no
 * estaba y el worker devolvía el shell raíz. Quien buscaba el carnet de su
 * mascota aterrizaba en el inicio sin explicación. Con cachés separadas no
 * pueden pisarse. */
const ROUTE_CACHE_NAME = `pawpass-routes-${VERSION}`;

const OWN_CACHE_NAMES = new Set([CACHE_NAME, ROUTE_CACHE_NAME]);

const SHELL_URLS = ["/", "/manifest.webmanifest", "/icon.svg"];

const STATIC_PREFIXES = new Set(["/_next/static/", "/pets/", "/docs/"]);

const CACHEABLE_URLS = [
  ...SHELL_URLS,
  "/_next/static/",
  "/pets/",
  "/docs/",
  "/favicon.ico",
];

/* Rutas que son páginas del producto. La lista es explícita y no un comodín:
   cachear de más significaría servir contenido que no se ha verificado. */
const DOCUMENT_PREFIXES = ["/perfil/", "/refugios/"];
const DOCUMENT_PATHS = ["/adopciones", "/login"];

function isDocumentPath(pathname) {
  if (pathname === "" || pathname === "/") {
    return true;
  }
  if (DOCUMENT_PATHS.includes(pathname)) {
    return true;
  }
  for (const prefix of DOCUMENT_PREFIXES) {
    /* El prefijo sin barra final cubre la sección exacta: `/perfil` es una
       redirección, no un perfil. */
    if (pathname === prefix.slice(0, -1) || pathname.startsWith(prefix)) {
      return true;
    }
  }
  return false;
}

function isRouteRequest(url, request) {
  /* Next.js marca la navegación del App Router con la cabecera `RSC` y, en
     navegaciones de cliente, también con `Next-Router-Prefetch`. Es la señal
     más fiable porque no depende de la forma exacta del query string, que
     cambia entre versiones. */
  const isRsc =
    request.headers.get("RSC") === "1" || request.headers.get("Next-Router-Prefetch") === "1";
  return isRsc && isDocumentPath(url.pathname);
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => precacheTolerant(cache, SHELL_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !OWN_CACHE_NAMES.has(key))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  if (url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  if (isRouteRequest(url, request)) {
    event.respondWith(routeFirst(request));
    return;
  }

  if (isCacheableStatic(url)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});

async function precacheTolerant(cache, urls) {
  await Promise.all(
    urls.map(async (entry) => {
      try {
        const response = await fetch(entry, { cache: "no-cache" });
        if (response.ok) {
          await cache.put(entry, response);
        }
      } catch {
        /* El recurso no está disponible en instalación; no abortar. */
      }
    }),
  );
}

function isCacheableStatic(url) {
  if (url.pathname === "/_next/image") {
    return true;
  }
  if (CACHEABLE_URLS.includes(url.pathname)) {
    return true;
  }
  for (const prefix of STATIC_PREFIXES) {
    if (url.pathname.startsWith(prefix)) {
      return true;
    }
  }
  return false;
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
      return response;
    }
    return response;
  } catch {
    /* IMPORTANTE: se consulta SOLO la caché de documentos.
     *
     * `caches.match()` busca en todas las cachés, incluida la de payloads RSC,
     * y esa caché indexa por `pathname`. Al pedir el documento de `/adopciones`,
     * un match global encontraba el payload RSC de esa misma ruta y lo servía
     * como si fuera el HTML: la página quedaba en blanco con datos de vuelo
     * dentro del `<body>` en lugar de mostrar la sección. */
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    const shell = await cache.match("/");
    if (shell) {
      return shell;
    }
    return new Response("Sin conexión y sin copia local", {
      status: 503,
      statusText: "Service Unavailable",
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}

/* Navegación interna del App Router. Igual que `networkFirst`, pero en su propia
   caché y con el `pathname` como clave: el payload de servidor llega con un
   parámetro `_rsc` que cambia entre despliegues, así que guardarlo por URL
   completa llenaría la caché de entradas que nunca vuelven a pedirse y dejaría
   fuera la que sí se necesita. Ignorar el query es seguro aquí porque el
   contenido de una ruta no depende de él.

   El cliente solo usa esta copia para moverse entre páginas sin recargar. Para
   abrir la URL en frío (recargar, enlace abierto desde otro dispositivo) hace
   falta el documento, y por eso las dos cachés no se mezclan.

   Sin copia local devuelve 503 con un cuerpo vacío en lugar de propagar el
   error de red: la UI de campo detecta que no hay respuesta válida y explica
   la situación, en vez de mostrar un fallo técnico. */
async function routeFirst(request) {
  const cache = await caches.open(ROUTE_CACHE_NAME);
  const key = new URL(request.url).pathname;

  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(key, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(key);
    if (cached) {
      return cached;
    }
    if (error instanceof Error && error.name === "TypeError") {
      return new Response("", { status: 503, statusText: "Service Unavailable" });
    }
    throw error;
  }
}

/* `staleWhileRevalidate` también consulta SOLO su propia caché, por el mismo
   motivo que `networkFirst`: la caché de rutas está indexada por `pathname` y
   contiene `/`, así que un `caches.match()` global para un estático de la
   portada podría devolver el payload RSC en lugar del recurso. */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) {
    void revalidateInBackground(request);
    return cached;
  }

  return revalidateInBackground(request);
}

async function revalidateInBackground(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === "TypeError") {
      return new Response("", { status: 503 });
    }
    throw error;
  }
}