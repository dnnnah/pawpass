import { describe, expect, it, vi } from "vitest";
import { createOnceGuard } from "./once-guard";
import { createMountObserver } from "./mount-observer";

describe("createOnceGuard", () => {
  it("concede el claim una sola vez", () => {
    const guard = createOnceGuard();

    expect(guard.claim()).toBe(true);
    expect(guard.claim()).toBe(false);
    expect(guard.claim()).toBe(false);
  });

  it("mantiene instancias independientes", () => {
    const a = createOnceGuard();
    const b = createOnceGuard();

    expect(a.claim()).toBe(true);
    expect(b.claim()).toBe(true);
    expect(a.claim()).toBe(false);
  });
});

describe("createMountObserver (una medición por montaje)", () => {
  it("emite una sola vez aunque se invoque dos veces, como hace Strict Mode", () => {
    const observer = createMountObserver();
    const emit = vi.fn();

    // React 18/19 en desarrollo monta, desmonta y vuelve a montar: el efecto
    // se ejecuta dos veces sobre la misma instancia. Las dos llamadas de aquí
    // son exactamente eso.
    observer(emit);
    observer(emit);

    expect(emit).toHaveBeenCalledTimes(1);
  });

  it("sigue emitiendo solo una vez tras muchas re-ejecuciones del efecto", () => {
    const observer = createMountObserver();
    const emit = vi.fn();

    for (let i = 0; i < 10; i += 1) observer(emit);

    expect(emit).toHaveBeenCalledTimes(1);
  });

  it("emite una vez por entrada: un observador nuevo es una entrada nueva", () => {
    const first = vi.fn();
    const second = vi.fn();

    createMountObserver()(first);
    createMountObserver()(second);

    // Volver a la página remonta el componente y, con él, el observador: la
    // segunda visita sí se cuenta.
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("recibe el callback en cada llamada y no guarda uno de un render anterior", () => {
    const observer = createMountObserver();
    const first = vi.fn();
    const second = vi.fn();

    observer(first);
    observer(second);

    // El segundo callback queda sin usar: la garantía es "una vez por montaje",
    // no "la última función gana".
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).not.toHaveBeenCalled();
  });

  it("no ejecuta nada cuando el callback lanza: la guardia ya está consumida", () => {
    const observer = createMountObserver();
    const emit = vi.fn(() => {
      throw new Error("boom");
    });

    expect(() => observer(emit)).toThrow("boom");
    expect(() => observer(emit)).not.toThrow();
    expect(emit).toHaveBeenCalledTimes(1);
  });
});
