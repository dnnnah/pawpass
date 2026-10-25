import type { Metadata } from "next";
import { AlertTriangle } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { AdoptionRequestCta } from "@/components/features/adoption/AdoptionRequestCta";
import { DocumentsCard } from "@/components/features/documents/DocumentsCard";
import { PhysicalCardCta } from "@/components/features/carnet/PhysicalCardCta";
import { PetFooterBanner } from "@/components/features/pet-status/PetFooterBanner";
import { PetStatusBadge } from "@/components/features/pet-status/PetStatusBadge";
import { PetStatusSection } from "@/components/features/pet-status/PetStatusSection";
import { EmergencyContactSection } from "@/components/features/pet-profile/EmergencyContactSection";
import { HealthCard } from "@/components/features/pet-profile/HealthCard";
import { HealthExpedientePreview } from "@/components/features/pet-profile/health/HealthExpedientePreview";
import { InfoCard } from "@/components/features/pet-profile/InfoCard";
import { PetHeader } from "@/components/features/pet-profile/PetHeader";
import { ProfileNav } from "@/components/features/pet-profile/ProfileNav";
import { QRShareCard } from "@/components/features/pet-profile/QRShareCard";
import { RecentPhotos } from "@/components/features/pet-profile/RecentPhotos";
import { ProfileViewTracker } from "@/components/telemetry/ProfileViewTracker";
import { VaccineTimeline } from "@/components/features/pet-profile/VaccineTimeline";
import { VetCard } from "@/components/features/pet-profile/VetCard";
import { buildPhysicalPetCard } from "@/lib/domain/carnet";
import { isTerminalPetStatus } from "@/lib/domain/petStatus";
import { findShelterForPet } from "@/lib/domain/shelter";
import { sortVaccinesByDate } from "@/lib/domain/vaccine";
import { getPetByIdAny, getAllProfilePets } from "@/lib/services/pets/queries";
import { getMockShelters } from "@/lib/services/shelters/queries";
import { toProfileViewModel } from "@/lib/mapping/profile";
import { toVaccineItemViewModel } from "@/lib/mapping/health";
import { buildPetProfileMetadata } from "@/lib/seo";
import { getPublicProfileUrl } from "@/lib/publicProfileUrl";
import { notFound } from "next/navigation";
import { hasSupabaseEnv } from "@/lib/infra/supabase/env";
import { findActivePublicProfile } from "@/lib/infra/directory/activePublicProfiles";
import { PublicProfileView } from "@/components/features/pet-profile/PublicProfileView";

type ProfilePageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  if (hasSupabaseEnv() || process.env.NODE_ENV === "production") return [];
  const pets = await getAllProfilePets();

  return pets.flatMap((pet) => [{ id: pet.id }, { id: pet.identificacion.codigoPublico }]);
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { id } = await params;
  if (hasSupabaseEnv()) {
    try {
      const profile = await findActivePublicProfile(id);
      if (!profile) return { title: "Perfil no disponible | PawPass", robots: { index: false, follow: false } };
      return {
        title: `${profile.name} | PawPass`,
        description: `Perfil público compartido por la persona responsable de ${profile.name}.`,
        robots: { index: true, follow: true },
        alternates: { canonical: `/perfil/${profile.publicCode}` },
      };
    } catch {
      return { title: "Perfil temporalmente no disponible | PawPass", robots: { index: false, follow: false } };
    }
  }
  if (process.env.NODE_ENV === "production") {
    return { title: "Perfil no disponible | PawPass", robots: { index: false, follow: false } };
  }
  const pet = await getPetByIdAny(id);

  if (!pet) {
    return {
      title: "Mascota no encontrada | PawPass",
      robots: { index: false },
    };
  }

  return buildPetProfileMetadata(pet);
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { id } = await params;
  if (hasSupabaseEnv()) {
    const profile = await findActivePublicProfile(id);
    if (!profile) notFound();
    return <PublicProfileView profile={profile} />;
  }
  if (process.env.NODE_ENV === "production") notFound();
  const [pet, shelters] = await Promise.all([getPetByIdAny(id), getMockShelters()]);

  if (!pet) {
    notFound();
  }

  const profile = toProfileViewModel(pet);
  const publicProfileUrl = getPublicProfileUrl(pet) ?? "";
  const isTerminal = isTerminalPetStatus(profile.status);

  const vaccineViewModels = sortVaccinesByDate(pet.vacunas, "reverso")
    .slice(0, 3)
    .map((vaccine) =>
      toVaccineItemViewModel(vaccine, pet.documentos, undefined, {
        suppressAlerts: isTerminal,
      }),
    );

  const physicalCard = buildPhysicalPetCard(pet);

  return (
    <AppShell>
      <ProfileViewTracker section="public" />
      {/* `overflow-x: clip` recorta el nav a sangre sin crear contenedor de
          scroll: `clip` no genera scrollport, asi que el `sticky` del nav y
          de la tarjeta del QR siguen funcionando. Sin esto, el `w-screen` del
          nav sumaba el ancho de la barra de scroll vertical y la pagina
          ganaba scroll horizontal en escritorio. */}
      <div className="mx-auto max-w-6xl overflow-x-clip px-4 pb-12 sm:px-6 lg:px-8">
        <div className="space-y-12">
          <PetHeader
            pet={profile.header}
            statusBadge={
              <PetStatusBadge
                petId={pet.id}
                emergency={pet.emergencia}
                status={profile.status}
              />
            }
          />
          <ProfileNav hasPhotos={profile.photos.length > 0} />
          <PetStatusSection
            petId={pet.id}
            petName={pet.mascota.nombre}
            emergency={pet.emergencia}
            whatsappNumber={pet.contacto.whatsapp}
            status={profile.status}
          />
          <AdoptionRequestCta
            petId={pet.id}
            petName={pet.mascota.nombre}
            emergency={pet.emergencia}
            status={profile.status}
            shelterName={findShelterForPet(pet.id, shelters)?.nombre ?? null}
          />
          <div id="contacto" className="scroll-mt-24">
            <EmergencyContactSection
              contact={profile.contact}
              emergency={pet.emergencia}
              petId={pet.id}
              petName={pet.mascota.nombre}
              status={profile.status}
              zonaSegura={pet.contacto.zonaSegura}
            />
          </div>
          <div id="info" className="scroll-mt-24">
            <InfoCard petName={pet.mascota.nombre} info={profile.info} />
          </div>
          <div id="salud" className="scroll-mt-24">
            <HealthCard health={profile.health} />
          </div>
          <div id="veterinario" className="scroll-mt-24">
            <VetCard vet={profile.vet} />
          </div>
          {profile.photos.length > 0 ? (
            <div id="fotos" className="scroll-mt-24">
              <RecentPhotos photos={profile.photos} profilePhoto={pet.mascota.fotoPerfilUrl} />
            </div>
          ) : null}
          <div id="vacunas" className="scroll-mt-24">
            <VaccineTimeline
              petId={pet.id}
              petName={pet.mascota.nombre}
              totalCount={pet.vacunas.length}
              vaccines={vaccineViewModels}
            />
          </div>
          <div id="expediente" className="scroll-mt-24">
            <HealthExpedientePreview pet={pet} />
          </div>
          <div id="carnet" className="scroll-mt-24">
            <PhysicalCardCta
              petId={pet.id}
              petName={pet.mascota.nombre}
              card={physicalCard}
            />
          </div>
          {/* Columna derecha con ancho fijo: antes `auto` dejaba que la tarjeta
              del QR marcara el ancho y descuadrara la de documentos. */}
          <div
            id="documentos"
            className="grid scroll-mt-24 items-start gap-6 md:grid-cols-[minmax(0,1fr)_20rem]"
          >
            <DocumentsCard documents={profile.documents} documentsPath={`/perfil/${pet.id}/documentos`} />
            {/* La tarjeta del QR es mas corta que la lista de documentos, asi
                que sin `sticky` la columna derecha deja cientos de pixeles
                vacios al final. Con `items-start` cada tarjeta ocupa solo lo que
                necesita: la de documentos no se estira para igualar a la del
                QR, que con dos documentos dejaba 228px de hueco dentro. El
                `sticky` solo tiene recorrido cuando la lista es larga, que es
                justo cuando sirve. */}
            <div>
              <QRShareCard
                petName={pet.mascota.nombre}
                profileUrl={publicProfileUrl}
                petCode={pet.identificacion.codigoPublico}
                className="md:sticky md:top-24"
              />
            </div>
          </div>
          {!isTerminal ? (
            <div className="border-t border-rule pt-8">
              <Button
                href={`/perfil/${pet.id}/alerta`}
                variant="secondary"
                icon={<AlertTriangle size={18} />}
              >
                Generar alerta de mascota perdida
              </Button>
            </div>
          ) : null}
          <PetFooterBanner
            petId={pet.id}
            petName={pet.mascota.nombre}
            species={pet.mascota.especie}
            emergency={pet.emergencia}
            status={profile.status}
          />
        </div>
      </div>
    </AppShell>
  );
}

