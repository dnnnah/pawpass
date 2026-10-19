# PawPass

Pasaporte digital publico para mascotas con QR de emergencia.

## Que es

PawPass es el registro de identidad y cuidados de una mascota, mas los dos
momentos que un registro en papel no puede cubrir: recuperarla si se pierde y
encontrarle un hogar.

Cada mascota tiene un perfil publico con sus datos, sus vacunas, su historial
medico, sus documentos y a quien llamar en una emergencia. Ese perfil lleva un
QR en su carnet, de modo que cualquiera que encuentre al animal escanea con el
movil y ve a quien llamar, sin instalar nada. El contenido esta disenado para
leerse tambien fuera de pantalla: el expediente y el carnet son un documento
imprimible que se entrega en mano, no una vista mas de la app.

El estado de la mascota (`en_casa`, `perdido`, `en_adopcion`, `adoptado`,
`rescatado`, `fallecido`) gobierna lo que se ve en su perfil, y es lo que
convierte un registro pasivo en los dos flujos que lo justifican: la alerta de
perdida y la adopcion.

## Para quien

- **Dueña o dueño**: consulta vacunas y expediente, y genera la alerta si la
  mascota se pierde.
- **Quien la encuentre**: escanea el QR y contacta sin intermediarios.
- **Refugios y personas adoptables**: publican y consultan animales en
  adopcion.

## Caracteristicas

- **Ficha pública mínima** por mascota: identidad, estado y contacto de rescate
- **QR por mascota** que lleva a `/p/<codigo>` sin pedir una cuenta
- **Alerta de perdida** con imagen descargable para compartir, y ficha para
  reportar a una mascota encontrada
- **Estado de mascota** que cambia lo que el perfil ofrece: perdida, adopcion
  o cerrada
- **Carnet fisico y digital** con el QR impreso
- **Expediente imprimible** de vacunas, medico y documentos
- **Cuenta de tutor** con sesión por correo y mascotas asociadas
- **Adopciones y refugios** con solicitud de adopcion
- **Galeria de fotos** tipo stories con lightbox
- **Tema claro y oscuro**, **PWA** con service worker y soporte offline
- **Renderizado híbrido**: SSG para la demo y rutas dinámicas para QR y cuenta
- **Diseno responsive** para movil, tablet y escritorio
- **Supabase opcional** para Auth, Postgres y el contrato anónimo del QR; el
  adaptador estático permite explorar el proyecto sin credenciales

## Stack tecnico

- **Framework:** Next.js 16 (App Router, SSG/SSR)
- **UI:** React 19, TypeScript, Tailwind CSS v4, framer-motion
- **Datos y Auth:** Supabase (`@supabase/ssr`, Postgres, RLS)
- **Iconografia:** Lucide React
- **QR:** qrcode.react
- **Imagen de la alerta:** html-to-image
- **Tests:** Vitest

## Estructura del proyecto

```
src/
├── app/
│   ├── page.tsx                    # Landing
│   ├── adopciones/                 # Animales en adopcion
│   ├── refugios/[id]/              # Ficha de refugio
│   ├── login/                      # Acceso y registro por correo
│   ├── auth/callback/              # Intercambio de sesión de Supabase
│   ├── cuenta/                     # Mascotas asociadas a la cuenta autenticada
│   ├── p/[codigo]/                 # Ficha pública que abre el QR
│   └── perfil/[id]/
│       ├── page.tsx                # Perfil de la mascota
│       ├── salud/                  # Historial medico
│       ├── vacunas/                # Cartilla de vacunacion
│       ├── documentos/             # Documentos publicos
│       ├── carnet/                 # Carnet fisico y digital
│       ├── alerta/                 # Generador de alerta
│       └── adopcion/               # Solicitud de adopcion
├── components/
│   ├── layout/                     # AppShell, SiteNav, ThemeToggle
│   ├── features/                   # pet-profile, pet-status, lost-pet,
│   │                               # documents, carnet, adoption, home
│   ├── pwa/                        # Registro del service worker
│   └── ui/                         # Badge, Button, DataList, Surface...
├── data/                           # mascotas.json, adopciones, refugios
├── lib/
│   ├── domain/                     # Reglas puras: estado, vacunas, salud,
│   │                               # carnet, adopcion, refugio
│   ├── infra/                      # Supabase y adapters estáticos
│   ├── mapping/  services/  ui/  pwa/
│   └── *.test.ts                   # Tests junto al modulo
└── types/                          # Interfaces TypeScript

.agents/skills/                     # Skills de agentes de este repo (ver abajo)
```

