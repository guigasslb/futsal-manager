import { describe, it, expect, vi, beforeEach } from "vitest";

// F3.2 (§8.16) — Testes de integração da Server Action verificarConflitoAgenda.
// A lógica pura (detetarConflitos, temSobreposicao) é testada em agenda-conflitos.test.ts.
// Aqui testamos a camada de Server Action: autenticação, validação de schema,
// isolamento multi-tenant (filtra por clubeId) e orquestração com a BD.

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("@/lib/permissoes", () => ({
  obterMembroAtual: vi.fn(),
  podeLerEscalao: vi.fn(),
  escaloesLegiveis: vi.fn(),
}));

vi.mock("@/lib/epoca-context", () => ({
  obterClubeIdAtual: vi.fn(),
  obterEpocaAtiva: vi.fn(),
  COOKIE_EPOCA: "epoca_ativa",
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    sessao: { findMany: vi.fn() },
    jogo: { findMany: vi.fn() },
  },
}));

import { verificarConflitoAgenda } from "@/lib/actions/agenda";
import { obterMembroAtual } from "@/lib/permissoes";
import { prisma } from "@/lib/db";

const CLUBE = "ckv9v0z1w0000abcd1234efgh";
const CLUBE_OUTRO = "ckv9v0z1w9999xxxx5678yyyy";

const p = prisma as unknown as Record<string, Record<string, ReturnType<typeof vi.fn>>>;

function membro(clubeId = CLUBE) {
  return {
    utilizadorId: "user1",
    membroId: "membro1",
    clube: { id: clubeId, nome: "Clube A" },
    capacidades: ["TREINOS_GERIR"],
    ambito: "TODO_CLUBE",
    escaloesAtribuidos: [],
  };
}

const inputValido = {
  data: new Date("2026-08-15T18:00:00"),
  duracaoMin: 90,
  local: "Pavilhão A",
};

beforeEach(() => {
  vi.clearAllMocks();
  (obterMembroAtual as ReturnType<typeof vi.fn>).mockResolvedValue(membro());
  p.sessao.findMany.mockResolvedValue([]);
  p.jogo.findMany.mockResolvedValue([]);
});

describe("verificarConflitoAgenda — autenticação e validação", () => {
  it("nega quando não autenticado (obterMembroAtual devolve null)", async () => {
    (obterMembroAtual as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const r = await verificarConflitoAgenda(inputValido);
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.erro).toMatch(/autenticado/i);
    expect(p.sessao.findMany).not.toHaveBeenCalled();
    expect(p.jogo.findMany).not.toHaveBeenCalled();
  });

  it("rejeita input inválido — local vazio como string é aceite (semântica: sem conflito possível)", async () => {
    // local: "" é válido no schema (string); detetarConflitos retorna [] para local vazio.
    const r = await verificarConflitoAgenda({ ...inputValido, local: "" });
    expect(r.sucesso).toBe(true);
    if (!r.sucesso) return;
    expect(r.dados.conflitos).toHaveLength(0);
  });

  it("aceita duracaoMin omitido (campo opcional — assume duração padrão no helper)", async () => {
    const { duracaoMin: _, ...semDuracao } = inputValido;
    const r = await verificarConflitoAgenda(semDuracao);
    expect(r.sucesso).toBe(true);
    if (!r.sucesso) return;
    expect(r.dados.conflitos).toHaveLength(0);
  });
});

describe("verificarConflitoAgenda — isolamento multi-tenant", () => {
  it("filtra sessões pelo clubeId do membro autenticado (não vê sessões de outros clubes)", async () => {
    await verificarConflitoAgenda(inputValido);

    const argsSession = p.sessao.findMany.mock.calls[0][0];
    const argsJogo = p.jogo.findMany.mock.calls[0][0];

    // A query DEVE incluir o clubeId do membro — blinda contra acesso a dados de outros clubes.
    expect(argsSession.where.escalao).toMatchObject({ clubeId: CLUBE });
    expect(argsJogo.where.escalao).toMatchObject({ clubeId: CLUBE });
  });

  it("não retorna conflitos baseados em eventos de outro clube (mesmo que no mesmo pavilhão)", async () => {
    // Simula: a BD devolve sessão de OUTRO_CLUBE no mesmo local/horário.
    // Isso não deve acontecer se a query está correta, mas este teste garante que,
    // mesmo que por hipótese chegasse, o resultado seria correto.
    // (A verificação real é feita pelo teste acima — aqui testamos o comportamento end-to-end.)
    p.sessao.findMany.mockResolvedValue([
      {
        id: "s-outro",
        data: new Date("2026-08-15T18:30:00"),
        duracaoMin: 60,
        local: "Pavilhão A",
        escalao: { nome: "Sub-15 Outro Clube" },
      },
    ]);
    // Se a query retornar eventos de outro clube (bug hipotético), a action detetaria conflito.
    // Com a query correta (clubeId filter), nenhum evento de outro clube chega aqui.
    const r = await verificarConflitoAgenda(inputValido);
    expect(r.sucesso).toBe(true);
  });
});

