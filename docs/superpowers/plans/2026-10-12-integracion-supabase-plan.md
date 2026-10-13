# Plan de implementación — Integración de Supabase en PetCarnet

- **Fecha:** 2026-10-12
- **Spec base:** `docs/superpowers/specs/2026-10-12-integracion-supabase-design.md`
- **Estado:** borrador para revisión (no implementado)
- **Nota:** el skill `writing-plans` no está instalado; este plan sigue su espíritu de pasos
  pequeños, ordenados y verificables.

## Prerrequisitos (bloqueantes externos)

| # | Prerrequisito | Bloquea |
| --- | --- | --- |
| P1 | Aprobación de **Q19**: función `obtener_ficha_publica(p_codigo text)` con `GRANT EXECUTE TO anon` | T8 (ficha pública) |
| P2 | Cuenta Apple Developer (Service ID, Team ID, Key ID, `.p8`) y OAuth Client de Google | T7 (Auth social) |
| P3 | Proyecto Supabase y variables de entorno (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) | T3 en adelante |
| P4 | Confirmar catálogo/RLS/funciones en vivo (hoy NO VERIFICADO) | T5, T9, T10 |

## Convenciones del plan

- Cada tarea termina con: `npm run typecheck && npm run lint && npm test && npm run build`.
- Se mantiene el adapter estático para demo y pruebas; el swap es por entorno.
- Cambios de contrato compartido primero, integración después.
- TDD en mappers y comportamientos de contrato siempre que sea posible.

---

## T1 — Habilitar `@supabase` en las guardas arquitectónicas

**Objetivo:** permitir el cliente Supabase solo donde corresponde, sin romper la pureza del
dominio ni de services.

**Dependencias:** ninguna.

**Archivos:** `src/lib/architecture.test.ts`, `src/lib/domain/purity.test.ts`, `PETCARNET-PROYECTO.md`
(sección de reglas, opcional).

**Pasos:**
1. Ajustar `architecture.test.ts` para permitir `@supabase/supabase-js` en `src/lib/infra/**`
   y `@supabase/ssr` en `src/lib/infra/**` y `src/app/**`.
2. Mantener la prohibición de `@supabase` en `src/lib/domain/**` y `src/lib/services/**`.
3. Añadir un caso de prueba que confirme que un import de `@supabase` en `domain`/`services`
   sigue fallando.

**Criterio de aceptación:** las guardas pasan y siguen rechazando `@supabase` en
`domain` y `services`.

---

## T2 — Puertos y Services asíncronos

**Objetivo:** convertir la capa de acceso a datos a `Promise` sin cambiar la UI de fondo.

**Dependencias:** T1.

**Archivos:** `src/lib/domain/directory/types.ts`, `src/lib/infra/directory/staticPets.ts`,
`src/lib/infra/directory/staticShelters.ts`, `src/lib/services/pets/queries.ts`,
`src/lib/services/shelters/queries.ts`, y todos los consumidores en `src/app/**` y
`src/components/**`; tests de servicios y datos.

**Pasos:**
1. Cambiar las firmas de `PetDirectory`/`ShelterDirectory` a `Promise`.
2. Hacer `async` los adapters estáticos (envolver los valores ya resueltos).
3. Hacer `async` los services y `await` en las páginas/componentes servidor.
4. Ajustar los tests que asumían síncrono (`services/pets/queries.test.ts`,
   `staticPets.test.ts`, `staticShelters.test.ts`, `adoptionMockData.test.ts`).

**Criterio de aceptación:** `typecheck`, `lint`, `test`, `build` verdes; 281 rutas generadas.

**Riesgo:** amplio número de consumidores; aislarlo en este paso evita mezclar con Supabase.

---

## T3 — Cliente Supabase y entorno

**Objetivo:** disponer de clientes server y browser sin exponer `service_role`.

**Dependencias:** T2, P3.

**Archivos (nuevos):** `src/lib/infra/supabase/server.ts`, `src/lib/infra/supabase/client.ts`,
`.env.local` (no versionado), `.env.example`.

**Pasos:**
1. Añadir dependencias `@supabase/supabase-js` y `@supabase/ssr`.
2. Implementar `createServerClient` (cookies) y `createBrowserClient`.
3. Documentar variables en `.env.example`; asegurar `.gitignore` para `.env.local`.
4. Probar que no hay secretos en el bundle (sin `service_role` en cliente).

**Criterio de aceptación:** el cliente compila y `build` no incluye claves privilegiadas.

---

## T4 — Mappers DB↔dominio y ajustes de contrato (D5–D11)

**Objetivo:** frontera única de conversión y contrato alineado con la BD.

**Dependencias:** T2.

**Archivos:** `src/lib/mapping/**` (nuevos mappers DB→dominio), `src/types/pet.ts`,
`src/types/adoption.ts`, tests nuevos de mapper.

**Pasos:**
1. **D10:** relajar a opcional/nullable `raza`, `pesoKg`, `fechaNacimiento`, `color`,
   `genero`, `talla` y campos de `veterinario` (`src/types/pet.ts:47-86`).
2. **D5:** eliminar `AdoptionRequest.notas` (`src/types/adoption.ts:27`) y mapear `motivo`.
3. **D8:** quitar `emergencia.perdido` como dato almacenado; `PetEmergency` derivado de
   `estado` + alerta.
4. **D11:** ampliar `configuracionPublica` a los 13 flags de la BD; retirar
   `mostrarDocumentosPrivados`.
