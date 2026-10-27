import { AppShell } from "@/components/layout/AppShell";
import { DocumentsCard } from "@/components/features/documents/DocumentsCard";
import { HealthCard } from "@/components/features/pet-profile/HealthCard";
import { InfoCard } from "@/components/features/pet-profile/InfoCard";
import { PetHeader } from "@/components/features/pet-profile/PetHeader";
import { ProfileNav } from "@/components/features/pet-profile/ProfileNav";
import { QRShareCard } from "@/components/features/pet-profile/QRShareCard";
import { RecentPhotos } from "@/components/features/pet-profile/RecentPhotos";
import { VaccineTimeline } from "@/components/features/pet-profile/VaccineTimeline";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";
import { Section } from "@/components/ui/Section";
import { formatMexicanDate, getPetAgeText } from "@/lib/dateFormat";
import { toVaccineItemViewModel } from "@/lib/mapping/health";
import { getPublicProfileUrl } from "@/lib/publicProfileUrl";
import type { PetDocument, PetDocumentCategory, PetDocumentType } from "@/types/pet";
import type { PublicProfile } from "@/types/publicProfile";

const statusLabels: Record<PublicProfile["status"], string> = {
  en_casa: "En casa",
  perdido: "Perdido",
  en_adopcion: "En adopción",
  adoptado: "Adoptado",
  rescatado: "Rescatado",
  fallecido: "Fallecido",
};

const documentCategories: readonly PetDocumentCategory[] = [
  "vacunas",
  "veterinario",
  "identificacion",
  "salud",
  "foto",
  "otro",
];

function asPetDocuments(profile: PublicProfile): PetDocument[] {
  return profile.documents.flatMap((document, index) => {
    if (!document.url || !document.name) return [];
    const category = documentCategories.includes(document.category as PetDocumentCategory)
      ? document.category as PetDocumentCategory
      : "otro";
    const type: PetDocumentType = document.type === "pdf" || document.type === "imagen" ? document.type : "otro";
    return [{
      id: `${profile.publicCode}-public-document-${index}`,
      nombre: document.name,
      tipo: type,
      categoria: category,
      url: document.url,
      fecha: document.date ?? "",
      visiblePublico: true,
      descripcion: document.description ?? undefined,
    }];
  });
}

function displayGender(value: string | null): string | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "macho") return "Macho";
  if (normalized === "hembra") return "Hembra";
  return value;
}

function displaySize(value: string | null): string | null {
  if (!value) return null;
  return value.trim().replace(/^\p{L}/u, (letter) => letter.toLocaleUpperCase("es-MX"));
}

function whatsappHref(value: string) {
  return `https://wa.me/${value.replace(/\D/g, "")}`;
}

