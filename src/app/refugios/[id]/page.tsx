import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  HeartHandshake,
  Link2,
  Mail,
  MapPin,
  MessageCircle,
  PawPrint,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { BackLink } from "@/components/ui/BackLink";
import { Badge } from "@/components/ui/Badge";
import { Surface } from "@/components/ui/Surface";
import { SubpageHeader } from "@/components/ui/SubpageHeader";
import { PrototypeNotice } from "@/components/features/adoption/PrototypeNotice";
import { ShelterPetCard } from "@/components/features/adoption/ShelterPetCard";
import { filterAdoptablePets } from "@/lib/domain/adoption";
import { findShelterById } from "@/lib/domain/shelter";
import { buildShelterPetCard, normalizeSocialUrl } from "@/lib/mapping/adoptionPresentation";
import { buildWhatsAppHref, toE164Digits } from "@/lib/phone";
import { getAdoptionDemoPets } from "@/lib/services/pets/queries";
import { getMockShelters } from "@/lib/services/shelters/queries";

type ShelterPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateStaticParams() {
  const shelters = await getMockShelters();

  return shelters.map((shelter) => ({ id: shelter.id }));
}

export async function generateMetadata({ params }: ShelterPageProps): Promise<Metadata> {
  const { id } = await params;
  const shelter = findShelterById(await getMockShelters(), id);

  if (!shelter) {
    return {
      title: "Refugio no encontrado | PawPass",
      robots: { index: false },
    };
  }

  return {
    title: `${shelter.nombre} | PawPass`,
    description: `${shelter.nombre} · ${shelter.ubicacion}. Perfil de refugio de demostración dentro del prototipo de adopción de PawPass.`,
  };
}

export default async function ShelterPage({ params }: ShelterPageProps) {
  const { id } = await params;
  const [shelters, allPets] = await Promise.all([getMockShelters(), getAdoptionDemoPets()]);
  const shelter = findShelterById(shelters, id);

  if (!shelter) {
    notFound();
  }

  const shelterPets = allPets.filter((pet) => shelter.mascotas.includes(pet.id));
  const adoptablePets = filterAdoptablePets(shelterPets);
  const otherPets = shelterPets.filter((pet) => !adoptablePets.some((adoptable) => adoptable.id === pet.id));

  const whatsappMessage = `Hola, me interesa adoptar una mascota de ${shelter.nombre}. Vi su perfil en PawPass.`;
  const whatsappHref = buildWhatsAppHref(shelter.contacto.whatsapp, whatsappMessage);
  const phoneDigits = toE164Digits(shelter.contacto.telefono);
  const socialLinks = shelter.redes.map(normalizeSocialUrl).filter(Boolean);

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <BackLink href="/adopciones">Volver al catálogo de adopción</BackLink>

          <SubpageHeader
            eyebrow="Refugio"
            title={shelter.nombre}
            description={shelter.descripcion}
          />

          <PrototypeNotice />

          <Surface as="section" rest={{ "aria-labelledby": "refugio-informacion" }} className="p-6">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="refugio-informacion" className="font-display text-xl leading-tight text-ink">
                Información del refugio
              </h2>
              <Badge tone={shelter.verificado ? "success" : "muted"} icon={<ShieldCheck size={15} aria-hidden="true" />}>
                {shelter.verificado ? "Refugio verificado" : "Sin verificar"}
              </Badge>
            </div>

            <div className="mt-4 grid gap-3">
              <p className="flex items-center gap-2 text-sm text-ink-2">
                <MapPin size={16} className="shrink-0 text-ink-3" aria-hidden="true" />
                {shelter.ubicacion}
              </p>
              <p className="text-sm text-ink-2">
                Persona responsable: {shelter.contacto.nombreResponsable}
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {phoneDigits ? (
                <a
                  href={`tel:${phoneDigits}`}
                  className="inline-flex min-h-11 items-center gap-2 rounded-md bg-brand px-4 text-sm font-semibold text-on-solid transition-colors hover:bg-brand-hover"
                >
                  <Phone size={16} aria-hidden="true" />
                  Llamar
                </a>
              ) : null}
              {whatsappHref ? (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 items-center gap-2 rounded-md bg-success px-4 text-sm font-semibold text-on-solid transition-colors hover:brightness-110"
                >
                  <MessageCircle size={16} aria-hidden="true" />
                  WhatsApp
                </a>
              ) : null}
              {shelter.contacto.email ? (
                <a
                  href={`mailto:${shelter.contacto.email}`}
                  className="inline-flex min-h-11 items-center gap-2 rounded-md border border-rule bg-surface px-4 text-sm font-semibold text-ink-2 transition-colors hover:border-brand-rule hover:text-brand"
                >
                  <Mail size={16} aria-hidden="true" />
                  Escribir correo
                </a>
              ) : null}
            </div>

            {socialLinks.length > 0 ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {socialLinks.map((link) => (
                  <a
                    key={link}
                    href={link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-rule px-3 text-xs font-semibold text-ink-2 transition-colors hover:border-brand-rule hover:text-brand"
                  >
                    <Link2 size={13} aria-hidden="true" />
                    {link.replace(/^https?:\/\//, "")}
                  </a>
                ))}
              </div>
            ) : null}
          </Surface>

          <section aria-labelledby="refugio-adoptables">
            <h2
              id="refugio-adoptables"
              className="flex items-center gap-2 font-display text-2xl leading-tight text-ink"
            >
              <HeartHandshake size={20} className="text-adoption" aria-hidden="true" />
              Mascotas en adopción
            </h2>
            {adoptablePets.length === 0 ? (
              <div className="mt-4 grid min-h-40 place-items-center rounded-md border border-dashed border-rule-strong p-6 text-center">
                <p className="max-w-sm text-sm leading-6 text-ink-2">
                  Por el momento este refugio no tiene mascotas disponibles para adopción.
                </p>
              </div>
            ) : (
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                {adoptablePets.map((pet) => (
                  <ShelterPetCard key={pet.id} pet={buildShelterPetCard(pet)} />
                ))}
              </div>
            )}
          </section>

          {otherPets.length > 0 ? (
            <section aria-labelledby="refugio-otras">
              <h2
                id="refugio-otras"
                className="flex items-center gap-2 font-display text-2xl leading-tight text-ink"
              >
                <PawPrint size={20} className="text-ink-3" aria-hidden="true" />
                Otras mascotas bajo su cuidado
              </h2>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                {otherPets.map((pet) => (
                  <ShelterPetCard key={pet.id} pet={buildShelterPetCard(pet)} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}