# PETCARNET --- Roadmap Maestro de Evolución

## Mejoras, MVP, funcionalidades, arquitectura y simbiosis Frontend / Backend / Base de Datos

**Proyecto:** PetCarnet --- Pasaporte Digital Público para Mascotas\
**Estado actual:** Prototipo funcional, datos locales, sin backend ni
despliegue productivo\
**Stack actual:** Next.js 16 + App Router, React 19, TypeScript
estricto, Tailwind CSS v4\
**Fuente de datos actual:** `src/data/mascotas.json`\
**Arquitectura actual:** SSG / sitio estático + estado local mediante
`localStorage` para el modo alerta\
**Objetivo:** Convertir gradualmente el prototipo actual en el producto
definido por el proyecto académico, sin romper la arquitectura existente
y sin adelantar innecesariamente Auth/Base de Datos.

------------------------------------------------------------------------

# 0. Propósito de este documento

Este documento es el **roadmap maestro de PetCarnet**.

Integra:

-   el estado real del prototipo;
-   `DOCUMENTACION.md`;
-   `mejoreas.md`;
-   los documentos académicos 1.1, 1.2 y Actividad 2.1;
-   el MVP recomendado;
-   mejoras del frontend actual;
-   nuevas funciones que todavía pueden implementarse con datos locales;
-   funciones que posteriormente necesitarán backend y base de datos;
-   arquitectura de transición;
-   responsabilidades y simbiosis entre Frontend, Backend y Base de
    Datos;
-   despliegue;
-   seguridad;
-   pruebas;
-   métricas;
-   evolución hacia refugios, adopciones, transparencia y veterinarios.

## Regla principal

> **No implementar todo al mismo tiempo.**

PetCarnet actualmente es un prototipo. La prioridad es convertirlo en un
**MVP coherente**, después en un sistema dinámico y finalmente en la
plataforma institucional planteada por el proyecto académico.

------------------------------------------------------------------------

# 1. Estado actual: qué existe realmente

## 1.1. Arquitectura actual

Actualmente PetCarnet no tiene backend.

Los datos proceden de:

``` text
src/data/mascotas.json
```

y las páginas de perfiles se generan de forma estática mediante SSG.

La documentación actual describe:

``` text
Datos JSON
   ↓
getAllPets / getPetById
   ↓
PetProfile
   ↓
mapping/profile.ts
   ↓
View Models
   ↓
Componentes React
   ↓
Interfaz
```

El modo alerta utiliza `localStorage` y `useSyncExternalStore`.

## 1.2. Funciones existentes

Actualmente el prototipo contempla:

-   Home.
-   Listado de mascotas.
-   Filtro por especie.
-   Perfil público.
-   Información general.
-   Información sanitaria.
-   Veterinario.
-   Vacunas.
-   Documentos.
-   Galería de fotografías.
-   QR público.
-   Descarga del QR.
-   Generador de alerta de mascota perdida.
-   Descarga de alerta como PNG.
-   Compartir alerta.
-   Modo oscuro/claro.
-   Responsive.
-   Navegación interna del perfil.
-   Estados vacíos.
-   Accesibilidad básica.
-   Tipado estricto.
-   Mappers de dominio a View Models.

## 1.3. Lo que NO existe todavía

No existe actualmente:

-   Base de datos.
-   Backend.
-   Autenticación funcional.
-   Registro de usuarios.
-   Panel de tutor.
-   Panel de refugio.
-   Panel de rescatista.
-   Panel veterinario.
-   Persistencia remota.
-   Gestión real de mascotas.
-   Transferencia de tutor.
-   Adopciones reales.
-   Solicitudes de adopción.
-   Bitácora de gastos.
-   Necesidades de refugio.
-   Donaciones.
-   Auditoría.
-   Notificaciones.
-   Telemetría real de producción.
-   PWA completa con Service Worker.
-   Estrategia offline real.
-   Sistema de QR físicos administrables.

Esto no debe considerarse un fracaso: corresponde al estado de
**prototipo**.

------------------------------------------------------------------------

# 2. Objetivo general de evolución

La evolución propuesta es:

``` text
                    PETCARNET
                        │
        ┌───────────────┴────────────────┐
        │                                │
     PROTOTIPO                         PRODUCTO
        │                                │
        ▼                                ▼
Datos locales                    Datos persistentes
SSG                               Backend/API
UX                                Auth/Roles
QR                                RLS
Alerta                            Refugios
                                  Adopciones
                                  Salud
                                  Transparencia
                                  Auditoría
```

La transición debe realizarse sin destruir el frontend actual.

------------------------------------------------------------------------

# 3. Principios de desarrollo

## 3.1. Primero experiencia, después infraestructura

El frontend actual permite validar:

-   navegación;
-   estructura;
-   lenguaje visual;
-   flujo de QR;
-   flujo de emergencia;
-   información de salud;
-   comportamiento móvil.

La infraestructura debe llegar cuando exista una necesidad funcional
clara.

## 3.2. Separar dominio, datos y presentación

Mantener:

``` text
Domain
   ↓
Services
   ↓
Mapping
   ↓
View Models
   ↓
UI
```

Evitar:

``` text
Componente React
   ↓
Consulta SQL directa
   ↓
Render
```

## 3.3. El QR identifica, no almacena información

El QR debe apuntar a una URL estable:

``` text
/perfil/<public_code>
```

La información puede cambiar sin necesidad de cambiar el QR.

## 3.4. Privacidad por diseño

El perfil público no debe exponer automáticamente toda la información
del tutor.

Separar:

``` text
Público
Emergencia
Privado
```

## 3.5. Medir antes de afirmar impacto

Las cifras de impacto académico deben clasificarse como:

-   objetivo;
-   hipótesis;
-   estimación;
-   resultado medido.

No presentar una proyección como resultado real.

------------------------------------------------------------------------

# 4. Roadmap por fases

