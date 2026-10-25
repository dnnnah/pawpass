import type { Metadata } from "next";
import { cookies } from "next/headers";
import Image from "next/image";
import { AlertTriangle, MapPin, MessageCircle, PawPrint, Phone } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Surface } from "@/components/ui/Surface";
import { buildWhatsAppHref, toE164Digits } from "@/lib/phone";
import { createSupabasePublicPetDirectory } from "@/lib/infra/directory/supabasePublicPets";
import { hasSupabaseEnv } from "@/lib/infra/supabase/env";
import { createSupabaseServerClient } from "@/lib/infra/supabase/server";
import { getLostPetCards } from "@/lib/services/pets/public";
import { staticPublicPetDirectory } from "@/lib/infra/directory/staticPublicPets";
import type { PublicPetCard } from "@/types/publicPet";

export const metadata: Metadata = {
  title: "Mascotas perdidas | PawPass",
  description: "Ayuda a que las mascotas perdidas vuelvan a casa.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

async function loadLostPets(): Promise<{ pets: PublicPetCard[]; error: string | null }> {
  if (!hasSupabaseEnv()) return { pets: await getLostPetCards(staticPublicPetDirectory), error: null };
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient({
    getAll: () => cookieStore.getAll(),
    setAll: (cookiesToSet) => {
      try { for (const cookie of cookiesToSet) cookieStore.set(cookie.name, cookie.value, cookie.options); }
      catch { /* Server Components solo pueden leer cookies. */ }
    },
  });
  try {
    const pets = await getLostPetCards(createSupabasePublicPetDirectory(supabase));
    return { pets, error: null };
  } catch {
    return { pets: [], error: "No pudimos cargar las alertas activas. Intenta de nuevo." };
  }
}

export default async function LostPetsPage() {
  const { pets, error } = await loadLostPets();
  return <AppShell>
    <div className="mx-auto max-w-6xl px-4 pb-12 sm:px-6 lg:px-8">
      <header className="mb-7">
        <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-danger"><AlertTriangle size={16} aria-hidden="true" />Rescate PawPass</p>
        <h1 className="mt-2 font-display text-4xl text-ink">Mascotas perdidas</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-2">Estas alertas están activas. Si reconoces o encuentras a una mascota, usa el canal de contacto de su familia.</p>
      </header>

      {error ? <Surface variant="accent" tone="danger" size="md" rest={{ role: "alert" }}>{error}</Surface>
        : pets.length === 0 ? <Surface variant="outline" size="lg" className="text-center">
          <PawPrint className="mx-auto text-brand" size={28} aria-hidden="true" />
          <h2 className="mt-3 font-display text-2xl text-ink">No hay alertas activas</h2>
          <p className="mt-1 text-sm text-ink-2">Cuando una familia reporte una mascota perdida, su ficha aparecerá aquí.</p>
        </Surface>
        : <section aria-label="Alertas activas" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {pets.map((pet) => <Surface key={pet.publicCode} as="article" size="md" className="flex flex-col">
            <div className="overflow-hidden rounded-md bg-sunken">
              {pet.photoUrl ? <Image src={pet.photoUrl} alt={`Foto de ${pet.name}`} width={960} height={720} unoptimized className="aspect-[4/3] w-full object-cover" />
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
          </Surface>)}
        </section>}
    </div>
  </AppShell>;
}
