export type AccountPetStatus = "en_casa" | "perdido";

export type LostAlertInput = {
  zone: string;
  date: string;
  message: string;
  reward: string;
};

export type LostAlertErrors = {
  zone?: string;
  date?: string;
  message?: string;
  reward?: string;
};

type RpcClient = {
  rpc: (
    functionName: string,
    params: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message?: string } | null }>;
};

const SAVE_ERROR = "No pudimos actualizar el estado de la mascota. Intenta de nuevo.";

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function validateLostAlertInput(input: LostAlertInput): LostAlertErrors {
  const errors: LostAlertErrors = {};
  const zone = input.zone.trim();

  if (!zone) {
    errors.zone = "Indica la zona donde se perdió.";
  } else if (zone.length > 200) {
    errors.zone = "La zona no puede superar 200 caracteres.";
  }

  if (!input.date) {
    errors.date = "Indica la fecha de pérdida.";
  } else if (!isIsoDate(input.date)) {
    errors.date = "Escribe una fecha válida.";
  } else if (input.date > new Date().toISOString().slice(0, 10)) {
    errors.date = "La fecha no puede estar en el futuro.";
  }

  if (input.message.trim().length > 2000) {
    errors.message = "El mensaje no puede superar 2000 caracteres.";
  }

  if (input.reward.trim()) {
    const reward = Number(input.reward);
    if (!Number.isFinite(reward) || reward < 0) {
      errors.reward = "La recompensa debe ser un número igual o mayor que cero.";
    }
  }

  return errors;
}

export async function changePetStatus(
  client: RpcClient,
  petId: string,
  input: { status: AccountPetStatus } & LostAlertInput,
): Promise<string | null> {
  const isLost = input.status === "perdido";

  try {
    const { error } = await client.rpc("cambiar_estado_mascota", {
      p_pet: petId,
      p_estado: input.status,
      p_fecha: isLost ? input.date || null : null,
      p_zona: isLost ? input.zone.trim() || null : null,
      p_mensaje: isLost ? input.message.trim() || null : null,
      p_recompensa: isLost && input.reward.trim() ? Number(input.reward) : null,
    });

    return error ? SAVE_ERROR : null;
  } catch {
    return SAVE_ERROR;
  }
}
