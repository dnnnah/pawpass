# Registro de trabajo — Integración de Supabase en PawPass

- **Fecha:** 2026-10-12
- **Rama:** `feat/services-architecture-core`
- **Spec:** `docs/superpowers/specs/2026-10-12-integracion-supabase-design.md`
- **Plan:** `docs/superpowers/plans/2026-10-12-integracion-supabase-plan.md`

Este archivo es el bitácora del día: qué se hizo, qué se decidió, qué quedó verificado
y qué sigue. Se actualiza a medida que avanza la integración.

## Contexto

PawPass es un prototipo Next.js que hoy lee datos de JSON estáticos
(`src/data/mascotas.json`, `adopciones.mock.json`, `shelters.mock.json`) a través de una
arquitectura por capas (domain → infrastructure → services → app). El objetivo es migrar
la fuente de datos a Supabase (Auth + Postgres + Storage) sin romper la demo estática ni
las guardas arquitectónicas.

Se realizó una auditoría del código frente al esquema de
`PAWPASS-ESTRUCTURA-BASE-DE-DATOS.md`, se fijaron decisiones (D1–D11) y se redactó un
spec + plan. La ejecución avanza por tareas T1–T10.

## Decisiones fijadas (D1–D11)

- **D1:** Supabase Auth (no auth independiente).
- **D2:** OAuth Google + Apple + correo/contraseña.
- **D3:** login obligatorio en la app; la ficha del QR (`/p/[codigo]`) es pública.
- **D4:** ficha pública mínima del QR; contacto solo en modo `perdido`; fotos solo
  `visible_publico`; nunca salud/veterinario/email/dirección/microchip.
- **D5:** eliminar `AdoptionRequest.notas`; mapear `motivo`.
- **D6:** `fotoPerfilUrl` derivado (primera foto del bucket `pawpass-fotos`).
- **D7:** normalización de enums en el mapper (`Perro`→`perro`, `Pequeño`→`pequeno`, etc.).
- **D8:** una sola fuente de "perdido" = `pets.estado` + `pet_lost_alerts`.
- **D9:** `logoUrl` de refugio diferido en v1.
- **D10:** relajar a opcional/nullable campos de `mascota` y `veterinario`.
- **D11:** ampliar `configuracionPublica` a los 13 flags de `pet_privacy`.

## Estado de tareas

| Tarea | Descripción | Estado |
| --- | --- | --- |
| T1 | Habilitar `@supabase` en guardas arquitectónicas | ✅ Hecha |
| T2 | Puertos y services asíncronos | ✅ Hecha |
| T3 | Cliente Supabase y entorno | ✅ Cliente browser/server, claves públicas y proxy de sesión |
| T4 | Mappers DB↔dominio y ajustes de contrato (D5–D11) | ⏳ Siguiente |
| T5 | Adaptadores Supabase de lectura + swap | 🟡 Adapter del contrato público QR y panel autenticado listos; catálogo sigue en demo |
| T6 | Supabase Auth | 🟡 Registro, inicio de sesión, callback, alta de mascotas y `/cuenta` protegida por correo; OAuth queda para otra iteración |
| T7 | Ficha pública del QR + RPC anónima | ✅ `/p/[codigo]` y `obtener_ficha_publica(text)` desplegados con wrapper security-definer |
| T8 | Escrituras por RPC | 🟡 Alta de mascotas integrada con `crear_mascota`; estados, contacto y privacidad siguen pendientes |
| T9 | Storage y signed URLs | ⛔ T3/P4 |
| T10 | Cierre y verificación | ⛔ Todas |

## Bitácora

### T1 — Guardas arquitectónicas ✅

- `src/lib/architecture.test.ts`: se permite `@supabase` en `src/lib/infra/**`
  (`INFRA_ALLOWED_PREFIXES`, `isInfraAllowed`, `isFrameworkForbiddenInInfra`); sigue
  prohibido en `domain` y `services`. Nuevo describe "política de @supabase por capa"
  (3 tests).
- Verificación: `npx vitest run src/lib/architecture.test.ts` → 39 passed.

### T2 — Puertos y services asíncronos ✅

- `src/lib/domain/directory/types.ts`: `PetDirectory`/`ShelterDirectory` devuelven
  `Promise`.
- `src/lib/infra/directory/staticPets.ts`, `staticShelters.ts`: métodos `async`
  (devuelven la misma referencia → estable).
- `src/lib/services/pets/queries.ts`, `src/lib/services/shelters/queries.ts`: funciones
  `async`; `getAllProfilePets` usa `Promise.all`.
- Páginas `await` + `generateStaticParams` async: `/`, `/adopciones`,
  `/perfil/[id]{,/adopcion,/alerta,/carnet,/documentos,/salud,/vacunas}`, `/refugios/[id]`.
