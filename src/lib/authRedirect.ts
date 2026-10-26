/** Only internal app paths are valid after an authentication callback. */
export function safeAuthNextPath(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u001f\u007f]/.test(value)) return "/cuenta";
  try {
    return new URL(value, "https://pawpass.invalid").origin === "https://pawpass.invalid" ? value : "/cuenta";
  } catch { return "/cuenta"; }
}
