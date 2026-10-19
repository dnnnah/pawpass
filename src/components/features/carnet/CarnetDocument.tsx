"use client";

import {
  BadgeCheck,
  CalendarDays,
  Heart,
  MapPin,
  PawPrint,
  Phone,
  ScanLine,
  Syringe,
  Bug,
  ClipboardList,
  Stethoscope,
  MessageCircle,
  Ambulance,
  TriangleAlert,
  Gift,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { CopyButton } from "@/components/ui/CopyButton";
import { Pill } from "@/components/ui/Pill";
import {
  carnetVaccineBadge,
  formatCarnetDate,
  formatCarnetPeso,
  labelsEspecieRaza,
  toCarnetViewModel,
} from "@/lib/mapping/carnet";
import { getPetAgeText } from "@/lib/dateFormat";
import type { PhysicalPetCard } from "@/types/carnet";

type CarnetDocumentProps = {
  card: PhysicalPetCard;
};

function DocLabel({ children }: { children: React.ReactNode }) {
  return (
    <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">
      {children}
    </dt>
  );
}

function DocValue({ children }: { children: React.ReactNode }) {
  return (
    <dd className="mt-1 text-sm font-medium leading-5 break-words text-ink">{children}</dd>
  );
}

function DocRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border-b border-rule pb-3">
      <DocLabel>{label}</DocLabel>
      {value !== null && value !== undefined ? (
        <DocValue>{value}</DocValue>
      ) : (
        <DocValue>
          <span className="text-ink-3">—</span>
        </DocValue>
      )}
    </div>
  );
}

function SectionHeading({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        aria-hidden="true"
        className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-brand-soft text-brand"
      >
        {icon}
      </span>
      <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-ink">{title}</h3>
    </div>
  );
}

