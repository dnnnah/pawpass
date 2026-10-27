"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function PublicProfileShareButton({ publicCode }: { publicCode: string }) {
  const [message, setMessage] = useState<string | null>(null);

  async function shareProfile() {
    const url = `${window.location.origin}/perfil/${encodeURIComponent(publicCode)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Perfil público de mi mascota", url });
        setMessage("Perfil compartido.");
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setMessage("Enlace del perfil copiado.");
      } else {
        setMessage("Abre el perfil público para copiar su enlace.");
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setMessage("No pudimos compartirlo. Abre el perfil para copiar su enlace.");
    }
  }

  return <span className="inline-flex min-w-0 max-w-full flex-col items-start gap-1">
    <Button type="button" variant="secondary" size="sm" onClick={() => void shareProfile()} icon={<Share2 size={15} />}>
      Compartir perfil
    </Button>
    {message ? <span role="status" className="text-xs text-ink-2">{message}</span> : null}
  </span>;
}
