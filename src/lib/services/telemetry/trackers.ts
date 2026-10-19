import { telemetryClient } from '@/lib/infra/telemetry/noop-client';
import { nowMonotonic } from '@/lib/services/telemetry/time';
import type {
  AdoptionContext,
  EmergencyContext,
  FoundPetContext,
  ProfileContext,
  QrContext,
  RegistrationContext,
  TelemetryEvent,
} from '@/lib/domain/telemetry/events';

/**
 * Fachada de emisión de telemetría (FASE 8B).
 *
 * Este es el **único** punto por el que la UI emite eventos. Los componentes
 * llaman a estas funciones y nada más: no conocen el `TelemetryClient`, no
 * calculan KPIs y no tocan la red ni el almacenamiento.
 *
 * Los tipos de contexto se importan del contrato (`events.ts`) en lugar de
 * re-declarar las uniones aquí. Si el contrato cambiara, el error aparecería
 * aquí y no en un componente.
 */
function emit(event: TelemetryEvent): void {
  telemetryClient.track(event);
}

export function trackRegistrationStarted(flow: RegistrationContext['flow'] = 'manual'): void {
  emit({ name: 'registration_started', timestamp: nowMonotonic(), context: { flow } });
}

export function trackRegistrationCompleted(
  flow: RegistrationContext['flow'] = 'manual',
  success: boolean = true
): void {
  emit({ name: 'registration_completed', timestamp: nowMonotonic(), context: { flow, success } });
}

/**
 * Solo cuando el QR se **produce**: hoy, las descargas PNG y SVG de
 * `QRShareCard`. Mostrar el QR, copiar su URL o copiar el ID no generan nada,
 * así que no emiten. La tarjeta vive en el perfil público, de ahí `profile`.
 */
export function trackQrGenerated(source: QrContext['source'] = 'profile'): void {
  emit({ name: 'qr_generated', timestamp: nowMonotonic(), context: { source } });
}

/** Una entrada a una sección del perfil. Sin identificador de mascota. */
export function trackProfileViewed(section: ProfileContext['section']): void {
  emit({ name: 'profile_viewed', timestamp: nowMonotonic(), context: { section } });
}

/** Una acción de contacto en la sección de emergencia. Sin teléfono ni mensaje. */
export function trackEmergencyActionStarted(action: EmergencyContext['action']): void {
  emit({ name: 'emergency_action_started', timestamp: nowMonotonic(), context: { action } });
}

/** El arranque del flujo "Encontré esta mascota", no su envío. */
export function trackFoundPetFlowStarted(step: FoundPetContext['step']): void {
  emit({ name: 'found_pet_flow_started', timestamp: nowMonotonic(), context: { step } });
}

/** El arranque de una solicitud de adopción, no su contenido. */
export function trackAdoptionRequestStarted(section: AdoptionContext['section']): void {
  emit({ name: 'adoption_request_started', timestamp: nowMonotonic(), context: { section } });
}