------------------------------------------------------------------------

# FASE 0 --- Congelación y auditoría del prototipo

**Objetivo:** establecer una línea base estable antes de añadir
funciones.

## Tareas

### Código

-   [ ] Confirmar `npm run lint`.
-   [ ] Confirmar `npx tsc --noEmit`.
-   [ ] Confirmar `npm run build`.
-   [ ] Revisar errores de consola.
-   [ ] Revisar warnings de Next.js.
-   [ ] Revisar imágenes rotas.
-   [ ] Revisar enlaces rotos.
-   [ ] Revisar rutas inexistentes.
-   [ ] Revisar comportamiento en 375 px.
-   [ ] Revisar comportamiento en desktop.
-   [ ] Revisar dark mode.
-   [ ] Revisar navegación con teclado.
-   [ ] Revisar estados vacíos.
-   [ ] Revisar perfiles sin documentos/vacunas.

### Datos

-   [ ] Validar todos los registros de `mascotas.json`.
-   [ ] Detectar campos inconsistentes.
-   [ ] Normalizar fechas.
-   [ ] Normalizar teléfonos.
-   [ ] Validar URLs.
-   [ ] Validar documentos.
-   [ ] Validar estados.

### Documentación

-   [ ] Actualizar `DOCUMENTACION.md`.
-   [ ] Registrar que el sistema es un prototipo.
-   [ ] Separar "implementado" de "planeado".
-   [ ] Registrar decisiones arquitectónicas.

### Resultado

Debe existir una versión:

> **Prototype Baseline v0.x**

que pueda reconstruirse desde cero.

------------------------------------------------------------------------

# FASE 1 --- Mejoras del frontend existente

**Objetivo:** mejorar lo que ya funciona sin introducir backend.

## 1.1. Perfil público

### Mejoras

-   [ ] Mejorar jerarquía visual de información.
-   [ ] Revisar consistencia entre estados.
-   [ ] Mostrar claramente el ID PetCarnet.
-   [ ] Agregar acción real de copiar ID.
-   [ ] Mejorar estados vacíos.
-   [ ] Mejorar navegación móvil.
-   [ ] Revisar accesibilidad.
-   [ ] Revisar contraste.
-   [ ] Revisar tamaños táctiles.
-   [ ] Revisar rendimiento de imágenes.
-   [ ] Revisar metadata SEO.
-   [ ] Agregar Open Graph.
-   [ ] Agregar Twitter/X card.
-   [ ] Definir imagen social del perfil.

## 1.2. Contacto

Actualmente existen llamadas y WhatsApp.

Mejoras:

-   [ ] Validar teléfonos.
-   [ ] Evitar mostrar información privada por defecto.
-   [ ] Generar mensajes de WhatsApp contextuales.
-   [ ] Diferenciar contacto normal de contacto urgente.
-   [ ] Añadir confirmación visual antes de acciones críticas.

## 1.3. QR

### Mejoras

-   [ ] Botón real para copiar URL.
-   [ ] Descargar QR en alta resolución.
-   [ ] Exportar SVG.
-   [ ] Mantener URL canónica estable.
-   [ ] Añadir instrucciones de impresión.
-   [ ] Añadir validación visual del QR.
-   [ ] Probar diferentes tamaños impresos.
-   [ ] Preparar QR para futura placa física.

### Regla

El QR no debe depender de datos locales que desaparezcan.

------------------------------------------------------------------------

# FASE 2 --- Emergencias y recuperación

**Prioridad: CRÍTICA**

Esta fase convierte el QR de una ficha informativa en un verdadero
mecanismo de auxilio.

## 2.1. Mejorar modo perdido

-   [ ] Estado visual inequívoco.
-   [ ] CTA urgente.
-   [ ] Fecha de extravío.
-   [ ] Última zona conocida.
-   [ ] Recompensa opcional.
-   [ ] Instrucciones de manejo.
-   [ ] Contacto urgente.
-   [ ] Compartir alerta.
-   [ ] Descargar alerta.

## 2.2. "Encontré esta mascota"

Agregar un CTA:

> **Encontré esta mascota**

Flujo:

``` text
Escaneo QR
   ↓
Perfil
   ↓
Mascota perdida
   ↓
Encontré esta mascota
   ↓
Compartir ubicación
   ↓
Enviar mensaje
```

## 2.3. Geolocalización voluntaria

Usar:

``` text
navigator.geolocation.getCurrentPosition()
```

para generar un enlace de ubicación.

Ejemplo conceptual:

``` text
"Hola, escaneé el QR de Lucca.
Me encuentro aquí:
https://maps.google.com/?q=LAT,LON"
```

### Importante

La ubicación debe ser:

-   voluntaria;
-   explícita;
-   opcional;
-   enviada por el usuario;
-   nunca recolectada silenciosamente.

## 2.4. Instrucciones dinámicas

Agregar una sección prioritaria para:

-   comportamiento;
-   miedo;
-   agresividad defensiva;
-   alergias importantes;
-   medicamentos;
-   instrucciones para sujetar;
-   instrucciones para transportar.

En emergencia, esta información debe aparecer antes de contenido
secundario.

## 2.5. Avistamientos

Futuro:

``` text
Avistamiento
├── fecha
├── hora
├── ubicación
├── comentario
└── fuente
```

Esto requerirá backend cuando se quiera conservar el historial.

------------------------------------------------------------------------

# FASE 3 --- Estados y ciclo de vida de la mascota

**Prioridad: ALTA**

Actualmente el dominio contempla principalmente:

``` text
en_casa
perdido
```

Debe evolucionar.

## 3.1. Estados propuestos

``` text
en_casa
perdido
en_adopcion
adoptado
rescatado
fallecido
```

No todos deben implementarse simultáneamente.

## 3.2. Máquina de estados conceptual

