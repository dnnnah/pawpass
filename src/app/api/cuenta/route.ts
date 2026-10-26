import { NextResponse } from "next/server";
import { authorizeDeletion } from "@/app/api/_account";
import { createSupabaseAdminClient } from "@/lib/infra/supabase/admin";
import { deleteAccountWithPets } from "@/lib/account/deletion";

export async function DELETE(request: Request) {
  const access = await authorizeDeletion(request, { phrase: "ELIMINAR MI CUENTA", requireLinkedPetsAcknowledgement: true });
  if (access instanceof Response) return access;
  try {
    if (![process.env.SUPABASE_SECRET_KEY, process.env.SUPABASE_SERVICE_ROLE_KEY].some((value) => typeof value === "string" && value.trim())) {
      return NextResponse.json({ error: "Falta configurar la credencial privada de Supabase para eliminar cuentas." }, { status: 503 });
    }
    const { data: ownerships, error: ownershipError } = await access.supabase.from("pet_ownerships")
      .select("pet_id").eq("user_id", access.user.id).is("ended_at", null);
    if (ownershipError || !ownerships) return NextResponse.json({ error: "No pudimos comprobar las mascotas vinculadas. Intenta de nuevo." }, { status: 503 });

    const admin = createSupabaseAdminClient();
    const deletion = await deleteAccountWithPets({
      async listFiles(petId) {
        const { data, error } = await admin.from("pet_documents").select("id, bucket_id, object_path").eq("pet_id", petId);
        if (error) throw error;
        return (data ?? []).map((row) => ({ bucket: row.bucket_id as string, path: row.object_path as string, documentId: row.id as string }));
      },
      async removeFiles(bucket, paths) {
        for (let offset = 0; offset < paths.length; offset += 100) {
          const { error } = await admin.storage.from(bucket).remove(paths.slice(offset, offset + 100));
          if (error) throw error;
        }
      },
      async deletePet(petId) {
        const { data, error } = await admin.from("pets").delete().eq("id", petId).select("id").maybeSingle();
        if (error) throw error;
        return Boolean(data);
      },
      async deleteUser(userId) {
        const { error } = await admin.auth.admin.deleteUser(userId);
        if (error) throw error;
        return true;
      },
    }, access.user.id, ownerships.map((row) => row.pet_id as string));
    if (!deletion.ok) return NextResponse.json({ error: deletion.error }, { status: deletion.status });
    try { await access.supabase.auth.signOut({ scope: "local" }); } catch { /* La cuenta ya está eliminada; el cliente redirige a iniciar sesión. */ }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "No pudimos eliminar tu cuenta. Intenta más tarde." }, { status: 503 });
  }
}