## Instalacion

```bash
git clone https://github.com/dnnnah/pawpass.git
cd pawpass
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

### Supabase

El proyecto funciona con los datos estáticos si no configuras Supabase. Para
activar Auth y la ficha QR conectada a Postgres, copia `.env.example` a
`.env.local` y añade la URL y una clave pública del proyecto:

```bash
cp .env.example .env.local
```

Usa `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` en proyectos nuevos o la clave
`NEXT_PUBLIC_SUPABASE_ANON_KEY` en proyectos existentes. Nunca pongas una
`service_role` en variables `NEXT_PUBLIC_*`.

El esquema incluye la función `public.obtener_ficha_publica(text)`, que solo
devuelve los campos consentidos para el QR. La ruta `/cuenta` protege la vista
de mascotas asociadas con la sesión de Supabase. La semilla reproducible desde los
JSON de demo se genera con:

```bash
node scripts/seed-from-json.mts
```

## Comandos

| Comando | Descripcion |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Generacion estatica |
| `npm run start` | Servidor en produccion |
| `npm run lint` | Verificacion de codigo |
| `npm run typecheck` | Verificacion de tipos |
| `npm test` | Tests (Vitest) |
| `npm run validate:data` | Valida los datos de `src/data/` |

## Skills de agentes

Las skills son guias que un agente de codigo (Claude Code, Codex, opencode...)
lee cuando toca esta interfaz. Hay dos alcances y conviene no confundirlos:

| Alcance | Donde | Lock | Cuando usarla |
|---------|-------|------|---------------|
| **Del proyecto** | `.agents/skills/` | `skills-lock.json` | Guias que dependen de este repo: viaje con el clone |
| **Global** | `~/.agents/skills/` | `~/.agents/.skill-lock.json` | Guias que sirven en cualquier repo: se instalan una vez por maquina |

### Skills del proyecto

Cuatro guias, todas de stack. Un clone las trae, asi que no hay que instalar
nada para trabajar el frontend.

| Skill | Para que |
|--------|-----------|
| `nextjs-app-router-patterns` | App Router: Server Components, streaming, data fetching, cache |
| `vercel-react-best-practices` | Reglas de rendimiento de React y Next.js, con `rules/` por patron |
| `tailwind-design-system` | Tokens y librerias de componentes con Tailwind v4 |
| `web-design-guidelines` | Revision de codigo UI contra las guias de interfaz web (accesibilidad, foco, teclado) |

Su origen y su hash estan fijados en `skills-lock.json`, asi que todos trabajan
con la misma version.

### Skills globales

Las que hay en la maquina y sirven en todos los repos. **No estan en el arbol**:
un clone de PawPass no las trae, y eso es a proposito, para no versionar 2 MB
de datos vendorizados en cada repo. Si necesitas una de esta tabla, instalala
una vez.

| Skill | Origen | Para que |
|-------|--------|----------|
| `impeccable` | pbakaus/impeccable | Toolkit de diseno: critique, audit, polish, typeset, colorize |
| `typescript-pro` | jeffallan/claude-skills | Tipos avanzados, type guards, branded types, tRPC |
| `brainstorming` | obra/superpowers | Explorar intencion y requisitos antes de implementar |
| `systematic-debugging` | obra/superpowers | Causa raiz antes de proponer un arreglo |
| `test-driven-development` | obra/superpowers | El test primero, y verlo fallar |
| `spec-driven-development` | addyosmani/agent-skills | Escribir la especificacion antes del codigo |
| `git-commit` | github/awesome-copilot | Commits con conventional commit, staging y mensaje derivados del diff |
| `find-skills` | vercel-labs/skills | Descubrir e instalar skills del ecosistema |

### Que movimos y que quitamos

Cinco skills que estaban en `.agents/skills/` ya no estan ahi, y conviene
saber por que para no volver a subirlas:

- `impeccable` y `typescript-pro` **se movieron a global** (`~/.agents/skills/`).
  No tienen nada de especifico de PawPass: sirven igual en cualquier repo, y
  global se actualiza una vez y llega a todos. De paso el repo deja de cargar
  los ~2.2 MB de `impeccable` (launcher, 40 playbooks en `reference/` y sus
  datos vendorizados) y el lock local deja de ser una copia que se pudre.
- `design-taste-frontend` y `frontend-design` **se quitaron**: su trabajo
  (direccion estetica, tipografia, evitar que algo parezca plantilla) ya lo
  cubren los playbooks de `impeccable`. No se instalaron en global porque no
  hacen falta con el.
- `tailwind-css-patterns` **se quito**: `tailwind-design-system` cubre lo mismo
  y esta al dia con Tailwind v4, que es la version que usa este proyecto.

### Usar `impeccable`

Es la skill que hizo el critique y el polish del perfil, asi que es la que mas
se usa de todo el set. Ojo con la distincion entre el launcher y los flujos:

**el launcher solo expone unos pocos comandos** de terminal:

```bash
S="$HOME/.agents/skills/impeccable/scripts/impeccable"

