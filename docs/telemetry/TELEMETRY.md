# Telemetría y KPIs — FASE 8

Estado: **núcleo + instrumentación de la UI existentes. NO hay envío de datos.**

PawPass es un prototipo local: no existe backend, ni Supabase, ni Auth, ni
proveedor de analítica. Esta fase construye únicamente el contrato, la
abstracción de medición y las funciones puras de KPI. Ningún evento sale de la
aplicación.

## Arquitectura

```text
UI (componentes existentes)
  ↓
src/lib/services/telemetry/trackers.ts   ← única fachada de emisión
  ↓
TelemetryClient (track)                  ← interfaz
  ↓
src/lib/infra/telemetry/noop-client.ts   ← adaptador actual: no-op
  ↓
proveedor futuro (Supabase / PostHog / otro) — NO EXISTE AÚN
```

La instrumentación es **invisible**: no hay badges, contadores, paneles ni
textos. El único componente nuevo (`ProfileViewTracker`) devuelve `null`.

La lógica de negocio de KPI es pura y vive aparte:

```text
src/lib/domain/telemetry/    → contrato, validadores, catálogo (sin IO)
src/lib/kpis/calculations.ts → fórmulas puras de KPI derivado
src/lib/services/telemetry/  → reloj monotónico, timer, trackers, guardia de montaje
src/lib/infra/telemetry/     → adaptador (hoy no-op)
src/components/telemetry/    → el único componente de telemetría (renderiza null)
```

## Reglas que sigue la instrumentación

- La UI **solo** llama a `trackers`. No importa el adaptador, no construye
  eventos a mano y no importa la capa de KPI.
- La UI **no** toca `fetch`, `localStorage`, `sessionStorage`, `indexedDB`,
  `console`, `navigator`, `document` ni `window` para telemetría.
- Los eventos de **acción** (clic) se miden en el manejador del evento, nunca
  en el render.
- Los eventos de **entrada** (navegación) se miden en un `useEffect` protegido
  por un guardia de una sola ejecución, para que el doble montaje de Strict
  Mode no duplique la medición.
- `useEffect` no corre al renderizar en servidor, así que **no hay emisión
  durante SSR** sin ninguna comprobación explícita.

Las tres primeras están vigiladas por `src/lib/services/telemetry/purity.test.ts`.

## Catálogo de eventos

Todos los eventos son discriminantes de `TelemetryEvent` en
`src/lib/domain/telemetry/events.ts`. No existen eventos fuera de esta lista.

| Evento | Propósito (roadmap) | Contiene | Nunca contiene | KPI derivado |
| --- | --- | --- | --- | --- |
| `registration_started` | 8.1 KPI registro | `timestamp`, `flow` | `pet.id`, datos del tutor, teléfono, email, dirección | `registration_to_qr_duration` |
| `registration_completed` | 8.1 KPI registro | `timestamp`, `flow`, `success` | `pet.id`, datos del tutor, teléfono, email | `registration_completion_rate`, `registration_to_qr_duration` |
| `qr_generated` | 8.1 KPI registro / 8.2 KPI QR | `timestamp`, `source` | `pet.id`, slug del perfil, URL del QR | `registration_to_qr_duration`, `qr_scan_effectiveness` |
| `profile_viewed` | 8.3 métrica futura | `timestamp`, `section` | `pet.id`, slug, IP, user-agent | `profile_views` |
| `emergency_action_started` | 8.3 métrica de emergencia | `timestamp`, `action` | teléfono de contacto, nombre del tutor, contenido del mensaje | `emergency_actions` |
| `found_pet_flow_started` | 8.3 métrica de mascota encontrada | `timestamp`, `step` | `pet.id`, ubicación, contacto del tutor | `found_pet_flow_starts` |
| `adoption_request_started` | 8.3 métrica de adopción | `timestamp`, `section` | nombre, email, teléfono, mensaje de solicitud | `adoption_request_starts` |

`KPI_TARGETS` (constantes del roadmap, no negociables en código):

- `registrationToQrMaxMs = 120000` (2 minutos)
- `qrScanEffectivenessMinPct = 95`

