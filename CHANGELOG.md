# PawPass — Registro de Fases

Registro de avances, cambios y decisiones tomadas durante el desarrollo.

---

## Skills instaladas

Skills de agente disponibles en este proyecto (`.agents/skills/`):

| Skill | Fuente |
| --- | --- |
| `vercel-react-best-practices` | https://github.com/vercel-labs/agent-skills |
| `nextjs-app-router-patterns` | https://github.com/wshobson/agents |
| `frontend-design` | https://github.com/anthropics/skills |
| `tailwind-css-patterns` | https://github.com/giuseppe-trisciuoglio/developer-kit |
| `typescript-pro` | https://github.com/jeffallan/claude-skills |

**Fecha de instalación:** 2026-08-28

---

## FIX & CLEANUP — Corrección de bugs y deuda técnica (PR `fix/core-bugs-and-cleanups`)

**Estado:** completada  
**Fecha:** 2026-10-19

Corrige bugs sutiles en la presentación de vacunas, elimina deuda técnica
heredada en la capa de dominio purificándola al 100%, refactoriza el almacenamiento
de tema para usar `StorageLike` y añade la ruta `/refugios` para evitar errores 404.

### Correcciones implementadas

1. **Bug en el badge de vacunas del Header (`src/lib/mapping/profile.ts`)**:
   - Anteriormente evaluaba `pet.vacunas.some((v) => v.estatus === "vencida")`,
     confiando en el valor estático del dato y permitiendo que vacunas con
     próxima dosis ya pasada aparecieran como "Al día" en el encabezado.
   - Ahora delega en `resolveVaccineNextDoseAlert(vaccine)` de la capa de dominio,
     evaluando la expiración calendárica real frente a la fecha actual y marcando
     "Revisar" de forma consistente con el timeline.
   - Añadidas pruebas en `src/lib/mapping/profile.test.ts`.

2. **Purificación total de la capa Domain (`src/lib/domain/`)**:
   - `vaccineStatus.ts` y `documentCategory.ts` se trasladaron a `src/lib/mapping/`
     dado que son metadatos puramente de presentación (íconos Lucide, labels y filtros).
   - Eliminada la lista blanca de excepciones `UI_LEGACY_ALLOWLIST` en
     `src/lib/domain/purity.test.ts`. La capa de dominio ahora es 100% pura sin
     dependencias de UI ni iconos.
   - Actualizadas todas las referencias en componentes y mappers sin regresión.

3. **Refactorización de persistencia en `ThemeProvider` (`src/app/providers.tsx`)**:
   - Reemplazado el acceso directo a `localStorage` por la capa SSR-safe y tolerante
     a fallos `StorageLike` (`getBrowserStorage`, `safeGetItem`, `safeSetItem`, `safeRemoveItem`).

4. **Directorio accesible de refugios (`src/app/refugios/page.tsx`)**:
   - Creada la página de índice `/refugios` con listado de organizaciones aliadas,
     insignia de verificación y conteo de mascotas para eliminar el error 404.

### Verificación

- `npm test`: 55 archivos, 718 pruebas en verde (0 fallos).
- `npm run lint` y `npm run typecheck`: 0 errores.
- `npm run validate:data`: 11 perfiles reales + 10 mocks de adopción + 2 mocks de refugio válidos.

---

## FASE 9A — Services / ARQUITECTURA: puertos y adapters (PR `feat/services-architecture-core`)

**Estado:** completada
**Fecha:** 2026-09-30

Prepara la capa de Services para que la fuente de datos pueda pasar de JSON
estático a Supabase/DB más adelante **sin rehacer la UI**. No introduce
Supabase, DB, Auth ni RLS: solo contratos, adapters y la corrección de una
dependencia inversa. Detalle completo en `docs/fase-9-services-arquitectura.md`.

### Qué había realmente (y no lo que se suponía)

La auditoría partía de la premisa de que la UI importaba `mascotas.json` y
usaba `localStorage` sin encapsular. Al revisar el código, ambas cosas ya
estaban resueltas: los JSON vivían detrás de `getAllPets` / `getAdoptionDemoPets` /
`getMockShelters`, y `localStorage` estaba aislado tras `StorageLike`
(`pwa/storage.ts`) con inyección, *fallback* en memoria y tolerancia a storage
bloqueado. El hueco real era de otro tipo:

1. Los accesores estaban planos en `src/lib/`, **sin contrato** que permitiera
   cambiar la fuente sin reescribirlos.
2. `domain/carnet.ts` importaba de `services/` — dependencia **inversa**.
3. `getPetById` devolvía `undefined` y `getPetByIdAny` devolvía `null`.
4. Los datos inválidos no tenían una regla de error unificada.

### Puertos, adapters y servicios

- `domain/directory/types.ts`: puertos `PetDirectory` y `ShelterDirectory`
  (tipos puros, sin implementación), siguiendo la convención de FASE 8
  (`TelemetryClient` vive en `domain/telemetry/types.ts`).
- `infra/directory/staticPets.ts` y `staticShelters.ts`: únicas capas que
  conocen `src/data/*.json`; validan al cargar con `assertValid*`.
- `services/pets/queries.ts` y `services/shelters/queries.ts`: API de consulta
  que consumen rutas y componentes, sin framework y sin acceso a `src/data`.
- Migrados 15 ficheros (10 rutas + 3 tests + realocados) **solo** la ruta de
  import. Cero cambios de lógica, UX, rutas o URLs canónicas.

### Correcciones

- **Dependencia inversa `domain → services`**: `publicProfileUrl.ts` es un util
  puro usado por domain, app, components y types; se movió a `src/lib/`, donde
  ya viven `dateFormat.ts`, `phone.ts` y `clipboard.ts`.
- **Contrato uniforme**: "no existe" es siempre `null`, nunca `undefined`.
- **`getPetOrNotFound` eliminado**: código muerto, cero consumidores. Las 7
  rutas ya hacen `getPetByIdAny` + `notFound()` en línea, que es la frontera
  correcta: decidir un 404 es tarea de la ruta, no del service.

### Guardián arquitectónico

`src/lib/architecture.test.ts` verifica la dirección de dependencias
(`domain ← services ← infra ← UI`) y que solo `infra` importa `src/data`.
`domain/purity.test.ts` se extendió a los puertos nuevos. El guardián detectó
la dependencia inversa de `carnet.ts` durante el desarrollo.

### Lo que no se hizo (a propósito)

- **No** se envolvió `localStorage` en otro adapter: ya estaba encapsulado y
  una capa extra no permitiría ningún swap a backend.
- **No** se extrajo el tema de `app/providers.tsx`: el script anti-FOUC de
  `layout.tsx` debe seguir siendo JS plano. Deuda documentada.
- **No** se unificaron `listProfilePets` / `listAdoptionPets`: hoy son dos
  ficheros disjuntos; con backend real saldrán de la misma tabla por estado.
- **No** se creó una jerarquía de clases de error: ninguna tendría consumidores
  hoy. La regla es `null` + `assertValid*` al cargar + degradar a memoria.
- **No** se renombró `getAdoptionDemoPets` (churn sin beneficio funcional).

### Verificación

`npm test` (709 tests, 54 ficheros, 0 fallos), `npm run lint`,
`npm run typecheck`, `npm run build` y `npm run validate:data` en verde.
Smoke tests sobre `next start` con 200 en las rutas críticas, canonical y
Open Graph sigue apuntando a `/perfil/PC-LUCCA-001`, QR con ese *payload*,
manifest y service worker responden, 404 correcto para mascota inexistente.
Sin cambios en PWA/offline, telemetría de FASE 8, KPIs, mapping ni dominio de
negocio.

**Pendiente preexistente:** `/refugios` (índice) sigue en 404 porque el
proyecto solo tiene `app/refugios/[id]/page.tsx`. No es regresión de esta fase.
La telemetría de FASE 8 continúa sin instrumentar la UI: `trackers.ts` solo lo
consume su propio test.

---

## FASE 7B — PWA / CAMPO: UI de campo (PR `feat/pwa-campo-ui`)

**Estado:** completada
**Fecha:** 2026-09-28

Cierra el bloque B de la FASE 7: lo que una persona ve y puede hacer en el
móvil cuando no hay señal. Sin redesign —se reutilizan `AppShell`, tokens,
tipografía y componentes existentes— y sin prometer nada que no exista: **no
hay backend**, así que la UI no habla de sincronización, colas de envío ni
copias en la nube.

### Banner de estado y recuperación

- `OfflineStatus` (montado una vez en `AppShell`): banner "Estás sin conexión"
  que explica qué sigue disponible en el dispositivo y ofrece volver al
  inicio; aviso "Conexión recuperada" al recuperar la señal, retirado solo a
  los ~6 s para no dejar un mensaje obsoleto.
- `connectivityStore` como estado externo con `useSyncExternalStore`:
  banner, recuperación y guard de navegación reaccionan al mismo cambio, con
  instantáneas estables para no encadenar renders.

### Guardia de navegación offline

- `useOfflineNavigationGuard` solo actúa sin conexión y solo con un listener en
  fase de captura sobre enlaces internos del propio producto. Consulta la
  caché y decide entre `router.push` (hay payload RSC), navegación completa
  (`location.assign`, hay solo documento) o bloqueo con aviso.
- `OfflineRouteNotice`: en lugar de un error de red, explica que la sección no
  está disponible y ofrece "Volver al inicio" / "Seguir aquí".
- Enlaces externos, `target`, descargas, clic con modificadores y cambios solo
  de fragmento se ignoran: el navegador conserva su comportamiento.
- Las decisiones viven en funciones puras (`offlineNavigation`,
  `connectivity`, `cacheApi`) y se prueban sin navegador; las vistas, con
  `renderToStaticMarkup` sobre vistas desacopladas.

### Instalación

- Botón nativo **solo** con `beforeinstallprompt`. En iOS/iPadOS, que no
  expone esa API, se muestran las instrucciones reales (Compartir → *Añadir a
  pantalla de inicio*) en lugar de un botón que no puede hacer nada.
- `isIosSafariLike` detecta iPadOS por UA Macintosh + `maxTouchPoints`, de modo
  que macOS y Android no se confundan con iOS.
- `installStore` captura `beforeinstallprompt` al evaluarse el módulo, no al
  montar el componente, y detecta la app ya instalada al arrancar. El descarte
  del CTA se persiste en `localStorage` y degrada a memoria si el storage está
  bloqueado.

### Corrección: payloads RSC servidos como HTML

La caché del service worker mezclaba documentos y payloads RSC, que comparten
clave al resolverse por `pathname`. De ahí salieron dos fallos reales:

- una recarga sin señal de un perfil devolvía la portada en vez del perfil;
- el *fallback* de `networkFirst` usaba `caches.match()`, que busca en **todas**
  las cachés: para el documento de `/adopciones` encontraba el payload RSC de
  esa ruta y lo servía como HTML, dejando la página en blanco con datos de
  vuelo en el `<body>` y sin banner de estado.

Corrección: **dos cachés** (`pawpass-<VERSION>` para documentos y estáticos,
`pawpass-routes-<VERSION>` para payloads RSC) y **ningún handler usa
`caches.match()`**; cada uno abre y consulta la suya. `hasShellCache()` tenía el
mismo defecto y ahora consulta la caché de documentos. `VERSION` sube a `v3`.
Un test de contrato en `purity.test.ts` lee `public/sw.js` y falla si reaparece
un match global o si los nombres de versión divergen de los de `cacheApi.ts`.

### Copy honesto

- La alerta de mascota perdida es explícita en que es local y en que para
  hacerla pública hay que compartir un enlace o una imagen.

### Verificación

- `npm test` (46 archivos, 595 tests), `npm run lint`, `npm run typecheck`,
  `npm run build` y `npm run validate:data` en verde (11 perfiles, 10 mocks de
  adopción, 2 de refugio; 26 avisos preexistentes).
- Smoke sobre la build de producción (`next start`): navegación offline real a
  una sección con payload cacheado (renderiza el contenido, no un error),
  recarga offline de un perfil, aviso de ruta no disponible, recuperación de
  conexión, y ausencia de botón de instalación falso en iOS emulado.
- Sin desbordamiento horizontal a 360, 375 y 390 px.

### Deuda conocida

- `VERSION` del SW es manual y los nombres de caché están duplicados en
  `public/sw.js` y `cacheApi.ts`; el test de contrato avisa de la divergencia,
  pero subir solo una de las dos cosas rompe la disponibilidad offline en
  silencio.
- La primera navegación tras instalar el SW no pasa por el worker (se sirve
  antes de `clients.claim()`), así que ese documento se cachea en la carga
  siguiente.
- Íconos PWA PNG (192/512) y `apple-touch-icon`, pendientes del bloque de
  diseño B.

---

## FASE 7 — PWA / CAMPO: Core e infraestructura (PR `feat/pwa-campo-core`)

**Estado:** Base PWA/offline completada (infraestructura Core)
**Fecha:** 2026-09-21

Prepara técnicamente PawPass para uso en campo desde móvil: Web App
Manifest, service worker conservador, estrategia offline explícita, capa de
almacenamiento local robusta y contratos de conectividad. No incluye la UI
de instalación/offline ni rediseño visual (bloque B posterior).

### Web App Manifest (`src/app/manifest.ts`)

- Manifest generado en `GET /manifest.webmanifest` con `name`, `short_name`,
  `description`, `lang`, `start_url`, `scope`, `display: standalone`,
  `theme_color`/`background_color` coherentes con la marca (esmeralda).
- Íconos: solo se referencia `/icon.svg` (existe, servido por Next desde
  `src/app/icon.svg`) con `purpose` `any` y `maskable`. **No se inventan
  assets**: los PNG 192/512 y el `apple-touch-icon` los aportará el bloque de
  diseño B.
- Metadata de instalación en `layout.tsx`: `applicationName`,
  `appleWebApp`, `formatDetection` y `viewport.themeColor`.

### Service worker (`public/sw.js`)

- Infraestructura nativa, sin dependencias nuevas. Registro solo en
  producción (`registerServiceWorker` guarda por `NODE_ENV`), montado en el
  layout a través del componente de infraestructura
  `ServiceWorkerRegistration`. En `next dev` nunca se registra.
