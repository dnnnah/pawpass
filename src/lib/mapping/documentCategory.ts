import {
  FileImage,
  FileText,
  HeartPulse,
  IdCard,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { PetDocumentCategory } from "@/types/pet";

export type DocumentFilterValue = "todos" | PetDocumentCategory;

export type DocumentCategoryMeta = {
  value: PetDocumentCategory;
  label: string;
  icon: LucideIcon;
};

export type DocumentFilterMeta = {
  value: DocumentFilterValue;
  label: string;
  icon: LucideIcon;
};

const categoryConfig: Record<PetDocumentCategory, Omit<DocumentCategoryMeta, "value">> = {
  vacunas: {
    label: "Vacunas",
    icon: ShieldCheck,
  },
  veterinario: {
    label: "Veterinario",
    icon: Stethoscope,
  },
  identificacion: {
    label: "Identificación",
    icon: IdCard,
  },
  salud: {
    label: "Salud",
    icon: HeartPulse,
  },
  foto: {
    label: "Fotos",
    icon: FileImage,
  },
  otro: {
    label: "Otros",
    icon: FileText,
  },
};

const FILTER_ORDER: DocumentFilterValue[] = [
  "todos",
  "vacunas",
  "veterinario",
  "identificacion",
  "salud",
  "otro",
];

export function getDocumentCategoryMeta(
  category: PetDocumentCategory
): DocumentCategoryMeta {
  return { value: category, ...categoryConfig[category] };
}

export function getDocumentFilterList(): DocumentFilterMeta[] {
  return FILTER_ORDER.map((value) => {
    if (value === "todos") {
      return {
        value,
        label: "Todos",
        icon: FileText,
      };
    }
    const meta = categoryConfig[value];
    return { value, ...meta };
  });
}

export function getDocumentCategoryLabel(category: PetDocumentCategory) {
  return categoryConfig[category].label;
}
