import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ───────────────────────────────────────────────────────────────────
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/epoca-context", () => ({
  obterClubeIdAtual: vi.fn(),
  COOKIE_EPOCA: "epoca_ativa",
}));
vi.mock("@/lib/permissoes", () => ({
  exigirCapacidade: vi.fn(),
}));
vi.mock("@/lib/db", () => ({
  prisma: {
    metricaConfig: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import {
  listarMetricas,
  criarMetrica,
  alternarMetrica,
  moverMetrica,
} from "@/lib/actions/metricas";
import { obterClubeIdAtual } from "@/lib/epoca-context";
import { exigirCapacidade } from "@/lib/permissoes";
import { prisma } from "@/lib/db";

const mocked = <T,>(fn: T) => fn as unknown as {
  mockResolvedValue: (v: unknown) => void;
  mockImplementation: (f: (...a: unknown[]) => unknown) => void;
};

const calls = (fn: unknown) => (fn as { mock: { calls: unknown[][] } }).mock.calls;

const PERM_OK = { ok: true, ctx: { clube: { id: "clube1" } } };

const M1 = { id: "m1", nome: "Avaliação Física", tipo: "NUMERO", ordem: 0, ativa: true, clubeId: "clube1" };
const M2 = { id: "m2", nome: "Desempenho", tipo: "ESCALA", ordem: 1, ativa: true, clubeId: "clube1" };

beforeEach(() => {
  vi.clearAllMocks();
  mocked(obterClubeIdAtual).mockResolvedValue("clube1");
  mocked(exigirCapacidade).mockResolvedValue(PERM_OK);
  mocked(prisma.metricaConfig.findMany).mockResolvedValue([M1, M2]);
  mocked(prisma.metricaConfig.findFirst).mockResolvedValue(M1);
  mocked(prisma.metricaConfig.create).mockResolvedValue(M1);
  mocked(prisma.metricaConfig.update).mockResolvedValue(M1);
  mocked(prisma.$transaction).mockImplementation((arg: unknown) =>
    typeof arg === "function"
      ? (arg as (tx: unknown) => unknown)(prisma)
      : Promise.all(arg as unknown[]),
  );
});

// ─── listarMetricas ───────────────────────────────────────────────────────────

describe("listarMetricas", () => {
  it("falha sem clube ativo", async () => {
    mocked(obterClubeIdAtual).mockResolvedValue(null);
    const r = await listarMetricas();
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.erro).toMatch(/não autenticado/i);
    expect(prisma.metricaConfig.findMany).not.toHaveBeenCalled();
  });

  it("filtra pelo clubeId (isolamento multi-tenant)", async () => {
    const r = await listarMetricas();
    expect(r.sucesso).toBe(true);
    const arg = calls(prisma.metricaConfig.findMany)[0][0] as { where: { clubeId: string } };
    expect(arg.where.clubeId).toBe("clube1");
  });

  it("filtra apenas ativas quando apenasAtivas=true", async () => {
    await listarMetricas(true);
    const arg = calls(prisma.metricaConfig.findMany)[0][0] as { where: Record<string, unknown> };
    expect(arg.where.ativa).toBe(true);
  });
});

// ─── criarMetrica ─────────────────────────────────────────────────────────────

describe("criarMetrica", () => {
  it("falha sem a capacidade CATALOGO_METRICAS", async () => {
    mocked(exigirCapacidade).mockResolvedValue({ ok: false, erro: "Sem permissão" });
    const r = await criarMetrica({ nome: "Avaliação", tipo: "NUMERO" });
    expect(r.sucesso).toBe(false);
    expect(prisma.metricaConfig.create).not.toHaveBeenCalled();
  });

  it("rejeita nome vazio", async () => {
    const r = await criarMetrica({ nome: "", tipo: "NUMERO" });
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.camposInvalidos?.nome).toBeTruthy();
    expect(prisma.metricaConfig.create).not.toHaveBeenCalled();
  });

  it("rejeita tipo de métrica inválido", async () => {
    const r = await criarMetrica({ nome: "Avaliação", tipo: "INVALIDO" });
    expect(r.sucesso).toBe(false);
    expect(prisma.metricaConfig.create).not.toHaveBeenCalled();
  });

  it("cria métrica com clubeId e ordem corretos", async () => {
    mocked(prisma.metricaConfig.findFirst).mockResolvedValue({ ordem: 2 });
    const r = await criarMetrica({ nome: "Nova", tipo: "BOOLEANO" });
    expect(r.sucesso).toBe(true);
    const arg = calls(prisma.metricaConfig.create)[0][0] as { data: Record<string, unknown> };
    expect(arg.data.clubeId).toBe("clube1");
    expect(arg.data.ordem).toBe(3);
    expect(arg.data.nome).toBe("Nova");
  });

  it("atribui ordem 0 quando não há métricas ainda", async () => {
    mocked(prisma.metricaConfig.findFirst).mockResolvedValue(null);
    await criarMetrica({ nome: "Primeira", tipo: "NUMERO" });
    const arg = calls(prisma.metricaConfig.create)[0][0] as { data: { ordem: number } };
    expect(arg.data.ordem).toBe(0);
  });
});

// ─── alternarMetrica ──────────────────────────────────────────────────────────

describe("alternarMetrica", () => {
  it("falha sem permissão", async () => {
    mocked(exigirCapacidade).mockResolvedValue({ ok: false, erro: "Sem permissão" });
    const r = await alternarMetrica("m1", false);
    expect(r.sucesso).toBe(false);
    expect(prisma.metricaConfig.update).not.toHaveBeenCalled();
  });

  it("falha se a métrica não pertence ao clube", async () => {
    mocked(prisma.metricaConfig.findFirst).mockResolvedValue(null);
    const r = await alternarMetrica("m1", false);
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.erro).toMatch(/não encontrada/i);
    expect(prisma.metricaConfig.update).not.toHaveBeenCalled();
  });

  it("atualiza o campo ativa corretamente", async () => {
    const r = await alternarMetrica("m1", false);
    expect(r.sucesso).toBe(true);
    const arg = calls(prisma.metricaConfig.update)[0][0] as {
      where: { id: string };
      data: { ativa: boolean };
    };
    expect(arg.where.id).toBe("m1");
    expect(arg.data.ativa).toBe(false);
  });
});

// ─── moverMetrica ─────────────────────────────────────────────────────────────

describe("moverMetrica", () => {
  it("falha sem permissão", async () => {
    mocked(exigirCapacidade).mockResolvedValue({ ok: false, erro: "Sem permissão" });
    const r = await moverMetrica("m1", "subir");
    expect(r.sucesso).toBe(false);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("devolve sucesso sem transação se já estiver no limite", async () => {
    mocked(prisma.metricaConfig.findMany).mockResolvedValue([M1]); // só uma
    const r = await moverMetrica("m1", "subir");
    expect(r.sucesso).toBe(true);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("troca ordens numa transação ao mover uma métrica", async () => {
    mocked(prisma.metricaConfig.findMany).mockResolvedValue([M1, M2]);
    const r = await moverMetrica("m2", "subir");
    expect(r.sucesso).toBe(true);
    expect(prisma.$transaction).toHaveBeenCalledOnce();
    expect(prisma.metricaConfig.update).toHaveBeenCalledTimes(2);
  });
});
