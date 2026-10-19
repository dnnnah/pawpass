# FASE 7 — PWA / Campo: estrategia técnica

Documento técnico de la base PWA/offline de PawPass. Complementa el
CHANGELOG y detalla decisiones, límites y trabajo futuro.

## Estado actual del producto (pre-FASE 7)

- Next.js 16 (App Router) + React 19, SSG puro para el catálogo de mascotas
  (280 páginas generadas en build). Sin backend, sin Supabase, sin Auth.
  Los datos viven en `src/data/*.json` y se convierten en páginas estáticas.
- Sin manifest, sin service worker, sin estrategia offline previa.
- `localStorage` disperso en: `providers.tsx` (tema), `useLostAlerts.ts`,
  `useAdoptionRequests.ts` (con módulos `lostAlertStorage` /
  `adoptionRequestStorage` ya tolerantes a errores).
- Dependencias clientes relevantes: `qrcode.react` (QR), `html-to-image`
  (PNG de alerta), `framer-motion` (lightbox de fotos, una sola sección).

## Arquitectura

```
domain (puro, sin browser/React)
   ↓
mapping / services
   ↓
UI (client)
   ↓
infraestructura browser (src/lib/pwa/)
   - storage.ts        → acceso seguro a localStorage
   - connectivity.ts   → lecturas puras de red del dispositivo
   - connectivityStore.ts → estado externo de conectividad (banner + recuperación)
   - cacheApi.ts       → consulta de la Cache Storage por ruta
   - offlineNavigation.ts → decisiones puras de navegación sin conexión
   - install.ts / installStore.ts / useInstallPrompt.ts → CTA de instalación
   - registerServiceWorker.ts → registro del SW (solo producción)
   - useOnlineStatus.ts, useOfflineNavigationGuard.ts → hooks cliente
```

El `domain` sigue sin importar React/Next/browser APIs (guards existentes en
`src/lib/domain/purity.test.ts`). La nueva capa tiene su propio guard
(`src/lib/pwa/purity.test.ts`): los módulos de infraestructura son
React/Next-free salvo los tres hooks cliente, que son la única excepción
declarada y verificada por test.

## Web App Manifest

`src/app/manifest.ts` genera `/manifest.webmanifest`:

| Campo | Valor |
| --- | --- |
| `name` / `short_name` | PawPass \| Carnet Digital / PawPass |
| `start_url` / `scope` | `/` |
| `display` | `standalone` |
| `theme_color` | `#10B981` (esmeralda de la marca) |
| `background_color` | `#ffffff` |
| `icons` | `/icon.svg` (existe), `purpose` `any` + `maskable` |

**Íconos pendientes (bloque de diseño B):** PNG 192×192, PNG 512×512 y
`apple-touch-icon` (PNG 180×180). El manifest no referencia assets
inexistentes; cuando B entregue los PNG se añadirán a
`buildManifest().icons` y al metadata `icons` del layout.

## Service worker (`public/sw.js`)

- **Registro:** solo `NODE_ENV=production` y solo si
  `navigator.serviceWorker` existe. En dev nunca se activa (no interfiere con
  `next dev`). Ruta: `/sw.js`, scope `/`.
- **Caché:** versión manual `pawpass-<VERSION>`; **subir `VERSION` en cada
  despliegue** para invalidar cachés viejas.
- **Dos cachés, no una:** `pawpass-<VERSION>` para documentos y estáticos,
  `pawpass-routes-<VERSION>` para los payloads RSC del App Router. Los
  nombres están escritos a mano en `public/sw.js` **y** en
  `src/lib/pwa/cacheApi.ts` (el SW es JS plano y la capa no importa de
  `public/`), así que el contrato se fija con un test que lee ambos ficheros y
  exige que coincidan. Si divergen, la UI consultaría una caché inexistente y
  respondería siempre "no hay copia local".
- **`install`:** precachea `/`, `/manifest.webmanifest`, `/icon.svg` de forma
  tolerante (fallos parciales no abortan la instalación).
- **`activate`:** borra las cachés que no son de la versión actual (ambos
  nombres entran en `OWN_CACHE_NAMES`, para no borrar la de rutas) y hace
  `clients.claim`.

### Por qué dos cachés (y no una)

Los payloads RSC del App Router se indexan por `pathname`; los documentos, por
URL completa. En una caché compartida, un payload **pisa** el documento de la
misma ruta, y dos fallos reales salieron de ahí:

1. Una recarga sin señal de un perfil devolvía la portada en vez del perfil.
2. Peor: el *fallback* de `networkFirst` usaba `caches.match()`, que busca en
   **todas** las cachés. Para el documento de `/adopciones` encontraba el
   payload RSC de esa misma ruta y lo servía como si fuera el HTML: la página
   quedaba en blanco con datos de vuelo dentro del `<body>`, sin banner y sin
   `h1`, lo que además hacía creer que el estado de conexión estaba roto.

