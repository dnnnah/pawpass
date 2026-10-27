export const PUBLIC_PROFILE_ROUTE = "/p";
export const CANONICAL_PUBLIC_PROFILE_BASE_URL = "https://pet-carnet.vercel.app";

export type PublicProfileSource =
  | string
  | { identificacion: { codigoPublico: string } };

function normalizePublicCode(codigoPublico: string | null | undefined): string | null {
  return normalizePublicProfileCode(codigoPublico);
}

const PUBLIC_CODE_PATTERN = /^PC-[A-Z0-9]{2,32}-\d{3,}$/;

export function normalizePublicProfileCode(value: string | null | undefined): string | null {
  const code = value?.trim().toUpperCase();
  return code && PUBLIC_CODE_PATTERN.test(code) ? code : null;
}

/** Resolve a manually entered code or a PawPass QR URL without opening arbitrary destinations. */
export function resolvePublicProfileCode(value: string, currentOrigin?: string): string | null {
  const input = value.trim();
  const directCode = normalizePublicProfileCode(input);
  if (directCode) return directCode;

  let url: URL;
  try {
    const base = currentOrigin ?? CANONICAL_PUBLIC_PROFILE_BASE_URL;
    url = new URL(input, base);
    if (url.search || url.hash || url.username || url.password) return null;
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    const isCanonical = url.origin === CANONICAL_PUBLIC_PROFILE_BASE_URL;
    const isCurrent = currentOrigin !== undefined && url.origin === new URL(currentOrigin).origin;
    if (!isCanonical && !isCurrent) return null;
  } catch {
    return null;
  }

  const match = url.pathname.match(/^\/p\/([^/]+)\/?$/);
  if (!match) return null;
  try {
    return normalizePublicProfileCode(decodeURIComponent(match[1]));
  } catch {
    return null;
  }
}

export function getPublicProfilePath(codigoPublico: string | null | undefined): string | null {
  const code = normalizePublicCode(codigoPublico);
  return code ? `${PUBLIC_PROFILE_ROUTE}/${encodeURIComponent(code)}` : null;
}

export function getVoluntaryProfilePath(
  publicCode: string,
  petStatus: string,
  availablePublicCode: string | null | undefined,
): string | null {
  const code = normalizePublicProfileCode(publicCode);
  const availableCode = normalizePublicProfileCode(availablePublicCode);
  if (!code || code !== availableCode || (petStatus !== "en_casa" && petStatus !== "en_adopcion")) return null;
  return `/perfil/${encodeURIComponent(code)}`;
}

export function resolvePublicProfileBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!baseUrl) return CANONICAL_PUBLIC_PROFILE_BASE_URL;
  try {
    const parsed = new URL(baseUrl);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return CANONICAL_PUBLIC_PROFILE_BASE_URL;
    if (parsed.username || parsed.password) return CANONICAL_PUBLIC_PROFILE_BASE_URL;
    const localHost = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1" || parsed.hostname === "::1";
    if (process.env.NODE_ENV === "production") {
      if (localHost || parsed.origin !== CANONICAL_PUBLIC_PROFILE_BASE_URL) return CANONICAL_PUBLIC_PROFILE_BASE_URL;
    }
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