export function PublicProfileView({ profile }: { profile: PublicProfile }) {
  const publicUrl = getPublicProfileUrl(profile.publicCode) ?? "";
  const sharedHealth = profile.health;
  const hasHealthDetails = Boolean(
    sharedHealth && (
      sharedHealth.allergies.length ||
      sharedHealth.conditions.length ||
      sharedHealth.medications.length ||
      sharedHealth.diet ||
      sharedHealth.behavior
    ),
  );
  const hasHealth = hasHealthDetails || Boolean(profile.emergencyCareNote);
  const hasContact = Boolean(
    profile.contact.name || profile.contact.phone || profile.contact.secondaryPhone ||
    profile.contact.whatsapp || profile.contact.email || profile.zone,
  );
  const sectionIds = [
    ...(hasContact ? ["contacto"] : []),
    "info",
    ...(hasHealth ? ["salud"] : []),
    ...(profile.photos.length ? ["fotos"] : []),
    ...(profile.vaccines.length ? ["vacunas"] : []),
    "documentos",
  ];
  const vaccineViewModels = profile.vaccines.map((vaccine, index) => toVaccineItemViewModel({
    id: `${profile.publicCode}-shared-vaccine-${index}`,
    nombre: vaccine.name,
    fechaAplicacion: vaccine.applicationDate,
    proximaDosis: vaccine.nextDose ?? "",
    estatus: undefined,
    lote: undefined,
    veterinario: undefined,
  }));
  const profilePhoto = profile.photoUrl ?? profile.photos[0]?.url ?? null;
  const gender = displayGender(profile.gender);
  const birthDate = profile.birthDate ? formatMexicanDate(profile.birthDate) : null;
  const documents = asPetDocuments(profile);

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="space-y-12">
          <PetHeader
            pet={{
              name: profile.name,
              species: profile.species,
              breed: profile.breed ?? "",
              age: profile.birthDate ? getPetAgeText(profile.birthDate) : null,
              gender,
              size: displaySize(profile.size),
              id: profile.publicCode,
              image: profilePhoto,
              status: {
                vaccines: profile.vaccines.length ? `${profile.vaccines.length} compartidas` : null,
                sterilized: profile.sterilized === null ? null : profile.sterilized ? "Sí" : "No",
                microchip: profile.microchip,
              },
            }}
            statusBadge={<Pill tone="muted">{statusLabels[profile.status]}</Pill>}
          />

          <ProfileNav hasPhotos={profile.photos.length > 0} sectionIds={sectionIds} />

          {hasContact ? (
            <div id="contacto" className="scroll-mt-24">
              <Section title="Contacto" eyebrow={`Ayuda para ${profile.name}`}>
                {profile.contact.name ? <p className="mb-3 text-sm text-ink-2">{profile.contact.name}</p> : null}
                <div className="flex flex-wrap gap-2">
                  {profile.contact.phone ? <Button href={`tel:${profile.contact.phone.replace(/[^\d+]/g, "")}`} variant="secondary">Llamar</Button> : null}
                  {profile.contact.secondaryPhone ? <Button href={`tel:${profile.contact.secondaryPhone.replace(/[^\d+]/g, "")}`} variant="secondary">Teléfono alternativo</Button> : null}
                  {profile.contact.whatsapp ? <Button href={whatsappHref(profile.contact.whatsapp)} variant="secondary">WhatsApp</Button> : null}
                  {profile.contact.email ? <Button href={`mailto:${profile.contact.email}`} variant="secondary">Enviar correo</Button> : null}
                </div>
                {profile.zone ? <p className="mt-4 text-sm text-ink-2"><span className="font-semibold text-ink">Zona aproximada:</span> {profile.zone}</p> : null}
              </Section>
            </div>
          ) : null}

          <div id="info" className="scroll-mt-24">
            <InfoCard
              petName={profile.name}
              info={{
                species: profile.species,
                breed: profile.breed,
                color: profile.color,
                weight: null,
                birthDate,
                distinctive: profile.traits,
              }}
            />
          </div>

          {hasHealth ? (
            <div id="salud" className="scroll-mt-24 space-y-5">
              {hasHealthDetails && sharedHealth ? (
                <HealthCard health={{
                  allergies: sharedHealth.allergies,
                  conditions: sharedHealth.conditions,
                  medications: sharedHealth.medications,
                  diet: sharedHealth.diet ?? "",
                  behavior: sharedHealth.behavior ?? "",
                }} />
              ) : null}
              {profile.emergencyCareNote ? (
                <Section title="Cuidados importantes" eyebrow="Nota compartida" tone="warning">
                  <p className="text-sm leading-6 text-ink-2">{profile.emergencyCareNote}</p>
                </Section>
              ) : null}
            </div>
          ) : null}

          <div id="fotos" className="scroll-mt-24">
            <RecentPhotos
              profilePhoto={profilePhoto}
              photos={profile.photos.map((photo, index) => ({
                id: `${profile.publicCode}-shared-photo-${index}`,
                name: `${profile.name} · foto ${index + 1}`,
                url: photo.url,
                date: "",
              }))}
            />
          </div>

          {profile.vaccines.length ? (
            <div id="vacunas" className="scroll-mt-24">
              <VaccineTimeline
                petId={profile.publicCode}
                petName={profile.name}
                totalCount={profile.vaccines.length}
                vaccines={vaccineViewModels}
                showDetailsLink={false}
                showStatus={false}
              />
            </div>
          ) : null}

          <div id="documentos" className="grid min-w-0 grid-cols-1 scroll-mt-24 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <DocumentsCard documents={documents} documentsPath="" showAllLink={false} />
            <div>
              <QRShareCard
                petName={profile.name}
                profileUrl={publicUrl}
                petCode={profile.publicCode}
                className="lg:sticky lg:top-24"
              />
            </div>
          </div>

          <footer className="border-t border-rule pt-5 text-center text-xs leading-5 text-ink-3">
            La información visible fue compartida por la persona responsable de {profile.name}.
          </footer>
        </div>
      </div>
    </AppShell>
  );
}
