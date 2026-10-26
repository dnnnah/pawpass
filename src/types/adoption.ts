import type { PetGender, PetId, PetSize, PetSpecies } from "./pet";
import type { ShelterId } from "./shelter";

export type AdoptionRequestId = string;

export type AdoptionRequestStatus =
  | "enviada"
  | "en_revision"
  | "aprobada"
  | "rechazada"
  | "cancelada"
  | "completada";

export type AdoptionApplicant = {
  nombre: string;
  telefono: string;
  email: string | null;
  motivo: string;
};

export type AdoptionRequest = {
  id: AdoptionRequestId;
  petId: PetId;
  shelterId: ShelterId | null;
  estado: AdoptionRequestStatus;
  fechaEnviada: string;
  notas: string | null;
  aspirante: AdoptionApplicant;
};

export type AdoptionRequestDraft = {
  petId: PetId;
  fechaEnviada: string;
  notas?: string | null;
  aspirante: AdoptionApplicant;
};

export type AdoptionCatalogEntry = {
  petId: PetId;
  nombre: string;
  especie: PetSpecies;
  raza: string;
  genero: PetGender | null;
  talla: PetSize | null;
  fotoUrl: string;
  codigoPublico: string;
  fechaNacimiento?: string;
  edadMeses?: number;
  zona: string;
  verificado: boolean;
  shelterId: ShelterId | null;
  shelterNombre: string | null;
};
