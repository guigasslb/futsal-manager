import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks (hoisted pelo Vitest) ─────────────────────────────────────────────
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  handlers: {},
}));

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
    escalao: { findFirst: vi.fn() },
    atleta: { create: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
    exercicio: { findFirst: vi.fn(), delete: vi.fn() },
    sessaoExercicio: { count: vi.fn() },
  },
}));

import { criarAtleta, apagarAtleta } from "@/lib/actions/atletas";
import { apagarExercicio } from "@/lib/actions/exercicios";
import { obterClubeIdAtual, obterEpocaAtiva } from "@/lib/epoca-context";
import { exigirCapacidade } from "@/lib/permissoes";
import { prisma } from "@/lib/db";

const CUID = "ckv9v0z1w0000abcd1234efgh";
const mocked = <T,>(fn: T) => fn as unknown as { mockResolvedValue: (v: unknown) => void };
const PERM_OK = { ok: true, ctx: { clube: { id: "clube1" } } };

beforeEach(() => {
  vi.clearAllMocks();
  // Por defeito, a permissão é concedida (o clube ativo é "clube1").
  mocked(exigirCapacidade).mockResolvedValue(PERM_OK);
});

describe("criarAtleta", () => {
  it("falha sem permissão/capacidade", async () => {
    mocked(exigirCapacidade).mockResolvedValue({ ok: false, erro: "Sem permissão" });
    const r = await criarAtleta({ nome: "João Silva", escalaoId: CUID });
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.erro).toMatch(/permiss/i);
  });

  it("falha na validação Zod (nome curto) sem tocar na BD", async () => {
    const r = await criarAtleta({ nome: "J", escalaoId: CUID });
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.camposInvalidos?.nome).toBeTruthy();
    expect(prisma.atleta.create).not.toHaveBeenCalled();
  });

  it("falha se não há época ativa", async () => {
    mocked(obterEpocaAtiva).mockResolvedValue(null);
    const r = await criarAtleta({ nome: "João Silva", escalaoId: CUID });
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.erro).toMatch(/época ativa/i);
  });

  it("falha se o escalão não existe no clube", async () => {
    mocked(obterEpocaAtiva).mockResolvedValue({ id: "ep1" });
    mocked(prisma.escalao.findFirst).mockResolvedValue(null);
    const r = await criarAtleta({ nome: "João Silva", escalaoId: CUID });
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.erro).toMatch(/escalão/i);
  });

  it("cria o atleta na época ativa quando tudo é válido", async () => {
    mocked(obterEpocaAtiva).mockResolvedValue({ id: "ep1" });
    mocked(prisma.escalao.findFirst).mockResolvedValue({ id: CUID, clubeId: "clube1" });
    mocked(prisma.atleta.create).mockResolvedValue({ id: "atleta1", nome: "João Silva" });

    const r = await criarAtleta({ nome: "João Silva", escalaoId: CUID, numero: 7 });
    expect(r.sucesso).toBe(true);
    if (r.sucesso) expect(r.dados.id).toBe("atleta1");

    const createArg = (prisma.atleta.create as unknown as { mock: { calls: unknown[][] } }).mock
      .calls[0][0] as { data: { epocaId: string } };
    expect(createArg.data.epocaId).toBe("ep1");
  });
});

describe("apagarAtleta (soft delete)", () => {
  it("marca ativo=false em vez de apagar", async () => {
    mocked(obterClubeIdAtual).mockResolvedValue("clube1");
    mocked(prisma.atleta.findFirst).mockResolvedValue({ id: "atleta1", escalaoId: CUID });
    mocked(prisma.atleta.update).mockResolvedValue({ id: "atleta1", ativo: false });

    const r = await apagarAtleta("atleta1");
    expect(r.sucesso).toBe(true);

    const updateArg = (prisma.atleta.update as unknown as { mock: { calls: unknown[][] } }).mock
      .calls[0][0] as { data: { ativo: boolean } };
    expect(updateArg.data.ativo).toBe(false);
  });

  it("falha sem permissão no escalão do atleta", async () => {
    mocked(obterClubeIdAtual).mockResolvedValue("clube1");
    mocked(prisma.atleta.findFirst).mockResolvedValue({ id: "atleta1", escalaoId: CUID });
    mocked(exigirCapacidade).mockResolvedValue({ ok: false, erro: "Sem permissão neste escalão" });

    const r = await apagarAtleta("atleta1");
    expect(r.sucesso).toBe(false);
    expect(prisma.atleta.update).not.toHaveBeenCalled();
  });
});

describe("apagarExercicio (secção 22.7 — bloqueado se em uso)", () => {
  it("bloqueia quando o exercício está em sessões", async () => {
    mocked(prisma.exercicio.findFirst).mockResolvedValue({ id: "ex1" });
    mocked(prisma.sessaoExercicio.count).mockResolvedValue(3);

    const r = await apagarExercicio("ex1");
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.erro).toMatch(/sess/i);
    expect(prisma.exercicio.delete).not.toHaveBeenCalled();
  });

  it("apaga quando não está em uso", async () => {
    mocked(prisma.exercicio.findFirst).mockResolvedValue({ id: "ex1" });
    mocked(prisma.sessaoExercicio.count).mockResolvedValue(0);
    mocked(prisma.exercicio.delete).mockResolvedValue({ id: "ex1" });

    const r = await apagarExercicio("ex1");
    expect(r.sucesso).toBe(true);
    expect(prisma.exercicio.delete).toHaveBeenCalledOnce();
  });
});
