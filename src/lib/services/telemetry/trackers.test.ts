import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { telemetryClient } from "@/lib/infra/telemetry/noop-client";
import { isValidTelemetryEvent } from "@/lib/domain/telemetry/validators";
import { TELEMETRY_EVENT_CATALOG } from "@/lib/domain/telemetry/catalog";
import type { TelemetryEvent, TelemetryEventName } from "@/lib/domain/telemetry/events";
import {
  trackAdoptionRequestStarted,
  trackEmergencyActionStarted,
  trackFoundPetFlowStarted,
  trackProfileViewed,
  trackQrGenerated,
  trackRegistrationCompleted,
  trackRegistrationStarted,
} from "./trackers";

/**
 * Los trackers emiten a través del `telemetryClient` que ya exporta la capa de
 * infraestructura. Espiarla es lo que permite observar qué sale de la UI sin
 * tocar el adaptador: el spy intercepta la llamada y el no-op sigue en su sitio.
 */
let track: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  track = vi.spyOn(telemetryClient, "track").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

function lastEvent(): TelemetryEvent {
  expect(track).toHaveBeenCalledTimes(1);
  return track.mock.calls[0][0] as TelemetryEvent;
}

describe("fachada de trackers: evento y contexto correctos", () => {
  it("registration_started", () => {
    trackRegistrationStarted("onboarding");
    expect(lastEvent()).toMatchObject({
      name: "registration_started",
      context: { flow: "onboarding" },
    });
  });

  it("registration_started por defecto es el alta manual", () => {
    trackRegistrationStarted();
    expect(lastEvent()).toMatchObject({ context: { flow: "manual" } });
  });

  it("registration_completed transporta si tuvo éxito, no qué pasó", () => {
    trackRegistrationCompleted("manual", false);
    expect(lastEvent()).toMatchObject({
      name: "registration_completed",
      context: { flow: "manual", success: false },
    });
  });

  it("qr_generated", () => {
    trackQrGenerated("share");
    expect(lastEvent()).toMatchObject({ name: "qr_generated", context: { source: "share" } });
  });

  it("qr_generated por defecto es desde el perfil", () => {
    trackQrGenerated();
    expect(lastEvent()).toMatchObject({ context: { source: "profile" } });
  });

  it("profile_viewed", () => {
    trackProfileViewed("public");
    expect(lastEvent()).toMatchObject({ name: "profile_viewed", context: { section: "public" } });
  });

  it("emergency_action_started", () => {
    trackEmergencyActionStarted("call");
    expect(lastEvent()).toMatchObject({
      name: "emergency_action_started",
      context: { action: "call" },
    });
  });

  it("found_pet_flow_started", () => {
    trackFoundPetFlowStarted("started");
    expect(lastEvent()).toMatchObject({
      name: "found_pet_flow_started",
      context: { step: "started" },
    });
  });

  it("adoption_request_started", () => {
    trackAdoptionRequestStarted("form");
    expect(lastEvent()).toMatchObject({
      name: "adoption_request_started",
      context: { section: "form" },
    });
  });
});

describe("lo que emite la fachada cumple el contrato", () => {
  const EVERY_TRACKER: Array<[string, () => void]> = [
    ["registration_started", () => trackRegistrationStarted("import")],
    ["registration_completed", () => trackRegistrationCompleted("import", true)],
    ["qr_generated", () => trackQrGenerated("preview")],
    ["profile_viewed", () => trackProfileViewed("print")],
    ["emergency_action_started", () => trackEmergencyActionStarted("share")],
    ["found_pet_flow_started", () => trackFoundPetFlowStarted("shared")],
    ["adoption_request_started", () => trackAdoptionRequestStarted("detail")],
  ];

  it("cubre el catálogo completo sin dejar eventos huérfanos", () => {
    expect(EVERY_TRACKER.map(([name]) => name).sort()).toEqual(
      TELEMETRY_EVENT_CATALOG.map((spec) => spec.name).sort(),
    );
  });

  for (const [name, run] of EVERY_TRACKER) {
    it(`${name} es válido y solo lleva nombre, timestamp y contexto`, () => {
      run();
      const event = lastEvent();

      expect(isValidTelemetryEvent(event)).toBe(true);
      expect(Object.keys(event).sort()).toEqual(["context", "name", "timestamp"]);
      expect(typeof event.timestamp).toBe("number");
    });
  }
});

