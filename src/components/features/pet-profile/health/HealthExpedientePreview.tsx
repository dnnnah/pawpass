import Link from "next/link";
import {
  ArrowRight,
  Bug,
  CheckCircle2,
  ClipboardPlus,
  HeartPulse,
  ShieldCheck,
  Stethoscope,
  TriangleAlert,
} from "lucide-react";
import { Pill } from "@/components/ui/Pill";
import { toCompletenessViewModel } from "@/lib/mapping/health";
import { cx } from "@/lib/ui/tone";
import type { PetProfile } from "@/types/pet";

type HealthExpedientePreviewProps = {
  pet: PetProfile;
};

type DocStatProps = {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
};

/**
 * Los cuatro totales son la misma clase de dato, así que comparten un solo
 * tratamiento. La versión anterior les asignaba un color distinto a cada uno
 * (emerald/teal/sky/amber), lo que hacía que el color dejara de señalar
 * significado y pasara a ser decoración.
 */
function DocStat({ label, value, icon }: DocStatProps) {
  return (
    <div className="min-w-0 border-l-2 border-rule pl-3 first:border-l-0 first:pl-0 sm:pl-4">
      <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-3">
        <span aria-hidden="true" className="text-ink-3">
          {icon}
        </span>
        {label}
      </span>
      <span className="tnum mt-1.5 block text-3xl font-semibold leading-none text-ink">
        {value}
      </span>
    </div>
  );
}

/**
 * HealthExpedientePreview: preview del expediente de salud en el perfil base.
 *
 * Presenta los mismos datos funcionales del Core (totales de vacunas,
 * desparasitaciones y consultas más su completitud, vía
 * `toCompletenessViewModel`) con una presentación tipo documento: encabezado,
 * bloque de totales, detalle de completitud y pie con el ID público. No cambia
 * el contrato `{ pet: PetProfile }` ni reimplementa reglas de negocio.
 */
export function HealthExpedientePreview({ pet }: HealthExpedientePreviewProps) {
  const completeness = toCompletenessViewModel(pet);
  const { registered } = completeness;
  const hasRecords = completeness.hasRecords;

  const statusTone = completeness.complete ? "success" : hasRecords ? "warning" : "muted";
  const completeLabel = completeness.complete
    ? "Expediente completo"
    : hasRecords
      ? `${completeness.totalMissing} dato(s) faltante(s)`
      : "Sin registros";

  return (
    <article
      aria-label="Expediente de salud de la mascota"
      className="overflow-hidden rounded-lg border border-rule bg-surface"
    >
      <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3 border-b border-rule bg-canvas px-5 py-5 sm:px-6">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand">
            PawPass · Expediente
          </p>
          <h2 className="mt-2 flex items-center gap-2.5 text-xl leading-tight text-ink sm:text-2xl">
            <HeartPulse size={20} className="shrink-0 text-brand" aria-hidden="true" />
            Expediente de salud
          </h2>
        </div>
        <Pill tone={statusTone} role="status">
          {completeLabel}
        </Pill>
      </header>

      <div className="px-5 py-6 sm:px-6">
        <section aria-label="Totales del expediente">
          <ul className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
            <li>
              <DocStat
                label="Vacunas"
                value={registered.vacunas}
                icon={<ShieldCheck size={13} />}
              />
            </li>
            <li>
              <DocStat
                label="Desparasitaciones"
                value={registered.desparasitaciones}
                icon={<Bug size={13} />}
              />
            </li>
            <li>
              <DocStat
                label="Consultas"
                value={registered.consultas}
                icon={<Stethoscope size={13} />}
              />
            </li>
            <li>
              <DocStat
                label={completeness.complete ? "Completitud" : "Faltantes"}
                value={completeness.complete ? "100%" : completeness.totalMissing}
                icon={<CheckCircle2 size={13} />}
              />
            </li>
          </ul>
        </section>

        <section
          aria-label="Completitud del expediente"
          className="mt-7 border-t border-rule pt-6"
        >
          <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-ink-2">
            Completitud del expediente
          </h3>

          {completeness.complete ? (
            <p
              className={cx(
                "mt-3.5 flex items-start gap-2.5 rounded-md p-3.5 text-sm leading-6",
                "bg-success-soft text-success"
              )}
            >
              <CheckCircle2 size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span>
                Toda la información registrada está completa y lista para tu veterinario.
              </span>
            </p>
          ) : hasRecords ? (
            <div className="mt-3.5 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Pill tone="warning" icon={<TriangleAlert size={13} />}>
                  {completeness.incompleteRecords} registro(s) con datos faltantes
                </Pill>
                <Pill tone="muted">{completeness.totalMissing} campo(s) pendiente(s)</Pill>
              </div>
              <ul className="grid gap-2 sm:grid-cols-2">
                {completeness.items.map((item) => (
                  <li key={`${item.kind}-${item.entityLabel}`} className="rounded-md bg-canvas p-3.5">
                    <p className="text-sm font-semibold text-ink">{item.entityLabel}</p>
                    {item.missing.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {item.missing.map((field) => (
                          <Pill key={field} tone="warning" size="sm">
                            {field}
                          </Pill>
                        ))}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
              <p className="text-sm leading-6 text-ink-2">
                Completar estos datos ayuda a que el carnet sea útil para tu veterinario.
              </p>
            </div>
          ) : (
            <p className="mt-3.5 flex items-start gap-2.5 rounded-md border border-dashed border-rule-strong p-4 text-sm leading-6 text-ink-2">
              <ClipboardPlus size={18} className="mt-0.5 shrink-0 text-ink-3" aria-hidden="true" />
              <span>
                Aún no hay vacunas, desparasitaciones ni consultas registradas para{" "}
                {pet.mascota.nombre}. El expediente aparecerá aquí cuando se agregue
                información de salud.
              </span>
            </p>
          )}
        </section>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-rule bg-canvas px-5 py-4 sm:px-6">
        <p className="text-xs text-ink-3">
          {pet.identificacion.codigoPublico
            ? `ID PawPass · ${pet.identificacion.codigoPublico}`
            : "ID PawPass · Sin código"}
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">
            Documento informativo
          </p>
          <Link
            href={`/perfil/${pet.id}/salud`}
            className="inline-flex min-h-11 items-center gap-2 rounded-md bg-ink px-4 text-sm font-semibold text-on-solid transition-colors hover:bg-ink-2"
          >
            Ver expediente
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </footer>
    </article>
  );
}
