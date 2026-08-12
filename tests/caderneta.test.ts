import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ───────────────────────────────────────────────────────────────────
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/epoca-context", () => ({
  obterClubeIdAtual: vi.fn(),
  obterEpocaAtiva: vi.fn(),
  COOKIE_EPOCA: "epoca_ativa",
}));
vi.mock("@/lib/permissoes", () => ({
  exigirCapacidadeEmAlgumEscalao: vi.fn(),
  podeLerAlgumEscalao: vi.fn(),
}));
vi.mock("@/lib/db", () => ({
  prisma: {
    atleta: { findFirst: vi.fn() },
    habilidade: { findMany: vi.fn(), findFirst: vi.fn() },
    progressoHabilidade: { findMany: vi.fn(), upsert: vi.fn() },
  },
}));

import { obterCadernetaAtleta, atualizarProgresso } from "@/lib/actions/caderneta";
import { obterClubeIdAtual, obterEpocaAtiva } from "@/lib/epoca-context";
import { exigirCapacidadeEmAlgumEscalao, podeLerAlgumEscalao } from "@/lib/permissoes";
import { prisma } from "@/lib/db";

const ATLETA_ID = "ckv9v0z1w0000abcd1234efgh";
const HAB_ID = "ckv9v0z1w0000abcd1234efgi";
const ESC_ID = "ckv9v0z1w0000abcd1234efgj";

const mocked = <T,>(fn: T) => fn as unknown as {
  mockResolvedValue: (v: unknown) => void;
  mockImplementation: (f: (...a: unknown[]) => unknown) => void;
};

const calls = (fn: unknown) => (fn as { mock: { calls: unknown[][] } }).mock.calls;

const PERM_OK = { ok: true, ctx: { clube: { id: "clube1" } } };

const ATLETA_BD = {
  id: ATLETA_ID,
  participacoes: [{ escalaoId: ESC_ID }],
};

const HAB1 = {
  id: HAB_ID,
  nome: "Passe Básico",
  nivel: "BASICO",
  ordem: 0,
  descricao: null,
  clubeId: "clube1",
  criadoEm: new Date(),
  atualizadoEm: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
  mocked(obterClubeIdAtual).mockResolvedValue("clube1");
  mocked(obterEpocaAtiva).mockResolvedValue({ id: "ep1" });
  mocked(exigirCapacidadeEmAlgumEscalao).mockResolvedValue(PERM_OK);
  mocked(podeLerAlgumEscalao).mockResolvedValue(true);
  mocked(prisma.atleta.findFirst).mockResolvedValue(ATLETA_BD);
  mocked(prisma.habilidade.findFirst).mockResolvedValue({ id: HAB_ID });
  mocked(prisma.habilidade.findMany).mockResolvedValue([HAB1]);
  mocked(prisma.progressoHabilidade.findMany).mockResolvedValue([]);
  mocked(prisma.progressoHabilidade.upsert).mockResolvedValue({
    id: "prog1",
    atletaId: ATLETA_ID,
    habilidadeId: HAB_ID,
    epocaId: "ep1",
    estado: "EM_PROGRESSO",
    dataDesbloqueio: null,
    notas: null,
  });
});

// ─── obterCadernetaAtleta ─────────────────────────────────────────────────────

