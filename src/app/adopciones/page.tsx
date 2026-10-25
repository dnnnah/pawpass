import type { Metadata } from "next";
import Link from "next/link";
import { Building2, PawPrint } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { SubpageHeader } from "@/components/ui/SubpageHeader";
import { AdoptionCatalog, type ShelterFilterOption } from "@/components/features/adoption/AdoptionCatalog";
import { buildCatalogCard } from "@/lib/mapping/adoptionPresentation";
import { getAdoptionCatalogEntries } from "@/lib/services/adoption/queries";
import { getMockShelters } from "@/lib/services/shelters/queries";
import type { AdoptionCatalogEntry } from "@/types/adoption";
import type { Shelter } from "@/types/shelter";

export const metadata: Metadata = {
  title: "Adopciones | PawPass",
  description: "Encuentra mascotas publicadas para adopción por sus responsables y refugios.",
};

export const dynamic = "force-dynamic";

export default async function AdopcionesPage() {
  let entries: AdoptionCatalogEntry[] = [];
  let shelters: Shelter[] = [];
  let unavailable = false;
  try {
    [entries, shelters] = await Promise.all([getAdoptionCatalogEntries(), getMockShelters()]);
  } catch {
    unavailable = true;
  }
  const cards = entries.map(buildCatalogCard);

  const shelterOptions: ShelterFilterOption[] = [];
  for (const card of cards) {
    const key = card.shelterId ?? "__ninguno";
    const label = card.shelterId && card.shelterName ? card.shelterName : "Sin refugio";
    if (!shelterOptions.some((option) => option.id === key)) {
      shelterOptions.push({ id: key, label });
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="space-y-7">
          <SubpageHeader
            eyebrow="Adopción"
            title="Mascotas en adopción"
            description="Conoce a las mascotas publicadas por sus responsables y envía una solicitud inicial sin crear una cuenta."
          />

          {unavailable ? (
            <div role="alert" className="rounded-md border border-danger-rule bg-danger-soft p-5 text-sm leading-6 text-danger">
              No pudimos cargar el catálogo de adopción. Intenta de nuevo más tarde.
            </div>
          ) : <AdoptionCatalog cards={cards} shelters={shelterOptions} />}

          <section aria-labelledby="refugios-titulo">
            <h2
              id="refugios-titulo"
              className="flex items-center gap-2 font-display text-2xl leading-tight text-ink sm:text-3xl"
            >
              <Building2 size={20} className="text-ink-3" aria-hidden="true" />
              Refugios participantes
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {shelters.map((shelter) => (
                <Link
                  key={shelter.id}
                  href={`/refugios/${shelter.id}`}
                  className="group flex items-center gap-4 rounded-lg border border-rule bg-surface p-5 transition-colors hover:border-brand-rule"
                >
                  <span
                    aria-hidden="true"
                    className="grid size-11 shrink-0 place-items-center rounded-md bg-brand-soft text-brand"
                  >
                    <PawPrint size={20} />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-display text-lg leading-snug text-ink">
                      {shelter.nombre}
                    </span>
                    <span className="block text-sm text-ink-2">{shelter.ubicacion}</span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
