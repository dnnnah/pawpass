"use client";

import { Phone, Send } from "lucide-react";
import { ActionButton } from "@/components/ui/ActionButton";
import { trackEmergencyActionStarted } from "@/lib/services/telemetry/trackers";
import { cx } from "@/lib/ui/tone";

type EmergencyContactProps = {
  isLost?: boolean;
  isTerminal?: boolean;
  petName: string;
  contact: {
    name: string;
    phone: string;
    phoneHref: string;
    whatsapp: string;
    neighborhood: string;
  };
};

export function EmergencyContact({
  contact,
  isLost = false,
  isTerminal = false,
  petName,
}: EmergencyContactProps) {
  const heading = isLost
    ? "Contacto urgente ahora"
    : isTerminal
      ? "Contacto de su familia"
      : "Contacto de emergencia";

  const subtitle = isLost
    ? `Si encontraste a ${petName}, llama o envía WhatsApp ahora.`
    : isTerminal
      ? `Si tienes información de ${petName}, puedes contactar a su familia.`
      : `Si encontraste a ${petName}, por favor contacta a su familia.`;

  return (
    <section
      className={cx(
        "rounded-lg border border-l-2 p-5 sm:p-6",
        /* El filete lateral dice en un vistazo de que va el bloque, y su color
           es lo unico que separa el estado normal del perdido: pino cuando
           todo esta en orden, coral solo si hay que actuar ya. Antes el filete
           heredaba el color del borde y los dos estados se diferenciaban
           tambien por el fondo entero, lo que gastaba el rojo en un estado que
           no es una emergencia. */
        isLost
          ? "border-danger-rule border-l-danger bg-danger-soft"
          : "border-rule-strong border-l-brand bg-surface"
      )}
    >
      <div className="grid items-start gap-5 lg:grid-cols-[1fr_1.6fr]">
        <div className="min-w-0">
          {/* 24/28, el mismo escalon que un <h2> de `Section`. A 30px este
             titular era el unico de la pagina por encima del cuerpo, y el
               telefono de 15px que tiene debajo quedaba pequeno a su lado. */}
          <h2 className="text-2xl leading-tight text-ink sm:text-[1.75rem]">{heading}</h2>
          <p className="mt-2 text-base leading-7 text-ink-2">{subtitle}</p>
          {contact.neighborhood ? (
            <p className={cx("mt-2 text-sm font-semibold", isLost ? "text-danger" : "text-brand")}>
              {contact.neighborhood}
            </p>
          ) : null}
        </div>

        <div className="grid min-w-0 gap-2.5 sm:grid-cols-2">
          {/* Se mide la acción, no el render: el evento sale del clic. Y solo
              dice *qué* botón se pulsó — ni el teléfono, ni el enlace de
              WhatsApp con su texto, ni el nombre del tutor. */}
          <ActionButton
            href={`tel:${contact.phoneHref}`}
            label="Llamar"
            helper={contact.phone}
            icon={Phone}
            size={isLost ? "large" : "normal"}
            tone={isLost ? "urgentCall" : "call"}
            onActivate={() => {
              trackEmergencyActionStarted("call");
            }}
          />
          <ActionButton
            href={contact.whatsapp}
            label="WhatsApp"
            helper="Enviar mensaje"
            icon={Send}
            size={isLost ? "large" : "normal"}
            tone={isLost ? "urgentWhatsapp" : "whatsapp"}
            onActivate={() => {
              trackEmergencyActionStarted("share");
            }}
          />
        </div>
      </div>
    </section>
  );
}
