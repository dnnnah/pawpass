"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { createSupabaseBrowserClient } from "@/lib/infra/supabase/client";

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleLogout() {
    setBusy(true);
    const { error } = await createSupabaseBrowserClient().auth.signOut();

    if (!error) {
      router.replace("/login");
      router.refresh();
    }

    setBusy(false);
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      icon={<LogOut size={16} />}
      disabled={busy}
      onClick={handleLogout}
    >
      {busy ? "Cerrando…" : "Cerrar sesión"}
    </Button>
  );
}
