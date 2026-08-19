import { describe, it, expect, vi, beforeEach } from "vitest";

// Mocks de infra. billing (@/lib/billing) é puro — usa-se a implementação REAL.
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/permissoes", () => ({
  obterMembroAtual: vi.fn(),
  exigirCapacidade: vi.fn(),
}));
vi.mock("@/lib/db", () => ({
  prisma: {
    seccao: { upsert: vi.fn(), findMany: vi.fn(), findFirst: vi.fn(), count: vi.fn() },
    licenca: { findFirst: vi.fn(), update: vi.fn() },
  },
}));

import { Modalidade } from "@prisma/client";
import { obterMembroAtual, exigirCapacidade } from "@/lib/permissoes";
import { prisma } from "@/lib/db";
import {
  adicionarSeccaoAoClube,
  garantirSeccaoParaModalidade,
  obterContextoSeccao,
} from "@/lib/actions/seccoes";

const mocked = <T,>(fn: T) =>
  fn as unknown as {
    mockResolvedValue: (v: unknown) => void;
    mockResolvedValueOnce: (v: unknown) => void;
    mock: { calls: unknown[][] };
  };
const calls = (fn: unknown) => (fn as { mock: { calls: unknown[][] } }).mock.calls;

const CLUBE = { id: "clube1", clubeTecnico: false };
const CTX = {
  utilizadorId: "u1",
  membroId: "m1",
  clube: CLUBE,
  ambito: "TODO_CLUBE",
  seccoesCoordenadas: [] as string[],
};

beforeEach(() => {
  vi.clearAllMocks();
  mocked(obterMembroAtual).mockResolvedValue(CTX);
  mocked(exigirCapacidade).mockResolvedValue({ ok: true, ctx: CTX });
  mocked(prisma.seccao.findMany).mockResolvedValue([]);
  mocked(prisma.seccao.upsert).mockResolvedValue({ id: "s-nova" });
  mocked(prisma.seccao.count).mockResolvedValue(1);
  mocked(prisma.licenca.findFirst).mockResolvedValue(null);
  mocked(prisma.licenca.update).mockResolvedValue({});
});

describe("garantirSeccaoParaModalidade — bloqueio Individual (§17.1)", () => {
  it("cria a secção quando não há conflito de modalidade", async () => {
    const r = await garantirSeccaoParaModalidade(Modalidade.FUTEBOL);
    expect(r.sucesso).toBe(true);
    expect(prisma.seccao.upsert).toHaveBeenCalledOnce();
  });

  it("bloqueia 2.ª modalidade numa licença INDIVIDUAL", async () => {
    mocked(prisma.seccao.findMany).mockResolvedValue([{ modalidade: "FUTSAL" }]);
    mocked(prisma.licenca.findFirst).mockResolvedValue({ tipo: "INDIVIDUAL" });

    const r = await garantirSeccaoParaModalidade(Modalidade.FUTEBOL);
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.erro).toMatch(/licença de Clube/i);
    expect(prisma.seccao.upsert).not.toHaveBeenCalled();
  });

  it("bloqueia 2.ª modalidade num clube técnico (clubeTecnico=true)", async () => {
    mocked(obterMembroAtual).mockResolvedValue({
      ...CTX,
      clube: { id: "clube1", clubeTecnico: true },
    });
    mocked(prisma.seccao.findMany).mockResolvedValue([{ modalidade: "FUTSAL" }]);
    mocked(prisma.licenca.findFirst).mockResolvedValue(null);

    const r = await garantirSeccaoParaModalidade(Modalidade.FUTEBOL);
    expect(r.sucesso).toBe(false);
    expect(prisma.seccao.upsert).not.toHaveBeenCalled();
  });

  it("é idempotente para a modalidade já existente (não bloqueia)", async () => {
    mocked(prisma.seccao.findMany).mockResolvedValue([{ modalidade: "FUTSAL" }]);
    mocked(prisma.licenca.findFirst).mockResolvedValue({ tipo: "INDIVIDUAL" });

    const r = await garantirSeccaoParaModalidade(Modalidade.FUTSAL);
    expect(r.sucesso).toBe(true);
    expect(prisma.seccao.upsert).toHaveBeenCalledOnce();
  });
});

