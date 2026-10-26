import Link from "next/link";
import { AlertTriangle, Check, ChevronRight, Clock, ShieldCheck } from "lucide-react";
import { Pill } from "@/components/ui/Pill";
import { Section } from "@/components/ui/Section";
import type { VaccineItemViewModel } from "@/lib/mapping/health";
import { resolveTone } from "@/lib/ui/tone";

type VaccineTimelineProps = {
  petId: string;
  petName: string;
  totalCount: number;
  vaccines: ReadonlyArray<VaccineItemViewModel>;
  showDetailsLink?: boolean;
  showStatus?: boolean;
};

type VaccineVisual = {
  icon: typeof Check;
  tone: string;
};

function visualFor(vaccine: VaccineItemViewModel): VaccineVisual {
  if (vaccine.alert?.kind === "vencida") {
    return { icon: AlertTriangle, tone: vaccine.alert.tone };
  }
  if (vaccine.alert) {
    return { icon: Clock, tone: vaccine.alert.tone };
  }
  return { icon: Check, tone: "success" };
}

export function VaccineTimeline({ petId, petName, totalCount, vaccines, showDetailsLink = true, showStatus = true }: VaccineTimelineProps) {
  return (
    <Section
      title="Registro de vacunas"
      eyebrow="Vacunación"
      icon={<ShieldCheck size={18} />}
      /* Pino de seguridad: la seccion que dice si la mascota esta al dia. El
         color va aqui y no en cada fila porque el tono de cada vacuna ya lo dice
         mas exacto (al dia, pendiente, vencida). */
      tone="success"
      action={
        <div className="flex flex-wrap items-center gap-3">
          {totalCount > 0 ? <Pill tone="muted">{totalCount}</Pill> : null}
          {showDetailsLink ? (
            <Link
              href={`/perfil/${petId}/vacunas`}
              className="inline-flex min-h-11 items-center gap-1 rounded-md text-sm font-semibold text-brand underline-offset-4 hover:underline"
            >
              Ver cartilla completa
              <ChevronRight size={16} aria-hidden="true" />
            </Link>
          ) : null}
        </div>
      }
    >
      {vaccines.length > 0 ? (
        <ul className="space-y-3.5">
          {vaccines.map((vaccine) => {
            const visual = visualFor(vaccine);
            const Icon = showStatus ? visual.icon : ShieldCheck;
            const tone = resolveTone(showStatus ? visual.tone : "muted");

            return (
              <li key={vaccine.id} className="flex items-start gap-3.5">
                <span
                  aria-hidden="true"
                  className={[
                    "grid h-10 w-10 shrink-0 place-items-center rounded-full",
                    tone.soft,
                  ].join(" ")}
                >
                  <Icon size={18} strokeWidth={2.4} />
                </span>
                <div className="min-w-0">
                  <p className="text-base leading-snug text-ink">{vaccine.name}</p>
                  <p className="mt-0.5 text-sm text-ink-2">
                    {vaccine.applicationDate ?? "Fecha no registrada"}
                  </p>
                  {vaccine.nextDoseDate ? <p className="mt-0.5 text-sm text-ink-2">Próxima dosis: {vaccine.nextDoseDate}</p> : null}
                  {showStatus ? <div className="mt-1.5"><Pill tone={visual.tone} size="sm">{vaccine.alert ? vaccine.alert.label : vaccine.status ?? "Al día"}</Pill></div> : null}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="rounded-md border border-dashed border-rule-strong px-4 py-8 text-center">
          <ShieldCheck size={26} className="mx-auto text-ink-3" aria-hidden="true" />
          <p className="mt-3 text-base font-semibold text-ink">Sin vacunas registradas</p>
          <p className="mx-auto mt-1.5 max-w-md text-sm leading-6 text-ink-2">
            Aún no se han registrado vacunas para {petName}.
          </p>
        </div>
      )}
    </Section>
  );
}