``` text
                    ┌─────────────┐
                    │   EN CASA   │
                    └──────┬──────┘
                           │
                    se extravía
                           │
                           ▼
                    ┌─────────────┐
                    │   PERDIDO   │
                    └──────┬──────┘
                           │
                     encontrado
                           │
                           ▼
                    ┌─────────────┐
                    │   EN CASA   │
                    └─────────────┘


       RESCATADO
           │
           ▼
     EN ADOPCIÓN
           │
           ▼
       ADOPTADO
           │
           ▼
        EN CASA
```

## 3.3. Regla

Los estados no deben ser solamente colores del frontend.

Cuando exista backend deben representar estados reales del dominio.

------------------------------------------------------------------------

# FASE 4 --- Adopciones y refugios, todavía sin backend

**Objetivo:** validar UX y modelo operativo usando datos locales.

Esta fase todavía puede construirse con:

-   JSON;
-   mocks;
-   estado local;
-   datos de prueba.

## 4.1. Perfil de refugio

Crear concepto de:

``` text
Refugio
├── nombre
├── descripción
├── ubicación general
├── contacto
├── redes
├── logo
├── mascotas
└── necesidades
```

## 4.2. Catálogo de mascotas

Home:

``` text
Mascotas
├── Todos
├── Perros
├── Gatos
├── En adopción
├── Perdidos
└── Por refugio
```

## 4.3. Estado `en_adopcion`

El perfil cambia de:

``` text
Contacto de emergencia
```

a:

``` text
Solicitar adopción
```

cuando corresponda.

## 4.4. Solicitud de adopción

Prototipo:

``` text
Mascota
   ↓
Solicitar adopción
   ↓
Formulario
   ↓
Confirmación
```

Todavía sin enviar información real.

## 4.5. Transparencia

Agregar visualmente:

``` text
Necesidad médica
Cirugía de cadera

Objetivo       $3,500
Recaudado      $2,100
Pendiente      $1,400
Progreso       60%
```

También:

``` text
Necesidad
Alimento especializado

Meta
20 kg

Conseguido
12 kg
```

------------------------------------------------------------------------

# FASE 5 --- Salud y expediente digital

**Objetivo:** convertir el perfil en un expediente útil, no solamente
visual.

## 5.1. Vacunas

Ya existe:

-   nombre;
-   fecha;
-   próxima dosis;
-   estado;
-   lote;
-   veterinario;
-   documento.

Mejoras:

-   [ ] historial completo;
-   [ ] orden cronológico;
-   [ ] filtros;
-   [ ] alertas de próxima dosis;
-   [ ] documento asociado;
-   [ ] fecha de creación;
-   [ ] origen del registro.

## 5.2. Desparasitación

Agregar:

``` text
Desparasitación
├── producto
├── fecha
├── próxima fecha
├── dosis
├── veterinario
└── documento
```

## 5.3. Historial médico

Agregar:

``` text
Consulta
├── fecha
├── motivo
├── diagnóstico
├── tratamiento
├── medicamentos
├── veterinario
└── documentos
```

## 5.4. Exportación

Agregar:

> **Exportar expediente sanitario**

Contenido:

-   identificación;
-   vacunas;
-   desparasitación;
-   alergias;
-   condiciones;
-   medicamentos;
-   veterinario;
-   historial médico.

La exportación PDF debe ser un resumen sanitario, no necesariamente el
expediente legal completo.

------------------------------------------------------------------------

# FASE 6 --- Carnet físico / Kit con Causa

**Objetivo:** conectar el producto digital con el identificador físico.

## 6.1. Tarjeta imprimible

Crear:

``` text
PrintableCard.tsx
```

Con:

-   foto;
-   QR;
-   ID PetCarnet;
-   contacto;
-   nombre;
-   diseño compacto.

## 6.2. Exportaciones

-   [ ] PNG.
-   [ ] SVG.
-   [ ] PDF.
-   [ ] Plantilla para impresión.
-   [ ] Versión credencial.
-   [ ] Versión placa/dije.

## 6.3. Principio

El identificador físico debe ser reemplazable.

La mascota no debe perder su identidad digital porque se rompió el dije.

------------------------------------------------------------------------

# FASE 7 --- Rendimiento, PWA y experiencia de campo

**Objetivo:** preparar el prototipo para condiciones reales.

## 7.1. Code splitting

`html-to-image` debe cargarse dinámicamente cuando se solicite la
generación de imágenes.

No debe formar parte innecesariamente del bundle inicial.

## 7.2. localStorage

`useLostAlerts.ts` debe tolerar:

-   localStorage bloqueado;
-   modo privado;
-   errores de lectura;
-   errores de escritura;
-   datos corruptos.

Agregar:

``` text
try/catch
+
fallback en memoria
+
validación del payload
```

## 7.3. PWA

Agregar:

-   [ ] `manifest.webmanifest`.
-   [ ] iconos.
-   [ ] nombre de aplicación.
-   [ ] theme color.
-   [ ] Service Worker.
-   [ ] estrategia de caché.
-   [ ] installability.

## 7.4. Offline

No considerar "PWA" equivalente a "todo funciona sin internet".

La estrategia debe distinguir:

``` text
Offline:
- shell de aplicación
- recursos previamente cacheados
- perfiles previamente visitados

Online:
- datos dinámicos
- actualización
- envío
- sincronización
```

## 7.5. Perfil QR

Prioridad especial:

> La página pública debe cargar rápido y consumir pocos datos.

Esto es especialmente importante porque el proyecto académico identifica
la conectividad reducida como amenaza.

------------------------------------------------------------------------

# FASE 8 --- Telemetría y KPIs académicos

**Objetivo:** demostrar resultados en lugar de solamente afirmarlos.

## 8.1. KPI: registro

Objetivo académico:

``` text
Registro + generación de QR < 2 minutos
```

Medir:

``` text
registration_started
registration_completed
qr_generated
```

Calcular:

``` text
tiempo = qr_generated - registration_started
```

