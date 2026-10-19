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
| T3 | Cliente Supabase y entorno | 🟡 Scaffold hecho (cierre real pendiente de P3) |
| T4 | Mappers DB↔dominio y ajustes de contrato (D5–D11) | ⏳ Siguiente |
| T5 | Adaptadores Supabase de lectura + swap | ⛔ T3/T4/P4 |
| T6 | Supabase Auth | ⛔ T3/P2 |
| T7 | Ficha pública del QR + RPC anónima | ⛔ T4/P1 |
| T8 | Escrituras por RPC | ⛔ T6 |
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

### T3 — Cliente Supabase y entorno 🟡

- Dependencias: `@supabase/supabase-js@2.117.3`, `@supabase/ssr@0.12.7`.
- `src/lib/infra/supabase/env.ts`: lee/valida `NEXT_PUBLIC_SUPABASE_URL` y
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` (`hasSupabaseEnv`, `getSupabaseEnv`).
- `src/lib/infra/supabase/client.ts`: `createSupabaseBrowserClient()` (cookies, no
  `localStorage`).
- `src/lib/infra/supabase/server.ts`: `createSupabaseServerClient(cookieStore)` con la
  tienda de cookies **inyectada** (la capa `infra` no importa `next`, respetando la guarda).
- `.env.example` (documentado) y `.gitignore` con `!.env.example`.
- Tests: `env.test.ts` (3). Verificación: `typecheck` ✓ · `lint` ✓ ·
  `test` → **718 passed (55 files)** · `build` ✓ (281 rutas).
- **Pendiente:** cerrar contra un proyecto real (P3) y añadir el middleware de sesión en T6.

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

## Puertas de verificación (cada tarea)

`npm run typecheck && npm run lint && npm test && npm run build`

## Prerrequisitos externos pendientes

- **P1:** aprobar Q19 (`obtener_ficha_publica` con `GRANT EXECUTE TO anon`) → T7.
- **P2:** credenciales Apple Developer + OAuth Google → T6.
- **P3:** proyecto Supabase + `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  → T3 en adelante.
- **P4:** verificar catálogo/RLS/funciones en vivo (hoy **NO VERIFICADO**) → T5, T9, T10.

## Riesgos / notas

- El esquema real de la instancia Supabase **no está verificado**; solo se cuenta con
  `PAWPASS-ESTRUCTURA-BASE-DE-DATOS.md` como referencia.
- Los cambios de contrato de T4 (D5–D11) tienen amplio impacto en consumidores y tests.
