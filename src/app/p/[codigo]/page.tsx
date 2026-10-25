import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AlertTriangle, CheckCircle2, Mail, MapPin, MessageCircle, PawPrint, Phone, ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Surface } from "@/components/ui/Surface";
import { getPetStatusMeta } from "@/lib/mapping/petStatusPresentation";
import { formatPhoneForDisplay } from "@/lib/mapping/profile";
import { buildWhatsAppHref, toE164Digits } from "@/lib/phone";
import { createSupabasePublicPetDirectory } from "@/lib/infra/directory/supabasePublicPets";
import { hasSupabaseEnv } from "@/lib/infra/supabase/env";
import { createSupabaseServerClient } from "@/lib/infra/supabase/server";
import { getPublicPetCard } from "@/lib/services/pets/public";
import { staticPublicPetDirectory } from "@/lib/infra/directory/staticPublicPets";

type PublicPetPageProps = {
  params: Promise<{ codigo: string }>;
};

export const dynamic = "force-dynamic";

async function getPublicCard(publicCode: string) {
  if (!hasSupabaseEnv()) {
    return getPublicPetCard(publicCode, staticPublicPetDirectory);
  }

  const cookieStore = await cookies();
  const client = createSupabaseServerClient({
    getAll: () => cookieStore.getAll(),
    setAll: (cookiesToSet) => {
      try {
        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
      } catch {
        // Server Components can read cookies but cannot always mutate them.
      }
    },
  });

  return getPublicPetCard(publicCode, createSupabasePublicPetDirectory(client));
}

export async function generateMetadata({ params }: PublicPetPageProps): Promise<Metadata> {
  const { codigo } = await params;
  const pet = await getPublicCard(codigo);

  if (!pet) {
    return {
      title: "Ficha no encontrada | PawPass",
      robots: { index: false, follow: false },
    };
  }

  const status = getPetStatusMeta(pet.status);
  const description = `${pet.name} · ${pet.species}${pet.breed ? ` · ${pet.breed}` : ""}. ${status.description}`;

  return {
    title: `${pet.name} | PawPass`,
    description,
    alternates: { canonical: `/p/${encodeURIComponent(pet.publicCode)}` },
    robots: { index: false, follow: false },
    openGraph: {
      title: `${pet.name} | PawPass`,
      description,
      type: "profile",
      images: pet.photoUrl ? [{ url: pet.photoUrl, alt: `Foto de ${pet.name}` }] : undefined,
    },
  };
}

function formatDate(value: string | null) {
  if (!value) return null;
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "long" }).format(date);
}

