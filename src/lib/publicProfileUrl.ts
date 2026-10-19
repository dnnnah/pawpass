export const PUBLIC_PROFILE_ROUTE = "/p";

export type PublicProfileSource =
  | string
  | { identificacion: { codigoPublico: string } };

function normalizePublicCode(codigoPublico: string | null | undefined): string | null {
  const code = codigoPublico?.trim();
  return code ? code : null;
}

export function getPublicProfilePath(codigoPublico: string | null | undefined): string | null {
  const code = normalizePublicCode(codigoPublico);
  return code ? `${PUBLIC_PROFILE_ROUTE}/${code}` : null;
}

export function resolvePublicProfileBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  return baseUrl ? baseUrl.replace(/\/+$/, "") : "";
}

export function getPublicProfileUrl(source: PublicProfileSource): string | null {
  const codigoPublico = typeof source === "string" ? source : source?.identificacion?.codigoPublico;
  const path = getPublicProfilePath(codigoPublico);
  return path ? `${resolvePublicProfileBaseUrl()}${path}` : null;
}
