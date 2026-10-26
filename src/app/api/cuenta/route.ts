import { NextResponse } from "next/server";
import { authorizeDeletion } from "@/app/api/_account";
import { createSupabaseAdminClient } from "@/lib/infra/supabase/admin";

export async function DELETE(request: Request) {
  const access = await authorizeDeletion(request);
  if (access instanceof Response) return access;
  try {
    const { count, error } = await access.supabase.from("pet_ownerships").select("id", { count: "exact", head: true }).eq("user_id", access.user.id).is("ended_at", null);
    if (error || count === null) return NextResponse.json({ error: "No pudimos verificar tus mascotas. Intenta de nuevo." }, { status: 503 });
    if (count > 0) return NextResponse.json({ error: "Primero elimina las mascotas asociadas a tu cuenta." }, { status: 409 });
    const { error: deletionError } = await createSupabaseAdminClient().auth.admin.deleteUser(access.user.id);
    if (deletionError) return NextResponse.json({ error: "No pudimos eliminar tu cuenta. Puede haber archivos pendientes de retirar. Intenta de nuevo." }, { status: 503 });
    await access.supabase.auth.signOut({ scope: "local" });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "No pudimos eliminar tu cuenta. Intenta más tarde." }, { status: 503 });
  }
}
