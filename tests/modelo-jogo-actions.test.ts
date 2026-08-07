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
  exigirCapacidadeEmAlgumEscalao: vi.fn(),
  podeLerEscalao: vi.fn(),
  podeLerAlgumEscalao: vi.fn(),
  escaloesLegiveis: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    modeloJogo: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    quadroTatico: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    jogo: { findFirst: vi.fn() },
    escalao: { findFirst: vi.fn() },
    epoca: { findFirst: vi.fn() },
  },
}));

import {
  listarModelosJogo,
  obterModeloJogo,
  criarModeloJogo,
  atualizarModeloJogo,
  apagarModeloJogo,
  listarQuadrosTaticos,
  criarQuadroTatico,
  atualizarQuadroTatico,
  apagarQuadroTatico,
} from "@/lib/actions/modeloJogo";
import { auth } from "@/lib/auth";
import { obterClubeIdAtual } from "@/lib/epoca-context";
import { exigirCapacidade, podeLerEscalao, escaloesLegiveis } from "@/lib/permissoes";
import { prisma } from "@/lib/db";

const ESCALAO = "ckv9v0z1w0000abcd1234efgh";
const EPOCA = "ckv9v0z1w0001abcd1234efgh";
const JOGO = "ckv9v0z1w0002abcd1234efgh";

type MockFn = {
  mockResolvedValue: (v: unknown) => void;
  mock: { calls: unknown[][] };
};
const mocked = <T,>(fn: T) => fn as unknown as MockFn;

const PERM_OK = { ok: true, ctx: { clube: { id: "clube1" } } };
const MODELO_BASE = {
  id: "modelo1",
  nome: "Saída a 4",
  momento: "ORG_OFENSIVA",
  proprietario: "CLUBE",
  principios: null,
  subprincipios: ["Pressão alta"],
  diagrama: null,
  escalaoId: ESCALAO,
  epocaId: EPOCA,
  autorId: "user1",
  clubeProprietarioId: "clube1",
  escalao: { id: ESCALAO, nome: "Sub-13" },
  epoca: { id: EPOCA, nome: "2025/26" },
  criadoEm: new Date(),
  atualizadoEm: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
  mocked(auth).mockResolvedValue({ user: { id: "user1" } });
  mocked(obterClubeIdAtual).mockResolvedValue("clube1");
  mocked(exigirCapacidade).mockResolvedValue(PERM_OK);
  mocked(podeLerEscalao).mockResolvedValue(true);
  mocked(escaloesLegiveis).mockResolvedValue("TODOS");
  mocked(prisma.escalao.findFirst).mockResolvedValue({ id: ESCALAO });
  mocked(prisma.epoca.findFirst).mockResolvedValue({ id: EPOCA });
});

describe("listarModelosJogo (F4 — escalão + momento)", () => {
  it("falha sem clube ativo", async () => {
    mocked(obterClubeIdAtual).mockResolvedValue(null);
    const r = await listarModelosJogo();
    expect(r.sucesso).toBe(false);
  });

  it("inclui a metodologia portátil (escalaoId null) ao filtrar por escalão", async () => {
    mocked(prisma.modeloJogo.findMany).mockResolvedValue([]);
    const r = await listarModelosJogo(ESCALAO);
    expect(r.sucesso).toBe(true);
    const where = (mocked(prisma.modeloJogo.findMany).mock.calls[0][0] as {
      where: { AND: unknown[] };
    }).where;
    expect(where.AND).toContainEqual({ OR: [{ escalaoId: ESCALAO }, { escalaoId: null }] });
  });

  it("recusa escalão sem permissão de leitura", async () => {
    mocked(podeLerEscalao).mockResolvedValue(false);
    const r = await listarModelosJogo(ESCALAO);
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.erro).toMatch(/permiss/i);
  });

  it("aplica o filtro de momento quando indicado", async () => {
    mocked(prisma.modeloJogo.findMany).mockResolvedValue([]);
    await listarModelosJogo(undefined, "BOLAS_PARADAS");
    const where = (mocked(prisma.modeloJogo.findMany).mock.calls[0][0] as {
      where: { AND: unknown[] };
    }).where;
    expect(where.AND).toContainEqual({ momento: "BOLAS_PARADAS" });
  });

  it("restringe aos escalões legíveis quando o âmbito é limitado", async () => {
    mocked(escaloesLegiveis).mockResolvedValue([ESCALAO]);
    mocked(prisma.modeloJogo.findMany).mockResolvedValue([]);
    await listarModelosJogo();
    const where = (mocked(prisma.modeloJogo.findMany).mock.calls[0][0] as {
      where: { AND: unknown[] };
    }).where;
    expect(where.AND).toContainEqual({
      OR: [{ escalaoId: { in: [ESCALAO] } }, { escalaoId: null }],
    });
  });

  it("com âmbito TODOS não restringe por escalão (inclui a metodologia genérica)", async () => {
    mocked(escaloesLegiveis).mockResolvedValue("TODOS");
    mocked(prisma.modeloJogo.findMany).mockResolvedValue([]);
    await listarModelosJogo();
    const where = (mocked(prisma.modeloJogo.findMany).mock.calls[0][0] as {
      where: { AND: unknown[] };
    }).where;
    // filtroEscalao vazio → não há restrição de escalão, o null (genérica) fica incluído
    expect(where.AND).toContainEqual({});
  });

  it("restringe a leitura ao clube ativo e à metodologia portátil do próprio treinador", async () => {
    mocked(prisma.modeloJogo.findMany).mockResolvedValue([]);
    await listarModelosJogo();
    const where = (mocked(prisma.modeloJogo.findMany).mock.calls[0][0] as {
      where: { AND: unknown[] };
    }).where;
    expect(where.AND).toContainEqual({
      OR: [
        { clubeProprietarioId: "clube1" },
        { proprietario: "TREINADOR", autorId: "user1" },
      ],
    });
  });
});