Por eso **ningún handler usa `caches.match()`**: cada uno abre su propia caché
(`caches.open(...)`) y consulta dentro. `hasShellCache()` tenía el mismo
problema —un match global habría dado por cacheada una portada que solo existe
como payload— y ahora consulta la caché de documentos.

Un test de contrato en `purity.test.ts` lee `public/sw.js` y falla si vuelve a
aparecer `caches.match(` en el worker, y si los nombres de versión divergen.

### Estrategia de cache (fetch)

| Tipo de request | Estrategia |
| --- | --- |
| Documento/navegación (`mode: navigate`) | network-first → caché de documentos → shell `/` → 503 |
| Payload RSC (`_rsc`) | network-first → caché de rutas (por `pathname`, `ignoreSearch`) → 503 vacío |
| `/_next/static/*`, `/pets/*`, `/docs/*`, `/_next/image`, `/icon.svg`, `/manifest.webmanifest` | stale-while-revalidate |
| POST / otros orígenes / datos API | ignorado |

Reglas de seguridad:
- Solo GET, solo mismo-origen.
- Nunca se cachea una respuesta que no sea `ok` (los fallos de red no se
  materializan en caché).
- No se cachean datos potencialmente inconsistentes (no hay backend; cuando
  exista, el acceso a datos remotos quedará fuera de la caché del SW).
- El *fallback* al shell `/` es degradación deliberada: en una ruta sin
  documento cacheado, una recarga sin señal muestra la portada en lugar de una
  pantalla de error. La URL mostrada sigue siendo la solicitada, y la
  navegación dentro de la app a esa ruta la bloquea antes el guard (§Estado sin
  conexión) en lugar de dejar que aparezca el shell.

## Qué funciona offline (hoy)

1. Páginas previamente visitadas (HTML SSG cacheado por network-first) y su
   navegación posterior.
2. Assets de `/_next/static`, fotos de `/pets` (incluidas las variantes
   optimizadas por `next/image` vía `/_next/image`) y thumbnails de `/docs`.
3. Perfil estático de cualquier mascota ya visitado; el QR ya renderizado.
4. Alerta de mascota perdida y solicitudes de adopción registradas en
   `localStorage`; si el storage falla, siguen en memoria (sesión).

## Qué NO funciona offline (por diseño, sin backend)

1. Primer acceso a una página nunca cacheada (la app no tiene backend que
   sirva datos nuevos; los datos son SSG). Sin conocer la URL de antemano no
   hay copia local.
2. Sincronización remota de cualquier tipo: no existe backend.
3. Operaciones con dependencia de servidor: auth, dashboard, notificaciones
   push, donaciones/pagos, CRUD de mascotas (fases futuras). El SW no
   intercepta ese tráfico.
4. Una recarga sin señal de una ruta cuyo **documento** nunca se descargó: no
   hay HTML local, así que el SW sirve el shell. Se navega *dentro* de la app a
   esa ruta sí funciona si su payload RSC está cacheado (ver §Estado sin
   conexión), que es el caso habitual en uso de campo.

## Estado sin conexión (UI de campo, FASE 7B)

Montado una sola vez en `AppShell`, sin redesign: reutiliza tokens, tipografía
y componentes que ya existen.

- **Banner "Estás sin conexión"** (`OfflineStatus`): explica qué se puede hacer
  (consultar lo ya abierto en el dispositivo) y ofrece volver al inicio.
- **Aviso "Conexión recuperada"**: aparece al volver la señal y se retira solo
  a los ~6 s, para no dejar un mensaje obsoleto en pantalla.
- **Guardia de navegación** (`OfflineNavGuard` → `useOfflineNavigationGuard`):
  solo actúa sin conexión, y solo con un listener en fase de captura sobre
  enlaces internos del propio producto. Consulta la caché y decide:
  - con payload RSC → `router.push`, se navega sin recargar;
  - solo documento → `location.assign`, navegación completa (funciona, se
    pierde la transición de cliente);
  - sin ninguna copia → bloquea y muestra `OfflineRouteNotice`, con salida
    ("Volver al inicio" / "Seguir aquí") en vez de un error de red.
  Enlazos externos, `target`, descargas, clic con modificadores y cambios solo
  de fragmento se ignoran: el navegador sigue con su comportamiento normal.
- **Aviso de mascota perdida:** el texto es explícito en que la alerta es
  local y en que paraiezarla hay que compartir un enlace o una imagen. No
  promete sincronización, cola de envío ni copia en la nube, porque no existe
  backend.

Las decisiones viven en funciones puras (`offlineNavigation.ts`,
`connectivity.ts`, `cacheApi.ts`) y se prueban sin navegador; las vistas se
prueban renderizando a HTML estático.

## Instalación (FASE 7B)

