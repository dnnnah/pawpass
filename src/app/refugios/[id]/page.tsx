import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HeartHandshake, Link2, Mail, MapPin, PawPrint, Phone, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { BackLink } from "@/components/ui/BackLink";
import { Badge } from "@/components/ui/Badge";
import { SubpageHeader } from "@/components/ui/SubpageHeader";
import { AdoptionPetCard } from "@/components/features/adoption/AdoptionPetCard";
import { buildCatalogCard, normalizeSocialUrl } from "@/lib/mapping/adoptionPresentation";
import { getAdoptionCatalogEntries } from "@/lib/services/adoption/queries";
import { getShelters } from "@/lib/services/shelters/queries";
import { buildWhatsAppHref, toE164Digits } from "@/lib/phone";
import type { Shelter } from "@/types/shelter";
import type { AdoptionCatalogEntry } from "@/types/adoption";

type ShelterPageProps = { params: Promise<{ id: string }> };

async function getPublicShelter(id: string) {
  const shelters = await getShelters();
  return shelters.find((shelter) => shelter.id === id) ?? null;
}

export async function generateMetadata({ params }: ShelterPageProps): Promise<Metadata> {
  const { id } = await params;
  const shelter = await getPublicShelter(id);
  if (!shelter) return { title: "Refugio no encontrado | PawPass", robots: { index: false } };
  return { title: `${shelter.nombre} | PawPass`, description: `${shelter.nombre} · ${shelter.ubicacion}. Refugio participante en PawPass.` };
}

export default async function ShelterPage({ params }: ShelterPageProps) {
  const { id } = await params;
  let shelter: Shelter | null = null;
  let entries: AdoptionCatalogEntry[] = [];
  try {
    [shelter, entries] = await Promise.all([getPublicShelter(id), getAdoptionCatalogEntries()]);
  } catch {
    return <AppShell><div className="mx-auto max-w-5xl px-4 py-10"><BackLink href="/refugios">Volver a refugios</BackLink><p role="alert" className="mt-6 rounded-md border border-danger-rule bg-danger-soft p-5 text-sm text-danger">No pudimos cargar este refugio. Intenta de nuevo más tarde.</p></div></AppShell>;
  }
  if (!shelter) notFound();

  const pets = entries.filter((entry) => entry.shelterId === shelter.id).map(buildCatalogCard);
  const phoneDigits = toE164Digits(shelter.contacto.telefono);
  const whatsappHref = buildWhatsAppHref(shelter.contacto.whatsapp, `Hola, me interesa adoptar una mascota de ${shelter.nombre}. Vi su perfil en PawPass.`);
  const socialLinks = shelter.redes.map(normalizeSocialUrl).filter(Boolean);

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <BackLink href="/refugios">Volver al directorio</BackLink>
          <SubpageHeader eyebrow="Refugio" title={shelter.nombre} description={shelter.descripcion || "Organización participante en el directorio público de PawPass."} />
          <section aria-labelledby="refugio-informacion" className="rounded-lg border border-rule bg-surface p-6">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="refugio-informacion" className="font-display text-xl leading-tight text-ink">Información del refugio</h2>
              <Badge tone={shelter.verificado ? "success" : "muted"} icon={<ShieldCheck size={15} aria-hidden="true" />}>
                {shelter.verificado ? "Refugio verificado" : "Sin verificar"}
              </Badge>
            </div>
            {shelter.ubicacion ? <p className="mt-4 flex items-center gap-2 text-sm text-ink-2"><MapPin size={16} className="shrink-0 text-ink-3" aria-hidden="true" />{shelter.ubicacion}</p> : null}
            <div className="mt-5 flex flex-wrap gap-3">
              {phoneDigits ? <a href={`tel:${phoneDigits}`} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-brand px-4 text-sm font-semibold text-on-solid"><Phone size={16} aria-hidden="true" />Llamar</a> : null}
              {whatsappHref ? <a href={whatsappHref} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-md bg-success px-4 text-sm font-semibold text-on-solid"><PawPrint size={16} aria-hidden="true" />WhatsApp</a> : null}
              {shelter.contacto.email ? <a href={`mailto:${shelter.contacto.email}`} className="inline-flex min-h-11 items-center gap-2 rounded-md border border-rule bg-surface px-4 text-sm font-semibold text-ink-2"><Mail size={16} aria-hidden="true" />Escribir correo</a> : null}
            </div>
            {socialLinks.length ? <div className="mt-5 flex flex-wrap gap-2">{socialLinks.map((link) => <a key={link} href={link} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-rule px-3 text-xs font-semibold text-ink-2"><Link2 size={13} aria-hidden="true" />{link.replace(/^https?:\/\//, "")}</a>)}</div> : null}
          </section>
          <section aria-labelledby="refugio-adoptables">
            <h2 id="refugio-adoptables" className="flex items-center gap-2 font-display text-2xl leading-tight text-ink"><HeartHandshake size={20} className="text-adoption" aria-hidden="true" />Mascotas en adopción</h2>
            {pets.length === 0 ? <div className="mt-4 grid min-h-40 place-items-center rounded-md border border-dashed border-rule-strong p-6 text-center"><p className="max-w-sm text-sm leading-6 text-ink-2">Por el momento este refugio no tiene mascotas disponibles para adopción.</p></div> : <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{pets.map((pet) => <AdoptionPetCard key={pet.petId} card={pet} />)}</div>}
          </section>
        </div>
      </div>
    </AppShell>
  );
}
