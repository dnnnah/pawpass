import type { Metadata } from "next";
import Link from "next/link";
import { Building2, MapPin, PawPrint, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { SubpageHeader } from "@/components/ui/SubpageHeader";
import { PrototypeNotice } from "@/components/features/adoption/PrototypeNotice";
import { getMockShelters } from "@/lib/services/shelters/queries";

export const metadata: Metadata = {
  title: "Refugios | PawPass",
  description:
    "Directorio de refugios y albergues de animales colaboradores en el prototipo de PawPass.",
};

export default async function RefugiosPage() {
  const shelters = await getMockShelters();

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <SubpageHeader
            eyebrow="Directorio"
            title="Refugios participantes"
            description="Organizaciones, albergues y rescatistas independientes que colaboran en la fase piloto de PawPass para la gestión y adopción de animales."
          />

          <PrototypeNotice />

          <div className="grid gap-6 md:grid-cols-2">
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
          </div>
        </div>
      </div>
    </AppShell>
  );
}
