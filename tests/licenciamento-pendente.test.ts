import { describe, it, expect, vi, beforeEach } from "vitest";

// §8.1 / §17.1 — plano PENDENTE escolhido no onboarding, com preço on-read.

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: vi.fn(), signIn: vi.fn(), signOut: vi.fn(), handlers: {} }));
vi.mock("@/lib/permissoes", () => ({ obterMembroAtual: vi.fn() }));

vi.mock("@/lib/db", () => ({
  prisma: {
    licenca: { findUnique: vi.fn() },
  },
}));

import { obterLicencaPendente } from "@/lib/actions/licenciamento";
import { prisma } from "@/lib/db";
import { PRECO_INDIVIDUAL_CENTIMOS, calcularPrecoLicenca } from "@/lib/billing";

const mocked = <T,>(fn: T) =>
  fn as unknown as { mockResolvedValue: (v: unknown) => void };

beforeEach(() => vi.clearAllMocks());

describe("obterLicencaPendente (§8.1 / §17.1)", () => {
  it("sem licença → null", async () => {
    mocked(prisma.licenca.findUnique).mockResolvedValue(null);
    expect(await obterLicencaPendente("clube1")).toBeNull();
  });

  it("licença ATIVA (não PENDENTE) → null", async () => {
    mocked(prisma.licenca.findUnique).mockResolvedValue({
      estado: "ATIVA",
      tipo: "CLUBE",
      tier: "PEQUENO",
      numSeccoes: 1,
    });
    expect(await obterLicencaPendente("clube1")).toBeNull();
  });

  it("PENDENTE Individual → preço fixo (€4,99/mês, €49/ano)", async () => {
    mocked(prisma.licenca.findUnique).mockResolvedValue({
      estado: "PENDENTE",
      tipo: "INDIVIDUAL",
      tier: null,
      numSeccoes: 1,
    });
    const r = await obterLicencaPendente("clube1");
    expect(r).toEqual({
      tier: "INDIVIDUAL",
      precoCentimos: PRECO_INDIVIDUAL_CENTIMOS.MENSAL,
      precoAnualCentimos: PRECO_INDIVIDUAL_CENTIMOS.ANUAL,
    });
    expect(r?.precoCentimos).toBe(499);
    expect(r?.precoAnualCentimos).toBe(4900);
  });

  it("PENDENTE Clube → preço do tier via calcularPrecoLicenca", async () => {
    mocked(prisma.licenca.findUnique).mockResolvedValue({
      estado: "PENDENTE",
      tipo: "CLUBE",
      tier: "MEDIO",
      numSeccoes: 1,
    });
    const r = await obterLicencaPendente("clube1");
    expect(r).toEqual({
      tier: "MEDIO",
      precoCentimos: calcularPrecoLicenca("MEDIO", 1, "MENSAL"),
      precoAnualCentimos: calcularPrecoLicenca("MEDIO", 1, "ANUAL"),
    });
    expect(r?.precoCentimos).toBe(1900);
    expect(r?.precoAnualCentimos).toBe(19000);
  });

  it("PENDENTE Clube com 2 secções → acréscimo multi-secção aplicado", async () => {
    mocked(prisma.licenca.findUnique).mockResolvedValue({
      estado: "PENDENTE",
      tipo: "CLUBE",
      tier: "PEQUENO",
      numSeccoes: 2,
    });
    const r = await obterLicencaPendente("clube1");
    // base €15,00 × 1.5 = €22,50
    expect(r?.precoCentimos).toBe(2250);
  });
});
