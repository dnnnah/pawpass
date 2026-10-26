export type PasswordPasteEvent = Pick<ClipboardEvent, "clipboardData" | "preventDefault">;

/** Replaces a password field's full value when text is pasted into it. */
export function replacePasswordOnPaste(
  event: PasswordPasteEvent,
  setValue: (value: string) => void,
): void {
  const pastedValue = event.clipboardData?.getData("text") ?? "";
  if (!pastedValue) return;

  event.preventDefault();
  setValue(pastedValue);
}
