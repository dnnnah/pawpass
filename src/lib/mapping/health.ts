/**
 * Mapeo de presentación de salud (FASE 5 UI).
 *
 * Capa: mapping / view model. Únicamente adapta los resultados del dominio
 * (`src/lib/domain/*`) a estructuras listas para los componentes. No vuelve a
 * implementar ninguna regla de negocio: ordenar, filtrar, calcular alertas o
 * conteos se delega 1:1 a `domain/vaccine.ts` y `domain/health.ts`.
 *
 * No importa Supabase ni React; solo formatos de presentación (fechas y
 * etiquetas de Estado calculado por Core).
 */

import { formatMexicanDate } from "@/lib/dateFormat";
import {
  countVaccinesByStatus,
  evaluateVaccineCore,
  getVaccineApplicationDate,
  getVaccineMissingFields,
  getVaccineNextDoseDate,
  hasVaccineDocument,
  isVaccineStatus,
  linkVaccineDocument,
  resolveVaccineNextDoseAlert,
  type VaccineNextDoseAlertKind,
  type VaccineRecordInput,
} from "@/lib/domain/vaccine";
import {
  getConsultationMissingFields,
  getConsultationsSummary,
  getDewormingMissingFields,
  getHealthCompletenessReport,
  getHealthRecordCounts,
  hasDewormingDocument,
  hasHealthRecord,
  resolveNextDewormingDue,
  sortConsultationsByDate,
  sortDewormingsByDate,
  type ConsultationsSummary,
  type DewormingDueKind,
} from "@/lib/domain/health";
import { getVaccineStatusMeta, type VaccineStatusLabel } from "@/lib/mapping/vaccineStatus";
import type { HealthConsultation, HealthDeworming, HealthDocumentRef } from "@/types/health";
import type { PetProfile } from "@/types/pet";
import type { HealthCompletenessItem } from "@/lib/domain/health";

export type DocumentLink = {
  id: string;
  nombre: string;
  url: string;
} | null;

export type VaccineAlertViewModel = {
  kind: VaccineNextDoseAlertKind;
  label: string;
  /** Tono semántico; la capa de UI lo resuelve con `resolveTone`. */
  tone: string;
};

const VACCINE_ALERT_META: Record<VaccineNextDoseAlertKind, { label: string; tone: string }> = {
  vencida: {
    label: "Próxima dosis vencida",
    tone: "danger",
  },
  vence_hoy: {
    label: "Vence hoy",
    tone: "warning",
  },
  marcada_proxima: {
    label: "Próxima dosis pendiente",
    tone: "info",
  },
};

export type VaccineItemViewModel = {
  id: string;
  name: string;
  /** Fecha de aplicación formateada o null si falta/es inválida. */
  applicationDate: string | null;
  /** Próxima dosis formateada o null si falta/es inválida. */
  nextDoseDate: string | null;
  /** Estado explícito (tal como viene en el dato) o null si es desconocido. */
  status: VaccineStatusLabel | null;
  /** Tono semántico del estado; la capa de UI lo resuelve con `resolveTone`. */
  statusTone: string;
  hasDocument: boolean;
  document: DocumentLink;
  /** Alerta de próxima dosis calculada por Core (null si no hay alerta). */
  alert: VaccineAlertViewModel | null;
  /** Registro incompleto en campos núcleo (id/nombre/fecha/estado). */
  coreMissing: boolean;
  /** Campos informativos faltantes (próxima dosis, lote, veterinario, documento). */
  missingFields: string[];
  lote: string | null;
  veterinario: string | null;
  origen: string | null;
  fechaCreacion: string | null;
};

export const MISSING_FIELD_LABELS: Record<string, string> = {
  id: "Identificador del registro",
  nombre: "Nombre de la vacuna",
  fechaAplicacion: "Fecha de aplicación",
  estatus: "Estado de la vacuna",
  proximaDosis: "Próxima dosis",
  lote: "Lote",
  veterinario: "Veterinario",
  documentoUrl: "Documento",
  motivo: "Motivo de la consulta",
  diagnostico: "Diagnóstico",
  tratamiento: "Tratamiento",
  medicamentos: "Medicamentos",
  documentos: "Documentos",
  producto: "Producto",
  fecha: "Fecha de aplicación",
  proximaFecha: "Próxima fecha",
  dosis: "Dosis",
};