## Eventos vs KPIs

Los eventos son hechos observados. Los KPIs se calculan con funciones puras en
`src/lib/kpis/calculations.ts`:

| KPI | Función | Eventos que lo alimentan | ¿Tiene datos hoy? |
| --- | --- | --- | --- |
| `registration_to_qr_duration` | `calculateRegistrationToQrDurationMs` | `registration_started` + `qr_generated` | **No**: falta el evento de inicio |
| Cumplimiento del objetivo < 2 min | `isWithinTargetDuration` | el anterior | **No** |
| `qr_scan_effectiveness` | `calculateQrScanEffectiveness` | `qr_generated` + `qr_scan` (no implementado) | **No** |

Ninguna fórmula de negocio vive en componentes.

## Privacidad

La telemetría responde "¿qué ocurrió?" y no "¿quién es la persona?".

Excluido por diseño (ver `neverContains` en el catálogo y los tests):

- nombre completo, teléfono, email, dirección
- ubicación precisa (latitud/longitud)
- contenido de mensajes
- tokens e identificadores de sesión
- información médica detallada
- `pet.id` interno, slug o URL del QR
- IP y user-agent

La exclusión no es una convención social: el tipo `TelemetryEvent` no tiene esos
campos, `purity.test.ts` falla si el contrato los introduce, y un tercer test
comprueba que **ningún componente** pase un valor de contexto fuera de las
uniones declaradas en `events.ts` (leyendo el contrato y la firma de los
trackers, no una lista escrita a mano).

## Time-to-task

`createTaskTimer()` (`src/lib/services/telemetry/timer.ts`):

- `start()` / `stop()` / `cancel()` / `getElapsedMs()` / `isRunning()`
- independiente de React, Next, `window`, `document` y `localStorage`
- usa `performance.now()` (monotónico, inmune a ajustes del reloj del sistema)
  con fallback seguro a `Date.now()` cuando no existe (SSR/Node)
- `stop()` devuelve `null` sin `start()`; `cancel()` limpia la medición
- nunca devuelve duraciones negativas (`Math.max(0, …)`)
- es determinista en tests: el reloj se inyecta con `vi.stubGlobal("performance", …)`

No se dispersa `Date.now()` por componentes.

**No está conectado a ningún flujo.** El KPI 8.1 mide "registro + QR < 2
minutos", y el registro de mascota no existe en el producto (ver abajo).

## Una medición por montaje (Strict Mode)

En desarrollo React monta, desmonta y vuelve a montar cada componente. Un
`useEffect(() => track(...), [])` ingenuo emitiría dos eventos por una sola
acción.

- `createOnceGuard()` — `claim()` concede una vez y nunca más
- `createMountObserver()` — envuelve al guardia y expone una función de
  observación
- `useTelemetryOnMount(emit)` — crea el observador con `useState` (inicializador
  perezoso) y lo llama en un `useEffect`

El guardia **no** se reinicia en el cleanup: si se reiniciara, la segunda
pasada volvería a medir. Volver a entrar a la página remonta el componente y
con él el observador, así que una segunda visita sí se cuenta.

## Adaptador

`TelemetryClient` (`src/lib/domain/telemetry/types.ts`):

```ts
type TelemetryClient = { track: (event: TelemetryEvent) => void };
```

Implementación actual: `createNoopTelemetryClient()` no hace nada. No hay
`fetch`, no hay `console.log`, no hay escritura en `localStorage`; hay tests que
lo verifican.

Para conectar un proveedor más adelante basta con implementar `TelemetryClient`
y sustituir la instancia exportada en `src/lib/infra/telemetry/noop-client.ts`.
La UI no cambia.

## IMPLEMENTADO (FASE 8B) — instrumentación de flujos reales

Solo se instrumentaron flujos que **ya existen** en el producto. La
instrumentación es invisible para quien usa la aplicación.

