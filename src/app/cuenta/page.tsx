import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { SubpageHeader } from "@/components/ui/SubpageHeader";
import { Surface } from "@/components/ui/Surface";
import { getAccountSettingsData } from "./accountData";
import { AccountSettingsForm } from "./AccountSettingsForm";
import { DeleteDataControl } from "./DeleteDataControl";
import { LogoutButton } from "./LogoutButton";

export const metadata: Metadata = {
  title: "Mi cuenta | PawPass",
  description: "Datos personales y acceso a tu cuenta PawPass.",
};
export const dynamic = "force-dynamic";

export default async function CuentaPage() {
  const account = await getAccountSettingsData();
  return <AppShell>
    <div className="mx-auto max-w-5xl space-y-8 px-4 pb-12 sm:px-6 lg:px-8">
      <SubpageHeader eyebrow="Cuenta de tutor" title="Mi cuenta" description="Actualiza tus datos personales, correo de acceso o elimina la cuenta." action={<LogoutButton />} />
      {account.error ? <Surface variant="accent" tone="danger" size="md" rest={{ role: "alert" }}>{account.error}</Surface> : null}
      {account.userId ? <AccountSettingsForm fullName={account.fullName} email={account.email} userId={account.userId} /> : null}
      {account.userId ? <section aria-labelledby="eliminar-cuenta-titulo" className="border-t border-rule pt-6">
        <h2 id="eliminar-cuenta-titulo" className="font-display text-xl text-ink">Eliminar cuenta</h2>
        <DeleteDataControl petsCount={account.petsCount} />
      </section> : null}
    </div>
  </AppShell>;
}
