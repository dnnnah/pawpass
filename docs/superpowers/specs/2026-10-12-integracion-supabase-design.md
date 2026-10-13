# Spec de diseño — Integración de Supabase en PetCarnet

- **Fecha:** 2026-10-12
- **Fase del roadmap:** FASE 10 (Backend + Base de Datos) y FASE 11 (Autenticación, roles y seguridad)
- **Rama base auditada:** `feat/services-architecture-core` (`eea5036`)
- **Documentos de referencia:** `PAWPASS-ESTRUCTURA-BASE-DE-DATOS.md`, `PetCarnet_Roadmap_Maestro.md`, `docs/fase-9-services-arquitectura.md`
- **Estado:** borrador para revisión (no implementado)

> Este spec **resuelve** las decisiones #3–#9 del informe de auditoría y fija el contrato
> de la ficha pública del QR, incluida la petición de mostrar fotos recientes. No describe
> implementación paso a paso: esa es la salida del plan de implementación posterior.

---

## 1. Contexto y objetivo

PetCarnet es hoy un prototipo estático (JSON en `src/data/`, escrituras en `localStorage`),
sin Supabase, sin Auth y sin base de datos (`package.json` sin `@supabase/*`). La capa de
Services y sus puertos ya existen y permiten cambiar la fuente de datos sin rehacer la UI
(`docs/fase-9-services-arquitectura.md:30-34`).

**Objetivo:** conectar la aplicación a la base de datos Supabase ya diseñada
(`PAWPASS-ESTRUCTURA-BASE-DE-DATOS.md`), manteniendo intactos los contratos por encima de
los puertos, e introduciendo una ficha pública mínima accesible por QR sin iniciar sesión.

**Resultado esperado:**
- La lectura de perfiles, catálogo de adopción y refugios proviene de Supabase.
- Los usuarios se autentican con Supabase Auth (Google, Apple, correo/contraseña).
- El QR muestra una ficha pública mínima a cualquiera, sin cuenta.
- Las escrituras (alerta de pérdida, solicitud de adopción) pasan de `localStorage` a RPC.

**No es objetivo:** rediseñar la UI, migrar datos históricos, ni cambiar el esquema salvo lo
estrictamente indicado en la sección 11.

---

## 2. Decisiones bloqueadas

| # | Tema | Decisión |
| --- | --- | --- |
| D1 | Proveedor de identidad | **Supabase Auth** |
| D2 | Métodos de acceso | OAuth **Google** + OAuth **Apple** + **correo/contraseña** |
| D3 | Sesión requerida | **Sí** para la app; **no** para la ficha del QR |
| D4 | Ficha pública del QR | Foto, nombre, especie, raza, código, estado, datos de extravío, contacto solo en modo perdido, **fotos recientes** |
| D5 | #3 Notas de adopción | Eliminar `notas`; mapear `motivo`; `private.adoption_notes` fuera de alcance |
| D6 | #4 `fotoPerfilUrl` | Derivado por convención (sin columna nueva) |
| D7 | #5 Enums | Normalización en el adapter/mapper (sin tocar esquema) |
| D8 | #6 Modelo "perdido" | Un solo origen: `pets.estado` + `pet_lost_alerts`; `emergencia` derivada |
| D9 | #7 `logoUrl` refugio | Diferido en v1 |
| D10 | #8 Campos obligatorios | Relajar el contrato a opcional/nullable |
| D11 | #9 `configuracionPublica` | Ampliar al conjunto completo de la BD; `visible_publico` por documento |

---

## 3. Alcance y fuera de alcance

**En alcance**
- Cliente Supabase server/browser y variables de entorno.
- Puertos y Services asíncronos; adapters Supabase para lectura.
- Autenticación con Google, Apple y correo/contraseña; alta de `profiles`.
- Ficha pública del QR sin sesión.
- Mappers DB↔dominio y sus pruebas.
- Escrituras de alerta de pérdida y solicitud de adopción vía RPC.

**Fuera de alcance (v1)**
- Dashboard de administración de refugios, invitaciones de tutores, gestión de documentos y
  notificaciones (el código actual no las tiene).
- Logo de refugio (D9).
- Subida de archivos nuevos a Storage más allá de resolver URLs (se resolverá en el plan).
- Migración de datos históricos de `localStorage` a la BD.

---

## 4. Arquitectura objetivo

La dirección de capas se conserva (FASE 9). El cambio es que la implementación de los puertos
pasa a Supabase y los puertos dejan de ser síncronos.

