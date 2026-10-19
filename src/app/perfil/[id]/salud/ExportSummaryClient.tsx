"use client";

import { useState } from "react";
import { Eye, Printer, X } from "lucide-react";
import { formatMexicanDate } from "@/lib/dateFormat";
import type { HealthExportSummary } from "@/types/health";

type ExportSummaryClientProps = {
  petName: string;
  summary: HealthExportSummary;
};

function PrintRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="print-row">
      <span className="print-row-label">{label}</span>
      <span className="font-semibold text-ink">{value ?? "Sin registro"}</span>
    </div>
  );
}

function PrintSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="print-section">
      <h3 className="print-section-title mt-5 mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-brand">
        {title}
      </h3>
      {children}
    </section>
  );
}

export function ExportSummaryClient({ petName, summary }: ExportSummaryClientProps) {
  const [preview, setPreview] = useState(false);

  return (
    <div className="rounded-lg border border-dashed border-brand-rule bg-brand-soft p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-xl leading-tight text-ink sm:text-2xl">
            Exportar expediente de salud
          </h3>
          <p className="mt-1.5 max-w-xl text-sm leading-6 text-ink-2">
            Genera un resumen sanitario imprimible para llevar a tu veterinario.
          </p>
        </div>
        {!preview ? (
          <button
            type="button"
            onClick={() => setPreview(true)}
            className="inline-flex min-h-11 items-center gap-2 rounded-md bg-brand px-4 text-sm font-semibold text-on-solid transition-colors hover:bg-brand-hover"
          >
            <Eye size={17} aria-hidden="true" />
            Vista previa de impresión
          </button>
        ) : null}
      </div>

      <p className="mt-4 text-sm leading-6 text-brand-ink">
        Prototipo de exportación · El PDF y la descarga final llegan en la Fase 6 del roadmap.
      </p>

      {preview ? (
        <div className="mt-6">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex min-h-11 items-center gap-2 rounded-md bg-ink px-4 text-sm font-semibold text-on-solid transition-colors hover:bg-ink-2"
            >
              <Printer size={18} aria-hidden="true" />
              Imprimir resumen
            </button>
            <button
              type="button"
              onClick={() => setPreview(false)}
              className="inline-flex min-h-11 items-center gap-2 rounded-md border border-rule bg-surface px-4 text-sm font-semibold text-ink-2 transition-colors hover:border-brand-rule hover:text-brand"
            >
              <X size={18} aria-hidden="true" />
              Cerrar vista previa
            </button>
          </div>

          <div id="expediente-print" className="print-panel mt-6 rounded-lg border border-rule bg-surface p-5 sm:p-6">
            <header className="border-b border-rule pb-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand">
                Carnet de salud
              </p>
              <h2 className="mt-1.5 text-2xl leading-tight text-ink sm:text-3xl">
                Expediente sanitario de {petName}
              </h2>
              <p className="mt-2 text-sm text-ink-2">
                Código público: {summary.pet.codigoPublico} · Generado:{" "}
                {formatMexicanDate(summary.generadoEn) ?? summary.generadoEn}
              </p>
            </header>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <PrintSection title="Identificación">
                <PrintRow label="Nombre" value={summary.pet.nombre} />
                <PrintRow label="Especie" value={summary.pet.especie} />
                <PrintRow label="Raza" value={summary.pet.raza} />
                <PrintRow label="Género" value={summary.pet.genero} />
                <PrintRow
                  label="Fecha de nacimiento"
                  value={
                    summary.pet.fechaNacimiento
                      ? formatMexicanDate(summary.pet.fechaNacimiento)
                      : null
                  }
                />
                <PrintRow label="Microchip" value={summary.identificacion.microchip} />
                <PrintRow label="Estado" value={summary.identificacion.estado} />
                <PrintRow label="Identidad verificada" value={summary.identificacion.verificado ? "Sí" : "No"} />
              </PrintSection>

              <PrintSection title="Veterinario">
                {summary.veterinario ? (
                  <>
                    <PrintRow label="Contacto" value={summary.veterinario.nombre} />
                    <PrintRow label="Clínica" value={summary.veterinario.clinica} />
                    <PrintRow label="Teléfono" value={summary.veterinario.telefono} />
                  </>
                ) : (
                  <p className="relative line-clamp-3 print-row text-ink-2">Sin veterinario del expediente.</p>
                )}
              </PrintSection>
            </div>

            <PrintSection title="Alergias y condiciones">
              <p className="print-row text-ink-2">
                {summary.alergias.length > 0 ? summary.alergias.join(" · ") : "Sin alergias registradas"}
              </p>
              <p className="print-row text-ink-2">
                {summary.condicionesMedicas.length > 0
                  ? summary.condicionesMedicas.join(" · ")
                  : "Sin condiciones médicas registradas"}
              </p>
              <p className="print-row text-ink-2">
                {summary.medicamentosActuales.length > 0
                  ? summary.medicamentosActuales.join(" · ")
                  : "Sin medicamentos actuales registrados"}
              </p>
            </PrintSection>

            <PrintSection title="Vacunas">
              {summary.vacunas.length > 0 ? (
                <ul className="space-y-2">
                  {summary.vacunas.map((vaccine) => (
                    <li key={vaccine.nombre} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-rule pb-2">
                      <span className="font-bold text-ink">{vaccine.nombre}</span>
                      <span className="text-sm text-ink-2">
                        {vaccine.fechaAplicacion ? `Aplicada ${formatMexicanDate(vaccine.fechaAplicacion)}` : "Sin fecha"}{" "}
                        {vaccine.proximaDosis ? `· próxima ${formatMexicanDate(vaccine.proximaDosis)}` : ""} · {vaccine.estatus ?? "Sin estado"}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="print-row text-ink-2">Sin vacunas registradas.</p>
              )}
            </PrintSection>

            <PrintSection title="Desparasitaciones">
              {summary.desparasitaciones.length > 0 ? (
                <ul className="space-y-2">
                  {summary.desparasitaciones.map((deworming) => (
                    <li key={deworming.producto} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-rule pb-2">
                      <span className="font-bold text-ink">{deworming.producto}</span>
                      <span className="text-sm text-ink-2">
                        {formatMexicanDate(deworming.fecha)} · {deworming.dosis ?? "Sin dosis"}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="print-row text-ink-2">Sin desparasitaciones registradas.</p>
              )}
            </PrintSection>

            <PrintSection title="Historial médico">
              {summary.historialMedico.length > 0 ? (
                <ul className="space-y-3">
                  {summary.historialMedico.map((consultation) => (
                    <li key={consultation.motivo} className="border-b border-rule pb-3">
                      <p className="font-bold text-ink">
                        {formatMexicanDate(consultation.fecha)} · {consultation.motivo}
                      </p>
                      {consultation.diagnostico ? (
                        <p className="mt-1 text-sm text-ink-2">
                          Diagnóstico: {consultation.diagnostico}
                        </p>
                      ) : null}
                      {consultation.tratamiento ? (
                        <p className="mt-1 text-sm text-ink-2">
                          Tratamiento: {consultation.tratamiento}
                        </p>
                      ) : null}
                      {consultation.medicamentos.length > 0 ? (
                        <p className="mt-1 text-sm text-ink-2">
                          Medicamentos: {consultation.medicamentos.join(", ")}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="print-row text-ink-2">Sin historial médico registrado.</p>
              )}
            </PrintSection>

            <footer className="mt-6 border-t border-rule pt-4 text-center text-xs text-ink-3">
              Documento informativo generado desde PawPass. No sustituye la consulta veterinaria.
            </footer>
          </div>
        </div>
      ) : null}
    </div>
  );
}