"use client";

import { SegmentedControl } from "@/components/ui/SegmentedControl";
import {
  getDocumentFilterList,
  type DocumentFilterValue,
} from "@/lib/mapping/documentCategory";

export type DocumentFilter = DocumentFilterValue;

type DocumentFiltersProps = {
  counts: Record<DocumentFilter, number>;
  active: DocumentFilter;
  onChange: (filter: DocumentFilter) => void;
};

const filters = getDocumentFilterList();

export function DocumentFilters({ counts, active, onChange }: DocumentFiltersProps) {
  return (
    <SegmentedControl
      label="Filtrar documentos por categoría"
      value={active}
      onChange={onChange}
      options={filters
        .filter((filter) => filter.value === "todos" || counts[filter.value] > 0)
        .map((filter) => {
          const Icon = filter.icon;
          return {
            value: filter.value,
            label: filter.label,
            icon: <Icon size={15} />,
            meta: counts[filter.value],
          };
        })}
    />
  );
}
