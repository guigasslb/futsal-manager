import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ───────────────────────────────────────────────────────────────────
// Nota: apagarEscalao já está coberto em tests/actions-producao.test.ts
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
    escalao: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    atletaEscalao: { count: vi.fn() },
    sessao: { count: vi.fn() },
    jogo: { count: vi.fn() },
    planeamento: { count: vi.fn() },
    competicao: { count: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import {
  listarEscaloes,
  criarEscalao,
  atualizarEscalao,
  definirVisibilidadeEscalao,
  moverEscalao,
} from "@/lib/actions/escaloes";
import { obterClubeIdAtual } from "@/lib/epoca-context";
import { exigirCapacidade } from "@/lib/permissoes";
import { prisma } from "@/lib/db";

const mocked = <T,>(fn: T) => fn as unknown as {
  mockResolvedValue: (v: unknown) => void;
  mockImplementation: (f: (...a: unknown[]) => unknown) => void;
};

const calls = (fn: unknown) => (fn as { mock: { calls: unknown[][] } }).mock.calls;

const PERM_OK = { ok: true, ctx: { clube: { id: "clube1" } } };

const ESC1 = { id: "esc1", nome: "Sub-11", ordem: 0, clubeId: "clube1" };
const ESC2 = { id: "esc2", nome: "Sub-13", ordem: 1, clubeId: "clube1" };

beforeEach(() => {
  vi.clearAllMocks();
  mocked(obterClubeIdAtual).mockResolvedValue("clube1");
  mocked(exigirCapacidade).mockResolvedValue(PERM_OK);
  mocked(prisma.escalao.findMany).mockResolvedValue([ESC1, ESC2]);
  mocked(prisma.escalao.findFirst).mockResolvedValue(ESC1);
  mocked(prisma.escalao.create).mockResolvedValue(ESC1);
  mocked(prisma.escalao.update).mockResolvedValue(ESC1);
  mocked(prisma.$transaction).mockImplementation((arg: unknown) =>
    typeof arg === "function"
      ? (arg as (tx: unknown) => unknown)(prisma)
      : Promise.all(arg as unknown[]),
  );
});

// ─── listarEscaloes ───────────────────────────────────────────────────────────

describe("listarEscaloes", () => {
  it("falha sem clube ativo (não autenticado)", async () => {
    mocked(obterClubeIdAtual).mockResolvedValue(null);
    const r = await listarEscaloes();
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.erro).toMatch(/não autenticado/i);
    expect(prisma.escalao.findMany).not.toHaveBeenCalled();
  });

  it("filtra escalões pelo clubeId do utilizador autenticado", async () => {
    const r = await listarEscaloes();
    expect(r.sucesso).toBe(true);
    const arg = calls(prisma.escalao.findMany)[0][0] as { where: { clubeId: string } };
    expect(arg.where.clubeId).toBe("clube1");
  });

  it("devolve lista com todos os escalões do clube", async () => {
    const r = await listarEscaloes();
    expect(r.sucesso).toBe(true);
    if (r.sucesso) expect(r.dados).toHaveLength(2);
  });
});

// ─── criarEscalao ─────────────────────────────────────────────────────────────

describe("criarEscalao", () => {
  it("falha sem a capacidade CLUBE_ESCALOES", async () => {
    mocked(exigirCapacidade).mockResolvedValue({ ok: false, erro: "Sem permissão" });
    const r = await criarEscalao({ nome: "Sub-11" });
    expect(r.sucesso).toBe(false);
    expect(prisma.escalao.create).not.toHaveBeenCalled();
  });

  it("rejeita nome vazio com campo inválido", async () => {
    const r = await criarEscalao({ nome: "" });
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.camposInvalidos?.nome).toBeTruthy();
    expect(prisma.escalao.create).not.toHaveBeenCalled();
  });

  it("rejeita nome acima de 50 caracteres", async () => {
    const r = await criarEscalao({ nome: "a".repeat(51) });
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.camposInvalidos?.nome).toBeTruthy();
  });

  it("rejeita idadeMax menor que idadeMin", async () => {
    const r = await criarEscalao({ nome: "Sub-11", idadeMin: 10, idadeMax: 8 });
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.camposInvalidos?.idadeMax).toBeTruthy();
  });

  it("cria escalão com clubeId e ordem corretos", async () => {
    // Último escalão tem ordem=1, o novo fica com ordem=2
    mocked(prisma.escalao.findFirst).mockResolvedValue({ ordem: 1 });
    const r = await criarEscalao({ nome: "Sub-15" });
    expect(r.sucesso).toBe(true);
    const arg = calls(prisma.escalao.create)[0][0] as { data: Record<string, unknown> };
    expect(arg.data.clubeId).toBe("clube1");
    expect(arg.data.ordem).toBe(2);
    expect(arg.data.nome).toBe("Sub-15");
  });

  it("atribui ordem 0 quando não existe nenhum escalão ainda", async () => {
    mocked(prisma.escalao.findFirst).mockResolvedValue(null);
    await criarEscalao({ nome: "Seniores" });
    const arg = calls(prisma.escalao.create)[0][0] as { data: { ordem: number } };
    expect(arg.data.ordem).toBe(0);
  });

  it("exige a capacidade CLUBE_ESCALOES (não outra)", async () => {
    mocked(prisma.escalao.findFirst).mockResolvedValue(null);
    mocked(prisma.escalao.create).mockResolvedValue(ESC1);
    await criarEscalao({ nome: "Sub-11" });
    expect(calls(exigirCapacidade)[0][0]).toBe("CLUBE_ESCALOES");
  });
});