- Estrategia conservadora:
  - Navegaciones (documentos): **network-first**, fallback a la copia local
    y, en último caso, al shell raíz `/`.
  - Assets estáticos con hash y medios públicos (`/_next/static/*`,
    `/pets/*`, `/docs/*`, `/manifest.webmanifest`, `/icon.svg`):
    **stale-while-revalidate**.
  - No se cachean respuestas no `ok` ni tráfico de datos/API (hoy no hay
    backend). `VERSION` debe incrementarse en cada despliegue.

### Estrategia offline

- **Funciona offline:** páginas visitadas previamente (SSG cacheado), assets
  cacheados, perfil estático, alerta perdido/solicitudes de adopción en
  `localStorage` (con fallback en memoria), QR ya renderizado.
- **No funciona offline (por diseño, sin backend):** sincronización remota,
  datos que hoy provienen solo de SSR/SSG en primer acceso, operaciones que
  dependerán de servidor en fases futuras.

### Almacenamiento local robusto (`src/lib/pwa/storage.ts`)

- Capa única y tipada (`StorageLike`, `getBrowserStorage`,
  `isStorageAvailable`, `safeGetItem`/`safeSetItem`/`safeRemoveItem`,
  `readStoredJson`). SSR-safe y tolerante a storage bloqueado, corrupto,
  lleno o inexistente. Sin React/Next.
- `useLostAlerts` y `useAdoptionRequests` ahora usan `getBrowserStorage()`.
  `lostAlertStorage` y `adoptionRequestStorage` reutilizan la capa y exponen
  `StorageLike` desde ella (mismo contrato, sin cambios de reglas).

### Conectividad (`src/lib/pwa/connectivity.ts` + `useOnlineStatus`)

- `ConnectivityStatus = "online" | "offline" | "unknown"`; SSR introduce
  `"unknown"`. `navigator.onLine` se documenta como indicador del dispositivo,
  no como verdad de conectividad con servidor. La UI la construye B.

### Comportamiento visible

- Sin cambios funcionales en perfiles, QR, emergencia, lost mode, estados,
  adopciones, refugios, salud, carnet físico, impresión o dark mode.
- `lostAlertStorage`/`adoptionRequestStorage` mantienen exactamente el mismo
  contrato público (`StorageLike` re-exportado desde `src/lib/pwa/storage`).

### Archivos creados

- `src/app/manifest.ts`, `src/app/manifest.test.ts`
- `src/lib/pwa/storage.ts`, `connectivity.ts`, `useOnlineStatus.ts`,
  `registerServiceWorker.ts` y sus tests (`storage`, `connectivity`,
  `registerServiceWorker`, `purity`)
- `src/components/pwa/ServiceWorkerRegistration.tsx`
- `public/sw.js`
- `docs/fase-7-pwa-offline.md`

### Archivos modificados

- `src/app/layout.tsx` (metadata PWA, viewport, montaje del registro)
- `src/lib/lostAlertStorage.ts`, `src/lib/adoptionRequestStorage.ts`
- `src/lib/useLostAlerts.ts`, `src/lib/useAdoptionRequests.ts`

### Tests

398 previos + 34 nuevos (storage, connectivity, manifest, registro de SW,
pureza de la capa) → **432 tests** en verde. `lint`, `typecheck`, `build`
(280 páginas SSG) y `validate:data` en verde.

---

## FASE 5 — Salud y expediente digital: Contrato Core (PR `feat/salud-core`)

**Estado:** Contrato de dominio de salud completado (base Core)
**Fecha:** 2026-09-18

Implementa únicamente el **contrato de dominio** de la FASE 5 del roadmap
(§§5.1–5.4): reglas puras de vacunación, contratos de desparasitación y
consultas del historial médico, reporte de "datos faltantes" y el contenido
del resumen sanitario exportable. No implementa UI (bloque B), PDF/PNG/SVG,
Supabase, Auth/RLS, backend, persistencia remota, dashboard de tutor ni de
veterinario.

### Contratos de dominio nuevos (`src/types/health.ts`)

- `HealthDeworming` (§5.2): `id`, `producto`, `fecha`, `proximaFecha`,
  `dosis`, `veterinario`, `documentoUrl`, `documentoId`, `fechaCreacion`,
  `origen`. El único conjunto obligatorio es `id`/`producto`/`fecha`; el
  resto son opcionales y se tratan como "datos faltantes", no como error.
- `HealthConsultation` (§5.3): `id`, `fecha`, `motivo`, `diagnostico`,
  `tratamiento`, `medicamentos[]`, `veterinario`, `documentos[]`
  (`HealthDocumentRef`), `fechaCreacion`, `origen`.
- `HealthDocumentRef`: referencia de documento (mismo `id`/`url` que
  `PetDocument` o adjunto independiente).
- `HealthExportSummary` (§5.4): proyección plana del resumen sanitario con
  el contenido exacto del roadmap — identificación, vacunas,
  desparasitación, alergias, condiciones, medicamentos, veterinario e
  historial médico. Es el contrato de **contenido**; la generación del PDF en
  sí es capa de servicio/UI (FASE 6), no dominio.

### Evolución backward-compatible de contratos existentes (`src/types/pet.ts`)

- `PetVaccine` gana **campos opcionales** (§5.1): `fechaCreacion`, `origen`
  y `documentoId` (vínculo explícito a `PetDocument`). Los campos existentes
  quedan intactos → `mascotas.json`, `adopciones.mock.json` y toda la UI
  siguen compilando sin cambios.
- `PetProfile` gana **arrays opcionales**: `desparasitaciones?` y
  `historialMedico?` (ausentes = sin registros; no se inventan arrays
  vacíos en los datos actuales).
- Sin ciclo de imports en runtime: los nuevos contratos solo usan `import
  type`.

### Reglas puras de dominio

`src/lib/domain/dateRules.ts` — fechas ISO `YYYY-MM-DD`: `isIsoDate`,
`normalizeIsoDate`, `compareIsoDates`, `todayIsoDate` (fecha de hoy
**inyectable**, cálculo determinista sin huso horario).

`src/lib/domain/vaccine.ts` (§5.1):
- `isVaccineStatus` / `VACCINE_STATUSES` (ahora en domain; `dataValidation`
  re-exporta desde aquí para no duplicar).
- `parseVaccineRecord` (parseo tolerante de payloads desconocidos; normaliza
  vacíos a null y descarta fechas inválidas).
- `evaluateVaccineCore` / `getVaccineMissingFields`: núcleo (id, nombre,
  fecha, estatus) y campos informativos (próxima dosis, lote, veterinario,
  documento) — base del concepto "datos faltantes".
- `sortVaccinesByDate(`cronologico`/`reverso`)`: orden cronológico; sin fecha
  válida van al final conservando orden relativo (orden estable).
- `filterVaccinesByStatus` / `filterVaccinesByQuery` / `filterVaccines`:
  filtros de historial con búsqueda sin distinguir mayúsculas **ni acentos**
  (normalización NFD sobre texto plano, sin reglas clínicas).
- `countVaccinesByStatus`: conteo por estado explícito; un estatus no
  reconocido se cuenta como `desconocido` (no se inventa un estado).
- `resolveVaccineNextDoseAlert` / `getVaccinesNeedingNextDose`: alertas de
  próxima dosis **exclusivamente calendáricas**. El `estatus` explícito del
  dato tiene prioridad; la fecha solo afina: `vencida` (marcada o fecha ya
  pasada), `vence_hoy` (fecha == hoy), `marcada_proxima` (marcada y aún
  futura). Sin fecha y sin marcado no hay alerta. **No** se recalcula el
  `estatus` almacenado.
- `linkVaccineDocument`: documento asociado por `documentoId` (preferente) o
  `documentoUrl` (equivalencia histórica).

`src/lib/domain/health.ts` (§5.2–5.4):
- Desparasitación: `parseHealthDeworming`, `sortDewormingsByDate`,
  `resolveNextDewormingDue` (elige `vencida` > `entrega_hoy` > `programada`
  más cercana, comparación de fechas únicamente) y campos faltantes.
- Historial: `parseHealthConsultation`, `sortConsultationsByDate`,
  `getConsultationsSummary` (totales con diagnóstico/tratamiento/
  medicamentos/sin veterinario) y campos faltantes.
- `getHealthCompletenessReport(pet)`: reporte de "datos faltantes" del
  expediente (por entidad e ítem con la lista de campos ausentes).
- `getHealthRecordCounts` / `hasHealthRecord`: existencia de contenido para
  estados vacíos de la UI (sin duplicar lógica en componentes).
- `buildHealthExportSummary(pet, today?)`: ensambla el resumen §5.4. Los
  datos ausentes se exportan como `null` (no se inventan).

### Compatibilidad

- `mascotas.json` y `adopciones.mock.json` intactos; `dataValidation.ts`
  solo se **extiende** de forma aditiva: re-exporta `VACCINE_STATUSES` desde
  el domain y valida los campos opcionales nuevos **cuando existen**.
- `mapping/vaccines.ts` se migra a `countVaccinesByStatus` del domain
  (misma API pública `getVaccineSummary`, cero cambio de UI).
- `vaccineStatus.ts` y `documentCategory.ts` siguen en `domain/` con metadata
  de iconos lucide-react (legado previo a FASE 5); se documentan y se
  blindan con un test de pureza: **cualquier archivo nuevo en `domain/` no
  puede importar React/Next/Supabase/lucide ni la capa de mapeo/componentes**
  (`src/lib/domain/purity.test.ts`).

### Tests

- `dateRules.test.ts` (+14), `vaccine.test.ts` (+57), `health.test.ts`
  (+39), `purity.test.ts` (+3): casos normales, datos incompletos, fechas
  límite (hoy, pasadas, futuras, inválidas), arrays vacíos, valores
  inválidos y orden estable.
- `getVaccineSummary` existente sigue pasando (ahora derivado del domain).
- Suite total: **359 pruebas** (antes 246), 30 archivos.

### Verificación

- `npm run lint` ✅ · `npm run typecheck` ✅ · `npm test` ✅ (359) · `npm run
  build` ✅ (SSG; mismo árbol de rutas que FASE 4) · `npm run validate:data`
  ✅ (11 reales + 7 mocks adopción + 2 mocks refugio; 26 avisos
  preexistentes, 0 errores).
- Smoke tests (`npm start`): rutas FASE 2–4 intactas (ver detalle al final).

### Cambios

- `src/types/health.ts` (nuevo), `src/types/pet.ts` (campos opcionales),
  `src/lib/domain/dateRules.ts` (nuevo), `src/lib/domain/vaccine.ts` (nuevo),
  `src/lib/domain/health.ts` (nuevo), `src/lib/domain/vaccine.test.ts`,
  `src/lib/domain/health.test.ts`, `src/lib/domain/dateRules.test.ts`,
  `src/lib/domain/purity.test.ts` (nuevos), `src/lib/dataValidation.ts`
  (aditivo), `src/lib/mapping/vaccines.ts` (deriva del domain),
  `CHANGELOG.md`.
- **No** se tocaron `mascotas.json`, componentes de UI, páginas, QR,
  servicios remotos, `vaccineStatus.ts`, `petStatus.ts` ni `emergency.ts`.

### Queda para B (Product/Frontend)

- Mappers de presentación de salud (view models de vacunas,
  desparasitación, historial y expediente) sobre estos contratos.
- Páginas/secciones UI de salud (§5.1–5.3), filtros, alertas de próxima
  dosis y recuperación del resumen exportable con `buildHealthExportSummary`.
- Datos de demostración (`desparasitaciones` / `historialMedico`) en los
  mocks que validen con `dataValidation`.
- Generación final del PDF del resumen (FASE 5.4 / 6) usando el contrato
  `HealthExportSummary`.

---

## FASE 4 — Adopciones y refugios: Product/Frontend (PR `feat/adopciones-refugios-ui`)

**Estado:** UI de adopción/refugios conectada al contrato Core de FASE 4 (prototipo)
**Fecha:** 2026-09-18

Implementa la UI de adopción/refugios (§§4.1–4.4) sobre el contrato de dominio de A
(PR `feat/adopciones-refugios-core`, ya mergeado). Es la contraparte Product/Frontend
de la FASE 4: catálogo de mascotas en adopción, perfil de refugio, CTA de adopción en
el perfil de la mascota y formulario de solicitud de adopción **simulada**. La UI usa
las funciones puras de A (`filterAdoptablePets`, `buildAdoptionCatalogEntry`,
`resolveAdoptionAvailability`, `validateAdoptionRequest`, `findShelterForPet`) como
**única** derivación; no duplica reglas de negocio ni redefine tipos. Los datos del
catálogo son **mock de demostración** (sufijo `.mock.json`), claramente identificados
como prototipo en la UI y en la documentación. **No** implementa backend/Supabase,
Auth/RLS, adopciones reales, ni necesidades/transparencia (§4.5 → FASE 14).

### Flujo de dominio reutilizado (sin duplicar)

- Catálogo: `filterAdoptablePets(demoPets)` (canónico + efectivo, sin señal runtime en
  servidor) → `buildAdoptionCatalogEntry(pet, findShelterForPet(...))` → view model.
- CTA en el perfil: `AdoptionRequestCta` (cliente) re-evalúa en runtime con
  `useLostAlerts` + `resolveAdoptionAvailability`; si una alerta de pérdida se activa,
  el CTA desaparece (regla "perdido nunca es candidato a adopción" del Core).
- Formulario: `validateAdoptionRequest({ pet, alert, draft })` bloquea solicitudes de
  mascotas no disponibles en el envío (mismo mensaje que la validación del Core).

### Datos de demostración (prototipo, separados de los reales)

- `src/data/shelters.mock.json` (2 refugios: Patitas con Causa, Rincón Canino
  Ixtapaluca) y `src/data/adopciones.mock.json` (7 perfiles `PetProfile` válidos:
  5 `en_adopcion` [mila, toby, luna, simba, rocky], 1 `fallecido` [canela] para mostrar
  el memorial y 1 `perdido` [bruno] para mostrar que nunca es candidato).