describe("adicionarSeccaoAoClube (§17.1)", () => {
  it("exige CLUBE_ESCALOES", async () => {
    mocked(exigirCapacidade).mockResolvedValue({ ok: false, erro: "Sem permissão" });
    const r = await adicionarSeccaoAoClube(Modalidade.FUTEBOL);
    expect(r.sucesso).toBe(false);
    expect(calls(exigirCapacidade)[0][0]).toBe("CLUBE_ESCALOES");
    expect(prisma.seccao.upsert).not.toHaveBeenCalled();
  });

  it("adiciona secção e recalcula o preço da licença de Clube (2 secções)", async () => {
    mocked(prisma.seccao.findMany).mockResolvedValue([{ modalidade: "FUTSAL" }]);
    mocked(prisma.seccao.upsert).mockResolvedValue({ id: "s-futebol" });
    mocked(prisma.seccao.count).mockResolvedValue(2);
    mocked(prisma.licenca.findFirst).mockResolvedValue({
      id: "lic1",
      tipo: "CLUBE",
      tier: "PEQUENO",
      ciclo: "MENSAL",
    });

    const r = await adicionarSeccaoAoClube(Modalidade.FUTEBOL);
    expect(r.sucesso).toBe(true);
    if (r.sucesso) {
      expect(r.dados.seccaoId).toBe("s-futebol");
      expect(r.dados.numSeccoes).toBe(2);
      expect(r.dados.novoPreco).toBe(2250); // €22,50 = base €15 × 1.5
    }
    const updArg = calls(prisma.licenca.update)[0][0] as {
      data: { numSeccoes: number; precoCentimos: number };
    };
    expect(updArg.data).toMatchObject({ numSeccoes: 2, precoCentimos: 2250 });
  });

  it("não recalcula preço em licença PARCEIRO (negociado) mas atualiza numSeccoes", async () => {
    mocked(prisma.seccao.findMany).mockResolvedValue([{ modalidade: "FUTSAL" }]);
    mocked(prisma.seccao.upsert).mockResolvedValue({ id: "s-futebol" });
    mocked(prisma.seccao.count).mockResolvedValue(2);
    mocked(prisma.licenca.findFirst).mockResolvedValue({
      id: "lic1",
      tipo: "CLUBE",
      tier: "PARCEIRO",
      ciclo: "MENSAL",
    });

    const r = await adicionarSeccaoAoClube(Modalidade.FUTEBOL);
    expect(r.sucesso).toBe(true);
    if (r.sucesso) expect(r.dados.novoPreco).toBeNull();
    const updArg = calls(prisma.licenca.update)[0][0] as { data: Record<string, unknown> };
    expect(updArg.data.numSeccoes).toBe(2);
    expect(updArg.data.precoCentimos).toBeUndefined();
  });

  it("sem licença ativa: cria a secção e devolve preço null", async () => {
    mocked(prisma.seccao.findMany).mockResolvedValue([{ modalidade: "FUTSAL" }]);
    mocked(prisma.seccao.upsert).mockResolvedValue({ id: "s-futebol" });
    mocked(prisma.seccao.count).mockResolvedValue(2);
    mocked(prisma.licenca.findFirst).mockResolvedValue(null);

    const r = await adicionarSeccaoAoClube(Modalidade.FUTEBOL);
    expect(r.sucesso).toBe(true);
    if (r.sucesso) expect(r.dados.novoPreco).toBeNull();
    expect(prisma.licenca.update).not.toHaveBeenCalled();
  });
});

describe("obterContextoSeccao (§6.9)", () => {
  it("devolve a secção a um Coordenador da secção", async () => {
    mocked(obterMembroAtual).mockResolvedValue({
      ...CTX,
      ambito: "SECCAO",
      seccoesCoordenadas: ["s1"],
    });
    mocked(prisma.seccao.findFirst).mockResolvedValue({ id: "s1", modalidade: "FUTEBOL" });

    const r = await obterContextoSeccao("s1");
    expect(r.sucesso).toBe(true);
    if (r.sucesso) expect(r.dados.id).toBe("s1");
  });

  it("devolve a secção a um membro de âmbito TODO_CLUBE", async () => {
    mocked(prisma.seccao.findFirst).mockResolvedValue({ id: "s1", modalidade: "FUTSAL" });
    const r = await obterContextoSeccao("s1");
    expect(r.sucesso).toBe(true);
  });

  it("recusa quem não coordena a secção", async () => {
    mocked(obterMembroAtual).mockResolvedValue({
      ...CTX,
      ambito: "PROPRIOS_ESCALOES",
      seccoesCoordenadas: [],
    });
    mocked(prisma.seccao.findFirst).mockResolvedValue({ id: "s1", modalidade: "FUTSAL" });

    const r = await obterContextoSeccao("s1");
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.erro).toMatch(/permissão nesta secção/i);
  });

  it("erro quando a secção não pertence ao clube", async () => {
    mocked(prisma.seccao.findFirst).mockResolvedValue(null);
    const r = await obterContextoSeccao("sX");
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.erro).toMatch(/não encontrada/i);
  });
});