// ─── atualizarEscalao ─────────────────────────────────────────────────────────

describe("atualizarEscalao", () => {
  it("falha sem a capacidade", async () => {
    mocked(exigirCapacidade).mockResolvedValue({ ok: false, erro: "Sem permissão" });
    const r = await atualizarEscalao("esc1", { nome: "Sub-11" });
    expect(r.sucesso).toBe(false);
    expect(prisma.escalao.update).not.toHaveBeenCalled();
  });

  it("falha se o escalão não pertence ao clube (isolamento multi-tenant)", async () => {
    mocked(prisma.escalao.findFirst).mockResolvedValue(null);
    const r = await atualizarEscalao("esc1", { nome: "Sub-11" });
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.erro).toMatch(/não encontrado/i);
    expect(prisma.escalao.update).not.toHaveBeenCalled();
  });

  it("atualiza o escalão com os novos dados", async () => {
    const r = await atualizarEscalao("esc1", { nome: "Seniores", idadeMin: 18 });
    expect(r.sucesso).toBe(true);
    expect(prisma.escalao.update).toHaveBeenCalledOnce();
    const arg = calls(prisma.escalao.update)[0][0] as { where: { id: string }; data: { nome: string } };
    expect(arg.where.id).toBe("esc1");
    expect(arg.data.nome).toBe("Seniores");
  });
});

// ─── definirVisibilidadeEscalao ───────────────────────────────────────────────

describe("definirVisibilidadeEscalao", () => {
  it("falha sem permissão", async () => {
    mocked(exigirCapacidade).mockResolvedValue({ ok: false, erro: "Sem permissão" });
    const r = await definirVisibilidadeEscalao("esc1", true);
    expect(r.sucesso).toBe(false);
    expect(prisma.escalao.update).not.toHaveBeenCalled();
  });

  it("falha se escalão não pertence ao clube", async () => {
    mocked(prisma.escalao.findFirst).mockResolvedValue(null);
    const r = await definirVisibilidadeEscalao("esc1", false);
    expect(r.sucesso).toBe(false);
    expect(prisma.escalao.update).not.toHaveBeenCalled();
  });

  it("atualiza a visibilidade corretamente", async () => {
    const r = await definirVisibilidadeEscalao("esc1", false);
    expect(r.sucesso).toBe(true);
    const arg = calls(prisma.escalao.update)[0][0] as {
      where: { id: string };
      data: { visivelOutrosTreinadores: boolean };
    };
    expect(arg.where.id).toBe("esc1");
    expect(arg.data.visivelOutrosTreinadores).toBe(false);
  });
});

// ─── moverEscalao ─────────────────────────────────────────────────────────────

describe("moverEscalao", () => {
  it("falha sem permissão", async () => {
    mocked(exigirCapacidade).mockResolvedValue({ ok: false, erro: "Sem permissão" });
    const r = await moverEscalao("esc1", "descer");
    expect(r.sucesso).toBe(false);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("devolve sucesso sem transação se já estiver no limite", async () => {
    mocked(prisma.escalao.findMany).mockResolvedValue([ESC1]); // só um
    const r = await moverEscalao("esc1", "subir"); // já é o primeiro
    expect(r.sucesso).toBe(true);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("retorna erro se o escalão não existe na lista do clube", async () => {
    mocked(prisma.escalao.findMany).mockResolvedValue([ESC1, ESC2]);
    const r = await moverEscalao("esc-inexistente", "subir");
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.erro).toMatch(/não encontrado/i);
  });

  it("troca as ordens dos dois escalões adjacentes numa transação", async () => {
    mocked(prisma.escalao.findMany).mockResolvedValue([ESC1, ESC2]);
    const r = await moverEscalao("esc2", "subir");
    expect(r.sucesso).toBe(true);
    expect(prisma.$transaction).toHaveBeenCalledOnce();
    // Dois updates foram criados (em array mode)
    expect(prisma.escalao.update).toHaveBeenCalledTimes(2);
  });
});
