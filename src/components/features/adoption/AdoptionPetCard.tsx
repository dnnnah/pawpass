import Image from "next/image";
import Link from "next/link";
import { HeartHandshake, MapPin, Ruler, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { AdoptionCatalogCard } from "@/lib/mapping/adoptionPresentation";

type AdoptionPetCardProps = {
  card: AdoptionCatalogCard;
};

export function AdoptionPetCard({ card }: AdoptionPetCardProps) {
  return (
    <Link
      href={card.href}
      className="group flex flex-col overflow-hidden rounded-lg border border-rule bg-surface transition-colors hover:border-brand-rule"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-sunken">
        {card.image ? (
          <Image
            src={card.image}
            alt={`Foto de ${card.name}`}
            width={640}
            height={480}
            unoptimized
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="grid h-full place-items-center text-sm text-ink-3">Foto no disponible</div>
        )}
        <div className="absolute inset-x-0 top-0 flex flex-wrap items-center gap-1.5 p-2.5">
          <Badge tone="adoption" icon={<HeartHandshake size={14} aria-hidden="true" />}>
            En adopción
          </Badge>
          {card.verified ? (
            <Badge tone="success" icon={<ShieldCheck size={14} aria-hidden="true" />}>
              Verificado
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-5">
        <h3 className="font-display text-xl leading-tight text-ink">{card.name}</h3>
        <p className="text-sm text-ink-2">
          {card.species} · {card.breed}
        </p>

        <div className="flex flex-wrap items-center gap-1.5">
          <Badge>{card.gender}</Badge>
          <Badge icon={<Ruler size={14} aria-hidden="true" />}>{card.size}</Badge>
          <Badge>{card.age}</Badge>
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-rule pt-3">
          <p className="flex min-w-0 items-center gap-1.5 text-xs text-ink-2">
            <MapPin size={14} className="shrink-0 text-ink-3" aria-hidden="true" />
            <span className="min-w-0 truncate">{card.zone}</span>
          </p>
          {card.shelterName ? (
            <p className="text-xs font-semibold text-adoption">Vía {card.shelterName}</p>
          ) : (
            <p className="text-xs text-ink-3">Adopción directa</p>
          )}
        </div>
      </div>
    </Link>
  );
}