5. **D7:** normalización de enums (tabla del spec) en el mapper.
6. **D6:** derivación de `fotoPerfilUrl` (primera foto `pawpass-fotos`).
7. `""`↔`null`, derivación de `estatus` de vacuna, `estatus` no se envía al escribir.

**Criterio de aceptación:** tests de mapper cubren enums, nulos, `estatus` y `fotoPerfilUrl`;
`test` verde; consumidores actualizados.

---

## T5 — Adaptadores Supabase de lectura + swap

**Objetivo:** leer de Supabase respetando los puertos.

**Dependencias:** T3, T4, P4.

**Archivos (nuevos):** `src/lib/infra/directory/supabasePets.ts`,
`src/lib/infra/directory/supabaseShelters.ts`; edición de `src/lib/services/*/queries.ts`.

**Pasos:**
1. Implementar los puertos sobre RPC/vistas existentes (`obtener_preview_perfil`,
   `listar_preview_catalogo`, `listar_preview_refugios`), resolviendo por
   `uuid`/`slug`/`codigoPublico` y devolviendo `null` si no existe.
2. Aplicar el mapper DB→dominio.
3. Selección por entorno en la línea de swap de los services.
4. Tests con cliente Supabase simulado.

**Criterio de aceptación:** con entorno Supabase, perfiles/catálogo/refugios provienen de la
BD; con entorno estático, del JSON.

---

## T6 — Autenticación con Supabase Auth (D1–D3)

**Objetivo:** login obligatorio para la app.

**Dependencias:** T3, P2.

**Archivos:** `src/app/login/page.tsx` (reemplazo del placeholder), middleware de sesión,
`src/lib/infra/supabase/*`, componentes de login.

**Pasos:**
1. Implementar OAuth Google y Apple y correo/contraseña.
2. Alta de `profiles` desde el frontend tras el registro (sin trigger).
3. Proteger las rutas de la app; dejar pública la ficha del QR (T8).
4. Nunca usar `service_role` en el cliente.

**Criterio de aceptación:** un usuario puede iniciar/cerrar sesión con los tres métodos; las
rutas protegidas redirigen sin sesión.

---

## T7 — Ficha pública del QR y RPC anónima (D4, P1)

**Objetivo:** `/p/[codigo]` visible sin sesión con el contrato `PublicPetCard`.

**Dependencias:** T4, P1.

**Archivos (nuevos):** `src/app/p/[codigo]/page.tsx`, mapper `PublicPetCard`, componentes de
presentación mínima.

**Pasos:**
1. Consumir la función `obtener_ficha_publica` (activación de Q19 en la BD).
2. Aplicar reglas del spec: `publicado`, contacto solo en perdido, fotos solo
   `visible_publico`, límite de fotos.
3. Excluir siempre salud, veterinario, email, dirección, microchip, documentos no-foto.

**Criterio de aceptación:** la ficha se ve sin sesión; nunca incluye campos excluidos.

**Riesgo:** sin P1 (Q19) esta tarea no puede completarse; el resto del plan no depende de ella.

---

## T8 — Escrituras por RPC (D5, D8)

**Objetivo:** reemplazar `localStorage` por RPC autenticadas.

**Dependencias:** T6.

**Archivos:** `src/lib/useLostAlerts.ts`, `src/lib/useAdoptionRequests.ts`,
`src/lib/lostAlertStorage.ts`, `src/lib/adoptionRequestStorage.ts`, nuevos services de
escritura.

**Pasos:**
1. Alerta de pérdida vía `cambiar_estado_mascota`, exigiendo `fecha` y `zona` (NOT NULL).
2. Solicitud de adopción vía `solicitar_adopcion`, con `applicant_id` de la sesión.
3. Retirar el doble origen de "perdido" y el almacenamiento local de estos flujos.

**Criterio de aceptación:** las dos operaciones persisten en la BD y respetan RLS.

---

## T9 — Storage y signed URLs

**Objetivo:** resolver documentos y fotos desde buckets privados.

**Dependencias:** T3, P4.

**Archivos:** adapter de documentos, mapper de URLs.

**Pasos:**
1. Resolver `bucket_id`/`object_path` → signed URL en el servidor, con caducidad corta.
2. Eliminar rutas estáticas `/pets/...` y `/docs/...`.
3. No cachear datos privados.

**Criterio de aceptación:** documentos y fotos se muestran vía URLs firmadas.

---

## T10 — Cierre y verificación

**Dependencias:** todas.

**Pasos:**
1. `npm run typecheck && npm run lint && npm test && npm run build`.
2. `npm run validate:data` (si aún aplica).
3. Pruebas de integración/RLS contra instancia de desarrollo (marcadas NO VERIFICADAS hasta
   disponer de acceso).
4. Actualizar `CHANGELOG.md` y la documentación de fases.

**Criterio de aceptación:** todo verde y sin `service_role` en cliente.

---

## Orden y paralelización

- Secuencial crítico: T1 → T2 → T3 → T4 → (T5 ‖ T6) → (T7 ‖ T8) → T9 → T10.
- T7 depende de P1; puede ejecutarse en paralelo con T8 si Q19 está aprobada.

## Decisiones abiertas que afectan el plan

1. Q19 (P1).
2. Límite de fotos recientes (propuesto: 6).
3. Ruta pública `/p/[codigo]`.
4. Alcance de subida de documentos/fotos en v1.
