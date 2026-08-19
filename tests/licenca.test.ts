import { describe, it, expect } from "vitest";
import { licencaValida, type LicencaAvaliavel } from "@/lib/licenca";

// §3.11 — validade de licença (guarda de acesso à plataforma). Função pura.

const AGORA = new Date("2026-08-19T12:00:00Z");

function lic(over: Partial<LicencaAvaliavel>): LicencaAvaliavel {
  return { estado: "ATIVA", dataFim: null, ...over };
}

describe("licencaValida (§3.11)", () => {
  it("null/undefined (sem licença) → inválida", () => {
    expect(licencaValida(null, AGORA)).toBe(false);
    expect(licencaValida(undefined, AGORA)).toBe(false);
  });

  it("ATIVA sem dataFim → válida", () => {
    expect(licencaValida(lic({ estado: "ATIVA", dataFim: null }), AGORA)).toBe(true);
  });

  it("ATIVA com dataFim no futuro (trial válido) → válida", () => {
    const futuro = new Date(AGORA.getTime() + 86_400_000); // +1 dia
    expect(licencaValida(lic({ estado: "ATIVA", dataFim: futuro }), AGORA)).toBe(true);
  });

  it("ATIVA mas com dataFim já passada (trial expirado) → inválida", () => {
    const passado = new Date(AGORA.getTime() - 86_400_000); // -1 dia
    expect(licencaValida(lic({ estado: "ATIVA", dataFim: passado }), AGORA)).toBe(false);
  });

  it("estados não-ATIVA → inválida (mesmo sem dataFim)", () => {
    for (const estado of ["EXPIRADA", "CANCELADA", "SUSPENSA"] as const) {
      expect(licencaValida(lic({ estado, dataFim: null }), AGORA)).toBe(false);
    }
  });

  it("dataFim exatamente == agora → ainda válida (só inválida quando passa)", () => {
    expect(licencaValida(lic({ estado: "ATIVA", dataFim: new Date(AGORA) }), AGORA)).toBe(
      true,
    );
  });
});
