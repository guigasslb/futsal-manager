import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ───────────────────────────────────────────────────────────────────
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/epoca-context", () => ({
  obterClubeIdAtual: vi.fn(),
  obterEpocaAtiva: vi.fn(),
  COOKIE_EPOCA: "epoca_ativa",
}));
vi.mock("@/lib/permissoes", () => ({
  exigirCapacidade: vi.fn(),
  podeLerEscalao: vi.fn(),
  escaloesLegiveis: vi.fn(),
}));
vi.mock("@/lib/db", () => ({
  prisma: {
    planeamento: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), updateMany: vi.fn() },
    escalao: { findFirst: vi.fn() },
    sessao: { updateMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import {
  criarPlaneamento,
  sugerirPlaneamento,
  apagarPlaneamento,
} from "@/lib/actions/periodizacao";
import { obterClubeIdAtual, obterEpocaAtiva } from "@/lib/epoca-context";
import { exigirCapacidade } from "@/lib/permissoes";
import { prisma } from "@/lib/db";

const ESC_ID = "ckv9v0z1w0000abcd1234efga";
const PLAN_ID = "ckv9v0z1w0000abcd1234efgb";

const mocked = <T,>(fn: T) => fn as unknown as {
  mockResolvedValue: (v: unknown) => void;
  mockImplementation: (f: (...a: unknown[]) => unknown) => void;
};

const calls = (fn: unknown) => (fn as { mock: { calls: unknown[][] } }).mock.calls;

const PERM_OK = { ok: true, ctx: { clube: { id: "clube1" } } };

const EPOCA_BD = {
  id: "ep1",
  nome: "2026/27",
  dataInicio: new Date("2026-09-01"),
  dataFim: new Date("2027-06-30"),
};

const PLANEAMENTO_VALIDO = {
  escalaoId: ESC_ID,
  tipo: "SEMANAL" as const,
  dataInicio: "2026-09-08",
  dataFim: "2026-09-14",
  microciclo: 1,
  mesociclo: 1,
  periodo: "PREPARATORIO" as const,
};

beforeEach(() => {
  vi.clearAllMocks();
  mocked(obterClubeIdAtual).mockResolvedValue("clube1");
  mocked(obterEpocaAtiva).mockResolvedValue(EPOCA_BD);
  mocked(exigirCapacidade).mockResolvedValue(PERM_OK);
  mocked(prisma.escalao.findFirst).mockResolvedValue({ id: ESC_ID, clubeId: "clube1" });
  mocked(prisma.planeamento.findFirst).mockResolvedValue(null);
  mocked(prisma.planeamento.create).mockResolvedValue({ id: PLAN_ID });
  mocked(prisma.planeamento.delete).mockResolvedValue({ id: PLAN_ID });
  mocked(prisma.sessao.updateMany).mockResolvedValue({ count: 0 });
  mocked(prisma.$transaction).mockImplementation((arg: unknown) =>
    typeof arg === "function"
      ? (arg as (tx: unknown) => unknown)(prisma)
      : Promise.all(arg as unknown[]),
  );
});

// ─── criarPlaneamento ─────────────────────────────────────────────────────────

describe("criarPlaneamento", () => {
  it("rejeita escalaoId inválido (não cuid)", async () => {
    const r = await criarPlaneamento({ ...PLANEAMENTO_VALIDO, escalaoId: "nao-e-cuid" });
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.camposInvalidos?.escalaoId).toBeTruthy();
    expect(prisma.planeamento.create).not.toHaveBeenCalled();
  });

  it("rejeita dataFim anterior à dataInicio", async () => {
    const r = await criarPlaneamento({
      ...PLANEAMENTO_VALIDO,
      dataInicio: "2026-09-14",
      dataFim: "2026-09-07",
    });
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.camposInvalidos?.dataFim).toBeTruthy();
    expect(prisma.planeamento.create).not.toHaveBeenCalled();
  });

  it("falha sem permissão no escalão", async () => {
    mocked(exigirCapacidade).mockResolvedValue({ ok: false, erro: "Sem permissão" });
    const r = await criarPlaneamento(PLANEAMENTO_VALIDO);
    expect(r.sucesso).toBe(false);
    expect(prisma.planeamento.create).not.toHaveBeenCalled();
  });

  it("falha se o escalão não pertence ao clube", async () => {
    mocked(prisma.escalao.findFirst).mockResolvedValue(null);
    const r = await criarPlaneamento(PLANEAMENTO_VALIDO);
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.erro).toMatch(/escalão/i);
    expect(prisma.planeamento.create).not.toHaveBeenCalled();
  });

  it("cria o planeamento com épocaId e clubeId corretos", async () => {
    const r = await criarPlaneamento(PLANEAMENTO_VALIDO);
    expect(r.sucesso).toBe(true);
    const arg = calls(prisma.planeamento.create)[0][0] as { data: Record<string, unknown> };
    expect(arg.data.epocaId).toBe("ep1");
    expect(arg.data.clubeId).toBe("clube1");
    expect(arg.data.escalaoId).toBe(ESC_ID);
    expect(arg.data.tipo).toBe("SEMANAL");
  });
});

