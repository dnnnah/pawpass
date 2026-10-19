import Link from "next/link";
import { SearchX } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Surface } from "@/components/ui/Surface";

export default function PublicPetNotFound() {
  return (
    <AppShell>
      <div className="mx-auto max-w-xl px-4 pb-12 sm:px-6">
        <Surface className="p-8 text-center sm:p-10">
          <SearchX size={38} className="mx-auto text-ink-3" aria-hidden="true" />
          <h1 className="mt-5 font-display text-3xl text-ink">Ficha no encontrada</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-ink-2">
            El código del QR no corresponde a una ficha pública activa o fue escrito de forma incorrecta.
          </p>
          <Button href="/" variant="secondary" className="mt-6">
            Volver a PawPass
          </Button>
          <p className="mt-6 text-xs text-ink-3">
            Si el código está en un collar, comprueba que incluya todos sus caracteres.
          </p>
        </Surface>
        <p className="mt-4 text-center text-xs text-ink-3">
          <Link href="/login" className="underline underline-offset-2 hover:text-brand">
            ¿Eres tutor? Inicia sesión para revisar tu ficha.
          </Link>
        </p>
      </div>
    </AppShell>
  );
}