export function toVaccineItemViewModel(
  vaccine: VaccineRecordInput,
  documents?: ReadonlyArray<{ id: string; url: string; nombre?: string }>,
  today?: string,
  options?: { suppressAlerts?: boolean },
): VaccineItemViewModel {
  const applicationDate = getVaccineApplicationDate(vaccine);
  const nextDoseDate = getVaccineNextDoseDate(vaccine);
  const core = evaluateVaccineCore(vaccine);
  const missingFields = getVaccineMissingFields(vaccine);

  const documentsList = documents ?? [];
  const linked = linkVaccineDocument(vaccine, documentsList);
  const linkedSource =
    linked === null
      ? undefined
      : documentsList.find((document) => document.id === linked.id || document.url === linked.url);
  const document = linked
    ? { id: linked.id, nombre: linkedSource?.nombre ?? "Documento", url: linked.url }
    : null;

  let statusLabel: VaccineStatusLabel | null = null;
  let statusTone = "muted";
  if (isVaccineStatus(vaccine.estatus)) {
    const meta = getVaccineStatusMeta(vaccine.estatus);
    statusLabel = meta.label;
    statusTone = meta.tone;
  }

  const alert = options?.suppressAlerts ? null : resolveVaccineNextDoseAlert(vaccine, today);

  return {
    id: vaccine.id ?? "",
    name: vaccine.nombre ?? "Vacuna sin nombre",
    applicationDate: applicationDate !== null ? formatMexicanDate(applicationDate) : null,
    nextDoseDate: nextDoseDate !== null ? formatMexicanDate(nextDoseDate) : null,
    status: statusLabel,
    statusTone,
    hasDocument: hasVaccineDocument(vaccine) || document !== null,
    document,
    alert: alert !== null
      ? { kind: alert.kind, ...VACCINE_ALERT_META[alert.kind] }
      : null,
    coreMissing: !core.complete,
    missingFields,
    lote: typeof vaccine.lote === "string" && vaccine.lote.trim() !== "" ? vaccine.lote : null,
    veterinario:
      typeof vaccine.veterinario === "string" && vaccine.veterinario.trim() !== ""
        ? vaccine.veterinario
        : null,
    origen: typeof vaccine.origen === "string" && vaccine.origen.trim() !== "" ? vaccine.origen : null,
    fechaCreacion:
      typeof vaccine.fechaCreacion === "string" && vaccine.fechaCreacion.trim() !== ""
        ? formatMexicanDate(vaccine.fechaCreacion)
        : null,
  };
}

export function toVaccineItemViewModels(
  vaccines: ReadonlyArray<VaccineRecordInput>,
  documents?: ReadonlyArray<{ id: string; url: string; nombre?: string }>,
  today?: string,
): VaccineItemViewModel[] {
  return vaccines.map((vaccine) => toVaccineItemViewModel(vaccine, documents, today));
}

export type VaccineSummaryViewModel = ReturnType<typeof countVaccinesByStatus>;

export function toVaccineSummaryViewModel(
  vaccines: ReadonlyArray<VaccineRecordInput>,
): VaccineSummaryViewModel {
  return countVaccinesByStatus(vaccines);
}

export type DewormingKindMeta = {
  kind: DewormingDueKind;
  label: string;
  tone: string;
};

const DEWORMING_DUE_META: Record<DewormingDueKind, { label: string; tone: string }> = {
  vencida: {
    label: "Desparasitación vencida",
    tone: "danger",
  },
  entrega_hoy: {
    label: "Corresponde hoy",
    tone: "warning",
  },
  programada: {
    label: "Programada",
    tone: "info",
  },
};

export type DewormingItemViewModel = {
  id: string;
  producto: string;
  fecha: string | null;
  proximaFecha: string | null;
  dosis: string | null;
  veterinario: string | null;
  documentoUrl: string | null;
  hasDocumento: boolean;
  missingFields: string[];
};

export function toDewormingItemViewModel(deworming: HealthDeworming): DewormingItemViewModel {
  const formattedDate = formatMexicanDate(deworming.fecha);
  const formattedNext =
    deworming.proximaFecha !== undefined ? formatMexicanDate(deworming.proximaFecha) : null;

  return {
    id: deworming.id,
    producto: deworming.producto,
    fecha: formattedDate ?? (deworming.fecha || null),
    proximaFecha:
      formattedNext ??
      (deworming.proximaFecha !== undefined && deworming.proximaFecha !== ""
        ? deworming.proximaFecha
        : null),
    dosis:
      typeof deworming.dosis === "string" && deworming.dosis.trim() !== "" ? deworming.dosis : null,
    veterinario:
      typeof deworming.veterinario === "string" && deworming.veterinario.trim() !== ""
        ? deworming.veterinario
        : null,
    documentoUrl:
      typeof deworming.documentoUrl === "string" && deworming.documentoUrl.trim() !== ""
        ? deworming.documentoUrl
        : null,
    hasDocumento: hasDewormingDocument(deworming),
    missingFields: getDewormingMissingFields(deworming).map(
      (field) => MISSING_FIELD_LABELS[field] ?? field,
    ),
  };
}

