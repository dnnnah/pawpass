"use client";

import { trackProfileViewed } from "@/lib/services/telemetry/trackers";
import { useTelemetryOnMount } from "@/components/telemetry/use-telemetry-on-mount";
import type { ProfileContext } from "@/lib/domain/telemetry/events";

type ProfileViewTrackerProps = {
  /**
   * Sección del perfil que se está entrando a ver. El tipo viene del contrato
   * de telemetría, no de una unión escrita aquí.
   */
  section: ProfileContext["section"];
};

/**
 * Emite `profile_viewed` una vez por entrada a una sección del perfil.
 *
 * No renderiza nada: no hay indicador, contador ni marca de que exista. Para
 * quien usa la aplicación la instrumentación es invisible.
 *
 * No se coloca en `AppShell` a propósito. `AppShell` envuelve también la
 * home, `/adopciones`, `/refugios` y `/login`, y ninguna de esas es una
 * visualización de perfil. Colocarlo en cada página del perfil mantiene el
 * alcance del evento igual al significado del evento.
 */
export function ProfileViewTracker({ section }: ProfileViewTrackerProps) {
  useTelemetryOnMount(() => {
    trackProfileViewed(section);
  });

  return null;
}