describe("obterModeloJogo (F4 — detalhe com subprincípios)", () => {
  it("devolve a lista normalizada de subprincípios", async () => {
    mocked(prisma.modeloJogo.findFirst).mockResolvedValue(MODELO_BASE);
    const r = await obterModeloJogo("modelo1");
    expect(r.sucesso).toBe(true);
    if (r.sucesso) {
      expect(r.dados.subprincipiosLista).toEqual(["Pressão alta"]);
      expect(r.dados.escalaoId).toBe(ESCALAO);
      expect(r.dados.epocaId).toBe(EPOCA);
    }
  });

  it("erro quando não existe no âmbito do utilizador", async () => {
    mocked(prisma.modeloJogo.findFirst).mockResolvedValue(null);
    const r = await obterModeloJogo("modelo1");
    expect(r.sucesso).toBe(false);
  });

  it("recusa quando o escalão do modelo não é legível", async () => {
    mocked(prisma.modeloJogo.findFirst).mockResolvedValue(MODELO_BASE);
    mocked(podeLerEscalao).mockResolvedValue(false);
    const r = await obterModeloJogo("modelo1");
    expect(r.sucesso).toBe(false);
  });
});

describe("criarModeloJogo (F4 — propriedade e âmbito)", () => {
  it("falha na validação Zod sem tocar na BD", async () => {
    const r = await criarModeloJogo({ nome: "", momento: "ORG_OFENSIVA" });
    expect(r.sucesso).toBe(false);
    expect(mocked(prisma.modeloJogo.create).mock.calls).toHaveLength(0);
  });

  it("TREINADOR cria metodologia portátil (sem clube, escalão ou época)", async () => {
    mocked(prisma.modeloJogo.create).mockResolvedValue({
      ...MODELO_BASE,
      proprietario: "TREINADOR",
      clubeProprietarioId: null,
      escalaoId: null,
      epocaId: null,
    });
    const r = await criarModeloJogo({
      nome: "Metodologia própria",
      momento: "ORG_OFENSIVA",
      proprietario: "TREINADOR",
      escalaoId: ESCALAO,
      epocaId: EPOCA,
    });
    expect(r.sucesso).toBe(true);
    const data = (mocked(prisma.modeloJogo.create).mock.calls[0][0] as {
      data: Record<string, unknown>;
    }).data;
    expect(data.clubeProprietarioId).toBeNull();
    expect(data.escalaoId).toBeNull();
    expect(data.epocaId).toBeNull();
  });

  it("CLUBE cria documento da equipa com escalão e época", async () => {
    mocked(prisma.modeloJogo.create).mockResolvedValue(MODELO_BASE);
    const r = await criarModeloJogo({
      nome: "Saída a 4",
      momento: "ORG_OFENSIVA",
      escalaoId: ESCALAO,
      epocaId: EPOCA,
      subprincipios: ["Pressão alta"],
    });
    expect(r.sucesso).toBe(true);
    const data = (mocked(prisma.modeloJogo.create).mock.calls[0][0] as {
      data: Record<string, unknown>;
    }).data;
    expect(data.clubeProprietarioId).toBe("clube1");
    expect(data.escalaoId).toBe(ESCALAO);
    expect(data.subprincipios).toEqual(["Pressão alta"]);
  });

  it("rejeita escalão de outro clube", async () => {
    mocked(prisma.escalao.findFirst).mockResolvedValue(null);
    const r = await criarModeloJogo({
      nome: "Saída a 4",
      momento: "ORG_OFENSIVA",
      escalaoId: ESCALAO,
    });
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.erro).toMatch(/escalão/i);
  });

  it("rejeita época de outro clube", async () => {
    mocked(prisma.epoca.findFirst).mockResolvedValue(null);
    const r = await criarModeloJogo({
      nome: "Saída a 4",
      momento: "ORG_OFENSIVA",
      epocaId: EPOCA,
    });
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.erro).toMatch(/época/i);
  });

  it("falha sem capacidade MODELO_JOGO_GERIR", async () => {
    mocked(exigirCapacidade).mockResolvedValue({ ok: false, erro: "Sem permissão" });
    const r = await criarModeloJogo({ nome: "Saída a 4", momento: "ORG_OFENSIVA" });
    expect(r.sucesso).toBe(false);
  });
});

