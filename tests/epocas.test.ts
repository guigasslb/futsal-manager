import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ───────────────────────────────────────────────────────────────────
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/headers", () => ({
  cookies: async () => ({ set: vi.fn(), get: vi.fn() }),
}));
vi.mock("@/lib/epoca-context", () => ({
  obterClubeIdAtual: vi.fn(),
  COOKIE_EPOCA: "epoca_ativa",
}));
vi.mock("@/lib/permissoes", () => ({
  exigirCapacidade: vi.fn(),
}));
vi.mock("@/lib/db", () => ({
  prisma: {
    epoca: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import {
  listarEpocas,
  criarEpoca,
  definirEpocaAtiva,
  selecionarEpoca,
} from "@/lib/actions/epocas";
import { obterClubeIdAtual } from "@/lib/epoca-context";
import { exigirCapacidade } from "@/lib/permissoes";
import { prisma } from "@/lib/db";

const mocked = <T,>(fn: T) => fn as unknown as {
  mockResolvedValue: (v: unknown) => void;
  mockImplementation: (f: (...a: unknown[]) => unknown) => void;
};

const calls = (fn: unknown) => (fn as { mock: { calls: unknown[][] } }).mock.calls;

const PERM_OK = { ok: true, ctx: { clube: { id: "clube1" } } };

const EPOCA_BD = { id: "ep1", nome: "2026/2027", ativa: true, clubeId: "clube1" };

const ENTRADA_EPOCA_VALIDA = {
  nome: "2026/2027",
  dataInicio: "2026-09-01",
  dataFim: "2027-06-30",
};

beforeEach(() => {
  vi.clearAllMocks();
  mocked(obterClubeIdAtual).mockResolvedValue("clube1");
  mocked(exigirCapacidade).mockResolvedValue(PERM_OK);
  mocked(prisma.epoca.findMany).mockResolvedValue([EPOCA_BD]);
  mocked(prisma.epoca.findFirst).mockResolvedValue(EPOCA_BD);
  mocked(prisma.epoca.create).mockResolvedValue(EPOCA_BD);
  mocked(prisma.epoca.update).mockResolvedValue(EPOCA_BD);
  mocked(prisma.epoca.updateMany).mockResolvedValue({ count: 1 });
  mocked(prisma.$transaction).mockImplementation((arg: unknown) =>
    typeof arg === "function"
      ? (arg as (tx: unknown) => unknown)(prisma)
      : Promise.all(arg as unknown[]),
  );
});

// ─── listarEpocas ─────────────────────────────────────────────────────────────

describe("listarEpocas", () => {
  it("falha sem clube ativo", async () => {
    mocked(obterClubeIdAtual).mockResolvedValue(null);
    const r = await listarEpocas();
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.erro).toMatch(/não autenticado/i);
    expect(prisma.epoca.findMany).not.toHaveBeenCalled();
  });

  it("filtra épocas pelo clubeId (isolamento multi-tenant)", async () => {
    const r = await listarEpocas();
    expect(r.sucesso).toBe(true);
    const arg = calls(prisma.epoca.findMany)[0][0] as { where: { clubeId: string } };
    expect(arg.where.clubeId).toBe("clube1");
  });
});

// ─── criarEpoca ───────────────────────────────────────────────────────────────

describe("criarEpoca", () => {
  it("falha sem a capacidade CLUBE_EPOCAS", async () => {
    mocked(exigirCapacidade).mockResolvedValue({ ok: false, erro: "Sem permissão" });
    const r = await criarEpoca(ENTRADA_EPOCA_VALIDA);
    expect(r.sucesso).toBe(false);
    expect(prisma.epoca.create).not.toHaveBeenCalled();
  });

  it("rejeita nome vazio", async () => {
    const r = await criarEpoca({ ...ENTRADA_EPOCA_VALIDA, nome: "" });
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.camposInvalidos?.nome).toBeTruthy();
    expect(prisma.epoca.create).not.toHaveBeenCalled();
  });

  it("rejeita dataFim anterior a dataInicio", async () => {
    const r = await criarEpoca({
      nome: "2026/27",
      dataInicio: "2027-06-30",
      dataFim: "2026-09-01",
    });
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.camposInvalidos?.dataFim).toBeTruthy();
    expect(prisma.epoca.create).not.toHaveBeenCalled();
  });

  it("cria época com clubeId correto", async () => {
    const r = await criarEpoca(ENTRADA_EPOCA_VALIDA);
    expect(r.sucesso).toBe(true);
    const arg = calls(prisma.epoca.create)[0][0] as { data: Record<string, unknown> };
    expect(arg.data.clubeId).toBe("clube1");
    expect(arg.data.nome).toBe("2026/2027");
  });
});

// ─── definirEpocaAtiva ────────────────────────────────────────────────────────

describe("definirEpocaAtiva", () => {
  it("falha sem a capacidade CLUBE_EPOCAS", async () => {
    mocked(exigirCapacidade).mockResolvedValue({ ok: false, erro: "Sem permissão" });
    const r = await definirEpocaAtiva("ep1");
    expect(r.sucesso).toBe(false);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("falha se a época não pertence ao clube", async () => {
    mocked(prisma.epoca.findFirst).mockResolvedValue(null);
    const r = await definirEpocaAtiva("ep1");
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.erro).toMatch(/não encontrada/i);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("usa transação para desmarcar todas e marcar só a escolhida", async () => {
    const r = await definirEpocaAtiva("ep1");
    expect(r.sucesso).toBe(true);
    expect(prisma.$transaction).toHaveBeenCalledOnce();
    // updateMany (ativa=false) + update (ativa=true) criados antes da transação
    expect(prisma.epoca.updateMany).toHaveBeenCalledOnce();
    expect(prisma.epoca.update).toHaveBeenCalledOnce();
    const updateArg = calls(prisma.epoca.update)[0][0] as {
      where: { id: string };
      data: { ativa: boolean };
    };
    expect(updateArg.where.id).toBe("ep1");
    expect(updateArg.data.ativa).toBe(true);
  });
});

// ─── selecionarEpoca ──────────────────────────────────────────────────────────

describe("selecionarEpoca", () => {
  it("falha sem clube ativo", async () => {
    mocked(obterClubeIdAtual).mockResolvedValue(null);
    const r = await selecionarEpoca("ep1");
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.erro).toMatch(/não autenticado/i);
  });

  it("falha se a época não pertence ao clube (isolamento multi-tenant)", async () => {
    mocked(prisma.epoca.findFirst).mockResolvedValue(null);
    const r = await selecionarEpoca("ep1");
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.erro).toMatch(/não encontrada/i);
  });

  it("seleciona a época (define o cookie) quando tudo é válido", async () => {
    const r = await selecionarEpoca("ep1");
    expect(r.sucesso).toBe(true);
  });
});
