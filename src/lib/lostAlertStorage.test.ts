import { beforeEach, describe, expect, it } from "vitest";
import {
  invalidateLostAlertCache,
  readLostAlert,
  writeLostAlert,
  type StorageLike,
} from "@/lib/lostAlertStorage";

function createMemoryStorage(initial: Record<string, string> = {}): StorageLike {
  const store = new Map(Object.entries(initial));
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, value);
    },
    removeItem: (key) => {
      store.delete(key);
    },
  };
}

beforeEach(() => {
  invalidateLostAlertCache();
});

describe("readLostAlert", () => {
  it("devuelve null cuando no hay datos en storage", () => {
    const storage = createMemoryStorage();
    expect(readLostAlert(storage, "pawpass-alerta:v1:lucca")).toBeNull();
  });

  it("lee y valida un payload JSON válido", () => {
    const storage = createMemoryStorage({
      "pawpass-alerta:v1:lucca": JSON.stringify({ active: true, zonaPerdida: "Parque" }),
    });
    expect(readLostAlert(storage, "pawpass-alerta:v1:lucca")).toEqual({
      active: true,
      zonaPerdida: "Parque",
    });
  });

  it("devuelve null ante JSON corrupto", () => {
    const storage = createMemoryStorage({
      "pawpass-alerta:v1:lucca": "{not-json",
    });
    expect(readLostAlert(storage, "pawpass-alerta:v1:lucca")).toBeNull();
  });

  it("devuelve null ante un payload con forma inválida", () => {
    const storage = createMemoryStorage({
      "pawpass-alerta:v1:lucca": JSON.stringify({ active: false, zonaPerdida: "Parque" }),
    });
    expect(readLostAlert(storage, "pawpass-alerta:v1:lucca")).toBeNull();
  });

  it("tolera storage que lanza en lectura (bloqueado/modo privado)", () => {
    const blocked: StorageLike = {
      getItem: () => {
        throw new Error("SecurityError");
      },
      setItem: () => {
        throw new Error("SecurityError");
      },
      removeItem: () => {
        throw new Error("SecurityError");
      },
    };
    expect(readLostAlert(blocked, "pawpass-alerta:v1:lucca")).toBeNull();
  });

  it("acepta storage null o undefined y devuelve null", () => {
    expect(readLostAlert(null, "pawpass-alerta:v1:lucca")).toBeNull();
    expect(readLostAlert(undefined, "pawpass-alerta:v1:lucca")).toBeNull();
  });
});

describe("writeLostAlert", () => {
  it("persiste el payload y vuelve a leerse sin storage (fallback en memoria)", () => {
    const storage = createMemoryStorage();
    const key = "pawpass-alerta:v1:lucca";
    writeLostAlert(storage, key, { active: true, mensaje: "Ayuda" });

    expect(readLostAlert(storage, key)).toEqual({ active: true, mensaje: "Ayuda" });
    expect(storage.getItem(key)).toContain("Ayuda");
  });

  it("escribe JSON serializable al storage", () => {
    const storage = createMemoryStorage();
    const key = "pawpass-alerta:v1:lucca";
    writeLostAlert(storage, key, { active: true, recompensa: 100 });
    expect(storage.getItem(key)).toBe('{"active":true,"recompensa":100}');
  });

  it("removeItem cuando se escribe null", () => {
    const key = "pawpass-alerta:v1:lucca";
    const storage = createMemoryStorage({
      [key]: JSON.stringify({ active: true }),
    });
    writeLostAlert(storage, key, null);
    expect(storage.getItem(key)).toBeNull();
    expect(readLostAlert(storage, key)).toBeNull();
  });

  it("conserva el estado en memoria aunque el storage falle al escribir", () => {
    const blocked: StorageLike = {
      getItem: () => null,
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
      removeItem: () => undefined,
    };
    const key = "pawpass-alerta:v1:lucca";

    writeLostAlert(blocked, key, { active: true, zonaPerdida: "Parque" });
    expect(readLostAlert(blocked, key)).toEqual({ active: true, zonaPerdida: "Parque" });
  });

  it("mantiene el fallback en memoria aunque la lectura use otra instancia de storage", () => {
    const blocked: StorageLike = {
      getItem: () => {
        throw new Error("SecurityError");
      },
      setItem: () => {
        throw new Error("SecurityError");
      },
      removeItem: () => undefined,
    };

    const key = "pawpass-alerta:v1:lucca";
    writeLostAlert(null, key, { active: true, mensaje: "Mensaje en memoria" });
    expect(readLostAlert(blocked, key)).toEqual({ active: true, mensaje: "Mensaje en memoria" });
  });
});

describe("invalidateLostAlertCache", () => {
  it("invalida una clave y vuelve a leer del storage", () => {
    const key = "pawpass-alerta:v1:lucca";
    const storage = createMemoryStorage({
      [key]: JSON.stringify({ active: true, zonaPerdida: "Primera" }),
    });

    expect(readLostAlert(storage, key)).toEqual({ active: true, zonaPerdida: "Primera" });

    storage.setItem(key, JSON.stringify({ active: true, zonaPerdida: "Segunda" }));
    invalidateLostAlertCache(key);
    expect(readLostAlert(storage, key)).toEqual({ active: true, zonaPerdida: "Segunda" });
  });

  it("sin argumentos limpia toda la caché en memoria", () => {
    const key = "pawpass-alerta:v1:lucca";
    writeLostAlert(null, key, { active: true });
    expect(readLostAlert(null, key)).toEqual({ active: true });

    invalidateLostAlertCache();
    expect(readLostAlert(null, key)).toBeNull();
  });
});