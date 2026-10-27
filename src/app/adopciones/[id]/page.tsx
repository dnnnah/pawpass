import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { MapPin, Ruler, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { AdoptionRequestForm } from "@/components/features/adoption/AdoptionRequestForm";
import { BackLink } from "@/components/ui/BackLink";
import { Badge } from "@/components/ui/Badge";
import { SubpageHeader } from "@/components/ui/SubpageHeader";
import { buildCatalogCard } from "@/lib/mapping/adoptionPresentation";
import { getAdoptionCatalogEntries } from "@/lib/services/adoption/queries";
import type { AdoptionCatalogCard } from "@/lib/mapping/adoptionPresentation";

type AdoptionPetPageProps = { params: Promise<{ id: string }> };

async function findAdoptionPet(id: string) {
  const entries = await getAdoptionCatalogEntries();
  const entry = entries.find((item) => item.petId === id || item.codigoPublico === id);
  return entry ? buildCatalogCard(entry) : null;
}

export async function generateMetadata({ params }: AdoptionPetPageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const pet = await findAdoptionPet(id);
    return pet
      ? { title: `${pet.name} en adopción | PawPass`, description: `${pet.species} ${pet.breed} en adopción en ${pet.zone}.` }
      : { title: "Mascota no disponible | PawPass", robots: { index: false } };
  } catch {
    return { title: "Adopciones | PawPass", robots: { index: false } };
  }
}

export default async function AdoptionPetPage({ params }: AdoptionPetPageProps) {
  const { id } = await params;
  let pet: AdoptionCatalogCard | null = null;
  try {
    pet = await findAdoptionPet(id);
  } catch {
    return <AppShell><div className="mx-auto max-w-4xl px-4 py-10"><BackLink href="/adopciones">Ver mascotas en adopción</BackLink><p role="alert" className="mt-6 rounded-md border border-danger-rule bg-danger-soft p-5 text-sm text-danger">No pudimos cargar esta ficha. Intenta de nuevo más tarde.</p></div></AppShell>;
  }
  if (!pet) notFound();

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <BackLink href="/adopciones">Ver mascotas en adopción</BackLink>
          <SubpageHeader eyebrow="Mascota en adopción" title={pet.name} description={`${pet.species}${pet.breed ? ` · ${pet.breed}` : ""}${pet.shelterName ? ` · Publicada por ${pet.shelterName}` : " · Publicación directa"}`} />
          <section className="overflow-hidden rounded-lg border border-rule bg-surface">
            {pet.image ? <div className="relative aspect-[16/9] bg-sunken"><Image src={pet.image} alt={`Foto de ${pet.name}`} fill sizes="(max-width: 768px) 100vw, 768px" unoptimized className="object-contain" priority /></div> : <div className="grid aspect-[16/9] place-items-center bg-sunken text-ink-3">Foto no disponible</div>}
            <div className="space-y-5 p-6 sm:p-8">
              <div className="flex flex-wrap gap-2">
                {pet.verified ? <Badge tone="success" icon={<ShieldCheck size={14} aria-hidden="true" />}>Verificado</Badge> : null}
                <Badge>{pet.gender}</Badge><Badge icon={<Ruler size={14} aria-hidden="true" />}>{pet.size}</Badge><Badge>{pet.age}</Badge>
              </div>
              {pet.zone ? <p className="flex items-center gap-2 text-sm text-ink-2"><MapPin size={16} aria-hidden="true" />Zona aproximada: {pet.zone}</p> : null}
              <p className="text-sm leading-6 text-ink-2">Esta ficha muestra únicamente información autorizada para encontrarle un hogar. El carnet, el QR, los datos de salud, documentos y contactos privados de {pet.name} permanecen protegidos.</p>
            </div>
          </section>
          <AdoptionRequestForm petId={pet.petId} petName={pet.name} shelterName={pet.shelterName} />
        </div>
      </div>
    </AppShell>
  );
}