## 8.2. KPI: QR

Objetivo:

``` text
>95% de efectividad de escaneo
```

Definir antes:

-   dispositivo;
-   navegador;
-   tamaño;
-   distancia;
-   iluminación;
-   red;
-   número de pruebas.

## 8.3. Métricas

Futuro:

``` text
qr_scan
profile_view
lost_profile_view
emergency_contact_click
whatsapp_click
location_share
adoption_request
```

## 8.4. No recolectar más información de la necesaria

La telemetría debe ser:

-   mínima;
-   anónima cuando sea posible;
-   explicable;
-   útil para el KPI.

------------------------------------------------------------------------

# FASE 9 --- Preparación de arquitectura dinámica, todavía sin Auth

**Objetivo:** preparar la aplicación para backend sin implementarlo
todavía.

## Arquitectura objetivo

``` text
                 UI / React
                     │
                     ▼
              View Models
                     │
                     ▼
                 Mappers
                     │
                     ▼
                 Services
                  /     \
                 /       \
          Local Data    Backend
             JSON       API/SDK
```

## 9.1. Crear servicios

Ejemplo:

``` text
src/lib/services/
├── petService.ts
├── vaccineService.ts
├── documentService.ts
├── lostAlertService.ts
├── shelterService.ts
└── adoptionService.ts
```

## 9.2. Estado local

Por ahora:

``` text
petService
   ↓
mascotas.json
```

Posteriormente:

``` text
petService
   ↓
Supabase
```

## 9.3. Beneficio

Los componentes no deberían saber si los datos vienen de:

``` text
JSON
Supabase
API
cache
```

------------------------------------------------------------------------

# FASE 10 --- Backend + Base de Datos

**No implementar hasta que el MVP frontend esté validado.**

Esta fase marca la transición:

``` text
PROTOTIPO
   ↓
SISTEMA DINÁMICO
```

## 10.1. Modelo conceptual inicial

Entidades principales:

``` text
profiles
organizations
organization_members
pets
pet_ownership
qr_identifiers
lost_alerts
sightings
vaccines
dewormings
medical_records
pet_documents
adoptions
adoption_applications
needs
expenses
donations
notifications
audit_logs
```

## 10.2. No utilizar solamente `pets.owner_id`

La relación con el tutor debe poder conservar historial.

Ejemplo:

``` text
Mascota
   │
   ├── Tutor A
   │     └── 2024-2025
   │
   ├── Refugio B
   │     └── 2025
   │
   └── Tutor C
         └── 2025-
```

Esto requiere una relación histórica.

## 10.3. QR separado de mascota

Conceptualmente:

``` text
pets
  │
  └── qr_identifiers
```

Permite:

``` text
Mascota = misma identidad
QR = reemplazable
```

------------------------------------------------------------------------

# FASE 11 --- Autenticación, roles y seguridad

Esta fase se implementará cuando el producto ya tenga una razón clara
para necesitar cuentas.

## Roles

### Público

Puede:

-   ver información pública;
-   escanear QR;
-   contactar;
-   enviar ubicación voluntaria;
-   consultar información pública.

### Tutor

Puede:

-   administrar sus mascotas;
-   modificar información;
-   administrar alertas;
-   cargar documentos;
-   gestionar vacunas;
-   controlar información pública.

### Refugio / Rescatista

Puede:

-   administrar múltiples mascotas;
-   gestionar adopciones;
-   registrar necesidades;
-   registrar gastos;
-   cargar documentos;
-   transferir mascotas.

### Veterinario

Futuro:

-   consultar expediente autorizado;
-   registrar/validar información sanitaria;
-   asociar vacunas;
-   emitir registros.

## RLS

La seguridad debe existir en la base de datos.

No depender solamente de:

``` text
if (user.role === ...)
```

en React.

------------------------------------------------------------------------

# FASE 12 --- Panel de tutor

## Dashboard

``` text
Mis mascotas
├── 3 mascotas
├── 1 vacuna próxima
├── 0 alertas
└── 2 documentos nuevos
```

## Acciones

-   [ ] Nueva mascota.
-   [ ] Editar mascota.
-   [ ] Subir foto.
-   [ ] Subir documento.
-   [ ] Registrar vacuna.
-   [ ] Activar alerta.
-   [ ] Desactivar alerta.
-   [ ] Descargar QR.
-   [ ] Descargar carnet.
-   [ ] Exportar expediente.

------------------------------------------------------------------------

# FASE 13 --- Panel de refugio / rescatista

Esta fase es la que más acerca el sistema al proyecto académico.

## Dashboard

``` text
Mascotas
37

En adopción
12

Perdidas
3

Necesidades activas
8

Solicitudes
14
```

## Gestión

-   [ ] Mascotas.
-   [ ] Adopciones.
-   [ ] Solicitudes.
-   [ ] Necesidades.
-   [ ] Gastos.
-   [ ] Documentos.
-   [ ] Personal.
-   [ ] Historial.
-   [ ] Métricas.

## Gestión masiva

Debe permitir:

``` text
Seleccionar mascotas
       ↓
Acción
       ↓
Actualizar
```

Ejemplos:

-   asignar estado;
-   asignar campaña;
-   cargar documento;
-   registrar esterilización;
-   actualizar refugio.

------------------------------------------------------------------------

# FASE 14 --- Transparencia y sostenibilidad

El proyecto académico contempla la transparencia de necesidades médicas
como parte importante del problema.

## 14.1. Necesidades

Modelo:

``` text
Need
├── id
├── pet_id / organization_id
├── title
├── description
├── type
├── target_amount
├── current_amount
├── status
├── created_at
└── updated_at
```

## 14.2. Gastos

``` text
Expense
├── concepto
├── monto
├── fecha
├── proveedor
├── comprobante
└── mascota / campaña
```

## 14.3. Transparencia

La vista pública puede mostrar:

