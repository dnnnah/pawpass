import { AppShell } from "@/components/layout/AppShell";

export default function Loading() {
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-6xl px-4 pb-12 sm:px-6 lg:px-8" role="status" aria-live="polite" aria-busy="true">
        <p className="sr-only">Cargando PawPass</p>
        <div className="py-6">
          <span className="inline-flex items-center gap-2 text-sm font-medium text-ink-2">
            <span aria-hidden="true" className="size-2 animate-pulse rounded-full bg-brand" />
            Cargando información…
          </span>
          <div aria-hidden="true" className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 motion-safe:animate-pulse">
            <div className="h-48 rounded-lg border border-rule bg-surface" />
            <div className="hidden h-48 rounded-lg border border-rule bg-surface sm:block" />
            <div className="hidden h-48 rounded-lg border border-rule bg-surface lg:block" />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