- **No** se tocó `mascotas.json` (11 mascotas reales intactas) ni se inventaron datos
  reales: las fotos reutilizan `public/pets/*.jpeg` como placeholders y los
  cargadores (`getMockShelters`, `getAdoptionDemoPets`) validan los archivos al cargar
  (`assertValidPetProfiles` / `assertValidShelters`).
- `scripts/validate-data.mts` se extiende de forma aditiva para validar también los
  mocks (estructura + assets), sin cambiar la salida de `mascotas.json`.

### Rutas y componentes nuevos

- `/adopciones`: catálogo (server) con `AdoptionCatalog` (cliente) — filtros por
  especie y por refugio, contador de resultados, estado vacío accesible y tarjeta
  `AdoptionPetCard` (imagen, badges En adopción/Verificado, género, talla, edad, zona,
  refugio). Sección de "Refugios participantes" con enlaces a sus perfiles.
- `/refugios/[id]`: perfil de refugio (server) con `generateStaticParams`, contacto
  (llamada/WhatsApp con `buildWhatsAppHref`, correo, redes normalizadas), mascotas en
  adopción (con CTA "Solicitar adopción") y "otras mascotas bajo su cuidado" (estado
  efectivo sin CTA de adopción).
- `/perfil/[id]/adopcion`: formulario de solicitud (server gate + cliente
  `AdoptionRequestForm`). Las mascotas no disponibles (p. ej. `en_casa`, `fallecido`,
  `perdido`) ven un panel explicativo según su estado efectivo; las disponibles
  ven el formulario.
- `AdoptionRequestCta` en el perfil: sección violeta visible **solo** cuando el estado
  efectivo es `en_adopcion` (regla "CTA solo cuando corresponde"), tras `PetStatusSection`.
- Los mocks de adopción son navegables en todo el perfil (`/perfil/[id]` y sub-rutas
  `alerta`, `documentos`, `vacunas`, `adopcion`) vía `getPetByIdAny` (fusiona reales +
  demo) sin tocar el flujo de las 11 mascotas reales.
- `PrototypeNotice`: aviso visible y consistente de "datos simulados / sin envío real".

### Solicitud de adopción simulada

- Formulario validado con `validateAdoptionRequest`: nombre, teléfono MX
  (10/52/521), email opcional y motivo requeridos; errores por campo con
  `aria-invalid`/`aria-describedby`, resumen `role="alert"` para errores generales y
  foco al primer campo inválido.
- Envío simulado → confirmación que muestra folio, fecha, mascota, estado `Enviada` y
  enlace de regreso. Persistencia **prototipo** en `localStorage`
  (`pawpass-adopcion:v1:<petId>`) con `adoptionRequestStorage.ts` (mismo patrón
  `StorageLike` + fallback en memoria que `lostAlertStorage`) y hook
  `useAdoptionRequests`. La UI y el CHANGELOG lo documentan: no llega a ningún servidor.

### Navegación

- `SiteNav`: nuevo enlace "Adopciones" (icono `HeartHandshake`, texto visible en `sm+`,
  icono solo en móvil) y CTA secundaria en la home "Ver mascotas en adopción".

### Tests

- `adoptionRequestForm.test.ts`: limpieza del draft, email/notas vacías → `null`,
  `buildAdoptionRequestFromDraft` (folio `sol-<seed>`, estado `enviada`) y mapeo de
  errores por campo/general.
- `adoptionRequestStorage.test.ts`: round-trip con storage falso, fallback en memoria,
  datos corruptos descartados y filtrado de entradas que no parecen solicitudes.
- `adoptionPresentation.test.ts`: `buildCatalogCard` con datos mock, `buildShelterPetCard`
  (adoptable/fallecido/perdido) y normalización de URLs sociales.
- `adoptionMockData.test.ts`: los mocks validan, no comparten ids/códigos con
  `mascotas.json`, y los refugios referencian mascotas existentes.
- `AdoptionPetCard.test.ts` / `ShelterPetCard.test.ts`: render presentacional
  (`renderToStaticMarkup`, con `next/image` mockeado).
- Suite total estimada: **209 + 49 = 258 pruebas** al verificar.

### Verificación

- `npm run lint` ✅ · `npm run typecheck` ✅ · `npm test` ✅ · `npm run build` ✅ (SSG;
  se añaden `/adopciones` y 2 perfiles de refugio al build) · `npm run validate:data` ✅
  (11 reales + 7 mocks adopción + 2 mocks refugio).
- Smoke tests (Chrome): `/adopciones` (filtros por especie y refugio, 375 px sin
  overflow), `/refugios/patitas-con-causa` y `/refugios/rincon-canino`, perfil de
  mascota adoptable con CTA, flujo completo de solicitud → confirmación → guardado en
  `localStorage`, y casos negativos (canela `fallecido`, bruno `perdido`, lucca
  `en_casa`) sin CTA ni formulario.

### Cambios

- **Nuevos:** `src/components/features/adoption/*` (PrototypeNotice, AdoptionPetCard,
  AdoptionCatalog, ShelterPetCard, AdoptionRequestCta, AdoptionRequestForm + 2 tests),
  `src/app/adopciones/page.tsx`, `src/app/refugios/[id]/page.tsx`,
  `src/app/perfil/[id]/adopcion/page.tsx`, `src/data/shelters.mock.json`,
  `src/data/adopciones.mock.json`, `src/lib/getMockShelters.ts`,
  `src/lib/getAdoptionDemoPets.ts`, `src/lib/getPetByIdAny.ts`,
  `src/lib/mapping/adoptionPresentation.ts` (+test), `src/lib/adoptionRequestForm.ts`
  (+test), `src/lib/adoptionRequestStorage.ts` (+test),
  `src/lib/useAdoptionRequests.ts`, `src/lib/adoptionMockData.test.ts`.
- **Modificados:** `src/app/perfil/[id]/page.tsx` (CTA de adopción),
  `src/app/page.tsx` (enlace al catálogo), `src/components/layout/SiteNav.tsx`
  (enlace "Adopciones"), `scripts/validate-data.mts` (validación aditiva de mocks),
  `CHANGELOG.md`.
- **No** se tocaron `package.json`/`package-lock.json`, `mascotas.json`,
  `src/lib/domain/*` (incluido el Core de A), `petStatus.ts`, `useLostAlerts.ts`,
  `lostAlertStorage.ts` ni los componentes de FASE 2/3.

### Queda para backend / fases posteriores (explícitamente NO implementado)

- `src/data/shelters.json` / `adoptions.json` reales con servicio (FASES 9–10) y
  conector de catálogo con `filterAdoptablePets(data, resolverDeAlertas)`.
- Persistencia real de solicitudes y ciclo `enviada → en_revision → aprobada|rechazada|
  cancelada → completada` (FASES 10, 15), notificaciones al refugio y mapeo
  `AdoptionRequest.shelterId` (hoy `null`: el refugio se asocia a la mascota vía
  `Shelter.mascotas`).
- Necesidades/transparencia del refugio (§4.5): FASE 14.
- Enlace del formulario a canales reales del refugio (hoy simulado con
  `localStorage`).

---

## FASE 4 — Adopciones y refugios: Contrato Core (PR `feat/adopciones-refugios-core`)

**Estado:** Contrato de dominio y datos completado (base Core)
**Fecha:** 2026-09-18

Implementa únicamente el **contrato de dominio y datos** de la FASE 4 del
roadmap (§§4.1–4.4): perfil de refugio, catálogo de mascotas en adopción,
estado `en_adopcion` y solicitud de adopción **simulada**. Es la base que
conectará con backend real en Fases 9–10 (services/Supabase) sin rehacer el
dominio. **No** implementa UI/catálogo visual (bloque B), backend, Supabase,
Auth/RLS, adopciones reales, necesidades/transparencia (FASE 14) ni
persistencia remota.

### Contratos de dominio nuevos

- `src/types/shelter.ts`: `Shelter` / `ShelterId` / `ShelterContact` (roadmap
  §4.1, sin `necesidades`: transparencia es FASE 14). El refugio referencia
  mascotas por `mascotas: PetId[]`, lo que habilita el filtro "Por refugio"
  (§4.2).
- `src/types/adoption.ts`: `AdoptionRequest` / `AdoptionRequestDraft`,
  `AdoptionApplicant`, `AdoptionRequestStatus` (ciclo completo
  `enviada → en_revision → aprobada | rechazada | cancelada → completada`,
  según la regla "una solicitud debe tener estado" de FASE 15) y
  `AdoptionCatalogEntry` (proyección normalizada de `PetProfile` para el
  catálogo §4.2).
- Una mascota en adopción **no requiere entidad nueva**: `PetProfile` ya
  contiene los datos mínimos (nombre, especie, raza, talla, fecha, foto, zona,
  estado, contacto); `AdoptionCatalogEntry` es una proyección de lo que ya
  existe.

### Funciones puras de dominio (`src/lib/domain/adoption.ts`)

- `resolveAdoptionAvailability({ estado, emergencia, alert })`: reutiliza
  `resolveEffectivePetState` (FASE 3) como **única** derivación del estado
  efectivo. Devuelve `{ available, reason, effectiveStatus }` con razones
  `"estado_no_disponible" | "perdido" | "terminal"`.
  - `en_adopcion` + señal de pérdida (runtime o estática) → **no** disponible;
  - `fallecido` → nunca disponible, aunque haya datos/alertas inconsistentes
    (se conserva la regla de FASE 3: terminal no se comporta como perdido);
  - `adoptado` / `rescatado` / `en_casa` / `perdido` → no disponibles.
- `isPetAvailableForAdoption(...)`: boolean de conveniencia sobre la
  disponibilidad resuelta.
- `filterPetsInAdoption(pets)`: filtro por estado canónico `en_adopcion`
  (`PetStatus` sigue siendo la fuente canónica del catálogo).
- `filterAdoptablePets(pets, alertResolver?)`: catálogo completo = filtro
  canónico + disponibilidad efectiva (sacando mascotas perdidas/terminales);
  acepta un resolver de `LostAlert` por mascota (para conectar `useLostAlerts`
  en UI sin acoplar el dominio a localStorage).
- `buildAdoptionCatalogEntry(pet, shelter?)`: normalización de la tarjeta de
  catálogo (formatos sin acoplar: la edad queda como `fechaNacimiento` cruda;
  la zona cae a `contacto.zonaHabitual` cuando no hay refugio).
- `validateAdoptionRequest({ pet, alert?, draft })`: validación de solicitudes
  **simuladas** que bloquea solicitudes de mascotas no disponibles
  (`pet_no_disponible`), exige nombre/teléfono/motivo, valida formato de
  teléfono MX (10/52/521), email opcional y fecha `YYYY-MM-DD`, y comprueba que
  el borrador refiera a la misma mascota.
- `isAdoptionRequestStatus` / `ADOPTION_REQUEST_STATUSES` /
  `initialAdoptionRequestStatus()` (las simuladas nacen `enviada`).

### Búsquedas de refugio (`src/lib/domain/shelter.ts`)

- `findShelterById(shelters, id)` y `findShelterForPet(petId, shelters)`
  (primer refugio cuya lista incluye a la mascota) para el catálogo "Por
  refugio" (§4.2).

### Compatibilidad con FASE 2 y FASE 3

- No se tocaron `petStatus.ts`, `resolveEffectivePetState`, `emergency.ts`,
  `useLostAlerts.ts`, `lostAlertStorage.ts`, `dataValidation.ts` ni
  `mascotas.json` (11 mascotas intactas, `validate:data` sin errores).
- `PetStatus` sigue siendo la fuente canónica; `resolveEffectivePetState` el
  mecanismo único de resolución; la regla terminal→no-lost se preserva y se
  prueba explícitamente.
- Datos mock: solo fixtures tipados dentro de los tests (misma política que
  FASE 3); no se inventan `shelters.json`/`adoptions.json` ni arquitectura de
  backend.

### Tests

- `src/lib/domain/adoption.test.ts` (nuevo, +37): ciclo de estados de
  solicitud, guardas, disponibilidad con overlay runtime/estático/terminal,
  filtros de catálogo canónico y efectivo, normalización de tarjeta (con y sin
  refugio, y compuesta con `findShelterForPet`), validación de solicitudes
  (incluye rechazo de mascota no disponible, terminal, perdida por alerta y
  acumulación de errores).
- `src/lib/domain/shelter.test.ts` (nuevo, +7): búsquedas por id y por
  mascota, lista vacía y primer coincidencia.
- Suite total: **209 pruebas** (antes 165), 20 archivos.

### Verificación

- `npm run lint` ✅ · `npm run typecheck` ✅ · `npm test` ✅ (209) · `npm run
  build` ✅ (SSG, 93 páginas) · `npm run validate:data` ✅ (11 perfiles
  válidos, 26 avisos preexistentes, 0 errores).
- Smoke tests (`npm start`): `/`, `/perfil/lucca`, `/perfil/PC-LUCCA-001`,
  `.../alerta`, `.../vacunas`, `.../documentos`, `/perfil/niko`,
  `/perfil/PC-LOKI-001`, `/login` → 200; `/perfil/inexistente` → 404. El
  badge de estado FASE 3 se renderiza en el perfil.

### Cambios

- `src/types/shelter.ts` (nuevo), `src/types/adoption.ts` (nuevo),
  `src/lib/domain/adoption.ts` (nuevo), `src/lib/domain/adoption.test.ts`
  (nuevo), `src/lib/domain/shelter.ts` (nuevo),
  `src/lib/domain/shelter.test.ts` (nuevo), `CHANGELOG.md`.
- **No** se tocaron `package.json`/`package-lock.json`, `mascotas.json`,
  `petStatus.ts`, componentes de UI, QR, `dataValidation.ts`, servicios ni
  rutas; no hay UI de catálogo/solicitud (bloque B) ni backend/Auth/RLS.

### Queda para B (Product/Frontend)

- `src/data/shelters.json` / `adoptions.json` reales (o el servicio que los
  cargue) y conector de catálogo con `filterAdoptablePets(data, resolverDeAlertas)`.
