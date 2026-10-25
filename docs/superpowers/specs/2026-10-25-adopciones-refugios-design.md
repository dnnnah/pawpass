# PawPass Fase 4 — Adopciones y refugios

**Fecha:** 2026-10-25
**Estado:** diseño aprobado en conversación; pendiente de revisión del spec escrito
**Base:** `main` con PR #41 integrado (`35c2c5b`)
**Alcance:** convertir el catálogo de adopción y el directorio de refugios en recorridos públicos conectados a datos reales; permitir publicación autenticada por dueños y refugios; recibir solicitudes iniciales anónimas y entregarlas al responsable.

## Propósito

PawPass muestra públicamente refugios y mascotas que buscan hogar. Dueños y refugios autenticados pueden publicar mascotas en adopción desde sus cuentas. Una persona interesada puede enviar una solicitud inicial sin crear cuenta; PawPass la entrega al dueño o refugio responsable y la conversación posterior continúa fuera de la plataforma.

El flujo no declara una adopción completada ni transfiere la tutela. La privacidad del carnet, el QR de rescate y los perfiles voluntarios conserva las reglas aprobadas en Fase 2.

## Decisiones de producto

- El directorio de refugios y el catálogo de adopción son públicos y consultables sin sesión.
- La publicación en adopción es un permiso/estado propio del catálogo. No depende de activar el perfil voluntario ni expone el carnet, el QR o datos de salud.
- Una mascota perdida, encontrada, fallecida, adoptada o en otro estado terminal no puede aparecer como disponible para adopción ni recibir solicitudes.
- El dueño puede publicar una mascota propia. Un miembro autorizado de un refugio puede publicar una mascota vinculada activamente a ese refugio; conocer el identificador de la mascota no concede permisos.
- El visitante envía nombre, teléfono, correo opcional y motivo. La solicitud comunica interés inicial y se entrega al responsable asociado a la publicación.
- El mensaje de éxito confirma la entrega de la solicitud, no la aceptación ni la finalización de una adopción.
- PawPass no ofrece mensajería, revisión, aprobación, cancelación ni seguimiento de etapas de adopción.
- No se incluyen pagos, donaciones, apoyos, transparencia financiera, transferencias de tutela ni cuentas veterinarias.

## Recorridos

### Visitante: catálogo y refugios

1. Abre `/adopciones` o `/refugios` sin iniciar sesión.
2. Ve únicamente mascotas y refugios publicados; puede abrir una ficha pública del refugio y la ficha de una mascota en adopción.
3. El catálogo presenta la información necesaria para conocer a la mascota y llegar al formulario. No incluye teléfono, correo privado, historial de salud, documentos ni datos del carnet.
4. Puede enviar el formulario inicial sin crear cuenta. La ficha indica que el responsable dará seguimiento fuera de PawPass.

### Dueño: publicar mascota

1. Inicia sesión y abre la configuración de una mascota que administra.
2. Activa o desactiva su publicación en adopción de manera explícita.
3. Antes de activar, la aplicación confirma la persona responsable y valida los datos mínimos para publicar y entregar solicitudes.
4. El backend verifica pertenencia, estado actual, contacto de entrega y permiso. No confía en la UI ni en el código público para autorizar la escritura.
5. Desactivar o cambiar a un estado incompatible retira la mascota del catálogo y bloquea nuevas solicitudes.

### Refugio: publicar mascota

1. Una cuenta autenticada con membresía válida administra un refugio.
2. Publica una mascota vinculada activamente al refugio. Los permisos de refugio no entregan acceso automático al carnet ni a la salud de la mascota.
3. El catálogo asocia la mascota y el formulario con el refugio responsable. El responsable de entrega es el correo operativo privado del refugio.
4. Retirar el vínculo activo, despublicar el refugio o revocar la membresía impide nuevas publicaciones/escrituras según corresponda y retira entradas que ya no tengan responsable válido.

## Datos públicos y privacidad

### Contrato público de catálogo

Cada tarjeta puede exponer nombre, especie, raza si existe, género, talla, foto principal aprobada para adopción, edad/zona aproximada y referencia pública del refugio si aplica. El contrato debe ser una allowlist de presentación independiente de las consultas autenticadas del carnet.

No se exponen identificadores de cuenta, correos privados, teléfonos privados, contacto de emergencia, QR directo, datos de salud, documentos, ubicación exacta, expediente, campos de aplicación ni claves internas de almacenamiento. Los enlaces de imagen deben corresponder a recursos aprobados para la tarjeta y no conceder acceso a otros archivos.

La ficha pública de un refugio expone nombre, descripción, ubicación general, estado de verificación y redes/canales marcados expresamente como públicos. La configuración que permite mostrar contacto en el perfil controla solo la lectura pública; la entrega privada de solicitudes no requiere mostrar ese correo o teléfono.

La publicación de adopción es independiente de `pet_privacy.publicado` y `listar_catalogo` del perfil voluntario. Activar una no cambia la otra. Un error del catálogo no debe sustituir datos reales por fixtures de demostración en producción.

## Solicitud anónima y abuso

