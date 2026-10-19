import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { telemetryClient } from "@/lib/infra/telemetry/noop-client";
import { getPetByIdAny } from "@/lib/services/pets/queries";
import { createMountObserver } from "./mount-observer";
import * as trackModule from "./trackers";
import { ProfileViewTracker } from "@/components/telemetry/ProfileViewTracker";
import { AdoptionRequestForm } from "@/components/features/adoption/AdoptionRequestForm";
import { EmergencyContact } from "@/components/features/pet-profile/EmergencyContact";
import { QRShareCard } from "@/components/features/pet-profile/QRShareCard";
import { FoundPetPanel } from "@/components/features/lost-pet/FoundPetPanel";

/**
 * Integración de la telemetría con los flujos reales (FASE 8B).
 *
 * Dos cosas hacen que estos tests sean distintos de los del core:
 *
 * - **SSR de verdad.** Los componentes se renderizan con
 *   `renderToStaticMarkup`, que es exactamente lo que hace Next.js en el
 *   servidor. Ninguna telemetría puede salir de ahí.
 * - **Los tests corren sin DOM.** El repositorio usa `environment: "node"` y no
 *   hay jsdom ni Testing Library, así que no se puede hacer clic en un botón.
 *   El cableado de cada flujo se verifica leyendo el código de la UI y
 *   localizando la llamada al tracker dentro del manejador correcto. Es una
 *   prueba más débil que un clic real, y el smoke manual en el navegador es la
 *   que cierra ese hueco.
 */

let track: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  track = vi.spyOn(telemetryClient, "track").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

