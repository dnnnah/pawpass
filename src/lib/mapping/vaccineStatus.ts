import { Check, ClipboardX, Clock } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { VaccineStatus } from "@/types/pet";

export type VaccineStatusLabel =
  | "Al día"
  | "Próxima dosis"
  | "Vencida";

export type VaccineStatusMeta = {
  label: VaccineStatusLabel;
  icon: LucideIcon;
  /** Tono semántico; la capa de UI lo resuelve con `resolveTone`. */
  tone: string;
};

const statusConfig: Record<VaccineStatus, VaccineStatusMeta> = {
  al_dia: {
    label: "Al día",
    icon: Check,
    tone: "success",
  },
  proxima_dosis: {
    label: "Próxima dosis",
    icon: Clock,
    tone: "warning",
  },
  vencida: {
    label: "Vencida",
    icon: ClipboardX,
    tone: "danger",
  },
};

export function getVaccineStatusMeta(status: VaccineStatus): VaccineStatusMeta {
  return statusConfig[status];
}