```
UI (app/, components/)
  ↓
Services (src/lib/services/**)          → ahora async (Promise)
  ↓
Ports (src/lib/domain/**/types.ts)      → contratos async
  ↓
Adapters (src/lib/infra/**)             → aquí vive @supabase/supabase-js
  ↓
Supabase (Postgres + Auth + Storage)
```

**Puertos.** Cambian a `Promise`:

```ts
// src/lib/domain/directory/types.ts (contrato objetivo)
export interface PetDirectory {
  listProfilePets(): Promise<PetProfile[]>;
  listAdoptionPets(): Promise<PetProfile[]>;
  findProfilePet(identifier: string): Promise<PetProfile | null>;
  findAdoptionPet(identifier: string): Promise<PetProfile | null>;
}
export interface ShelterDirectory {
  listShelters(): Promise<Shelter[]>;
}
```

**Services.** `src/lib/services/pets/queries.ts` y `src/lib/services/shelters/queries.ts`
pasan a `async`. El punto de cambio sigue siendo una sola línea
(`const directory: PetDirectory = ...`), seleccionable por entorno: `staticPetDirectory`
(demo/pruebas) o `supabasePetDirectory` (real).

**Adapters.** Nuevos módulos en `src/lib/infra/directory/` (`supabasePets.ts`,
`supabaseShelters.ts`) que implementan los puertos. El adapter estático se mantiene para
pruebas y modo demo.

**Guardas arquitectónicas.** `src/lib/architecture.test.ts` y
`src/lib/domain/purity.test.ts` prohíben hoy `@supabase` en todas las capas. Deben
actualizarse para permitir `@supabase/supabase-js` en `src/lib/infra/**` y `@supabase/ssr`
en `src/lib/infra/**` y `src/app/**`, manteniendo la prohibición en `domain/**` y
`services/**`.

---

## 5. Autenticación (D1–D3)

- **Proveedores:** Google OAuth, Apple OAuth y correo/contraseña.
- **Clientes:** `@supabase/ssr` con cliente de servidor (cookies) y cliente de navegador.
  Nunca se usa `service_role` en el cliente.
- **Sesión:** las rutas de la app requieren sesión; la ficha pública del QR no.
- **Alta de `profiles`:** no hay trigger automático (`PAWPASS…md:1084`); el perfil se crea
  desde el frontend tras el registro, respetando `profiles_insert_own`
  (`PAWPASS…md:1027`).
- **Apple:** requiere cuenta de Apple Developer (Service ID, Team ID, Key ID, `.p8`).
  **Google:** OAuth Client en Google Cloud con redirección a
  `https://<ref>.supabase.co/auth/v1/callback`.
- **Autorización:** toda la autoridad de acceso recae en RLS y en las RPC
  (`auth.uid()`); el frontend no es la frontera de seguridad.

---

## 6. Ficha pública del QR (D4)

Acceso **sin sesión**, solo lectura, servido por el backend. El frontend nunca recibe datos
fuera de este contrato.

**Contrato objetivo:**

```ts
export type PublicPetCard = {
  publicCode: string;      // pets.codigo_publico
  photoUrl: string | null; // foto derivada (ver D6)
  name: string;            // pets.nombre
  species: PetSpecies;     // normalizado
  breed: string | null;    // pets.raza
  status: PetStatus;       // pets.estado
  lost?: {
    zona: string | null;
    fechaPerdida: string | null;
    mensaje: string | null;
    instrucciones: string[];
  };
  contact?: {
    name: string | null;
    phone: string | null;
    whatsapp: string | null;
  };
  recentPhotos: { url: string }[]; // hasta N documentos categoria 'foto'
};
```

**Reglas de exposición:**
1. La ficha solo se sirve si `pet_privacy.publicado = true`.
2. `contact` se incluye **únicamente** cuando `status = "perdido"` y el tutor activó
   `mostrar_telefono` y/o `mostrar_whatsapp`. `name` solo si `mostrar_nombre_contacto`.
3. `lost` se incluye solo cuando existe alerta vigente; `zona` respeta `mostrar_zona` y el
   mensaje/instrucciones cuando `mostrar_emergencia`.
4. `recentPhotos` incluye únicamente `pet_documents` con `visible_publico = true` y
   `categoria = 'foto'` (`PAWPASS…md:628,636`), limitado a un máximo (propuesto: 6),
   ordenado por `created_at` descendente.
