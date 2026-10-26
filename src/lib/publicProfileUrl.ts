export const PUBLIC_PROFILE_ROUTE = "/p";
export const CANONICAL_PUBLIC_PROFILE_BASE_URL = "https://pet-carnet.vercel.app";

export type PublicProfileSource =
  | string
  | { identificacion: { codigoPublico: string } };

function normalizePublicCode(codigoPublico: string | null | undefined): string | null {
  const code = codigoPublico?.trim();
  return code ? code : null;
}

export function getPublicProfilePath(codigoPublico: string | null | undefined): string | null {
  const code = normalizePublicCode(codigoPublico);
  return code ? `${PUBLIC_PROFILE_ROUTE}/${encodeURIComponent(code)}` : null;
}

export function resolvePublicProfileBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!baseUrl) return CANONICAL_PUBLIC_PROFILE_BASE_URL;
  try {
    const parsed = new URL(baseUrl);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return CANONICAL_PUBLIC_PROFILE_BASE_URL;
    if (parsed.username || parsed.password) return CANONICAL_PUBLIC_PROFILE_BASE_URL;
    const localHost = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1" || parsed.hostname === "::1";
    if (process.env.NODE_ENV === "production" && localHost) return CANONICAL_PUBLIC_PROFILE_BASE_URL;
    return parsed.origin;
  } catch {
    return CANONICAL_PUBLIC_PROFILE_BASE_URL;
  }
}

export function getPublicProfileUrl(source: PublicProfileSource): string | null {
  const codigoPublico = typeof source === "string" ? source : source?.identificacion?.codigoPublico;
  const path = getPublicProfilePath(codigoPublico);
  return path ? `${resolvePublicProfileBaseUrl()}${path}` : null;
}