describe("obterCadernetaAtleta", () => {
  it("falha sem clube ativo", async () => {
    mocked(obterClubeIdAtual).mockResolvedValue(null);
    const r = await obterCadernetaAtleta(ATLETA_ID);
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.erro).toMatch(/não autenticado/i);
    expect(prisma.habilidade.findMany).not.toHaveBeenCalled();
  });

  it("falha sem época ativa", async () => {
    mocked(obterEpocaAtiva).mockResolvedValue(null);
    const r = await obterCadernetaAtleta(ATLETA_ID);
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.erro).toMatch(/época/i);
  });

  it("falha se o atleta não pertence ao clube (isolamento multi-tenant)", async () => {
    mocked(prisma.atleta.findFirst).mockResolvedValue(null);
    const r = await obterCadernetaAtleta(ATLETA_ID);
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.erro).toMatch(/não encontrado/i);
  });

  it("falha sem permissão de leitura no escalão do atleta", async () => {
    mocked(podeLerAlgumEscalao).mockResolvedValue(false);
    const r = await obterCadernetaAtleta(ATLETA_ID);
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.erro).toMatch(/permissão/i);
  });

  it("devolve habilidades com estado NAO_INICIADO quando sem progressos", async () => {
    mocked(prisma.progressoHabilidade.findMany).mockResolvedValue([]);
    const r = await obterCadernetaAtleta(ATLETA_ID);
    expect(r.sucesso).toBe(true);
    if (r.sucesso) {
      expect(r.dados).toHaveLength(1);
      expect(r.dados[0].estado).toBe("NAO_INICIADO");
      expect(r.dados[0].id).toBe(HAB_ID);
    }
  });

  it("mescla progressos existentes com as habilidades do clube", async () => {
    mocked(prisma.progressoHabilidade.findMany).mockResolvedValue([
      {
        id: "prog1",
        habilidadeId: HAB_ID,
        estado: "DESBLOQUEADO",
        dataDesbloqueio: new Date("2026-10-01"),
        notas: "Bom desempenho",
      },
    ]);
    const r = await obterCadernetaAtleta(ATLETA_ID);
    expect(r.sucesso).toBe(true);
    if (r.sucesso) {
      expect(r.dados[0].estado).toBe("DESBLOQUEADO");
      expect(r.dados[0].notas).toBe("Bom desempenho");
      expect(r.dados[0].dataDesbloqueio).toBeInstanceOf(Date);
    }
  });
});

// ─── atualizarProgresso ───────────────────────────────────────────────────────

describe("atualizarProgresso", () => {
  it("falha sem clube ativo", async () => {
    mocked(obterClubeIdAtual).mockResolvedValue(null);
    const r = await atualizarProgresso(ATLETA_ID, HAB_ID, "EM_PROGRESSO");
    expect(r.sucesso).toBe(false);
    expect(prisma.progressoHabilidade.upsert).not.toHaveBeenCalled();
  });

  it("rejeita estado inválido (não pertence ao enum)", async () => {
    const r = await atualizarProgresso(ATLETA_ID, HAB_ID, "INVALIDO" as never);
    expect(r.sucesso).toBe(false);
    expect(prisma.progressoHabilidade.upsert).not.toHaveBeenCalled();
  });

  it("falha se o atleta não pertence ao clube", async () => {
    mocked(prisma.atleta.findFirst).mockResolvedValue(null);
    const r = await atualizarProgresso(ATLETA_ID, HAB_ID, "EM_PROGRESSO");
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.erro).toMatch(/atleta não encontrado/i);
  });

  it("falha se a habilidade não pertence ao clube", async () => {
    mocked(prisma.habilidade.findFirst).mockResolvedValue(null);
    const r = await atualizarProgresso(ATLETA_ID, HAB_ID, "EM_PROGRESSO");
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.erro).toMatch(/habilidade não encontrada/i);
  });

  it("regista dataDesbloqueio quando estado é DESBLOQUEADO", async () => {
    await atualizarProgresso(ATLETA_ID, HAB_ID, "DESBLOQUEADO");
    const arg = calls(prisma.progressoHabilidade.upsert)[0][0] as {
      create: { dataDesbloqueio: Date | null };
      update: { dataDesbloqueio: Date | null };
    };
    expect(arg.create.dataDesbloqueio).toBeInstanceOf(Date);
    expect(arg.update.dataDesbloqueio).toBeInstanceOf(Date);
  });

  it("limpa dataDesbloqueio quando estado regressa a EM_PROGRESSO", async () => {
    await atualizarProgresso(ATLETA_ID, HAB_ID, "EM_PROGRESSO");
    const arg = calls(prisma.progressoHabilidade.upsert)[0][0] as {
      update: { dataDesbloqueio: null };
    };
    expect(arg.update.dataDesbloqueio).toBeNull();
  });

  it("guarda notas opcionais quando fornecidas", async () => {
    await atualizarProgresso(ATLETA_ID, HAB_ID, "EM_PROGRESSO", "Melhoria notável");
    const arg = calls(prisma.progressoHabilidade.upsert)[0][0] as {
      create: { notas: string | null };
    };
    expect(arg.create.notas).toBe("Melhoria notável");
  });
});
