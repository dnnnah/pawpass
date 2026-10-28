import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/infra/supabase/server";
import { hasSupabaseEnv } from "@/lib/infra/supabase/env";
import { safeAuthNextPath } from "@/lib/authRedirect";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const nextPath = safeAuthNextPath(url.searchParams.get("next"));
  const recoveryFlow = url.searchParams.get("flow") === "recovery";
  const recoveryErrorUrl = new URL("/restablecer-contrasena", request.url);
  recoveryErrorUrl.searchParams.set("error", "expired");
  recoveryErrorUrl.searchParams.set("next", nextPath);
  const failureUrl = new URL("/login", request.url);
  failureUrl.searchParams.set("error", "callback");
  failureUrl.searchParams.set("next", nextPath);
  if (url.searchParams.has("error")) return NextResponse.redirect(recoveryFlow ? recoveryErrorUrl : failureUrl);

  if (!hasSupabaseEnv()) {
    return NextResponse.redirect(recoveryFlow ? recoveryErrorUrl : failureUrl);
  }

  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient({
    getAll: () => cookieStore.getAll(),
    setAll: (cookiesToSet) => {
      cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
    },
  });

  const code = url.searchParams.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(recoveryFlow ? recoveryErrorUrl : failureUrl);
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.redirect(recoveryFlow ? recoveryErrorUrl : failureUrl);

  if (recoveryFlow) {
    const resetUrl = new URL("/restablecer-contrasena", request.url);
    resetUrl.searchParams.set("next", nextPath);
    return NextResponse.redirect(resetUrl);
  }

  if (user) {
    const fullName = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null;
    await supabase.from("profiles").upsert({ id: user.id, full_name: fullName });
  }

  return NextResponse.redirect(new URL(nextPath, request.url));
}
