import Link from "next/link";
import { IdCard } from "lucide-react";
import { CarnetDocument } from "@/components/features/carnet/CarnetDocument";
import { toCarnetViewModel } from "@/lib/mapping/carnet";
import type { PhysicalPetCard } from "@/types/carnet";

type PhysicalCardCtaProps = {
  petId: string;
  petName: string;
  card: PhysicalPetCard;
  sharedOnly?: boolean;
};

/**
 * Section del perfil: preview del carnet físico (una sola foto del documento
 * en su formato por defecto) con acceso al estudio de formatos. El modelo
 * llega ya construido por la página (server) desde el Core.
 */
export function PhysicalCardCta({ petId, petName, card, sharedOnly = false }: PhysicalCardCtaProps) {
  const vm = toCarnetViewModel(card);

  return (
    <section className="space-y-4" aria-labelledby="carnet-heading">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2
            id="carnet-heading"
            className="flex items-center gap-2.5 text-2xl leading-tight text-ink"
          >
            <span
              aria-hidden="true"
              className="grid h-9 w-9 place-items-center rounded-md bg-brand-soft text-brand"
            >
              <IdCard size={19} />
            </span>
            Carnet físico
          </h2>
          <p className="mt-1.5 text-sm leading-6 text-ink-2">
            La identidad física de {petName} lista para imprimir o compartir.
          </p>
        </div>
        <Link
          href={`/perfil/${petId}/carnet`}
          className="inline-flex min-h-11 items-center gap-2 rounded-md bg-brand px-4 text-sm font-semibold text-on-solid transition-colors hover:bg-brand-hover"
        >
          <IdCard size={16} aria-hidden="true" />
          Estudio del carnet
        </Link>
      </div>

      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">
        {vm.formatoLabel} · orientación {vm.orientacionLabel.toLowerCase()} · QR mínimo {card.print.qrMinimoMm} mm
      </p>

          <CarnetDocument card={card} sharedOnly={sharedOnly} />
    </section>
  );
}
