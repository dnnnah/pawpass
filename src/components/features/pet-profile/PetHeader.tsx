import Image from "next/image";
import { Heart, Mars, Microchip, PawPrint, Ruler, ShieldCheck, Venus } from "lucide-react";
import { Pill } from "@/components/ui/Pill";
import { CopyButton } from "@/components/ui/CopyButton";
import { DataList } from "@/components/ui/DataList";
import { PetMarks } from "@/components/ui/PetMarks";
import { SPECIES_FACE } from "@/lib/ui/speciesFace";

type PetHeaderProps = {
  pet: {
    name: string;
    species: string;
    breed: string;
    age: string | null;
    gender: string | null;
    size: string | null;
    id: string;
    image: string | null;
    status: {
      vaccines: string | null;
      sterilized: string | null;
      microchip: string | null;
    };
  };
  statusBadge?: React.ReactNode;
};

export function PetHeader({ pet, statusBadge }: PetHeaderProps) {
  const isMale = pet.gender === "Macho";
  const GenderIcon = isMale ? Mars : Venus;
  const SpeciesIcon = SPECIES_FACE[pet.species.trim().toLowerCase()];

  return (
    <section className="relative border-b border-rule pb-8 pt-[5.5rem] sm:pb-10 sm:pt-0">
      {/* Las marcas conservan su banda para no cubrir la foto en móvil. */}
      <PetMarks className="right-0 top-0 origin-top-right [scale:0.5] sm:[scale:0.72] lg:[scale:1]" />
      <div className="grid min-w-0 grid-cols-1 items-start gap-6 sm:gap-8 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <div className="mx-auto min-w-0 w-full max-w-[280px] sm:max-w-[340px] lg:mx-0 lg:max-w-none">
          <div className="overflow-hidden rounded-lg bg-sunken ring-1 ring-rule">
            {pet.image ? (
              <Image
                src={pet.image}
                alt={`Foto de ${pet.name}`}
                width={900}
                height={900}
                priority
                unoptimized
                className="aspect-square w-full object-contain"
              />
            ) : (
              <div role="img" aria-label={`Foto no compartida de ${pet.name}`} className="grid aspect-square place-items-center text-ink-3">
                {SpeciesIcon ? <SpeciesIcon size={72} strokeWidth={1.25} aria-hidden="true" /> : <PawPrint size={72} strokeWidth={1.25} aria-hidden="true" />}
              </div>
            )}
          </div>
        </div>

        <div className="min-w-0">
          <h1 className="text-[clamp(2.25rem,5vw,4.5rem)] leading-[1.08] text-ink [overflow-wrap:anywhere]">
            {pet.name}
          </h1>
          <p className="mt-2.5 flex flex-wrap items-center gap-x-2 text-lg text-ink-2">
            {pet.breed ? <span>{pet.breed}</span> : null}
            {SpeciesIcon ? (
              <SpeciesIcon size={16} strokeWidth={1.75} className="text-ink-3" aria-hidden="true" />
            ) : (
              <span aria-hidden="true">·</span>
            )}
            <span>{pet.species}</span>
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            {statusBadge}
            {pet.age ? <Pill tone="muted">{pet.age}</Pill> : null}
            {pet.gender ? <Pill tone="muted" icon={<GenderIcon size={13} />}>{pet.gender}</Pill> : null}
            {pet.size ? <Pill tone="muted" icon={<Ruler size={13} />}>{pet.size}</Pill> : null}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2 border-y border-rule py-2.5">
            <span className="tnum min-w-0 text-[0.9375rem] font-semibold text-ink [overflow-wrap:anywhere]">
              ID PawPass: {pet.id}
            </span>
            <CopyButton value={pet.id} label="Copiar ID" />
          </div>

          <DataList
            layout="grid"
            className="mt-5"
            items={[
              { label: "Vacunas", value: pet.status.vaccines, icon: <ShieldCheck size={14} /> },
              { label: "Esterilizado", value: pet.status.sterilized, icon: <Heart size={14} /> },
              { label: "Microchip", value: pet.status.microchip, icon: <Microchip size={14} /> },
            ]}
          />
        </div>
      </div>
    </section>
  );
}