``` text
Necesidad
Cirugía

Meta
$3,500

Recaudado
$2,100

Pendiente
$1,400
```

## 14.4. Donaciones

Las donaciones reales deben considerarse una fase posterior.

Primero:

``` text
Transparencia informativa
```

Después:

``` text
Transacciones reales
```

No mezclar ambos conceptos.

------------------------------------------------------------------------

# FASE 15 --- Adopciones completas

## Flujo

``` text
Perfil mascota
      ↓
Solicitar adopción
      ↓
Formulario
      ↓
Solicitud
      ↓
Refugio revisa
      ↓
Entrevista / proceso
      ↓
Aprobación
      ↓
Transferencia
      ↓
Adoptada
```

## Entidades

``` text
adoptions
adoption_applications
pet_ownership
```

## Reglas

-   Una mascota no debe tener múltiples adopciones activas.
-   Una solicitud debe tener estado.
-   Una transferencia debe quedar registrada.
-   La identidad histórica de la mascota debe conservarse.

------------------------------------------------------------------------

# FASE 16 --- Veterinarios

**Futuro. No es MVP.**

## Acceso

El veterinario no debería ver automáticamente toda la información.

Posibles mecanismos:

``` text
Tutor
   ↓
Autoriza
   ↓
Veterinario
   ↓
Accede durante un periodo
```

o:

``` text
QR/PIN temporal
```

## Funciones

-   [ ] Ver expediente.
-   [ ] Registrar consulta.
-   [ ] Registrar vacuna.
-   [ ] Validar vacuna.
-   [ ] Adjuntar documento.
-   [ ] Registrar tratamiento.
-   [ ] Historial profesional.

------------------------------------------------------------------------

# 5. MVP RECOMENDADO

El MVP no debe intentar cumplir todo el proyecto académico.

Debe demostrar el núcleo de valor.

## MVP 1 --- Público

### Imprescindible

-   [x] Perfil público.
-   [x] Información básica.
-   [x] Salud.
-   [x] Vacunas.
-   [x] Documentos.
-   [x] QR.
-   [x] Contacto.
-   [x] Modo perdido.
-   [x] Generación de alerta.
-   [ ] Mejoras de emergencia.
-   [ ] "Encontré esta mascota".
-   [ ] Ubicación voluntaria.
-   [ ] Estado `en_adopcion`.
-   [ ] Perfil de refugio.
-   [ ] Catálogo de adopción.
-   [ ] PWA básica.
-   [ ] Pruebas reales.

## MVP 2 --- Operativo local

Todavía sin Auth/Base de Datos:

-   [ ] Datos de refugios en JSON.
-   [ ] Mascotas en adopción.
-   [ ] Necesidades.
-   [ ] Catálogo por refugio.
-   [ ] Solicitud de adopción simulada.
-   [ ] Carnet físico.
-   [ ] Expediente PDF.
-   [ ] Telemetría de prueba.
-   [ ] Estados de mascota.

## MVP 3 --- Sistema real

Con backend:

-   [ ] Auth.
-   [ ] Usuarios.
-   [ ] Mascotas persistentes.
-   [ ] Documentos.
-   [ ] Vacunas.
-   [ ] Alertas persistentes.
-   [ ] RLS.
-   [ ] Panel tutor.
-   [ ] Panel refugio.
-   [ ] Adopciones.
-   [ ] Transferencias.

## MVP 4 --- Proyecto académico completo

-   [ ] Refugios.
-   [ ] Rescatistas.
-   [ ] Transparencia.
-   [ ] Necesidades.
-   [ ] Gastos.
-   [ ] Donaciones.
-   [ ] Auditoría.
-   [ ] KPIs.
-   [ ] Validación con usuarios.
-   [ ] Métricas reales.
-   [ ] Veterinarios como fase posterior.

------------------------------------------------------------------------

# 6. Simbiosis Frontend / Backend / Base de Datos

Esta sección define cómo debe evolucionar cada función.

------------------------------------------------------------------------

## 6.1. Perfil

### Frontend

Renderiza:

``` text
PetProfile
↓
ProfileViewModel
↓
UI
```

### Backend

Obtiene:

``` text
GET /pets/:id
```

o equivalente mediante Supabase.

### Base de datos

``` text
pets
profiles
pet_ownership
```

### Simbiosis

``` text
DB
 ↓
Backend/Service
 ↓
PetProfile
 ↓
Mapper
 ↓
Frontend
```

------------------------------------------------------------------------

# 6.2. Vacunas

### Frontend

-   timeline;
-   estados;
-   detalle;
-   documento.

### Backend

-   crear;
-   actualizar;
-   eliminar;
-   consultar.

### DB

``` text
vaccines
```

### Simbiosis

``` text
vaccines
   ↓
vaccineService
   ↓
PetProfile
   ↓
mapping/vaccines.ts
   ↓
VaccineTimeline
```

------------------------------------------------------------------------

# 6.3. Documentos

### Frontend

-   lista;
-   filtros;
-   preview;
-   descarga.

### Backend

-   autorización;
-   upload;
-   metadata;
-   eliminación.

### DB

``` text
pet_documents
```

y almacenamiento de archivos.

### Simbiosis

``` text
Storage
   +
DB metadata
   ↓
documentService
   ↓
PetDocument
   ↓
DocumentListClient
```

------------------------------------------------------------------------

# 6.4. Mascota perdida

### Frontend

-   activa alerta;
-   muestra banner;
-   genera imagen;
-   permite compartir;
-   solicita ubicación.

### Backend

-   guarda alerta;
-   cambia estado;
-   registra activación;
-   recibe avistamientos.

### DB

``` text
lost_alerts
sightings
pets.status
```

### Simbiosis

``` text
Usuario
 ↓
Frontend
 ↓
lostAlertService
 ↓
Backend
 ↓
DB
 ↓
Perfil público
```

------------------------------------------------------------------------

# 6.5. Adopción