describe("atualizarModeloJogo (F4)", () => {
  it("não altera subprincípios quando o campo é omitido", async () => {
    mocked(prisma.modeloJogo.findFirst).mockResolvedValue({
      id: "modelo1",
      escalaoId: ESCALAO,
      proprietario: "CLUBE",
      autorId: "user1",
    });
    mocked(prisma.modeloJogo.update).mockResolvedValue(MODELO_BASE);
    const r = await atualizarModeloJogo("modelo1", {
      nome: "Saída a 4 (v2)",
      momento: "ORG_OFENSIVA",
    });
    expect(r.sucesso).toBe(true);
    const data = (mocked(prisma.modeloJogo.update).mock.calls[0][0] as {
      data: Record<string, unknown>;
    }).data;
    expect("subprincipios" in data).toBe(false);
    // escalão preservado por omissão do campo
    expect(data.escalaoId).toBe(ESCALAO);
  });

  it("limpa subprincípios com array vazio", async () => {
    mocked(prisma.modeloJogo.findFirst).mockResolvedValue({
      id: "modelo1",
      escalaoId: ESCALAO,
      proprietario: "CLUBE",
      autorId: "user1",
    });
    mocked(prisma.modeloJogo.update).mockResolvedValue(MODELO_BASE);
    await atualizarModeloJogo("modelo1", {
      nome: "Saída a 4",
      momento: "ORG_OFENSIVA",
      subprincipios: [],
    });
    const data = (mocked(prisma.modeloJogo.update).mock.calls[0][0] as {
      data: Record<string, unknown>;
    }).data;
    expect(data.subprincipios).toEqual([]);
  });

  it("erro quando o modelo não está no âmbito", async () => {
    mocked(prisma.modeloJogo.findFirst).mockResolvedValue(null);
    const r = await atualizarModeloJogo("modelo1", {
      nome: "X",
      momento: "ORG_OFENSIVA",
    });
    expect(r.sucesso).toBe(false);
  });

  it("atualiza o diagrama sem apagar os princípios (reenviados)", async () => {
    mocked(prisma.modeloJogo.findFirst).mockResolvedValue({
      id: "modelo1",
      escalaoId: ESCALAO,
      proprietario: "CLUBE",
      autorId: "user1",
    });
    mocked(prisma.modeloJogo.update).mockResolvedValue(MODELO_BASE);
    const r = await atualizarModeloJogo("modelo1", {
      nome: "Saída a 4",
      momento: "ORG_OFENSIVA",
      principios: "Manter a posse",
      diagrama: { versao: 1, elementos: [] },
    });
    expect(r.sucesso).toBe(true);
    const data = (mocked(prisma.modeloJogo.update).mock.calls[0][0] as {
      data: Record<string, unknown>;
    }).data;
    expect(data.diagrama).toEqual({ versao: 1, elementos: [] });
    expect(data.principios).toBe("Manter a posse");
  });

  it("não inclui diagrama no update quando o campo é omitido", async () => {
    mocked(prisma.modeloJogo.findFirst).mockResolvedValue({
      id: "modelo1",
      escalaoId: ESCALAO,
      proprietario: "CLUBE",
      autorId: "user1",
    });
    mocked(prisma.modeloJogo.update).mockResolvedValue(MODELO_BASE);
    await atualizarModeloJogo("modelo1", { nome: "X", momento: "ORG_OFENSIVA" });
    const data = (mocked(prisma.modeloJogo.update).mock.calls[0][0] as {
      data: Record<string, unknown>;
    }).data;
    expect("diagrama" in data).toBe(false);
  });

  it("converte para portátil (TREINADOR) limpando clube, escalão e época", async () => {
    mocked(prisma.modeloJogo.findFirst).mockResolvedValue({
      id: "modelo1",
      escalaoId: ESCALAO,
      proprietario: "CLUBE",
      autorId: "user1",
    });
    mocked(prisma.modeloJogo.update).mockResolvedValue(MODELO_BASE);
    await atualizarModeloJogo("modelo1", {
      nome: "X",
      momento: "ORG_OFENSIVA",
      proprietario: "TREINADOR",
      escalaoId: ESCALAO,
      epocaId: EPOCA,
    });
    const data = (mocked(prisma.modeloJogo.update).mock.calls[0][0] as {
      data: Record<string, unknown>;
    }).data;
    expect(data.proprietario).toBe("TREINADOR");
    expect(data.clubeProprietarioId).toBeNull();
    expect(data.escalaoId).toBeNull();
    expect(data.epocaId).toBeNull();
  });
});

