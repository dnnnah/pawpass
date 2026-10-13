import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { SubpageHeader } from "@/components/ui/SubpageHeader";
import { BackLink } from "@/components/ui/BackLink";
import { DewormingSection } from "@/components/features/pet-profile/health/DewormingSection";
import { HealthCompletenessCard } from "@/components/features/pet-profile/health/HealthCompletenessCard";
import { MedicalHistorySection } from "@/components/features/pet-profile/health/MedicalHistorySection";
import { VaccineTimeline } from "@/components/features/pet-profile/VaccineTimeline";
import { sortVaccinesByDate } from "@/lib/domain/vaccine";
import { buildHealthExportSummary } from "@/lib/domain/health";
import { isTerminalPetStatus } from "@/lib/domain/petStatus";
import { getPetByIdAny, getAllProfilePets } from "@/lib/services/pets/queries";
import {
  toCompletenessViewModel,
  toDewormingSectionViewModel,
  toMedicalHistoryViewModel,
  toVaccineItemViewModel,
} from "@/lib/mapping/health";
import { notFound } from "next/navigation";
import { ExportSummaryClient } from "./ExportSummaryClient";

type HealthPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateStaticParams() {
  const pets = await getAllProfilePets();

  return pets.flatMap((pet) => [{ id: pet.id }, { id: pet.identificacion.codigoPublico }]);
}

export async function generateMetadata({ params }: HealthPageProps): Promise<Metadata> {
  const { id } = await params;
  const pet = await getPetByIdAny(id);

  if (!pet) {
    return {
      title: "Expediente de salud no encontrado | PawPass",
    };
  }

  return {
    title: `Salud de ${pet.mascota.nombre} | PawPass`,
    description: `Expediente de salud de ${pet.mascota.nombre}: vacunas, desparasitación e historial médico.`,
  };
}

export default async function SaludPage({ params }: HealthPageProps) {
  const { id } = await params;
  const pet = await getPetByIdAny(id);

  if (!pet) {
    notFound();
  }

  const isTerminal = isTerminalPetStatus(pet.estado);
  const completeness = toCompletenessViewModel(pet);
  const deworming = toDewormingSectionViewModel(pet.desparasitaciones ?? [], undefined, {
    suppressDue: isTerminal,
  });
  const history = toMedicalHistoryViewModel(pet.historialMedico ?? []);
  const summary = buildHealthExportSummary(pet);
  const timelineVaccines = sortVaccinesByDate(pet.vacunas, "reverso")
    .slice(0, 3)
    .map((vaccine) =>
      toVaccineItemViewModel(vaccine, pet.documentos, undefined, {
        suppressAlerts: isTerminal,
      }),
    );

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <BackLink href={`/perfil/${pet.id}`} />

          <SubpageHeader
            eyebrow="Expediente de salud"
            title={`Salud de ${pet.mascota.nombre}`}
            description="Vacunas, desparasitación e historial médico en un solo lugar."
          />

          <HealthCompletenessCard petName={pet.mascota.nombre} viewModel={completeness} />

          <div className="grid gap-6 lg:grid-cols-2">
            <DewormingSection petName={pet.mascota.nombre} viewModel={deworming} />
            <MedicalHistorySection petName={pet.mascota.nombre} viewModel={history} />
          </div>

          <VaccineTimeline
            petId={pet.id}
            petName={pet.mascota.nombre}
            totalCount={pet.vacunas.length}
            vaccines={timelineVaccines}
          />

          <ExportSummaryClient petName={pet.mascota.nombre} summary={summary} />
        </div>
      </div>
    </AppShell>
  );
}