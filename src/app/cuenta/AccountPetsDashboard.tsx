import Image from "next/image";
import { AlertTriangle, PawPrint, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";
import { Surface } from "@/components/ui/Surface";
import { AdoptionPublicationForm } from "@/components/features/adoption/AdoptionPublicationForm";
import { prioritizeAccountPets, type AccountPet } from "@/lib/account/pets";
import { CreatePetForm } from "./CreatePetForm";
import { LostStatusForm } from "./LostStatusForm";
import { DeleteDataControl } from "./DeleteDataControl";

export function AccountPetsDashboard({ pets, error, showHeading = true }: { pets: AccountPet[]; error: string | null; showHeading?: boolean }) {
  const ordered = prioritizeAccountPets(pets);
  return <>
    <div className="flex flex-wrap gap-3">
      <Button href="#agregar-mascota" icon={<Plus size={17} />}>Agregar una mascota</Button>
      <Button href="/perdidas" variant="danger" icon={<AlertTriangle size={17} />}>Ver mascotas perdidas</Button>
    </div>
    <section id="mis-mascotas" aria-labelledby="mis-mascotas-titulo" className="scroll-mt-28">
      <div className={showHeading ? "mb-4 flex items-baseline justify-between gap-3" : "sr-only"}>
        <h2 id="mis-mascotas-titulo" className="font-display text-2xl text-ink">Mis mascotas</h2>
        <span className="text-sm text-ink-3">{pets.length} {pets.length === 1 ? "mascota" : "mascotas"}</span>
      </div>
      {error ? <Surface tone="danger" variant="accent" size="md" rest={{ role: "alert" }}>{error}</Surface> : null}
      {!pets.length && !error ? <Surface variant="outline" size="lg" className="text-center">
        <PawPrint size={28} className="mx-auto text-brand" aria-hidden="true" />
        <h3 className="mt-3 font-display text-xl text-ink">Aún no tienes mascotas registradas</h3>
        <p className="mt-2 text-sm text-ink-2">Agrega la primera para crear su carnet privado.</p>
        <Button href="#agregar-mascota" className="mt-4">Registrar mi primera mascota</Button>
      </Surface> : null}
      <div className="grid items-start gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {ordered.map((pet) => <Surface key={pet.id} as="article" size="md" tone={pet.status === "perdido" ? "danger" : undefined}
          variant={pet.status === "perdido" ? "accent" : "paper"} className={pet.status === "perdido" ? "border-danger-rule! bg-danger-soft! ring-1 ring-danger-rule" : ""}>
          {pet.status === "perdido" ? <div className="mb-4"><Pill tone="danger" icon={<AlertTriangle size={14} />}>Perdida · Alerta activa</Pill></div> : null}
          {pet.photoUrl ? <Image src={pet.photoUrl} alt={`Foto de ${pet.name}`} width={800} height={600} unoptimized className="mb-4 aspect-[4/3] w-full rounded-md object-cover" />
            : <span className="mb-4 grid aspect-[4/3] place-items-center rounded-md bg-sunken text-brand"><PawPrint size={30} aria-hidden="true" /></span>}
          <h3 className="break-words font-display text-2xl text-ink">{pet.name}</h3>
          <p className="mt-1 text-sm text-ink-2">{pet.species === "perro" ? "Perro" : "Gato"}{pet.breed ? ` · ${pet.breed}` : ""}</p>
          {pet.adoptionPublished ? <div className="mt-2"><Pill tone="adoption" size="sm">En adopción</Pill></div> : null}
          <Button href={`/cuenta/mascotas/${pet.id}`} variant="secondary" className="mt-4 w-full">Abrir carnet privado</Button>
          {pet.role === "administrador" ? <LostStatusForm petId={pet.id} petName={pet.name} status={pet.status} canEdit /> : null}
          <details className="mt-4 border-t border-rule pt-4">
            <summary className="cursor-pointer text-sm font-semibold text-ink">Adopción</summary>
            <AdoptionPublicationForm petId={pet.id} petName={pet.name} status={pet.status} publicationActive={pet.adoptionPublished === true} canEdit={pet.role === "administrador"} />
          </details>
          {pet.role === "administrador" ? <DeleteDataControl petId={pet.id} petName={pet.name} /> : null}
        </Surface>)}
      </div>
    </section>
    <section id="agregar-mascota" aria-label="Agregar una mascota" className="scroll-mt-28 border-t border-rule pt-8">
      <div className="max-w-2xl"><CreatePetForm /></div>
    </section>
  </>;
}