| Evento | Flujo real | Archivo / componente | Cuándo emite |
| --- | --- | --- | --- |
| `profile_viewed` | Ver el perfil | `src/app/perfil/[id]/page.tsx` | Entrada (`section: 'public'`) |
| `profile_viewed` | Expediente de salud | `src/app/perfil/[id]/salud/page.tsx` | Entrada (`'private'`) |
| `profile_viewed` | Cartilla de vacunación | `src/app/perfil/[id]/vacunas/page.tsx` | Entrada (`'private'`) |
| `profile_viewed` | Documentos públicos | `src/app/perfil/[id]/documentos/page.tsx` | Entrada (`'private'`) |
| `profile_viewed` | Estudio del carnet | `src/app/perfil/[id]/carnet/page.tsx` | Entrada (`'print'`) |
| `qr_generated` | Descargar el QR en PNG | `QRShareCard.tsx` (`handleDownloadPng`) | Clic, tras exportar el archivo (nunca si el render falla) |
| `qr_generated` | Exportar el QR en SVG | `QRShareCard.tsx` (`handleDownloadSvg`) | Clic, tras exportar el archivo (nunca si el render falla) |
| `emergency_action_started` | Botón "Llamar" | `EmergencyContact.tsx` | Clic (`action: 'call'`) |
| `emergency_action_started` | Botón "WhatsApp" | `EmergencyContact.tsx` | Clic (`action: 'share'`) |
| `found_pet_flow_started` | "Encontré esta mascota" | `FoundPetPanel.tsx` (`openFlow`) | Clic (`step: 'started'`) |
| `adoption_request_started` | Abrir el formulario | `AdoptionRequestForm.tsx` | Entrada (`section: 'form'`) |

Decisiones que conviene conocer antes de tocar esto:

- **El QR no se cuenta al mostrarse.** El `<QRCodeSVG>` se dibuja en cada render
  y en cada visita. `qr_generated` sale solo de las dos descargas, que son las
  únicas que producen un archivo. Copiar la URL o el ID tampoco cuenta: no
  generan nada. Mostrar, generar, descargar y escanear son acciones distintas.
- **`qr_generated` cuenta "exporté", no "lo guardaste".** El navegador no avisa
  cuando una descarga se cancela o el usuario cierra la pestaña, así que el
  evento sale tras pedir la descarga, no tras comprobar que exista en disco. Si
  el render o la conversión fallan, salta el `catch` y no se emite nada.
- **La sección de emergencia siempre está visible** en el perfil, así que no
  existe un "abrir emergencia" que medir. Solo se miden los dos clics de
  contacto. `EmergencyContactSection` envuelve al componente y **no** mide, para
  que un clic no genere dos eventos.
- **La adopción se mide al abrir el formulario, no al pulsar el CTA.** Si los dos
  midieran, una intención de adoptar contaría como dos inicios de solicitud.
  Tampoco se mide el envío: el evento es de arranque, no de resultado.
- **`ProfileViewTracker` está en cada página del perfil, no en `AppShell`.**
  `AppShell` envuelve también la home, `/adopciones`, `/refugios` y `/login`, y
  ninguna de esas es una visualización de perfil.
- **Compartir la ubicación no emite nada.** Es una acción opcional dentro del
  flujo de mascota encontrada, no parte de su arranque.

## PREPARADO PERO NO INSTRUMENTADO

### Registro de mascota — `registration_started`, `registration_completed`

