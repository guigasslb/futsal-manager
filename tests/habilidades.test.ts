import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ───────────────────────────────────────────────────────────────────
// Nota: apagarHabilidade está coberta em tests/actions-producao.test.ts
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
    habilidade: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    progressoHabilidade: { count: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import {
  listarHabilidades,
  criarHabilidade,
  atualizarHabilidade,
  moverHabilidade,
} from "@/lib/actions/habilidades";
import { obterClubeIdAtual } from "@/lib/epoca-context";
import { exigirCapacidade } from "@/lib/permissoes";
import { prisma } from "@/lib/db";

const mocked = <T,>(fn: T) => fn as unknown as {
  mockResolvedValue: (v: unknown) => void;
  mockImplementation: (f: (...a: unknown[]) => unknown) => void;
};

const calls = (fn: unknown) => (fn as { mock: { calls: unknown[][] } }).mock.calls;

const PERM_OK = { ok: true, ctx: { clube: { id: "clube1" } } };

const H1 = { id: "h1", nome: "Passe Básico", nivel: "BASICO", ordem: 0, clubeId: "clube1" };
const H2 = { id: "h2", nome: "Passe Avançado", nivel: "BASICO", ordem: 1, clubeId: "clube1" };

beforeEach(() => {
  vi.clearAllMocks();
  mocked(obterClubeIdAtual).mockResolvedValue("clube1");
  mocked(exigirCapacidade).mockResolvedValue(PERM_OK);
  mocked(prisma.habilidade.findMany).mockResolvedValue([H1, H2]);
  mocked(prisma.habilidade.findFirst).mockResolvedValue(H1);
  mocked(prisma.habilidade.create).mockResolvedValue(H1);
  mocked(prisma.habilidade.update).mockResolvedValue(H1);
  mocked(prisma.progressoHabilidade.count).mockResolvedValue(0);
  mocked(prisma.$transaction).mockImplementation((arg: unknown) =>
    typeof arg === "function"
      ? (arg as (tx: unknown) => unknown)(prisma)
      : Promise.all(arg as unknown[]),
  );
});

// ─── listarHabilidades ────────────────────────────────────────────────────────

describe("listarHabilidades", () => {
  it("falha sem clube ativo", async () => {
    mocked(obterClubeIdAtual).mockResolvedValue(null);
    const r = await listarHabilidades();
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.erro).toMatch(/não autenticado/i);
    expect(prisma.habilidade.findMany).not.toHaveBeenCalled();
  });

  it("filtra pelo clubeId (isolamento multi-tenant)", async () => {
    await listarHabilidades();
    const arg = calls(prisma.habilidade.findMany)[0][0] as { where: { clubeId: string } };
    expect(arg.where.clubeId).toBe("clube1");
  });

  it("sem modalidade não filtra por modalidade (todas)", async () => {
    await listarHabilidades();
    const arg = calls(prisma.habilidade.findMany)[0][0] as { where: Record<string, unknown> };
    expect(arg.where.OR).toBeUndefined();
  });

  it("com modalidade inclui as habilidades dessa modalidade + universais (null)", async () => {
    await listarHabilidades("FUTEBOL");
    const arg = calls(prisma.habilidade.findMany)[0][0] as {
      where: { clubeId: string; OR: { modalidade: string | null }[] };
    };
    expect(arg.where.clubeId).toBe("clube1");
    expect(arg.where.OR).toEqual([{ modalidade: "FUTEBOL" }, { modalidade: null }]);
  });
});

// ─── criarHabilidade ──────────────────────────────────────────────────────────

