import Image from "next/image";
import Link from "next/link";
import { HeartHandshake } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { SPECIES_FACE } from "@/lib/ui/speciesFace";
import type { ShelterPetCardPresentation } from "@/lib/mapping/adoptionPresentation";

type ShelterPetCardProps = {
  pet: ShelterPetCardPresentation;
};

export function ShelterPetCard({ pet }: ShelterPetCardProps) {
  const SpeciesIcon = SPECIES_FACE[pet.species.trim().toLowerCase()];

  return (
    <article className="flex items-center gap-4 rounded-lg border border-rule bg-surface p-3">
      <Link
        href={pet.profileHref}
        className="shrink-0 rounded-md"
        tabIndex={-1}
        aria-hidden="true"
      >
        <Image
          src={pet.image}
          alt=""
          width={128}
          height={128}
          className="h-24 w-24 rounded-md bg-sunken object-contain sm:h-28 sm:w-28"
        />
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-display text-xl leading-tight text-ink">{pet.name}</h3>
          <Badge tone={pet.statusTone}>{pet.statusLabel}</Badge>
        </div>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-sm text-ink-2">
          <span>{pet.species}</span>
          {SpeciesIcon ? (
            <SpeciesIcon size={14} strokeWidth={1.75} className="text-ink-3" aria-hidden="true" />
          ) : (
            <span aria-hidden="true">·</span>
          )}
          <span>{pet.breed}</span>
        </p>
        <p className="mt-0.5 text-xs text-ink-3">ID: {pet.code}</p>

        <div className="mt-2 flex flex-wrap gap-2">
          {pet.adoptable ? (
            <Link
              href={pet.adoptionHref}
              className="inline-flex min-h-11 items-center gap-2 rounded-md bg-adoption px-4 text-sm font-semibold text-on-solid transition-colors hover:brightness-110"
            >
              <HeartHandshake size={16} aria-hidden="true" />
              Solicitar adopción
            </Link>
          ) : null}
          <Link
            href={pet.profileHref}
            className="inline-flex min-h-11 items-center rounded-md border border-rule bg-surface px-4 text-sm font-semibold text-ink-2 transition-colors hover:border-brand-rule hover:text-brand"
          >
            Ver perfil
          </Link>
        </div>
      </div>
    </article>
  );
}