- Vista de catálogo de adopción (home §4.2) y perfil de refugio (§4.1).
- En `en_adopcion`, reemplazar el CTA de contacto por «Solicitar adopción»
  (§4.3) y flujo formulario → confirmación (§4.4) con estado local
  (`localStorage`) y los contratos de este Core.
- Mapper de presentación del catálogo (formatear edad/zona, roles por especie
  y refugio) y URLs públicas por `codigoPublico`.
- Necesidades/transparencia (§4.5): FASE 14, fuera de este contrato.

---

## FASE 3 — Estados y ciclo de vida de la mascota: Product/Frontend (PR `feat/estados-ui`)

**Estado:** UI de estados conectada al estado efectivo (integr. de FASE 3 completada)
**Fecha:** 2026-09-17

Conecta el contrato Core de FASE 3 (§3.1–3.3) con la UI del perfil: el estado
efectivo (`ProfileViewModel.status` + `resolveEffectivePetState`) se representa
en la cabecera, como banner de estado, en el contacto y en el pie, sin repetir la
fuente de verdad del dominio y **sin tocar** el lost mode runtime de FASE 2.
No implementa flujos de negocio por estado (adopciones, refugios, panel, backend),
que siguen en FASE 4+.

### Una sola derivación

- `EmergencyContactSection` y `LostModeAlertSections` consumen ahora el mismo
  selector unificado `resolveEffectivePetState` (antes `resolveLostState` /
  `resolveEmergencyContactState`). `resolveLostState` no se modificó.
- `ProfileViewModel.status` ya se renderiza: badge de estado en `PetHeader` y
  todos los gateos del perfil usan el estado canónico expuesto por el view model.

### Nuevos componentes (`src/components/features/pet-status/`)

- `PetStatusBadge` (cliente): badge del estado efectivo en la fila de badges de la
  cabecera (mint=En casa, rose=Perdido, violet=En adopción, teal=Adoptado,
  amber=Rescatado, stone=En memoria).
- `PetStatusSection` (cliente): reemplaza el uso directo de `LostModeAlertSections`
  en el perfil. Decide por `resolvePetStatusView`:
  - estado perdido efectivo → delega en la UI de FASE 2 (sin cambios);
  - `en_casa` → nada;
  - resto → `PetStateBanner`.
- `PetStateBanner` (presentacional): banner informativo por estado
  (`en_adopcion` con ancla `#contacto`, `adoptado`, `rescatado`, `fallecido`
  como memorial sin acciones).
- `PetFooterBanner` (cliente): `ThankYouBanner` solo para estados `en_casa` /
  `perdido` efectivos (ninguno para adopción/terminal).

### Terminal y estados contradictorios

- `fallecido` nunca muestra overlay de perdido: ni banner, ni contacto urgente, ni
  animación, aunque exista una señal estática o runtime stale en `localStorage`.
- `EmergencyContact` gana `isTerminal` → encabezado neutro «Contacto de su familia».
- En el perfil se oculta el enlace «Generar alerta de mascota perdida» para
  terminal; `/perfil/[id]/alerta` muestra un aviso de estado terminal y no genera
  alertas (metadata acorde).

### Presentación desacoplada del dominio

- `src/lib/mapping/petStatusPresentation.ts`: `getPetStatusMeta` (label/tono/icono
  por estado con fallback seguro) y `resolvePetStatusView` (decisión
  lost-mode/banner/none desde `resolveEffectivePetState`). Sin duplicar el dominio
  (§10.2: los colores no entran a `petStatus.ts`).
- `Badge` gana el tono `rose`.

### Tests

- `petStatusPresentation.test.ts` (nuevo): meta de los 6 estados + fallback, y
  `resolvePetStatusView` para en_casa, runtime→perdido, estático→perdido,
  adopción→banner y terminal que bloquea el overlay.
- `PetStatusBadge.test.ts` (nuevo): etiquetas por estado efectivo y tono rosa
  para perdido.
- `PetStateBanner.test.ts` (nuevo): adopción/adoptado/rescatado/fallecido/perdido
  y accesibilidad (`aria-labelledby`).
- `PetStatusSection.test.ts` (nuevo): en_casa vacío, estático delega en FASE 2,
  adopción→banner, fallecido sin overlay.
- `PetFooterBanner.test.ts` (nuevo): gracias en en_casa, llamado en perdido, nulo
  en adopción/terminal.
- `EmergencyContactSection.test.ts` (nuevo): contacto normal/urgente y terminal
  que nunca es urgente.
- `profile.test.ts` (extendido): passthrough de los 6 estados en el view model.

### Verificación

- `npm run lint` ✅ · `npm run typecheck` ✅ · `npm run test` ✅ · `npm run build` ✅
  (SSG) · `npm run validate:data` ✅.
- Smoke tests: perfil normal, modo perdido runtime activado/desactivado, rutas por
  `codigoPublico`, 375 px sin overflow y rutas de FASE 1+2 intactas.

### Cambios

- `src/lib/mapping/petStatusPresentation.ts` (nuevo) y su test,
  `src/components/features/pet-status/*` (nuevos: 4 componentes + 5 tests),
  `src/components/ui/Badge.tsx`, `src/components/features/pet-profile/PetHeader.tsx`,
  `src/components/features/pet-profile/EmergencyContact.tsx`,
  `src/components/features/pet-profile/EmergencyContactSection.tsx` (+test),
  `src/app/perfil/[id]/page.tsx`, `src/app/perfil/[id]/alerta/page.tsx`,
  `src/lib/mapping/profile.test.ts`, `CHANGELOG.md`.
- **No** se tocaron `package.json`/`package-lock.json`, `mascotas.json`,
  `petStatus.ts`, `resolveLostState`/`useLostAlerts`/`lostAlertStorage.ts`,
  `getPublicProfileUrl()`, QR, ni se adelantó FASE 4+.

---

## FASE 3 — Estados y ciclo de vida de la mascota: Contrato Core (PR `feat/estados-core`)

**Estado:** Contrato de dominio y datos completado (base Core)
**Fecha:** 2026-09-17

Implementa únicamente el **contrato de dominio y datos** de la FASE 3 del roadmap
(§§3.1–3.3): tipo/unión de estados, estado canónico, reglas de validación,
relación con el lost mode runtime y compatibilidad con los datos actuales.
**No** implementa los flujos de negocio por estado (adopciones reales, refugios,
panel, backend, etc.), que siguen fuera de alcance.

### Modelo de estado

- `PetStatus` (`src/types/pet.ts`) se amplía de `"en_casa" | "perdido"` a la unión
  de ciclo de vida completa: `en_casa | perdido | en_adopcion | adoptado |
  rescatado | fallecido` (roadmap §3.1). `PetProfile.estado` es el **estado
  canónico** serializable, que mapea 1:1 al futuro `pets.status` (§6.4).
- Nuevo módulo de dominio `src/lib/domain/petStatus.ts` (sin colores/labels de UI,
  §10.2): única fuente de `PET_STATUSES` y guardas `isPetStatus`,
  `isLostPetStatus`, `isTerminalPetStatus`, `isAdoptionPetStatus`; agrupaciones
  `LOST_PET_STATUSES`, `TERMINAL_PET_STATUSES`, `ADOPTION_PET_STATUSES`.

### Relación con el lost mode runtime (FASE 2)

- `resolveLostState` (FASE 2) queda **intacto**: la alerta de `localStorage` y el
  flag estático `emergencia.perdido` siguen alimentando el modo perdido; los
  componentes de emergencia no se reescriben.
- Nuevo selector unificado `resolveEffectivePetState({ estado, emergencia, alert })`
  que **delega en `resolveLostState`** (una sola derivación) y añade:
  - `status`: estado efectivo (runtime `perdido` si hay señal de pérdida, si no el
    canónico);
  - `lostOverlay`: `"runtime" | "static" | "none"` — de dónde viene la señal.
- Precedencia: alerta runtime activa → efectivo `perdido`; en su ausencia manda el
  `estado` canónico. Los estados terminales (`fallecido`) bloquean el overlay de
  lost mode.

### Evitar dos fuentes de verdad

- `PET_STATUSES` deja de estar duplicado en `dataValidation.ts`: ahora re-exporta
  el del dominio (una sola lista).
- `dataValidation.ts` añade reglas de consistencia `estado` ↔ `emergencia.perdido`:
  - `estado: "perdido"` exige `emergencia.perdido: true`;
  - `emergencia.perdido: true` exige `estado: "perdido"`;
  - `estado: "fallecido"` no admite modo perdido.
- `ProfileViewModel` expone `status: PetStatus` (mapper, sin render nuevo).

### Migración / compatibilidad

- **No se modificó `mascotas.json`**: las 11 mascotas ya son `estado: "en_casa"` con
  `emergencia.perdido: false`, válidas bajo la unión ampliada. No se inventan datos.
- El schema se **ancha** (compatibilidad hacia atrás): los estados nuevos quedan
  disponibles para FASE 4+, sin tocar los flujos actuales.

### Tests

- `src/lib/domain/petStatus.test.ts` (nuevo): estados válidos, estados inválidos,
  agrupaciones (`perdido`/terminal/adopción), resolución del estado con overlay
  runtime y estático, precedencia runtime sobre estático, fallback de campos y
  bloqueo del overlay en estados terminales.
- `src/lib/dataValidation.test.ts` (+6): acepta los 6 estados consistentes,
  rechaza estados inválidos, y detecta las inconsistencias `estado` ↔
  `emergencia.perdido` (incluido terminal).
- `src/lib/mapping/profile.test.ts` (nuevo): el view model expone el estado
  canónico (incluido `en_adopcion`) sin romper el mapeo.

### Verificación

- `npm run lint` ✅ · `npm run typecheck` ✅ · `npm run test` ✅ (134 pruebas, 12
  archivos) · `npm run build` ✅ (SSG, 93 páginas) · `npm run validate:data` ✅
  (11 perfiles válidos, 26 avisos preexistentes, 0 errores).
- Smoke tests (servidor `npm start`): `/`, `/perfil/lucca`, `/perfil/PC-LUCCA-001`,
  `/perfil/PC-LUCCA-001/alerta`, `.../vacunas`, `.../documentos`, `/login` → 200;
  `/perfil/inexistente` → 404. Modo perdido runtime (FASE 2) verificado en
  navegador: sin alerta no hay banner; con alerta en `localStorage` aparecen banner,
  «Modo alerta activo», «Encontré esta mascota», contacto urgente y la zona runtime;
  al limpiar la alerta vuelve al estado normal.

### Cambios

- `src/types/pet.ts`, `src/lib/domain/petStatus.ts` (nuevo),
  `src/lib/domain/petStatus.test.ts` (nuevo), `src/lib/dataValidation.ts`,
  `src/lib/dataValidation.test.ts`, `src/lib/mapping/profile.ts`,
  `src/lib/mapping/profile.test.ts` (nuevo), `CHANGELOG.md`.
- **No** se tocaron `package.json`/`package-lock.json`, `mascotas.json`,
  `emergency.ts`/`useLostAlerts.ts`/`lostAlertStorage.ts`, componentes de UI,
  `getPublicProfileUrl()`, QR, ni se adelantó FASE 4+ (adopciones/refugios/backend).

### Pendientes (para Product/Frontend)

- Conectar `LostModeAlertSections`/`EmergencyContactSection` a
  `resolveEffectivePetState` (misma derivación, hoy usan `resolveLostState`) y
  usar `ProfileViewModel.status` para representar el estado canónico en el perfil.
- Flujos de negocio por estado (`en_adopcion`, `rescatado`, `adoptado`,
  `fallecido`) y migración de datos reales: FASE 4+.

---

## Cierre de FASE 2 — Emergencias (PR `fix/emergencias-cierre`)

**Estado:** Pendientes técnicos cerrados / FASE 2 técnicamente completada
**Fecha:** 2026-09-17

Cierra los dos pendientes técnicos identificados al cierre de FASE 2
(Emergencias, Product/Frontend). No implementa funcionalidad nueva; solo
corrige la fuente de verdad efectiva del estado perdido y la higiene de
WhatsApp en el punto único de construcción de enlaces.

### Pendiente 1 — `EmergencyContact` ahora usa el estado efectivo

- `EmergencyContact` dejó de recibir `isLost={pet.emergencia.perdido}` (flag
  estático). Ahora el perfil renderiza un nuevo componente cliente
  `EmergencyContactSection` que usa `useLostAlerts` + la resolución del contrato
  de Fase 2 (`resolveLostState`), igual que `LostModeAlertSections`.
- Sin segunda fuente de verdad: un selector puro nuevo
  `resolveEmergencyContactState` (en `src/lib/domain/emergency.ts`) deriva
  `{ isLost, neighborhood }` a partir del contrato efectivo. La etiqueta de
  vecindario se centraliza en `buildNeighborhoodLabel` y dejó de calcularse en el
  mapeo a partir del flag estático (se elimina `neighborhood` de
  `ContactViewModel`).

### Pendiente 2 — Higiene de WhatsApp

- Nuevo `src/lib/phone.ts`: `toE164Digits` normaliza los números de 10 dígitos
  (formato nacional mexicano) a E.164 agregando el código de país `52` al
  construir enlaces `wa.me` — sin alterar `mascotas.json` (el dato fuente se
  mantiene como está documentado en FASE 14).
- `buildWhatsAppHref` pasa a ser el **único** constructor de enlaces `wa.me`
  (Core): `src/lib/mapping/profile.ts` y `src/lib/foundPetReport.ts` (como
  facade) lo usan. Ya no hay construcción duplicada.
- No se rompe ninguno de los números ya válidos: `52...` y `521...` se conservan
  tal cual.
- El placeholder `552201296480` (8 mascotas de la familia, formato no mexicano)
  **no se normaliza ni se inventa**: queda documentado como pendiente de
  verificar en producción (misma conclusión que FASE 14, sin cambios de datos).

### Tests

- `src/lib/phone.test.ts` (nuevo, +10): normalización E.164, no-regresión de
  números válidos y construcción de `wa.me`.
- `src/lib/domain/emergency.test.ts` (+6): `buildNeighborhoodLabel` y
  `resolveEmergencyContactState` en estado perdido activo y resuelto/inactivo.