$S context              # vuelca el contexto del producto (PRODUCT.md); una vez por sesion
$S detect src           # escanea anti-patrones de UI y problemas de calidad
$S ignores              # reglas y archivos de excepcion del detector
$S help                 # lista los comandos disponibles
```

`critique`, `audit`, `polish`, `typeset`, `colorize` o `live` **no son comandos
de terminal** (`impeccable critique` responde `Unknown command`): son flujos
que el agente ejecuta leyendo su playbook en
`~/.agents/skills/impeccable/reference/`.

| Flujo | Lee (en `reference/`) | Para que |
|-------|-----|----------|
| `critique` | `reference/critique.md` | Review UX con scoring heuristico |
| `audit` | `reference/audit.md` | Calidad tecnica: a11y, perf, responsive |
| `polish` | `reference/polish.md` | Pasada final de calidad antes de entregar |
| `typeset` | `reference/typeset.md` | Jerarquia y tipografia |
| `layout` | `reference/layout.md` | Espaciado, ritmo y jerarquia visual |
| `colorize` | `reference/colorize.md` | Color con intencion en UI monocroma |
| `harden` | `reference/harden.md` | Errores, i18n y casos limite |
| `adapt` | `reference/adapt.md` | Dispositivos y anchos |
| `live` | `reference/live.md` | Iterar sobre el navegador |

Dos flujos escriben archivos de contexto: `init` genera `PRODUCT.md` y
`document` genera `DESIGN.md` a partir del codigo existente. El resto
(`shape`, `extract`, `optimize`, `animate`, `clarify`, `delight`, `distill`,
`bolder`, `quieter`, `overdrive`) estan ahi con el mismo nombre.

Tres detalles que se convierten en error con facilidad:

- `detect` sale con codigo distinto de cero cuando encuentra algo, asi que no
  lo trates como fallo en un script.
- `detect` marca cualquier `border-l-2` como `side-tab`, aviso que en esta
  interfaz es un falso positivo deliberado: el filete lateral del estado de
  emergencia es codificacion de estado.
- `check` y `update` fallan con un 404 al verificar el bundle (issue #479 de
  impeccable), asi que no son la via para actualizar la skill.

### Anadir o actualizar una skill

Depende del alcance:

1. **Del proyecto** (guia de este repo): copia la skill a
   `.agents/skills/<nombre>/`, con su `SKILL.md` y lo que necesite
   (`references/`, `rules/`, `scripts/`); anade la entrada en
   `skills-lock.json` con `source`, `sourceType`, `skillPath` y
   `computedHash`; y actualiza la tabla de arriba.
2. **Global** (guia que sirve en cualquier repo): instalala en
   `~/.agents/skills/`. El instalador actualiza `~/.agents/.skill-lock.json`.
   No la copies aqui.

## Mascotas de ejemplo

El proyecto incluye 11 mascotas de ejemplo: Lucca, Niko, Alix, Loki, Viserys,
Frey, Sandor, Bizcocho, Chicharrona, Freya y Arya.

## Licencia

MIT
