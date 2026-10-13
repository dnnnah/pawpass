# PawPass — El proyecto y cómo se maneja

> Documento de auditoría técnica generado leyendo el código real del repositorio
> `dnnnah/pawpass`. Todo lo que sigue es verificable en los archivos citados.
>
> **Este documento NO propone una base de datos.** Describe qué existe hoy, cómo
> está organizado, cómo fluye un dato desde el JSON hasta la pantalla, y qué
> reglas de negocio están codificadas. La capa de persistencia real (Supabase +
> PostgreSQL) es un trabajo posterior que se apoyará en esta estructura.
>
> Fecha de la auditoría: 2026-09-30 · Commit auditado: `eea5036`
> Rama auditada: `feat/services-architecture-core`

---

## Índice

1. [Qué es PawPass](#1-qué-es-pawpass)
2. [Stack exacto](#2-stack-exacto)
3. [Estado verificado del repositorio](#3-estado-verificado-del-repositorio)
4. [Estructura de carpetas](#4-estructura-de-carpetas)
5. [Arquitectura por capas](#5-arquitectura-por-capas)
6. [Los dos guardianes arquitectónicos](#6-los-dos-guardianes-arquitectónicos)
7. [Recorrido completo de una petición](#7-recorrido-completo-de-una-petición)
8. [El modelo de datos actual, sección por sección](#8-el-modelo-de-datos-actual-sección-por-sección)
9. [Identificadores: slug, código público y QR](#9-identificadores-slug-código-público-y-qr)
10. [Estados de mascota: la regla más delicada](#10-estados-de-mascota-la-regla-más-delicada)
11. [Emergencias y modo perdido](#11-emergencias-y-modo-perdido)
12. [Salud: vacunas, desparasitación e historial](#12-salud-vacunas-desparasitación-e-historial)
13. [Documentos y assets](#13-documentos-y-assets)
14. [Privacidad: las cuatro banderas y su estado real](#14-privacidad-las-cuatro-banderas-y-su-estado-real)
15. [Refugios](#15-refugios)
16. [Adopciones](#16-adopciones)
17. [Carnet físico](#17-carnet-físico)
18. [Entidades que existen solo en memoria](#18-entidades-que-existen-solo-en-memoria)
19. [Capa de dominio](#19-capa-de-dominio)
20. [Capa de mapping](#20-capa-de-mapping)
21. [Servicios y puertos](#21-servicios-y-puertos)
22. [Persistencia local: localStorage](#22-persistencia-local-localstorage)
23. [Mapa completo de rutas](#23-mapa-completo-de-rutas)
24. [PWA, service worker y modo sin conexión](#24-pwa-service-worker-y-modo-sin-conexión)
25. [SEO, Open Graph y metadatos](#25-seo-open-graph-y-metadatos)
26. [Validación de datos](#26-validación-de-datos)
27. [Testing](#27-testing)
28. [Variables de entorno](#28-variables-de-entorno)
29. [Cómo ejecutar el proyecto](#29-cómo-ejecutar-el-proyecto)
30. [Deuda técnica documentada](#30-deuda-técnica-documentada)
31. [Lo que NO existe todavía](#31-lo-que-no-existe-todavía)
32. [Glosario de referencias](#32-glosario-de-referencias)

---

## 1. Qué es PawPass

PawPass es un **carnet digital para mascotas**, identificado por un código QR.
Su premisa central es que el registro de una mascota debe poder consultarse
**sin que nadie necesite una cuenta**: alguien encuentra una mascota perdida,
escanea el QR del collar, y llega a un perfil público que dice a quién llamar.

La definición de producto está en `PRODUCT.md` y es unusually específica. Los
cinco principios que gobiernan cada decisión de diseño (`PRODUCT.md:97-106`):

1. **La impresión es el producto.** Si un cambio se ve mejor en pantalla pero se
   imprime peor, está mal.
2. **La ansiedad es el estado inicial.** Nunca fabricar urgencia.
3. **Nada es público sin consentimiento.** Publicar es un acto explícito,
   elemento por elemento.
4. **Reutilizar el registro.** Cada flujo lee de datos ya existentes.
5. **Móvil con datos lentos, una sola mano.** No es un afterthought responsive.

Dos restricciones que condicionan toda la arquitectura:

- **Solo español de México** (`PRODUCT.md:71`). Sin inglés, sin mezcla de
  dialectos. Esto afecta también a nombres de tablas, columnas y enums futuros.
- **Impresión y PDF son requisitos obligatorios** (`PRODUCT.md:66`). El carnet
  y el expediente no son un extra.

La lista de secciones del perfil público, tal como las monta
`src/app/perfil/[id]/page.tsx:84-197`, es:

```
PetHeader          →  nombre, especie, raza, edad, foto, badges de estado
ProfileNav         →  ancla a las secciones
PetStatusSection   →  estado actual + CTA de pérdida
AdoptionRequestCta →  CTA de adopción (si el estado lo permite)
EmergencyContactSection →  "a quién llamo" + WhatsApp
InfoCard           →  especie, raza, color, peso, nacimiento, rasgos
HealthCard         →  alergias, condiciones, medicamentos, dieta, comportamiento
VetCard            →  veterinario
RecentPhotos       →  fotos recientes
VaccineTimeline    →  últimas vacunas
HealthExpedientePreview →  vista previa del expediente
PhysicalCardCta    →  carnet imprimible
DocumentsCard      →  documentos públicos (3 primeros)
QRShareCard        →  QR descargable
PetFooterBanner    →  recordatorio de tutorización
```

---

## 2. Stack exacto

Verificado en `package.json` y `node_modules`:

| Capa | Paquete | Versión |
|---|---|---|
| Framework | `next` | `16.3.5` |
| UI | `react` / `react-dom` | `19.2.4` |
| Lenguaje | `typescript` | `^5` (modo `strict`) |
| Estilos | `tailwindcss` | `^4` (v4, vía `@tailwindcss/postcss`) |
| Iconos | `lucide-react` | `^1.21.0` |
| QR | `qrcode.react` | `^4.2.0` |
| Exportar imagen | `html-to-image` | `^1.11.13` |
| Animación | `framer-motion` | `^12.40.0` |
| Tests | `vitest` | `^4.1.11` |
| Optimizador | `babel-plugin-react-compiler` | `1.0.0` |

**No hay base de datos. No hay `@supabase/*`. No hay cliente HTTP propio
(`fetch` no se usa para datos). No hay ORM. No hay gestor de estado global.**

Configuración relevante:

- `next.config.ts` — solo dos líneas: `reactCompiler: true`, `devIndicators: false`.
- `vitest.config.mts` — `environment: "node"`, incluye `src/**/*.test.ts`.
  **Solo `.ts`, nunca `.tsx`**: los tests de componentes en realidad son tests de
  funciones puras-aided, no de renderizado React.
- `tsconfig.json` — alias `@/*` → `src/*`.
- `eslint.config.mjs` — `eslint-config-next`.

---

## 3. Estado verificado del repositorio

### Comandos ejecutados y su resultado real

```
$ npm test
  Test Files  54 passed (54)
  Tests       709 passed (709)
  Duration    2.70s

$ npx tsc --noEmit
  (sin salida, exit 0)

$ npm run lint
  (sin salida, sin errores)

$ npm run validate:data
  OK: 11 perfiles reales válidos. Avisos: 26.
  OK: 10 mocks de adopción y 2 mocks de refugio válidos (prototipo).
```

`npm run build` **no se ejecutó** durante esta auditoría (escribe en `.next/`).

### Git

```
remote:  https://github.com/dnnnah/pawpass.git
rama:    feat/services-architecture-core  (tracking origin, sin divergencia)
main:    bc1bfef
```

**`main` está 4 commits por detrás del HEAD auditado:**

| Commit | Contenido |
|---|---|
| `23a6d60` | feat(pwa): UI de campo sin conexión (FASE 7B) |
| `a71b57b` | Merge PR #26 (`feat/pwa-campo-ui`) |
| `62964ea` | feat(kpis): add privacy-safe telemetry core |
| `eea5036` | feat(services): prepara puertos y adapters de directorio |

Los dos últimos **no están mergeados en `main`**. Esto importa para cualquier
trabajo posterior: la arquitectura de Services (FASE 9A) de la que depende la
capa de persistencia **existe en el código pero no está en `main`**.

### Los 26 avisos de `validate:data`

No son errores; el comando sale con código 0. Son dos patrones:

1. **Teléfono placeholder compartido por 8 mascotas**: `552201296480` aparece en
   `loki`, `viserys`, `frey`, `sandor`, `bizcocho`, `chicharrona`, `freya`,
   `arya`. El validador lo detecta explícitamente (`dataValidation.ts:465-469`).
2. **`identificacion.notas` vacío** en `sandor`, `bizcocho`, `chicharrona`,
   `freya`, `arya`.

Ambos son deuda de datos **ya instrumentada**. El producto los conoce.

---

## 4. Estructura de carpetas

202 archivos en `src/`. La organización sigue una regla explícita: **la ruta
indica la capa, y la capa determina qué puedes importar.**

```
src/
├── app/                    Rutas de Next.js App Router + páginas
├── components/
│   ├── features/           Componentes agrupados por funcionalidad
│   ├── layout/             Shell, navegación, tema
│   ├── pwa/                Install CTA, offline status, SW registration
│   └── ui/                 Primitivas (Button, Badge, Surface, Field...)
├── data/                   ← Los 3 JSON. Solo `lib/infra/` puede tocarlos
│   ├── mascotas.json           11 perfiles reales
│   ├── adopciones.mock.json    10 perfiles de adopción (prototipo)
│   └── shelters.mock.json       2 refugios (prototipo)
├── lib/
│   ├── domain/             ← REGLAS PURAS + puertos. Sin infraestructura
│   ├── services/           ← API de consulta que consume la UI
│   ├── infra/              ← Implementaciones de puertos
│   ├── mapping/            ← Puentes dominio → presentación
│   ├── pwa/                Storage, conectividad, instalación, SW
│   ├── kpis/               Cálculos de telemetría
│   └── ui/                 Utilidades visuales
└── types/                  ← Contratos de datos. Sin lógica
```

### `src/types/` — los contratos

| Archivo | Exporta |
|---|---|
| `pet.ts` | `PetProfile`, `PetVaccine`, `PetDocument`, `PetEmergency`, y los enums |
| `shelter.ts` | `Shelter`, `ShelterContact` |
| `health.ts` | `HealthDeworming`, `HealthConsultation`, `HealthDocumentRef`, `HealthExportSummary` |
| `adoption.ts` | `AdoptionRequest`, `AdoptionCatalogEntry`, estados |
| `emergency.ts` | `LostAlert` |
| `carnet.ts` | `PhysicalPetCard` y sus sub-tipos |

Todos son **tipos puros**. `types/health.ts:4-9` lo dice: *"Capa: types /
contratos. No dependen de React, Next.js, Supabase ni componentes."*

---

## 5. Arquitectura por capas

La dirección de dependencias es **estrictamente descendente**:

```
┌─────────────────────────────────────────────────────────┐
│  UI              app/ · components/                      │
│                  React, Server Components, cliente       │
└────────────────────────┬────────────────────────────────┘
                         │ llama a
┌────────────────────────▼────────────────────────────────┐
│  Services       lib/services/                            │
│                  Queries de negocio. Sin framework       │
└────────────────────────┬────────────────────────────────┘
                         │ implementa / consume
┌────────────────────────▼────────────────────────────────┐
│  Ports          lib/domain/directory/types.ts            │
│                  Contratos. Sin implementación            │
└────────────────────────▲────────────────────────────────┘
                         │ implementados por
┌────────────────────────┴────────────────────────────────┐
│  Adapters      lib/infra/                                │
│                  staticPets · staticShelters · noop-client│
└────────────────────────┬────────────────────────────────┘
                         │ lee
┌────────────────────────▼────────────────────────────────┐
│  Fuente         src/data/*.json · localStorage           │
└─────────────────────────────────────────────────────────┘
```

Y la dirección **hacia arriba desde un port** está lista para lo que viene:

```
UI → Services → Ports ← Adapters ← Supabase
```

Documentado en `docs/fase-9-services-arquitectura.md:30-38`.

### La regla que lo gobierna

`docs/fase-9-services-arquitectura.md:36`:
> *"El **dominio** no depende de React, Next.js, Supabase, `localStorage`,
> `fetch` ni de componentes."*

Esta frase **ya menciona Supabase**, aunque hoy no exista. La arquitectura se
escribió anticipando esta migración y los tests lo verifican.

---

## 6. Los dos guardianes arquitectónicos

Esto es lo más valioso que tiene el repositorio para el trabajo futuro: **las
reglas que debe cumplir la capa de persistencia ya están automatizadas.**

### `src/lib/architecture.test.ts` (161 líneas)

Verifica la **dirección** entre capas:

| Regla | Ubicación |
|---|---|
| `domain` no importa `services`, `infra` ni `@/data` | `:93-110` |
| `services` no importa `@/data` (debe pasar por un port) | `:112-117` |
| `services` no importa frameworks | `:118-122` |
| `services` no importa UI | `:124-127` |
| `infra` no importa UI ni frameworks | `:130-138` |
| **Solo `infra` puede importar `@/data`** | `:140-151` |

Y define la lista de frameworks prohibidos (`:24`):

```ts
const FRAMEWORK_PREFIXES = ["react", "next", "@supabase", "lucide-react", "framer-motion"];
```

**`@supabase` ya está en la lista.** Cualquier día que se añada el cliente de
Supabase, estos tests lo rechazarán automáticamente si se cuela en la capa
equivocada. No habrá que inventar reglas nuevas.

### `src/lib/domain/purity.test.ts` (181 líneas)

Verifica la **pureza del dominio**:

```ts
const FORBIDDEN_PREFIXES = ["react", "next", "@supabase", "lucide-react", "framer-motion"];  // :19
```

Además escanea el código de `domain/carnet.ts` buscando tokens de navegador
(`window.`, `document.`, `localStorage`, `fetch(`, `navigator.`) (`:93-104`).

**Tiene una lista de excepciones documentada** (`:17`):
`vaccineStatus.ts` y `documentCategory.ts` importan iconos de `lucide-react` y
son deuda histórica asumida. El comentario (`:8-12`) dice: *"Cualquier archivo
NUEVO en `domain/` debe ser puro."*

### Consecuencia práctica

```
src/lib/domain/**      →  PROHIBIDO: @supabase, react, next, localStorage, fetch
src/lib/services/**    →  PROHIBIDO: @supabase, react, next, @/data
src/lib/infra/**       →  aquí SÍ vive @supabase/supabase-js
src/app/**             →  aquí SÍ vive @supabase/ssr
```

---

## 7. Recorrido completo de una petición

Toma la ruta más compleja: un visitante anónimo abre `/perfil/PC-LUCCA-001`.

### Paso 1 — Next resuelve la ruta dinámica

`src/app/perfil/[id]/page.tsx:56-61`

```ts
export default async function ProfilePage({ params }: ProfilePageProps) {
  const { id } = await params;
  const pet = getPetByIdAny(id);
  if (!pet) notFound();
```

### Paso 2 — El service resuelve el identificador

`src/lib/services/pets/queries.ts:47-49`

```ts
export function getPetByIdAny(id: string): PetProfile | null {
  return getPetById(id) ?? directory.findAdoptionPet(id);
}
```

Donde `directory` es la **instancia activa del port** (`queries.ts:20`):

```ts
const directory: PetDirectory = staticPetDirectory;
```

### Paso 3 — El adapter busca en los JSON

`src/lib/infra/directory/staticPets.ts:24-36`

```ts
function normalizeIdentifier(identifier: string): string {
  return identifier.trim();
}

function matchesIdentifier(pet: PetProfile, normalized: string): boolean {
  return pet.id === normalized || pet.identificacion.codigoPublico === normalized;
}
```

**Un solo `trim()` y dos comparaciones.** El identificador de la URL puede ser el
slug (`lucca`) o el código público (`PC-LUCCA-001`). Ambos funcionan.

Pero antes, en el **momento del import** (`:18-19`), el adapter valida:

```ts
assertValidPetProfiles(profilePets);
assertValidPetProfiles(adoptionPets);
```

Si los JSON estuvieran mal, **el build falla**. No hay datos corruptos en
producción porque es imposible construirlos.

### Paso 4 — El mapping proyecta a un view model

`src/lib/mapping/profile.ts:81-147`

```ts
export function toProfileViewModel(pet: PetProfile): ProfileViewModel {
  const visibleDocuments = getPublicDocuments(pet);
  return {
    status: pet.estado,
    header: {
      name: pet.mascota.nombre,
      age: getPetAgeText(pet.mascota.fechaNacimiento),   // derivado
      id: pet.identificacion.codigoPublico,               // ← el código público
      ...
```

`getPetAgeText` **calcula** la edad desde la fecha de nacimiento. No está
almacenada. Lo mismo con `formatPhoneForDisplay` (`:149-168`), que reformatea el
teléfono para pantalla.

### Paso 5 — Los componentes reciben datos ya presentation-ready

Los componentes **no conocen la forma del JSON**. Reciben `ProfileViewModel`,
que es un contrato plano y estable. Esto es lo que permite que el día que la
fuente sea Supabase, la UI no cambie.

### Resumen del flujo

```
URL /perfil/PC-LUCCA-001
  ↓
page.tsx           Server Component, lee params
  ↓
services/pets/     getPetByIdAny() → port PetDirectory
  ↓
infra/directory/   staticPetDirectory → busca en el JSON
  ↓
types/pet.ts       PetProfile (contrato)
  ↓
mapping/profile.ts toProfileViewModel() → ProfileViewModel
  ↓
components/        Render
```

**El punto de intercambio futuro está exactamente en la capa 3**
(`queries.ts:20`). Todo lo demás no se toca.

---

## 8. El modelo de datos actual, sección por sección

El objeto central es `PetProfile` (`src/types/pet.ts:40-105`). Es un **monolito
de 12 bloques anidados**:

```ts
export interface PetProfile {
  id: PetId;                    // string (slug)
  estado: PetStatus;
  verificado: boolean;
  mascota: { ... }              // 11 campos
  identificacion: { ... }       // 3 campos
  contacto: { ... }             // 9 campos
  emergencia: PetEmergency;     // 6 campos
  salud: { ... }                // 5 campos
  veterinario: { ... }          // 5 campos
  vacunas: PetVaccine[];        // 0..n
  desparasitaciones?: HealthDeworming[];      // opcional, 0..n
  historialMedico?: HealthConsultation[];     // opcional, 0..n
  documentos: PetDocument[];    // 0..n
  configuracionPublica: { ... } // 4 flags
}
```

### Los tres ficheros de datos

| Fichero | Registros | Naturaleza | Estados presentes |
|---|---|---|---|
| `mascotas.json` | 11 | **Perfiles reales** | Todos `en_casa` |
| `adopciones.mock.json` | 10 | **Prototipo** | `en_adopcion`, `fallecido`, `perdido`, `adoptado`, `rescatado`, `en_casa` |
| `shelters.mock.json` | 2 | **Prototipo** | — |

**Detalle importante sobre `adopciones.mock.json`:** a pesar del nombre, **no
contiene solo mascotas adoptables**. Contiene los 6 estados distintos:

```
mila      en_adopcion     toby      en_adopcion    luna   en_adopcion
simba     en_adopcion     rocky     en_adopcion    canela FALLECIDO
bruno     PERDIDO         mocha     ADOPTADO       copito RESCATADO
nube      EN_CASA
```

Y `filterAdoptablePets()` es quien descarta los no adoptables en el momento de
renderizar (`app/adopciones/page.tsx:23`, `app/refugios/[id]/page.tsx:62`).

Consecuencia: **`generateStaticParams()` prerenderiza los 21 perfiles**, porque
`getAllProfilePets()` los concatena (`queries.ts:38-40`):

```ts
export function getAllProfilePets(): PetProfile[] {
  return [...getAllPets(), ...getAdoptionDemoPets()];
}
```

Es decir, `/perfil/canela` (fallecida) y `/perfil/PC-CANELA-001` responden 200
hoy. No es un bug: es el comportamiento actual, documentado aquí para que
cualquier migración lo tenga en cuenta.

---

## 9. Identificadores: slug, código público y QR

PawPass tiene **tres formas de referirse a una mascota** y es esencial no
confundirlas.

| Identificador | Ejemplo | Dónde vive | ¿Es público? |
|---|---|---|---|
| **slug** | `lucca` | `PetProfile.id` | Sí (es URL) |
| **código público** | `PC-LUCCA-001` | `PetProfile.identificacion.codigoPublico` | Sí (es URL y QR) |
| **IDs internos** | `lucca-vac-1`, `lucca-doc-4` | raging dealley en los arrays | No |

### El contrato del código público

Definido en `src/lib/dataValidation.ts:21`:

```ts
export const PUBLIC_CODE_PATTERN = /^PC-[A-Z0-9]+-\d{3,}$/;
```

Y validado en dos sitios, no uno:

- **Formato** (`:245`): debe seguir el patrón.
- **Unicidad global** (`:248-251`): se lleva un `Set` de todos los códigos y
  falla si hay duplicados.

Esto corre en **ambos** ficheros JSON, porque `assertValidPetProfiles` se invoca
para los dos (`staticPets.ts:18-19`).

### La URL canónica

`src/lib/publicProfileUrl.ts`:

```ts
export const PUBLIC_PROFILE_ROUTE = "/perfil";                                    // :1

export function getPublicProfilePath(codigoPublico): string | null {               // :12
  const path = normalizePublicCode(codigoPublico);
  return path ? `${PUBLIC_PROFILE_ROUTE}/${code}` : null;
}

export function resolvePublicProfileBaseUrl(): string {                           // :17
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  return baseUrl ? baseUrl.replace(/\/+$/, "") : "";
}
```

**El QR nunca contiene el slug.** Contiene la URL pública derivada del código
público. Está escrito así a propósito — `src/types/carnet.ts:23-28` lo dice:

> *"QR del carnet. NO se codifica `pet.id` ni se construye la URL a mano; la URL
> es la pública estable derivada del código público."*

### Dos rutas por mascota

`app/perfil/[id]/page.tsx:37-39`:

```ts
export function generateStaticParams() {
  return getAllProfilePets().flatMap((pet) => [
    { id: pet.id },
    { id: pet.identificacion.codigoPublico },
  ]);
}
```

Genera **42 rutas** (21 mascotas × 2). `/perfil/lucca` **y** `/perfil/PC-LUCCA-001`
sirven el mismo perfil. El segundo es el canónico en SEO (`seo.ts:30`); el
primero existe por comodidad y compatibilidad.

### Los IDs de los hijos

Los IDs de vacunas, documentos y registros de salud **son strings legibles**
(`"lucca-vac-1"`). El dominio los usa para correlacionar:

`src/lib/domain/vaccine.ts:324-342` — `linkVaccineDocument()`:

```ts
export function linkVaccineDocument(vaccine, documents) {
  const documentoId = asNullableString(vaccine.documentoId);
  if (documentoId !== null) {
    const byId = documents.find((document) => document.id === documentoId);
    if (byId) return byId;
  }
  const documentoUrl = asNullableString(vaccine.documentoUrl);
  if (documentoUrl !== null) {
    return documents.find((document) => document.url === documentoUrl) ?? null;
  }
  return null;
}
```

🔴 **Este es el punto más frágil del modelo actual.** La relación entre una
vacuna y su documento se resuelve por **`documentoId` o, si falla, por igualdad
de URL**. Es una correlación por contenido, no una referencia.

Y hay **tres rutas de vínculo distintas** conviviendo:

| Entidad | Campos de vínculo |
|---|---|
| Vacuna | `documentoId` **o** `documentoUrl` |
| Desparasitación | `documentoId` **o** `documentoUrl` |
| Consulta | `documentos: HealthDocumentRef[]` (array embebido que **duplica** nombre + url) |

Caso real: `/docs/lucca/cartilla-vacunacion.pdf` es el mismo archivo referenciado
por las **3 vacunas** de Lucca.

---

## 10. Estados de mascota: la regla más delicada

### El enum

`src/types/pet.ts:7-13`:

```ts
export type PetStatus =
  | "en_casa" | "perdido" | "en_adopcion"
  | "adoptado" | "rescatado" | "fallecido";
```

Las reglas viven en `src/lib/domain/petStatus.ts`:

```ts
export const PET_STATUSES           = [/* los 6 */]                    // :5
export const LOST_PET_STATUSES      = ["perdido"]                       // :14
export const TERMINAL_PET_STATUSES  = ["fallecido"]                     // :16
export const ADOPTION_PET_STATUSES  = ["en_adopcion","adoptado","rescatado"]; // :18
```

### El estado efectivo NO es un campo

Aquí está el concepto central: **el estado que ve el usuario no es `pet.estado`,
es el resultado de combinar tres fuentes.**

`src/lib/domain/petStatus.ts:54-83`:

```ts
export function resolveEffectivePetState({ estado, emergencia, alert }): EffectivePetState {
  // 1. Si es terminal, se detiene TODO
  if (isTerminalPetStatus(estado)) {
    return { status: estado, isLost: false, lostOverlay: "none",
             zonaPerdida: null, fechaPerdida: null, mensaje: null, recompensa: null };
  }

  // 2. Fusiona estático + runtime
  const resolved = resolveLostState(emergencia, alert);

  // 3. Clasifica de dónde salió el dato perdido
  const lostOverlay = alert !== null ? "runtime"
                   : emergencia.perdido ? "static"
                   : "none";

  return {
    status: resolved.isLost ? "perdido" : estado,
    isLost: resolved.isLost,
    lostOverlay,
    zonaPerdida: resolved.zonaPerdida,
    ...
  };
}
```

**`lostOverlay` tiene tres valores y es información de diagnóstico real:**

| Valor | Significado |
|---|---|
| `"runtime"` | Perdido por una alerta en `localStorage` (este navegador) |
| `"static"` | Perdido por el JSON del repositorio |
| `"none"` | No está perdido |

### Las tres reglas que no se pueden romper

**1. `fallecido` es terminal y gana sobre todo.**

`petStatus.ts:59-69`. Si el estado es `fallecido`, se devuelven **todos los
campos de pérdida a `null`**. Una mascota fallecida jamás aparece como perdida,
aunque tenga una alerta activa en el navegador.

**2. La alerta de runtime pisa al dato estático, campo a campo.**

`src/lib/domain/emergency.ts:61-74`:

```ts
export function resolveLostState(emergencia, alert) {
  const isLost = alert !== null || emergencia.perdido;
  return {
    isLost,
    zonaPerdida:   alert?.zonaPerdida   ?? emergencia.zonaPerdida,
    fechaPerdida:  alert?.fechaPerdida  ?? emergencia.fechaPerdida,
    mensaje:       alert?.mensaje       ?? emergencia.mensajeEmergencia,
    recompensa:    alert?.recompensa    ?? emergencia.recompensa,
  };
}
```

Cada campo resuelve por separado con `??`. Si la alerta existe pero no trae
mensaje, **cae al mensaje estático**.

**3. `estado` y `emergencia.perdido` son redundantes y ya validados.**

`dataValidation.ts:288-307` rechaza tres inconsistencias:

```ts
if (estado === "perdido" && !isLostStatic)          → error
if (estado !== "perdido" && isLostStatic)           → error
if (estado === "fallecido" && isLostStatic)         → error
```

Es decir: la redundancia es **intencionada y vigilada**.

### El estado efectivo gobierna la adopción

`src/lib/domain/adoption.ts:41-59`:

```ts
export function resolveAdoptionAvailability(input) {
  const effective = resolveEffectivePetState(input);
  if (isTerminalPetStatus(effective.status)) return { available: false, reason: "terminal", ... };
  if (effective.isLost)                      return { available: false, reason: "perdido", ... };
  if (effective.status !== "en_adopcion")   return { available: false, reason: "estado_no_disponible", ... };
  return { available: true, reason: null, effectiveStatus: effective.status };
}
```

**Una mascota perdida no se puede adoptar**, y una fallecida tampoco. La
razón se propaga a la UI para poder explicar el motivo.

---

## 11. Emergencias y modo perdido

### El contrato

`src/types/emergency.ts`:

```ts
export type LostAlert = {
  active: true;              // ← discriminante: siempre true si existe
  zonaPerdida?: string;
  fechaPerdida?: string;     // ISO YYYY-MM-DD
  recompensa?: number | null;
  mensaje?: string;
};
```

**No tiene `inactive`.** La ausencia de alerta *es* la ausencia de pérdida.

### Dónde vive hoy

**Nunca en el JSON.** Solo en el navegador:

```
clave:  "pawpass-alerta:v1:<petId>"     ← useLostAlerts.ts:13
evento: "pawpass-lost-mode"             ← useLostAlerts.ts:14
```

`src/lib/lostAlertStorage.ts` implementa un almacenamiento con **tres
niveles de degradación**:

```ts
const memory = new Map<string, LostAlert | null>();                    // :8

export function readLostAlert(storage, key) {                          // :10
  if (memory.has(key)) return memory.get(key) ?? null;   // 1. caché en memoria
  const value = readStoredJson(storage, key, parseLostAlert);         // 2. localStorage
  memory.set(key, value);
  return value;
}

export function writeLostAlert(storage, key, alert) {                  // :24
  memory.set(key, alert);                            // 1. memoria, siempre
  if (alert === null) {
    safeRemoveItem(storage, key);                    // 2. localStorage, si se puede
  } else {
    safeSetItem(storage, key, JSON.stringify(alert));
    // Storage bloqueado o lleno: el estado se conserva en memoria
  }
}
```

Comentario en `:35`: *"Storage bloqueado o lleno: el estado se conserva en
memoria (fallback de sesión)."*

### La capa de storage tolera todo

`src/lib/pwa/storage.ts` aísla `localStorage` y **nunca lanza**:

| Función | Comportamiento ante error |
|---|---|
| `getBrowserStorage()` | `null` si no hay `window` (SSR) o si el acceso lanza |
| `isStorageAvailable()` | Probe de escritura/lectura/borrado; `false` si falla |
| `safeGetItem/safeSetItem/safeRemoveItem` | Envuelven en `try/catch`, devuelven `null`/`false` |
| `readStoredJson()` | Devuelve `null` ante storage ausente, clave ausente, JSON inválido o forma inválida |

El docstring de `getBrowserStorage` (`:17-22`) nombra los casos:
*"modo privado, cookies deshabilitadas, cuota excedida, datos corruptos"*.

### El parseo también es tolerante

`src/lib/domain/emergency.ts:10-40` — `parseLostAlert()`:

```ts
if (raw.recompensa === null) {
  alert.recompensa = null;                       // null explícito se respeta
} else if (typeof raw.recompensa === "number" && Number.isFinite(...) && >= 0) {
  alert.recompensa = raw.recompensa;             // número válido
}
// cualquier otra cosa → se descarta silenciosamente
```

**Nunca lanza.** Un dato corrupto en el storage degrada a "no hay alerta", no a
una pantalla en blanco.

### Sincronización entre pestañas

`useLostAlerts.ts:20-42` — dos fuentes:

1. El evento `storage` nativo de otra pestaña.
2. Un evento custom `"pawpass-lost-mode"` en `window`, que dispara
   `notifyAlertChange()` (`:44-46`).

La lectura se hace con `useSyncExternalStore` (`:51-57`), que es el patrón
correcto de React 19 para fuentes externas.

### Por qué esto importa para el futuro

Este es el flujo que `PRODUCT.md` describe como crítico: una persona preocupada,
en un campo, con una sola mano, con conexión deficiente. **La alerta tiene que
funcionar sin red.** Cualquier migración de almacenamiento debe preservar el
comportamiento offline o el producto se rompe en su momento de mayor estrés.

---

## 12. Salud: vacunas, desparasitación e historial

Es la sección más voluminosa del dominio, distribuida en dos ficheros de tipos
y tres de reglas.

### Vacunas

`src/types/pet.ts:107-122`:

```ts
export interface PetVaccine {
  id: string;
  nombre: string;
  fechaAplicacion: string;
  proximaDosis: string;
  estatus: VaccineStatus;          // "al_dia" | "proxima_dosis" | "vencida"
  lote: string;
  veterinario: string;
  documentoUrl: string;
  fechaCreacion?: string;          // FASE 5.1, opcional
  origen?: string;                 // FASE 5.1, opcional
  documentoId?: string;            // FASE 5.1, vínculo explícito
}
```

### 🔴 `estatus` es un dato derivado que hoy se ALMACENA

`src/lib/domain/vaccine.ts:15-17` lo dice literalmente:

> *"NO se inventan reglas clínicas. Las comparaciones de fecha son puramente
> calendáricas... y los estados se toman de los datos tal como están; **nunca se
> 'recalcula' el `estatus` almacenado**."*

Y sin embargo `resolveVaccineNextDoseAlert` (`:277-304`) **combina** el estatus
guardado con la fecha:

```ts
if (vaccine.estatus === "vencida")     return { kind: "vencida" };      // manda el dato
const nextDose = getVaccineNextDoseDate(vaccine);
if (nextDose === null)                  return null;
if (nextDose < todayIso)                return { kind: "vencida" };      // manda la fecha
if (nextDose === todayIso)              return { kind: "vence_hoy" };
if (vaccine.estatus === "proxima_dosis") return { kind: "marcada_proxima" };
return null;
```

**El propio dominio reconoce que el estatus guardado puede mentir.** Ejemplo
real en `mascotas.json` (Lucca):

```json
{"nombre":"Rabia",        "fechaAplicacion":"2025-01-15","proximaDosis":"2026-01-15","estatus":"al_dia"}
{"nombre":"Triple Canina","fechaAplicacion":"2025-01-15","proximaDosis":"2026-01-15","estatus":"proxima_dosis"}
```

Misma fecha de aplicación, misma próxima dosis, **estatus distintos**. El dominio
lo resuelve comparando fechas cada vez.

### Desparasitación

`src/types/health.ts:30-46`:

```ts
export type HealthDeworming = {
  id: string;
  producto: string;
  fecha: string;                      // ISO
  proximaFecha?: string;
  dosis?: string;
  veterinario?: string;
  documentoUrl?: string;
  documentoId?: string;
  fechaCreacion?: string;
  origen?: string;
};
```

A diferencia de la vacuna, aquí **`proximaFecha` sí se usa para calcular**:

`domain/health.ts:178-214` — `resolveNextDewormingDue()` clasifica en
`vencida` / `entrega_hoy` / `programada` comparando con hoy, y devuelve el más
urgente.

### Historial médico

`src/types/health.ts:54-69`:

```ts
export type HealthConsultation = {
  id: string;
  fecha: string;
  motivo: string;
  diagnostico?: string;
  tratamiento?: string;
  medicamentos: string[];
  veterinario?: string;
  documentos: HealthDocumentRef[];    // ← array embebido
  fechaCreacion?: string;
  origen?: string;
};
```

Y `HealthDocumentRef` (`:16-24`) **duplica** nombre + url de un `PetDocument`:

```ts
export type HealthDocumentRef = {
  id: string;
  nombre: string;
  url: string;
};
```

El comentario (`:12-15`) explica que puede ser un `PetDocument` existente o un
adjunto independiente. En la práctica son los mismos datos duplicados.

### 🔴 La salud general codifica "no tengo" con una palabra

`dataValidation.ts:27`:

```ts
const SENTINELS = new Set(["Ninguna", "Ninguna registrada", "ninguna", "ninguna registrada"]);
```

Y `:406-413` avisa cuando lo encuentra:

> `"{petId}: salud.{field} contiene el sentinel "Ninguna"; reemplazar por [] o un
> valor real."`

Es decir: el JSON representa "no tengo alergias" como `["Ninguna"]`, **no como
`[]`**. El repo ya lo instrumenta como deuda.

### El resumen exportable es derivado

`src/types/health.ts:79-127` — `HealthExportSummary` se construye **entero** en
`buildHealthExportSummary(pet, today)` (`domain/health.ts:411-462`). Su propio
docstring (`:70-78`) dice:

> *"Este es el CONTRATO de contenido; la generación del PDF (o PNG/SVG/impresión)
> pertenece a la capa de servicios/UI y no a este dominio."*

**No es una tabla. Es una proyección.**

### Completitud: "datos faltantes"

`domain/health.ts:317-344` — `getHealthCompletenessReport()` recorre los tres
tipos de registro y reporta qué campos informativos están vacíos. Distingue
explícitamente entre:

- **Dato faltante** (informativo vacío) → no es error.
- **Dato inválido** → eso sí lo detecta `dataValidation`.

`health.ts:20-25`: *"solo señala la AUSENCIA de campos informativos... no es una
validación de datos (eso es dataValidation) ni una evaluación clínica."*

---

## 13. Documentos y assets

### El contrato

`src/types/pet.ts:124-135`:

```ts
export interface PetDocument {
  id: string;
  nombre: string;
  tipo: PetDocumentType;        // "pdf" | "imagen" | "otro"
  categoria: PetDocumentCategory; // 6 valores
  url: string;
  fecha: string;
  tamano?: string;              // ⚠️ "2.4 MB" — string formateado
  visiblePublico: boolean;       // 🔴 ESTE es el gate real
  estado?: string;              // ⚠️ texto libre, NO validado
  descripcion?: string;
}
```

### El filtro de visibilidad

`src/lib/petDocuments.ts:4-6` — **tres líneas**:

```ts
export function getPublicDocuments(pet: PetProfile) {
  return pet.documentos.filter((document) => document.visiblePublico);
}
```

Se usa en:
- `mapping/profile.ts:82` → los documentos del perfil público
- `app/perfil/[id]/documentos/page.tsx:44` → la página de documentos

**Ese es el único control de visibilidad de documentos en todo el proyecto.**

### Los assets son archivos reales en `public/`

```
public/pets/   → 16 archivos (11 .jpeg + 5 .svg)
public/docs/   → 24 archivos (6 mascotas × 4 documentos)
```

Los 4 documentos por mascota:

```
cartilla-vacunacion.pdf
comprobante-veterinario.pdf
estudios-medicos.pdf          ← el privado
foto-reciente.jpg
```

Y **los archivos privados también están en `public/`**. Ejemplo real,
`mascotas.json` líneas 61-66:

```json
"documentos": [
  { "id":"lucca-doc-1", "categoria":"vacunas", "visiblePublico":true,  ... },
  { "id":"lucca-doc-2", "categoria":"veterinario","visiblePublico":true, ... },
  { "id":"lucca-doc-3", "categoria":"foto",       "visiblePublico":true,  ... },
  { "id":"lucca-doc-4", "categoria":"salud", "visiblePublico":false, "estado":"Privado",
    "nombre":"Estudios Médicos", "descripcion":"Resultados médicos privados." }
]
```

🔴 **`estudios-medicos.pdf` está en `public/docs/lucca/` y por tanto es
servible por HTTP directo** en `/docs/lucca/estudios-medicos.pdf`, aunque la
interfaz nunca lo enlace. `scripts/validate-data.mts:31` resuelve las rutas
relativas contra `public/` y falla si no existen, así que el archivo existe.

Esto **no es un exploit**: el repositorio es público y los datos son de
prototipo. Pero sí es exactamente el modelo que **no puede** survives a datos
reales. Es un hallazgo del inventario, no una vulnerabilidad explotable hoy.

### `tamano` y `estado` no son datos estructurados

| Campo | Valores reales | Problema |
|---|---|---|
| `tamano` | `"2.4 MB"`, `"620 KB"`, `"1.1 MB"` | Es **texto formateado**, no un número. `petDocuments.ts:9` lo concatena para pantalla |
| `estado` | `"Temporal"`, `"Verificado"`, `"Privado"` | **Texto libre.** `dataValidation.ts:215` solo comprueba que sea `string`. No hay lista cerrada |

Son las dos columnas donde un modelo relacional opportunities aportsa más: un
`tamaño` en bytes es ordenable y filtrable; un `"2.4 MB"` no.

---

## 14. Privacidad: las cuatro banderas y su estado real

`src/types/pet.ts:99-104`:

```ts
configuracionPublica: {
  mostrarEmail: boolean;
  mostrarTelefonoSecundario: boolean;
  mostrarDireccionVet: boolean;
  mostrarDocumentosPrivados: boolean;
}
```

`PRODUCT.md:102` lo convierte en principio: *"Nada es público sin consentimiento.
Publicar es un acto explícito, elemento por elemento."*

### El estado real de cada bandera, verificado con grep sobre todo `src/`

| Bandera | Valores | Leída en web | Leída en carnet | Efectiva |
|---|---|---|---|---|
| `mostrarEmail` | `false` ×21 | ❌ | ✅ `domain/carnet.ts:114` | Solo impresión |
| `mostrarTelefonoSecundario` | `false` ×21 | ❌ | ✅ `domain/carnet.ts:111` | Solo impresión |
| `mostrarDireccionVet` | `true` ×11 / `false` ×10 | ✅ `mapping/profile.ts:126` | ✅ | **Sí, funciona** |
| `mostrarDocumentosPrivados` | `false` ×21 | ❌ | ❌ | 🔴 **NINGUNA** |

### El hallazgo importante: hay dos superficies de privacidad distintas

**En el perfil web:**
- `contacto.email` → **nunca se renderiza**. Solo se lee en el carnet.
- `contacto.telefonoSecundario` → **nunca se renderiza**. Solo en el carnet.
- `veterinario.direccion` → se renderiza, **gated** por `mostrarDireccionVet`
  (`mapping/profile.ts:126`: `? direccion : "Dirección privada"`).
- Documentos → gated por `visiblePublico` individual.

**En el carnet impreso** (`domain/carnet.ts:105-117`):

```ts
contacto: {
  email: pet.configuracionPublica.mostrarEmail ? textOrNull(pet.contacto.email) : null,
  telefonoSecundario: pet.configuracionPublica.mostrarTelefonoSecundario
    ? textOrNull(pet.contacto.telefonoSecundario) : null,
  ...
}
```

**Los cuatro flags tienen efecto real, pero en superficies distintas.** Solo uno
actúa en la web.

### El flag muerto

Buscando `mostrarDocumentosPrivados` en todo `src/` (excluyendo tests), los
únicos resultados son:

- Las 21 apariciones en los JSON.
- `dataValidation.ts:337` — se valida que sea boolean.
- `src/types/pet.ts:103` — la declaración del tipo.

**Ningún componente, mapper o regla de dominio lo lee.**

El control real es `getPublicDocuments()` → `documento.visiblePublico`.

**Implicación que hay que registrar:** si alguien assume que
`mostrarDocumentosPrivados === false` significa "esta mascota no publica
documentos", **se equivoca**. Un documento con `visiblePublico: true` se muestra
igual. Hoy los 21 perfiles tienen el flag en `false`, así que **no hay diferencia
observable hoy**, pero la band's semántica no es la que aparenta.

### El contacto también es dato real

`mascotas.json` contiene nombres de personas reales (`"Donnovan Trejo"`,
`"Evelia Corona"`) y teléfonos. **No hay entidad de usuario**: el contacto del
tutor está aplanado dentro del perfil de la mascota porque el concepto "cuenta"
no existe en el código.

---

## 15. Refugios

`src/types/shelter.ts:12-22`:

```ts
export type Shelter = {
  id: ShelterId;                          // "patitas-con-causa"
  nombre: string;
  descripcion: string;
  ubicacion: string;                      // texto libre, NO geometría
  contacto: ShelterContact;
  redes: ReadonlyArray<string>;           // 0..2 URLs
  logoUrl: string | null;                 // null en ambos registros
  mascotas: ReadonlyArray<PetId>;         // 🔴 ARRAY, no relación
  verificado: boolean;
};
```

### La relación es un array embebido

```json
"mascotas": ["mila", "toby", "canela"]
```

Resuelta con búsqueda lineal en `src/lib/domain/shelter.ts:8-10`:

```ts
export function findShelterForPet(petId: PetId, shelters: ReadonlyArray<Shelter>): Shelter | null {
  return shelters.find((shelter) => shelter.mascotas.includes(petId)) ?? null;
}
```

**`.includes()` sobre un array dentro de un `.find()` sobre otro array.** Sin
índice, sin estructura. Se ejecuta por cada tarjeta de adopción y por cada
página de refugio (`app/perfil/[id]/page.tsx:109`,
`app/adopciones/page.tsx:25`, `app/refugios/[id]/page.tsx:61`).

Es la **relación N:M más importante del modelo** y la que más crece: un refugio
puede tener 37 mascotas (`PawPass_Roadmap_Maestro.md:1132`).

### Los dos registros reales

| | `patitas-con-causa` | `rincon-canino` |
|---|---|---|
| `verificado` | `true` | `false` |
| `email` | `adopciones@patitasconcausa.mx` | `null` |
| `redes` | 2 URLs | `[]` |
| `logoUrl` | `null` | `null` |
| `mascotas` | `mila, toby, canela` | `luna, simba, bruno` |

**Ninguno de los 2 refugios tiene todas sus mascotas en adopción**:
`canela` (fallecida) y `bruno` (perdido) están bajo su cuidado pero no son
adoptables. La página de refugio lo maneja con dos secciones: *"Mascotas en
adopción"* y *"Otras mascotas bajo su cuidado"* (`refugios/[id]/page.tsx:154-192`).

---

## 16. Adopciones

### El contrato

`src/types/adoption.ts:21-36`:

```ts
export type AdoptionRequest = {
  id: AdoptionRequestId;
  petId: PetId;                        // 🔴 slug, no ID
  shelterId: ShelterId | null;
  estado: AdoptionRequestStatus;
  fechaEnviada: string;
  notas: string | null;
  aspirante: AdoptionApplicant;
};

export type AdoptionApplicant = {
  nombre: string;
  telefono: string;
  email: string | null;
  motivo: string;                       // texto libre de un tercero
};
```

Estados (`domain/adoption.ts:12-19`):

```
enviada → en_revision → aprobada → completada
                  ↘ rechazada
                  ↘ cancelada
```

### El solicitante no es un usuario

**Este es el hecho estructural más importante de adopciones.** El flujo actual
(`src/components/features/adoption/AdoptionRequestForm.tsx`) es **anónimo**:
alguien escaneó el QR, rellenó nombre + teléfono + email + motivo, y envió. No
hay cuenta, no hay sesión, no hay identidad verificable.

Consecuencias:
- El `id` se genera **en el navegador** (`AdoptionRequestForm.tsx:104-106`):
  ```ts
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}`;
  ```
- Contiene **PII de un tercero** que no pidió una cuenta.
- `motivo` es texto libre de alguien externo.

### Validación

`domain/adoption.ts:132-186` — `validateAdoptionRequest()` produce **9 errores
tipados**:

```ts
type AdoptionRequestError =
  | "pet_no_disponible" | "pet_no_coincide" | "pet_requerido"
  | "nombre_requerido"  | "telefono_requerido" | "telefono_invalido"
  | "email_invalido"    | "motivo_requerido"   | "fecha_invalida";
```

El teléfono se valida contra formato mexicano (`isValidApplicantPhone`, `:123-130`):
10 dígitos, o 12 empezando por `52`, o 13 por `521`.

⚠️ **No valida longitud máxima** de `motivo` ni de `nombre`.

### Dónde se guarda hoy

`src/lib/adoptionRequestStorage.ts` — **solo `localStorage`**:

```
clave:  "pawpass-adopcion:v1:<petId>"    ← useAdoptionRequests.ts:12
evento: "pawpass-adoption-requests"       ← useAdoptionRequests.ts:13
```

🔴 **El solicitante no recibe nada.** La solicitud se guarda en el navegador de
**quien solicita**, y el refugio no tiene forma de verla. `PRODUCT.md:76-78` lo
reconoce:

> *"Sin decidir: si los envíos de solicitudes de adopción llegan alguna vez a un
> servidor. Hoy la solicitud de adopción se guarda únicamente en el navegador de
> quien visita."*

Es decir: **el flujo de adopción está incompleto por diseño y documentado como
tal.** El formulario funciona y se guarda, pero no hay entrega.

### El catálogo de adopción es derivado

`types/adoption.ts:38-52` — `AdoptionCatalogEntry` se construye en
`buildAdoptionCatalogEntry(pet, shelter)` (`domain/adoption.ts:82-101`). Nota esta
línea (`:96`):

```ts
zona: shelter?.ubicacion ?? pet.contacto.zonaHabitual,
```

**Usa la ubicación del refugio si existe, si no la zona habitual de la
mascota.** Es un fallback, no un dato duplicado en el JSON.

---

## 17. Carnet físico

`src/types/carnet.ts:87-157` — `PhysicalPetCard` es el contrato más grande del
proyecto (70 líneas) y **es 100% derivado**.

El comentario de cabecera (`:11-14`) lo dice:

> *"El carnet NO es una segunda fuente de verdad: el estado efectivo proviene del
> dominio de estados, la salud de `buildHealthExportSummary` y la URL pública
> (base del QR) de `getPublicProfileUrl`."*

Y el de `PhysicalPetCardEstado` (`:37-42`):

> *"Derivado del estado efectivo existente (`resolveEffectivePetState`), nunca
> calculado en el carnet."*

Se construye en `buildPhysicalPetCard(pet, options)` (`domain/carnet.ts`). Y como
con `HealthExportSummary`, **el propio tipo aclara que la representación
(impresión, PNG, SVG, PDF) pertenece a la capa de UI**, no al dominio
(`types/carnet.ts:73-78`).

El QR del carnet **nunca contiene el `pet.id`** — ver §9.

---

## 18. Entidades que existen solo en memoria

Hay varios contratos que parecen entidades pero son **proyecciones**. Un criterio
simple y verificable:

> **Si un tipo se construye con una función `build*` o `to*` a partir de `pet`,
> no es una tabla. Es una proyección.**

| Tipo | Se construye en | Persiste |
|---|---|---|
| `PhysicalPetCard` | `buildPhysicalPetCard()` | ❌ Derivado |
| `HealthExportSummary` | `buildHealthExportSummary()` | ❌ Derivado |
| `AdoptionCatalogEntry` | `buildAdoptionCatalogEntry()` | ❌ Derivado |
| `ProfileViewModel` | `toProfileViewModel()` | ❌ Derivado |
| `VaccineTimelineItem` | `mapping/health.ts` | ❌ Derivado |
| `ShelterPetCard` / `CatalogCard` | `mapping/adoptionPresentation.ts` | ❌ Derivado |
| `FoundPetMessageOptions` | `buildFoundPetMessage()` | ❌ Se manda por WhatsApp |

### Telemetría

`src/lib/domain/telemetry/` contiene contratos de eventos y métricas. Sus propias
reglas los declaran **privacy-safe** (`docs/telemetry/TELEMETRY.md`). El adapter
actual es `infra/telemetry/noop-client.ts` — un no-op.

Los cálculos de `src/lib/kpis/calculations.ts` (21 líneas) son puros:
`calculateRegistrationToQrDurationMs`, `calculateQrScanEffectiveness`. No tocan
datos.

**Pendiente documentado** (`docs/fase-9-services-arquitectura.md:244-245`):
*"La telemetría de FASE 8 sigue sin conectarse a la UI: `services/telemetry/
trackers.ts` solo lo consume su propio test."*

---

## 19. Capa de dominio

`src/lib/domain/` — **reglas puras, cero infraestructura**. 12 módulos.

| Módulo | Responsabilidad | Tests |
|---|---|---|
| `petStatus.ts` | Estados, transiciones, estado efectivo | ✅ |
| `emergency.ts` | Fusión estático+runtime, parseo de alertas | ✅ |
| `health.ts` | Desparasitación, historial, resumen exportable, completitud | ✅ |
| `vaccine.ts` | Reglas de vacunación, filtros, orden, alertas de próxima dosis | ✅ |
| `adoption.ts` | Disponibilidad para adopción, validación de solicitudes | ✅ |
| `shelter.ts` | Búsqueda de refugio por id / por mascota | ✅ |
| `carnet.ts` | Construcción del carnet físico | ✅ |
| `dateRules.ts` | Comparación y normalización de fechas ISO | ✅ |
| `documentCategory.ts` | Etiquetas de categoría | ✅ |
| `vaccineStatus.ts` | Etiquetas de estado de vacuna | ✅ |
| `telemetry/` | Eventos, catálogo, validadores | ✅ |
| `directory/types.ts` | **Ports** `PetDirectory`, `ShelterDirectory` | ✅ |

### Los ports

`src/lib/domain/directory/types.ts:24-33`:

```ts
export type PetDirectory = {
  listProfilePets(): PetProfile[];
  listAdoptionPets(): PetProfile[];
  findProfilePet(identifier: string): PetProfile | null;
  findAdoptionPet(identifier: string): PetProfile | null;
};

export type ShelterDirectory = {
  listShelters(): Shelter[];
};
```

Convenciones documentadas (`:12-17`):

- El identificador se recibe *trimmed* y contrasta contra `id` **o**
  `identificacion.codigoPublico`.
- **"No existe" es siempre `null`, nunca `undefined`.** Antes de FASE 9
  `getPetById` devolvía `undefined`; se normalizó.
- Los datos inválidos se detectan al cargar la fuente (adapter), no aquí.

### La deuda declarada por los propios ports

`types.ts:18-22` — el comentario anticipa exactamente la transición futura:

> *"hoy corresponden a dos ficheros estáticos disjuntos (`mascotas.json` y
> `adopciones.mock.json`), que es una limitación del prototipo. Con backend real
> ambas se responderán desde la misma tabla filtrando por estado; ese es el
> momento de simplificar el puerto, no antes."*

Y `docs/fase-9-services-arquitectura.md:186-190` ya decidió **no** hacerlo ahora:
*"unificar ahora habría cambiado datos y risked la regresión de `validate:data`."*

### Cómo se normalizan los datos dudosos

Todo el dominio usa un patrón consistente (`health.ts:19-33`):

```ts
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asNullableString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}
```

**Cadena vacía → `null`. Valor de tipo incorrecto → `null`. Ausencia → `[]`.**
Nunca lanza.

---

## 20. Capa de mapping

`src/lib/mapping/` — puente entre el dominio y la presentación. **No contiene
reglas de negocio**, solo proyección y formato.

| Módulo | Convierte | Para qué |
|---|---|---|
| `profile.ts` | `PetProfile` → `ProfileViewModel` | La página de perfil |
| `health.ts` | `PetVaccine` → items de línea de tiempo / resumen | `/vacunas`, `/salud` |
| `adoptionPresentation.ts` | → tarjetas de catálogo y refugio | `/adopciones`, `/refugios` |
| `petStatusPresentation.ts` | `PetStatus` → etiqueta, tono, emoji | Badges y banners |
| `carnet.ts` | `PhysicalPetCard` → datos de impresión | `/carnet` |

### El detalle que hace que mapping exista

`mapping/profile.ts:96`:

```ts
status: {
  vaccines: pet.vacunas.some((v) => v.estatus === "vencida") ? "Revisar" : "Al día",
  sterilized: pet.mascota.esterilizado ? "Sí" : "No",
  microchip: pet.identificacion.microchip ? "Registrado" : "No cuenta",
},
```

**"Revisar" / "Al día" / "Registrado" / "No cuenta" son cadenas de presentación.**
No existen en el dominio. Los componentes nunca deciden cómo mostrar un dato:
lo reciben ya formateado.

Otro ejemplo (`:96-98`):

```ts
vaccines: pet.vacunas.map((vaccine) => ({
  date: formatMexicanDate(
    vaccine.estatus === "proxima_dosis" ? vaccine.proximaDosis : vaccine.fechaAplicacion,
    "short",
  ) ?? "Fecha pendiente",
```

**La elección de qué fecha mostrar depende del estatus.** Esa decisión es de
presentación y vive en mapping, no en el dominio.

Y `formatPhoneForDisplay` (`:149-168`) maneja cuatro formatos de teléfono
mexicano: 10 dígitos, `52XXXXXXXXXX`, `521XXXXXXXXXX`, y 12 dígitos sin prefijo.

---

## 21. Servicios y puertos

`src/lib/services/` — **la API que consume la UI**.

### `services/pets/queries.ts`

| Función | Comportamiento |
|---|---|
| `getAllPets()` | Perfiles propios (11) |
| `getPetById(id)` | Resuelve por `id` o `codigoPublico`; `null` si no existe |
| `getAdoptionDemoPets()` | Catálogo de adopción (10) |
| `getAllProfilePets()` | Los 21, concatenados |
| `getPetByIdAny(id)` | Perfil primero, luego adopción |

**El punto de intercambio** (`queries.ts:20`):

```ts
const directory: PetDirectory = staticPetDirectory;
```

`docs/fase-9-services-arquitectura.md:113-123` describe el procedimiento exacto
para cambiar la fuente:

1. Implementar el port en un adapter nuevo en `lib/infra/directory/`.
2. Cambiar **una sola línea** en `services/pets/queries.ts`.
3. Si la respuesta difiere, decidir en esa frontera si hace falta un mapper.
4. `npm test` valida el contrato: si el adapter devuelve `undefined` en vez de
   `null`, los tests fallan.

### `services/shelters/queries.ts`

Idéntico, 21 líneas. `getMockShelters()` con `staticShelterDirectory`.

> ⚠️ El nombre `getMockShelters()` es deuda de nomenclatura reconocida
> (`docs/fase-9-services-arquitectura.md:190-191`): *"El nombre 'Demo' es deuda de
> nomenclatura, pero renombrarlo es churn sin beneficio funcional."*

### Adapters existentes

| Adapter | Fuente | Validación |
|---|---|---|
| `infra/directory/staticPets.ts` | `mascotas.json` + `adopciones.mock.json` | `assertValidPetProfiles` en ambos, al importar |
| `infra/directory/staticShelters.ts` | `shelters.mock.json` | `assertValidShelters` |
| `infra/telemetry/noop-client.ts` | Ninguna | — |

**Los adapters son la única capa que conoce `src/data`**, y hay un test que lo
verifica (`architecture.test.ts:141-151`).

---

## 22. Persistencia local: localStorage

Inventario completo. **5 claves**, 2 con datos de negocio y 3 de preferencias.

### Claves de negocio 🔴

| Clave | Contenido | Productor | Consumidor |
|---|---|---|---|
| `pawpass-alerta:v1:<petId>` | `LostAlert \| null` | `useLostAlerts` | `resolveEffectivePetState` |
| `pawpass-adopcion:v1:<petId>` | `AdoptionRequest[]` | `useAdoptionRequests` | Solo el propio navegador |

🔴 **Ambas están particionadas por `petId`, que hoy es un slug.**

```
pawpass-alerta:v1:lucca
pawpass-alerta:v1:bruno
pawpass-adopcion:v1:mila
```

Consecuencia directa: **cualquier cambio en la forma del identificador de mascota
deja huérfanas estas claves.** Y el fallo es silencioso: `resolveLostState`
(`emergency.ts:65`) cae a `emergencia.perdido` (que es `false`) y la mascota
aparece simplemente "en casa", sin error ni aviso.

### Claves de preferencia

| Clave | Contenido |
|---|---|
| `pawpass-theme:v1` | `"dark"` \| `"light"` (`app/providers.tsx:10`) |
| `pawpass-pwa-install-dismissed:v1` | El usuario descartó el CTA de instalación (`pwa/install.ts:15`) |
| `__pawpass_probe__` | Probe de disponibilidad, se borra inmediatamente (`pwa/storage.ts:16`) |

### El anti-FOUC

`src/app/layout.tsx:77` inyecta un script **en el `<head>`** que lee
`localStorage` antes de que React arranque:

```js
(function(){try{
  var k='pawpass-theme:v1',
      v=localStorage.getItem(k)||localStorage.getItem('pawpass-theme'),
      dark=v ? v==='dark' : window.matchMedia('(prefers-color-scheme: dark)').matches,
      d=document.documentElement;
  d.classList.toggle('dark',dark);
  d.style.colorScheme=dark?'dark':'light';
}catch(e){}})();
```

**Tiene que ser JS plano**: no puede esperar a un bundle de React. Por eso
`app/providers.tsx` y este script **no pasan por `StorageLike`** — es deuda
documentada, no un olvido (`docs/fase-9-services-arquitectura.md:173-175`).

---

## 23. Mapa completo de rutas

```
/                                     app/page.tsx          → listado de mascotas
/adopciones                           app/adopciones/       → catálogo + refugios
/login                                app/login/            → placeholder (texto)
/perfil/[id]                          app/perfil/[id]/      → perfil público completo
/perfil/[id]/salud                    → vacunas + salud + historial + export
/perfil/[id]/vacunas                  → listado completo de vacunas
/perfil/[id]/documentos               → documentos públicos
/perfil/[id]/carnet                   → carnet imprimible
/perfil/[id]/alerta                   → generar alerta de pérdida
/perfil/[id]/adopcion                 → formulario de solicitud
/refugios/[id]                        → perfil de refugio

/manifest.webmanifest                  app/manifest.ts
/sw.js                                public/sw.js (servido como estático)
/icon.svg                             src/app/icon.svg
```

**15 páginas.** `SiteNav` (`components/layout/SiteNav.tsx:7-22`) tiene 4 enlaces:
Inicio, Mascotas (`/#mascotas`), Adopciones, Iniciar sesión.

### `/login` es un placeholder

`src/app/login/page.tsx:17`:
> *"El panel con tus mascotas estará disponible próximamente. Por ahora puedes
> explorar los perfiles públicos."*

**Cero lógica de sesión.** No hay `middleware.ts`, no hay route handlers, no hay
cookies, no hay `/api/`.

⚠️ Nota registrada en `docs/fase-9-services-arquitectura.md:228-229`:
*"`/refugios` (índice) devuelve 404 porque el proyecto solo tiene
`app/refugios/[id]/page.tsx`. No es una regresión de esta fase."* — sigue siendo
cierto.

### Prerenderizado

`perfil/[id]/page.tsx:37` y `refugios/[id]/page.tsx:31` usan
`generateStaticParams()`. **Las páginas son SSG**: se construyen en tiempo de
build, no se piden a un servidor en cada visita.

Esto tiene una consecuencia importante para cualquier capa de persistencia futura:
**una página SSG no puede leer datos que cambian en tiempo de ejecución** sin
pasar a render dinámico (`force-dynamic`) o a revalidación.

---

## 24. PWA, service worker y modo sin conexión

`public/sw.js` (285 líneas, `VERSION = "v3"`).

### Tres estrategias

| Tipo de petición | Estrategia | Caché |
|---|---|---|
| Navegación (`mode: "navigate"`) | **network-first** → caché → shell raíz | `pawpass-v3` |
| Navegación interna RSC (`header RSC: 1`) | **network-first** | `pawpass-routes-v3` |
| Assets estáticos | **stale-while-revalidate** | `pawpass-v3` |
| **Todo lo demás** | **Se ignora** | — |

### Lo que NO se cachea 🔴

`sw.js:123-154` — el handler corta antes de llegar a `respondWith`:

```js
if (request.method !== "GET") return;          // :126  solo GET
if (url.origin !== self.location.origin) return; // :137  solo mismo origen
// ... y solo entra si isDocumentPath() o isCacheableStatic()
```

Comentario del fichero (`:15-16`):
> *"Todo lo demás: se ignora. No se cachean respuestas de datos API ni estados
> potencialmente inconsistentes."*

**Consecuencia:** cualquier petición a un origen externo se ignora
completamente. No se cachean respuestas de API, ni tokens, ni datos de usuario.

### Las dos cachés separadas

`sw.js:36-53` — un problema real que ya se corrigió:

> *"Un documento se guarda con su URL completa y un payload RSC con solo el
> `pathname`. En la misma caché, la Cache Storage resuelve la clave relativa
> contra el ámbito del service worker y ambas terminan siendo la MISMA entrada:
> el payload machaca el HTML. El síntoma era silencioso y grave: se visitaba un
> perfil, se navegaba dentro de la app, y al recargar sin señal el documento ya
> no estaba y el worker devolvía el shell raíz."*

Por eso hay dos cachés y por eso los fallbacks consultan **solo** la suya
(`:204`, `:258`).

### El alcance está declarado de forma explícita

`sw.js:67-70`:

```js
const DOCUMENT_PREFIXES = ["/perfil/", "/refugios/"];
const DOCUMENT_PATHS = ["/adopciones", "/login"];
```

Comentario: *"La lista es explícita y no un comodín: cachear de más significaría
servir contenido que no se ha verificado."*

Y `:23-25` explica por qué el shell no se precachea entero:
*"para respetar el alcance de la app (páginas SSG, sin backend)."*

### La UI de campo

| Componente | Función |
|---|---|
| `components/pwa/OfflineStatus.tsx` | Indicador de conexión |
| `components/pwa/OfflineRouteNotice.tsx` | Aviso al navegar sin conexión |
| `components/pwa/OfflineNavGuard.tsx` | Bloquea navegación a rutas no cacheadas |
| `components/pwa/InstallCta.tsx` | CTA de instalación con lógica de `beforeinstallprompt` |
| `components/pwa/ServiceWorkerRegistration.tsx` | Registro (solo en producción) |

`registerServiceWorker.ts:20`:
```ts
return process.env.NODE_ENV === "production";
```

### La degradación de la UI

`sw.js:210-217`: si no hay red **y** no hay caché, devuelve 503 con un cuerpo
legible, no una excepción:

```js
return new Response("Sin conexión y sin copia local", {
  status: 503,
  statusText: "Service Unavailable",
  headers: { "Content-Type": "text/plain; charset=utf-8" },
});
```

Y `routeFirst` (`:249-252`) devuelve **503 con cuerpo vacío** para que
`OfflineRouteNotice` detecte la ausencia de respuesta válida y explique la
situación, en vez de mostrar un fallo técnico.

---

## 25. SEO, Open Graph y metadatos

`src/lib/seo.ts` (48 líneas) — constructor de metadata por mascota.

```ts
export function getPetProfileSeoTitle(pet): string {
  return pet.emergencia.perdido
    ? `${pet.mascota.nombre} está perdido | PawPass`
    : `${pet.mascota.nombre} | PawPass`;
}
```

El título **cambia según el estado de pérdida**. Un perdido se indexa distinto.

```ts
export function buildPetProfileMetadata(pet): Metadata {
  return {
    title, description,
    alternates: { canonical: publicProfileUrl ?? undefined },
    openGraph: { title, description, url: publicProfileUrl, type: "website",
                 siteName: "PawPass", locale: "es_MX", images: ogImage },
    twitter: { card: photo ? "summary_large_image" : "summary", ... },
  };
}
```

**El canonical y el OG `url` son siempre `/perfil/<codigoPublico>`**, nunca el
slug. Y `ogImage` usa `pet.mascota.fotoPerfilUrl` — la ruta a un archivo de
`public/pets/`.

Cuando la mascota no existe (`page.tsx:45-51`):
```ts
return { title: "Mascota no encontrada | PawPass", robots: { index: false } };
```

### El manifiesto

`src/app/manifest.ts` — generado por una función pura testeable
(`manifest.test.ts` existe).

```ts
export const PWA_THEME_COLOR = "#1f4a3a";         // token --brand de globals.css
export const PWA_BACKGROUND_COLOR = "#f4f1ea";    // token --canvas
export const PWA_ICON_SRC = "/icon.svg";
```

Comentario (`:3-7`): *"Los colores del manifest son los mismos tokens del
sistema visual, no valores sueltos."*

`display: "standalone"`, `lang: "es"`, `scope: "/"`.

---

## 26. Validación de datos

Dos módulos + un script. **Es una barrera real, no una cortesía.**

### `src/lib/dataValidation.ts` (472 líneas)

Valida **cada campo** de cada perfil con un helper por tipo:

```ts
expectString / expectNonEmptyString / expectBoolean / expectNumber
expectNullableString / expectStringArray / expectDate / expectEnum / expectRecord
```

Las reglas de dominio que incorpora:

| Regla | Ubicación |
|---|---|
| `codigoPublico` con patrón `PC-XXX-NNN` | `:245` |
| `codigoPublico` **único en todo el fichero** | `:248-251` |
| `id` **único en todo el fichero** | `:362-365` |
| `estado` ∈ `PET_STATUSES` | `:222` |
| `especie` ∈ {Perro, Gato} | `:228` |
| `talla` ∈ 4 valores | `:232` |
| `recompensa >= 0` | `:281-283` |
| Fechas en formato `YYYY-MM-DD` | `:23`, `:73-77` |
| Teléfonos válidos (10 / 52+10 / 521+10) | `:25`, `:449-454` |
| `estado` ⟺ `emergencia.perdido` | `:288-300` |
| `fallecido` + perdido = inválido | `:301-306` |

### Avisos que no bloquean

`collectDataWarnings()` (`:386-471`) detecta problemas que no son errores:

- Sentinels `"Ninguna"` en salud (`:406-413`).
- `perdido: true` sin fecha o zona (`:423-428`).
- Datos de emergencia huérfanos con `perdido: false` (`:429-439`).
- Teléfono que no parece mexicano (`:449-454`).
- `telefonoPrincipal` ≠ `whatsapp` (`:455-457`).
- **Teléfono compartido por ≥3 mascotas** (`:465-469`) ← los 26 avisos actuales.

### Fallo rápido

`assertValidPetProfiles()` (`:379-384`) lanza con la lista agregada:

```ts
throw new Error(`Datos de mascotas inválidos:\n  - ${errors.join("\n  - ")}`);
```

**Se invoca al importar el adapter** (`staticPets.ts:18-19`), así que un JSON
inválido **rompe el build**, no se descubre en producción.

### El script

`scripts/validate-data.mts` — lo ejecuta `npm run validate:data`.

Además de la validación de forma, hace una **comprobación de assets** que
`dataValidation.ts` no hace (`:20-55`):

```ts
const filePath = resolve(root, "public", relative);
if (!existsSync(filePath)) missing.push(`${owner}: falta el asset ${url}`);
```

Verifica que cada `fotoPerfilUrl`, `vacunas[].documentoUrl` y `documentos[].url`
**apunte a un archivo que existe en `public/`**. Si un documento apunta a un
archivo inexistente, **el comando falla**.

`shelterValidation.ts` (`:67`, `:78`) valida el fichero de refugios por separado.

---

## 27. Testing

```
54 ficheros de test
709 tests
Todos pasan en 2.70s
```

### Distribución

| Ubicación | Tests | Qué cubren |
|---|---|---|
| `src/lib/domain/*.test.ts` | 12 ficheros | Reglas puras de negocio |
| `src/lib/*.test.ts` | ~20 | Utilidades, storage, SEO, clipping |
| `src/lib/pwa/*.test.ts` | 10 ficheros | Install, conectividad, cache, offline nav |
| `src/lib/infra/**/*.test.ts` | 4 ficheros | Los adapters estáticos |
| `src/lib/services/**/*.test.ts` | 2 ficheros | Contrato de queries |
| `src/lib/mapping/*.test.ts` | 4 ficheros | Proyecciones |
| `src/lib/architecture.test.ts` | — | **Dirección de dependencias** |
| `src/lib/domain/purity.test.ts` | — | **Pureza del dominio** |
| `src/components/features/**/*.test.ts` | 4 ficheros | Funciones de los componentes |

### El patrón de los tests de componentes

No hay `environment: "jsdom"` ni `@testing-library`. `vitest.config.mts` usa
`environment: "node"` e incluye solo `src/**/*.test.ts` (**nunca `.tsx`**).

Los tests como `src/components/features/adoption/AdoptionPetCard.test.ts` no
renderizan nada: **importan funciones puras que viven en el `.tsx`** y las
prueban. Es una decisión deliberada: la lógica comprobable se extrae a funciones
puras y el componente queda como capa de presentación.

### Cobertura de los adapters

`infra/directory/staticPets.test.ts` (76 líneas) verifica que el adapter cumple
el contrato del port: que devuelve `null` (no `undefined`) cuando no existe, y
que encuentra por ambos identificadores.

### Fixtures reales

Varios tests usan los JSON reales como fixtures. Está permitido explícitamente:
`architecture.test.ts:19` — *"Los tests quedan exentos: usan datos reales como
fixtures, que es legítimo."*

---

## 28. Variables de entorno

**Solo dos variables en todo el proyecto.**

| Variable | Ubicación | Para qué |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | `src/lib/publicProfileUrl.ts:18` | Base para la URL del QR y el canonical SEO |
| `NODE_ENV` | `src/lib/pwa/registerServiceWorker.ts:20` | Registrar el SW solo en producción |

```ts
export function resolvePublicProfileBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  return baseUrl ? baseUrl.replace(/\/+$/, "") : "";
}
```

**Si no está definida, devuelve `""`** y las URLs quedan relativas
(`/perfil/PC-LUCCA-001`). Funciona en desarrollo, pero para producción **debe**
definirse, o el QR payloads rutas relativas y el OG image no tendrá URL absoluta.

### Estado de los secretos

```
archivo .env / .env.local     → NO EXISTE
variables SUPABASE_*          → NINGUNA en el entorno
.gitignore                   → excluye .env*  ✅
paquete @supabase/*           → NO INSTALADO
```

**Superficie de credenciales: cero.** No hay ninguna clave en el repositorio, ni
en el código, ni en tests, ni en el historial reciente.

---

## 29. Cómo ejecutar el proyecto

```bash
# Desarrollo
npm run dev              # next dev

# Verificación (los cuatro, en este orden)
npm test                 # 709 tests
npm run typecheck        # tsc --noEmit
npm run lint             # eslint
npm run validate:data    # valida los 3 JSON + existencia de assets

# Producción
npm run build
npm run start            # next start
```

**Node y npm**: los managers de paquetes del repo no fijan versión (no hay
`.nvmrc` ni `engines`). El build usa Node 20+ por los tipos de `@types/node`.

### Smoke test histórico

`docs/fase-9-services-arquitectura.md:218-222` documenta la verificación de la
fase anterior sobre `next start`:

```
200: /, /perfil/lucca, /perfil/niko, /perfil/frey, /perfil/PC-LUCCA-001,
     /adopciones, /refugios/patitas-con-causa,
     /perfil/lucca/{salud,carnet,alerta,vacunas,documentos,adopcion},
     /perfil/mila/adopcion, /login, /manifest.webmanifest, /sw.js
404: /perfil/no-existe-xyz
```

Ese es el guion de regresión a repetir tras cualquier cambio de fuente de datos.

---

## 30. Deuda técnica documentada

El repositorio documenta su propia deuda en
`docs/fase-9-services-arquitectura.md:231-245` y `docs/fase-7-pwa-offline.md`.
No es un olvido; son decisiones registradas.

| # | Deuda | Estado |
|---|---|---|
| 1 | `app/providers.tsx` y el script anti-FOUC acceden a `localStorage` sin pasar por `StorageLike` | Diferida a propósito: el script debe ser JS plano |
| 2 | Nomenclatura "Demo" en `getAdoptionDemoPets` | Churn sin beneficio funcional |
| 3 | `listProfilePets` / `listAdoptionPets` se simplificarán cuando exista una fuente única con estado | **Se resolverá con la migración** |
| 4 | `domain/carnet.test.ts` depende de services como fuente de fixtures | Tests exentos por diseño |
| 5 | Telemetría de FASE 8 sin conectar a la UI | Pendiente de fase de instrumentación |
| 6 | `/refugios` (índice) devuelve 404 | No hay `app/refugios/page.tsx`. Preexistente |
| 7 | 26 avisos de datos (teléfono placeholder ×8, `notas` vacías ×5) | **Datos de prototipo, verificados por el validador** |
| 8 | `mostrarDocumentosPrivados` declarado pero nunca leído | Ver §14 |
| 9 | Documentos "privados" served desde `public/` | Ver §13 |
| 10 | Fotos `.svg` duplicadas junto a `.jpeg` en `public/pets/` | Assets de trabajo |

---

## 31. Lo que NO existe todavía

Verificado con grep sobre todo el repositorio.

### Backend

```
❌ Base de datos          ❌ PostgreSQL          ❌ Supabase
❌ @supabase/supabase-js  ❌ @supabase/ssr
❌ app/api/               ❌ route handlers       ❌ server actions
❌ fetch a un backend     ❌ ORM                 ❌ migraciones
```

### Identidad y autorización

```
❌ auth.users             ❌ profiles             ❌ roles
❌ sesiones / cookies     ❌ middleware.ts        ❌ ownership
❌ RLS                    ❌宠物 owner_id
```

`/login` existe pero es un placeholder de texto de 22 líneas.

### Archivos

```
❌ Supabase Storage       ❌ buckets              ❌ signed URLs
❌ subida de archivos     ❌ políticas de storage
```

Los documentos son archivos estáticos en `public/`.

### Producto pendiente

```
❌ Dashboard de tutor     ❌ Dashboard de refugio  ❌ Dashboard de veterinario
❌ Workflow de adopción   ❌ Transferencia de propiedad
❌ Notificaciones         ❌ Pagos / donaciones    ╳ Sighting reports
❌ Analytics backend      ╳ Marketplace
```

### Rutas que no existen

```
❌ /refugios  (índice)    → 404, solo existe /refugios/[id]
```

---

## 32. Glosario de referencias

### Ficheros de contrato

| Ruta | Contenido |
|---|---|
| `src/types/pet.ts` | `PetProfile`, `PetVaccine`, `PetDocument`, `PetEmergency`, enums |
| `src/types/shelter.ts` | `Shelter`, `ShelterContact` |
| `src/types/health.ts` | `HealthDeworming`, `HealthConsultation`, `HealthDocumentRef`, `HealthExportSummary` |
| `src/types/adoption.ts` | `AdoptionRequest`, `AdoptionCatalogEntry` |
| `src/types/emergency.ts` | `LostAlert` |
| `src/types/carnet.ts` | `PhysicalPetCard` |

### Capa de dominio (pura)

| Ruta | Responsabilidad |
|---|---|
| `src/lib/domain/petStatus.ts` | Estados y estado efectivo |
| `src/lib/domain/emergency.ts` | Fusión de alertas, parseo |
| `src/lib/domain/health.ts` | Salud, completitud, resumen exportable |
| `src/lib/domain/vaccine.ts` | Vacunas, filtros, alertas |
| `src/lib/domain/adoption.ts` | Disponibilidad y validación de adopción |
| `src/lib/domain/shelter.ts` | Búsqueda de refugios |
| `src/lib/domain/carnet.ts` | Construcción del carnet |
| `src/lib/domain/dateRules.ts` | Fechas ISO |
| `src/lib/domain/directory/types.ts` | **Ports** |

### Servicios, infra y mapping

| Ruta | Responsabilidad |
|---|---|
| `src/lib/services/pets/queries.ts` | API de mascotas · **punto de intercambio** |
| `src/lib/services/shelters/queries.ts` | API de refugios |
| `src/lib/infra/directory/staticPets.ts` | Adapter de mascotas |
| `src/lib/infra/directory/staticShelters.ts` | Adapter de refugios |
| `src/lib/infra/telemetry/noop-client.ts` | Telemetría no-op |
| `src/lib/mapping/profile.ts` | `toProfileViewModel` |
| `src/lib/mapping/health.ts` | Proyecciones de salud |
| `src/lib/mapping/adoptionPresentation.ts` | Tarjetas de adopción |
| `src/lib/mapping/petStatusPresentation.ts` | Etiquetas de estado |
| `src/lib/mapping/carnet.ts` | Datos de impresión |

### Persistencia local

| Ruta | Responsabilidad |
|---|---|
| `src/lib/pwa/storage.ts` | Acceso tolerante a `localStorage` |
| `src/lib/lostAlertStorage.ts` | Alertas de pérdida con fallback en memoria |
| `src/lib/adoptionRequestStorage.ts` | Solicitudes de adopción |
| `src/lib/useLostAlerts.ts` | Hook de alertas (`useSyncExternalStore`) |
| `src/lib/useAdoptionRequests.ts` | Hook de solicitudes |

### Validación e infraestructura

| Ruta | Responsabilidad |
|---|---|
| `src/lib/dataValidation.ts` | Validación de perfiles (472 líneas) |
| `src/lib/shelterValidation.ts` | Validación de refugios |
| `src/lib/petDocuments.ts` | Filtro de documentos públicos |
| `src/lib/publicProfileUrl.ts` | URL canónica y base del QR |
| `src/lib/seo.ts` | Metadata y Open Graph |
| `scripts/validate-data.mts` | Validador + comprobación de assets |
| `public/sw.js` | Service worker (285 líneas) |
| `src/app/manifest.ts` | Web App Manifest |

### Guardianes arquitectónicos

| Ruta | Qué garantiza |
|---|---|
| `src/lib/architecture.test.ts` | `domain ← services ← infra ← app`, y que solo `infra` importa `@/data` |
| `src/lib/domain/purity.test.ts` | El dominio no importa React, Next, **Supabase**, ni API de navegador |

### Documentación

| Ruta | Contenido |
|---|---|
| `README.md` | Setup y tabla de skills |
| `PRODUCT.md` | Definición de producto y principios |
| `CHANGELOG.md` | Historial detallado (96 KB) |
| `PawPass_Roadmap_Maestro.md` | Roadmap de fases (2.647 líneas, **sin trackear en git**) |
| `docs/fase-7-pwa-offline.md` | PWA, offline, service worker |
| `docs/fase-9-services-arquitectura.md` | Arquitectura de Services (241 líneas) |
| `docs/telemetry/TELEMETRY.md` | Telemetría privacy-safe |

---

## Resumen ejecutivo

PawPass es un prototipo avanzado y bien的结构urado que ha ejecutado nueve
fases de calidad de producto sobre una base de datos estática. Lo que hace
notable este repositorio no es lo que tiene, sino lo que **ya preparó**:

1. **La arquitectura de Ports & Adapters está completa y verificada por tests.**
   Cambiar la fuente de datos es cambiar **una línea** en `services/pets/queries.ts:20`.

2. **Las reglas arquitectónicas ya prohíben `@supabase` en las capas
   equivocadas.** `architecture.test.ts:24` y `purity.test.ts:19` lo tienen en su
   lista. La disciplina no depende de la buena voluntad: está automatizada.

3. **El contrato del identificador público está definido y validado** con patrón
   y unicidad. El QR y el SEO dependen solo de `codigoPublico`.

4. **El service worker ignora todo el tráfico externo**, así que ninguna capa de
   persistencia puede filtrar tokens a Cache Storage.

5. **La mayor parte del dominio ya es derivación, no almacenamiento.** El carnet,
   el resumen de salud y el catálogo de adopción se construyen con funciones
   `build*`. `PhysicalPetCard` lo declara explícitamente: *"El carnet NO es una
   segunda fuente de verdad."*

Los puntos que cualquier trabajo futuro deberá tratar con cuidado están
identificados y documentados en este archivo: la banderera muerta
`mostrarDocumentosPrivados` (§14), los documentos privados servidos desde
`public/` (§13), el acoplamiento de `localStorage` al slug del `petId` (§22), y
la relación refugio↔mascota resuelta con `.includes()` sobre un array (§15).

---

*Documento generado mediante auditoría directa del código del repositorio. No
contiene diseños de base de datos, SQL, migraciones ni propuestas de schema: solo
describe el estado real del proyecto y cómo funciona hoy.*