5. **Excluidos siempre:** salud, veterinario, email, dirección, microchip, rasgos, peso,
   fecha de nacimiento, vacunas, expediente, documentos no-foto, carnet y adopción.

**Implementación de lectura anónima (requiere trabajo de BD).** El preview existente
(`obtener_preview_perfil`) exige tutor autenticado (`PAWPASS…md:111`), así que **no sirve**
para anónimos. Se necesita una función `SECURITY DEFINER` acotada (p. ej.
`obtener_ficha_publica(p_codigo text)`), con `GRANT EXECUTE ... TO anon`, que devuelva
exactamente `PublicPetCard` respetando las reglas anteriores. Esto se corresponde con la
decisión pendiente **Q19** (`PAWPASS…md:113,115`) y se detalla en la sección 11.

**Ruta.** Se propone una ruta propia y ligera `/p/[codigo]` para la ficha pública, separada
de `/perfil/[id]` (que queda detrás de sesión). El payload del QR sigue siendo la URL pública
derivada del código (`src/lib/publicProfileUrl.ts`).

---

## 7. Contratos y mapeo DB↔dominio (D5–D11)

### D5 — Adopción (#3)
- Se elimina `AdoptionRequest.notas` (`src/types/adoption.ts:27`).
- El texto del solicitante se mapea a `adoption_requests.motivo` (obligatorio, 1..3000,
  `PAWPASS…md:905,915`).
- `applicant_id` se toma de la sesión (`auth.uid()`), no del formulario.
- `private.adoption_notes` queda fuera de alcance (sin flujo de usuario,
  `PAWPASS…md:171`).
- Mapeos: `fechaEnviada` → `created_at`; `shelterId` no existe en la tabla (se deriva de
  `pet_shelters` cuando se necesite).

### D6 — `fotoPerfilUrl` (#4)
- Sin columna nueva. El adapter **deriva** la foto de perfil: primer `pet_documents` con
  `bucket_id = 'pawpass-fotos'`, `categoria = 'foto'`, `tipo = 'imagen'`
  (`PAWPASS…md:634,639`), ordenado por `created_at` ascendente.
- Si en el futuro se requiere una foto principal inequívoca, se añadirá la columna
  `es_foto_perfil boolean` (mini-migración; no en v1).
- `logoUrl` de refugio (D9) queda diferido por no existir columna (`PAWPASS…md:797-816`).

### D7 — Normalización de enums (#5)
Normalización en el mapper, sin tocar esquema:

| Campo | Dominio (código) | BD | Dirección |
| --- | --- | --- | --- |
| `especie` | `Perro`\|`Gato` | `perro`\|`gato` (`:359`) | letra inicial a minúscula al escribir; mayúscula al leer |
| `genero` | `Macho`\|`Hembra` | `macho`\|`hembra` (`:361`) | idem |
| `talla` | `Pequeño`\|`Mediano`\|`Grande`\|`Miniatura` | `pequeno`\|`mediano`\|`grande`\|`miniatura` (`:372`) | mapa explícito; ojo: `pequeno` sin `ñ` |
| `estado` | ya en minúsculas | mismo CHECK (`:360`) | sin cambio |

El mapper debe fallar (o degradar con aviso) ante valores fuera del enum de la BD.

### D8 — Modelo de "perdido" (#6)
- Única fuente de verdad: `pets.estado` + `public.pet_lost_alerts`.
- Se elimina `emergencia.perdido` como dato almacenado (`src/types/pet.ts:32`).
  `PetEmergency` pasa a ser una **vista derivada** de `estado` + alerta vigente.
- El doble origen actual (`emergencia.perdido` + alerta en `localStorage`) se colapsa al
  migrar las escrituras a RPC.
- `pet_lost_alerts.fecha_perdida` y `zona` son NOT NULL (`PAWPASS…md:526-527`): el flujo de
  activación debe exigirlos antes de enviar.

### D10 — Campos obligatorios vs nullable (#8)
Se relajan a opcional/nullable en el contrato los campos que la BD admite como nulos:
`raza`, `pesoKg`, `fechaNacimiento`, `color`, `genero`, `talla`
(`src/types/pet.ts:47-51`, `PAWPASS…md:339-348`) y todos los campos de `pet_veterinarians`
(`PAWPASS…md:588-592`). La UI muestra "no especificado". Sin cambios de esquema.

### D11 — `configuracionPublica` (#9)
Se amplía el contrato al conjunto completo de la BD (`PAWPASS…md:492-505`):