- `src/components/features/pet-profile/EmergencyContact.test.ts` (nuevo, +2):
  el componente refleja el estado urgente (perdido) y el normal (resuelto).
- `src/lib/services/publicProfileUrl.test.ts` (+1): ninguna URL pública de los
  datos reales usa `pet.id` (siempre `codigoPublico`).

### Verificación

- `npm run lint` ✅ · `npm run typecheck` ✅ · `npm run test` ✅ (112 pruebas) ·
  `npm run build` ✅ (SSG, 93 páginas) · `npm run validate:data` ✅ (26 avisos
  informativos preexistentes, 0 errores).

### Cambios

- `src/lib/phone.ts` (nuevo), `src/lib/phone.test.ts` (nuevo),
  `src/components/features/pet-profile/EmergencyContactSection.tsx` (nuevo),
  `src/components/features/pet-profile/EmergencyContact.test.ts` (nuevo),
  `src/lib/domain/emergency.ts`, `src/lib/domain/emergency.test.ts`,
  `src/lib/mapping/profile.ts`, `src/lib/foundPetReport.ts`,
  `src/lib/foundPetReport.test.ts`, `src/lib/services/publicProfileUrl.test.ts`,
  `src/app/perfil/[id]/page.tsx`, `CHANGELOG.md`.
- **No** se tocaron `package.json`/`package-lock.json`, `mascotas.json`,
  `emergency.ts` (contrato `resolveLostState` no modificado),
  `lostAlertStorage.ts` ni `useLostAlerts.ts`; no se inventaron números, no se
  adelantó backend/Auth/RLS/FASE 3/adopciones.

---

## FASE 2 — Emergencias: Product/Frontend (PR `feat/emergencias-ui`)

**Estado:** Completada (bloque Product/Frontend de FASE 2)
**Fecha:** 2026-09-15

Implementa la capa de UX de emergencias sobre el contrato Core ya mergeado
(`feat/emergencias-core-estado-perdido`: `src/types/emergency.ts`,
`src/lib/domain/emergency.ts`, `src/lib/lostAlertStorage.ts`,
`src/lib/useLostAlerts.ts`). Corresponde al roadmap FASE 2 §§2.1–2.3 y a las
prioridades **U-3/U-4** de `UX_AUDIT.md` («Encontré esta mascota» y
«compartir ubicación voluntaria»).

### Feature: "Encontré esta mascota"

- Nuevo componente `FoundPetPanel` (`src/components/features/lost-pet/FoundPetPanel.tsx`),
  visible **únicamente cuando el perfil está en modo perdido** (`resolveLostState`),
  es decir «cuando corresponde».
- Flujo guiado: CTA «Encontré esta mascota» → panel «Avisa que encontraste a {nombre}»
  → compartir ubicación (voluntaria) → mensaje editable → enviar por WhatsApp o copiar.
- Geolocalización con `navigator.geolocation.getCurrentPosition()`: voluntaria,
  explícita, opcional, nunca recopilada en silencio (microcopy de privacidad visible).
- Estados completos: `locating` (cargando), `located` (con «Abrir mapa»),
  `error` contextual (denegado / no disponible / timeout) y cancelación.
- Enlace de mapa `https://www.google.com/maps?q=lat,lng` y mensaje precargado
  contextual (7.2 del roadmap: flujo QR → perfil → perdido → encontré → ubicación → mensaje).
- Accesibilidad: targets ≥44 px, `focus-visible`, `aria-live`/`role="status"` para
  estados, foco movido al título al abrir el panel, `aria-labelledby` en la sección.

### Lógica UI testeable extraída

- `src/lib/foundPetReport.ts` (puro, sin DOM): `buildFoundPetMessage`,
  `buildMapsLocationUrl`, `buildWhatsAppHref`, `formatCoordinate`,
  `getLocationErrorKey` y `LOCATION_ERROR_COPY` (con `src/lib/foundPetReport.test.ts`).
  Usa `src/lib/clipboard.ts` (ya existente, Core) para el copiado.

### Mejora visual del modo perdido

- `LostPetBanner`: el «Por favor contacta inmediatamente» era un `<p>` con
  estética de botón (engañoso para a11y). Ahora es un `<a href="#contacto">`
  funcional con `focus-visible`. Se añade `role="status"` a la insignia
  «Alerta activa» y `aria-labelledby` a la sección del banner.
- Jerarquía en modo perdido: banner (estado) → «Encontré esta mascota» (acción
  primaria) → instrucciones → contacto urgente con Llamar/WhatsApp. Coherente con
  la dirección visual rosa/ámbar existente.

### QR de emergencia — pendiente documentado (no implementado)

No se crea QR de emergencia nuevo:

- El QR de perfil (FASE 1, `QRShareCard`) ya cubre «escanear → perfil» con la URL
  pública estable por `codigoPublico` via `getPublicProfileUrl()`.
- Un QR específico de emergencia (p. ej. que codifique contacto/instrucciones o un
  payload firmado) **no tiene contrato en el Core** (`emergency.ts`/
  `lostAlertStorage.ts` no lo definen). Requiere decisión de Core/backend antes de
  poder construirse sin duplicar lógica; se documenta como pendiente, no se inventa.
- No se repitió la UX de QR de FASE 1.

### Verificación

- `npm run lint` ✅ · `npm run typecheck` ✅ · `npm run test` ✅ (96 pruebas, +13 en
  `foundPetReport.test.ts`) · `npm run build` ✅ (SSG, 49 páginas).
- Smoke tests (Chrome headless sobre `npm start`):
  - perfil normal sin banner ni CTA de emergencia;
  - activar modo perdido desde `/alerta` → perfil muestra banner «está perdido» + panel;
  - flujo completo «Encontré esta mascota» (compartir ubicación, mensaje con URL de
    mapa, copiar mensaje, omitir ubicación, cancelar);
  - error contextual cuando la geolocalización es denegada;
  - desactivar modo perdido oculta banner y panel;
  - responsive 375 px sin overflow horizontal;
  - rutas públicas válidas (200) e inválidas (404);
  - URLs públicas generadas con `codigoPublico` (nunca `pet.id`).

### Cambios

- `src/components/features/lost-pet/FoundPetPanel.tsx` (nuevo),
  `src/lib/foundPetReport.ts` (nuevo), `src/lib/foundPetReport.test.ts` (nuevo),
  `src/components/features/lost-pet/LostModeAlertSections.tsx`,
  `src/components/features/lost-pet/LostPetBanner.tsx`,
  `src/app/perfil/[id]/page.tsx`, `CHANGELOG.md`.
- **No** se tocaron `package.json`/`package-lock.json`, `mascotas.json`,
  `emergency.ts`, `lostAlertStorage.ts` ni `useLostAlerts.ts`; no se inventó
  backend/Auth/RLS ni se adelantó FASE 3 ni adopciones.

### Pendientes (fuera de alcance, requiere Core/producto)

- QR de emergencia específico: requiere contrato de Core (ver arriba).
- `EmergencyContact` recibe `isLost={pet.emergencia.perdido}` (flag estático); alinear
  su estilo urgente con `resolveLostState` en una evolución posterior del perfil.
- Números de WhatsApp de 10 dígitos sin código de país (`A2` de AUDITORIA.md):
  higiene de datos de Core pendiente; este PR reutiliza la misma construcción
  `wa.me/<número>` que usa el mapeo actual para no crear lógica paralela.

---

## FASE 16 — SEO, Open Graph y Twitter Card del perfil público (PR `feat/seo-og`)

**Estado:** Completada
**Fecha:** 2026-09-14

Resuelve el hallazgo **M5** de `AUDITORIA.md` / **§3.10** de `UX_AUDIT.md` (metadata social ausente) y las mejoras «Revisar metadata SEO / Agregar Open Graph / Agregar Twitter card / Definir imagen social del perfil» del roadmap FASE 1 §1.1. Compatible con Next.js 16.3.5.

### 16.1 `metadataBase` global en `src/app/layout.tsx`

- `metadataBase` derivado de `NEXT_PUBLIC_APP_URL` (misma fuente que el servicio de URLs), con fallback a `http://localhost:3000` en desarrollo.
- `openGraph` base (`type: website`, `siteName: PawPass`, `locale: es_MX`) y `twitter.card: summary` por defecto.
- Corrige el typo «publico» → «público» en la description del layout.

### 16.2 Metadata por perfil (`src/lib/seo.ts` + `generateMetadata`)

- Nuevo helper testeable `buildPetProfileMetadata(pet)` y derivados `getPetProfileSeoTitle` / `getPetProfileSeoDescription`.
- `title` y `description` derivados del perfil: `nombre`, `raza`, `especie` y aviso de «modo perdido» cuando `emergencia.perdido`.
- `alternates.canonical` y `og:url` → `getPublicProfileUrl(pet)` (ruta canónica por `codigoPublico`), **nunca** `pet.id`.
- `og:title`, `og:description`, `og:type=website`, `og:site_name`, `og:locale`, `og:image` (foto real del perfil, `alt` = nombre).
- `twitter:card` con `summary_large_image` cuando hay foto; `summary` sin imagen (fallback).
- Fallback sin invención de datos: si falta `fotoPerfilUrl` o `codigoPublico`, se omiten imagen/canonical.

### 16.3 404 de perfiles inexistentes

- `generateMetadata` de perfil no encontrado agrega `robots: { index: false }` (noindex).

### 16.4 Verificación

- `npm run lint` ✅ · `npm run typecheck` ✅ · `npm test` ✅ (46 pruebas, +15 en `seo.test.ts`) · `npm run build` ✅ (SSG).
- Smoke tests de metadata (servidor `npm start`):
  - `/perfil/PC-LUCCA-001`: title, description, canonical, og:title/description/url/image, twitter:card/image todos correctos con URL canónica por `codigoPublico`.
  - `/perfil/PC-VISERYS-001`: idem (og:image = `/pets/viserys.jpeg`).
  - Ruta inexistente: HTTP 404 + `<meta name="robots" content="noindex"/>`.
  - `/perfil/lucca` (ruta legacy): canonical y `og:url` apuntan a `PC-LUCCA-001`; sin referencias a `pet.id` en metadata (solo enlaces internos de navegación).

### 16.5 Cambios

- `src/app/layout.tsx`, `src/app/perfil/[id]/page.tsx`, `src/lib/seo.ts` (nuevo), `src/lib/seo.test.ts` (nuevo), `CHANGELOG.md`.
- **No** se tocaron `package.json`/`package-lock.json`, `mascotas.json`, QR, accesibilidad, tipos de dominio, rutas públicas ni backend.

---

## FASE 15 — Seguridad de dependencias: upgrade de Next.js y audit limpio (PR `feat/next-seguridad`)

**Estado:** Completada
**Fecha:** 2026-09-14

Resuelve el hallazgo **A1 / R-3** (ALTA→CRÍTICA) de la auditoría FASE 0. Corresponde al **PR #1 de la secuencia coordinada** de FASE 1 (§9 de `FASE0_COORDINACION_A_B.md`), que permanecía pendiente tras integrarse los PRs 2-5.

### 15.1 Upgrade de Next.js y ESLint

- `next` `16.2.9` → `16.3.5` (versión `latest`, patch de seguridad de la misma familia 16.x).
- `eslint-config-next` `16.2.9` → `16.3.5` (alineado al runtime).
- Compatibilidad verificada: peers exigen `react ^19`; el proyecto usa `react@19.2.4` → sin divergencia de versión.

### 15.2 Vulnerabilidades corregidas

| Severidad | Paquete | Detalle |
| --- | --- | --- |
| CRÍTICA | `next` | Middleware/Proxy bypass en App Router con Turbopack y single locale (GHSA, RCE). Resuelto en 16.3.5. |
| ALTA | `sharp` (transitiva de `next/image`) | CVEs de libvips/libheif; resuelto por el binario de 16.3.5. |
| ALTA | `postcss` | XSS por `</style>` sin escapar en la salida de stringify (build-time); resuelto vía dependencias de 16.3.5. |
| ALTA | `browserslist`, `brace-expansion`, `js-yaml` | DoS / consumo CPU (toolchain de build). |
| MODERADA | `@tailwindcss/postcss`, `baseline-browser-mapping` | actualizadas a versiones seguras con `npm audit fix` (sin `--force`). |

**Resultado:** `npm audit` → **0 vulnerabilidades** (antes: 1 crítica, 5 altas, 2 moderadas).

### 15.3 Cambios

- `package.json`: solo `next` y `eslint-config-next` (versiones exactas).
- `package-lock.json`: regenerado (transitivas del toolchain en rangos seguros).
- **Sin cambios de código funcional**: no se tocan capas `lib/`, `data/`, componentes ni rutas.

### 15.4 Verificación

- `npm run lint` ✅ · `npm run typecheck` ✅ · `npm test` ✅ (31 pruebas, 3 archivos).
- `npm run build` ✅ (SSG completo: 22 variantes de perfil + home/licencia).
- Smoke test con `npm start` (servidor de producción): 200 en `/`, `/perfil/<id>`, `/perfil/<codigoPublico>`, `/alerta`, `/vacunas`, `/documentos`, `/login`, `/docs/lucca/cartilla-vacunacion.pdf`, `/docs/viserys/cartilla-vacunacion.pdf`; 404 correcto en `/perfil/inexistente` y `/perfil/<código inexistente>`; `/ _next/image` devuelve `200 image/jpeg` (optimizador funcional, superficie de la amenaza A1).
- `npm audit` → 0.

---

## FASE 14 — Higiene de datos y validación de `mascotas.json` (PR2 `fix/data-higiene`)

**Estado:** Completada
**Fecha:** 2026-09-14

Rama `fix/data-higiene`. Elimina el drift entre `mascotas.json` y `PetProfile`, remplaza el cast silencioso `as PetProfile[]` por una validación real en runtime y documenta avisos no bloqueantes.

### 14.1 Correcciones de datos

