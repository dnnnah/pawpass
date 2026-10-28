import { describe, expect, it, vi } from "vitest";
import { subscribeToLostDirectoryHistoryNavigation } from "./lostDirectoryHistory";

describe("actualización de perdidas al volver y avanzar", () => {
  it("pide datos nuevos cuando Atrás o Adelante restaura /perdidas", () => {
    const events = new EventTarget();
    const refresh = vi.fn();
    let pathname = "/perfil/PC-LUCCA-001";
    const unsubscribe = subscribeToLostDirectoryHistoryNavigation(events, () => pathname, refresh);

    pathname = "/perdidas";
    events.dispatchEvent(new Event("popstate"));
    events.dispatchEvent(new Event("popstate"));

    expect(refresh).toHaveBeenCalledTimes(2);
    unsubscribe();
    events.dispatchEvent(new Event("popstate"));
    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it("no refresca otras rutas en historial", () => {
    const events = new EventTarget();
    const refresh = vi.fn();
    subscribeToLostDirectoryHistoryNavigation(events, () => "/cuenta", refresh);
    events.dispatchEvent(new Event("popstate"));
    expect(refresh).not.toHaveBeenCalled();
  });
});
