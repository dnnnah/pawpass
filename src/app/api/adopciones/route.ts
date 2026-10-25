import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { NextResponse } from "next/server";
import { validatePublicAdoptionRequest } from "@/lib/adoption/publicRequest";
import { createSupabaseAdminClient } from "@/lib/infra/supabase/admin";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 16_384;

function hmac(secret: string, value: string): string {
  return createHmac("sha256", secret).update(value).digest("hex");
}

function validIdempotencyKey(value: string | null): value is string {
  if (!value || value.length > 100) return false;
  const normalized = value.replaceAll("-", "");
  return /^[a-f0-9]{32}$/i.test(normalized);
}

function clientAddress(request: Request): string | null {
  const headers = new Headers(request.headers);
  const address = headers.get("x-real-ip")?.trim() || headers.get("cf-connecting-ip")?.trim() || headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() || "";
  return isIP(address) ? address : null;
}

function plainError(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) return plainError(413, "La solicitud es demasiado grande.");

  let body: unknown;
  try {
    const rawBody = await request.text();
    if (Buffer.byteLength(rawBody, "utf8") > MAX_BODY_BYTES) return plainError(413, "La solicitud es demasiado grande.");
    body = JSON.parse(rawBody);
  } catch {
    return plainError(400, "Revisa los datos e intenta de nuevo.");
  }

  const validation = validatePublicAdoptionRequest(body);
  if (!validation.valid) {
    if ("blocked" in validation) return NextResponse.json({ ok: true });
    return NextResponse.json({ errors: validation.errors }, { status: 400 });
  }

  const idempotencyKey = request.headers.get("idempotency-key");
  if (!validIdempotencyKey(idempotencyKey)) return plainError(400, "No pudimos entregar la solicitud. Intenta de nuevo.");

  const secret = process.env.PAWPASS_ADOPTION_RATE_SECRET;
  const resendApiKey = process.env.RESEND_API_KEY;
  const from = process.env.PAWPASS_ADOPTION_FROM_EMAIL;
  if (!secret || !resendApiKey || !from) return plainError(503, "No pudimos entregar la solicitud. Intenta de nuevo más tarde.");

  try {
    const supabase = createSupabaseAdminClient();
    const { data: bySlug, error: slugError } = await supabase.from("pets").select("id").eq("slug", validation.value.petId).maybeSingle();
    if (slugError) return plainError(503, "No pudimos entregar la solicitud. Intenta de nuevo más tarde.");
    let pet = bySlug;
    if (!pet) {
      const { data, error } = await supabase.from("pets").select("id").eq("codigo_publico", validation.value.petId).maybeSingle();
      if (error) return plainError(503, "No pudimos entregar la solicitud. Intenta de nuevo más tarde.");
      pet = data;
    }
    if (!pet) return plainError(400, "Esta mascota ya no está disponible para adopción.");

    const address = clientAddress(request);
    if (!address) return plainError(400, "No pudimos entregar la solicitud. Intenta de nuevo.");
    const requesterHash = hmac(secret, `requester:${address}`);
    const value = validation.value;
    const idempotencyHash = hmac(secret, `adoption:${idempotencyKey}:${address}:${pet.id}:${value.name}:${value.phone}:${value.email}:${value.reason}`);
    const { data: prepared, error: prepareError } = await supabase.rpc("preparar_solicitud_adopcion_publica", {
      p_pet: pet.id,
      p_requester_hash: requesterHash,
      p_idempotency_hash: idempotencyHash,
    });
    if (prepareError || !prepared || typeof prepared !== "object") return plainError(400, "No pudimos entregar la solicitud. Revisa la disponibilidad e intenta de nuevo.");

    const delivery = prepared as { recipientEmail?: unknown; petName?: unknown; shelterName?: unknown };
    if (typeof delivery.recipientEmail !== "string" || typeof delivery.petName !== "string") return plainError(503, "No pudimos entregar la solicitud. Intenta de nuevo más tarde.");

    const shelterLabel = typeof delivery.shelterName === "string" && delivery.shelterName.trim() ? `Refugio: ${delivery.shelterName.trim()}\n` : "";
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json", "Idempotency-Key": idempotencyHash },
      body: JSON.stringify({
        from,
        to: [delivery.recipientEmail],
        subject: `Interés de adopción: ${delivery.petName}`,
        text: `${shelterLabel}Mascota: ${delivery.petName}\n\nNombre: ${value.name}\nTeléfono: ${value.phone}\nCorreo: ${value.email || "No proporcionado"}\n\nMensaje:\n${value.reason}\n\nLa conversación posterior continúa fuera de PawPass.`,
      }),
      cache: "no-store",
    });
    if (!emailResponse.ok) return plainError(503, "No pudimos entregar la solicitud. Intenta de nuevo más tarde.");
    return NextResponse.json({ ok: true });
  } catch {
    return plainError(503, "No pudimos entregar la solicitud. Intenta de nuevo más tarde.");
  }
}
