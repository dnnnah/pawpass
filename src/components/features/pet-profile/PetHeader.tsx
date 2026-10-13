import Image from "next/image";
import { Heart, Mars, Microchip, Ruler, ShieldCheck, Venus } from "lucide-react";
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
    age: string;
    gender: string;
    size: string;
    id: string;
    image: string;
    status: {
      vaccines: string;
      sterilized: string;
      microchip: string;
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
      {/* Aparecen en todos los anchos, no solo en escritorio, y por eso la
          seccion reserva una banda arriba por debajo de `sm`. A 320px la foto
          centrada de 240px deja 24px de margen a cada lado: menos que cualquier
          huella legible, asi que la unica banda libre es la de arriba.
          La banda mide 88px porque la caja de marcas, a `[scale:0.5]`, mide
          80px de alto: con los 44px de `pt-11` que tenia antes, la estrella de
          abajo caia 26px dentro de la foto. A partir de 640px el margen llega a
          184px y la marca vuelve a la esquina, junto al espacio que el titular
          no usa, y la banda sobra. */}
      {/* Escala mobile 0.5, no 0.28: la caja completa mide 160x144, y a 0.28
          quedaban 45x40px, demasiado pequenos para que se leyeran. 0.5 son
          80x72px, que ya pesan sin pisar el texto. Desde sm el valor es el mismo
          que ya estaba. */}
      <PetMarks className="right-0 top-0 origin-top-right [scale:0.5] sm:[scale:0.72] lg:[scale:1]" />
      {/* La foto crece con el ancho en vez de quedarse en 240px para siempre:
          240 era el unico tamaño que cabia a 320px de pantalla, y arrastrarlo a
          sm y lg lo dejaba pequeno al lado de un nombre que si manda. 240 en
          movil mantiene el margen de 24px que necesita la banda de las marcas;
          300 y 380 ya no son el vinculo, son la foto.

          La columna de la foto sigue apareciendo en `lg` y no antes, como
          estaba. Probar con dos columnas desde sm es lo que hace que un nombre
          de diez letras se parta en dos lineas a 640px: la columna de texto se
          queda en 304px y el titular deja de caber. Apilado, el texto usa todo
          el ancho y el nombre nunca se rompe. */}
      <div className="grid items-start gap-7 sm:gap-9 lg:grid-cols-[380px_1fr]">
        <div className="mx-auto w-full max-w-[240px] sm:max-w-[300px] lg:mx-0 lg:max-w-none">
          <div className="overflow-hidden rounded-lg bg-sunken ring-1 ring-rule">
            <Image
              src={pet.image}
              alt={`Foto de ${pet.name}`}
              width={900}
              height={900}
              priority
              className="aspect-square w-full object-cover"
            />
          </div>
        </div>

        <div className="min-w-0">
          {/* El nombre es el titular del perfil y es lo primero que se busca al
              abrirlo. 44px en movil cabe en 320px con nombres largos, 56px usa
              el ancho de una columna apilada y 72px es el remate de escritorio,
              por debajo de los 96px del diseño anterior: a 96 el nombre se
              comia la mitad de la pantalla y empujaba el resto del expediente
              fuera de la primera pantalla. */}
          <h1 className="text-[2.75rem] leading-[1.03] text-ink sm:text-[3.5rem] lg:text-[4.5rem]">
            {pet.name}
          </h1>
          <p className="mt-2.5 flex flex-wrap items-center gap-x-2 text-lg text-ink-2">
            <span>{pet.breed}</span>
            {SpeciesIcon ? (
              <SpeciesIcon size={16} strokeWidth={1.75} className="text-ink-3" aria-hidden="true" />
            ) : (
              <span aria-hidden="true">·</span>
            )}
            <span>{pet.species}</span>
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            {statusBadge}
            <Pill tone="muted">{pet.age}</Pill>
            <Pill tone="muted" icon={<GenderIcon size={13} />}>
              {pet.gender}
            </Pill>
            <Pill tone="muted" icon={<Ruler size={13} />}>
              {pet.size}
            </Pill>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2 border-y border-rule py-2.5">
            <span className="tnum text-[0.9375rem] font-semibold text-ink">
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
