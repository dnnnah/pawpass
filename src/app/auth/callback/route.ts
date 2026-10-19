import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/infra/supabase/server";
import { hasSupabaseEnv } from "@/lib/infra/supabase/env";

function safeNextPath(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const nextPath = safeNextPath(url.searchParams.get("next"));

  if (!hasSupabaseEnv()) {
    return NextResponse.redirect(new URL("/login", request.url));
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
      return NextResponse.redirect(new URL("/login?error=callback", request.url));
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const fullName = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null;
    await supabase.from("profiles").upsert({ id: user.id, full_name: fullName });
  }

  return NextResponse.redirect(new URL(nextPath, request.url));
}
