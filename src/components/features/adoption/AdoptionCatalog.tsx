"use client";

import { useMemo, useState } from "react";
import { Cat, Dog, MapPin, Search } from "lucide-react";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { AdoptionPetCard } from "./AdoptionPetCard";
import type { AdoptionCatalogCard } from "@/lib/mapping/adoptionPresentation";

const SPECIES_FILTERS = ["Todos", "Perro", "Gato"] as const;

export type ShelterFilterOption = {
  id: string;
  label: string;
};

type AdoptionCatalogProps = {
  cards: AdoptionCatalogCard[];
  shelters: ShelterFilterOption[];
};

export function AdoptionCatalog({ cards, shelters }: AdoptionCatalogProps) {
  const [species, setSpecies] = useState<(typeof SPECIES_FILTERS)[number]>("Todos");
  const [shelterId, setShelterId] = useState("todos");

  const filtered = useMemo(() => {
    return cards.filter((card) => {
      const matchesSpecies = species === "Todos" || card.species === species;
      const matchesShelter =
        shelterId === "todos" ||
        (shelterId === "__ninguno" ? card.shelterId === null : card.shelterId === shelterId);
      return matchesSpecies && matchesShelter;
    });
  }, [cards, species, shelterId]);

  const resultLabel =
    filtered.length === 1 ? "1 mascota en adopción" : `${filtered.length} mascotas en adopción`;

  return (
    <section aria-labelledby="adopciones-titulo">
      <div className="flex flex-col gap-4">
        <h2 id="adopciones-titulo" className="text-2xl leading-tight text-ink sm:text-3xl">
          Mascotas en adopción
        </h2>

        <div className="flex flex-wrap items-center gap-2">
          <SegmentedControl
            label="Filtrar por especie"
            value={species}
            onChange={setSpecies}
            options={SPECIES_FILTERS.map((option) => ({
              value: option,
              label: option,
              icon:
                option === "Perro" ? (
                  <Dog size={16} />
                ) : option === "Gato" ? (
                  <Cat size={16} />
                ) : undefined,
            }))}
          />

          <label className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-rule bg-surface px-3.5 text-sm font-semibold text-ink-2 focus-within:border-brand-rule">
            <span className="sr-only">Filtrar por refugio</span>
            <MapPin size={16} aria-hidden="true" className="shrink-0 text-ink-3" />
            <select
              value={shelterId}
              onChange={(event) => setShelterId(event.target.value)}
              className="h-full min-h-11 cursor-pointer bg-transparent py-2 font-semibold text-ink-2 outline-none"
            >
              <option value="todos">Todos los refugios</option>
              {shelters.map((shelter) => (
                <option key={shelter.id} value={shelter.id}>
                  {shelter.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <p className="mt-6 text-sm text-ink-2" role="status">
        {resultLabel}
      </p>

      {filtered.length === 0 ? (
        <div className="mt-4 grid min-h-56 place-items-center rounded-lg border border-dashed border-rule-strong p-8 text-center">
          <div className="max-w-sm">
            <Search size={26} className="mx-auto text-ink-3" aria-hidden="true" />
            <p className="mt-3 text-lg font-semibold text-ink">No hay mascotas con esos filtros</p>
            <p className="mt-1.5 text-sm leading-6 text-ink-2">
              Prueba cambiando la especie o el refugio para ver más perfiles en adopción.
            </p>
          </div>
        </div>
      ) : (
        <div
          className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          aria-label="Resultados de mascotas en adopción"
        >
          {filtered.map((card) => (
            <AdoptionPetCard key={card.petId} card={card} />
          ))}
        </div>
      )}
    </section>
  );
}
