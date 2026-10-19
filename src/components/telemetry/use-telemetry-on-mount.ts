"use client";

import { useEffect, useState } from "react";
import { createMountObserver } from "@/lib/services/telemetry/mount-observer";

/**
 * Emite un evento de telemetría **una vez por montaje**, en el cliente.
 *
 * Tres propiedades, y las tres importan:
 *
 * 1. **Nunca durante SSR.** `useEffect` no se ejecuta al renderizar en
 *    servidor, así que el evento solo existe si alguien abrió la página en un
 *    navegador. No hace falta ninguna comprobación de `window`/`document`.
 * 2. **Una sola vez bajo Strict Mode.** El observador se crea una vez por
 *    instancia y el guardia interno decide. El doble montaje de desarrollo no
 *    duplica el evento. El guardia **no** se reinicia en el cleanup: si se
 *    reiniciara, el segundo pase volvería a medir.
 * 3. **Mide la entrada, no el render.** Se ata al montaje de la sección, que es
 *    exactamente lo que el evento `profile_viewed` significa.
 *
 * El observador vive en `useState` con inicializador perezoso, no en un `ref`:
 * leer un ref durante el render está prohibido (lo veta el compilador de
 * React), y el estado no necesita esa lectura. `useState` llama a la función
 * una sola vez por instancia y devuelve siempre ese mismo observador, que es
 * justo lo que necesita el guardia para reconocer la segunda pasada del
 * efecto. (En Strict Mode el inicializador se invoca dos veces y React
 * descarta uno de los dos observadores; el que sobrevive es el que usan ambos
 * pases del efecto.)
 *
 * `emit` va en las dependencias para que el hook sea honesto ante el linter,
 * pero eso no provoca re-emisión: el guardia, no las dependencias, es lo que
 * decide que ocurra una sola vez.
 *
 * **Ubicación (FASE 9B).** Este hook vive en la capa de UI, no en
 * `lib/services/telemetry/`, porque es la única pieza que necesita React: la
 * fábrica que decide cuándo medir (`createMountObserver`) sí es lógica pura y
 * sigue en services, junto al resto de la capa. Dejar el binding de React
 * dentro de services rompía el guardián de dirección de dependencias de
 * FASE 9A, que exige que services no dependa de ningún framework.
 */
export function useTelemetryOnMount(emit: () => void): void {
  const [observer] = useState(createMountObserver);

  useEffect(() => {
    observer(emit);
  }, [observer, emit]);
}
