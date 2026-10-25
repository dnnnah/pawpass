type RpcClient = {
  rpc: (
    functionName: "cambiar_estado_adopcion",
    params: { p_pet: string; p_estado: "en_adopcion" | "en_casa"; p_refugio: string | null },
  ) => Promise<{ error: { message?: string } | null }>;
};

const SAVE_ERROR = "No pudimos actualizar la publicación. Intenta de nuevo.";

export async function setPetAdoptionPublication(
  client: RpcClient,
  petId: string,
  published: boolean,
  shelterId?: string,
): Promise<string | null> {
  try {
    const { error } = await client.rpc("cambiar_estado_adopcion", {
      p_pet: petId,
      p_estado: published ? "en_adopcion" : "en_casa",
      p_refugio: shelterId?.trim() || null,
    });
    return error ? SAVE_ERROR : null;
  } catch {
    return SAVE_ERROR;
  }
}
