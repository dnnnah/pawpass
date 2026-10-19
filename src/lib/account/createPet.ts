export type CreatePetInput = {
  name: string;
  species: string;
  birthDate: string;
};

export type CreatePetErrors = {
  name?: string;
  species?: string;
  birthDate?: string;
};

export type CreatePetResult = {
  id: string | null;
  error: string | null;
};

type RpcClient = {
  rpc: (
    functionName: string,
    params: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message?: string } | null }>;
};

const GENERIC_CREATE_ERROR = "No pudimos registrar la mascota. Revisa los datos e intenta de nuevo.";

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function validateCreatePetInput(input: CreatePetInput): CreatePetErrors {
  const errors: CreatePetErrors = {};
  const name = input.name.trim();

  if (!name) {
    errors.name = "Escribe el nombre de tu mascota.";
  } else if (name.length > 120) {
    errors.name = "El nombre no puede superar 120 caracteres.";
  }

  if (input.species !== "perro" && input.species !== "gato") {
    errors.species = "Selecciona perro o gato.";
  }

  if (input.birthDate) {
    if (!isIsoDate(input.birthDate)) {
      errors.birthDate = "Escribe una fecha válida.";
    } else if (input.birthDate > new Date().toISOString().slice(0, 10)) {
      errors.birthDate = "La fecha no puede estar en el futuro.";
    }
  }

  return errors;
}

export async function createAccountPet(
  client: RpcClient,
  input: CreatePetInput,
): Promise<CreatePetResult> {
  const { data, error } = await client.rpc("crear_mascota", {
    p_nombre: input.name.trim(),
    p_especie: input.species,
    p_nacimiento: input.birthDate || null,
  });

  if (error || typeof data !== "string" || !data.trim()) {
    return { id: null, error: GENERIC_CREATE_ERROR };
  }

  return { id: data, error: null };
}
