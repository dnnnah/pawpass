export type AdoptionSubmission = {
  publicCode: string;
  name: string;
  phone: string;
  email: string | null;
  reason: string;
};

export type SubmitAdoptionRequestResult = {
  id: string | null;
  error: string | null;
};

type RpcClient = {
  rpc: (
    functionName: string,
    params: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message?: string } | null }>;
};

const GENERIC_SUBMIT_ERROR = "No pudimos enviar la solicitud. Intenta de nuevo.";

/**
 * Persiste una solicitud de adopción a través de la RPC autenticada.
 * El motivo es el único campo libre que acepta el contrato actual de la BD;
 * las notas adicionales del prototipo no se envían ni se guardan aquí.
 */
export async function submitAdoptionRequest(
  client: RpcClient,
  input: AdoptionSubmission,
): Promise<SubmitAdoptionRequestResult> {
  const { data, error } = await client.rpc("solicitar_adopcion", {
    p_codigo: input.publicCode.trim(),
    p_nombre: input.name.trim(),
    p_telefono: input.phone.trim(),
    p_email: input.email?.trim() || null,
    p_motivo: input.reason.trim(),
  });

  if (error || typeof data !== "string" || !data.trim()) {
    return { id: null, error: GENERIC_SUBMIT_ERROR };
  }

  return { id: data, error: null };
}
