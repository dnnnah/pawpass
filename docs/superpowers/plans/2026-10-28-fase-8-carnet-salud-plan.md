# Plan de implementación: Fase 8

1. **Contratos y persistencia** — completar tipos/validadores; crear migración versionada para tablas privadas, permisos y restricciones; añadir prueba SQL transaccional reversible. Verificar límites y políticas.
2. **Lectura y CRUD del carnet** — cargar registros en servidor; incorporar formularios de creación/edición/eliminación y secciones de vista previa; mantener tutor solo lectura y consentimientos actuales. Escribir pruebas primero para validadores y comportamiento de componente.
3. **Acciones visibles** — mover registro a un llamado claro previo a las tarjetas y resolver el vacío; presentar la publicación de adopción en la tarjeta sin `details`; mantener formularios y validaciones existentes. Añadir regresiones de renderizado.
4. **Verificación** — suite completa, typecheck, lint, build, pruebas SQL locales si Supabase CLI/runtime está disponible, y revisión accesible/responsive. Corregir fallos propios y reportar cualquier limitación ambiental.
5. **Entrega** — commits en español agrupados lógicamente, push de la rama, PR detallado en español contra la base de PR #48, adjuntar el PR. No aprobar, fusionar, desplegar ni aplicar migraciones remotas.