export type DewormingSectionViewModel = {
  total: number;
  items: DewormingItemViewModel[];
  nextDue: (DewormingKindMeta & { fecha: string | null }) | null;
};

export function toDewormingSectionViewModel(
  dewormings: ReadonlyArray<HealthDeworming>,
  today?: string,
  options?: { suppressDue?: boolean },
): DewormingSectionViewModel {
  const sorted = sortDewormingsByDate(dewormings, "reverso").map(toDewormingItemViewModel);
  const due = options?.suppressDue ? null : resolveNextDewormingDue(dewormings, today);

  return {
    total: dewormings.length,
    items: sorted,
    nextDue: due
      ? {
          kind: due.kind,
          label: DEWORMING_DUE_META[due.kind].label,
          tone: DEWORMING_DUE_META[due.kind].tone,
          fecha: formatMexicanDate(due.fecha) ?? due.fecha,
        }
      : null,
  };
}

export type ConsultationItemViewModel = {
  id: string;
  fecha: string | null;
  motivo: string;
  diagnostico: string | null;
  tratamiento: string | null;
  medicamentos: string[];
  veterinario: string | null;
  documentos: HealthDocumentRef[];
  missingFields: string[];
};

export function toConsultationItemViewModel(
  consultation: HealthConsultation,
): ConsultationItemViewModel {
  const normalizeText = (value: string | undefined): string | null =>
    typeof value === "string" && value.trim() !== "" ? value : null;

  return {
    id: consultation.id,
    fecha: consultation.fecha ? (formatMexicanDate(consultation.fecha) ?? consultation.fecha) : null,
    motivo: consultation.motivo,
    diagnostico: normalizeText(consultation.diagnostico),
    tratamiento: normalizeText(consultation.tratamiento),
    medicamentos: consultation.medicamentos,
    veterinario: normalizeText(consultation.veterinario),
    documentos: consultation.documentos,
    missingFields: getConsultationMissingFields(consultation).map(
      (field) => MISSING_FIELD_LABELS[field] ?? field,
    ),
  };
}

export type MedicalHistoryViewModel = {
  total: number;
  items: ConsultationItemViewModel[];
  summary: ConsultationsSummary;
};

export function toMedicalHistoryViewModel(
  consultations: ReadonlyArray<HealthConsultation>,
): MedicalHistoryViewModel {
  const sorted = sortConsultationsByDate(consultations, "reverso").map(toConsultationItemViewModel);
  return {
    total: consultations.length,
    items: sorted,
    summary: getConsultationsSummary(consultations),
  };
}

export type CompletenessEntityRow = {
  kind: HealthCompletenessItem["entity"];
  entityLabel: string;
  missing: string[];
};

export type CompletenessViewModel = {
  registered: ReturnType<typeof getHealthRecordCounts>;
  hasAny: boolean;
  /** Hay al menos un registro clínico (vacuna, desparasitación o consulta). */
  hasRecords: boolean;
  items: CompletenessEntityRow[];
  totalMissing: number;
  complete: boolean;
  completeRecords: number;
  incompleteRecords: number;
};

function entityLabel(pet: PetProfile, item: HealthCompletenessItem): string {
  if (item.entity === "vacuna") {
    const vaccine = pet.vacunas.find((entry) => entry.id === item.id);
    return `Vacuna · ${vaccine?.nombre ?? item.id}`;
  }
  if (item.entity === "desparasitacion") {
    const deworming = (pet.desparasitaciones ?? []).find((entry) => entry.id === item.id);
    return `Desparasitación · ${deworming?.producto ?? item.id}`;
  }
  const consultation = (pet.historialMedico ?? []).find((entry) => entry.id === item.id);
  return `Consulta · ${consultation?.motivo ?? item.id}`;
}

export function toCompletenessViewModel(pet: PetProfile): CompletenessViewModel {
  const registered = getHealthRecordCounts(pet);
  const report = getHealthCompletenessReport(pet);

  const totalEntities =
    registered.vacunas + registered.desparasitaciones + registered.consultas;

  return {
    registered,
    hasAny: hasHealthRecord(pet),
    hasRecords:
      registered.vacunas > 0 || registered.desparasitaciones > 0 || registered.consultas > 0,
    items: report.items.map((item) => ({
      kind: item.entity,
      entityLabel: entityLabel(pet, item),
      missing: [...item.missingFields].map((field) => MISSING_FIELD_LABELS[field] ?? field),
    })),
    totalMissing: report.totalMissing,
    complete: report.complete,
    completeRecords: totalEntities - report.items.length,
    incompleteRecords: report.items.length,
  };
}