describe("la fachada no introduce datos personales", () => {
  const FORBIDDEN_KEYS = [
    "petId",
    "pet_id",
    "slug",
    "url",
    "profileUrl",
    "ownerId",
    "ownerName",
    "nombre",
    "name",
    "phone",
    "telefono",
    "email",
    "address",
    "direccion",
    "latitude",
    "longitude",
    "location",
    "message",
    "mensaje",
    "motivo",
    "notes",
    "token",
    "sessionId",
    "ip",
    "userAgent",
  ];

  it("ningún evento de la fachada contiene claves de identidad", () => {
    trackRegistrationStarted("onboarding");
    trackRegistrationCompleted("onboarding", true);
    trackQrGenerated("profile");
    trackProfileViewed("public");
    trackEmergencyActionStarted("call");
    trackFoundPetFlowStarted("started");
    trackAdoptionRequestStarted("form");

    expect(track).toHaveBeenCalledTimes(7);

    for (const call of track.mock.calls) {
      const event = call[0] as TelemetryEvent;
      // `name` es la clave del discriminante del evento, no un dato: la lista
      // prohibitive se aplica al contexto, que es donde aparecería la PII.
      const contextKeys = Object.keys(event.context);

      for (const key of contextKeys) {
        expect(FORBIDDEN_KEYS, `clave sospechosa en ${event.name}: ${key}`).not.toContain(key);
      }
    }
  });

  it("el contexto solo tiene las claves que el catálogo declara para ese evento", () => {
    for (const [name, run] of [
      ["registration_started", () => trackRegistrationStarted()],
      ["qr_generated", () => trackQrGenerated()],
      ["profile_viewed", () => trackProfileViewed("public")],
      ["emergency_action_started", () => trackEmergencyActionStarted("call")],
      ["found_pet_flow_started", () => trackFoundPetFlowStarted("started")],
      ["adoption_request_started", () => trackAdoptionRequestStarted("form")],
    ] as Array<[TelemetryEventName, () => void]>) {
      run();
      const event = track.mock.calls[track.mock.calls.length - 1][0] as TelemetryEvent;
      const declared = TELEMETRY_EVENT_CATALOG.find((spec) => spec.name === name)?.contains ?? [];

      // El timestamp no es un campo del contexto: se compara contra las claves
      // de contexto declaradas, no contra `contains` tal cual.
      const contextKeys = Object.keys(event.context);
      const declaredContextKeys = declared.filter((field) => field !== "timestamp");

      expect(contextKeys.sort(), `claves de contexto inesperadas en ${name}`).toEqual(
        declaredContextKeys.sort(),
      );
    }
  });
});

describe("la fachada no rompe con el adaptador no-op", () => {
  it("no lanza, no hace fetch, no escribe y no loguea con el cliente real", () => {
    vi.restoreAllMocks();
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const storage: Record<string, string> = {};
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => storage[k] ?? null,
      setItem: (k: string, v: string) => {
        storage[k] = v;
      },
      removeItem: (k: string) => {
        delete storage[k];
      },
      clear: () => {
        for (const k of Object.keys(storage)) delete storage[k];
      },
    });

    expect(() => {
      trackRegistrationStarted();
      trackRegistrationCompleted();
      trackQrGenerated();
      trackProfileViewed("public");
      trackEmergencyActionStarted("call");
      trackFoundPetFlowStarted("started");
      trackAdoptionRequestStarted("form");
    }).not.toThrow();

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(logSpy).not.toHaveBeenCalled();
    expect(Object.keys(storage)).toEqual([]);

    vi.unstubAllGlobals();
  });

  it("funciona sin conexión: el adaptador no-op no depende de la red", () => {
    vi.restoreAllMocks();
    // Sin `window`, sin `navigator.onLine` y sin reloj de navegador: es el peor
    // caso (nodo puro, offline) y aun así tiene que ser inocuo.
    expect(typeof globalThis.window).toBe("undefined");

    expect(() => {
      trackProfileViewed("public");
      trackQrGenerated("profile");
      trackEmergencyActionStarted("share");
    }).not.toThrow();
  });

  it("no persiste nada para reenviar más tarde: no hay cola offline", () => {
    vi.restoreAllMocks();
    // La persistencia de eventos es una decisión de infraestructura que aún no
    // existe. Si algún día se añade, este test es el que hay que cambiar a
    // propósito, no por descuido.
    const setItem = vi.fn();
    vi.stubGlobal("localStorage", { getItem: () => null, setItem, removeItem: vi.fn(), clear: vi.fn() });

    trackFoundPetFlowStarted("started");
    trackAdoptionRequestStarted("form");

    expect(setItem).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
