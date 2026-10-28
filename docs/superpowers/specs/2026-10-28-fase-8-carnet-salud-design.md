# Fase 8: carnet privado de salud y acciones visibles

## Objetivo

Completar el carnet privado con desparasitaciones e historial de consultas médicas persistidos en Supabase, privados por defecto y legibles por tutores activos. Hacer visibles el registro de mascotas y la publicación voluntaria de adopción desde sus lugares naturales. Conservar las vacunas, documentos, foto protagonista, galería y consentimiento explícito que ya existen.

## Mapa de capacidades y dependencias

1. **Registros médicos privados**: modelo/validación → tablas y RLS → carga en servidor → CRUD y vista previa en el carnet. El perfil voluntario solo muestra esos registros con consentimiento por registro y de sección; el QR no los muestra.
2. **Acciones del tutor**: botones de registro y publicación → formularios/acciones que ya existen → permisos de administración existentes. No se reescribe el alta ni la solicitud de adopción.
3. **Regresiones de privacidad y UX**: pruebas SQL transaccionales para administrador, tutor, otra cuenta y visitante; pruebas del CRUD, consentimiento y acciones visibles; verificación de la UI en los tamaños de pantalla y con teclado disponibles.

## Diseño

### Salud privada

Añadir entidades separadas `pet_dewormings` y `pet_consultations`, vinculadas con llave foránea a `pets`. Usar UUID, timestamps, límites de longitud, fechas de dominio, índices por mascota/fecha y RLS. Un tutor activo puede leer; solo quien administra la mascota puede crear, actualizar o eliminar, siguiendo las funciones/políticas existentes. El cliente seguirá usando la sesión Supabase autenticada y nunca un almacenamiento local como respaldo silencioso.

El carnet carga ambos historiales en el Server Component existente y los presenta en secciones dedicadas. Formularios con campos del contrato de dominio actual, validación en cliente y límites SQL, estados accesibles de guardado/error/éxito, edición y eliminación con confirmación. La vista previa del carnet permanece bajo sesión y tutela; el perfil voluntario aplica ambos consentimientos por separado. El esquema remoto inspeccionado ya incluye `consultation_documents`, que enlaza archivos existentes sin darles consentimiento público. Se conserva ese vínculo opcional. Un registro de desparasitación o consulta solo puede salir en el perfil voluntario cuando la persona lo autoriza por registro y también activa la sección de salud; los documentos asociados permanecen privados. El QR no se modifica.

### Acciones visibles

En “Mis mascotas”, “Registrar nueva mascota” será una acción primaria antes de las tarjetas y también resolverá el estado vacío; abrirá el formulario actual con sus validaciones intactas. En cada mascota administrable, se mostrará fuera de `details` el estado “En adopción” cuando corresponda y el control actual con las etiquetas “Publicar en adopción” / “Dejar de mostrar en adopción”. Mantener el proceso de consentimiento previo a publicar y la solicitud de adopción existente.

### Límites

Sin rol veterinario, sin publicación automática, sin cambios a QR/vistas públicas, sin impresión ni rutas de impresión, refugios, entrega de solicitudes, activación o despliegue. No ejecutar migraciones remotas ni interactuar con cuentas externas.

## Criterios de aceptación

- El administrador crea, edita y elimina desparasitaciones y consultas; se validan campos requeridos, fechas ISO no futuras cuando aplique y límites de contenido.
- Los datos sobreviven recarga porque se leen y escriben en tablas Supabase reales; errores de red, permisos o esquema muestran error explícito y no se ocultan con fixtures locales.
- En el carnet se muestran los registros en secciones claras; a tutores activos se les permite lectura sin controles de edición.
- Otra cuenta y visitantes no pueden leer ni mutar los nuevos registros; tutores no administradores no pueden mutarlos incluso invocando directamente la API. El SQL de prueba usa UUID y rollback.
- Consultas y desparasitaciones nuevas se crean privadas; cada registro requiere consentimiento individual y además consentimiento de sección para salir en el perfil voluntario. Los documentos asociados no se publican desde la consulta. El QR y su resumen de vacunas/cuidados conservan el contrato actual.
- “Registrar nueva mascota” es visible antes de contenido colapsado tanto con mascotas como en estado vacío, y conserva el alta existente.
- La acción de adopción es visible para administradores sin abrir un panel colapsado; conserva el consentimiento y ofrece el estado/etiquetas aprobados.
- La composición conserva jerarquía, foto protagonista, secciones, galería, enlace para compartir, responsive y acceso por teclado.

## Verificación prevista

- Pruebas unitarias/componentes específicas para validación, CRUD, consentimiento y acciones visibles.
- Prueba SQL local aislada y reversible para RLS con administrador, tutor, otra cuenta y rol anon.
- `npm test`, `npm run typecheck`, `npm run lint` y `npm run build`.
- Revisión visual de “Mis mascotas” vacío/con datos y del carnet en escritorio/móvil y teclado, sin usar una descarga QR de prueba.

## Contexto y base

El PR #48 corresponde al checkout `codex/fase-7-recuperacion-auth` en `bad946d`. La API de GitHub y `git ls-remote` no están disponibles por DNS en este entorno; el trabajo queda en una rama dependiente de esa cabeza local y deberá apuntar al PR #48 hasta verificar su integración. No se modifica ni reescribe ese trabajo.
