"use client";

import { useState } from "react";
import { CreditCard, FileOutput, KeyRound, Printer } from "lucide-react";
import { CarnetDocument } from "@/components/features/carnet/CarnetDocument";
import { Pill } from "@/components/ui/Pill";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import {
  CARNET_FORMATO_LABELS,
  CARNET_ORIENTACION_LABELS,
  toCarnetViewModel,
} from "@/lib/mapping/carnet";
import type {
  PhysicalPetCard,
  PhysicalPetCardFormato,
} from "@/types/carnet";

const FORMATO_ICONS: Record<PhysicalPetCardFormato, typeof KeyRound> = {
  tarjeta_imprimible: FileOutput,
  credencial: CreditCard,
  placa_dije: KeyRound,
};

type CarnetStudioProps = {
  petName: string;
  cards: Record<PhysicalPetCardFormato, PhysicalPetCard>;
  sharedOnly?: boolean;
};

/**
 * CarnetStudio: alternador de formato del carnet físico.
 *
 * Los tres formatos se construyen una sola vez en el servidor
 * (`buildPhysicalPetCard(pet, { formato })` en la página) para que el Core
 * decida orientación y metadatos de impresión; este componente solo cambia
 * qué variante se muestra y expone los metadatos para impresión
 * (especificación, no estilos).
 */
export function CarnetStudio({ petName, cards, sharedOnly = false }: CarnetStudioProps) {
  const [formato, setFormato] = useState<PhysicalPetCardFormato>("tarjeta_imprimible");
  const card = cards[formato];
  const vm = toCarnetViewModel(card);

  return (
    <div className="space-y-5" aria-label={`Estudio del carnet físico de ${petName}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl
          label="Formato del carnet"
          value={formato}
          onChange={setFormato}
          options={(Object.keys(CARNET_FORMATO_LABELS) as PhysicalPetCardFormato[]).map(
            (option) => {
              const Icon = FORMATO_ICONS[option];
              return {
                value: option,
                label: CARNET_FORMATO_LABELS[option],
                icon: <Icon size={16} />,
              };
            },
          )}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone="muted">Orientación: {CARNET_ORIENTACION_LABELS[vm.orientacion]}</Pill>
          <button
            type="button"
            onClick={() => window.print()}
            className="print:hidden inline-flex min-h-11 items-center gap-2 rounded-md bg-ink px-4 text-sm font-semibold text-on-solid transition-colors hover:bg-ink-2"
          >
            <Printer size={17} aria-hidden="true" />
            Imprimir
          </button>
        </div>
      </div>

      <p className="text-sm leading-6 text-ink-2">{vm.formatoDescription}</p>

      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">
        Referencia de impresión · QR mínimo {card.print.qrMinimoMm} mm
      </p>

      <CarnetDocument card={card} sharedOnly={sharedOnly} />
    </div>
  );
}
