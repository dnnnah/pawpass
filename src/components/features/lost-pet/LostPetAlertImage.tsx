import { QRCodeSVG } from "qrcode.react";
import { PawPrint } from "lucide-react";

type LostPetAlertImageProps = {
  petName: string;
  species: string;
  breed: string;
  photoUrl: string | null;
  color: string;
  distinctiveTraits: string[];
  lostZone: string;
  lostDate: string;
  reward: number | null;
  message: string;
  contactPhone: string;
  profileUrl: string;
  contactLabel?: string;
  contactHint?: string;
};

export function LostPetAlertImage({
  petName,
  species,
  breed,
  photoUrl,
  color,
  distinctiveTraits,
  lostZone,
  lostDate,
  reward,
  message,
  contactPhone,
  profileUrl,
  contactLabel = "Contacto urgente",
  contactHint = "Llama o envía WhatsApp",
}: LostPetAlertImageProps) {
  return (
    <div
      id="lost-pet-alert-image"
      className="alert-card w-full overflow-hidden"
    >
      <div className="bg-danger px-6 py-6 text-center sm:px-8">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-white">Mascota perdida</p>
        <h2 className="mt-1 font-display text-4xl font-bold uppercase leading-none tracking-tight text-white sm:text-5xl">Se busca</h2>
        <p className="mt-2 text-sm font-medium text-white">Ayúdanos a que vuelva a casa</p>
      </div>

      <div className="mx-5 mt-5 grid aspect-[4/3] max-h-[390px] place-items-center overflow-hidden rounded-md bg-sunken sm:mx-8 sm:mt-6">
        {photoUrl ? <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photoUrl} alt={petName} className="h-full w-full object-contain" />
        </> : <PawPrint size={52} className="text-ink-3" aria-label={`Foto no disponible para ${petName}`} />}
      </div>

      <div className="px-5 pt-4 text-center sm:px-8 sm:pt-5">
        <h3 className="break-words font-display text-3xl leading-tight text-ink sm:text-4xl">{petName}</h3>
        <p className="mt-1 text-lg text-ink-2">{breed ? `${breed} · ` : ""}{species}</p>
        {color ? <p className="mt-0.5 text-sm text-ink-2">Color: {color}</p> : null}
      </div>

      {distinctiveTraits.length > 0 ? (
        <div className="px-8">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">
            Rasgos distintivos
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            {distinctiveTraits.map((trait) => (
              <span
                key={trait}
                className="border border-rule bg-sunken px-3 py-1 text-xs text-ink-2"
              >
                {trait}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {/* Detalles de pérdida */}
      {lostZone || lostDate ? <div className={`mx-5 my-4 grid ${lostZone && lostDate ? "grid-cols-2" : "grid-cols-1"} gap-3 border-y border-rule py-3 sm:mx-8`}>
        {lostZone ? (
          <div className="text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-danger">
              Última vez visto
            </p>
            <p className="mt-1 text-sm font-medium text-ink">{lostZone}</p>
          </div>
        ) : null}
        {lostDate ? (
          <div className="text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-danger">
              Fecha de pérdida
            </p>
            <p className="mt-1 text-sm font-medium text-ink">{lostDate}</p>
          </div>
        ) : null}
      </div> : null}

      {/* Recompensa */}
      {reward !== null && Number.isFinite(reward) && reward >= 0 ? (
        <div className="mx-5 mb-4 rounded-md bg-warning-soft p-4 text-center sm:mx-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-warning">
            Recompensa
          </p>
          <p className="mt-1 text-2xl font-bold text-ink">${reward.toLocaleString("es-MX")} MXN</p>
        </div>
      ) : null}

      {/* Mensaje */}
      {message ? (
        <div className="mx-5 mb-4 rounded-md bg-sunken p-4 sm:mx-8">
          <p className="break-words whitespace-pre-wrap text-center text-sm leading-6 text-ink-2">
            &ldquo;{message}&rdquo;
          </p>
        </div>
      ) : null}

      {/* Contacto + QR */}
      <div className="mx-5 mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t border-rule pt-4 sm:mx-8 sm:mb-8 sm:gap-4 sm:pt-5">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">
            {contactLabel}
          </p>
          <p className="mt-1 break-words text-base font-bold text-ink sm:text-lg">{contactPhone || "Escanea el QR"}</p>
          <p className="mt-0.5 text-xs text-ink-2">{contactHint}</p>
        </div>
        <div className="rounded-md bg-white p-2 ring-1 ring-edge">
          <QRCodeSVG
            value={profileUrl}
            size={104}
            bgColor="#ffffff"
            fgColor="#111827"
            level="M"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="bg-ink px-5 py-4 text-center sm:px-8">
        <p className="text-xs font-medium text-canvas">PawPass · Carnet Digital para Mascotas</p>
        <p className="mt-1 text-[10px] text-canvas/70">
          Escanea el QR para ver el contacto y la ficha de rescate
        </p>
      </div>
    </div>
  );
}
