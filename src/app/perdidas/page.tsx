import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, Download, MapPin, MessageCircle, PawPrint, Phone } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Surface } from "@/components/ui/Surface";
import { buildWhatsAppHref, toE164Digits } from "@/lib/phone";
import { loadPublicLostPets } from "@/app/lostDirectory";
import { getAccountPets } from "@/app/cuenta/accountData";
import { splitLostPetLists } from "@/lib/account/lostPets";
import type { AccountPet } from "@/lib/account/pets";

export const metadata: Metadata = {
  title: "Mascotas perdidas | PawPass",
  description: "Ayuda a que las mascotas perdidas vuelvan a casa.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function OwnedLostCard({ pet }: { pet: AccountPet }) {
  return <Surface as="article" size="md" className="flex flex-col">
    <div className="overflow-hidden rounded-md bg-sunken">
      {pet.photoUrl ? <Image src={pet.photoUrl} alt={`Foto de ${pet.name}`} width={960} height={720} unoptimized className="aspect-[4/3] w-full bg-sunken object-contain" />
        : <div className="grid aspect-[4/3] place-items-center text-ink-3"><PawPrint size={38} aria-hidden="true" /></div>}
    </div>
    <div className="mt-4 flex-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-danger">Alerta de tu familia</p>
      <h3 className="mt-1 font-display text-2xl text-ink">{pet.name}</h3>
      <p className="text-sm text-ink-2">{pet.species === "perro" ? "Perro" : "Gato"}{pet.breed ? ` · ${pet.breed}` : ""}</p>
    </div>
    <Link href={`/cuenta/mascotas/${pet.id}`} aria-label={`Abrir carnet privado de ${pet.name}`} className="mt-5 inline-flex min-h-11 items-center rounded-sm text-sm font-semibold text-brand underline decoration-brand-rule underline-offset-4 hover:text-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">Abrir carnet privado</Link>
    <Button href={`/cuenta/mascotas/${encodeURIComponent(pet.id)}/alerta`} size="sm" variant="secondary" className="mt-3 w-fit" icon={<Download size={15} />}>Generar imagen para compartir</Button>
  </Surface>;
}

export default async function LostPetsPage() {
  const [directory, account] = await Promise.all([loadPublicLostPets(), getAccountPets(false)]);
  const { owned, community } = splitLostPetLists(account.pets, directory.pets);
  const total = owned.length + community.length;
  return <AppShell>
    <div className="mx-auto max-w-6xl px-4 pb-12 sm:px-6 lg:px-8">
      <header className="mb-7">
        <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-danger"><AlertTriangle size={16} aria-hidden="true" />Rescate PawPass</p>
        <h1 className="mt-2 font-display text-4xl text-ink">Mascotas perdidas</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-2">Estas alertas están activas. Si reconoces o encuentras a una mascota, usa el canal de contacto de su familia.</p>
      </header>

      {account.authenticated && account.error ? <Surface variant="accent" tone="danger" size="md" rest={{ role: "alert" }}>{account.error}</Surface> : null}
      {owned.length ? <section aria-labelledby="tus-alertas-titulo" className="mb-8">
        <h2 id="tus-alertas-titulo" className="mb-4 font-display text-2xl text-ink">Tus mascotas perdidas</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{owned.map((pet) => <OwnedLostCard key={pet.publicCode} pet={pet} />)}</div>
      </section> : null}
      {directory.error ? <Surface variant="accent" tone="danger" size="md" rest={{ role: "alert" }}>{directory.error}</Surface>
        : total === 0 ? <Surface variant="outline" size="lg" className="text-center">
          <PawPrint className="mx-auto text-brand" size={28} aria-hidden="true" />
          <h2 className="mt-3 font-display text-2xl text-ink">No hay alertas activas</h2>
          <p className="mt-1 text-sm text-ink-2">Cuando una familia reporte una mascota perdida, su ficha aparecerá aquí.</p>
        </Surface>
        : community.length ? <section aria-labelledby="otras-alertas-titulo" className="mb-8">
          <h2 id="otras-alertas-titulo" className="mb-4 font-display text-2xl text-ink">Otras alertas activas</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{community.map((pet) => <Surface key={pet.publicCode} as="article" size="md" className="flex flex-col">
            <div className="overflow-hidden rounded-md bg-sunken">
              {pet.photoUrl ? <Image src={pet.photoUrl} alt={`Foto de ${pet.name}`} width={960} height={720} unoptimized className="aspect-[4/3] w-full bg-sunken object-contain" />
                : <div className="grid aspect-[4/3] place-items-center text-ink-3"><PawPrint size={38} aria-hidden="true" /></div>}
            </div>
            <div className="mt-4 flex-1">
              <h2 className="font-display text-2xl text-ink">{pet.name}</h2>
              <p className="text-sm text-ink-2">{pet.species}{pet.breed ? ` · ${pet.breed}` : ""}</p>
              {pet.lost?.zona || pet.zone ? <p className="mt-3 flex items-start gap-2 text-sm leading-5 text-ink-2"><MapPin size={16} className="mt-0.5 shrink-0 text-danger" aria-hidden="true" /><span>{pet.lost?.zona ?? pet.zone}</span></p> : null}
              {pet.contact?.name ? <p className="mt-2 text-sm text-ink-2">Contacto: {pet.contact.name}</p> : null}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {pet.contact?.phone ? <Button href={`tel:${toE164Digits(pet.contact.phone)}`} size="sm" icon={<Phone size={15} />}>Llamar</Button> : null}
              {pet.contact?.whatsapp ? <Button href={buildWhatsAppHref(pet.contact.whatsapp, `Hola, encontré a ${pet.name}. Vi su alerta de PawPass.`)} size="sm" variant="secondary" icon={<MessageCircle size={15} />}>WhatsApp</Button> : null}
              {pet.contact?.email ? <Button href={`mailto:${pet.contact.email}`} size="sm" variant="secondary">Correo</Button> : null}
              <Button href={`/p/${encodeURIComponent(pet.publicCode)}`} size="sm" variant="quiet">Ver ficha</Button>
            </div>
          </Surface>)}</div>
        </section> : null}
    </div>
  </AppShell>;
}
