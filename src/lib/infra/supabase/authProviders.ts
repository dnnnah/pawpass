import { getSupabaseEnv } from "./env";

export type OAuthProvider = "google" | "apple";
export type EnabledOAuthProviders = Record<OAuthProvider, boolean>;

/** Auth exposes provider availability publicly; no admin credentials are needed. */
export async function getEnabledOAuthProviders(): Promise<EnabledOAuthProviders> {
  const { url, anonKey } = getSupabaseEnv();
  const response = await fetch(`${url.replace(/\/$/, "")}/auth/v1/settings`, {
    headers: { apikey: anonKey },
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) throw new Error("No pudimos comprobar los métodos de acceso disponibles.");

  const settings: { external?: { google?: unknown; apple?: unknown } } = await response.json();
  return {
    google: settings?.external?.google === true,
    apple: settings?.external?.apple === true,
  };
}