describe("apagarModeloJogo (F4)", () => {
  it("apaga quando existe e há permissão", async () => {
    mocked(prisma.modeloJogo.findFirst).mockResolvedValue({ id: "modelo1", escalaoId: null });
    mocked(prisma.modeloJogo.delete).mockResolvedValue({ id: "modelo1" });
    const r = await apagarModeloJogo("modelo1");
    expect(r.sucesso).toBe(true);
  });

  it("erro quando não existe", async () => {
    mocked(prisma.modeloJogo.findFirst).mockResolvedValue(null);
    const r = await apagarModeloJogo("modelo1");
    expect(r.sucesso).toBe(false);
  });

  it("restringe a eliminação ao âmbito do clube/treinador (where)", async () => {
    mocked(prisma.modeloJogo.findFirst).mockResolvedValue({ id: "modelo1", escalaoId: null });
    mocked(prisma.modeloJogo.delete).mockResolvedValue({ id: "modelo1" });
    await apagarModeloJogo("modelo1");
    const where = (mocked(prisma.modeloJogo.findFirst).mock.calls[0][0] as {
      where: Record<string, unknown>;
    }).where;
    expect(where.OR).toEqual([
      { clubeProprietarioId: "clube1" },
      { proprietario: "TREINADOR", autorId: "user1" },
    ]);
  });

  it("falha sem capacidade MODELO_JOGO_GERIR", async () => {
    mocked(prisma.modeloJogo.findFirst).mockResolvedValue({ id: "modelo1", escalaoId: ESCALAO });
    mocked(exigirCapacidade).mockResolvedValue({ ok: false, erro: "Sem permissão" });
    const r = await apagarModeloJogo("modelo1");
    expect(r.sucesso).toBe(false);
    expect(mocked(prisma.modeloJogo.delete).mock.calls).toHaveLength(0);
  });
});

