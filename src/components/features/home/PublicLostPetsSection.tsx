import Image from "next/image";
import { AlertTriangle, PawPrint } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Surface } from "@/components/ui/Surface";
import { splitLostPetLists } from "@/lib/account/lostPets";
import { loadPublicLostPets } from "@/app/lostDirectory";
import type { AccountPet } from "@/lib/account/pets";

export async function PublicLostPetsSection({ ownedPets }: { ownedPets: AccountPet[] }) {
  const { pets, error } = await loadPublicLostPets();
  const { community } = splitLostPetLists(ownedPets, pets);
  return <section aria-labelledby="alertas-publicas-titulo" className="border-t border-rule pt-8">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 id="alertas-publicas-titulo" className="flex items-center gap-2 font-display text-2xl text-ink"><AlertTriangle size={21} className="text-danger" aria-hidden="true" />Mascotas perdidas</h2>
        <p className="mt-2 text-sm leading-6 text-ink-2">Alertas activas de otras familias, también si su perfil voluntario está desactivado.</p>
      </div>
      <Button href="/perdidas" variant="secondary" size="sm">Ver todas las alertas</Button>
    </div>
    {error ? <Surface variant="accent" tone="danger" size="md" className="mt-4" rest={{ role: "alert" }}>{error}</Surface>
      : community.length ? <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {community.slice(0, 3).map((pet) => <Surface key={pet.publicCode} as="article" size="md" className="flex flex-col">
          <div className="overflow-hidden rounded-md bg-sunken">
            {pet.photoUrl ? <Image src={pet.photoUrl} alt={`Foto de ${pet.name}`} width={720} height={540} unoptimized className="aspect-[4/3] w-full bg-sunken object-contain" />
              : <div className="grid aspect-[4/3] place-items-center text-ink-3"><PawPrint size={34} aria-hidden="true" /></div>}
          </div>
          <h3 className="mt-4 font-display text-xl text-ink">{pet.name}</h3>
          <p className="text-sm text-ink-2">{pet.species}{pet.breed ? ` · ${pet.breed}` : ""}</p>
          {pet.lost?.zona || pet.zone ? <p className="mt-2 text-sm text-ink-2">Zona: {pet.lost?.zona ?? pet.zone}</p> : null}
          <Button href={`/p/${encodeURIComponent(pet.publicCode)}`} size="sm" variant="secondary" className="mt-4">Ver ficha de rescate</Button>
        </Surface>)}
      </div> : <p className="mt-4 rounded-md bg-sunken px-4 py-3 text-sm text-ink-2">No hay alertas públicas activas en este momento.</p>}
  </section>;
}
