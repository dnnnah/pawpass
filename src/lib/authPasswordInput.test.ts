import { describe, expect, it, vi } from "vitest";
import { replacePasswordOnPaste, type PasswordPasteEvent } from "@/lib/authPasswordInput";

describe("replacePasswordOnPaste", () => {
  it("reemplaza un valor previo por el texto pegado", () => {
    const setValue = vi.fn();
    const event = {
      clipboardData: { getData: () => "NuevaClave#2026" },
      preventDefault: vi.fn(),
    } as unknown as PasswordPasteEvent;

    replacePasswordOnPaste(event, setValue);

    expect(event.preventDefault).toHaveBeenCalledOnce();
    expect(setValue).toHaveBeenCalledWith("NuevaClave#2026");
  });

  it("no altera el campo si el portapapeles está vacío", () => {
    const setValue = vi.fn();
    const event = {
      clipboardData: { getData: () => "" },
      preventDefault: vi.fn(),
    } as unknown as PasswordPasteEvent;

    replacePasswordOnPaste(event, setValue);

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(setValue).not.toHaveBeenCalled();
  });

  it("no altera el campo cuando el navegador no expone el portapapeles", () => {
    const setValue = vi.fn();
    const event = {
      clipboardData: null,
      preventDefault: vi.fn(),
    } as unknown as PasswordPasteEvent;

    replacePasswordOnPaste(event, setValue);

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(setValue).not.toHaveBeenCalled();
  });
});
