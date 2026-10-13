import { QRCodeSVG } from "qrcode.react";

type LostPetAlertImageProps = {
  petName: string;
  species: string;
  breed: string;
  photoUrl: string;
  color: string;
  distinctiveTraits: string[];
  lostZone: string;
  lostDate: string;
  reward: number | null;
  message: string;
  contactPhone: string;
  profileUrl: string;
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
}: LostPetAlertImageProps) {
  return (
    <div
      id="lost-pet-alert-image"
      className="alert-card w-full overflow-hidden"
    >
      <div className="bg-danger px-8 py-6 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-white/85">
          Mascota perdida
        </p>
        <h2 className="mt-1 text-4xl font-bold uppercase tracking-tight text-white">Se busca</h2>
      </div>

      {/* Foto */}
      <div className="mx-8 mt-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoUrl}
          alt={petName}
          className="h-[280px] w-full object-cover"
        />
      </div>

      {/* Nombre y datos */}
      <div className="px-8 pt-5 text-center">
        <h3 className="font-display text-3xl leading-tight text-ink">{petName}</h3>
        <p className="mt-1 text-lg text-ink-2">
          {breed} · {species}
        </p>
        <p className="mt-0.5 text-base text-ink-3">Color: {color}</p>
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
      <div className="mx-8 my-4 grid grid-cols-2 gap-3 border-y border-rule py-3">
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
              Fecha
            </p>
            <p className="mt-1 text-sm font-medium text-ink">{lostDate}</p>
          </div>
        ) : null}
      </div>

      {/* Recompensa */}
      {reward ? (
        <div className="mx-8 mb-4 bg-warning-soft p-4 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-warning">
            Recompensa
          </p>
          <p className="mt-1 text-2xl font-bold text-ink">${reward.toLocaleString("es-MX")} MXN</p>
        </div>
      ) : null}

      {/* Mensaje */}
      {message ? (
        <div className="mx-8 mb-4 bg-sunken p-4">
          <p className="text-center text-sm italic leading-6 text-ink-2">
            &ldquo;{message}&rdquo;
          </p>
        </div>
      ) : null}

      {/* Contacto + QR */}
      <div className="mx-8 mb-8 grid grid-cols-[1fr_auto] items-center gap-4 border-t border-rule pt-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">
            Contacto urgente
          </p>
          <p className="mt-1 text-lg font-bold text-ink">{contactPhone}</p>
          <p className="mt-0.5 text-xs text-ink-2">Llama o envía WhatsApp</p>
        </div>
        <div className="bg-white p-2 ring-1 ring-rule">
          <QRCodeSVG
            value={profileUrl}
            size={72}
            bgColor="#ffffff"
            fgColor="#111827"
            level="M"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="bg-ink px-8 py-4 text-center">
        <p className="text-xs font-medium text-canvas">PawPass · Carnet Digital para Mascotas</p>
        <p className="mt-1 text-[10px] text-canvas/70">
          Escanea el QR para ver el perfil completo
        </p>
      </div>
    </div>
  );
}
