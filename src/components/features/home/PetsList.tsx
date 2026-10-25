"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { PetSpeciesIcon } from "@/lib/petIcon";
import { Surface } from "@/components/ui/Surface";
import type { PublicProfileCard } from "@/types/publicProfile";

type PetsListProps = {
  pets: ReadonlyArray<PublicProfileCard>;
  failed?: boolean;
};

const SPECIES_FILTERS = ["Todos", "Perro", "Gato"] as const;

export function PetsList({ pets, failed = false }: PetsListProps) {
  const [species, setSpecies] = useState<string>("Todos");

  const filtered =
    species === "Todos" ? pets : pets.filter((pet) => pet.species === species);

  return (
    <div>
      {failed ? <Surface variant="accent" tone="danger" size="md" rest={{ role: "alert" }}><p className="text-sm leading-6 text-ink-2">No pudimos cargar los perfiles públicos. Intenta de nuevo más tarde.</p></Surface> : null}
      {!failed && pets.length ? <div className="flex flex-wrap items-center gap-3">
        <SegmentedControl
          label="Filtrar mascotas por especie"
          value={species}
          onChange={setSpecies}
          options={SPECIES_FILTERS.map((option) => ({ value: option, label: option }))}
        />
        <span aria-live="polite" className="ml-auto text-sm text-ink-3">
          {filtered.length} {filtered.length === 1 ? "mascota" : "mascotas"}
        </span>
      </div> : null}

      {!failed && filtered.length > 0 ? (
        <ul className="mt-4 divide-y divide-rule border-y border-rule">
          {filtered.map((pet) => (
              <li key={pet.publicCode}>
                <Link
                  href={`/perfil/${pet.publicCode}`}
                  className="group flex min-h-16 items-center gap-3.5 py-3.5 transition-colors duration-150 hover:bg-surface sm:px-2"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-md bg-brand-soft text-brand" aria-hidden="true">
                    {pet.photoUrl ? <Image src={pet.photoUrl} alt="" width={88} height={88} unoptimized className="h-full w-full object-cover" /> : <PetSpeciesIcon species={pet.species} size={20} />}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                      <span className="font-display text-lg font-semibold leading-tight text-ink">{pet.name}</span>
                    </span>
                    <span className="mt-0.5 block text-sm text-ink-2">
                      {pet.species}
                      {pet.breed ? ` · ${pet.breed}` : ""}
                    </span>
                  </span>

                  <ChevronRight
                    size={18}
                    aria-hidden="true"
                    className="shrink-0 text-ink-3 transition-transform duration-150 group-hover:translate-x-0.5"
                  />
                </Link>
              </li>
          ))}
        </ul>
      ) : null}
      {!failed && !filtered.length ? (
        <p className="mt-4 rounded-lg bg-sunken p-6 text-center text-sm text-ink-2">
          {pets.length ? "No hay perfiles de esta especie por ahora." : "Aún no hay perfiles públicos. Aparecerán aquí cuando sus responsables los activen."}
        </p>
      ) : null}
    </div>
  );
}
