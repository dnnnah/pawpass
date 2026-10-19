/**
 * Guardia de "una sola vez" (FASE 8B).
 *
 * Existe por un motivo concreto: en desarrollo, React Strict Mode monta,
 * desmonta y vuelve a montar cada componente para detectar efectos impuros. Un
 * `useEffect(() => track(...), [])` ingenuo emite **dos** eventos por una sola
 * acción de la persona, y en telemetría eso no es un detalle: duplica la
 * medición que se quiere observar.
 *
 * La regla que se aplica en la UI es: lo que se mide es la **acción** (un
 * click, una entrada a una página), nunca el render. Para los eventos de
 * navegación —que no tienen un click detrás— la medición se ata al montaje y se
 * protege con este guardia, de modo que el doble montaje de Strict Mode produce
 * un único evento.
 *
 * Deliberadamente NO lleva reloj ni estado global: decide una vez, para una
 * instancia, y nada más. Un registro global por clave o por tiempo haría
 * imposible testearlo y dejaría memoria viva en la pestaña.
 */
export type OnceGuard = {
  /** Devuelve `true` solo la primera vez. Las siguientes devuelven `false`. */
  claim: () => boolean;
};

export function createOnceGuard(): OnceGuard {
  let claimed = false;

  return {
    claim() {
      if (claimed) return false;
      claimed = true;
      return true;
    },
  };
}
