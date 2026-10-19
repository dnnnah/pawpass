import { formatMexicanDate, getPetAgeText } from "@/lib/dateFormat";
import { getPublicDocuments } from "@/lib/petDocuments";
import { resolveVaccineNextDoseAlert } from "@/lib/domain/vaccine";
import { getVaccineStatusMeta } from "@/lib/mapping/vaccineStatus";
import { buildWhatsAppHref } from "@/lib/phone";
import type { PetProfile, PetStatus } from "@/types/pet";

export type PetHeaderViewModel = {
  name: string;
  species: string;
  breed: string;
  age: string;
  gender: string;
  size: string;
  id: string;
  image: string;
  status: {
    vaccines: string;
    sterilized: string;
    microchip: string;
  };
};

export type ContactViewModel = {
  name: string;
  phone: string;
  phoneHref: string;
  whatsapp: string;
};

export type InfoViewModel = {
  species: string;
  breed: string;
  color: string;
  weight: string;
  birthDate: string;
  distinctive: ReadonlyArray<string>;
};

export type HealthViewModel = {
  allergies: ReadonlyArray<string>;
  conditions: ReadonlyArray<string>;
  medications: ReadonlyArray<string>;
  diet: string;
  behavior: string;
};

export type VetViewModel = {
  clinic: string;
  doctor: string;
  phone: string;
  address: string;
};

export type VaccineTimelineItem = {
  name: string;
  date: string;
  status: ReturnType<typeof getVaccineStatusMeta>["label"];
};

export type PhotoViewModel = {
  id: string;
  name: string;
  url: string;
  date: string;
  description?: string;
};

export type ProfileViewModel = {
  status: PetStatus;
  header: PetHeaderViewModel;
  contact: ContactViewModel;
  info: InfoViewModel;
  health: HealthViewModel;
  vet: VetViewModel;
  vaccineTotalCount: number;
  vaccines: VaccineTimelineItem[];
  documents: PetProfile["documentos"];
  photos: PhotoViewModel[];
};

export function toProfileViewModel(pet: PetProfile): ProfileViewModel {
  const visibleDocuments = getPublicDocuments(pet);

  return {
    status: pet.estado,
    header: {
      name: pet.mascota.nombre,
      species: pet.mascota.especie,
      breed: pet.mascota.raza,
      age: getPetAgeText(pet.mascota.fechaNacimiento),
      gender: pet.mascota.genero,
      size: pet.mascota.talla,
      id: pet.identificacion.codigoPublico,
      image: pet.mascota.fotoPerfilUrl,
      status: {
        vaccines: pet.vacunas.some((vaccine) => {
          const alert = resolveVaccineNextDoseAlert(vaccine);
          return alert?.kind === "vencida";
        })
          ? "Revisar"
          : "Al día",
        sterilized: pet.mascota.esterilizado ? "Sí" : "No",
        microchip: pet.identificacion.microchip ? "Registrado" : "No cuenta",
      },
    },
    contact: {
      name: pet.contacto.nombrePublico,
      phone: formatPhoneForDisplay(pet.contacto.telefonoPrincipal),
      phoneHref: pet.contacto.telefonoPrincipal,
      whatsapp: buildWhatsAppHref(pet.contacto.whatsapp, pet.contacto.mensajeWhatsapp),
    },
    info: {
      species: pet.mascota.especie,
      breed: pet.mascota.raza,
      color: pet.mascota.color,
      weight: `${pet.mascota.pesoKg} kg`,
      birthDate: formatMexicanDate(pet.mascota.fechaNacimiento) ?? pet.mascota.fechaNacimiento,
      distinctive: pet.mascota.rasgosDistintivos,
    },
    health: {
      allergies: pet.salud.alergias,
      conditions: pet.salud.condicionesMedicas,
      medications: pet.salud.medicamentosActuales,
      diet: pet.salud.dietaEspecial,
      behavior: pet.salud.comportamiento,
    },
    vet: {
      clinic: pet.veterinario.clinica,
      doctor: pet.veterinario.nombre,
      phone: formatPhoneForDisplay(pet.veterinario.telefono),
      address: pet.configuracionPublica.mostrarDireccionVet ? pet.veterinario.direccion : "Dirección privada",
    },
    vaccineTotalCount: pet.vacunas.length,
    vaccines: pet.vacunas.map((vaccine) => ({
      name: vaccine.nombre,
      date: formatMexicanDate(vaccine.estatus === "proxima_dosis" ? vaccine.proximaDosis : vaccine.fechaAplicacion, "short") ?? "Fecha pendiente",
      status: getVaccineStatusMeta(vaccine.estatus).label,
    })),
    documents: visibleDocuments
      .filter((doc) => doc.categoria !== "foto")
      .slice(0, 3),
    photos: visibleDocuments
      .filter((doc) => doc.categoria === "foto")
      .map((doc) => ({
        id: doc.id,
        name: doc.nombre,
        url: doc.url,
        date: formatMexicanDate(doc.fecha) ?? doc.fecha,
        description: doc.descripcion,
      })),
  };
}

export function formatPhoneForDisplay(phone: string) {
  const digits = phone.replace(/\D/g, "");

  if (digits.length === 10) {
    return digits.replace(/^(\d{2})(\d{4})(\d{4})$/, "$1 $2 $3");
  }

  if (digits.length === 12 && digits.startsWith("52")) {
    return digits.replace(/^(\d{2})(\d{2})(\d{4})(\d{4})$/, "+$1 $2 $3 $4");
  }

  if (digits.length === 13 && digits.startsWith("521")) {
    return digits.replace(/^(\d{2})(\d)(\d{2})(\d{4})(\d{4})$/, "+$1 $2 $3 $4 $5");
  }

  if (digits.length === 12) {
    return digits.replace(/^(\d{4})(\d{4})(\d{4})$/, "$1 $2 $3");
  }

  return phone;
}
