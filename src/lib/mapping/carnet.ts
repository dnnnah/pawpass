/**
 * Mapeo de presentación del Carnet Físico (FASE 6 UI).
 *
 * Capa: mapping / view model. Adapta el modelo de dominio `PhysicalPetCard`
 * a etiquetas y metadatos de presentación listos para los componentes.
 * No reimplementa ninguna regla de negocio: el estado efectivo, la URL
 * pública (QR), el contacto/WhatsApp y el resumen sanitario ya vienen
 * resueltos por el Core.
 *
 * Los labels de estado reutilizan `getPetStatusMeta` (Fase 3); aquí solo se
 * proyectan junto con metadatos de formato y fechas legibles.
 */

import { formatMexicanDate } from "@/lib/dateFormat";
import { isVaccineStatus } from "@/lib/domain/vaccine";
import { getVaccineStatusMeta } from "@/lib/mapping/vaccineStatus";
import { getPetStatusMeta } from "@/lib/mapping/petStatusPresentation";
import type {
  PhysicalPetCard,
  PhysicalPetCardFormato,
  PhysicalPetCardOrientacion,
} from "@/types/carnet";

export const CARNET_FORMATO_LABELS: Record<PhysicalPetCardFormato, string> = {
  tarjeta_imprimible: "Tarjeta imprimible",
  credencial: "Credencial",
  placa_dije: "Placa / dije",
};

export const CARNET_ORIENTACION_LABELS: Record<PhysicalPetCardOrientacion, string> = {
  vertical: "Vertical",
  horizontal: "Horizontal",
};

export const CARNET_FORMATO_DESCRIPTIONS: Record<PhysicalPetCardFormato, string> = {
  tarjeta_imprimible: "Hoja imprimible: la mascota, su QR y sus datos en una sola ficha.",
  credencial: "Doble cara compacta, ideal para cartera o collar.",
  placa_dije: "Cara de placa: foco en el QR, el código y el contacto de emergencia.",
};

/** Fecha ISO a formato legible es-MX (o null si es inválida). */
export function formatCarnetDate(date: string | null | undefined): string | null {
  if (!date) {
    return null;
  }
  return formatMexicanDate(date) ?? null;
}

/** Presenta un peso en kilogramos sin inventar unidades ni valores. */
export function formatCarnetPeso(pesoKg: number | null): string | null {
  return pesoKg === null || !Number.isFinite(pesoKg) ? null : `${pesoKg} kg`;
}

export function labelsEspecieRaza(especie: string, raza: string | null): string | null {
  const parts = [especie, raza].filter((part): part is string => typeof part === "string" && part.trim() !== "");
  return parts.length > 0 ? parts.join(" · ") : null;
}

export type CarnetVaccineBadge = {
  label: string;
  /** Tono semántico; la capa de UI lo resuelve con `resolveTone`. */
  tone: string;
};

/** Etiqueta legible del estatus de vacuna en el carnet (nunca el código crudo). */
export function carnetVaccineBadge(estatus: string | null): CarnetVaccineBadge {
  if (estatus && isVaccineStatus(estatus)) {
    const meta = getVaccineStatusMeta(estatus);
    return { label: meta.label, tone: meta.tone };
  }
  return { label: "Sin estado", tone: "muted" };
}

export type CarnetViewModel = {
  /** Metadatos visuales (label, tono, ícono) del estado efectivo. */
  statusMeta: ReturnType<typeof getPetStatusMeta>;
  formato: PhysicalPetCardFormato;
  orientacion: PhysicalPetCardOrientacion;
  formatoLabel: string;
  orientacionLabel: string;
  formatoDescription: string;
  generadoEn: string | null;
  fechaPerdida: string | null;
  vacunasCount: number;
  desparasitacionesCount: number;
  historialCount: number;
  hasPhone: boolean;
  hasWhatsapp: boolean;
  tieneSalud: boolean;
};

export function toCarnetViewModel(card: PhysicalPetCard): CarnetViewModel {
  return {
    statusMeta: getPetStatusMeta(card.estado.status),
    formato: card.print.formato,
    orientacion: card.print.orientacion,
    formatoLabel: CARNET_FORMATO_LABELS[card.print.formato],
    orientacionLabel: CARNET_ORIENTACION_LABELS[card.print.orientacion],
    formatoDescription: CARNET_FORMATO_DESCRIPTIONS[card.print.formato],
    generadoEn: formatCarnetDate(card.generadoEn),
    fechaPerdida: formatCarnetDate(card.emergencia.fechaPerdida),
    vacunasCount: card.salud.vacunas.length,
    desparasitacionesCount: card.salud.desparasitaciones.length,
    historialCount: card.salud.historialMedico.length,
    hasPhone: card.contacto.telefono !== null,
    hasWhatsapp: card.contacto.whatsappUrl !== null,
    tieneSalud:
      card.salud.vacunas.length > 0 ||
      card.salud.desparasitaciones.length > 0 ||
      card.salud.historialMedico.length > 0 ||
      card.salud.alergias.length > 0 ||
      card.salud.condicionesMedicas.length > 0 ||
      card.salud.medicamentosActuales.length > 0 ||
      card.salud.veterinario !== null,
  };
}