**No existe el flujo.** No hay pantalla de alta, ni onboarding, ni creación de
mascota. `/login` es una página informativa ("El panel con tus mascotas estará
disponible próximamente") y las mascotas vienen de `mascotas.json`.

No se inventó un formulario para tener dónde medir. Los dos trackers existen en
la fachada y se conectarán cuando exista el alta real. Mientras tanto, la UI no
los llama, y hay un test que lo verifica.

### KPI 8.1 — tiempo de registro a QR

`createTaskTimer()`, `calculateRegistrationToQrDurationMs()`,
`isWithinTargetDuration()` y `KPI_TARGETS.registrationToQrMaxMs` existen y
están probados, pero **no se pueden alimentar**: el KPI va de
`registration_started` a `qr_generated`, y el primer evento no tiene flujo que
lo emita. Sin backend, además, no habría forma de emparejar los dos eventos de
sesiones distintas.

**No hay resultados de este KPI.** Solo la fórmula.

### `qr_scan` y `qr_scan_effectiveness` (KPI 8.2)

**Siguen pendientes.** El evento no existe en el contrato, ni se ha añadido, ni
se ha simulado. Falta definir el protocolo experimental: dispositivo, distancia,
iluminación, red, número de pruebas y criterio de éxito. Sin ese protocolo, un
`qr_scan` medido en el laboratorio no significaría nada.

`calculateQrScanEffectiveness()` está escrita y devuelve 0 mientras no haya
intentos.

## PENDIENTE

Producto:

- Flujo de alta de mascota, que es lo que desbloquearía `registration_started`,
  `registration_completed` y el KPI 8.1
- Definición del protocolo de `qr_scan` (KPI 8.2)
- `lost_profile_view` y `adoption_request_completed` (roadmap 8.3), si algún día
  hacen falta

Infraestructura (decisiones que aún **no** existen):

- Proveedor de envío. El adaptador es no-op y así se queda hasta que se decida.
- Persistencia y agregación de eventos. Hoy un evento se emite, lo recibe el
  no-op y desaparece. **No hay cola offline, ni `localStorage` de telemetría,
  ni IndexedDB, ni sincronización al volver online.** Estar offline no es una
  señal para guardar: si algún día se decide persistir, es un cambio
  deliberado del adaptador, y el test que hoy afirma que no se escribe nada es
  el que hay que cambiar a propósito.

Protocolo experimental:

- `qr_scan_effectiveness` con un protocolo definido (dispositivo, distancia,
  iluminación, red, número de pruebas, criterio de éxito)

Futuro backend / analytics:

- Supabase, Auth, RLS o cualquier proveedor: nada de eso existe
- Google Analytics, PostHog, Plausible u otro: ninguno instalado

Dashboard:

- No existe, y no se ha creado nada parecido

## Limitaciones actuales

- Sin backend no hay eventos agregados ni datos de producción. Los KPIs están
  implementados como funciones, no como métricas observadas. **No hay métricas
  de usuarios.**
- Los eventos no se guardan en ningún sitio. No se pueden consultar a posteriori,
  ni depurar, ni recuperar. Es consecuencia del adaptador no-op.
- **El `timestamp` es monotónico, no de reloj.** Viene de `nowMonotonic()`
  (`performance.now()`), que es un offset desde la carga de la página. Sirve
  para medir duraciones dentro de una sesión, que es para lo que se diseñó, pero
  **no sirve para ordenar eventos entre sesiones, pestañas o dispositivos**.
  Cuando exista un backend que guarde los eventos, el timestamp tendrá que
  pasar a ser tiempo absoluto. Está anotado aquí para que no sorprenda más
  adelante; no se ha cambiado en esta fase porque es una decisión del core.
- La duración se mide por sesión de timer en memoria: no sobrevive a recargas ni
  a navegación entre flujos.
- La navegación con bfcache (atrás/adelante del navegador) restaura la página
  sin volver a montar el componente, así que una visita recuperada de la caché
  no se cuenta como entrada nueva. Es el comportamiento natural de "una
  medición por montaje".
- Los tests corren en entorno `node`, sin DOM: no hay jsdom ni Testing Library.
  La SSR se comprueba de verdad con `renderToStaticMarkup`, y el cableado de
  cada flujo se verifica leyendo el código. Los clics se comproban en el smoke
  manual, no en un test.

## Métricas sugeridas (OPCIONALES, no implementadas)

No forman parte del roadmap; se listan solo por si el tribunal pregunta por
extensión futura. Requieren cambios de producto, así que **no** se implementan
aquí:

- `onboarding_abandoned`: `registration_started` sin `registration_completed`.
  Útil para detectar fricción, pero necesita definir una ventana de abandono.
- `qr_regenerated`: distinguir entre un QR generado y uno re-generado. Requeriría
  distinguir `source: 'regenerate'`, cambio de contrato.
- `offline_first_view`: sesión que abre un perfil sin red (Fase 7). Requeriría
  exponer telemetría desde `src/lib/pwa/`.