- Tallas fuera del enum `PetSize`: `chicharrona` y `freya` tenían `"Pequeña"` (→ `"Pequeño"`), `arya` `"Mediana"` (→ `"Mediano"`).
- Sentineles inconsistentes en salud normalizados a `[]`: `alergias: ["Ninguna registrada"]` y `condicionesMedicas: ["Ninguna"]` en `lucca` y `niko`, y `alergias: ["Ninguna registrada"]` en `alix`. `HealthCard` ya manejaba arrays vacíos, por lo que no requirió cambios de UI (los sentineles se conservan como aviso en el validador para detectar regresiones).

### 14.2 Validación real de datos (nuevo `src/lib/dataValidation.ts`)

- `collectValidationErrors(data)` — valida estructura y tipos contra `PetProfile`: enums cerrados (`especie`, `estado`, `genero`, `talla`, `estatus` de vacunas, `tipo`/`categoria` de documentos), fechas `YYYY-MM-DD`, objetos anidados, arrays de strings, `null` permitido (`microchip`, campos de emergencia), unicidad de `id` y `codigoPublico`, patrón `PC-XXX-NNN`.
- `assertValidPetProfiles(data): asserts data is PetProfile[]` — lanza con el listado completo de errores (fails fast en build/dev) y estrecha el tipo sin `as`.
- `collectDataWarnings(data)` — avisos no bloqueantes: sentineles de salud, teléfonos no mexicanos, desajuste `telefonoPrincipal` vs `whatsapp`, teléfono compartido por muchas mascotas y campo `notas` vacío.

### 14.3 Eliminación del cast en `getAllPets`

- `src/lib/getAllPets.ts` ya no usa `mascotas as PetProfile[]`; valida al cargar el módulo (`assertValidPetProfiles`) y devuelve `PetProfile[]` con el tipo garantizado por la aserción.
- Ahora un drift de datos rompe la compilación/build en tiempo de ejecución en lugar de propagarse de forma silenciosa.

### 14.4 CLI `npm run validate:data`

- Nuevo `scripts/validate-data.mts` ejecutable con el type stripping de Node (sin compilación ni dependencias). Ejecuta la validación estructural + informe de avisos + comprobación de que existan los assets referenciados en `public/`.
- `tsconfig.json`: se habilita `allowImportingTsExtensions` (requisito de los imports `.ts` del CLI bajo `noEmit`).

### 14.5 Avisos pendientes (sin cambios en datos)

- Las 8 mascotas de la familia (loki, viserys, frey, sandor, bizcocho, chicharrona, freya, arya) comparten idénticos `telefonoPrincipal` y `whatsapp` = `552201296480`, formato no mexicano → posible placeholder. **Pendiente de verificar en producción**; no se inventan números.
- `alix`: `telefonoPrincipal` (10 dígitos) no coincide con `whatsapp` (`521...`).
- `notas` vacío en 8 mascotas (válido como `string`, aviso informativo).
- Los SVG legacy `public/pets/*.svg` (incl. `chicarrona.svg`, huérfano del rename) no tienen referencias en `src/` ni en los datos; se conservan sin uso.

### 14.6 Tests

- `src/lib/dataValidation.test.ts` (+16 pruebas): datos reales válidos, rechazo de enums inválidos, duplicados, fechas, microchip y avisos de sentineles/placeholders. Suite total: **31 pruebas pasando**.

---

## FASE 13 — URL pública estable del perfil (PR1 `fix/qr-url-estable`)

**Estado:** Completada
**Fecha:** 2026-09-14

Rama `fix/qr-url-estable` (commits en español, Conventional Commits). Resuelve C1 / R-2 / U-1 / M1 / DT2 / DT3: se eliminan las URLs de QR hardcodeadas y se introduce una única fuente de verdad para la URL pública del perfil, alineada a la arquitectura `Domain → Services → Mapping → View Models → UI` y al principio del roadmap «El QR identifica, no almacena».

### 13.1 Contrato del servicio de URL pública

Nuevo servicio `src/lib/services/publicProfileUrl.ts`:

- `getPublicProfileUrl(source): string | null` — construye la URL canónica del perfil a partir del **identificador público estable** `codigoPublico`. Acepta `string` (`getPublicProfileUrl("PC-LUCCA-001")`) o un perfil/objeto `{ identificacion: { codigoPublico } }`. **No depende de `pet.id`.**
- Ruta canónica producida: `/perfil/<codigoPublico>`.
- Base URL: se toma de `NEXT_PUBLIC_APP_URL` (normalizada sin barra final); sin variable definida devuelve ruta relativa (funciona en cualquier origin / localhost).
- Datos inválidos (vacío, en blanco, ausente) → `null` (convención del proyecto: degradación suave, sin excepciones propias).

### 13.2 Navegación con alias estable de `codigoPublico`

- `getPetById` ahora resuelve tanto por `pet.id` como por `pet.identificacion.codigoPublico` (alias estable).
- `generateStaticParams` de las 4 rutas de perfil (`/perfil/[id]`, `/alerta`, `/vacunas`, `/documentos`) pre-renderiza ambas variantes. Los enlaces internos (home, navbar) siguen usando `pet.id`; el QR usa la ruta canónica por `codigoPublico`.

### 13.3 Consumidores migrados al contrato

- `QRShareCard` recibe `profileUrl` ya resuelto (elimina el `https://pawpass.app` hardcodeado y deja de construir URLs).
- `LostPetAlertForm` usa `getPublicProfileUrl(pet)` para el texto compartido y el QR de la imagen de alerta.
- Campo `qr` (muerto: `urlPublica`/`texto`) eliminado de `PetProfile` y de `mascotas.json` (11 mascotas).

### 13.4 Tooling de calidad

- Agregado `vitest` con `vitest.config.ts` (alias `@` → `src`, entorno node).
- Scripts: `npm run test` (vitest) y `npm run typecheck` (`tsc --noEmit`).
- Pruebas unitarias del contrato en `src/lib/services/publicProfileUrl.test.ts` y del alias en `src/lib/getPetById.test.ts`.

---

## FASE 12 — Mejoras de dark mode, fix de descarga de alerta y menú compacto

**Estado:** Completada
**Fecha:** 2026-08-29

Rama `feat/rediseno-ui` (commits en español, Conventional Commits). Mejoras aplicando las reglas de la skill `vercel-react-best-practices` y corrección de un bug reportado de la visualización/descarga de la imagen de alerta.

### 12.1 Modo oscuro según mejores prácticas de Vercel
- `layout.tsx`: script inline síncrono en `<head>` que aplica la clase `dark` y `color-scheme` antes de la hidratación, eliminando el flash de tema claro→oscuro al cargar (regla `rendering-hydration-no-flicker`).
- `providers.tsx`: clave de `localStorage` versionada (`pawpass-theme:v1`) con **migración** automática desde la clave anterior sin versión (regla `client-localstorage-schema`); cache en memoria de las lecturas de storage (regla `js-cache-storage`).
- Tema gestionado con `useSyncExternalStore` (`getServerSnapshot = "light"`), lo que **elimina el hydration mismatch** que ocurría en SSG (el render servidor `light` difería del cliente `dark` por `prefers-color-scheme`), respetando la regla `set-state-in-effect`.
- Verificado en browser: 0 errores de consola tras estos cambios.

### 12.2 Fix descarga/compartir del generador de alerta
- **Causa raíz:** `html2canvas` no soporta los colores modernos (`oklab`/`lab`) que genera Tailwind CSS v4; al capturar la vista previa (que usa un gradiente) lanzaba `Attempting to parse an unsupported color function "lab"` y la imagen no se generaba → no se podía descargar ni compartir.
- **Solución:** reemplazo de `html2canvas` por **`html-to-image`**, que renderiza vía SVG `foreignObject` usando el motor del navegador y soporta los colores v4. Se elimina la precarga innecesaria a data URL y se valida el `blob` antes de compartir.
- Verificado en browser: la descarga genera un PNG válido (686×1788, RGBA, con foto y gradiente) con 0 errores de consola.

### 12.3 Menú de navegación más compacto
- `SiteNav.tsx`: reducido el espaciado del `nav` y de los enlaces; la huella de PawPrint queda pegada al texto "Inicio" (gap `gap-1`, icono de 15px) y se compactan los paddings.

### 12.4 Fix dark mode de subpáginas, menú agrupado, "Carnet Digital" y story en galería
- **Fix dark mode en Documentos/Vacunas/Alerta:** `SubpageHeader.tsx` recibía gradientes claros (`via-white`) sin variantes `dark:`, quedando como bloque blanco en modo oscuro. Se añade un overlay absoluto `hidden dark:block bg-gray-900 ring-gray-800` que lo tapa en dark; el icono decorativo pasa a `dark:text-gray-800`. Aplica automáticamente a Documentos, Vacunas, Alerta y Login. Se añaden también variantes `dark:` al enlace "Volver al perfil" en `alerta/page.tsx`.
- **Menú agrupado en un solo pill:** `SiteNav.tsx` reescrito como un único bloque agrupado (`divide-x rounded-full bg-white px-1.5 py-1.5 ring-1`) que junta la huella (Inicio) con Mascotas, Iniciar sesión y el botón de modo oscuro, separados por divisores verticales. En `<640px` los textos se ocultan (`hidden sm:inline`) y `Mascotas` gana el icono `Bone`, evitando desbordes; `AppShell.tsx` reduce su `gap` en mobile (`gap-2 sm:gap-4`) para que todo quepa junto al logo.
- **Subtítulo "Carnet Digital":** renombrado "Pasaporte Digital" → "Carnet Digital" en el header (`AppShell.tsx`), el hero (`page.tsx`) y la metadata de `layout.tsx` (título "PawPass | Carnet Digital").
- **Círculo de story en la galería:** `RecentPhotos.tsx` añade la prop `profilePhoto: string`; renderiza un círculo con ring tipo Instagram (gradiente `#feda75→#4f5bd5`, padding 3px, interior blanco/dark) con la foto de perfil de 64px y la etiqueta "Perfil". `perfil/[id]/page.tsx` pasa `profilePhoto={pet.mascota.fotoPerfilUrl}`.
- Verificado en browser: overlay `bg-gray-900` visible en dark en Documentos y Alerta; nav de 358px en desktop y 161px en mobile sin desborde; subtítulo y título "Carnet Digital" mostrados; 0 errores de consola.

### 12.5 Fix navbar del perfil, dark+WCAG en Instagram, imagen de alerta completa, modo alerta y filtro por especie
- **Navbar del perfil (ProfileNav):** los botones pasan a iconos de 18px e igual talla en todas las pantallas. En móvil son botones cuadrados de 40×40 centrados (solo el icono, con `h-10 w-10`); en `md+` mantienen icono + texto alineados (`md:h-auto md:w-auto`). El contenedor pasa a `w-full justify-between` para distribuir los botones con espacio uniforme (equivalente a `space-between`), llenando todo el ancho de la barra tanto en escritorio como en móvil.
- **Dark mode + WCAG en la sección Instagram (`RecentPhotos`):** el título, los chips (`pink`), el label "Perfil" y el grid ahora tienen variantes `dark:` con fondos translúcidos (`dark:bg-pink-500/15`, `dark:ring-pink-500/30`) y textos con contraste (`dark:text-pink-300`, `dark:text-gray-300`). El lightbox pasó a `dark:bg-gray-900` con textos e índices adaptados; los `alt` descriptivos se mantienen.
- **Imagen de alerta completa:** `LostPetAlertImage` deja de limitarse a `max-w-[480px]` y ocupa todo el ancho disponible (`w-full`). La vista previa se amplía a `max-w-3xl` y la captura/descarga sube a `pixelRatio: 3`, generando un PNG de ~2304×2565px (completo y nítido).
- **Modo alerta en el perfil restaurado:** nuevo hook `useLostAlerts` (localStorage versionado `pawpass-alerta:v1:<id>`, con `useSyncExternalStore` para evitar hydration mismatch en SSG) que guarda zona/fecha/recompensa/mensaje. El generador de alerta (`LostPetAlertForm`) incorpora una tarjeta "Modo alerta en el perfil" para activar/desactivar. El perfil muestra vía `LostModeAlertSections` el banner "está perdido", las instrucciones y un panel con "Desactivar modo alerta" cuando está activo (además del flag estático `emergencia.perdido`).
- **Filtro por especie en la home:** nuevo componente cliente `PetsList` con chips "Todos / Perro / Gato", contador de resultados y estado vacío; reemplaza el listado estático del `GlassCard`.
- Verificado en browser: perfil con modo alerta muestra banner/instrucciones; preview de imagen 768px y PNG 2304×2565; filtro "Gato" muestra 8 mascotas; 0 errores de consola.

### Verificación Fase 12
- `tsc --noEmit` ✅ sin errores
- `npm run lint` ✅ sin errores
- `npm run build` ✅ compila y genera rutas SSG
- Prueba manual en browser (descarga de la imagen de alerta) ✅
- Prueba manual en browser (dark mode y responsive) ✅

### Dependencias
- **Añadida:** `html-to-image`
- **Eliminada:** `html2canvas`, `@types/html2canvas`

### Archivos modificados
- `src/app/layout.tsx`
- `src/app/providers.tsx`
- `src/components/features/lost-pet/LostPetAlertForm.tsx`
- `src/components/layout/SiteNav.tsx`
- `package.json`, `package-lock.json`

### Archivos de la sub-fase 12.4
- `src/components/ui/SubpageHeader.tsx`
- `src/components/layout/SiteNav.tsx`
- `src/components/layout/AppShell.tsx`
- `src/components/features/pet-profile/RecentPhotos.tsx`
- `src/app/page.tsx`
- `src/app/layout.tsx`
- `src/app/perfil/[id]/page.tsx`
- `src/app/perfil/[id]/alerta/page.tsx`

### Archivos de la sub-fase 12.5
- `src/components/features/pet-profile/ProfileNav.tsx`
- `src/components/features/pet-profile/RecentPhotos.tsx`
- `src/components/features/lost-pet/LostPetAlertImage.tsx`
- `src/components/features/lost-pet/LostPetAlertForm.tsx`
- `src/components/features/lost-pet/LostModeAlertSections.tsx` (creado)
- `src/components/features/home/PetsList.tsx` (creado)
- `src/lib/useLostAlerts.ts` (creado)
- `src/app/perfil/[id]/page.tsx`
- `src/app/page.tsx`

