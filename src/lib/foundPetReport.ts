import { buildWhatsAppHref } from "@/lib/phone";

export type LocationErrorKey = "denied" | "unavailable" | "timeout";
export type FoundPetContact = {
  channel: "whatsapp" | "phone" | "email";
  value: string;
};

export function formatCoordinate(value: number): string {
  return Number.isFinite(value) ? value.toFixed(6) : "";
}

export function buildMapsLocationUrl(latitude: number, longitude: number): string {
  const lat = formatCoordinate(latitude);
  const lng = formatCoordinate(longitude);
  if (!lat || !lng) {
    return "";
  }
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

export function getLocationErrorKey(code: number | null | undefined): LocationErrorKey {
  if (code === 1) return "denied";
  if (code === 3) return "timeout";
  return "unavailable";
}

export const LOCATION_ERROR_COPY: Record<LocationErrorKey, string> = {
  denied: "No diste permiso a la ubicación. Todavía puedes avisar con un mensaje.",
  unavailable: "No pudimos obtener tu ubicación. Puedes seguir sin compartirla.",
  timeout: "La ubicación tardó demasiado. Puedes seguir sin compartirla.",
};

export type FoundPetMessageOptions = {
  petName: string;
  lastZone?: string | null;
  locationUrl?: string | null;
};

export function buildFoundPetMessage({
  petName,
  lastZone,
  locationUrl,
}: FoundPetMessageOptions): string {
  const lines = [`¡Hola! Escaneé el QR de ${petName} y creo que lo encontré.`];
  if (lastZone && lastZone.trim() !== "") {
    lines.push(`Última vez visto cerca de: ${lastZone.trim()}`);
  }
  if (locationUrl && locationUrl.trim() !== "") {
    lines.push(`Mi ubicación actual: ${locationUrl.trim()}`);
  }
  return lines.join("\n");
}

export function updateFoundPetMessageLocation(message: string, locationUrl: string): string {
  const lines = message.split("\n").filter((line) => !line.startsWith("Mi ubicación actual:"));
  const trimmedLines = lines.join("\n").trimEnd();
  if (!locationUrl.trim()) return trimmedLines;
  return [trimmedLines, `Mi ubicación actual: ${locationUrl.trim()}`].filter(Boolean).join("\n");
}

export function buildFoundPetContactHref(contact: FoundPetContact | null, message: string): string {
  const value = contact?.value.trim();
  if (!contact || !value) return "";
  if (contact.channel === "whatsapp") return buildWhatsAppHref(value, message);
  if (contact.channel === "phone") {
    const digits = value.replace(/\D/g, "");
    return digits ? `tel:${digits}` : "";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "";
  const subject = encodeURIComponent("Encontré a tu mascota en PawPass");
  const body = encodeURIComponent(message.trim());
  return `mailto:${value}?subject=${subject}&body=${body}`;
}

export { buildWhatsAppHref };
