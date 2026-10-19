import { createOnceGuard } from "./once-guard";

/**
 * Observador de montaje: ejecuta `emit` **una sola vez por montaje**, aunque
 * React ejecute el efecto más de una vez (Strict Mode en desarrollo).
 *
 * Se separa del hook `useTelemetryOnMount` a propósito. El hook necesita React
 * y los tests de este repositorio corren en entorno `node`, sin DOM: al dejar
 * la decisión ("¿ya emití?") en una función sin dependencias, la garantía se
 * puede comprobar directamente, sin montar nada.
 *
 * `emit` se recibe en cada llamada y no se guarda. Guardarlo dejaría al
 * observador apuntando al closure de un render anterior, que es la forma
 * habitual de que un valor stale se cuele en la telemetría.
 */
export type MountObserver = (emit: () => void) => void;

export function createMountObserver(): MountObserver {
  const guard = createOnceGuard();

  return (emit) => {
    if (guard.claim()) emit();
  };
}
