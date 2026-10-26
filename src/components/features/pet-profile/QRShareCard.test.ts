import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { QRShareCard } from "./QRShareCard";

vi.mock("qrcode.react", () => ({ QRCodeSVG: ({ value }: { value: string }) => createElement("svg", { "data-value": value }) }));

describe("vista de visitante del QR", () => {
  it("ofrece abrir la misma URL absoluta que se codifica para el QR", () => {
    const url = "https://pet-carnet.vercel.app/p/PC-LUCCA-001";
    const html = renderToStaticMarkup(createElement(QRShareCard, { petName: "Lucca", petCode: "PC-LUCCA-001", profileUrl: url }));
    expect(html).toContain(`href="${url}"`);
    expect(html).toContain(`data-value="${url}"`);
    expect(html).toContain("Abrir ficha QR como visitante");
  });
});