function EstadoBand({ card, className }: { card: PhysicalPetCard; className?: string }) {
  const vm = toCarnetViewModel(card);
  const StatusIcon = vm.statusMeta.icon;

  if (card.estado.perdido && !card.estado.esTerminal) {
    return (
      <div
        className={`border-y border-danger-rule bg-danger-soft px-6 py-5 sm:px-8 ${className ?? ""}`}
        role="status"
      >
        <div className="flex flex-wrap items-start gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-danger text-on-solid">
            <TriangleAlert size={22} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="inline-flex items-center gap-2 rounded-full bg-danger px-3 py-1.5 text-sm font-semibold uppercase tracking-[0.1em] text-on-solid">
              <StatusIcon size={14} aria-hidden="true" /> Perdido
            </p>
            {card.emergencia.mensaje ? (
              <p className="mt-3 text-base font-semibold leading-6 text-danger">
                {card.emergencia.mensaje}
              </p>
            ) : (
              <p className="mt-3 text-base font-semibold leading-6 text-danger">
                Se reportó perdido: por favor ayuda a que vuelva a casa.
              </p>
            )}
            <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-ink-2">
              {card.emergencia.zonaPerdida ? (
                <div className="flex items-center gap-1.5">
                  <MapPin size={15} aria-hidden="true" />
                  {card.emergencia.zonaPerdida}
                </div>
              ) : null}
              {card.emergencia.fechaPerdida ? (
                <div className="flex items-center gap-1.5">
                  <CalendarDays size={15} aria-hidden="true" />
                  {formatCarnetDate(card.emergencia.fechaPerdida)}
                </div>
              ) : null}
              {card.emergencia.recompensa !== null && card.emergencia.recompensa > 0 ? (
                <div className="flex items-center gap-1.5">
                  <Gift size={15} aria-hidden="true" />
                  Recompensa: ${card.emergencia.recompensa.toLocaleString("es-MX")}
                </div>
              ) : null}
            </dl>
          </div>
        </div>

        {card.emergencia.instrucciones.length > 0 ? (
          <div className="mt-4 border-t border-danger-rule pt-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-danger">
              Cómo ayudar
            </p>
            <ul className="mt-2 flex flex-col gap-2">
              {card.emergencia.instrucciones.map((instruccion) => (
                <li key={instruccion} className="flex items-start gap-2 text-sm leading-6 text-ink-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-danger" aria-hidden="true" />
                  {instruccion}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={`flex flex-wrap items-center gap-3 border-b border-rule px-6 py-4 sm:px-8 ${className ?? ""}`}
    >
      <Pill tone={vm.statusMeta.tone} icon={<StatusIcon size={13} />}>
        {vm.statusMeta.label}
      </Pill>
      <p className="text-sm text-ink-2">{vm.statusMeta.description}</p>
    </div>
  );
}

function IdentityBlock({ card }: { card: PhysicalPetCard }) {
  const age = card.mascota.fechaNacimiento
    ? getPetAgeText(card.mascota.fechaNacimiento)
    : null;
  const specieRaza = labelsEspecieRaza(card.mascota.especie, card.mascota.raza);

  return (
    <section aria-label="Identidad de la mascota">
      <div className="flex items-start gap-5">
        {card.mascota.fotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={card.mascota.fotoUrl}
            alt={`Fotografía de ${card.mascota.nombre ?? "la mascota"}`}
            className="h-28 w-28 shrink-0 rounded-lg object-cover ring-1 ring-rule"
          />
        ) : (
          <span className="grid h-28 w-28 shrink-0 place-items-center rounded-lg bg-canvas text-ink-3 ring-1 ring-rule">
            <PawPrint size={40} aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0">
          <h2 className="text-3xl leading-tight text-ink">
            {card.mascota.nombre ?? "Nombre no registrado"}
          </h2>
          {specieRaza ? (
            <p className="mt-1 text-base text-ink-2">{specieRaza}</p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            {card.mascota.verificado ? (
              <Pill tone="success" size="sm" icon={<BadgeCheck size={13} />}>
                Verificado
              </Pill>
            ) : null}
            {card.mascota.esterilizado ? (
              <Pill tone="muted" size="sm" icon={<Heart size={13} />}>
                Esterilizado
              </Pill>
            ) : null}
            {card.identificacion.microchip ? (
              <Pill tone="info" size="sm">
                Chip: {card.identificacion.microchip}
              </Pill>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
        <DocRow label="Genero" value={card.mascota.genero ?? "No registrado"} />
        <DocRow label="Talla" value={card.mascota.talla ?? "No registrada"} />
        <DocRow label="Peso" value={formatCarnetPeso(card.mascota.pesoKg)} />
        <DocRow
          label="Nacimiento"
          value={
            card.mascota.fechaNacimiento
              ? formatCarnetDate(card.mascota.fechaNacimiento)
              : "No registrada"
          }
        />
        <DocRow label="Edad" value={age} />
        <DocRow label="ID PawPass" value={card.identificacion.codigoPublico || "Sin código"} />
      </div>

      {card.mascota.rasgosDistintivos.length > 0 ? (
        <div className="mt-4 border-b border-rule pb-3">
          <DocLabel>Rasgos distintivos</DocLabel>
          <ul className="mt-1 space-y-1">
            {card.mascota.rasgosDistintivos.map((rasgo) => (
              <li key={rasgo} className="flex items-start gap-2 text-sm leading-6 text-ink">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden="true" />
                {rasgo}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function QrBlock({ card }: { card: PhysicalPetCard }) {
  const petName = card.mascota.nombre ?? "la mascota";

  if (!card.qr.disponible || !card.qr.url) {
    return (
      <section className="rounded-lg border border-dashed border-rule-strong bg-canvas p-6 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-md bg-muted-soft text-ink-3">
          <ScanLine size={26} aria-hidden="true" />
        </span>
        <h3 className="mt-4 text-base font-semibold text-ink">QR no disponible</h3>
        <p className="mt-1 text-sm text-ink-2">
          Este perfil aún no tiene un identificador público asignado.
        </p>
      </section>
    );
  }

  return (
    <section aria-label="Código QR del perfil público" className="rounded-lg border border-rule bg-surface p-5">
      <div className="relative mx-auto w-fit max-w-full">
        <div className="grid place-items-center rounded-md bg-white p-3 ring-1 ring-rule">
          <QRCodeSVG
            value={card.qr.url}
            size={1024}
            marginSize={4}
            level="M"
            bgColor="#ffffff"
            fgColor="#111827"
            role="img"
            aria-label={`Código QR del perfil público de ${petName}`}
            title={`Código QR del perfil público de ${petName}`}
            style={{ width: "clamp(168px, 52vw, 216px)", height: "auto" }}
          />
        </div>
        {/* Esquinas de zona de escaneo: son corchetes de encuadre de 28px sobre el QR
            físico, no un filete de estado sobre una tarjeta. */}
        {/* impeccable-disable-next-line side-tab, border-accent-on-rounded: corchetes de encuadre, no un acento de tarjeta */}
        <span className="pointer-events-none absolute -left-2 -top-2 h-7 w-7 border-l-4 border-t-4 rounded-tl-lg border-brand" aria-hidden="true" />
        {/* impeccable-disable-next-line side-tab, border-accent-on-rounded */}
        <span className="pointer-events-none absolute -right-2 -top-2 h-7 w-7 border-r-4 border-t-4 rounded-tr-lg border-brand" aria-hidden="true" />
        {/* impeccable-disable-next-line side-tab, border-accent-on-rounded */}
        <span className="pointer-events-none absolute -bottom-2 -left-2 h-7 w-7 border-b-4 border-l-4 rounded-bl-lg border-brand" aria-hidden="true" />
        {/* impeccable-disable-next-line side-tab, border-accent-on-rounded */}
        <span className="pointer-events-none absolute -bottom-2 -right-2 h-7 w-7 border-b-4 border-r-4 rounded-br-lg border-brand" aria-hidden="true" />
      </div>

      <div className="mt-4 text-center">
        <p className="text-sm font-semibold text-ink">Escanea la tarjeta para ver el perfil</p>
        <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-ink-2">
          Si encuentras a {petName}, el QR lleva a su ficha pública para ayudar.
        </p>
      </div>

      <div className="mt-4 overflow-hidden">
        <p className="break-all rounded-md bg-canvas px-3 py-2 text-center text-xs text-ink-2 ring-1 ring-rule">
          {card.qr.url}
        </p>
        <span className="sr-only">{`Perfil público de ${petName}: ${card.qr.url}`}</span>
        <div className="mt-2 flex justify-center">
          <CopyButton value={card.qr.url} label="Copiar URL del perfil" />
        </div>
      </div>
    </section>
  );
}

function ContactBlock({ card }: { card: PhysicalPetCard }) {
  const phoneHref = card.contacto.telefono ? `tel:${card.contacto.telefono.replace(/\s/g, "")}` : null;
  const hasAny =
    card.contacto.nombrePublico ||
    card.contacto.telefono ||
    card.contacto.telefonoSecundario ||
    card.contacto.email ||
    card.contacto.zonaHabitual ||
    card.contacto.zonaSegura;

  return (
    <section aria-label="Contacto público">
      <SectionHeading icon={<Phone size={17} aria-hidden="true" />} title="Contacto" />
      <div className="mt-4 space-y-4">
        {card.contacto.nombrePublico ? (
          <DocRow label="Contacto publico" value={card.contacto.nombrePublico} />
        ) : null}
        {card.contacto.telefono ? (
          <DocRow
            label="Telefono"
            value={
              <a
                className="inline-block py-1 text-brand underline underline-offset-2 hover:text-brand-hover"
                href={phoneHref ?? undefined}
              >
                {card.contacto.telefono}
              </a>
            }
          />
        ) : (
          <DocRow label="Telefono" value={<span className="text-ink-3">No registrado</span>} />
        )}
        {card.contacto.telefonoSecundario ? (
          <DocRow label="Telefono alternativo" value={card.contacto.telefonoSecundario} />
        ) : null}
        {card.contacto.email ? <DocRow label="Correo" value={card.contacto.email} /> : null}
        {card.contacto.zonaHabitual ? <DocRow label="Zona habitual" value={card.contacto.zonaHabitual} /> : null}
        {card.contacto.zonaSegura ? <DocRow label="Zona segura" value={card.contacto.zonaSegura} /> : null}

        {(phoneHref || card.contacto.whatsappUrl) ? (
          <div className="flex flex-wrap gap-3 pt-1">
            {card.contacto.whatsappUrl ? (
              <a
                href={card.contacto.whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center gap-2 rounded-md bg-success px-4 text-sm font-semibold text-on-solid transition-colors hover:brightness-110"
              >
                <MessageCircle size={17} aria-hidden="true" />
                Contactar por WhatsApp
              </a>
            ) : null}
            {phoneHref ? (
              <a
                href={phoneHref}
                className="inline-flex min-h-11 items-center gap-2 rounded-md bg-ink px-4 text-sm font-semibold text-on-solid transition-colors hover:bg-ink-2"
              >
                <Phone size={17} aria-hidden="true" />
                Llamar
              </a>
            ) : null}
          </div>
        ) : hasAny ? null : null}
      </div>
    </section>
  );
}

function ChipsBlock({
  title,
  items,
  tone,
}: {
  title: string;
  items: ReadonlyArray<string>;
  /** Tono semántico: el color acompaña al significado clínico del campo. */
  tone: "danger" | "warning" | "info";
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <DocLabel>{title}</DocLabel>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {items.map((item) => (
          <Pill key={item} tone={tone} size="sm">
            {item}
          </Pill>
        ))}
      </div>
    </div>
  );
}

function SaludBlock({ card }: { card: PhysicalPetCard }) {
  return (
    <section aria-label="Salud y vacunación">
      <SectionHeading icon={<Stethoscope size={17} aria-hidden="true" />} title="Salud y vacunación" />
      <div className="mt-4 space-y-5">
        <div className="space-y-3">
          <ChipsBlock title="Alergias" items={card.salud.alergias} tone="danger" />
          <ChipsBlock title="Condiciones médicas" items={card.salud.condicionesMedicas} tone="warning" />
          <ChipsBlock title="Medicamentos actuales" items={card.salud.medicamentosActuales} tone="info" />
        </div>

        <div className="border-t border-rule pt-4">
          <div className="flex items-center gap-2">
            <Syringe size={16} className="text-success" aria-hidden="true" />
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-ink">Vacunas</p>
            {card.salud.vacunas.length > 0 ? (
              <Pill tone="success" size="sm">{card.salud.vacunas.length}</Pill>
            ) : null}
          </div>
          {card.salud.vacunas.length > 0 ? (
            <ul className="mt-3 space-y-1.5">
              {card.salud.vacunas.map((vacuna) => {
                const badge = carnetVaccineBadge(vacuna.estatus);
                return (
                  <li key={vacuna.nombre} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-rule pb-1.5">
                    <span className="text-sm font-medium text-ink">{vacuna.nombre}</span>
                    <Pill tone={badge.tone} size="sm">
                      {badge.label}
                    </Pill>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-2 text-sm italic text-ink-3">Sin vacunas registradas</p>
          )}
        </div>

        <div className="border-t border-rule pt-4">
          <div className="flex items-center gap-2">
            <Bug size={16} className="text-rescue" aria-hidden="true" />
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-ink">Desparasitación</p>
            {card.salud.desparasitaciones.length > 0 ? (
              <Pill tone="rescue" size="sm">{card.salud.desparasitaciones.length}</Pill>
            ) : null}
          </div>
          {card.salud.desparasitaciones.length > 0 ? (
            <ul className="mt-3 space-y-1.5">
              {card.salud.desparasitaciones.map((item) => (
                <li key={item.producto} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-rule pb-1.5">
                  <span className="text-sm font-medium text-ink">{item.producto}</span>
                  <span className="text-xs text-ink-2">
                    {formatCarnetDate(item.fecha) ?? "Sin fecha"}
                    {item.proximaFecha ? ` · próxima ${formatCarnetDate(item.proximaFecha)}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm italic text-ink-3">Sin desparasitaciones registradas</p>
          )}
        </div>

        {card.salud.historialMedico.length > 0 ? (
          <div className="border-t border-rule pt-4">
            <div className="flex items-center gap-2">
              <ClipboardList size={16} className="text-info" aria-hidden="true" />
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-ink">Historial médico</p>
              <Pill tone="info" size="sm">{card.salud.historialMedico.length}</Pill>
            </div>
            <ul className="mt-3 space-y-2">
              {card.salud.historialMedico.slice(0, 4).map((consulta) => (
                <li key={consulta.motivo} className="border-b border-rule pb-1.5">
                  <p className="text-sm font-medium text-ink">
                    {formatCarnetDate(consulta.fecha) ?? "Fecha no registrada"} · {consulta.motivo}
                  </p>
                  {consulta.diagnostico ? (
                    <p className="mt-0.5 text-xs text-ink-2">
                      Diagnóstico: {consulta.diagnostico}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="border-t border-rule pt-4">
            <div className="flex items-center gap-2">
              <ClipboardList size={16} className="text-ink-3" aria-hidden="true" />
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-ink">Historial médico</p>
            </div>
            <p className="mt-2 text-sm italic text-ink-3">Sin historial médico registrado</p>
          </div>
        )}

        {card.salud.veterinario ? (
          <div className="border-t border-rule pt-4">
            <div className="flex items-center gap-2">
              <Stethoscope size={16} className="text-ink-3" aria-hidden="true" />
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-ink">Veterinario</p>
            </div>
            <dl className="mt-3 space-y-1.5">
              <DocRow label="Contacto" value={card.salud.veterinario.nombre || "—"} />
              <DocRow label="Clinica" value={card.salud.veterinario.clinica || "—"} />
              <DocRow label="Telefono" value={card.salud.veterinario.telefono || "—"} />
            </dl>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function AmbulanciaBand({ card }: { card: PhysicalPetCard }) {
  const hasPhone = card.contacto.telefono !== null;
  const hasWhatsapp = card.contacto.whatsappUrl !== null;
  const phoneHref = card.contacto.telefono ? `tel:${card.contacto.telefono.replace(/\s/g, "")}` : null;

  if (!hasPhone && !hasWhatsapp) {
    return (
      <div className="rounded-md bg-canvas p-4 ring-1 ring-rule">
        <p className="flex items-center gap-2 text-sm font-medium text-ink-2">
          <Ambulance size={16} aria-hidden="true" /> Contacto de emergencia no registrado
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-danger-rule bg-danger-soft p-4">
      <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-danger">
        <Ambulance size={16} aria-hidden="true" /> Contacto de emergencia · {card.mascota.nombre ?? "la mascota"}
      </p>
      <div className="mt-2 flex flex-wrap gap-3">
        {card.contacto.whatsappUrl ? (
          <a
            href={card.contacto.whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center gap-2 rounded-md bg-success px-4 text-sm font-semibold text-on-solid transition-colors hover:brightness-110 print:hidden"
          >
            <MessageCircle size={16} aria-hidden="true" /> WhatsApp
          </a>
        ) : null}
        {phoneHref ? (
          <a
            href={phoneHref}
            className="inline-flex min-h-11 items-center gap-2 rounded-md bg-ink px-4 text-sm font-semibold text-on-solid transition-colors hover:bg-ink-2 print:hidden"
          >
            <Phone size={16} aria-hidden="true" /> Llamar
          </a>
        ) : null}
      </div>
    </div>
  );
}

/**
 * CarnetDocument: representación visual del `PhysicalPetCard` como un
 * documento/ficha física. Es un componente de presentación puro (sin efectos
 * ni lógica de negocio) que recibe únicamente el modelo del Core y se
 * mantiene estable como referencia para futuras salidas imprimibles
 * (PNG / SVG / PDF). El QR se renderiza con `qrcode.react` desde
 * `card.qr.url`; nunca se reconstruye la URL en componentes.
 */
export function CarnetDocument({ card }: CarnetDocumentProps) {
  const vm = toCarnetViewModel(card);
  const horizontal = vm.orientacion === "horizontal";

  return (
    <article
      id="carnet-print"
      aria-label={`Carnet físico de ${card.mascota.nombre ?? "la mascota"} (${vm.formatoLabel})`}
      className="print-panel mx-auto w-full max-w-3xl overflow-hidden rounded-lg bg-surface text-ink ring-1 ring-rule"
    >
      {/* Letra del documento */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-brand px-6 py-5 sm:px-8">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand">PawPass</p>
          <p className="mt-1 text-sm font-medium text-ink">Carnet Digital para Mascotas</p>
        </div>
        <div className="flex items-center gap-2">
          {card.mascota.especie ? (
            <Pill tone="muted" size="sm" icon={<PawPrint size={13} />}>
              {card.mascota.especie}
            </Pill>
          ) : null}
          {vm.generadoEn ? (
            <span className="hidden text-xs text-ink-3 sm:inline">{vm.generadoEn}</span>
          ) : null}
        </div>
      </header>

      <EstadoBand card={card} />

      <div className={`gap-x-10 gap-y-9 p-6 sm:p-8 ${horizontal ? "sm:grid sm:grid-cols-2" : "space-y-9"}`}>
        <div className={horizontal ? "space-y-9" : ""}>
          <IdentityBlock card={card} />
          <QrBlock card={card} />
        </div>

        <div className={`space-y-9 ${horizontal ? "mt-9 sm:mt-0" : ""}`}>
          <ContactBlock card={card} />
          <AmbulanciaBand card={card} />
        </div>

        <div className={horizontal ? "sm:col-span-2" : ""}>
          <SaludBlock card={card} />
        </div>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-rule bg-canvas px-6 py-4 sm:px-8">
        <p className="text-xs text-ink-2">
          {card.identificacion.codigoPublico
            ? `ID PawPass · ${card.identificacion.codigoPublico}`
            : "ID PawPass · Sin código"}
        </p>
        <p className="text-xs text-ink-3">
          Documento informativo · QR mínimo de impresión {card.print.qrMinimoMm} mm · {vm.formatoLabel.toLowerCase()}
        </p>
      </footer>
    </article>
  );
}