### Frontend

``` text
Solicitar adopción
```

### Backend

-   valida;
-   crea solicitud;
-   notifica refugio;
-   cambia estados.

### DB

``` text
adoption_applications
adoptions
pet_ownership
```

### Simbiosis

``` text
Adoptante
 ↓
UI
 ↓
adoptionService
 ↓
Backend
 ↓
DB
 ↓
Refugio
```

------------------------------------------------------------------------

# 6.6. Transparencia

### Frontend

-   progreso;
-   necesidades;
-   gastos;
-   información pública.

### Backend

-   CRUD;
-   validación;
-   autorización;
-   auditoría.

### DB

``` text
needs
expenses
donations
audit_logs
```

### Simbiosis

``` text
Refugio registra
      ↓
Backend valida
      ↓
DB conserva
      ↓
Perfil público consulta
      ↓
Frontend visualiza
```

------------------------------------------------------------------------

# 7. Arquitectura final propuesta

``` text
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND                            │
│                 Next.js / React                         │
│                                                         │
│ Home / Perfil / Emergencia / Adopción / Dashboards     │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                  VIEW MODELS / MAPPERS                  │
│                                                         │
│ PetProfile → ProfileViewModel                          │
│ DB Models → Domain Models                              │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                    SERVICES                             │
│                                                         │
│ petService                                             │
│ vaccineService                                         │
│ documentService                                        │
│ lostAlertService                                       │
│ adoptionService                                        │
│ shelterService                                         │
│ transparencyService                                    │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                 BACKEND / API                          │
│                                                         │
│ Auth                                                   │
│ Authorization                                          │
│ Validation                                             │
│ Business Rules                                         │
│ Notifications                                          │
│ Audit                                                  │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                 SUPABASE / DATABASE                    │
│                                                         │
│ PostgreSQL                                             │
│ RLS                                                    │
│ Storage                                                │
│ Auth                                                   │
│                                                         │
│ pets / profiles / shelters / vaccines / documents     │
│ alerts / adoptions / needs / expenses / audit         │
└─────────────────────────────────────────────────────────┘
```

------------------------------------------------------------------------

# 8. Qué debe permanecer local por ahora

Mientras el proyecto siga siendo prototipo:

## Sí

-   `mascotas.json`.
-   mocks.
-   estados React.
-   `localStorage` para funciones experimentales.
-   componentes.
-   mappers.
-   services con implementación local.

## No

-   Login real.
-   Auth.
-   Supabase.
-   RLS.
-   almacenamiento de datos personales reales.
-   pagos.
-   donaciones reales.
-   datos reales de refugios.
-   datos reales de propietarios.

------------------------------------------------------------------------

# 9. Estructura de datos local recomendada

En vez de hacer crecer indefinidamente `mascotas.json`, preparar la
estructura para el futuro.

``` text
src/data/
├── pets.json
├── shelters.json
├── adoptions.json
├── needs.json
├── vaccines.json
├── documents.json
└── users.mock.json
```

Esto facilita posteriormente:

``` text
JSON
 ↓
Service
 ↓
Supabase
```

sin cambiar el dominio.

------------------------------------------------------------------------

# 10. Mejoras arquitectónicas recomendadas

## 10.1. Dominio

Mantener tipos centralizados:

``` text
src/types/
├── pet.ts
├── shelter.ts
├── adoption.ts
├── vaccine.ts
├── document.ts
├── emergency.ts
└── transparency.ts
```

## 10.2. Dominio separado de UI

No poner colores, iconos o clases Tailwind dentro de las entidades de
dominio.

Ejemplo:

``` text
PetStatus
```

no debería conocer:

``` text
bg-red-500
```

El frontend decide cómo representar el estado.

## 10.3. Mappers

Mantener:

``` text
Domain → ViewModel
```

y posteriormente:

``` text
Database → Domain
```

## 10.4. Services

Los componentes deben consumir:

``` text
petService.getPetById()
```

no:

``` text
supabase.from("pets")...
```

directamente.

------------------------------------------------------------------------

# 11. Modelo de privacidad

## Nivel público

Ejemplos:

-   nombre;
-   especie;
-   raza;
-   foto;
-   rasgos;
-   información médica crítica;
-   estado perdido/adopción;
-   información del refugio.

## Nivel emergencia

Ejemplos:

-   teléfono;
-   WhatsApp;
-   ubicación aproximada;
-   instrucciones;
-   compartir ubicación.

## Nivel privado

Ejemplos:

-   email;
-   domicilio;
-   documentos privados;
-   historial completo;
-   información interna del refugio.

La decisión de exposición debe estar controlada por reglas del dominio y
posteriormente por RLS.

------------------------------------------------------------------------

# 12. Despliegue

Cuando llegue el momento de desplegar:

## 12.1. Preproducción

``` text
GitHub
   ↓
CI
   ↓
Build
   ↓
Preview
```

Validar:

-   build;
-   TypeScript;
-   lint;
-   rutas;
-   imágenes;
-   QR;
-   responsive;
-   accesibilidad.

## 12.2. Producción

Arquitectura futura:

``` text
Usuario
   ↓
Vercel
   ↓
Next.js
   ↓
Supabase
   ├── PostgreSQL
   ├── Auth
   └── Storage
```

## 12.3. Variables de entorno

Nunca almacenar:

-   claves privadas;
-   tokens;
-   credenciales;
-   secretos.

en el repositorio.

------------------------------------------------------------------------

# 13. CI/CD futuro

Agregar:

``` text
Pull Request
    ↓
Lint
    ↓
Type Check
    ↓
Build
    ↓
Tests
    ↓
Preview
```

Después:

``` text
main
 ↓
Production
```

------------------------------------------------------------------------

# 14. Estrategia de pruebas

## 14.1. Unitarias

Probar:

-   fechas;
-   edades;
-   estados;
-   mappers;
-   teléfonos;
-   filtros;
-   porcentajes;
-   permisos.