- **Botón nativo** solo cuando el navegador emite `beforeinstallprompt`. Sin esa
  API no se inventa un botón que no puede hacer nada.
- **iOS/iPadOS** no tiene esa API: se muestran las instrucciones reales
  (Compartir → *Añadir a pantalla de inicio*) en lugar de un botón falso.
  `isIosSafariLike` detecta iPadOS por UA Macintosh + `maxTouchPoints`, de modo
  que macOS y Android no se confundan con iOS.
- El CTA se oculta si la app ya está instalada o si la persona lo descartó; el
  descarte se persiste en `localStorage` (`pawpass-pwa-install-dismissed:v1`)
  y degrada a memoria si el storage está bloqueado.
- `installStore` captura `beforeinstallprompt` al evaluarse el módulo, no al
  montar el componente: si el evento llega antes de que la UI se monte, la
  oportunidad no se pierde.

## localStorage

- **Capa única:** `src/lib/pwa/storage.ts`.
- **Comportamiento ante fallos:** storage inexistente (SSR) → `null`/`false`;
  acceso bloqueado (cookies off, modo privado) → `null`/`false`; JSON
  corrupto → `null`; forma inválida → `null` vía `decode`; cuota excedida →
  se conserva el estado en memoria (fallback de sesión). La aplicación nunca
  se rompe: vuelve a un estado vacío razonable.
- **Reglas de negocio intactas:** `lostAlertStorage` y
  `adoptionRequestStorage` mantienen su contrato (relleno de `resolveLostState`
  etc.). `resolveLostState`, `resolveEffectivePetState` y
  `resolveEmergencyContactState` no se tocan: solo se endurece la
  infraestructura que las alimenta.

## Conectividad

- `connectivity.ts`: `getBrowserOnline()` (SSR-safe) y
  `resolveConnectivityStatus()` (puro). `navigator.onLine` es un **indicador
  del dispositivo**, no conectividad con servidor.
- `useOnlineStatus.ts`: hook cliente con `useSyncExternalStore`
  (`"unknown"` durante SSR). Lo usan el guard de navegación y quien necesite
  el estado bruto.
- `connectivityStore.ts`: estado externo compartido con
  `useSyncExternalStore`, para que el banner, el aviso de recuperación y el
  guard reaccionen al mismo cambio y no se desincronicen entre sí. Devuelve
  instantáneas estables (mismo objeto mientras el estado no cambia), requisito
  de `useSyncExternalStore` para no provocar render en cascada.

## Fechas / tiempo

No se introdujeron timestamps nuevos. Cualquier código offline que requiera
fechas debe usar `src/lib/dateFormat.ts` (zona `America/Mexico_City`).

## Performance (auditoría FASE 7)

Medido sobre la build de producción (gzip):

- React/runtime y componentes compartidos dominan el peso (~180 KB gzip por
  página de perfil). Las librerías pesadas ya están **scoped por ruta**:
  `qrcode.react` solo en perfiles/carnet, `html-to-image` solo en `/alerta`,
  `framer-motion` solo en perfiles con fotos.
- **Oportunidades futuras (fuera de alcance para no romper UX ni la capa de
  B):** lazy-load con `next/dynamic` de `QRShareCard`/`CarnetStudio`;
  sustituir `framer-motion` del lightbox por CSS (≈61 KB gzip por página de
  perfil); `next/image` para fotos — **con precaución** porque el PNG de la
  alerta usa `html-to-image` y las imágenes deben permanecer same-origin
  (un `next/image` con dominio externo contaminaría el canvas).

## Dependencias nuevas

Ninguna. Manifest, service worker, storage y conectividad usan infraestructura
nativa de Next.js/navegador.

## Riesgos / pendientes

- Íconos PWA PNG (192/512) y `apple-touch-icon`: aportarlos en el bloque de
  diseño B y enlazarlos en el manifest.
- `VERSION` del SW es manual: debe incrementarse en cada despliegue (proceso).
  Los nombres de caché están duplicados en `public/sw.js` y `cacheApi.ts`; el
  test de contrato de `purity.test.ts` avisa si divergen, pero **subir solo una
  de las dos cosas rompe la disponibilidad offline en silencio**.
- Sin backend no hay modo "primera visita offline": el usuario debe haber
  cargado la página alguna vez.
- La primera navegación tras instalar el SW no pasa por el worker (la página se
  sirve antes de `clients.claim()`), así que ese documento no queda cacheado
  hasta la siguiente carga. Es el comportamiento estándar del ciclo de
  instalación y no afecta a quien ya abrió la sección antes.
- `navigator.onLine` sigue siendo un indicador del dispositivo: con punto de
  acceso Wi-Fi activo pero sin datos, la UI puede mostrar "en línea" mientras
  las peticiones fallan. El SW responde 503 en ese caso y la navegación
  degrada a copia local o al aviso de ruta no disponible.
