export type AuthEmailCallbackInput = {
  pathname: string;
  query: Record<string, string>;
  isProduction: boolean;
  browserOrigin: string;
  productionOrigin: string;
};

export function buildAuthEmailCallbackUrl(input: AuthEmailCallbackInput): string {
  if (!input.pathname.startsWith("/") || input.pathname.startsWith("//")) {
    throw new Error("La ruta de retorno debe ser interna.");
  }
  const configuredOrigin = input.isProduction ? input.productionOrigin : input.browserOrigin;
  const origin = new URL(configuredOrigin);
  if (!/^https?:$/.test(origin.protocol) || origin.username || origin.password) {
    throw new Error("El origen de retorno no es válido.");
  }
  const callback = new URL(input.pathname, origin.origin);
  for (const [key, value] of Object.entries(input.query)) callback.searchParams.set(key, value);
  return callback.toString();
}