```
publicado, listar_catalogo, mostrar_nombre_contacto, mostrar_telefono,
mostrar_whatsapp, mostrar_telefono_secundario, mostrar_email, mostrar_zona,
mostrar_salud, mostrar_veterinario, mostrar_direccion_vet, mostrar_emergencia,
mostrar_microchip
```

`mostrarDocumentosPrivados` se elimina y se sustituye por el `visible_publico` por registro
de cada `pet_documents` (`PAWPASS…md:628`).

---

## 8. Privacidad y Storage

- La separación público/privado se resuelve en el **mapper + backend**, nunca en el cliente.
- Los bytes viven en Storage (buckets privados `pawpass-documentos` y `pawpass-fotos`); la
  tabla solo guarda metadatos (`PAWPASS…md:613,634`). El adapter resuelve **signed URLs** de
  caducidad corta en el servidor; el preview de BD entrega bucket/path, no URLs
  (`PAWPASS…md:218`).
- Se elimina la dependencia de rutas estáticas (`/pets/...`, `/docs/...`) del JSON.
- La ficha pública respeta las reglas de la sección 6 antes de resolver cualquier URL.

---

## 9. Pruebas

- **Mappers (nuevo, unitario):** normalización de enums (ida y vuelta), `""`↔`null`,
  derivación de `estatus` de vacuna, derivación de `fotoPerfilUrl`, reglas de
  `PublicPetCard` (contacto solo en perdido, fotos solo `visible_publico`).
- **Contrato de puertos:** tests con un adapter Supabase falso (mock) que verifiquen
  `Promise`, resolución por `uuid`/`slug`/`codigoPublico` y `null` para inexistente.
- **Pruebas existentes:** se actualizan por el cambio a async (`services/pets/queries.test.ts`,
  `adoptionMockData.test.ts`, `staticPets.test.ts`) y por la relajación de tipos.
- **Guardas:** `architecture.test.ts`/`purity.test.ts` actualizadas para permitir `@supabase`
  solo en infra/app.
- **Integración/RLS:** pruebas contra una instancia de desarrollo quedan **NO VERIFICADAS**
  hasta disponer de acceso; se marcan explícitamente como pendientes.
- Comandos de cierre: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`.

---

## 10. Postura de esquema / migraciones

La mayoría de las decisiones son de **código** (mappers, contratos, adapters). El único
cambio de base de datos inevitable es la **lectura pública anónima** (sección 6): una función
`SECURITY DEFINER` + `GRANT EXECUTE TO anon`, que corresponde a **Q19** y requiere aprobación
explícita. Nada más requiere migración en v1 (D6 y D9 evitan columnas nuevas).

---

## 11. Riesgos y bloqueos

| Riesgo | Impacto | Mitigación |
| --- | --- | --- |
| Q19 sin aprobar (sin RPC anónima) | El QR no puede leer de la BD | Aprobar la función acotada antes de implementar la ficha pública |
| Cambio a async en puertos/services | Toca todas las rutas y tests | Hacerlo como primer paso, aislado y con las pruebas en verde |
| Campos NOT NULL de alerta (`fecha`, `zona`) | Escritura fallida de "perdido" | Validar en el flujo antes de enviar (`PAWPASS…md:526-527`) |
| Credenciales Apple Developer | Bloquea el login con Apple | Gestionar cuenta/Service ID antes de probar OAuth |
| Estado real de la BD no verificado | Diferencias con el documento | Confirmar catálogo/RLS/funciones en vivo antes de integrar |

---

## 12. Decisiones abiertas

1. **Aprobación de Q19**: crear la función anónima `obtener_ficha_publica` con `GRANT` a
   `anon`. Es el único cambio de BD propuesto.
2. **Límite de fotos recientes** en la ficha pública (propuesto: 6).
3. **Ruta pública**: confirmar `/p/[codigo]` como ruta de la ficha.
4. **Alcance de subida de documentos/fotos** a Storage en v1 (solo lectura de URLs vs carga).

---

## 13. Handoff

Aprobado este spec, el siguiente paso es invocar el skill de **writing-plans** para producir
el plan de implementación (ordenado, verificable, con pasos pequeños). El orden previsto del
plan es: (1) async en puertos/services + guardas; (2) cliente Supabase y entorno; (3) mappers
y sus pruebas; (4) adapters Supabase de lectura + swap; (5) Auth; (6) ficha pública + RPC
anónima (Q19); (7) escrituras por RPC; (8) Storage/signed URLs.
