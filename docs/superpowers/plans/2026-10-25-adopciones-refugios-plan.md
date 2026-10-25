# Plan — Fase 4: adopciones y refugios

- **Fecha:** 2026-10-25
- **Especificación:** `docs/superpowers/specs/2026-10-25-adopciones-refugios-design.md`
- **Base:** `35c2c5b` (merge de PR #41 en `main`)
- **Rama:** `codex/fase-4-adopciones-refugios`
- **PR previsto:** #42
- **Estado:** en implementación
- **Planificación:** el skill `writing-plans` no está disponible; este documento sigue el flujo de fases y tareas del skill `spec-driven-development` y los planes existentes del repo.

## Mapa de capacidades y orden

| Módulo | Responsabilidad | Depende de |
| --- | --- | --- |
| `adoption-publication` | Publicar/retirar mascotas por dueño o refugio con autorización de base de datos | Fase 2 integrada |
| `public-directories` | Catálogo de adopción y directorio/fichas públicas de refugios con datos reales y allowlists | `adoption-publication` |
| `anonymous-intake` | Formulario sin cuenta, control de abuso y correo al responsable | `adoption-publication`, `public-directories` |

Orden de implementación: `adoption-publication` → `public-directories` → `anonymous-intake`. El trabajo se conserva en una rama y en commits lógicos para que el PR #42 sea revisable como una sola fase. Las interfaces entre módulos se describen abajo; las migraciones se conservan en el repo y no se aplican a la base remota en esta fase.

## Decisiones técnicas fijadas

- Reutilizar `pets.estado = 'en_adopcion'` como publicación explícita, independiente de `pet_privacy.publicado/listar_catalogo`. No crear una segunda tabla de estado salvo que la implementación revele un requisito que el modelo actual no pueda expresar.
- El dueño publica mediante el cambio autenticado de estado; un miembro de refugio usa una RPC acotada que valida membresía, vínculo activo mascota–refugio y estado compatible. Ambas rutas comparten la regla de exclusión por pérdida/estado terminal.
- La RPC pública `listar_catalogo_publico` deja de depender del perfil voluntario, mantiene su contrato de campos limitados y elimina las mascotas con alerta de pérdida activa. La imagen se limita a la foto principal autorizada para la publicación de adopción; fotos adicionales, documentos y salud siguen bajo las reglas de Fase 2.
- Las solicitudes nuevas no se insertan en `adoption_requests`: en la base real `applicant_id` es obligatorio y la tabla soporta seguimiento por cuentas, contrario al producto aprobado. Las solicitudes históricas no se borran.
- El correo se envía desde un Route Handler de Next.js con Resend REST API; API key y remitente son secretos/configuración solo de servidor. Reintentos usan `Idempotency-Key` cuando está disponible. Sin configuración, la ruta falla sin confirmar entrega.
- El endpoint usa un cliente Supabase server-only con clave secreta solo para consultar destinatario y registrar límites en una tabla privada de eventos efímeros. La tabla guarda HMACs de origen/mascota y marcas de tiempo, nunca el cuerpo de solicitud; se limita a roles de servidor y elimina eventos vencidos.
- El formulario recoge nombre, teléfono, correo opcional y motivo. Honeypot, límites por origen/mascota, validación del lado servidor y bloqueo de doble envío forman la protección inicial contra abuso.
- `/refugios` y sus fichas usan RPC públicas limitadas. La lectura real solo devuelve refugios `publicado`; teléfono/email solo salen si `publicar_contacto` está activo. El fallback de JSON solo se usa sin entorno Supabase; un error en producción se muestra como error.
- Mantener la app dentro de App Router: páginas como Server Components por defecto, interactividad en componentes cliente y validación de sesión/autorización en servidor/RPC.

## T1 — Publicación y permisos (`adoption-publication`)

**Objetivo:** que dueños y refugios puedan publicar/retirar mascotas sin abrir el carnet ni el perfil voluntario.

**Archivos previstos:** migración Supabase nueva; prueba SQL de permisos; `src/lib/account/petStatus.ts` y pruebas; rutas/componentes de cuenta para dueño y refugio; guardas de arquitectura si se agrega un cliente server-only.

1. Revisar en el proyecto local y en Supabase (lectura solamente) `pets`, `pet_ownerships`, `pet_privacy`, `pet_lost_alerts`, `shelter_memberships`, `pet_shelters`, `pet_contacts`, `pet_documents`, grants y RLS.
2. Añadir pruebas primero para transición de dueño, publicación por miembro de refugio vinculado y rechazos por otra cuenta, sin vínculo, alerta activa o estado terminal.
3. Crear migración con la CLI de Supabase (`supabase migration new`; el binario global no está instalado, comprobar `npm exec --yes supabase`). La RPC del refugio debe comprobar actor, membresía activa, vínculo y estado en la misma transacción.
4. Exponer los controles necesarios en cuenta: el dueño puede publicar su mascota; el miembro puede elegir una mascota vinculada al refugio. Explicar qué datos de tarjeta serán públicos y el correo al que llegarán solicitudes.
5. No otorgar acceso al carnet a una cuenta por ser miembro de un refugio.

**Aceptación:** una prueba SQL demuestra que el dueño y el miembro autorizado publican; cuentas ajenas, refugios sin vínculo y mascotas perdidas/terminales no publican.

## T2 — Catálogo y refugios públicos (`public-directories`)

**Objetivo:** que las páginas públicas reflejen publicaciones vigentes y datos reales sin ampliar contratos de privacidad.

**Archivos previstos:** RPCs SQL del catálogo/refugios; `src/lib/infra/directory/supabaseCatalog.ts`, `staticShelters.ts`, `activeAdoptionCatalog.ts`; servicios de refugios; páginas `/adopciones`, `/refugios` y `/refugios/[id]`; contratos/mappers y pruebas.

1. Escribir pruebas del contrato de catálogo: `en_adopcion` visible aunque el perfil voluntario esté apagado; una alerta activa lo excluye; campos de contacto, carnet, QR y salud no llegan a la tarjeta.
2. Extender la consulta RPC para usar la foto principal autorizada, el refugio publicado y zona aproximada; mantener límites de página y normalización en el adapter.
3. Añadir RPCs públicas de lista/detalle de refugios con allowlist y regla `publicar_contacto`.
4. Reemplazar fuente estática de refugios por adapter Supabase; reservar fixtures para demo/desarrollo explícito y estados de pruebas.
5. Añadir estados vacíos/error accesibles, metadatos públicos e indexabilidad solo para registros publicados.

**Aceptación:** visitante anónimo ve catálogo y refugios activos; despublicar/retirar una mascota la quita; un fallo de Supabase no presenta mocks como datos reales.

## T3 — Solicitud inicial anónima (`anonymous-intake`)

**Objetivo:** permitir una única solicitud inicial sin sesión y entregar sus datos al responsable sin iniciar seguimiento dentro de PawPass.

**Archivos previstos:** `src/app/api/adopciones/route.ts`; módulos server-only de validación, rate limiting, Supabase y correo; formulario y componentes de adopción; `.env.example`; migración/SQL de límites efímeros; pruebas de contrato y ruta.

1. Probar primero validación/normalización, publicación que se desactiva entre carga y envío, honeypot, límites, doble envío y fallos de correo.
2. Crear Route Handler con tamaño máximo, allowlist de campos y respuestas genéricas; no confiar en disponibilidad mostrada por el navegador.
3. Resolver el destinatario en servidor desde el responsable vigente: email de cuenta dueña o email operativo del refugio. Nunca devolverlo al visitante ni catálogo.
4. Aplicar límite por origen/mascota con HMAC server-only y limpieza de eventos vencidos; tratar cabeceras de proxy solo según el despliegue soportado.
5. Enviar texto plano por Resend REST API con remitente configurable y clave idempotente; no registrar datos personales en telemetría/logs.
6. Actualizar el formulario para visitante sin cuenta, mensaje de éxito que solo confirma entrega, y errores recuperables. Retirar el panel de solicitudes y su RPC/UI de revisión de `/cuenta` sin borrar filas históricas.

**Aceptación:** una persona sin cuenta puede enviar la solicitud y solo el responsable recibe datos personales; el cliente ve éxito únicamente tras confirmación del proveedor; fallos y abuso no generan confirmación falsa.

## T4 — Integración y cierre

1. Revisar migraciones y límites con Supabase security checklist; RLS habilitado en toda tabla de `public`, tabla de límites en schema no expuesto, grants mínimos, `search_path` fijo en funciones privilegiadas.
2. Ejecutar las pruebas dirigidas y SQL cuando exista Supabase local; después `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` y `git diff --check`.
3. Revisar que no haya secretos, que la clave Resend/Supabase no se filtre al bundle y que el diff mantenga el carnet/QR separados.
4. Crear PR #42 contra `main`, adjuntarlo a este chat y dejar la aprobación/fusión al usuario.

## Riesgos y condiciones de despliegue

- La base remota `pawpass` fue inspeccionada en modo lectura. Su historial llega a Q19 y registro de cuenta; aún no registra las migraciones de Fase 2. En una futura aplicación deberán desplegarse primero las migraciones de PR #41 y luego las de PR #42.
- `adoption_requests.applicant_id` es NOT NULL en la base remota; no se reutiliza ni altera en esta fase.
- No se encontraron `RESEND_API_KEY`, remitente ni proveedor de correo en el repo. Se versionarán nombres de variables y código, nunca valores secretos. La entrega real requiere configurar una clave y un dominio remitente verificado fuera del PR.
- El CLI `supabase` no está instalado globalmente; si `npm exec --yes supabase` no está disponible, registrar la limitación y seguir el formato de migración generado por la CLI del proyecto, sin inventar IDs ni aplicar DDL remoto.
- No aplicar migraciones, no desplegar funciones ni modificar credenciales del proyecto remoto durante este trabajo.
