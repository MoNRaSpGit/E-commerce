import { describe, it, expect } from "vitest";
import { formatUYU } from "./formatUYU";

describe("formatUYU", () => {
  it("formatea números a moneda (UYU)", () => {
    const result = formatUYU(1500);
    // en es-UY suele ser "$ 1.500,00"
    expect(result).toContain("1.500");
    expect(result).toContain(",00");
  });

  it("maneja valores inválidos devolviendo 0", () => {
    const result = formatUYU(null);
    expect(result).toContain("0");
  });
});
