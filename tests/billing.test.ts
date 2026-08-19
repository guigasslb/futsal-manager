import { describe, it, expect } from "vitest";
import {
  calcularPrecoLicenca,
  PRECO_BASE_CENTIMOS,
  ACRESCIMO_POR_SECCAO_ADICIONAL,
} from "@/lib/billing";

// §17.1 — pricing multi-secção (módulo puro, sem infra).

describe("calcularPrecoLicenca (§17.1)", () => {
  it("1 secção → preço base do tier (mensal)", () => {
    expect(calcularPrecoLicenca("PEQUENO", 1, "MENSAL")).toBe(1500);
    expect(calcularPrecoLicenca("MEDIO", 1, "MENSAL")).toBe(1900);
    expect(calcularPrecoLicenca("GRANDE", 1, "MENSAL")).toBe(3400);
  });

  it("1 secção → preço base do tier (anual)", () => {
    expect(calcularPrecoLicenca("PEQUENO", 1, "ANUAL")).toBe(14900);
    expect(calcularPrecoLicenca("MEDIO", 1, "ANUAL")).toBe(19000);
    expect(calcularPrecoLicenca("GRANDE", 1, "ANUAL")).toBe(34000);
  });

  it("2 secções → base × 1.5 (exemplo da bíblia: €15 → €22,50)", () => {
    expect(calcularPrecoLicenca("PEQUENO", 2, "MENSAL")).toBe(2250);
    expect(calcularPrecoLicenca("MEDIO", 2, "MENSAL")).toBe(2850);
    expect(calcularPrecoLicenca("GRANDE", 2, "MENSAL")).toBe(5100);
  });

  it("ciclo por defeito é MENSAL", () => {
    expect(calcularPrecoLicenca("PEQUENO", 1)).toBe(PRECO_BASE_CENTIMOS.PEQUENO.MENSAL);
    expect(calcularPrecoLicenca("PEQUENO", 2)).toBe(2250);
  });

  it("aplica +50% por cada secção adicional (fórmula geral)", () => {
    // base × (1 + 0.5 × (n-1)) — 3 secções = base × 2.0
    expect(ACRESCIMO_POR_SECCAO_ADICIONAL).toBe(0.5);
    expect(calcularPrecoLicenca("PEQUENO", 3, "MENSAL")).toBe(3000);
  });

  it("PARCEIRO devolve 0 (pricing negociado)", () => {
    expect(calcularPrecoLicenca("PARCEIRO", 1, "MENSAL")).toBe(0);
    expect(calcularPrecoLicenca("PARCEIRO", 2, "ANUAL")).toBe(0);
  });

  it("normaliza numSeccoes < 1 para 1 (defensivo)", () => {
    expect(calcularPrecoLicenca("PEQUENO", 0, "MENSAL")).toBe(1500);
    expect(calcularPrecoLicenca("PEQUENO", -3, "MENSAL")).toBe(1500);
  });
});
