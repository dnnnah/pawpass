# PawPass — redefinición del producto

**Fecha:** 2026-10-25

**Estado:** diseño conversado y aprobado; pendiente de revisión del documento escrito
**Alcance:** define el producto objetivo. No afirma que todos estos recorridos estén implementados hoy.

## Propósito

PawPass ayuda a una persona a registrar a su mascota, mantener su carnet digital y facilitar que vuelva a casa si se pierde. El carnet privado y el QR de rescate son el núcleo. La adopción y los refugios son un espacio público complementario.

Una persona dueña debe poder registrar una mascota sin completar un expediente largo, guardar sus fotos, vacunas y documentos, y obtener un QR útil para identificarla y contactarla. Una persona que encuentre la mascota debe poder actuar desde el teléfono sin crear una cuenta.

## Decisiones de alcance

### Incluido

- Autenticación para dueños y responsables de refugios.
- Registro de mascotas con nombre, especie, fecha de nacimiento, foto y al menos un medio de contacto válido elegido por el dueño. El QR compartible se genera cuando ese contacto está listo.
- Carnet privado que el dueño completa después con fotos, vacunas y documentos.
- Ficha básica accesible mediante QR, perfil público voluntario, apartado público de mascotas perdidas, catálogo de adopción y perfiles de refugios.
- Publicación en adopción por dueños o refugios desde sus cuentas.
- Formulario inicial de adopción para visitantes sin cuenta. PawPass entrega la información al correo del responsable; la evaluación y el acuerdo continúan fuera de la plataforma.

### Fuera de este producto objetivo

- Pagos, donaciones, gastos y transparencia financiera.
- Cuentas o paneles para veterinarios. El dueño registra y actualiza la salud de su mascota.
- Transferencias de tutela como parte del flujo de adopción.
- Mensajería y seguimiento de etapas de adopción dentro de PawPass.

## Mapa de capacidades

| Módulo | Responsabilidad | Depende de | Comprobación principal |
|---|---|---|---|
| `cuenta-registro` | Sesión, pertenencia, alta sencilla, contacto y generación del QR | Ninguno | Una cuenta registra una mascota y solo ve las suyas. |
| `carnet-privado` | Fotos, vacunas, documentos y edición por el dueño | `cuenta-registro` | Los cambios persisten y otra cuenta no puede leerlos. |
| `publicacion-rescate` | QR habitual, perfil voluntario, pérdida y recuperación | `cuenta-registro`, `carnet-privado` | Cada vista expone solo los datos permitidos en cada estado. |
| `adopcion-refugios` | Refugios públicos, catálogo, publicación y solicitud inicial | `cuenta-registro`, `publicacion-rescate` | Un visitante encuentra una mascota y su solicitud llega al responsable. |

El orden de especificación e implementación sigue esas dependencias. Cada módulo tendrá tareas y pruebas propias; este documento fija el comportamiento compartido.

## Superficies y recorridos

### Cuenta del dueño y carnet

El dueño inicia sesión y ve únicamente las mascotas asociadas a su cuenta. El registro pide los cinco elementos mínimos definidos arriba; los demás datos se completan después. Desde el carnet puede gestionar fotos, vacunas, documentos, contacto, la nota de cuidados de emergencia y la visibilidad pública. La portada no enumera todas las mascotas registradas.

### QR habitual

El QR funciona aunque la mascota esté en casa y no tenga un perfil público voluntario. Quien posee el QR o enlace ve nombre y foto destacados, zona aproximada, el contacto elegido y la nota de cuidados de emergencia redactada por el dueño. Zona, contacto y nota tienen un peso visual similar; el contacto no se presenta como alerta. No se muestran vacunas, documentos ni el expediente completo.

La ficha básica del QR no se indexa ni aparece en listados públicos por el mero hecho de existir. «Privada» significa aquí que el carnet y los datos adicionales están protegidos y que la mascota no es descubrible en listados; alguien con el QR sí puede abrir la ficha básica.

### Pérdida y recuperación

Al marcar una mascota como perdida, el dueño indica una zona aproximada. La ficha de rescate pasa a estar disponible para cualquier visitante y la mascota aparece en un apartado público específico, aunque antes no tuviera perfil voluntario. Conserva nombre, foto, contacto y nota de cuidados; añade la alerta y destaca el medio de contacto. Muestra un resumen de vacunación: «al día», «pendiente» o «sin información suficiente». Ese resumen proviene de datos registrados por el dueño, no de una validación clínica. Nunca se deduce «al día» de datos ausentes.

El historial médico, las fechas y comprobantes de vacunas, y los documentos permanecen privados durante la pérdida, salvo elementos que el dueño haya publicado individualmente en su perfil voluntario. Al marcar la mascota como encontrada sale del apartado de perdidas; el QR habitual sigue funcionando.

### Perfil público voluntario

El dueño puede hacer descubrible a su mascota en listados públicos. Puede seleccionar datos adicionales para publicar. Otras fotos, datos de salud y cada documento requieren una elección explícita y una vista previa de lo que verá un visitante. Desactivar el perfil voluntario no desactiva la ficha básica del QR ni impide que una pérdida activa aparezca en el apartado de rescate.

