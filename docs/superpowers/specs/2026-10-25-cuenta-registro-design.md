# PawPass — cuenta y registro sencillo de mascotas

**Fecha:** 2026-10-25  
**Estado:** especificación de Fase 1  
**Fuente de producto:** `docs/superpowers/specs/2026-10-25-redefinicion-pawpass-design.md`  
**Base técnica:** rama `codex/fase-0-estabilizacion`, commit `88bf56c`

## Propósito

Una persona crea una cuenta o inicia sesión, ve únicamente las mascotas asociadas a su cuenta y puede registrar una mascota con los datos mínimos necesarios. El alta pide nombre, especie, fecha de nacimiento, foto y un medio de contacto válido elegido por la persona. El resto del carnet se completa más adelante.

## Alcance

### Incluido

- Acceso y registro de cuenta existentes con Supabase Auth por correo/contraseña, Google y Apple.
- Sesión validada en servidor para `/cuenta`; redirección al login si no hay usuario.
- Listado de mascotas desde `pet_ownerships` con RLS y filtro de tutelas activas.
- Alta mínima con nombre, especie, fecha de nacimiento, foto JPEG/PNG/WebP y contacto principal elegido entre teléfono, WhatsApp y correo.
- Foto original en el bucket privado `pawpass-fotos` y metadatos en `pet_documents`.
- Mascota asociada a la cuenta que la creó como administradora; contacto configurado y privacidad cerrada.
- Preparación de la URL canónica para el QR a partir del código público; no mostrar ni habilitar ficha QR, publicación o listados de perdidas en esta fase.
- Pruebas de autorización para dueño, otra cuenta y visitante, más typecheck, lint, suite y build.

### Diferido a publicación y rescate

- Entrega de un QR visible/compartible o ficha pública habilitada.
- Publicación voluntaria, alertas de pérdida y directorio de mascotas perdidas.
- Edición extendida de privacidad, carnet, salud y documentos.

## Contratos Supabase comprobados

La inspección del proyecto conectado `pawpass` (`gjolkedvspnmueqatqyt`) y `PAWPASS-ESTRUCTURA-BASE-DE-DATOS.md` confirma:

- `pets` ya incluye `nombre`, `especie`, `fecha_nacimiento`, `codigo_publico`, `slug` y `estado`; nacimiento admite `NULL` y la fecha futura se rechaza.
- `pet_ownerships` asocia `pet_id` con `user_id`, permite varios tutores y tiene lectura autenticada gobernada por `private.es_tutor(pet_id)`.
- `private.es_tutor` exige sesión no anónima, correo o teléfono confirmado, cuenta no suspendida y tutela activa. Dueños y otros usuarios no reciben acceso por conocer un UUID o código.
- La RPC autenticada `crear_mascota(p_nombre, p_especie, p_nacimiento)` crea mascota, tutela administradora, contacto vacío y privacidad cerrada. Su función interna deriva el usuario con `private.usuario_verificado()`.
- `pet_contacts` permite SELECT para tutores y UPDATE para administradores; no hay INSERT directo ordinario. Se ampliará el RPC de alta para aceptar el contacto inicial y persistirlo en la misma transacción.
- `pet_documents` admite foto y tiene RLS de escritura para administradores. El bucket `pawpass-fotos` es privado, admite JPEG/PNG/WebP hasta 5 MiB. Storage permite carga/lectura si la ruta está registrada en `pet_documents` y el usuario administra/es tutor de la mascota.
- `pet_privacy` se inicializa con `publicado=false` y todos los flags de exposición en falso.
- Auth y callback ya usan clientes `@supabase/ssr`, cookies y `getUser`; `profiles` tiene RLS propio. Nunca se usa `service_role` desde el navegador.

## Diseño funcional

### Cuenta

Se conserva la interfaz existente de acceso. Tras registro sin sesión por confirmación de correo, el mensaje explica que debe confirmar antes de entrar. Tras una sesión autenticada, el callback vuelve a `/cuenta`. La consulta de lista se ejecuta en servidor y depende simultáneamente de `user.id`, `ended_at IS NULL` y RLS. Ante error se muestra un estado de error y no se sustituyen datos reales por ejemplos.

### Registro

El formulario requiere nombre, especie y fecha de nacimiento real que no esté en el futuro. La persona selecciona teléfono, WhatsApp o correo como medio principal y se valida el formato del medio elegido. Los valores de contacto no elegido se guardan como nulos. Se requiere una imagen con tipo MIME aceptado y tamaño máximo de 5 MiB.

Una RPC autenticada crea de forma transaccional la mascota, la tutela administradora, el contacto elegido, la privacidad cerrada y un registro de documento para la foto. La RPC deriva el usuario de `auth.uid()`/la verificación existente; no recibe un `user_id` del cliente. La aplicación sube los bytes a `pawpass-fotos` usando una ruta ligada al UUID y al documento ya registrado. La interfaz confirma el alta solo cuando la carga termina; si falla la carga, conserva el identificador y permite reintentar la misma foto sin crear otra mascota.

### QR y exposición

El código público sigue siendo un identificador de mascota y nunca una credencial de tutela. Se implementa la construcción estable de la URL que alimentará el QR. En esta fase la cuenta no presenta enlace, imagen QR, control de publicación ni contenido de rescate. La política pública actual permanece cerrada para los registros nuevos; su activación y el flujo público corresponden a la siguiente fase.

## Seguridad y errores

- RLS sigue siendo la frontera real para tablas y Storage. La UI no sustituye autorización.
- Una consulta o escritura sin sesión válida falla cerrada.
- Otra cuenta y visitante no obtienen filas privadas al consultar `pets`, `pet_ownerships`, `pet_contacts` o `pet_documents`.
- Contacto y privacidad se crean en la misma transacción que la mascota, evitando altas sin canal de contacto.
- Los metadatos de la foto se crean antes de llamar a Storage, de acuerdo con la política de rutas registradas. Un fallo al subir bytes deja el formulario en estado recuperable y no muestra éxito.
- Errores de validación se asocian al campo; errores de servidor se explican sin filtrar información del esquema.
- Se mantiene el límite privado del bucket; la vista de cuenta obtiene la foto con acceso autenticado y no genera URL pública.

## Criterios de aceptación

1. Un usuario puede registrarse e iniciar sesión con los mecanismos ya conectados.
2. `/cuenta` redirige a `/login` sin sesión.
3. Un dueño solo lista mascotas con tutela activa que permiten las políticas RLS.
4. Otra cuenta y `anon` no leen mascotas, tutelas, contacto ni metadatos privados.
5. El formulario requiere nombre, especie, fecha de nacimiento, foto y un contacto principal válido.
6. Una creación exitosa persiste mascota, tutela administradora, contacto, privacidad cerrada y foto privada.
7. El fallo de la carga de foto se puede reintentar sin crear otra mascota y nunca se anuncia como éxito completo.
8. El alta no publica la ficha, no habilita el acceso público al QR y no introduce la mascota en perdidas.
9. El módulo deja una función de URL estable para generar QR en la fase correspondiente.

## Fuera de alcance

Compartir QR, rutas de publicación, listados públicos de perdidas, recuperación, catálogo de adopción, carga de documentos adicionales, invitaciones y transferencias de tutela.
