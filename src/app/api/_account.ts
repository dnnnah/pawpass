import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/infra/supabase/server";
import { hasSupabaseEnv } from "@/lib/infra/supabase/env";
import { sameRequestOrigin, validDeletionConfirmation } from "@/lib/account/deletion";

type DeletionConfirmationOptions = { phrase?: string; requireLinkedPetsAcknowledgement?: boolean };

export async function authorizeDeletion(request: Request, confirmationOptions: DeletionConfirmationOptions = {}) {
  if (!sameRequestOrigin(request.url, request.headers.get("origin"))) return NextResponse.json({ error: "Solicitud no permitida." }, { status: 403 });
  try {
    const raw = await request.text();
    if (raw.length > 1024 || !validDeletionConfirmation(JSON.parse(raw), confirmationOptions.phrase, confirmationOptions.requireLinkedPetsAcknowledgement)) {
      return NextResponse.json({ error: confirmationOptions.requireLinkedPetsAcknowledgement
        ? "Acepta el borrado permanente de las mascotas y confirma la eliminación de la cuenta."
        : "Escribe ELIMINAR para confirmar." }, { status: 400 });
    }
  } catch { return NextResponse.json({ error: "Confirma la eliminación e intenta de nuevo." }, { status: 400 }); }
  if (!hasSupabaseEnv()) return NextResponse.json({ error: "El servicio no está disponible. Intenta más tarde." }, { status: 503 });
  const store = await cookies();
  const supabase = createSupabaseServerClient({
    getAll: () => store.getAll(),
    setAll: (items) => items.forEach(({ name, value, options }) => store.set(name, value, options)),
  });
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user || user.is_anonymous || (!user.email_confirmed_at && !user.phone_confirmed_at)) return NextResponse.json({ error: "Inicia sesión con una cuenta confirmada para continuar." }, { status: 401 });
  return { supabase, user };
}