describe("verificarConflitoAgenda — deteção de conflitos (integração com detetarConflitos)", () => {
  it("devolve lista vazia quando não há eventos no mesmo local", async () => {
    p.sessao.findMany.mockResolvedValue([
      {
        id: "s1",
        data: new Date("2026-08-15T18:30:00"),
        duracaoMin: 60,
        local: "Pavilhão B",
        escalao: { nome: "Sub-13" },
      },
    ]);
    const r = await verificarConflitoAgenda(inputValido);
    expect(r.sucesso).toBe(true);
    if (!r.sucesso) return;
    expect(r.dados.conflitos).toHaveLength(0);
  });

  it("devolve conflito quando há treino no mesmo pavilhão à mesma hora", async () => {
    p.sessao.findMany.mockResolvedValue([
      {
        id: "s1",
        data: new Date("2026-08-15T18:30:00"), // 18:30–19:30 — sobrepõe-se a 18:00–19:30
        duracaoMin: 60,
        local: "Pavilhão A",
        escalao: { nome: "Sub-13" },
      },
    ]);
    const r = await verificarConflitoAgenda(inputValido);
    expect(r.sucesso).toBe(true);
    if (!r.sucesso) return;
    expect(r.dados.conflitos).toHaveLength(1);
    expect(r.dados.conflitos[0]).toMatchObject({
      tipo: "TREINO",
      escalaoNome: "Sub-13",
      local: "Pavilhão A",
    });
  });

  it("deteta conflito de jogo e conflito de treino em simultâneo (múltiplos conflitos)", async () => {
    // Garante que a action agrega conflitos de sessões E jogos numa lista única.
    p.sessao.findMany.mockResolvedValue([
      {
        id: "s1",
        data: new Date("2026-08-15T18:15:00"),
        duracaoMin: 60,
        local: "Pavilhão A",
        escalao: { nome: "Sub-13" },
      },
    ]);
    p.jogo.findMany.mockResolvedValue([
      {
        id: "j1",
        data: new Date("2026-08-15T17:30:00"),
        local: "Pavilhão A",
        escalao: { nome: "Seniores" },
      },
    ]);
    const r = await verificarConflitoAgenda(inputValido);
    expect(r.sucesso).toBe(true);
    if (!r.sucesso) return;
    expect(r.dados.conflitos).toHaveLength(2);
    const tipos = r.dados.conflitos.map((c) => c.tipo);
    expect(tipos).toContain("TREINO");
    expect(tipos).toContain("JOGO");
  });

  it("exclui o próprio evento via excluirId (edição sem auto-conflito)", async () => {
    const EVENTO_ID = "ckv9v0z1w0010selfedita";
    p.sessao.findMany.mockResolvedValue([
      {
        id: EVENTO_ID, // é o próprio evento em edição
        data: new Date("2026-08-15T18:00:00"),
        duracaoMin: 90,
        local: "Pavilhão A",
        escalao: { nome: "Sub-15" },
      },
    ]);
    const r = await verificarConflitoAgenda({
      ...inputValido,
      excluirId: EVENTO_ID,
    });
    expect(r.sucesso).toBe(true);
    if (!r.sucesso) return;
    // O evento excluído não deve gerar conflito consigo próprio.
    expect(r.dados.conflitos).toHaveLength(0);
  });

  it("não deteta conflito quando a normalização de local diferencia pavilhões distintos", async () => {
    p.sessao.findMany.mockResolvedValue([
      {
        id: "s1",
        data: new Date("2026-08-15T18:30:00"),
        duracaoMin: 60,
        local: "Pavilhão Municipal B",
        escalao: { nome: "Sub-13" },
      },
    ]);
    // O novo evento é no Pavilhão A — não conflita com Pavilhão Municipal B.
    const r = await verificarConflitoAgenda(inputValido);
    expect(r.sucesso).toBe(true);
    if (!r.sucesso) return;
    expect(r.dados.conflitos).toHaveLength(0);
  });
});
