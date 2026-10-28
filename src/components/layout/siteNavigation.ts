function isRoute(pathname: string, route: string): boolean {
  return pathname === route || pathname.startsWith(`${route}/`);
}

/** Resolves one menu destination from route segments, independent of label text. */
export function getActiveSiteNavigationHref(pathname: string, authenticated: boolean): string | null {
  if (pathname === "/") return "/";
  if (isRoute(pathname, "/perdidas")) return "/perdidas";
  if (isRoute(pathname, "/mis-mascotas")) return authenticated ? "/mis-mascotas" : null;
  if (isRoute(pathname, "/cuenta/mascotas")) return authenticated ? "/mis-mascotas" : null;
  if (isRoute(pathname, "/mascotas") || isRoute(pathname, "/perfil")) return "/mascotas";
  if (isRoute(pathname, "/adopciones") || isRoute(pathname, "/refugios")) return "/adopciones";
  if (isRoute(pathname, "/cuenta")) return authenticated ? "/cuenta" : null;
  if (pathname === "/login") return authenticated ? null : "/login";
  return null;
}
