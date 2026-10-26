import { NextResponse } from "next/server";
import { authorizeDeletion } from "@/app/api/_account";
import { deleteOwnedPet } from "@/lib/account/deletion";

export async function DELETE(request: Request, context: { params: Promise<{ petId: string }> }) {
  const access = await authorizeDeletion(request);
  if (access instanceof Response) return access;
  const { petId } = await context.params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(petId)) return NextResponse.json({ error: "Mascota no válida." }, { status: 400 });
  const { supabase, user } = access;
  const result = await deleteOwnedPet({
    async getRole(id) {
      const { data, error } = await supabase.from("pet_ownerships").select("rol").eq("pet_id", id).eq("user_id", user.id).is("ended_at", null).maybeSingle();
      if (error) throw error;
      return data?.rol ?? null;
    },
    async listFiles(id) {
      const { data, error } = await supabase.from("pet_documents").select("bucket_id, object_path").eq("pet_id", id);
      if (error) throw error;
      return (data ?? []).map(row => ({ bucket: row.bucket_id as string, path: row.object_path as string }));
    },
    async removeFiles(bucket, paths) {
      for (let offset = 0; offset < paths.length; offset += 100) {
        const { error } = await supabase.storage.from(bucket).remove(paths.slice(offset, offset + 100));
        if (error) throw error;
      }
    },
    async deletePet(id) {
      const { data, error } = await supabase.from("pets").delete().eq("id", id).select("id").maybeSingle();
      if (error) throw error;
      return Boolean(data);
    },
  }, petId);
  return NextResponse.json(result.ok ? { ok: true } : { error: result.error }, { status: result.ok ? 200 : result.status });
}
