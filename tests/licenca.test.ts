import { describe, it, expect } from "vitest";
import { licencaValida, type LicencaAvaliavel } from "@/lib/licenca";
import { deveBloquearPorLicenca } from "@/lib/guarda-licenca";

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
    for (const estado of ["EXPIRADA", "CANCELADA", "SUSPENSA", "PENDENTE"] as const) {
      expect(licencaValida(lic({ estado, dataFim: null }), AGORA)).toBe(false);
    }
  });

  it("PENDENTE (plano escolhido, por pagar) → inválida (§8.1 / §17.1)", () => {
    expect(licencaValida(lic({ estado: "PENDENTE", dataFim: null }), AGORA)).toBe(false);
  });

  it("dataFim exatamente == agora → ainda válida (só inválida quando passa)", () => {
    expect(licencaValida(lic({ estado: "ATIVA", dataFim: new Date(AGORA) }), AGORA)).toBe(
      true,
    );
  });
});

// §3.11 / §8.1 — decisão da guarda dependente da rota. O onboarding fica sempre
// acessível (mesmo sem licença) para o utilizador concluir o setup antes do paywall.
describe("deveBloquearPorLicenca (§3.11 / §8.1)", () => {
  it("licença válida → nunca bloqueia (independente da rota)", () => {
    expect(deveBloquearPorLicenca(true, "/dashboard")).toBe(false);
    expect(deveBloquearPorLicenca(true, "/onboarding")).toBe(false);
    expect(deveBloquearPorLicenca(true, null)).toBe(false);
  });

  it("sem licença + rota protegida → bloqueia", () => {
    expect(deveBloquearPorLicenca(false, "/dashboard")).toBe(true);
    expect(deveBloquearPorLicenca(false, "/plantel")).toBe(true);
    expect(deveBloquearPorLicenca(false, "/")).toBe(true);
  });

  it("sem licença + /onboarding (exato) → não bloqueia", () => {
    expect(deveBloquearPorLicenca(false, "/onboarding")).toBe(false);
  });

  it("sem licença + sub-rota de /onboarding → não bloqueia", () => {
    expect(deveBloquearPorLicenca(false, "/onboarding/escaloes")).toBe(false);
  });

  it("sem licença + rota que só começa por 'onboarding' (falso positivo) → bloqueia", () => {
    expect(deveBloquearPorLicenca(false, "/onboarding-extra")).toBe(true);
  });

  it("sem licença + pathname null/undefined (SSR) → bloqueia (fail-safe)", () => {
    expect(deveBloquearPorLicenca(false, null)).toBe(true);
    expect(deveBloquearPorLicenca(false, undefined)).toBe(true);
  });
});
