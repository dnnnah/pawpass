# Telemetría y KPIs — FASE 8 (Core)

Estado: **IMPLEMENTADO como núcleo local. NO hay envío de datos.**

PawPass es un prototipo local: no existe backend, ni Supabase, ni Auth, ni
proveedor de analítica. Esta fase construye únicamente el contrato, la
abstracción de medición y las funciones puras de KPI. Ningún evento sale de la
aplicación.

## Arquitectura

```text
UI (futuro, equipo B)
 ↓
src/lib/services/telemetry/trackers.ts   ← fachada de emisión
 ↓
TelemetryClient (track)                  ← interfaz
 ↓
src/lib/infra/telemetry/noop-client.ts   ← adaptador actual: no-op
 ↓
proveedor futuro (Supabase / PostHog / otro) — NO EXISTE AÚN
```

La lógica de negocio de KPI es pura y vive aparte:

```text
src/lib/domain/telemetry/  → contrato, validadores, catálogo (sin IO)
src/lib/kpis/calculations.ts → fórmulas puras de KPI derivado
src/lib/services/telemetry/ → reloj monotónico, timer, trackers
src/lib/infra/telemetry/    → adaptador (hoy no-op)
```

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

| KPI | Función | Eventos que lo alimentan |
| --- | --- | --- |
| `registration_to_qr_duration` | `calculateRegistrationToQrDurationMs` | `registration_started` + `qr_generated` |
| Cumplimiento del objetivo < 2 min | `isWithinTargetDuration` | el anterior |
| `qr_scan_effectiveness` | `calculateQrScanEffectiveness` | `qr_generated` + `qr_scan` (no implementado) |

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
campos, y `purity.test.ts` falla si el contrato los introduce.

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

## IMPLEMENTADO

- Contrato tipado `TelemetryEvent` (unión discriminada, 7 eventos)
- Validador `isValidTelemetryEvent` con guardas por evento
- Catálogo declarado `TELEMETRY_EVENT_CATALOG` (propósito, contiene, nunca contiene, KPI)
- KPIs puros: `calculateRegistrationToQrDurationMs`, `isWithinTargetDuration`,
  `calculateQrScanEffectiveness`
- `createTaskTimer` con reloj monotónico y comportamiento ante SSR
- Fachada `trackRegistrationStarted` / `trackRegistrationCompleted` / `trackQrGenerated`
- Adaptador no-op
- Tests de contrato, validación, timestamp, duración, cancelación, casos límite,
  SSR, no-op, no-PII y estabilidad de nombres
- Guarda de pureza architectural en `purity.test.ts`

## PREPARADO PARA FUTURO

- Instrumentar la UI con estos eventos (equipo B)
- `qr_scan` y `lost_profile_view` (roadmap 8.3): requieren decidir cómo medir un
  escaneo sin identifier a la mascota y sin inventar backend
- Conector real (Supabase / PostHog / Plausible u otro)
- Definición experimental de `qr_scan_effectiveness` (dispositivo, navegador,
  tamaño, distancia, iluminación, red, número de pruebas — roadmap 8.2)
- Persistencia y agregación de eventos
- Dashboard de KPIs (fase posterior; fuera de alcance aquí)

## Limitaciones actuales

- Sin backend no hay eventos agregados ni datos de producción. Los KPIs están
  implementados como funciones, no como métricas observadas.
- `qr_scan_effectiveness` no tiene evento de origen: la fórmula existe para
  cuando exista `qr_scan`, y hoy siempre devolvería 0 por falta de intentos.
- La duración se mide por sesión de timer en memoria: no sobrevive a recargas ni
  a navegación entre flujos.

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