## 14.2. Integración

Probar:

``` text
pet
→ vaccines
→ documents
→ alert
```

## 14.3. E2E

Flujos críticos:

### QR

``` text
abrir QR
→ perfil
```

### Perdida

``` text
activar alerta
→ perfil cambia
→ compartir
```

### Adopción

``` text
en adopción
→ solicitar
→ confirmación
```

### Tutor

``` text
login
→ mascota
→ editar
→ guardar
→ perfil actualizado
```

------------------------------------------------------------------------

# 15. Pruebas específicas del QR

El QR es parte central del producto.

Probar:

-   iPhone;
-   Android;
-   Safari;
-   Chrome;
-   QR pequeño;
-   QR grande;
-   impresión;
-   pantalla;
-   luz alta;
-   luz baja;
-   diferentes ángulos;
-   red rápida;
-   red lenta.

Registrar:

``` text
intentos
éxitos
fallos
```

y calcular:

``` text
efectividad = éxitos / intentos
```

------------------------------------------------------------------------

# 16. Pruebas de rendimiento

Objetivos:

-   perfil público ligero;
-   imágenes optimizadas;
-   JS mínimo;
-   carga rápida;
-   buen rendimiento móvil;
-   evitar librerías pesadas en rutas que no las necesitan.

Especial atención:

``` text
html-to-image
framer-motion
imágenes
documentos
```

------------------------------------------------------------------------

# 17. KPIs del proyecto académico

Los documentos académicos plantean, entre otros puntos:

### KPI 1

``` text
Registro de mascota < 2 minutos
```

### KPI 2

``` text
Éxito de escaneo QR > 95%
```

### Alcance piloto

``` text
1–2 refugios
30–50 mascotas
```

### Contexto

``` text
CDMX / Edomex
```

Estos números deben tratarse como objetivos de validación hasta contar
con mediciones reales.

------------------------------------------------------------------------

# 18. Relación con el proyecto académico

El proyecto académico plantea cuatro grandes necesidades:

## 18.1. Identificación y recuperación

Solución:

``` text
QR
+
perfil público
+
modo perdido
+
contacto
+
ubicación
```

## 18.2. Salud

Solución:

``` text
vacunas
+
documentos
+
historial
+
veterinario
```

## 18.3. Gestión de refugios

Solución:

``` text
refugios
+
mascotas
+
adopciones
+
expedientes
```

## 18.4. Transparencia

Solución:

``` text
necesidades
+
gastos
+
donaciones
+
auditoría
```

------------------------------------------------------------------------

# 19. Lo que NO debe formar parte del MVP

No priorizar inicialmente:

-   marketplace;
-   red social;
-   chat interno;
-   aplicación móvil nativa;
-   inteligencia artificial;
-   reconocimiento facial;
-   pagos complejos;
-   sistema veterinario completo;
-   analítica avanzada;
-   múltiples países;
-   múltiples especies exóticas;
-   blockchain;
-   microservicios.

Son posibles extensiones, pero no resuelven el núcleo inmediato.

------------------------------------------------------------------------

# 20. Prioridad de implementación

## CRÍTICO

1.  Estabilizar prototipo.
2.  Mejorar emergencia.
3.  "Encontré esta mascota".
4.  Ubicación voluntaria.
5.  Estados de mascota.
6.  `en_adopcion`.
7.  Perfil/refugio.
8.  Pruebas QR.

## ALTO

9.  Carnet físico.
10. Expediente PDF.
11. PWA.
12. Performance.
13. Telemetría.
14. Catálogo por refugio.
15. Necesidades.

## TRANSFORMACIONAL

16. Services.
17. Backend.
18. Base de datos.
19. Auth.
20. RLS.
21. Panel tutor.
22. Panel refugio.
23. Adopciones.

## FUTURO

24. Transparencia financiera completa.
25. Donaciones reales.
26. Auditoría.
27. Veterinarios.
28. Notificaciones.
29. Avistamientos.
30. Ecosistema.

------------------------------------------------------------------------

# 21. Definición de "terminado" por fase

Una fase no está terminada porque "el componente existe".

Debe cumplir:

``` text
Funcionalidad
+
UX
+
Responsive
+
Accesibilidad
+
Estados vacíos
+
Errores
+
Testing
+
Documentación
```

Cuando exista backend:

``` text
+
Autorización
+
Persistencia
+
RLS
+
Auditoría
```

------------------------------------------------------------------------

# 22. Relación entre fases

``` text
FASE 0
Auditoría
   ↓
FASE 1
Frontend
   ↓
FASE 2
Emergencias
   ↓
FASE 3
Estados
   ↓
FASE 4
Adopciones / Refugios
   ↓
FASE 5
Salud
   ↓
FASE 6
Carnet físico
   ↓
FASE 7
PWA / Campo
   ↓
FASE 8
KPIs
   ↓
FASE 9
Services / Arquitectura
   ↓
FASE 10
Backend + DB
   ↓
FASE 11
Auth + RLS
   ↓
FASE 12
Tutor
   ↓
FASE 13
Refugio
   ↓
FASE 14
Transparencia
   ↓
FASE 15
Adopciones reales
   ↓
FASE 16
Veterinarios
```

------------------------------------------------------------------------

# 23. MVP ideal para la primera validación real

El primer piloto no necesita todas las funciones académicas.

Debe poder hacer esto:

``` text
REFUGIO
   │
   ├── registra mascota
   │
   ├── genera QR
   │
   └── entrega identificador
            │
            ▼
         MASCOTA
            │
            ▼
       ESCANEO QR
            │
      ┌─────┴─────┐
      │           │
   NORMAL       PERDIDA
      │           │
      ▼           ▼
  CONTACTO    CONTACTO URGENTE
  SALUD       UBICACIÓN
  VACUNAS     ALERTA
  DOCUMENTOS  AVISTAMIENTO
      │
      ▼
   EN ADOPCIÓN
      │
      ▼
   SOLICITUD
      │
      ▼
    REFUGIO
```

