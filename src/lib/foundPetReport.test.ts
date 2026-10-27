import { describe, expect, it } from "vitest";
import {
  buildFoundPetMessage,
  buildMapsLocationUrl,
  updateFoundPetMessageLocation,
  formatCoordinate,
  getLocationErrorKey,
  LOCATION_ERROR_COPY,
  buildFoundPetContactHref,
} from "./foundPetReport";

describe("formatCoordinate", () => {
  it("formatea coordenadas finitas a 6 decimales", () => {
    expect(formatCoordinate(19.4269673)).toBe("19.426967");
    expect(formatCoordinate(-99.1663812)).toBe("-99.166381");
    expect(formatCoordinate(0)).toBe("0.000000");
  });

  it("devuelve vacío para valores no finitos", () => {
    expect(formatCoordinate(Number.NaN)).toBe("");
    expect(formatCoordinate(Number.POSITIVE_INFINITY)).toBe("");
  });
});

describe("buildMapsLocationUrl", () => {
  it("construye una URL de Google Maps con lat, lng", () => {
    expect(buildMapsLocationUrl(19.426967, -99.166381)).toBe(
      "https://www.google.com/maps?q=19.426967,-99.166381"
    );
  });

  it("devuelve vacío si las coordenadas no son finitas", () => {
    expect(buildMapsLocationUrl(Number.NaN, -99)).toBe("");
    expect(buildMapsLocationUrl(19, Number.POSITIVE_INFINITY)).toBe("");
  });
});

describe("getLocationErrorKey", () => {
  it("mapea códigos de error de geolocalización", () => {
    expect(getLocationErrorKey(1)).toBe("denied");
    expect(getLocationErrorKey(2)).toBe("unavailable");
    expect(getLocationErrorKey(3)).toBe("timeout");
  });

  it("cae a unavailable para códigos desconocidos o ausentes", () => {
    expect(getLocationErrorKey(null)).toBe("unavailable");
    expect(getLocationErrorKey(undefined)).toBe("unavailable");
    expect(getLocationErrorKey(99)).toBe("unavailable");
  });

  it("tiene copia útil para cada estado de error", () => {
    for (const key of ["denied", "unavailable", "timeout"] as const) {
      expect(LOCATION_ERROR_COPY[key].length).toBeGreaterThan(10);
    }
  });
});

describe("buildFoundPetMessage", () => {
  it("arma un mensaje con la zona y la ubicación", () => {
    const message = buildFoundPetMessage({
      petName: "Lucca",
      lastZone: "Parque de la Condesa",
      locationUrl: "https://www.google.com/maps?q=19.4,-99.1",
    });
    expect(message).toContain("Escaneé el QR de Lucca");
    expect(message).toContain("Última vez visto cerca de: Parque de la Condesa");
    expect(message).toContain("Mi ubicación actual: https://www.google.com/maps?q=19.4,-99.1");
  });

  it("omite la línea de zona cuando no hay", () => {
    const message = buildFoundPetMessage({ petName: "Niko" });
    expect(message).toBe("¡Hola! Escaneé el QR de Niko y creo que lo encontré.");
  });

  it("omite la ubicación cuando no se comparte", () => {
    const message = buildFoundPetMessage({ petName: "Niko", lastZone: "Zona X" });
    expect(message).not.toContain("ubicación actual");
    expect(message).toContain("Zona X");
  });
});

describe("updateFoundPetMessageLocation", () => {
  it("agrega GPS al texto revisado sin reemplazar los cambios de la persona", () => {
    expect(updateFoundPetMessageLocation("Encontré a Lucca junto al parque.", "https://maps.example/?q=19,-99"))
      .toBe("Encontré a Lucca junto al parque.\nMi ubicación actual: https://maps.example/?q=19,-99");
  });

  it("reemplaza o quita una línea de ubicación anterior", () => {
    expect(updateFoundPetMessageLocation("Mi texto\nMi ubicación actual: https://old.example", ""))
      .toBe("Mi texto");
  });
});

describe("buildFoundPetContactHref", () => {
  it("prepara WhatsApp solo cuando el canal público elegido es WhatsApp", () => {
    expect(buildFoundPetContactHref({ channel: "whatsapp", value: "5551234567" }, "Encontré a Lucca"))
      .toBe("https://wa.me/525551234567?text=Encontr%C3%A9%20a%20Lucca");
    expect(buildFoundPetContactHref({ channel: "phone", value: "5551234567" }, "Encontré a Lucca"))
      .toBe("tel:5551234567");
  });

  it("incluye el mensaje revisable en un correo sin usar WhatsApp", () => {
    expect(buildFoundPetContactHref({ channel: "email", value: "familia@example.com" }, "Encontré a Lucca"))
      .toBe("mailto:familia@example.com?subject=Encontr%C3%A9%20a%20tu%20mascota%20en%20PawPass&body=Encontr%C3%A9%20a%20Lucca");
  });

  it("no crea destino de contacto para datos vacíos o un canal inválido", () => {
    expect(buildFoundPetContactHref({ channel: "whatsapp", value: "" }, "Hola")).toBe("");
    expect(buildFoundPetContactHref(null, "Hola")).toBe("");
  });
});