- La escritura ocurre en el servidor, mediante un endpoint/RPC de acceso anónimo muy acotado. No se exige sesión y no se entrega al navegador una credencial privilegiada.
- El servidor vuelve a comprobar que la publicación sigue activa y tiene un responsable de entrega válido antes de aceptar el envío.
- Se aplican validación y límites de tamaño, normalización de campos, honeypot y límite de frecuencia por origen y mascota. La protección no depende del estado del navegador ni de `localStorage`.
- Los límites pueden apoyarse en almacenamiento operativo de baja sensibilidad; no se registra el cuerpo de la solicitud en telemetría o logs de aplicación.
- Los datos personales del visitante se entregan al correo responsable por un proveedor de correo transaccional configurado solo en el servidor. El catálogo nunca los devuelve.
- El nuevo flujo no requiere cuenta ni genera historial consultable para solicitante o dueño en PawPass. No se eliminan automáticamente solicitudes históricas existentes; cualquier retención/eliminación posterior requiere una decisión separada.
- Si la validación, el límite o el envío falla, se informa que no se pudo entregar y se permite reintentar sin mostrar una confirmación falsa. La deduplicación/idempotencia evita envíos repetidos causados por doble clic o reintentos técnicos.
- La telemetría puede contar inicio/resultado y errores genéricos, sin nombre, teléfono, correo, motivo, contenido del mensaje ni IP en claro.

## Arquitectura y permisos

- Reusar los servicios/adaptadores de lectura y los RPC públicos acotados existentes donde sus contratos cumplan este spec; completar el adaptador de refugios para datos reales y corregir el fallback de demo para que no represente fixtures como datos de producción.
- Añadir el mínimo contrato de publicación necesario para distinguir una publicación de adopción del perfil voluntario y validar el responsable de cada entrada.
- Las escrituras autenticadas validan dueño o membresía de refugio más vínculo activo; RLS/RPC son la frontera de seguridad.
- Mantener un contrato público de adopción y refugios separado del QR, del perfil voluntario y del carnet privado. La pérdida o un estado terminal suprime inmediatamente la publicación de adopción.
- Implementar la recepción anónima detrás de una interfaz server-only para el proveedor de correo, con secretos en variables de entorno y sin acceso desde el cliente.
- Retirar de la UI el panel de revisión/seguimiento de adopciones que contradice el flujo aprobado. No borrar datos históricos ni introducir un panel administrativo de adopción.

## Errores y casos límite

- Mascota sin responsable de correo verificable: no puede publicarse; se informa qué dato debe corregir la persona responsable.
- Refugio no publicado, membresía revocada o vínculo mascota–refugio finalizado: no puede crear/modificar la entrada y las publicaciones existentes dejan de estar disponibles según el contrato vigente.
- Mascota cambia a perdida o a estado terminal después de abrir el formulario: la recepción vuelve a validar y rechaza el envío.
- Solicitud abusiva o límite excedido: rechazo genérico que no confirma la existencia de un correo interno ni filtra detalles de la política.
- Proveedor de correo no configurado o indisponible: error de entrega con posibilidad de reintento; no se informa éxito.
- Lectura de datos reales indisponible: mostrar estado de error/vacío adecuado; nunca datos mock como si fueran publicaciones reales.

## Criterios de aceptación

1. Visitantes sin sesión ven únicamente refugios y mascotas publicadas mediante contratos públicos de campos limitados.
2. Una cuenta dueña puede publicar/despublicar una mascota propia válida; otra cuenta no puede hacerlo.
3. Una cuenta con membresía válida puede publicar una mascota vinculada a su refugio; miembros ajenos no pueden alterar refugios o vínculos.
4. El catálogo público de adopción no depende del toggle del perfil voluntario ni expone el carnet, el QR, salud, documentos o contacto privado.
5. Una mascota perdida, terminal, retirada o sin responsable queda fuera del catálogo y no acepta solicitud.
6. Un visitante sin cuenta puede enviar los datos mínimos y el responsable correcto recibe el correo. Ni el éxito ni el fallo hacen creer que una adopción se completó.
7. Pruebas de abuso cubren honeypot, campos inválidos, límites de frecuencia, doble envío y fallo del proveedor de correo.
8. No existe en PawPass un panel de solicitante/refugio para aprobar o seguir etapas de la solicitud.
9. Fallos del proveedor de lectura no presentan mocks como publicaciones reales en producción.

## División propuesta por chats

Los chats son secuenciales por el contrato de datos compartido; no se ejecutan contra bases incompatibles:

1. **Fase 4.1 — Publicación y permisos:** contrato/modelo, RPC/RLS, publicación por dueño y refugio, validación de estados y pruebas SQL.
2. **Fase 4.2 — Catálogo público y refugios:** adaptadores de datos reales, contratos de lectura limitados, listado y fichas públicas.
3. **Fase 4.3 — Solicitud anónima:** endpoint servidor, protección contra abuso, correo de entrega, confirmaciones y retiro del seguimiento en cuenta.

Cada chat parte del commit consolidado del anterior. El PR #42 agrupa sus commits en una rama y no se aprueba ni fusiona automáticamente.

## Dependencias y preguntas de implementación

- La base `main` ya incluye PR #41, que establece la privacidad del carnet/QR, la publicación voluntaria y la protección de datos públicos.
- El repositorio ya contiene un RPC de catálogo, pero el directorio de refugios todavía usa JSON estático. Las consultas actuales pueden caer en fixtures demo si falla Supabase.
- El formulario de solicitud requiere autenticación en su modo Supabase; además, existe seguimiento en cuenta. Ambos comportamientos deben cambiar para esta fase.
- La base tiene membresías de refugio y vínculos mascota–refugio. Deben verificarse las funciones/RLS existentes al planificar escrituras; no se debe crear una segunda fuente de autorización.
- No se observó un proveedor de correo transaccional configurado en `package.json` ni en los contratos revisados. El plan de implementación debe seleccionar/configurar uno con interfaz server-only antes de habilitar entregas reales.

## Fuera de alcance

Pagos y donaciones; transparencia o comprobación financiera; transferencias de tutela; chat, panel de selección, evaluación, aprobación o etapas posteriores; cuentas veterinarias o validación clínica; reconstrucción del carnet, del QR o del perfil voluntario de Fase 2.
