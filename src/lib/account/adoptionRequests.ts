export const ADOPTION_REQUEST_STATUSES = [
  "enviada",
  "en_revision",
  "aprobada",
  "rechazada",
  "cancelada",
  "completada",
] as const;

export type AccountAdoptionRequestStatus = (typeof ADOPTION_REQUEST_STATUSES)[number];
export type AdoptionRequestReviewStatus = Exclude<AccountAdoptionRequestStatus, "enviada">;

export type AccountAdoptionRequest = {
  id: string;
  petId: string;
  pet: {
    id: string;
    publicCode: string;
    name: string;
    species: "perro" | "gato";
    slug: string | null;
  };
  applicantId: string;
  name: string;
  phone: string;
  email: string | null;
  reason: string;
  status: AccountAdoptionRequestStatus;
  createdAt: string;
  updatedAt: string;
  role: "applicant" | "owner";
};

type RawPet = {
  id?: unknown;
  codigo_publico?: unknown;
  nombre?: unknown;
  especie?: unknown;
  slug?: unknown;
};

type RawAdoptionRequest = {
  id?: unknown;
  pet_id?: unknown;
  applicant_id?: unknown;
  nombre?: unknown;
  telefono?: unknown;
  email?: unknown;
  motivo?: unknown;
  estado?: unknown;
  created_at?: unknown;
  updated_at?: unknown;
  pets?: RawPet | RawPet[] | null;
};

export type AdoptionRequestsReadClient = {
  read: () => Promise<{ data: unknown; error: { message?: string } | null }>;
};

export type AdoptionRequestRpcClient = {
  rpc: (
    functionName: "revisar_adopcion",
    params: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message?: string } | null }>;
};

const READ_ERROR = "No pudimos cargar tus solicitudes de adopción. Intenta de nuevo.";
const WRITE_ERROR = "No pudimos actualizar la solicitud. Intenta de nuevo.";

function isRequestStatus(value: unknown): value is AccountAdoptionRequestStatus {
  return (
    typeof value === "string" &&
    (ADOPTION_REQUEST_STATUSES as readonly string[]).includes(value)
  );
}

function asPet(value: RawAdoptionRequest["pets"]): AccountAdoptionRequest["pet"] | null {
  const pet = Array.isArray(value) ? value[0] : value;
  if (!pet || typeof pet !== "object") return null;

  const id = typeof pet.id === "string" ? pet.id.trim() : "";
  const publicCode = typeof pet.codigo_publico === "string" ? pet.codigo_publico.trim() : "";
  const name = typeof pet.nombre === "string" ? pet.nombre.trim() : "";
  const species = pet.especie === "perro" || pet.especie === "gato" ? pet.especie : null;
  const slug = pet.slug === null || pet.slug === undefined ? null : String(pet.slug).trim();

  if (!id || !publicCode || !name || !species) return null;
  return { id, publicCode, name, species, slug: slug || null };
}

export function normalizeAccountAdoptionRequestRow(
  value: unknown,
  userId: string,
): AccountAdoptionRequest | null {
  if (!value || typeof value !== "object") return null;
  const row = value as RawAdoptionRequest;
  const id = typeof row.id === "string" ? row.id.trim() : "";
  const petId = typeof row.pet_id === "string" ? row.pet_id.trim() : "";
  const applicantId = typeof row.applicant_id === "string" ? row.applicant_id.trim() : "";
  const name = typeof row.nombre === "string" ? row.nombre.trim() : "";
  const phone = typeof row.telefono === "string" ? row.telefono.trim() : "";
  const email = row.email === null || row.email === undefined ? null : String(row.email).trim();
  const reason = typeof row.motivo === "string" ? row.motivo.trim() : "";
  const createdAt = typeof row.created_at === "string" ? row.created_at : "";
  const updatedAt = typeof row.updated_at === "string" ? row.updated_at : "";
  const pet = asPet(row.pets);

  if (
    !id ||
    !petId ||
    !applicantId ||
    !name ||
    !phone ||
    !reason ||
    !createdAt ||
    !updatedAt ||
    !pet ||
    !isRequestStatus(row.estado)
  ) {
    return null;
  }

  return {
    id,
    petId,
    pet,
    applicantId,
    name,
    phone,
    email: email || null,
    reason,
    status: row.estado,
    createdAt,
    updatedAt,
    role: applicantId === userId ? "applicant" : "owner",
  };
}

export async function listAccountAdoptionRequests(
  client: AdoptionRequestsReadClient,
  userId: string,
): Promise<{ requests: AccountAdoptionRequest[]; error: string | null }> {
  const { data, error } = await client.read();
  if (error) return { requests: [], error: READ_ERROR };

  const rows = Array.isArray(data) ? data : [];
  return {
    requests: rows
      .map((row) => normalizeAccountAdoptionRequestRow(row, userId))
      .filter((request): request is AccountAdoptionRequest => request !== null),
    error: null,
  };
}

export async function reviewAdoptionRequest(
  client: AdoptionRequestRpcClient,
  requestId: string,
  status: AdoptionRequestReviewStatus,
): Promise<{ error: string | null }> {
  const normalizedId = requestId.trim();
  if (!normalizedId) return { error: WRITE_ERROR };

  const { error } = await client.rpc("revisar_adopcion", {
    p_solicitud: normalizedId,
    p_estado: status,
  });

  return { error: error ? WRITE_ERROR : null };
}
