export function subscribeToLostDirectoryHistoryNavigation(
  target: Pick<EventTarget, "addEventListener" | "removeEventListener">,
  getPathname: () => string,
  refresh: () => void,
): () => void {
  const handlePopState = () => {
    const pathname = getPathname();
    if (pathname === "/perdidas" || pathname.startsWith("/perdidas/")) refresh();
  };
  target.addEventListener("popstate", handlePopState);
  return () => target.removeEventListener("popstate", handlePopState);
}