---

## FASE 11 — Rediseño de UI, Modo Noche y 9 correcciones

**Estado:** Completada
**Fecha:** 2026-08-29

Rama `feat/rediseno-ui` (commits en español, Conventional Commits). Rediseño de la interfaz, menú global, dark mode, y resolución de 9 problemas detectados. Se aplicaron las 5 skills instaladas (frontend-design, tailwind patterns, vercel-react, nextjs-app-router, typescript-pro).

### 11.1 Base de diseño: dark mode + tokens + menú global
- Tokens de color/superficie/sombra en `globals.css` con variantes `.dark`; patrón Tailwind v4 `@custom-variant dark`.
- `providers.tsx` nuevo: `ThemeProvider` + `useTheme` (persiste en `localStorage` `pawpass-theme`, respeta `prefers-color-scheme`, aplica `color-scheme` y clase `.dark`).
- Menú global `SiteNav.tsx`: Inicio, Mascotas (/#mascotas), Iniciar sesión (placeholder `/login`) y toggle de modo noche.
- `layout.tsx`: envuelto en `ThemeProvider` + `suppressHydrationWarning`.
- `AppShell.tsx`: integrado `SiteNav`, eliminado badge "Perfil Verificado".
- **Fix**: corazón decorativo del hero ya no tapa el título "PawPass" en el rango `sm` (se quitó el decorativo que se superponía al `h1`).
- `app/login/page.tsx`: placeholder de login.
- **Nota lint:** corregido `set-state-in-effect` en `providers.tsx` con inicialización lazy del estado.

### 11.2 Fotos separadas de documentos + galería Instagram
- Los documentos de categoría `foto` se excluyen de la tarjeta "Documentos" y de la página de documentos (`profile.ts`, `documentos/page.tsx`); se quita la categoría/filtro "Fotos" de `documentCategory.ts`.
- `RecentPhotos.tsx` rediseñado como **galería estilo Instagram**: grid responsive, lightbox con `framer-motion` (`AnimatePresence` + `MotionConfig reducedMotion`), navegación con flechas y teclado, contador, vista previa.

### 11.3 Mini-nav del perfil
- `ProfileNav.tsx` rediseñado: contenedor segmentado (glow por debajo) con conmutador activo, soporte dark mode y `aria-current`.

### 11.4 Fix desborde de URL en QR
- `QRShareCard.tsx`: la URL ahora usa `break-all` para no desbordar; dark mode en la tarjeta.

### 11.5 Ubicación removida
- Quitado el botón "Ubicación" / enlace a Google Maps de `EmergencyContact.tsx` (se conserva el texto de zona/vecindario).
- Limpiados `locationUrl` y `locationLabel` del `ContactViewModel` en `profile.ts`.

### 11.6 Generador de alerta: cambiar foto + captura robusta
- `LostPetAlertForm.tsx`: opción "Cambiar foto" (subida de imagen local, vista previa, restaurar la del perfil) y captura `html2canvas` más robusta (sin `window`/`document` a nivel de módulo para no romper SSG; `scrollX/scrollY`, `windowWidth`, `allowTaint`, `logging`).

### 11.7 Dark mode en componentes restantes
- `.dark .soft-card` en `globals.css` hace los `GlassCard` oscuros automáticamente; `.dark body` con radial-gradients oscuros.
- `dark:` variants en: `Badge`, `SubpageHeader`, `PetHeader`, `page.tsx` (hero + card), `InfoCard`, `HealthCard`, `VetCard`, `VaccineTimeline`, `VaccineDetailCard`, `DocumentsCard`, `DocumentPreview`, `DocumentListClient`, `documentos/page`, `vacunas/page`, `LostPetBanner`, `LostPetInstructions`, `ThankYouBanner`, `LostPetAlertForm`, `EmergencyContact`.

### Verificación Fase 11
- `tsc --noEmit` ✅ sin errores
- `npm run lint` ✅ sin errores
- `npm run build` ✅ compila y genera 49 rutas SSG (home, login, perfil, alerta, documentos, vacunas + not-found + icon)

### Archivos creados
- `src/app/providers.tsx`
- `src/components/layout/SiteNav.tsx`
- `src/app/login/page.tsx`

### Archivos modificados
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/components/layout/AppShell.tsx`
- `src/components/ui/GlassCard.tsx`, `Badge.tsx`, `SubpageHeader.tsx`
- `src/components/features/pet-profile/RecentPhotos.tsx`, `ProfileNav.tsx`, `PetHeader.tsx`, `EmergencyContact.tsx`, `QRShareCard.tsx`, `InfoCard.tsx`, `HealthCard.tsx`, `VetCard.tsx`, `VaccineTimeline.tsx`, `VaccineDetailCard.tsx`
- `src/components/features/documents/DocumentsCard.tsx`, `DocumentPreview.tsx`
- `src/components/features/lost-pet/LostPetAlertForm.tsx`, `LostPetBanner.tsx`, `LostPetInstructions.tsx`, `ThankYouBanner.tsx`
- `src/lib/mapping/profile.ts`
- `src/lib/domain/documentCategory.ts`
- `src/app/perfil/[id]/page.tsx`
- `src/app/perfil/[id]/documentos/page.tsx`
- `src/app/perfil/[id]/documentos/DocumentListClient.tsx`
- `src/app/perfil/[id]/vacunas/page.tsx`

---

## FASE 10 — Refactor de arquitectura (SOLID / DRY)

**Estado:** En progreso (Fases 10.1–10.3 completadas)
**Fecha:** 2026-08-27

Trabajo de limpieza de arquitectura con foco en SOLID, DRY y eliminación de deuda técnica. Se mantiene la arquitectura base (Next.js App Router + capas `types`/`lib`/`ui`/`features`/páginas), que ya era la correcta; se corrigen acoplamientos, duplicaciones y un bug latente.

### Objetivo
Dejar un proyecto con las piezas de dominio y presentación correctamente segregadas, sin lógica de negocio incrustada en la página, y eliminando la duplicación de estados/labels.

---

#### 10.1 Centralización de estados y categorías (FASE COMPLETADA)

##### 10.1.1 Módulo de dominio `vaccineStatus`
- **Nuevo** `src/lib/domain/vaccineStatus.ts`: fuente única de verdad para el estado de vacuna. Devuelve `{ label, icon, tones, iconTones }` para `al_dia | proxima_dosis | vencida`.
- **Bug corregido:** `toVaccineLabel` (antes en `page.tsx`) trataba `vencida` como "Al día"; ahora el estado "Vencida" se muestra correctamente en timeline, detalle y resumen.
- Consumidores actualizados:
  - `VaccineDetailCard.tsx`: eliminada la config local duplicada `statusConfig`; usa el módulo.
  - `VaccineTimeline.tsx`: usa `VaccineStatusLabel` tipado y el badge/lógica de "Próxima dosis".
  - `perfil/[id]/page.tsx`: eliminado `toVaccineLabel`; usa el módulo.
- Nueva función `getVaccineSummary(pet)` en `src/lib/mapping/vaccines.ts` para el resumen (al día / próximas / vencidas) de la página de vacunas.

##### 10.1.2 Módulo de dominio `documentCategory`
- **Nuevo** `src/lib/domain/documentCategory.ts`: registro único de categorías de documento con `{ label, icon, chipTones, activeTones }` y derivación de la lista de filtros (`todos` + 6 categorías).
- Consumidores actualizados (antes repetían labels/colores en 3 archivos):
  - `petDocuments.ts`: `getDocumentCategoryLabel` ahora re-exporta desde el módulo de dominio.
  - `DocumentFilters.tsx`: `filters[]`, `tones` y `activeTones` locales eliminados; usa `getDocumentFilterList()`.
  - `DocumentPreview.tsx`: `categoryIcons`/`categoryTones` local eliminados; usa `getDocumentCategoryMeta()`.

##### 10.1.3 Componente `SubpageHeader`
- **Nuevo** `src/components/ui/SubpageHeader.tsx`: hero parametrizado `{ eyebrow, eyebrowTone, title, description, icon, background }`.
- Reemplazó bloques hero duplicados en 3 páginas:
  - `documentos/page.tsx`
  - `alerta/page.tsx`
  - `vacunas/page.tsx`

##### 10.1.4 Código muerto eliminado
- `src/components/ui/SectionTitle.tsx` (sin uso en ningún lugar).
- `src/lib/constants.ts` (`TEMP_IMAGE_GUIDE`, sin uso).

### Errores o problemas encontrados
- **TS2367 / TS2322:** el tipo `DocumentFilterMeta` inicialmente extendía `DocumentCategoryMeta`, lo que provocaba que `"todos"` (no es una categoría) no compilara. Corregido separando los dos tipos.
- **Warning ESLint:** `FileText` importado sin usar en `DocumentPreview.tsx` tras la centralización. Eliminado.

### Verificación Fase 10.1
- `tsc --noEmit` ✅ sin errores
- `npm run lint` ✅ sin warnings
- `npm run build` ✅ compila y genera 48 páginas SSG

### Archivos modificados / creados
- `src/lib/domain/vaccineStatus.ts` — nuevo
- `src/lib/domain/documentCategory.ts` — nuevo
- `src/lib/mapping/vaccines.ts` — nuevo
- `src/components/ui/SubpageHeader.tsx` — nuevo
- `src/lib/petDocuments.ts` — re-export delegado
- `src/components/features/pet-profile/VaccineDetailCard.tsx` — usa módulo de dominio
- `src/components/features/pet-profile/VaccineTimeline.tsx` — usa módulo de dominio
- `src/components/features/pet-profile/DocumentFilters.tsx` — usa módulo de dominio
- `src/components/features/pet-profile/DocumentPreview.tsx` — usa módulo de dominio
- `src/app/perfil/[id]/page.tsx` — usa módulo de dominio para estado de vacuna
- `src/app/perfil/[id]/vacunas/page.tsx` — usa `SubpageHeader` y `getVaccineSummary`
- `src/app/perfil/[id]/documentos/page.tsx` — usa `SubpageHeader`
- `src/app/perfil/[id]/alerta/page.tsx` — usa `SubpageHeader`
- `src/components/ui/SectionTitle.tsx` — eliminado
- `src/lib/constants.ts` — eliminado

---

#### 10.2 Extracción de mappers a `lib/mapping` (FASE COMPLETADA)

##### 10.2.1 Mapper de perfil
- **Nuevo** `src/lib/mapping/profile.ts`: concentra toda la lógica de transformación `PetProfile → ProfileViewModel` que antes vivía en `perfil/[id]/page.tsx`.
  - `toProfileViewModel(pet)` (antes `toProfileProps`).
  - `formatPhoneForDisplay`.
  - Tipos del view-model exportados: `PetHeaderViewModel`, `ContactViewModel`, `InfoViewModel`, `HealthViewModel`, `VetViewModel`, `VaccineTimelineItem`, `PhotoViewModel`, `ProfileViewModel`.
- **Mejora SOLID/SRP:** la página dejó de ser un "adaptador dominio→presentación". Ahora es un orquestador fino (fetch + `notFound` + render) que depende de una abstracción (el mapper) y no del formato crudo (principio de inversión de dependencias).
- `formatPhoneForDisplay` ahora es consumible/reutilizable; si más adelante hay otra página que formatee teléfonos, se usa el mismo helper.
- `perfil/[id]/page.tsx`: eliminadas las ~90 líneas de `toProfileProps`/`formatPhoneForDisplay`.

### Verificación Fase 10.2
- `tsc --noEmit` ✅ sin errores
- `npm run lint` ✅ sin warnings

### Archivos modificados / creados
- `src/lib/mapping/profile.ts` — nuevo (mapper de perfil)
- `src/app/perfil/[id]/page.tsx` — usa `toProfileViewModel`; lógica del mapper removida

---

#### 10.3 Reorganización por feature y helpers (FASE COMPLETADA)

##### 10.3.1 Reorganización por feature
Se agruparon los componentes por responsabilidad de negocio (feature-slicing) para que el feature "perfil" deje de mezclar responsabilidades:
- **`src/components/features/lost-pet/`** (nueva): `LostPetBanner`, `LostPetInstructions`, `ThankYouBanner`, `LostPetAlertForm`, `LostPetAlertImage`.
- **`src/components/features/documents/`** (nueva): `DocumentsCard`, `DocumentFilters`, `DocumentPreview`.
- **`src/components/features/pet-profile/`**: conserva Header, Info, Salud, Veterinario, Contacto, Fotos, Navegación, QR y Vacunas.

Actualizados todos los imports afectados:
- `perfil/[id]/page.tsx`, `perfil/[id]/alerta/page.tsx`, `perfil/[id]/documentos/DocumentListClient.tsx`, `documents/DocumentsCard.tsx`.

##### 10.3.2 Helper de icono de especie
- **Nuevo** `src/lib/petIcon.tsx`: componente `PetSpeciesIcon` que retorna `Cat`/`Dog` por especie.
- Reemplazó el patrón duplicado `species.toLowerCase().includes("gato") ? Cat : Dog` en 4 lugares: `Home (page.tsx)`, `EmergencyContact`, `VetCard`, `ThankYouBanner`.
- **Problema encontrado:** la versión inicial (`getPetIcon` que retornaba el componente) disparaba la regla de eslint `react-hooks/static-components` ("Cannot create components during render"). Resuelto convirtiéndolo en componente `PetSpeciesIcon`.

##### 10.3.3 Helper `getPetOrNotFound`
- **Nuevo** `src/lib/getPetOrNotFound.ts`: envuelve `getPetById` + `notFound()`.
- Eliminó la repetición del patrón `if (!pet) { notFound(); }` en el cuerpo de las 4 páginas de perfil (`perfil`, `vacunas`, `documentos`, `alerta`).
- `generateMetadata` sigue usando `getPetById` + comprobación (ahí no se lanza `notFound`, se devuelve metadata "no encontrada").

##### 10.3.4 Limpieza de `DocumentsCard`
- Eliminado el filtro redundante `documents.filter((document) => document.visiblePublico)`: los documentos que recibe ya son públicos (filtrados en el mapper).

### Errores o problemas encontrados
- **ESLint `react-hooks/static-components`:** crear un componente dentro del render (asignando `const PetIcon = getPetIcon(species)`) está prohibido. Se resolvió con un componente estático `PetSpeciesIcon`.
- **TS2304** temporal: al mover `page.tsx` al helper, se quitó el import `getPetById` que `generateMetadata` aún necesitaba. Restaurado.

### Verificación Fase 10.3
- `tsc --noEmit` ✅ sin errores
- `npm run lint` ✅ sin warnings
- `npm run build` ✅ compila y genera 48 páginas SSG

### Archivos modificados / creados
- `src/components/features/lost-pet/` — carpeta nueva con 5 componentes movidos
- `src/components/features/documents/` — carpeta nueva con 3 componentes movidos
- `src/lib/petIcon.tsx` — nuevo (`PetSpeciesIcon`)
- `src/lib/getPetOrNotFound.ts` — nuevo
- `src/app/page.tsx` — usa `PetSpeciesIcon`
- `src/components/features/pet-profile/EmergencyContact.tsx` — usa `PetSpeciesIcon`
- `src/components/features/pet-profile/VetCard.tsx` — usa `PetSpeciesIcon`
- `src/components/features/lost-pet/ThankYouBanner.tsx` — usa `PetSpeciesIcon`
- `src/components/features/documents/DocumentsCard.tsx` — filtro redundante eliminado
- `src/app/perfil/[id]/page.tsx`, `vacunas/page.tsx`, `documentos/page.tsx`, `alerta/page.tsx` — usan `getPetOrNotFound` y rutas actualizadas

---

## FASE 0 — Limpieza de datos y tipos

**Estado:** Completada
**Fecha:** 2026-08-26

### Tareas realizadas

#### 0.1 Limpieza de `mascotas.json`
- Eliminados todos los strings `"No hay"` que debían ser `null` o `""`
- Campos corregidos: `emergencia.recompensa`, `emergencia.fechaPerdida`, `emergencia.zonaPerdida`, `emergencia.mensajeEmergencia`, `identificacion.microchip`, `contacto.email`, `contacto.telefonoSecundario`
- **Problema encontrado:** Viserys tenía documentos con IDs de Chicharrona (`chicharrona-cartilla`, `chicharrona-vet`, etc.). Corregidos a `viserys-doc-*`
- Estandarizadas todas las fechas a formato `YYYY-MM-DD` (antes había mezcla de `MM/DD/YYYY` y `YYYY-MM-DD`)
- Agregados `id` únicos a todas las vacunas (`lucca-vac-1`, `niko-vac-2`, etc.)
- Renumerados IDs de documentos con prefijo consistente (`{mascota}-doc-{n}`)

#### 0.2 Refinamiento de `types/pet.ts`
- Agregado type alias `PetId = string` para consistencia
- `mascota.genero` cambiado de `string` a `PetGender` (union type: `"Macho" | "Hembra"`)
- `mascota.talla` cambiado de `string` a `PetSize` (union type: `"Pequeño" | "Mediano" | "Grande" | "Miniatura"`)
- Agregado campo `id: string` a la interfaz `PetVaccine`

#### 0.3 Actualización de helpers
- `formatOptionalMexicanDate` en `dateFormat.ts`: eliminado check innecesario de `"No hay"` (ya no existe en los datos)

### Errores o problemas encontrados
- Ninguno. TypeScript compila sin errores (`tsc --noEmit` exitoso).

### Archivos modificados
- `src/data/mascotas.json` — reescritura completa
- `src/types/pet.ts` — reescritura completa
- `src/lib/dateFormat.ts` — eliminación de check `"No hay"`

---

## FASE 1 — Vaccination Hub

**Estado:** Completada
**Fecha:** 2026-08-26

### Tareas realizadas
- Nueva ruta `/perfil/[id]/vacunas` con `generateStaticParams`
- Componente `VaccineDetailCard` con todos los campos de `PetVaccine` (nombre, fecha aplicación, próxima dosis, estatus, lote, veterinario, enlace a documento)
- `VaccineTimeline` actualizado: link funcional a `/vacunas`, badge de total de vacunas
- Eliminado `.slice(0, 3)` del perfil — ahora muestra todas las vacunas en la página dedicada
- Empty state cuando no hay vacunas registradas
- Resumen de estadísticas (al día, próximas, vencidas) en header de la página

### Archivos creados/modificados
- `src/app/perfil/[id]/vacunas/page.tsx` — nueva página
- `src/components/features/pet-profile/VaccineDetailCard.tsx` — nuevo componente
- `src/components/features/pet-profile/VaccineTimeline.tsx` — actualizado
- `src/app/perfil/[id]/page.tsx` — actualizado

---

## FASE 2 — QR real

**Estado:** Completada
**Fecha:** 2026-08-26

### Tareas realizadas
- Instalada `qrcode.react` para generar QR escaneable
- `QRShareCard` reescrito: genera QR real con URL completa (`https://pawpass.app/perfil/{id}`)
- Funcionalidad de descarga QR como PNG (SVG → Canvas → PNG)
- Eliminada clase `.qr-grid` decorativa de `globals.css`

### Errores o problemas encontrados
- Ninguno.

### Archivos modificados
- `src/components/features/pet-profile/QRShareCard.tsx` — reescrito como client component
- `src/app/globals.css` — eliminada clase `.qr-grid`
- `package.json` — nueva dependencia `qrcode.react`

---

## FASE 3 — Documentos mejorados

**Estado:** Completada
**Fecha:** 2026-08-26

### Tareas realizadas
- Componente `DocumentPreview` con thumbnail real para imágenes y badge de tipo (PDF/IMG)
- Componente `DocumentFilters` con toggles por categoría (vacunas, veterinario, identificación, salud, fotos, otros)
- Página de documentos reescrita: server component + client component para filtros interactivos
- Empty state por categoría cuando no hay documentos
- `DocumentsCard` del perfil ahora usa `DocumentPreview` con thumbnails
- Conteo de documentos por categoría en badges de filtro

### Archivos creados/modificados
- `src/components/features/pet-profile/DocumentPreview.tsx` — nuevo
- `src/components/features/pet-profile/DocumentFilters.tsx` — nuevo
- `src/app/perfil/[id]/documentos/DocumentListClient.tsx` — nuevo
- `src/app/perfil/[id]/documentos/page.tsx` — reescrito
- `src/components/features/pet-profile/DocumentsCard.tsx` — actualizado

---

## FASE 4 — HealthCard expandida

**Estado:** Completada
**Fecha:** 2026-08-26

### Tareas realizadas
- Mostrar `medicamentosActuales[]` y `dietaEspecial` (campos que existían en el tipo pero no se renderizaban)
- Botón "Ver más detalles" ahora funciona: expand/collapse inline
- Empty states bonitos para alergias y condiciones vacías ("Sin alergias registradas", etc.)
- Actualizado `toProfileProps` para incluir `medications` y `diet`

### Archivos modificados
- `src/components/features/pet-profile/HealthCard.tsx` — reescrito
- `src/app/perfil/[id]/page.tsx` — actualizado `toProfileProps`

---

## FASE 5 — Generador de imagen de alerta

**Estado:** Completada
**Fecha:** 2026-08-26

### Tareas realizadas
- Instalada `html2canvas` para renderizar componente a PNG
- Componente `LostPetAlertImage`: template de imagen con "SE BUSCA", foto, nombre, raza, rasgos distintivos, zona perdida, fecha, recompensa, contacto, QR al perfil y branding PawPass
- Componente `LostPetAlertForm`: formulario pre-rellenado con datos de la mascota, editable antes de generar la imagen
- Descarga como PNG y compartido via Web Share API
- Nueva ruta `/perfil/[id]/alerta` con `generateStaticParams`
- Botón de acceso al generador desde el perfil de la mascota

### Errores o problemas encontrados
- `@types/html2canvas` desactualizado: la opción `scale` no existía en los tipos. Solucionado con `as Parameters<typeof html2canvas>[1]`

### Archivos creados/modificados
- `src/components/features/pet-profile/LostPetAlertImage.tsx` — nuevo
- `src/components/features/pet-profile/LostPetAlertForm.tsx` — nuevo
- `src/app/perfil/[id]/alerta/page.tsx` — nueva página
- `src/app/perfil/[id]/page.tsx` — agregado link al generador
- `package.json` — nueva dependencia `html2canvas`

---

## FASE 6 — Pulido UI/UX

**Estado:** Completada
**Fecha:** 2026-08-26

### Tareas realizadas
- Componente `ProfileNav`: navegación sticky con IntersectionObserver que resalta la sección visible
- Secciones del perfil con IDs para scroll suave (`contacto`, `info`, `salud`, `veterinario`, `vacunas`, `documentos`)
- Botón "Ver más detalles" de HealthCard funcional (completado en Fase 4)

### Pendiente para futuro
- Loading states con Suspense
- Responsive audit completo
- Metadata/SEO mejorada (Open Graph, schema.org)
- Animaciones con Framer Motion (instalado pero no usado)

### Archivos creados/modificados
- `src/components/features/pet-profile/ProfileNav.tsx` — nuevo
- `src/app/perfil/[id]/page.tsx` — agregados IDs de sección y ProfileNav

---

## FASE 7 — Corrección de Responsive Design

**Estado:** Completada
**Fecha:** 2026-08-26

### Auditoría realizada
Se identificaron 17 problemas de responsive design en 11 archivos. Se corrigieron todos los de mayor impacto.

### Cambios realizados

#### Layout y navegación
- **AppShell**: Decorative elements (`Sparkles`, `PawPrint`, `Heart`, `doodle-line`) ahora `hidden sm:block`. Logo reducido a `h-11 w-11` en mobile, `h-14 w-14` en sm+. Badge "Perfil Verificado" ahora muestra "Verificado" en mobile.
- **ProfileNav**: Agregado `scrollbar-hide` para scroll horizontal limpio en mobile, labels ocultos en mobile (`hidden sm:inline`).

#### Páginas
- **Home (`page.tsx`)**: Heading de `text-5xl` a `text-4xl sm:text-5xl`, sub-heading de `text-2xl` a `text-xl sm:text-2xl`.
- **Perfil (`perfil/[id]/page.tsx`)**: Grid info/health/vet de `lg:grid-cols-3` a `md:grid-cols-2 lg:grid-cols-3`. Grid documentos/QR de `lg:grid-cols-[1fr_280px]` a `md:grid-cols-[1fr_240px] lg:grid-cols-[1fr_280px]`.

#### Componentes
- **VaccineTimeline**: Eliminado `min-w-[720px]`, grid de `grid-cols-3` a `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`.
- **LostPetAlertImage**: Ancho de `w-[480px]` a `w-full max-w-[480px]`.
- **PetHeader**: Heading de `text-6xl sm:text-7xl lg:text-8xl` a `text-5xl sm:text-6xl lg:text-8xl`, sub-heading de `text-2xl` a `text-lg sm:text-2xl`.
- **LostPetBanner**: Padding de `p-5` a `p-4`, heading de `text-5xl` a `text-3xl sm:text-5xl`, textos y botón responsivos.
- **DocumentsCard**: Grid de `lg:grid-cols-3` a `md:grid-cols-2 lg:grid-cols-3`, card min-height reducido en mobile.
- **ThankYouBanner**: Heading de `text-3xl` a `text-xl sm:text-3xl`.

#### CSS
- Agregada utilidad `.scrollbar-hide` en `globals.css`.

### Archivos modificados
- `src/components/layout/AppShell.tsx`
- `src/components/features/pet-profile/VaccineTimeline.tsx`
- `src/components/features/pet-profile/PetHeader.tsx`
- `src/components/features/pet-profile/LostPetBanner.tsx`
- `src/components/features/pet-profile/LostPetAlertImage.tsx`
- `src/components/features/pet-profile/DocumentsCard.tsx`
- `src/components/features/pet-profile/ThankYouBanner.tsx`
- `src/components/features/pet-profile/ProfileNav.tsx`
- `src/app/page.tsx`
- `src/app/perfil/[id]/page.tsx`
- `src/app/globals.css`

---

## FASE 8 — Iconos de Género, Fotos Tipo Stories y Ajustes UI

**Estado:** Completada
**Fecha:** 2026-08-26

### Cambios realizados

#### Iconos de género
- **PetHeader**: Icono `VenusAndMars` reemplazado por `Mars` (azul, tone="blue") para Macho y `Venus` (rosa, tone="pink") para Hembra

#### Fotos recientes (tipo stories)
- **RecentPhotos**: Componente nuevo con thumbnails circulares estilo Instagram stories
- Anillo gradiente rosa/fucsia/ámbar en cada thumbnail
- Lightbox con animación `scale-in` al hacer clic
- Muestra nombre, fecha y descripción de la foto
- **ProfileNav**: Agregado item "Fotos" con icono Camera
- **globals.css**: Keyframe `scale-in` para animación del lightbox

#### Ajustes UI
- **next.config.ts**: `devIndicators: false` para ocultar el icono de Next.js Dev Tools
- **perfil/[id]/page.tsx**: Año dinámico con `new Date().getFullYear()`
- **QRShareCard**: Layout tablet corregido con `md:grid-cols-1`

### Archivos creados
- `src/components/features/pet-profile/RecentPhotos.tsx`

### Archivos modificados
- `src/components/features/pet-profile/PetHeader.tsx`
- `src/components/features/pet-profile/ProfileNav.tsx`
- `src/components/features/pet-profile/QRShareCard.tsx`
- `src/app/perfil/[id]/page.tsx`
- `src/app/globals.css`
- `next.config.ts`

---

## FASE 9+ — Supabase, Auth, Notificaciones (POSTERIOR)

**Estado:** No iniciada
**Fecha:** —

Contenido diferido para después de las fases core:
- Migración a Supabase (tablas, RLS, Storage)
- Sistema de login/registro
- Dashboard protegido con CRUD de mascotas
- Notificaciones push para alertas de mascota perdida
- Soporte multi-tenant (refugios, rescatistas)