// ─── sugerirPlaneamento ───────────────────────────────────────────────────────

describe("sugerirPlaneamento", () => {
  it("falha sem clube ativo", async () => {
    mocked(obterClubeIdAtual).mockResolvedValue(null);
    const r = await sugerirPlaneamento(ESC_ID);
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.erro).toMatch(/não autenticado/i);
  });

  it("falha sem época ativa", async () => {
    mocked(obterEpocaAtiva).mockResolvedValue(null);
    const r = await sugerirPlaneamento(ESC_ID);
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.erro).toMatch(/época/i);
  });

  it("sugere microciclo=1 e mesociclo=1 quando não há planeamentos anteriores", async () => {
    mocked(prisma.planeamento.findFirst).mockResolvedValue(null);
    const r = await sugerirPlaneamento(ESC_ID);
    expect(r.sucesso).toBe(true);
    if (r.sucesso) {
      expect(r.dados.microciclo).toBe(1);
      expect(r.dados.mesociclo).toBe(1);
      expect(r.dados.tipo).toBe("SEMANAL");
      // Datas no formato YYYY-MM-DD
      expect(r.dados.dataInicio).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(r.dados.dataFim).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("incrementa microciclo a partir do último planeamento", async () => {
    mocked(prisma.planeamento.findFirst).mockResolvedValue({
      dataFim: new Date("2026-10-05"),
      microciclo: 3,
      mesociclo: 2,
      periodo: "COMPETITIVO",
    });
    const r = await sugerirPlaneamento(ESC_ID);
    expect(r.sucesso).toBe(true);
    if (r.sucesso) {
      expect(r.dados.microciclo).toBe(4);
      expect(r.dados.mesociclo).toBe(2);
      expect(r.dados.dataInicio).toBe("2026-10-06");
      expect(r.dados.dataFim).toBe("2026-10-12"); // +6 dias (SEMANAL = duracao 6)
    }
  });

  it("infere período PREPARATORIO no início da época", async () => {
    mocked(prisma.planeamento.findFirst).mockResolvedValue({
      dataFim: new Date("2026-09-07"), // 6 dias de época → < 20%
      microciclo: 1,
      mesociclo: 1,
      periodo: null,
    });
    const r = await sugerirPlaneamento(ESC_ID);
    expect(r.sucesso).toBe(true);
    if (r.sucesso) expect(r.dados.periodo).toBe("PREPARATORIO");
  });

  it("infere período TRANSICAO no final da época (> 90%)", async () => {
    // dataInicio epoch: 2026-09-01, fim: 2027-06-30 (≈303 dias)
    // 90% from start ≈ 2027-06-24 → qualquer data depois disso → TRANSICAO
    mocked(prisma.planeamento.findFirst).mockResolvedValue({
      dataFim: new Date("2027-06-20"), // muito perto do fim da época
      microciclo: 40,
      mesociclo: 10,
      periodo: null,
    });
    const r = await sugerirPlaneamento(ESC_ID);
    expect(r.sucesso).toBe(true);
    if (r.sucesso) expect(r.dados.periodo).toBe("TRANSICAO");
  });

  it("calcula duração de 27 dias para planeamento MENSAL", async () => {
    mocked(prisma.planeamento.findFirst).mockResolvedValue({
      dataFim: new Date("2026-10-05"),
      microciclo: null,
      mesociclo: 2,
      periodo: "COMPETITIVO",
    });
    const r = await sugerirPlaneamento(ESC_ID, "MENSAL");
    expect(r.sucesso).toBe(true);
    if (r.sucesso) {
      expect(r.dados.tipo).toBe("MENSAL");
      expect(r.dados.dataInicio).toBe("2026-10-06");
      expect(r.dados.dataFim).toBe("2026-11-02"); // +27 dias
    }
  });
});

// ─── apagarPlaneamento ────────────────────────────────────────────────────────

describe("apagarPlaneamento", () => {
  it("falha sem clube ativo", async () => {
    mocked(obterClubeIdAtual).mockResolvedValue(null);
    const r = await apagarPlaneamento(PLAN_ID);
    expect(r.sucesso).toBe(false);
    expect(prisma.planeamento.delete).not.toHaveBeenCalled();
  });

  it("falha se o planeamento não pertence ao clube", async () => {
    mocked(prisma.planeamento.findFirst).mockResolvedValue(null);
    const r = await apagarPlaneamento(PLAN_ID);
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.erro).toMatch(/não encontrado/i);
    expect(prisma.planeamento.delete).not.toHaveBeenCalled();
  });

  it("desliga as sessões e apaga o planeamento numa transação", async () => {
    mocked(prisma.planeamento.findFirst).mockResolvedValue({
      id: PLAN_ID,
      escalaoId: ESC_ID,
    });
    const r = await apagarPlaneamento(PLAN_ID);
    expect(r.sucesso).toBe(true);
    expect(prisma.$transaction).toHaveBeenCalledOnce();
    expect(prisma.sessao.updateMany).toHaveBeenCalledOnce();
    expect(prisma.planeamento.delete).toHaveBeenCalledOnce();
  });
});