function read(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

/**
 * Extrae el cuerpo de una función por nombre. Hay dos formas en estos
 * archivos —declaración `function` y `const x = useCallback(() => …)`— y en
 * ambas hace falta saltar la lista de parámetros, que va desestructurada y cuya
 * llave de apertura no es la del cuerpo.
 *
 * Sirve para afirmar *dónde* se llama a un tracker: que `qr_generated` salga de
 * la descarga y no de "copiar URL" no se puede comprobar contando coincidencias
 * en el archivo entero.
 */
function functionBody(source: string, name: string): string {
  const declaration = new RegExp(`function\\s+${name}\\s*\\(`).exec(source);

  if (declaration) {
    const paramsStart = source.indexOf("(", declaration.index);
    let parens = 0;

    for (let i = paramsStart; i < source.length; i += 1) {
      if (source[i] === "(") parens += 1;
      if (source[i] === ")") {
        parens -= 1;
        if (parens === 0) {
          const bodyStart = source.indexOf("{", i);
          if (bodyStart === -1) throw new Error(`sin cuerpo: ${name}`);
          return braceBlock(source, bodyStart, name);
        }
      }
    }

    throw new Error(`paréntesis sin cerrar en ${name}`);
  }

  const arrow = new RegExp(`\\bconst\\s+${name}\\s*=`).exec(source);
  if (arrow) {
    const fatArrow = source.indexOf("=>", arrow.index);
    if (fatArrow === -1) throw new Error(`sin flecha: ${name}`);
    const bodyStart = source.indexOf("{", fatArrow);
    if (bodyStart === -1) throw new Error(`sin cuerpo: ${name}`);
    return braceBlock(source, bodyStart, name);
  }

  throw new Error(`no se encontró la función ${name} en el archivo`);
}

function braceBlock(source: string, start: number, name: string): string {
  let depth = 0;

  for (let i = start; i < source.length; i += 1) {
    if (source[i] === "{") depth += 1;
    if (source[i] === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }

  throw new Error(`llaves sin cerrar en ${name}`);
}

/** El JSX que el componente devuelve: lo que se pinta en pantalla. */
function returnedJsx(source: string, name: string): string {
  const body = functionBody(source, name);
  const start = body.lastIndexOf("return (");
  if (start === -1) throw new Error(`${name} no devuelve JSX entre paréntesis`);
  return body.slice(start);
}

const QR_CARD = "src/components/features/pet-profile/QRShareCard.tsx";
const EMERGENCY = "src/components/features/pet-profile/EmergencyContact.tsx";
const FOUND_PET = "src/components/features/lost-pet/FoundPetPanel.tsx";
const ADOPTION_FORM = "src/components/features/adoption/AdoptionRequestForm.tsx";

describe("SSR: renderizar en el servidor no emite nada", () => {
  it("ProfileViewTracker se renderiza sin emitir (los efectos no corren en servidor)", () => {
    const html = renderToStaticMarkup(createElement(ProfileViewTracker, { section: "public" }));

    expect(html).toBe("");
    expect(track).not.toHaveBeenCalled();
  });

  it("el bloque de emergencia se renderiza sin emitir", () => {
    const html = renderToStaticMarkup(
      createElement(EmergencyContact, {
        contact: {
          name: "Donnovan Trejo",
          phone: "56 5609 1856",
          phoneHref: "5656091856",
          whatsapp: "https://wa.me/525656091856",
          neighborhood: "Parque de la Condesa",
        },
        isLost: true,
        petName: "Lucca",
      }),
    );

    expect(html).toContain("Llamar");
    expect(track).not.toHaveBeenCalled();
  });

  it("el panel de mascota encontrada se renderiza sin emitir", () => {
    const html = renderToStaticMarkup(
      createElement(FoundPetPanel, {
        petName: "Lucca",
        lastZone: "Parque de la Condesa",
        whatsappNumber: "525656091856",
      }),
    );

    expect(html).toContain("Encontré esta mascota");
    expect(track).not.toHaveBeenCalled();
  });

  it("el formulario de adopción se renderiza sin emitir", () => {
    const pet = getPetByIdAny("lucca");
    if (!pet) throw new Error("falta la mascota de prueba");

    const html = renderToStaticMarkup(createElement(AdoptionRequestForm, { pet }));

    expect(html).toContain("Enviar solicitud");
    expect(track).not.toHaveBeenCalled();
  });

  it("la tarjeta del QR se renderiza sin emitir: mostrar no es generar", () => {
    const html = renderToStaticMarkup(
      createElement(QRShareCard, {
        petName: "Lucca",
        profileUrl: "https://petcarnet.app/perfil/PC-LUCCA-001",
        petCode: "PC-LUCCA-001",
      }),
    );

    expect(html).toContain("Descargar PNG");
    expect(track).not.toHaveBeenCalled();
  });
});

describe("Strict Mode: una entrada, un evento", () => {
  it("el doble montaje del tracker de perfil produce un solo profile_viewed", () => {
    const { trackProfileViewed } = trackModule;
    const observer = createMountObserver();

    // Reproduce lo que hace el hook `useTelemetryOnMount`: una instancia de
    // observador y el efecto ejecutado dos veces por el doble montaje.
    observer(() => {
      trackProfileViewed("public");
    });
    observer(() => {
      trackProfileViewed("public");
    });

    expect(track).toHaveBeenCalledTimes(1);
    expect(track.mock.calls[0][0]).toMatchObject({
      name: "profile_viewed",
      context: { section: "public" },
    });
  });

  it("el guardián no se reinicia al desmontar: si se reiniciara, duplicaría", () => {
    const observer = createMountObserver();
    let emissions = 0;
    const emit = () => {
      emissions += 1;
    };

    observer(emit);
    // React ejecuta el cleanup del efecto y vuelve a lanzar. Aquí no hay cleanup
    // que tocar; lo que importa es que una segunda pasada no vuelva a medir.
    observer(emit);
    observer(emit);

    expect(emissions).toBe(1);
  });

  it("volver a entrar en la página vuelve a medir: es otra entrada", () => {
    createMountObserver()(() => trackModule.trackProfileViewed("public"));
    createMountObserver()(() => trackModule.trackProfileViewed("public"));

    expect(track).toHaveBeenCalledTimes(2);
  });
});

describe("flujo de QR: qr_generated solo al producir el archivo", () => {
  it("se emite en la descarga PNG", () => {
    const body = functionBody(read(QR_CARD), "handleDownloadPng");
    expect(body).toContain('trackQrGenerated("profile")');
  });

  it("se emite en la exportación SVG", () => {
    const body = functionBody(read(QR_CARD), "handleDownloadSvg");
    expect(body).toContain('trackQrGenerated("profile")');
  });

  it("NO se emite al copiar la URL ni al copiar el ID", () => {
    const body = functionBody(read(QR_CARD), "handleCopy");
    expect(body).not.toContain("trackQrGenerated");
  });

  it("NO se emite al renderizar el QR en pantalla", () => {
    // El <QRCodeSVG> se dibuja en cada render y en cada visita. Si el evento
    // saliera de ahí, una sola visita contaría varias "generaciones".
    const jsx = returnedJsx(read(QR_CARD), "QRShareCard");
    expect(jsx).toContain("QRCodeSVG");
    expect(jsx).not.toContain("trackQrGenerated");
  });

  it("la tarjeta emite exactamente dos veces: PNG y SVG", () => {
    const matches = read(QR_CARD).match(/trackQrGenerated\(/g) ?? [];
    expect(matches).toHaveLength(2);
  });
});

describe("flujo de emergencia: emergency_action_started en la acción", () => {
  it("registra la llamada y el WhatsApp, y nada más", () => {
    const body = functionBody(read(EMERGENCY), "EmergencyContact");

    expect(body).toContain('trackEmergencyActionStarted("call")');
    expect(body).toContain('trackEmergencyActionStarted("share")');
    expect(body.match(/trackEmergencyActionStarted\(/g)).toHaveLength(2);
  });

  it("no mide la apertura de la sección: la emergencia siempre está visible", () => {
    // No existe un "abrir emergencia" que medir: el bloque se pinta siempre en
    // el perfil. Emitir en el montaje contaría visitas, no acciones.
    const body = functionBody(read(EMERGENCY), "EmergencyContact");
    expect(body).not.toContain("useEffect");
    expect(body).not.toContain("useTelemetryOnMount");
  });

  it("el mismo enlace no se mide dos veces por pasar por varios componentes", () => {
    // EmergencyContactSection envuelve a EmergencyContact; solo el interior
    // mide, para que un clic no genere dos eventos.
    expect(read(EMERGENCY)).toContain("trackEmergencyActionStarted");
    expect(read("src/components/features/pet-profile/EmergencyContactSection.tsx")).not.toContain(
      "trackEmergencyActionStarted",
    );
  });
});

describe("flujo de mascota encontrada: found_pet_flow_started al abrir", () => {
  it("se emite dentro de openFlow, que es el clic de arranque", () => {
    const body = functionBody(read(FOUND_PET), "openFlow");
    expect(body).toContain('trackFoundPetFlowStarted("started")');
  });

  it("no espera a que el formulario se complete", () => {
    // handleSubmit no existe: el flujo no tiene envío propio, manda a WhatsApp.
    // El evento de arranque no puede estar atado a nada de eso.
    expect(functionBody(read(FOUND_PET), "handleCopyMessage")).not.toContain(
      "trackFoundPetFlowStarted",
    );
  });

  it("no mide la ubicación: compartirla no es parte del arranque", () => {
    const body = functionBody(read(FOUND_PET), "handleShareLocation");
    expect(body).not.toContain("track");
  });
});

describe("flujo de adopción: adoption_request_started al entrar al formulario", () => {
  it("se emite una vez al montar, no en cada render", () => {
    const body = functionBody(read(ADOPTION_FORM), "AdoptionRequestForm");

    expect(body).toContain('trackAdoptionRequestStarted("form")');
    expect(body).toContain("useTelemetryOnMount");
  });

  it("el clic del CTA no mide: el formulario ya mide al abrirse", () => {
    // Si los dos midieran, una intención de adoptar contaría como dos
    // inicios de solicitud.
    const cta = read("src/components/features/adoption/AdoptionRequestCta.tsx");
    expect(cta).not.toContain("trackAdoptionRequestStarted");
  });

  it("no mide el envío: el evento es de arranque, no de resultado", () => {
    const body = functionBody(read(ADOPTION_FORM), "handleSubmit");
    expect(body).not.toContain("trackAdoptionRequestStarted");
  });
});

describe("flujo de perfil: profile_viewed en las secciones del perfil", () => {
  const PROFILE_PAGES: Array<[string, string]> = [
    ["src/app/perfil/[id]/page.tsx", "public"],
    ["src/app/perfil/[id]/salud/page.tsx", "private"],
    ["src/app/perfil/[id]/vacunas/page.tsx", "private"],
    ["src/app/perfil/[id]/documentos/page.tsx", "private"],
    ["src/app/perfil/[id]/carnet/page.tsx", "print"],
  ];

  for (const [page, section] of PROFILE_PAGES) {
    it(`${page} mide la sección "${section}"`, () => {
      expect(read(page)).toContain(`<ProfileViewTracker section="${section}" />`);
    });
  }

  it("las páginas que no son un perfil no miden", () => {
    // La home, el catálogo de adopciones, los refugios y el login no son
    // visualizaciones de perfil. Poner el tracker en AppShell los contaría.
    for (const page of [
      "src/app/page.tsx",
      "src/app/adopciones/page.tsx",
      "src/app/refugios/[id]/page.tsx",
      "src/app/login/page.tsx",
      "src/app/perfil/[id]/adopcion/page.tsx",
      "src/app/perfil/[id]/alerta/page.tsx",
    ]) {
      expect(read(page), page).not.toContain("ProfileViewTracker");
    }
  });

  it("el tracker no se cuelga de AppShell, que también envuelve las no-perfil", () => {
    expect(read("src/components/layout/AppShell.tsx")).not.toContain("ProfileViewTracker");
  });
});

describe("eventos que todavía no deben existir", () => {
  const UI_FILES = [
    QR_CARD,
    EMERGENCY,
    FOUND_PET,
    ADOPTION_FORM,
    "src/components/telemetry/ProfileViewTracker.tsx",
    "src/app/perfil/[id]/page.tsx",
    "src/app/perfil/[id]/salud/page.tsx",
    "src/app/perfil/[id]/vacunas/page.tsx",
    "src/app/perfil/[id]/documentos/page.tsx",
    "src/app/perfil/[id]/carnet/page.tsx",
  ];

  it("la UI no emite eventos de registro: el flujo no existe", () => {
    for (const file of UI_FILES) {
      expect(read(file), file).not.toContain("trackRegistrationStarted");
      expect(read(file), file).not.toContain("trackRegistrationCompleted");
    }
  });

  it("la UI no emite qr_scan: el protocolo experimental sigue sin definirse", () => {
    for (const file of UI_FILES) {
      expect(read(file), file).not.toContain("qr_scan");
    }
  });

  it("el contrato no acepta qr_scan ni ningún otro evento fuera del catálogo", async () => {
    const { isValidTelemetryEvent } = await import("@/lib/domain/telemetry/validators");
    expect(isValidTelemetryEvent({ name: "qr_scan", timestamp: 1, context: { source: "camara" } })).toBe(
      false,
    );
  });
});
