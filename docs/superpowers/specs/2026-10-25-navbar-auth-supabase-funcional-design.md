# Diseño — navegación, acceso y conexión local con Supabase

- **Fecha:** 2026-10-25
- **Estado:** borrador para revisión del usuario
- **Alcance de producto:** mejorar la navegación existente, reducir la confusión al introducir contraseñas y habilitar el uso local de Auth y el alta de mascotas contra el proyecto Supabase existente.
- **Base de producto:** `PRODUCT.md` y `docs/superpowers/specs/2026-10-25-cuenta-registro-design.md`.

## Situación actual confirmada

- El proyecto Supabase `pawpass` está activo y la base remota ya registra `cuenta_registro_sencillo` y `corregir_ruta_foto_alta`.
- No hay `.env.local` en la raíz. El cliente comprueba `NEXT_PUBLIC_SUPABASE_URL` y una clave pública; si falta alguna, el login y el formulario de mascota muestran que Supabase no está conectado y no llaman a Auth ni a la RPC.
- `.env.local` está cubierto por `.gitignore`.
- El alta usa la RPC autenticada `crear_mascota` y luego carga la imagen en el bucket privado `pawpass-fotos`.
- El formulario de acceso conserva estados separados para contraseña y confirmación. La contraseña principal tiene puntos de placeholder y los dos campos usan el atributo `autocomplete` sin un `name` explícito.
- El navbar actual conserva las rutas principales, pero en móvil deja que sus enlaces se envuelvan en varias líneas.

## Diseño propuesto

### 1. Configuración local de Supabase

Usar el proyecto `pawpass` que ya existe. Crear localmente `.env.local` con su URL y clave pública, usando `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` o la clave `anon` compatible. El archivo permanecerá ignorado por Git. Auth y alta de mascotas no usarán `SUPABASE_SECRET_KEY`; las claves secretas no se añadirán al navegador, al repositorio ni a la salida de herramientas.

No crear otro proyecto, no aplicar migraciones remotas y no desplegar durante este trabajo. Si el proveedor requiere una URL de callback local no permitida, documentar esa configuración pendiente antes de cambiar ajustes remotos.

### 2. Contraseña y autocompletado

- Mantener el campo de confirmación durante el registro y la validación de coincidencia existente.
- Añadir controles con icono de ojo a los campos de contraseña para mostrar u ocultar el valor, con nombre accesible que cambie entre «Mostrar contraseña» y «Ocultar contraseña».
- Quitar el placeholder de puntos para que un campo vacío no parezca contener una contraseña.
- Asignar `name` explícitos a ambos inputs y conservar `current-password` al iniciar sesión y `new-password` al registrarse.
- Al pegar en un campo de contraseña, reemplazar el valor completo del campo. Esto evita concatenar un valor que el navegador o un gestor de contraseñas haya rellenado previamente.
- No borrar automáticamente un valor guardado al enfocar el campo.

### 3. Navegación

Preservar marca, rutas y etiquetas actuales. En móvil, mantener los enlaces en una sola fila táctil desplazable horizontalmente para evitar que el encabezado se expanda por saltos de línea. En escritorio, mantener los enlaces alineados en el encabezado y hacer más evidente el destino activo. Conservar `aria-current`, navegación por teclado, foco visible y etiquetas legibles; no introducir un menú oculto ni añadir rutas nuevas.

## Alternativas consideradas

1. **Conectar el entorno local al proyecto `pawpass` existente (recomendado):** permite probar Auth y el alta real, conserva las migraciones existentes y no introduce cambios de base de datos.
2. **Mantener solo datos de demo:** sirve para explorar páginas, pero no permite probar inicio de sesión ni crear una mascota asociada a una cuenta real.
3. **Crear otro proyecto o modificar la base remota:** agrega configuración y riesgo que no se necesitan para habilitar los flujos existentes; además, la instrucción vigente prohíbe aplicar migraciones remotas.

## Flujo de uso esperado

1. El desarrollador inicia la app con las variables locales configuradas.
2. La persona se registra con correo y contraseña; el formulario muestra claramente qué campo está vacío y permite revelar el valor.
3. Si Auth requiere confirmar el correo, la persona abre el enlace y vuelve por `/auth/callback`.
4. Ya con sesión, entra a `/cuenta`, registra una mascota con nombre, especie, fecha, contacto y foto; el alta persiste mediante `crear_mascota` y la foto queda privada.
5. La mascota aparece en la cuenta solo después de que termina la carga de la foto; un fallo de carga conserva el borrador para reintentar sin crear otra mascota.

## Criterios de aceptación

1. Con `.env.local` válido, la interfaz deja de indicar que Supabase está desconectado y el cliente usa el proyecto existente.
2. Registro, confirmación de correo e inicio de sesión conservan sus rutas actuales y generan una sesión válida.
3. El usuario puede ver u ocultar cada contraseña con teclado y lector de pantalla; el valor no se elimina al enfocar.
4. Pegar en un campo con un valor previo reemplaza el contenido en vez de concatenarlo; el campo de confirmación sigue validando que ambos valores coincidan.
5. La navegación móvil no se parte en varias filas; los destinos siguen accesibles con desplazamiento horizontal y conservan estados activos y de foco.
6. Una cuenta autenticada puede registrar una mascota y completar la carga privada de su foto con las migraciones existentes.
7. El formulario no confirma el alta si falla la RPC o la carga; los errores distinguen conexión, autenticación y alta de mascota sin filtrar detalles internos.
8. `.env.local` sigue ignorado por Git y no se introduce ninguna clave secreta en el cliente o el historial.

## Verificación prevista

- Pruebas de validación y regresión para registro, confirmación de contraseña, pegado con valor previo y manejo de errores.
- `npm test`, `npm run typecheck`, `npm run lint` y `npm run build`.
- Prueba manual local de registro/inicio de sesión, confirmación de correo si está habilitada, y alta/reintento de foto con una cuenta controlada por el usuario.
- No crear cuentas, mascotas de prueba ni otros datos remotos automáticamente.

## Fuera de alcance

OAuth de Google/Apple, cambios de política o esquema en Supabase, migraciones remotas, despliegue, cambio del diseño visual general de PawPass y alteraciones a privacidad, QR, adopciones o refugios.