describe("quadros táticos (F4 — GERAL / BOLA_PARADA)", () => {
  const QUADRO = {
    id: "quadro1",
    jogoId: JOGO,
    nome: "Canto ofensivo",
    tipo: "BOLA_PARADA",
    diagrama: null,
    notas: null,
  };

  it("listar: erro quando o jogo não pertence ao clube", async () => {
    mocked(prisma.jogo.findFirst).mockResolvedValue(null);
    const r = await listarQuadrosTaticos(JOGO);
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.erro).toMatch(/jogo/i);
  });

  it("listar: erro quando o escalão do jogo não é legível", async () => {
    mocked(prisma.jogo.findFirst).mockResolvedValue({ id: JOGO, escalaoId: ESCALAO });
    mocked(podeLerEscalao).mockResolvedValue(false);
    const r = await listarQuadrosTaticos(JOGO);
    expect(r.sucesso).toBe(false);
  });

  it("listar: filtra por tipo BOLA_PARADA", async () => {
    mocked(prisma.jogo.findFirst).mockResolvedValue({ id: JOGO, escalaoId: ESCALAO });
    mocked(prisma.quadroTatico.findMany).mockResolvedValue([QUADRO]);
    const r = await listarQuadrosTaticos(JOGO, "BOLA_PARADA");
    expect(r.sucesso).toBe(true);
    const where = (mocked(prisma.quadroTatico.findMany).mock.calls[0][0] as {
      where: Record<string, unknown>;
    }).where;
    expect(where).toEqual({ jogoId: JOGO, tipo: "BOLA_PARADA" });
  });

  it("criar: rejeita sem jogoId (validação Zod)", async () => {
    const r = await criarQuadroTatico({ nome: "Canto" });
    expect(r.sucesso).toBe(false);
    expect(mocked(prisma.quadroTatico.create).mock.calls).toHaveLength(0);
  });

  it("criar: erro quando o jogo não existe no clube", async () => {
    mocked(prisma.jogo.findFirst).mockResolvedValue(null);
    const r = await criarQuadroTatico({ jogoId: JOGO, nome: "Canto" });
    expect(r.sucesso).toBe(false);
  });

  it("criar: guarda o tipo indicado", async () => {
    mocked(prisma.jogo.findFirst).mockResolvedValue({ id: JOGO, escalaoId: ESCALAO });
    mocked(prisma.quadroTatico.create).mockResolvedValue(QUADRO);
    const r = await criarQuadroTatico({
      jogoId: JOGO,
      nome: "Canto ofensivo",
      tipo: "BOLA_PARADA",
      diagrama: { versao: 1, elementos: [] },
    });
    expect(r.sucesso).toBe(true);
    const data = (mocked(prisma.quadroTatico.create).mock.calls[0][0] as {
      data: Record<string, unknown>;
    }).data;
    expect(data.tipo).toBe("BOLA_PARADA");
    expect(data.jogoId).toBe(JOGO);
  });

  it("criar: guarda as notas quando fornecidas", async () => {
    mocked(prisma.jogo.findFirst).mockResolvedValue({ id: JOGO, escalaoId: ESCALAO });
    mocked(prisma.quadroTatico.create).mockResolvedValue(QUADRO);
    await criarQuadroTatico({ jogoId: JOGO, nome: "Canto", notas: "Ao primeiro poste" });
    const data = (mocked(prisma.quadroTatico.create).mock.calls[0][0] as {
      data: Record<string, unknown>;
    }).data;
    expect(data.notas).toBe("Ao primeiro poste");
  });

  it("criar: resolve o jogo dentro do clube ativo (isolamento)", async () => {
    mocked(prisma.jogo.findFirst).mockResolvedValue({ id: JOGO, escalaoId: ESCALAO });
    mocked(prisma.quadroTatico.create).mockResolvedValue(QUADRO);
    await criarQuadroTatico({ jogoId: JOGO, nome: "Canto" });
    const where = (mocked(prisma.jogo.findFirst).mock.calls[0][0] as {
      where: Record<string, unknown>;
    }).where;
    expect(where).toMatchObject({ id: JOGO, escalao: { clubeId: "clube1" } });
  });

  it("criar: falha sem capacidade MODELO_JOGO_GERIR", async () => {
    mocked(prisma.jogo.findFirst).mockResolvedValue({ id: JOGO, escalaoId: ESCALAO });
    mocked(exigirCapacidade).mockResolvedValue({ ok: false, erro: "Sem permissão" });
    const r = await criarQuadroTatico({ jogoId: JOGO, nome: "Canto" });
    expect(r.sucesso).toBe(false);
  });

  it("atualizar: erro quando o quadro não está no clube", async () => {
    mocked(prisma.quadroTatico.findFirst).mockResolvedValue(null);
    const r = await atualizarQuadroTatico("quadro1", { nome: "Canto" });
    expect(r.sucesso).toBe(false);
  });

  it("atualizar: assume tipo GERAL por omissão", async () => {
    mocked(prisma.quadroTatico.findFirst).mockResolvedValue({
      id: "quadro1",
      jogoId: JOGO,
      jogo: { escalaoId: ESCALAO },
    });
    mocked(prisma.quadroTatico.update).mockResolvedValue({ ...QUADRO, tipo: "GERAL" });
    const r = await atualizarQuadroTatico("quadro1", { nome: "Bloco defensivo" });
    expect(r.sucesso).toBe(true);
    const data = (mocked(prisma.quadroTatico.update).mock.calls[0][0] as {
      data: Record<string, unknown>;
    }).data;
    expect(data.tipo).toBe("GERAL");
    expect("diagrama" in data).toBe(false);
  });

  it("atualizar: guarda notas e diagrama quando fornecidos", async () => {
    mocked(prisma.quadroTatico.findFirst).mockResolvedValue({
      id: "quadro1",
      jogoId: JOGO,
      jogo: { escalaoId: ESCALAO },
    });
    mocked(prisma.quadroTatico.update).mockResolvedValue(QUADRO);
    const r = await atualizarQuadroTatico("quadro1", {
      nome: "Canto",
      tipo: "BOLA_PARADA",
      notas: "Ao segundo poste",
      diagrama: { versao: 1, elementos: [] },
    });
    expect(r.sucesso).toBe(true);
    const data = (mocked(prisma.quadroTatico.update).mock.calls[0][0] as {
      data: Record<string, unknown>;
    }).data;
    expect(data.notas).toBe("Ao segundo poste");
    expect(data.diagrama).toEqual({ versao: 1, elementos: [] });
  });

  it("atualizar: isola por clube via jogo (where)", async () => {
    mocked(prisma.quadroTatico.findFirst).mockResolvedValue({
      id: "quadro1",
      jogoId: JOGO,
      jogo: { escalaoId: ESCALAO },
    });
    mocked(prisma.quadroTatico.update).mockResolvedValue(QUADRO);
    await atualizarQuadroTatico("quadro1", { nome: "Canto" });
    const where = (mocked(prisma.quadroTatico.findFirst).mock.calls[0][0] as {
      where: Record<string, unknown>;
    }).where;
    expect(where).toMatchObject({ id: "quadro1", jogo: { escalao: { clubeId: "clube1" } } });
  });

  it("atualizar: falha sem capacidade MODELO_JOGO_GERIR", async () => {
    mocked(prisma.quadroTatico.findFirst).mockResolvedValue({
      id: "quadro1",
      jogoId: JOGO,
      jogo: { escalaoId: ESCALAO },
    });
    mocked(exigirCapacidade).mockResolvedValue({ ok: false, erro: "Sem permissão" });
    const r = await atualizarQuadroTatico("quadro1", { nome: "Canto" });
    expect(r.sucesso).toBe(false);
    expect(mocked(prisma.quadroTatico.update).mock.calls).toHaveLength(0);
  });

  it("apagar: erro quando não existe", async () => {
    mocked(prisma.quadroTatico.findFirst).mockResolvedValue(null);
    const r = await apagarQuadroTatico("quadro1");
    expect(r.sucesso).toBe(false);
  });

  it("apagar: sucesso com permissão", async () => {
    mocked(prisma.quadroTatico.findFirst).mockResolvedValue({
      id: "quadro1",
      jogoId: JOGO,
      jogo: { escalaoId: ESCALAO },
    });
    mocked(prisma.quadroTatico.delete).mockResolvedValue(QUADRO);
    const r = await apagarQuadroTatico("quadro1");
    expect(r.sucesso).toBe(true);
  });

  it("apagar: isola por clube via jogo (where)", async () => {
    mocked(prisma.quadroTatico.findFirst).mockResolvedValue({
      id: "quadro1",
      jogoId: JOGO,
      jogo: { escalaoId: ESCALAO },
    });
    mocked(prisma.quadroTatico.delete).mockResolvedValue(QUADRO);
    await apagarQuadroTatico("quadro1");
    const where = (mocked(prisma.quadroTatico.findFirst).mock.calls[0][0] as {
      where: Record<string, unknown>;
    }).where;
    expect(where).toMatchObject({ id: "quadro1", jogo: { escalao: { clubeId: "clube1" } } });
  });

  it("apagar: falha sem capacidade MODELO_JOGO_GERIR", async () => {
    mocked(prisma.quadroTatico.findFirst).mockResolvedValue({
      id: "quadro1",
      jogoId: JOGO,
      jogo: { escalaoId: ESCALAO },
    });
    mocked(exigirCapacidade).mockResolvedValue({ ok: false, erro: "Sem permissão" });
    const r = await apagarQuadroTatico("quadro1");
    expect(r.sucesso).toBe(false);
    expect(mocked(prisma.quadroTatico.delete).mock.calls).toHaveLength(0);
  });
});
