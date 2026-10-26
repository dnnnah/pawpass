type RpcClient = {
  rpc: (
    functionName: "cambiar_estado_adopcion",
    params: { p_pet: string; p_estado: "en_adopcion" | "en_casa"; p_refugio: string | null },
  ) => Promise<{ error: { message?: string } | null }>;
};

const SAVE_ERROR = "No pudimos actualizar la publicación. Intenta de nuevo.";

function publicationError(message: string | undefined): string {
  if (message?.includes("Sube una foto válida")) return "Agrega una foto en el carnet privado antes de publicar en adopción.";
  if (message?.includes("correo de entrega")) return "Agrega un correo de contacto válido en el carnet privado antes de publicar.";
  if (message?.includes("alerta de pérdida") || message?.includes("no está disponible")) return "Revisa el estado de la mascota. Debe estar en casa y sin una alerta de pérdida activa.";
  if (message?.includes("No autorizado")) return "Solo la persona administradora puede cambiar esta publicación.";
  return SAVE_ERROR;
}

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
    return error ? publicationError(error.message) : null;
  } catch {
    return SAVE_ERROR;
  }
}
