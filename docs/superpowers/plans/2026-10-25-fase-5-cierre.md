# Fase 5 — Cierre: privacidad, recorridos y preparación de despliegue

- **Fecha de revisión:** 2026-10-25
- **Base de producto:** `docs/superpowers/specs/2026-10-25-redefinicion-pawpass-design.md`
- **Fase 4:** `docs/superpowers/specs/2026-10-25-adopciones-refugios-design.md`
- **Main local/remoto:** `35c2c5b` (merge de PR #41)
- **Checkout revisado:** `codex/fase-4-adopciones-refugios` en `e1ddf72`
- **PR #42:** estado de GitHub no confirmado; la API no respondió. No se considera integrado.
- **Resultado:** cierre condicionado. Hay hallazgos de privacidad que deben corregirse y verificarse antes de publicar.

El roadmap maestro versionado conserva una FASE 5 histórica de salud y expediente digital. Esta revisión sigue el alcance de cierre indicado para esta fase y la redefinición vigente del producto; no reabre ni repite aquella fase histórica.

## Estado de repositorio e integración

El checkout actual contiene los commits de publicación por dueños/refugios, catálogo, perfiles de refugios y recepción anónima de solicitudes. `main` todavía apunta al merge de #41. La consulta `gh pr view 42` falló por falta de conexión con `api.github.com`, por lo que este documento no declara que #42 esté abierto, cerrado ni integrado.

La lectura de migraciones del proyecto Supabase `pawpass` confirma que la base remota llega hasta `20261025181633 corregir_ruta_foto_alta`. Faltan las migraciones locales posteriores de validación de metadatos, carnet privado, QR/rescate, perfil voluntario y adopciones/refugios. La base remota no refleja la Fase 2 completa ni la Fase 4 del checkout.

## Auditoría de privacidad

### Hallazgos que bloquean despliegue

1. **P1 — La nota de emergencia del perfil voluntario ignora el consentimiento.** `private.obtener_perfil_publico` devuelve `nota_cuidados_emergencia` sin comprobar `pet_privacy.mostrar_emergencia`. El formulario `src/app/cuenta/PetSettingsForm.tsx` no presenta el control `showEmergency`, aunque el modelo y la escritura de privacidad ya tienen ese campo. Resultado: una nota privada puede aparecer en el perfil voluntario. El contrato de QR básico y rescate tiene reglas propias; el permiso que falta aquí es el del perfil voluntario.
   - Evidencia: `supabase/migrations/20261025223000_perfil_publico_voluntario.sql`, campo `emergencyCareNote`; `src/lib/account/petSettings.ts`, campo `showEmergency`; `src/app/cuenta/PetSettingsForm.tsx`, lista `privacyFields`.
   - Cierre requerido: mostrar una elección explícita, ocultar la nota por defecto en el RPC público y añadir prueba SQL para consentimiento apagado/encendido, sin cambiar el contrato de QR/rescate.

2. **P2 — El catálogo de adopción devuelve la fecha de nacimiento exacta.** El spec permite edad aproximada; `private.listar_catalogo_publico` expone `pets.fecha_nacimiento` como `fechaNacimiento` al visitante. La vista del cliente no elimina ese dato del RPC.
   - Evidencia: `docs/superpowers/specs/2026-10-25-adopciones-refugios-design.md`, contrato público; `supabase/migrations/20261025230014_adopcion_publicacion_refugios.sql`, función `private.listar_catalogo_publico`.
   - Cierre requerido: devolver una edad/rango con precisión aprobada o retirar la fecha de nacimiento exacta del contrato; cubrirlo en la prueba de allowlist del catálogo.

### Controles verificados en el código

- El carnet y los documentos usan autorización/RLS de tutor; la membresía de refugio no concede acceso al carnet.
- El QR/rescate usa una RPC de campos limitados, muestra el canal de contacto elegido y conserva a la mascota perdida en el directorio aunque el perfil voluntario esté apagado.
- El perfil voluntario exige publicación y filtra campos, fotos, vacunas y documentos seleccionados; el hallazgo P1 es una excepción para la nota de emergencia.
- El catálogo de adopción tiene un contrato separado, excluye alertas de pérdida activas y no selecciona correo/teléfono ni datos de salud. La foto pública se limita a la principal.
- La ruta anónima no escribe el cuerpo de la solicitud en la tabla de límites; resuelve el responsable en servidor y solo confirma éxito después de la respuesta del proveedor de correo.
- `.env.example` documenta secretos solo de servidor; no se encontraron valores de credenciales en ese archivo. Las variables cubren la clave de Supabase server-only, HMAC y Resend.

### Señales de la base remota

El asesor de seguridad de Supabase informó que `public.obtener_ficha_publica(text)` es ejecutable por `anon` y `authenticated` como función `SECURITY DEFINER` ([guía del aviso](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable)). La función pública del QR es intencional, pero debe conservar una allowlist comprobada y documentar por qué requiere privilegios elevados; revalidar el aviso después de aplicar las migraciones previstas. También informó protección de contraseñas filtradas desactivada ([guía de Auth](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)) y dos tablas del esquema privado con RLS sin políticas (`adoption_notes`, `audit_events`; [guía del aviso](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)). Son hallazgos de configuración remota fuera del cambio local; revisarlos antes de la salida.

El asesor también mostró índices sin uso. No se eliminan como parte del cierre: los datos de uso y las migraciones faltantes hacen insuficiente esa señal para decidir una eliminación.

## Verificación automatizada ejecutada

| Comprobación | Resultado |
| --- | --- |
| `npm test` | Correcto: 77 archivos, 935 pruebas |
| `npm run typecheck` | Correcto al ejecutarlo después de terminar el build |
| `npm run lint` | Correcto |
| `npm run build` | Correcto; 218 páginas generadas |
| Revisión de espacios finales | Correcta en los archivos locales modificados |
| Pruebas SQL de Supabase | No ejecutadas: no hay Supabase CLI ni Docker local |
| Recorridos en navegador con cuentas y datos reales | Pendientes; no existe un entorno de prueba autenticado en este checkout |
| Entrega real de correo | Pendiente; requiere credenciales y remitente verificado fuera del repositorio |

## Matriz de recorridos para la aceptación final

Ejecutar contra una base de staging con las migraciones en orden. Usar cuentas de dueña, miembro de refugio, cuenta ajena y visitante anónimo.

| Recorrido | Resultado que debe observarse | Dependencia |
| --- | --- | --- |
| Dueña registra mascota y abre cuenta/carnet | Solo su cuenta ve carnet, salud y documentos; otra cuenta y `anon` no los leen | Fase 2 / PR #41 y migraciones desplegadas en staging |
| Visitante abre QR habitual | Nombre, foto principal, zona y canal elegido; sin carnet, vacunas detalladas ni documentos | Fase 2 / PR #41 |
| Mascota perdida y recuperación | Sale siempre en directorio de perdidas; QR muestra campos de rescate permitidos; al recuperar desaparece del directorio | Fase 2 / PR #41 |
| Perfil voluntario | No aparece por defecto; tras activar, solo campos/archivos seleccionados; nota de emergencia oculta hasta corregir P1 y elegirla | Fase 2 / PR #41; el cierre requiere corrección |
| Dueña publica adopción | Publicación pública independiente del toggle voluntario; sin fecha exacta ni datos del carnet; cuenta ajena no publica | PR #42 integrado |
| Miembro de refugio publica mascota vinculada | Publicación permitida; refugio no obtiene lectura del carnet; membresía o vínculo revocados bloquean la publicación | PR #42 integrado |
| Visitante consulta catálogo/refugios | Solo publicaciones activas; contacto del refugio solo con permiso público; pérdida/estado terminal suprime adopción | PR #42 integrado |
| Visitante anónimo envía interés inicial | Correo llega al responsable vigente; la respuesta de éxito solo llega después del proveedor; seguimiento posterior fuera de PawPass | PR #42, staging con correo de prueba |
| Abuso y fallos de solicitud | Honeypot, campos inválidos, límite por origen/mascota, doble envío, publicación retirada durante el formulario y fallo de correo no producen éxito falso | PR #42 integrado |

## Preparación del despliegue

1. Confirmar el estado de PR #42 en GitHub y fijar el commit aprobado; no usar este documento como evidencia de integración.
2. Corregir P1 y P2, añadir pruebas de regresión y repetir las comprobaciones de código.
3. Preparar staging, aplicar primero las migraciones faltantes de Fase 2 y luego las de Fase 4; correr `supabase/tests/*.sql` y la matriz completa antes de producción.
4. Configurar secretos en el gestor del entorno: URL y clave pública Supabase, clave secreta server-only, `PAWPASS_ADOPTION_RATE_SECRET`, `RESEND_API_KEY` y `PAWPASS_ADOPTION_FROM_EMAIL`. Verificar el dominio/remitente de correo y la IP/headers de proxy que soporta el hosting.
5. Revalidar RLS, grants, funciones `SECURITY DEFINER`, políticas de Storage y asesores de Supabase en staging. Asegurar que producción no use fixtures como respaldo de datos reales.
6. Registrar plan de reversión de aplicación y observar altas, lecturas públicas, solicitudes genéricas y errores del proveedor. No considerar una solicitud entregada si el proveedor no la confirma.

No se aplicaron migraciones remotas, no se desplegó la app ni se modificaron secretos. No se creó ni aprobó ningún PR.

## Fuera de alcance confirmado

Pagos, transparencia financiera, transferencias/apoyos, adopciones completadas, seguimiento dentro de PawPass y cuentas veterinarias siguen fuera de alcance.
