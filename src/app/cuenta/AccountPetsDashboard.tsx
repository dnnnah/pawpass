import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, PawPrint, Plus } from "lucide-react";
import { Pill } from "@/components/ui/Pill";
import { Surface } from "@/components/ui/Surface";
import { AdoptionPublicationForm } from "@/components/features/adoption/AdoptionPublicationForm";
import { prioritizeAccountPets, type AccountPet } from "@/lib/account/pets";
import { CreatePetForm } from "./CreatePetForm";
import { LostStatusForm } from "./LostStatusForm";
import { DeleteDataControl } from "./DeleteDataControl";
import { PublicProfileShareButton } from "./PublicProfileShareButton";

export function AccountPetsDashboard({ pets, error, showHeading = true }: { pets: AccountPet[]; error: string | null; showHeading?: boolean }) {
  const ordered = prioritizeAccountPets(pets);
  return <>
    <section id="mis-mascotas" aria-labelledby="mis-mascotas-titulo" className="scroll-mt-28">
      <div className={showHeading ? "mb-4 flex items-baseline justify-between gap-3" : "sr-only"}>
        <h2 id="mis-mascotas-titulo" className="font-display text-2xl text-ink">Mis mascotas</h2>
        <span className="text-sm text-ink-3">{pets.length} {pets.length === 1 ? "mascota" : "mascotas"}</span>
      </div>
      {error ? <Surface tone="danger" variant="accent" size="md" rest={{ role: "alert" }}>{error}</Surface> : null}
      {!pets.length && !error ? <Surface variant="outline" size="lg" className="text-center">
        <PawPrint size={28} className="mx-auto text-brand" aria-hidden="true" />
        <h3 className="mt-3 font-display text-xl text-ink">Aún no tienes mascotas registradas</h3>
        <p className="mt-2 text-sm text-ink-2">Cuando quieras, abre el registro para crear su carnet privado.</p>
      </Surface> : null}
      <div className="grid min-w-0 grid-cols-1 items-start gap-5 md:grid-cols-2 xl:grid-cols-3">
        {ordered.map((pet) => <Surface key={pet.id} as="article" size="md" tone={pet.status === "perdido" ? "danger" : undefined}
          variant={pet.status === "perdido" ? "accent" : "paper"} className={pet.status === "perdido" ? "border-danger-rule! bg-danger-soft! ring-1 ring-danger-rule" : ""}>
          {pet.status === "perdido" ? <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><Pill tone="danger" icon={<AlertTriangle size={14} />}>Perdida · Alerta activa</Pill><Link href={`/p/${encodeURIComponent(pet.publicCode)}`} className="inline-flex min-h-11 items-center rounded-sm text-sm font-semibold text-brand underline decoration-brand-rule underline-offset-4">Ver ficha pública</Link></div> : null}
          {pet.photoUrl ? <Image src={pet.photoUrl} alt={`Foto de ${pet.name}`} width={800} height={600} unoptimized className="mb-4 aspect-[4/3] w-full rounded-md bg-sunken object-contain" />
            : <span className="mb-4 grid aspect-[4/3] place-items-center rounded-md bg-sunken text-brand"><PawPrint size={30} aria-hidden="true" /></span>}
          <h3 className="break-words font-display text-2xl text-ink">{pet.name}</h3>
          <p className="mt-1 text-sm text-ink-2">{pet.species === "perro" ? "Perro" : "Gato"}{pet.breed ? ` · ${pet.breed}` : ""}</p>
          {pet.adoptionPublished ? <div className="mt-2"><Pill tone="adoption" size="sm">En adopción</Pill></div> : null}
          <Link href={`/cuenta/mascotas/${pet.id}`} aria-label={`Abrir carnet privado de ${pet.name}`} className="mt-3 inline-flex min-h-11 items-center rounded-sm text-sm font-semibold text-brand underline decoration-brand-rule underline-offset-4 hover:text-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">Abrir carnet privado</Link>
          {pet.publicProfilePublished === true ? <div className="mt-3 rounded-md bg-sunken p-3">
            <p className="text-sm font-semibold text-ink">Perfil público voluntario activo</p>
            <p className="mt-1 text-xs leading-5 text-ink-2">Muestra únicamente la información y las fotos que autorizaste.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href={`/perfil/${encodeURIComponent(pet.publicCode)}`} className="inline-flex min-h-11 items-center rounded-sm text-sm font-semibold text-brand underline decoration-brand-rule underline-offset-4">Abrir perfil público</Link>
              <PublicProfileShareButton publicCode={pet.publicCode} />
            </div>
          </div> : pet.role === "administrador" ? <div className="mt-3 rounded-md bg-sunken p-3">
            <p className="text-sm font-semibold text-ink">{pet.publicProfilePublished === false ? "Perfil público voluntario inactivo" : "Estado del perfil público por revisar"}</p>
            <p className="mt-1 text-xs leading-5 text-ink-2">Elige qué datos y fotos quieres compartir antes de activarlo.</p>
            <Link href={`/cuenta/mascotas/${encodeURIComponent(pet.id)}#perfil-publico`} className="mt-2 inline-flex min-h-11 items-center rounded-sm text-sm font-semibold text-brand underline decoration-brand-rule underline-offset-4">{pet.publicProfilePublished === false ? "Configurar perfil público" : "Revisar perfil público"}</Link>
          </div> : null}
          {pet.role === "administrador" ? <LostStatusForm petId={pet.id} petName={pet.name} status={pet.status} canEdit /> : null}
          <details className="mt-4 border-t border-rule pt-4">
            <summary className="cursor-pointer text-sm font-semibold text-ink">Adopción</summary>
            <AdoptionPublicationForm petId={pet.id} petName={pet.name} status={pet.status} publicationActive={pet.adoptionPublished === true} canEdit={pet.role === "administrador"} />
          </details>
          {pet.role === "administrador" ? <DeleteDataControl petId={pet.id} petName={pet.name} /> : null}
        </Surface>)}
      </div>
    </section>
    <section aria-label="Registro de mascota" className="border-t border-rule pt-8">
      <details id="agregar-mascota" className="scroll-mt-28">
        <summary className="flex min-h-11 w-fit cursor-pointer list-none items-center gap-2 rounded-md bg-brand px-4 text-sm font-semibold text-on-solid shadow-1 transition-colors hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand [&::-webkit-details-marker]:hidden">
          <Plus size={17} aria-hidden="true" />
          Registrar nueva mascota
        </summary>
        <div className="mt-5 max-w-2xl"><CreatePetForm /></div>
      </details>
    </section>
  </>;
}