describe("criarHabilidade", () => {
  it("falha sem a capacidade CATALOGO_HABILIDADES", async () => {
    mocked(exigirCapacidade).mockResolvedValue({ ok: false, erro: "Sem permissão" });
    const r = await criarHabilidade({ nome: "Passe", nivel: "BASICO" });
    expect(r.sucesso).toBe(false);
    expect(prisma.habilidade.create).not.toHaveBeenCalled();
  });

  it("rejeita nome vazio", async () => {
    const r = await criarHabilidade({ nome: "", nivel: "BASICO" });
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.camposInvalidos?.nome).toBeTruthy();
    expect(prisma.habilidade.create).not.toHaveBeenCalled();
  });

  it("rejeita nível inválido", async () => {
    const r = await criarHabilidade({ nome: "Passe", nivel: "EXPERT" });
    expect(r.sucesso).toBe(false);
    expect(prisma.habilidade.create).not.toHaveBeenCalled();
  });

  it("cria habilidade com clubeId e ordem corretos", async () => {
    mocked(prisma.habilidade.findFirst).mockResolvedValue({ ordem: 2 });
    const r = await criarHabilidade({ nome: "Nova Habilidade", nivel: "INTERMEDIO" });
    expect(r.sucesso).toBe(true);
    const arg = calls(prisma.habilidade.create)[0][0] as { data: Record<string, unknown> };
    expect(arg.data.clubeId).toBe("clube1");
    expect(arg.data.ordem).toBe(3);
    expect(arg.data.nome).toBe("Nova Habilidade");
    expect(arg.data.nivel).toBe("INTERMEDIO");
  });
});

// ─── atualizarHabilidade ──────────────────────────────────────────────────────

describe("atualizarHabilidade", () => {
  it("falha sem permissão", async () => {
    mocked(exigirCapacidade).mockResolvedValue({ ok: false, erro: "Sem permissão" });
    const r = await atualizarHabilidade("h1", { nome: "Passe", nivel: "BASICO" });
    expect(r.sucesso).toBe(false);
    expect(prisma.habilidade.update).not.toHaveBeenCalled();
  });

  it("falha se a habilidade não pertence ao clube (isolamento multi-tenant)", async () => {
    mocked(prisma.habilidade.findFirst).mockResolvedValue(null);
    const r = await atualizarHabilidade("h1", { nome: "Passe", nivel: "BASICO" });
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.erro).toMatch(/não encontrada/i);
    expect(prisma.habilidade.update).not.toHaveBeenCalled();
  });

  it("atualiza a habilidade com os novos dados", async () => {
    const r = await atualizarHabilidade("h1", { nome: "Drible Avançado", nivel: "AVANCADO" });
    expect(r.sucesso).toBe(true);
    const arg = calls(prisma.habilidade.update)[0][0] as {
      where: { id: string };
      data: { nome: string; nivel: string };
    };
    expect(arg.where.id).toBe("h1");
    expect(arg.data.nome).toBe("Drible Avançado");
    expect(arg.data.nivel).toBe("AVANCADO");
  });
});

// ─── moverHabilidade ──────────────────────────────────────────────────────────

describe("moverHabilidade", () => {
  it("falha sem permissão", async () => {
    mocked(exigirCapacidade).mockResolvedValue({ ok: false, erro: "Sem permissão" });
    const r = await moverHabilidade("h1", "subir");
    expect(r.sucesso).toBe(false);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("falha se a habilidade não existe no clube", async () => {
    mocked(prisma.habilidade.findFirst).mockResolvedValue(null);
    const r = await moverHabilidade("h-inexistente", "subir");
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.erro).toMatch(/não encontrada/i);
  });

  it("devolve sucesso sem transação se já está no limite do nível", async () => {
    // Só há uma habilidade no nível BASICO
    mocked(prisma.habilidade.findMany).mockResolvedValue([H1]);
    const r = await moverHabilidade("h1", "subir");
    expect(r.sucesso).toBe(true);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("troca ordens de duas habilidades adjacentes no mesmo nível", async () => {
    mocked(prisma.habilidade.findMany).mockResolvedValue([H1, H2]);
    const r = await moverHabilidade("h2", "subir");
    expect(r.sucesso).toBe(true);
    expect(prisma.$transaction).toHaveBeenCalledOnce();
    expect(prisma.habilidade.update).toHaveBeenCalledTimes(2);
  });
});
