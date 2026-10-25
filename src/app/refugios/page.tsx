import type { Metadata } from "next";
import Link from "next/link";
import { Building2, MapPin, PawPrint, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { SubpageHeader } from "@/components/ui/SubpageHeader";
import { getMockShelters } from "@/lib/services/shelters/queries";
import type { Shelter } from "@/types/shelter";

export const metadata: Metadata = {
  title: "Refugios | PawPass",
  description: "Directorio público de refugios y albergues participantes en PawPass.",
};

export const dynamic = "force-dynamic";

export default async function RefugiosPage() {
  let shelters: Shelter[] = [];
  let unavailable = false;
  try {
    shelters = await getMockShelters();
  } catch {
    unavailable = true;
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <SubpageHeader
            eyebrow="Directorio"
            title="Refugios participantes"
            description="Organizaciones y albergues con mascotas publicadas para adopción en PawPass."
          />

          {unavailable ? (
            <p role="alert" className="rounded-md border border-danger-rule bg-danger-soft p-5 text-sm text-danger">No pudimos cargar el directorio de refugios. Intenta de nuevo más tarde.</p>
          ) : shelters.length === 0 ? (
            <p className="rounded-md border border-dashed border-rule-strong p-6 text-sm text-ink-2">Todavía no hay refugios publicados en el directorio.</p>
          ) : <div className="grid gap-6 md:grid-cols-2">
            {shelters.map((shelter) => (
              <div
                key={shelter.id}
                className="flex flex-col justify-between rounded-lg border border-rule bg-surface p-6 shadow-1 transition-colors hover:border-brand-rule"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <span
                      aria-hidden="true"
                      className="grid size-12 shrink-0 place-items-center rounded-md bg-brand-soft text-brand"
                    >
                      <PawPrint size={22} />
                    </span>
                    <Badge
                      tone={shelter.verificado ? "success" : "muted"}
                      icon={<ShieldCheck size={14} aria-hidden="true" />}
                    >
                      {shelter.verificado ? "Verificado" : "Sin verificar"}
                    </Badge>
                  </div>

                  <h2 className="mt-4 font-display text-xl font-semibold text-ink">
                    {shelter.nombre}
                  </h2>

                  <p className="mt-2 text-sm leading-relaxed text-ink-2">
                    {shelter.descripcion}
                  </p>

                  <div className="mt-4 flex items-center gap-2 text-xs text-ink-3">
                    <MapPin size={14} className="shrink-0" aria-hidden="true" />
                    <span>{shelter.ubicacion}</span>
                  </div>
                </div>

                <div className="mt-6 border-t border-rule pt-4">
                  <Link
                    href={`/refugios/${shelter.id}`}
                    className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md bg-brand px-4 text-sm font-semibold text-on-solid transition-colors hover:bg-brand-hover"
                  >
                    <Building2 size={16} aria-hidden="true" />
                    Ver perfil y mascotas ({shelter.mascotas.length})
                  </Link>
                </div>
              </div>
            ))}
          </div>}
        </div>
      </div>
    </AppShell>
  );
}