- Tests ajustados a async: `services/pets/queries.test.ts`, `adoptionMockData.test.ts`,
  `infra/directory/staticPets.test.ts`, `staticShelters.test.ts`,
  `mapping/adoptionPresentation.test.ts` (fixtures con `beforeAll`),
  `domain/carnet.test.ts` (test 14).
- Verificación: `typecheck` ✓ · `lint` ✓ · `test` → **712 passed (54 files)** ·
  `build` ✓ → **281 rutas SSG** (async `generateStaticParams` correcto).

### T3 — Cliente Supabase y entorno ✅

- Dependencias: `@supabase/supabase-js@2.117.3`, `@supabase/ssr@0.12.7`.
- `src/lib/infra/supabase/env.ts`: lee/valida `NEXT_PUBLIC_SUPABASE_URL` y la
  publishable key moderna, con fallback a `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- `src/lib/infra/supabase/client.ts`: `createSupabaseBrowserClient()` (cookies, no
  `localStorage`).
- `src/lib/infra/supabase/server.ts`: `createSupabaseServerClient(cookieStore)` con la
  tienda de cookies **inyectada** (la capa `infra` no importa `next`, respetando la guarda).
- `.env.example` (documentado) y `.gitignore` con `!.env.example`.
- Tests: `env.test.ts` (5). Verificación: `typecheck` ✓ · `lint` ✓ ·
  `test` → **736 passed (59 files)** · `build` ✓ (283 rutas).
- `src/proxy.ts`: refresca los claims de sesión con `supabase.auth.getClaims()`.
- Verificado contra el proyecto real `pawpass` (activo y saludable).

### Renombrado del producto: PetCarnet → PawPass ✅

- Reemplazo global del nombre: marca (`PetCarnet`→`PawPass`), identificadores internos
  (`petcarnet-*`→`pawpass-*`: claves de `localStorage`, eventos, cachés del service worker),
  package (`petcarnet-app`→`pawpass-app`) y URLs de ejemplo (`petcarnet.example`→
  `pawpass.example`).
- Docs: texto y nombres de archivo (`PAWPASS-PROYECTO.md`, `PawPass_Roadmap_Maestro.md`).
- **No tocado:** los 18 PDF binarios de `public/docs/**` (riesgo de corrupción) ni el
  `remote` de git (el repositorio de GitHub conserva su slug `petCarnet`).
- Verificación: `typecheck` ✓ · `lint` ✓ · `test` → **718 passed** · `build` ✓ ·
  `validate:data` ✓ (26 avisos preexistentes).

### Cierre de integración en la rama de trabajo ✅

- `.env.local` quedó corregido para usar la URL HTTPS del proyecto real; la clave pública
  permanece en el archivo local y no se versiona.
- `/p/[codigo]` ya consulta el RPC anónimo de Supabase y se verificó con `PC-BRUNO-001`:
  estado perdido, zona, fecha, instrucciones y contacto respetando consentimiento.
- El wrapper público usa `security definer` con `search_path` vacío; la implementación
  privada sigue sin permisos de ejecución para `anon` y `authenticated`.
- `/cuenta` valida la sesión en servidor, consulta `pet_ownerships` con RLS y muestra
  las mascotas asociadas; permite registrar una mascota con `crear_mascota`, el menú
  reconoce la sesión y ofrece cerrar sesión.
- Verificación actual: `typecheck` ✓ · `lint` ✓ · **877 tests (66 archivos)** ✓ ·
  `build` ✓ (283 rutas) · `validate:data` ✓ (26 avisos preexistentes).
- El advisor de Supabase conserva dos avisos informativos preexistentes sobre tablas
  privadas sin políticas. También marca el wrapper QR como `security definer`: es
  intencional, usa `search_path` vacío, devuelve un payload acotado y la función privada
  no es ejecutable por roles públicos.

## Puertas de verificación (cada tarea)

`npm run typecheck && npm run lint && npm test && npm run build`

## Prerrequisitos externos pendientes

- **P1:** Q19 desplegada como wrapper público security-definer que delega en una función
  privada acotada; `anon` solo puede ejecutar el wrapper y la publicación exige
  `pet_privacy.publicado = true`.
- **P2:** credenciales Apple Developer + OAuth Google → T6.
- **P3:** proyecto Supabase verificado: `gjolkedvspnmueqatqyt` (`ACTIVE_HEALTHY`).
- **P4:** catálogo/RLS/funciones verificados; Storage sigue privado y requiere signed URLs
  para publicar fotos desde la ficha QR.

## Riesgos / notas

- La ficha QR no devuelve rutas de Storage privadas: la imagen estática se conserva para
  la demo local y el siguiente paso es generar signed URLs desde una ruta de servidor.
- Los cambios de contrato de T4 (D5–D11) tienen amplio impacto en consumidores y tests.