### Adopciones y refugios

Los refugios y las mascotas en adopción se ven públicamente. Dueños y refugios pueden publicar mascotas desde sus cuentas. Una persona interesada puede enviar el formulario inicial sin autenticarse. El formulario recoge solo los datos necesarios, tiene protección contra abuso y se entrega al correo del dueño o refugio responsable. La confirmación indica que se envió el interés, sin sugerir que la adopción ya ocurrió. PawPass no gestiona después la conversación ni la transferencia.

## Matriz de visibilidad

| Dato | Dueño | QR habitual | Mascota perdida | Perfil voluntario |
|---|---|---|---|---|
| Nombre y foto principal | Sí | Sí | Sí | Sí |
| Zona aproximada y contacto elegido | Sí | Sí | Sí, contacto destacado | Sí |
| Nota de cuidados de emergencia | Sí | Sí | Sí | Sí |
| Resumen de vacunación | Sí | No | Sí | Solo si se publica expresamente |
| Vacunas detalladas e historial | Sí | No | No por el estado de pérdida | Solo elementos publicados expresamente |
| Fotos adicionales | Sí | No por defecto | No por el estado de pérdida | Solo fotos publicadas expresamente |
| Documentos | Sí | No | No por el estado de pérdida | Cada archivo publicado expresamente |

Ninguna vista pública obtiene el expediente completo para esconder campos únicamente en el navegador. Los archivos originales permanecen en almacenamiento privado; el acceso público a un elemento elegido se concede de forma acotada. La nota de cuidados de emergencia requiere vista previa porque es pública para cualquiera que tenga el QR, incluso sin una pérdida activa.

## Arquitectura objetivo

- Un registro canónico por mascota en Supabase, relacionado con sus dueños, estado, fotos, salud, documentos y opciones de publicación.
- Acceso autenticado al carnet mediante autorización por mascota y RLS. Conocer el identificador o código QR no acredita tutela.
- Contratos públicos independientes y de campos limitados para QR, perdidas, perfiles voluntarios, adopciones y refugios. La pérdida habilita su ficha y presencia en el apartado público sin cambiar automáticamente los permisos de documentos o historial.
- Almacenamiento privado para fotos y documentos originales; el servidor entrega únicamente los recursos autorizados para la vista solicitada.
- Recepción del formulario de adopción desde el servidor con validación, limitación de abuso y entrega comprobable al responsable. Los datos del visitante no se publican en el catálogo ni en el perfil.
- Datos de demostración disponibles para desarrollo. En producción, un fallo de la base muestra un error claro y no sustituye silenciosamente los datos reales por ejemplos.

## Errores y casos límite

- No se genera un QR compartible ni se activa una publicación si falta un contacto válido. El dueño puede corregirlo desde su cuenta.
- Si una mascota no tiene datos suficientes para calcular el resumen de vacunas, se muestra «sin información suficiente».
- Si falla el envío de una solicitud de adopción, el visitante recibe un error y puede reintentar sin creer que fue entregada.
- Si falla la lectura de un carnet o listado, la interfaz indica el fallo sin mostrar mascotas de demostración como si fueran reales.
- Al recuperar una mascota se retira del listado de perdidas sin eliminar sus datos de carnet.

## Criterios de aceptación del producto

1. Una cuenta registra una mascota con nombre, especie, fecha de nacimiento, foto y contacto, y obtiene un QR funcional.
2. Una cuenta distinta y un visitante no pueden leer ni editar el carnet privado de esa mascota.
3. Un visitante con el QR ve la ficha básica en estado normal, con la jerarquía visual acordada y sin documentos o vacunas detalladas.
4. Al marcarla perdida, aparece en el apartado público y muestra alerta, contacto destacado, nota de cuidados y resumen de vacunación seguro; al recuperarla desaparece del apartado.
5. Activar el perfil voluntario añade la mascota a listados y solo publica los elementos seleccionados individualmente.
6. Refugios y mascotas en adopción son visibles sin sesión; dueños y refugios pueden publicar desde sus cuentas.
7. Un visitante sin cuenta envía una solicitud inicial de adopción y el responsable recibe el correo. El producto no presenta el envío como adopción completada.
8. Las pruebas de visibilidad cubren dueño, otra cuenta y visitante sin sesión, además de las transiciones de pérdida, recuperación y publicación.

## Relación con documentos anteriores

Este diseño sustituye las premisas de producto del roadmap anterior cuando entren en conflicto: el carnet completo deja de ser público por defecto, la portada deja de listar todas las mascotas y el QR básico puede abrirse aun sin perfil voluntario. También reduce el alcance de adopción y deja fuera veterinarios, transferencias, pagos y transparencia. El inventario técnico histórico y el esquema de base de datos siguen siendo fuentes de evidencia de lo implementado, no reglas de producto que prevalezcan sobre esta definición.