export default async function PublicPetPage({ params }: PublicPetPageProps) {
  const { codigo } = await params;
  const pet = await getPublicCard(codigo);

  if (!pet) {
    notFound();
  }

  const status = getPetStatusMeta(pet.status);
  const StatusIcon = status.icon;
  const phoneDigits = pet.contact?.phone ? toE164Digits(pet.contact.phone) : "";
  const whatsappHref = pet.contact?.whatsapp
    ? buildWhatsAppHref(pet.contact.whatsapp, `Hola, encontré a ${pet.name}. Escaneé su QR de PawPass.`)
    : "";
  const isLost = pet.status === "perdido" && pet.lost !== null;

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <header className="border-b border-rule pb-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-ink-3">
                <PawPrint size={17} aria-hidden="true" />
                Ficha pública PawPass
              </p>
              <Badge tone={status.tone} icon={<StatusIcon size={15} aria-hidden="true" />}>
                {status.label}
              </Badge>
            </div>
            <div className="mt-5 grid gap-6 sm:grid-cols-[minmax(0,13rem)_1fr] sm:items-start">
              <div className="overflow-hidden rounded-lg bg-sunken ring-1 ring-rule">
                {pet.photoUrl ? (
                  // La URL puede venir de Storage o de la demo estática; por eso
                  // no se restringe a los dominios configurados en next/image.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={pet.photoUrl}
                    alt={`Foto de ${pet.name}`}
                    className="aspect-square w-full object-cover"
                  />
                ) : (
                  <div className="grid aspect-square place-items-center text-ink-3" aria-label="Sin foto disponible">
                    <PawPrint size={48} strokeWidth={1.25} aria-hidden="true" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <h1 className="font-display text-5xl leading-[0.98] text-ink sm:text-6xl">{pet.name}</h1>
                <p className="mt-3 text-lg text-ink-2">
                  {pet.species}
                  {pet.breed ? ` · ${pet.breed}` : ""}
                </p>
                <p className="mt-5 border-y border-rule py-3 text-sm text-ink-3">
                  Código público: <span className="font-semibold text-ink">{pet.publicCode}</span>
                </p>
                <p className="mt-4 flex items-start gap-2 text-sm leading-6 text-ink-2">
                  <StatusIcon size={17} className="mt-1 shrink-0 text-brand" aria-hidden="true" />
                  <span>{status.description}</span>
                </p>
              </div>
            </div>
          </header>

          {isLost ? (
            <Surface as="section" tone="danger" className="p-5 sm:p-6" rest={{ "aria-labelledby": "alerta-perdida" }}>
              <div className="flex items-start gap-3">
                <AlertTriangle size={22} className="mt-0.5 shrink-0 text-danger" aria-hidden="true" />
                <div className="min-w-0">
                  <h2 id="alerta-perdida" className="font-display text-2xl text-ink">
                    Esta mascota necesita ayuda
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-ink-2">
                    La información de esta alerta fue publicada por su tutor para facilitar el reencuentro.
                  </p>
                  <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                    {pet.lost?.zona ? (
                      <div className="flex items-start gap-2 text-ink-2">
                        <MapPin size={16} className="mt-0.5 shrink-0 text-danger" aria-hidden="true" />
                        <div>
                          <dt className="font-semibold text-ink">Última zona conocida</dt>
                          <dd>{pet.lost.zona}</dd>
                        </div>
                      </div>
                    ) : null}
                    {pet.lost?.fechaPerdida ? (
                      <div>
                        <dt className="font-semibold text-ink">Fecha del reporte</dt>
                        <dd className="text-ink-2">{formatDate(pet.lost.fechaPerdida)}</dd>
                      </div>
                    ) : null}
                  </dl>
                  {pet.lost?.mensaje ? <p className="mt-5 text-sm leading-6 text-ink-2">{pet.lost.mensaje}</p> : null}
                  {pet.lost && pet.lost.instrucciones.length > 0 ? (
                    <ul className="mt-4 grid gap-2 text-sm text-ink-2">
                      {pet.lost.instrucciones.map((instruction) => (
                        <li key={instruction} className="flex items-start gap-2">
                          <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-danger" aria-hidden="true" />
                          <span>{instruction}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>
            </Surface>
          ) : null}

          {pet.zone || pet.contact || pet.emergencyCareNote ? (
            <Surface as="section" tone={isLost ? "danger" : undefined} className="p-5 sm:p-6" rest={{ "aria-labelledby": "datos-qr" }}>
              <div className="flex items-center gap-2">
                <ShieldCheck size={20} className="text-success" aria-hidden="true" />
                <h2 id="datos-qr" className="font-display text-2xl text-ink">Datos para ayudar</h2>
              </div>
              <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                {!isLost && pet.zone ? <div><dt className="flex items-center gap-1.5 text-sm font-semibold text-ink"><MapPin size={15} aria-hidden="true" />Zona aproximada</dt><dd className="mt-1 text-sm leading-6 text-ink-2">{pet.zone}</dd></div> : null}
                {pet.contact ? <div>
                  <dt className="text-sm font-semibold text-ink">{isLost ? "Contacto de rescate" : "Contacto elegido"}</dt>
                  <dd className="mt-1 text-sm leading-6 text-ink-2">{pet.contact.name ? `${pet.contact.name} · ` : ""}{pet.contact.phone ? formatPhoneForDisplay(pet.contact.phone) : pet.contact.whatsapp ? formatPhoneForDisplay(pet.contact.whatsapp) : pet.contact.email}</dd>
                </div> : null}
                {pet.emergencyCareNote ? <div className="sm:col-span-2"><dt className="text-sm font-semibold text-ink">Cuidados importantes</dt><dd className="mt-1 whitespace-pre-wrap text-sm leading-6 text-ink-2">{pet.emergencyCareNote}</dd></div> : null}
              </dl>
              {pet.contact ? <div className="mt-5 flex flex-wrap gap-3">
                {phoneDigits ? <Button href={`tel:${phoneDigits}`} variant={isLost ? "primary" : "secondary"} icon={<Phone size={17} />}>Llamar</Button> : null}
                {whatsappHref ? <Button href={whatsappHref} variant="secondary" icon={<MessageCircle size={17} />}>WhatsApp</Button> : null}
                {pet.contact.email ? <Button href={`mailto:${pet.contact.email}`} variant="secondary" icon={<Mail size={17} />}>Correo</Button> : null}
              </div> : null}
            </Surface>
          ) : null}

          {isLost ? <Surface as="section" variant="sunken" size="sm" rest={{ "aria-labelledby": "resumen-vacunacion" }}>
            <h2 id="resumen-vacunacion" className="font-semibold text-ink">Vacunación</h2>
            <p className="mt-1 text-sm leading-6 text-ink-2">
              {pet.vaccinationStatus === "al_dia" ? "El registro indica que las vacunas están al día." : pet.vaccinationStatus === "pendiente" ? "El registro indica que hay una vacuna pendiente." : "Sin información suficiente para calcular el estado de vacunación."}
            </p>
          </Surface> : null}

          {pet.recentPhotos.length > 0 ? (
            <Surface as="section" className="p-5 sm:p-6" rest={{ "aria-labelledby": "fotos-recientes" }}>
              <h2 id="fotos-recientes" className="font-display text-2xl text-ink">Fotos recientes</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {pet.recentPhotos.map((photo, index) => (
                  <div key={`${photo.url}-${index}`} className="overflow-hidden rounded-md bg-sunken ring-1 ring-rule">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.url} alt={`${pet.name}, foto reciente ${index + 1}`} className="aspect-square w-full object-cover" />
                  </div>
                ))}
              </div>
            </Surface>
          ) : null}

          <p className="text-center text-xs leading-5 text-ink-3">
            Esta ficha muestra los datos básicos elegidos para el QR. El carnet y los documentos siguen privados.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
