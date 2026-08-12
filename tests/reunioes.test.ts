import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ───────────────────────────────────────────────────────────────────
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: vi.fn(), signIn: vi.fn(), signOut: vi.fn(), handlers: {} }));
vi.mock("@/lib/epoca-context", () => ({
  obterClubeIdAtual: vi.fn(),
  COOKIE_EPOCA: "epoca_ativa",
}));
vi.mock("@/lib/permissoes", () => ({
  exigirCapacidade: vi.fn(),
  podeLerEscalao: vi.fn(),
  escaloesLegiveis: vi.fn(),
}));
vi.mock("@/lib/db", () => ({
  prisma: {
    reuniao: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import {
  criarReuniao,
  atualizarReuniao,
  apagarReuniao,
} from "@/lib/actions/reunioes";
import { auth } from "@/lib/auth";
import { obterClubeIdAtual } from "@/lib/epoca-context";
import { exigirCapacidade } from "@/lib/permissoes";
import { prisma } from "@/lib/db";

const REUNIAO_ID = "ckv9v0z1w0000abcd1234efga";
const ESC_ID = "ckv9v0z1w0000abcd1234efgb";

const mocked = <T,>(fn: T) => fn as unknown as {
  mockResolvedValue: (v: unknown) => void;
  mockImplementation: (f: (...a: unknown[]) => unknown) => void;
};

const calls = (fn: unknown) => (fn as { mock: { calls: unknown[][] } }).mock.calls;

const PERM_OK = { ok: true, ctx: { clube: { id: "clube1" } } };

const REUNIAO_BD = { id: REUNIAO_ID, titulo: "Reunião Mensal", clubeId: "clube1", ambito: "CLUBE", escalaoId: null };

const ENTRADA_CLUBE = {
  titulo: "Reunião Mensal",
  data: "2026-09-15",
  ambito: "CLUBE" as const,
};

const ENTRADA_ESCALAO = {
  titulo: "Reunião de Escalão",
  data: "2026-09-15",
  ambito: "ESCALAO" as const,
  escalaoId: ESC_ID,
};

beforeEach(() => {
  vi.clearAllMocks();
  mocked(auth).mockResolvedValue({ user: { id: "user1" } });
  mocked(obterClubeIdAtual).mockResolvedValue("clube1");
  mocked(exigirCapacidade).mockResolvedValue(PERM_OK);
  mocked(prisma.reuniao.findFirst).mockResolvedValue(REUNIAO_BD);
  mocked(prisma.reuniao.create).mockResolvedValue(REUNIAO_BD);
  mocked(prisma.reuniao.update).mockResolvedValue(REUNIAO_BD);
  mocked(prisma.reuniao.delete).mockResolvedValue(REUNIAO_BD);
});

// ─── criarReuniao ─────────────────────────────────────────────────────────────

describe("criarReuniao", () => {
  it("falha sem sessão autenticada", async () => {
    mocked(auth).mockResolvedValue(null);
    const r = await criarReuniao(ENTRADA_CLUBE);
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.erro).toMatch(/não autenticado/i);
    expect(prisma.reuniao.create).not.toHaveBeenCalled();
  });

  it("rejeita título vazio", async () => {
    const r = await criarReuniao({ ...ENTRADA_CLUBE, titulo: "" });
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.camposInvalidos?.titulo).toBeTruthy();
    expect(prisma.reuniao.create).not.toHaveBeenCalled();
  });

  it("rejeita reunião de escalão sem escalaoId", async () => {
    const r = await criarReuniao({ titulo: "Sem Escalão", data: "2026-09-15", ambito: "ESCALAO" });
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.camposInvalidos?.escalaoId).toBeTruthy();
    expect(prisma.reuniao.create).not.toHaveBeenCalled();
  });

  it("falha sem permissão REUNIOES_GERIR", async () => {
    mocked(exigirCapacidade).mockResolvedValue({ ok: false, erro: "Sem permissão" });
    const r = await criarReuniao(ENTRADA_CLUBE);
    expect(r.sucesso).toBe(false);
    expect(prisma.reuniao.create).not.toHaveBeenCalled();
  });

  it("cria reunião de clube com clubeId correto", async () => {
    const r = await criarReuniao(ENTRADA_CLUBE);
    expect(r.sucesso).toBe(true);
    const arg = calls(prisma.reuniao.create)[0][0] as { data: Record<string, unknown> };
    expect(arg.data.clubeId).toBe("clube1");
    expect(arg.data.ambito).toBe("CLUBE");
    expect(arg.data.titulo).toBe("Reunião Mensal");
    expect(arg.data.criadorId).toBe("user1");
  });

  it("cria reunião de escalão com escalaoId correto", async () => {
    const r = await criarReuniao(ENTRADA_ESCALAO);
    expect(r.sucesso).toBe(true);
    const arg = calls(prisma.reuniao.create)[0][0] as { data: Record<string, unknown> };
    expect(arg.data.ambito).toBe("ESCALAO");
    expect(arg.data.escalaoId).toBe(ESC_ID);
  });
});

// ─── atualizarReuniao ─────────────────────────────────────────────────────────

describe("atualizarReuniao", () => {
  it("falha sem clube ativo", async () => {
    mocked(obterClubeIdAtual).mockResolvedValue(null);
    const r = await atualizarReuniao(REUNIAO_ID, ENTRADA_CLUBE);
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.erro).toMatch(/não autenticado/i);
    expect(prisma.reuniao.update).not.toHaveBeenCalled();
  });

  it("falha se a reunião não pertence ao clube (isolamento multi-tenant)", async () => {
    mocked(prisma.reuniao.findFirst).mockResolvedValue(null);
    const r = await atualizarReuniao(REUNIAO_ID, ENTRADA_CLUBE);
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.erro).toMatch(/não encontrada/i);
    expect(prisma.reuniao.update).not.toHaveBeenCalled();
  });

  it("atualiza a reunião com os novos dados", async () => {
    const r = await atualizarReuniao(REUNIAO_ID, { ...ENTRADA_CLUBE, titulo: "Novo Título" });
    expect(r.sucesso).toBe(true);
    const arg = calls(prisma.reuniao.update)[0][0] as { data: Record<string, unknown> };
    expect(arg.data.titulo).toBe("Novo Título");
  });
});

// ─── apagarReuniao ────────────────────────────────────────────────────────────

describe("apagarReuniao", () => {
  it("falha sem clube ativo", async () => {
    mocked(obterClubeIdAtual).mockResolvedValue(null);
    const r = await apagarReuniao(REUNIAO_ID);
    expect(r.sucesso).toBe(false);
    expect(prisma.reuniao.delete).not.toHaveBeenCalled();
  });

  it("falha se a reunião não pertence ao clube", async () => {
    mocked(prisma.reuniao.findFirst).mockResolvedValue(null);
    const r = await apagarReuniao(REUNIAO_ID);
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.erro).toMatch(/não encontrada/i);
    expect(prisma.reuniao.delete).not.toHaveBeenCalled();
  });

  it("apaga a reunião quando autorizado", async () => {
    const r = await apagarReuniao(REUNIAO_ID);
    expect(r.sucesso).toBe(true);
    expect(prisma.reuniao.delete).toHaveBeenCalledOnce();
  });
});
