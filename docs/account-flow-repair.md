# Flujo de cuenta y mascotas

El inicio con sesión y `/cuenta` comparten la misma lista privada. Las mascotas perdidas van primero y su tarjeta lleva fondo, borde y etiqueta de alerta rojos. El acceso a mascotas perdidas y el alta de una nueva mascota están al principio; el formulario de registro aparece después de las mascotas existentes y antes de los perfiles públicos.

El carnet privado carga primero sus secciones de identificación, salud, vacunas y archivos. Privacidad, contacto y QR se encuentran en un panel separado. Los errores de infraestructura no se presentan como una mascota inexistente.

## Correcciones de Supabase aplicadas

- Validación de foto obligatoria con expresiones regulares corregidas para correo y teléfono.
- Columna privada `pet_health.nota_cuidados_emergencia` y edición de identidad limitada al administrador.
- Eliminación de mascotas con RLS limitada al administrador verificado.
- Compatibilidad privada para el medio de contacto y la nueva autorización `pets.adopcion_publicada`, inicialmente falsa para todas las mascotas existentes.
- Publicación en adopción autenticada y catálogo limitado a publicaciones confirmadas. Se comparte únicamente la presentación de la mascota y su foto principal; no el carnet ni sus contactos privados. La edad se devuelve en meses completos, sin fecha exacta de nacimiento.
- Perfiles públicos respetando el estado de publicación y cada opción de privacidad. Los archivos requieren además estar marcados como públicos.
- Listado de perdidas que reutiliza el contrato del QR existente y respeta su privacidad.

La migración histórica `publicacion_rescate_qr` no se aplicó: la revisión automática rechazó ampliar el acceso anónimo a fotos, contacto y nota de emergencia. Se prepararon migraciones acotadas y se obtuvo aprobación para su alcance público. No se modificó el contrato del QR existente.

## Eliminación

La interfaz exige escribir `ELIMINAR`. Los endpoints comprueban origen, sesión confirmada y permisos; nunca confían en un identificador de usuario enviado por el navegador.

- `DELETE /api/mascotas/[petId]`: exige administración activa, comprueba los buckets y rutas de archivos, retira los archivos por la API de Storage y elimina el registro bajo RLS. Las relaciones del carnet se eliminan en cascada. Un fallo no se presenta como éxito y permite reintentar.
- `DELETE /api/cuenta`: requiere retirar primero las mascotas asociadas. Solo después elimina el usuario autenticado mediante el cliente privilegiado del servidor. Requiere `SUPABASE_SECRET_KEY` o `SUPABASE_SERVICE_ROLE_KEY`, exclusivamente del servidor.

## Verificación

Se probaron autorización, origen, confirmación, orden de limpieza de archivos y rechazo de operaciones ajenas. Una prueba transaccional con `ROLLBACK` comprobó lectura del carnet como dueño, publicación de adopción, consulta anónima del catálogo y lectura exclusiva de la foto de adopción. Ninguna mascota se publicó ni eliminó de forma permanente durante esa prueba.

La navegación del navegador confirmó el acceso real al carnet privado y la organización del inicio autenticado. Las eliminaciones reales se dejan a las decisiones del propietario en la interfaz.

Los correos solicitados desde localhost regresan a localhost porque `emailRedirectTo` utiliza el origen del navegador que inició el flujo. Desde la web publicada se utiliza su origen. El Site URL de Supabase apunta a `https://pet-carnet.vercel.app` como retorno predeterminado.

## Despliegue y migraciones

No ejecutar todas las migraciones históricas pendientes sin revisar su alcance: `publicacion_rescate_qr`, `perfil_publico_voluntario` y `adopcion_publicacion_refugios` contienen contratos públicos sustituidos por las migraciones acotadas del 26 de octubre. El proyecto existente ya recibió validación de foto, carnet privado y las migraciones nuevas `20261026013000` a `20261026017000`. El historial remoto asigna sus propias versiones; reconciliar por nombre y contenido antes de usar el CLI. No se desplegó en Vercel.

Comprobación final: 83 archivos y 977 pruebas de Vitest correctas; lint, TypeScript y build de producción correctos. La función remota del catálogo se verificó sin `fechaNacimiento` y con `edadMeses`. Se comprobó también la vista móvil de 390 px sin desbordamiento horizontal.