Este flujo representa una cantidad muy importante de la propuesta
académica sin exigir todavía todo el ecosistema.

------------------------------------------------------------------------

# 24. Qué significa "producto real"

El salto de prototipo a producto no ocurre simplemente al subirlo a
Vercel.

Se produce cuando:

``` text
Datos reales
+
Usuarios reales
+
Persistencia
+
Seguridad
+
Flujos completos
+
Métricas
+
Operación
```

Por eso el proyecto debe evolucionar gradualmente.

------------------------------------------------------------------------

# 25. Documentación que debería existir al final

Recomendación:

``` text
docs/
├── README.md
├── product/
│   ├── problem.md
│   ├── objectives.md
│   ├── scope.md
│   ├── actors.md
│   ├── use-cases.md
│   └── business-rules.md
│
├── architecture/
│   ├── overview.md
│   ├── frontend.md
│   ├── services.md
│   ├── backend.md
│   └── security.md
│
├── database/
│   ├── schema.md
│   ├── relationships.md
│   ├── rls.md
│   └── storage.md
│
├── features/
│   ├── qr.md
│   ├── lost-pet.md
│   ├── adoption.md
│   ├── health.md
│   └── transparency.md
│
├── testing/
│   ├── unit.md
│   ├── integration.md
│   ├── e2e.md
│   └── qr-testing.md
│
├── deployment/
│   ├── environments.md
│   ├── ci-cd.md
│   └── production.md
│
└── roadmap/
    ├── implemented.md
    ├── mvp.md
    └── future.md
```

`DOCUMENTACION.md` puede mantenerse como documentación técnica principal
durante el prototipo y dividirse posteriormente.

------------------------------------------------------------------------

# 26. Decisiones que deben quedar documentadas

Cada decisión importante debe responder:

``` text
¿Qué decidimos?
¿Por qué?
¿Qué problema resuelve?
¿Qué alternativa descartamos?
¿Qué impacto tendrá posteriormente?
```

Ejemplo:

> Se mantiene `mascotas.json` durante el prototipo porque permite
> validar UX y dominio sin introducir prematuramente persistencia y
> autenticación. La capa de services permitirá sustituir posteriormente
> la fuente local por Supabase.

------------------------------------------------------------------------

# 27. Matriz de evolución

  Función          Ahora          Próximo         Backend   DB
  ---------------- -------------- --------------- --------- ---------------------------
  Perfil           JSON           Mejorar UX      Sí        `pets`
  QR               Local          SVG/impresión   Sí        `qr_identifiers`
  Vacunas          JSON           Mejorar UX      Sí        `vaccines`
  Documentos       Local          Mejorar PDF     Sí        `pet_documents` + Storage
  Perdida          localStorage   GPS             Sí        `lost_alerts`
  Avistamientos    No             Mock            Sí        `sightings`
  Adopción         No             Mock            Sí        `adoptions`
  Refugios         No             JSON            Sí        `organizations`
  Necesidades      No             Mock            Sí        `needs`
  Gastos           No             Mock            Sí        `expenses`
  Donaciones       No             Solo diseño     Sí        `donations`
  Tutor            No             UI futura       Sí        `profiles`
  Veterinario      No             Diseño          Sí        `profiles` / relaciones
  Auditoría        No             No              Sí        `audit_logs`
  Notificaciones   No             No              Sí        `notifications`

------------------------------------------------------------------------

# 28. Conclusión estratégica

PetCarnet debe evolucionar en tres grandes saltos:

## SALTO 1 --- Prototipo → MVP

Consolidar:

``` text
QR
+
Perfil
+
Salud
+
Emergencia
+
Adopción
```

sin backend.

## SALTO 2 --- MVP → Sistema

Introducir:

``` text
Services
+
Supabase
+
Persistencia
+
Auth
+
RLS
```

sin rehacer el frontend.

## SALTO 3 --- Sistema → Plataforma académica completa

Introducir:

``` text
Refugios
+
Rescatistas
+
Adopciones
+
Transparencia
+
Gastos
+
Donaciones
+
Veterinarios
+
Auditoría
+
KPIs
```

------------------------------------------------------------------------

# 29. Criterio final de prioridad

Ante dos tareas posibles, elegir primero la que:

1.  resuelva una necesidad del problema académico;
2.  aumente el valor para una persona real;
3.  fortalezca el núcleo QR/emergencia/salud/adopción;
4.  pueda validarse;
5.  no rompa la arquitectura;
6.  reduzca deuda técnica;
7.  sea razonable para un desarrollo individual.

La pregunta no debe ser:

> "¿Qué feature se ve más impresionante?"

sino:

> **"¿Qué siguiente incremento convierte el prototipo en una versión más
> útil, comprobable y cercana al sistema que define el proyecto
> académico?"**

------------------------------------------------------------------------

# 30. Fuentes y documentos de referencia

Este roadmap se construye tomando como base:

-   `DOCUMENTACION.md`
-   `mejoreas.md`
-   `1.1. Contextualización del proyecto`
-   `1.2. Diagnóstico`
-   `Actividad 2.1. Análisis del diagnóstico`

El proyecto académico identifica como ejes principales la
identificación/auxilio mediante QR, seguimiento sanitario, gestión de
refugios/rescatistas y transparencia. También plantea un piloto de 1--2
refugios y 30--50 mascotas, además de objetivos de registro inferior a 2
minutos y efectividad de escaneo QR superior al 95%.

------------------------------------------------------------------------

# 31. Estado de este roadmap

**Versión:** 1.0\
**Estado:** Propuesta maestra\
**Base:** Prototipo actual + documentación técnica + plan de mejoras +
documentación académica\
**Principio:** Evolución incremental, sin romper el frontend actual.
