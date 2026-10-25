# Plan — Fase 1: cuenta y registro sencillo

- **Fecha:** 2026-10-25
- **Especificación:** `docs/superpowers/specs/2026-10-25-cuenta-registro-design.md`
- **Base:** `88bf56c` (`codex/fase-0-estabilizacion`)
- **Rama de trabajo:** `codex/fase-1-cuenta-registro`
- **Estado:** implementado y aplicado a Supabase; prueba transaccional del RPC aprobada
- **Planificación:** el skill `writing-plans` no está disponible en este entorno; este documento sigue el patrón del plan Supabase previo del repositorio.

## T1 — Contratos y validación del alta

**Archivos:** `src/lib/account/createPet.ts`, tests asociados.

1. Extender el borrador tipado para medio elegido, valor de contacto e imagen.
2. Validar nombre, especie, fecha ISO no futura, email o teléfono E.164/dígitos según el canal, tipo y tamaño de imagen.
3. Probar con TDD validaciones y construcción de parámetros sin incluir un usuario del cliente.

**Aceptación:** los campos mínimos inválidos impiden llamar a Supabase y solo se persiste el contacto elegido.

## T2 — Persistencia segura y foto privada

**Archivos:** nueva migración Supabase con RPC de alta y pruebas/contrato de integración.

1. Revisar de nuevo `pets`, `pet_ownerships`, `pet_contacts`, `pet_privacy`, `pet_documents`, grants, RLS y las funciones Storage existentes antes de DDL.
2. Extender `crear_mascota` con parámetros requeridos de contacto/foto y derivar el usuario autenticado mediante la función interna ya instalada.
3. En la misma transacción crear tutela administradora, contacto seleccionado, privacidad cerrada y metadata de foto con UUID/path de documento.
4. Retornar datos mínimos para que el cliente cargue los bytes con el SDK de Storage sujeto a RLS.
5. Mantener identificadores, bucket y ruta bajo control del RPC; rechazar datos y permisos insuficientes.
6. Añadir caso de reintento de carga con mascota existente, sin duplicar la mascota ni sus metadatos.

**Aceptación:** dueño autenticado verificado completa el registro; otra cuenta y visitante no pueden crear mascota asociada a otra persona ni leer los datos privados.

## T3 — Formulario de registro

**Archivos:** `src/app/cuenta/CreatePetForm.tsx` y helpers.

1. Añadir selector de canal (teléfono, WhatsApp o correo) y campos mínimos.
2. Añadir selector de imagen con ayuda de límites y preview local.
3. Crear mascota y cargar imagen registrada en el bucket privado.
4. Si falla la carga, retener el resultado de RPC y ofrecer reintentar la carga.
5. Actualizar lista y mensaje de éxito solo al completar ambos pasos.

**Aceptación:** errores accesibles por campo y servidor, estados de espera, reintento y éxito coherentes.

## T4 — Cuenta y límites de esta fase

**Archivos:** `src/app/cuenta/page.tsx`, `src/lib/account/pets.ts`, helper QR, tests.

1. Mantener validación de sesión en servidor y consulta del usuario actual con tutelas activas.
2. Mostrar foto privada con URL de Storage autenticada y sin exponerla como URL pública.
3. Retirar de `/cuenta` los enlaces, controles de publicación y flujos públicos/perdidos diferidos.
4. Preparar una función pura que construya la URL canónica `/p/{codigo}` que consumirá el generador QR de fase posterior.

**Aceptación:** un visitante no renderiza contenido de cuenta; la ruta no comparte la ficha ni activa la política pública.

## T5 — Verificación de autorización y cierre

1. Probar el contrato de autorización con tres actores: tutor dueño, otra cuenta autenticada y visitante `anon`.
2. Ejecutar `npm run typecheck`, `npm run lint`, `npm test` y `npm run build`.
3. Revisar diff, estado de migración y separación de secretos.

**Aceptación:** comandos completos verdes; hallazgos de permisos reportados con evidencia. No crear PR durante esta fase.

## Riesgos y dependencias

- La política actual de Storage exige que el objeto corresponda a una fila existente en `pet_documents`; el RPC debe crear la metadata antes de subir bytes.
- El proyecto remoto sí está conectado y se inspeccionó en modo lectura; cualquier cambio SQL se conserva como migración versionada, no se aplica directamente al proyecto durante la implementación.
- El ejecutable `supabase` no está disponible en este entorno; los archivos siguen el formato estándar y usan las versiones registradas por el proyecto.
- Se aplicaron `20261025181525_cuenta_registro_sencillo` y `20261025181633_corregir_ruta_foto_alta` al proyecto `pawpass` después de la autorización explícita del usuario.
- La prueba reversible `supabase/tests/cuenta_registro_rls.sql` pasó para dueño, otra cuenta y visitante. `cuenta_registro_rpc.sql` pasó contra la versión aplicada; las cuentas y mascota de prueba se revirtieron al terminar.
- El revisor automático había bloqueado la prueba temporal de DDL remoto por riesgo de cambios transitorios de funciones y permisos. Tras la autorización explícita, se aplicó mediante la herramienta de migraciones y la prueba de datos se ejecutó en una transacción reversible.
- La confirmación de email puede dejar una cuenta pendiente sin sesión; la interfaz de login ya presenta el paso de verificación.
- No se crean credenciales ni se configura OAuth de Apple/Google en Supabase; se reutiliza la configuración existente.
