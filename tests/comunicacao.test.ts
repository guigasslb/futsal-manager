import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks (hoisted pelo Vitest) ─────────────────────────────────────────────
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("@/lib/epoca-context", () => ({
  obterClubeIdAtual: vi.fn(),
  obterEpocaAtiva: vi.fn(),
  COOKIE_EPOCA: "epoca_ativa",
}));

vi.mock("@/lib/permissoes", () => ({
  exigirCapacidade: vi.fn(),
  escaloesLegiveis: vi.fn(),
  podeLerEscalao: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    modeloComunicacao: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
    },
    sessao: { findMany: vi.fn() },
    jogo: { findMany: vi.fn(), findFirst: vi.fn() },
    utilizador: { findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import {
  substituirPlaceholders,
  placeholdersDoTemplate,
  formatarData,
  formatarDataCurta,
  formatarHora,
  formatarDiaSemana,
  formatarMesAno,
  formatarListaConvocados,
  formatarContagemPorAtleta,
  formatarListaEventos,
  SEM_REGISTOS,
} from "@/lib/comunicacao-utils";
import { MODELOS_COMUNICACAO_SEED } from "@/lib/comunicacao-modelos";
import {
  gerarTextoComunicacaoSchema,
  editarModeloComunicacaoSchema,
  calendarioTextoSchema,
  TIPOS_COMUNICACAO,
  LABEL_TIPO_COMUNICACAO,
} from "@/lib/schemas/comunicacao";
import {
  gerarTextoComunicacao,
  gerarCalendarioTexto,
  listarModelosComunicacao,
  editarModeloComunicacao,
  instalarSeedComunicacao,
  obterContextoConvocatoria,
  obterContextoResultado,
} from "@/lib/actions/comunicacao";
import { prisma } from "@/lib/db";
import { exigirCapacidade, escaloesLegiveis, podeLerEscalao } from "@/lib/permissoes";
import { obterClubeIdAtual } from "@/lib/epoca-context";

const CUID = "ckv9v0z1w0000abcd1234efgh";
const CUID_2 = "ckv9v0z1w0001abcd1234efgh";

const CLUBE = { id: "clube-1", nome: "CD Futsal" };

function permitir(clubeId = CLUBE.id) {
  vi.mocked(exigirCapacidade).mockResolvedValue({
    ok: true,
    ctx: {
      utilizadorId: "user-1",
      membroId: "membro-1",
      // Só os campos usados pelas actions.
      clube: { ...CLUBE, id: clubeId } as never,
      perfil: {} as never,
      capacidades: ["COMUNICACOES_GERIR"],
      ambito: "TODO_CLUBE",
      escaloesAtribuidos: [],
      seccoesCoordenadas: [],
    },
  });
}

function negar() {
  vi.mocked(exigirCapacidade).mockResolvedValue({ ok: false, erro: "Sem permissão" });
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ─────────────────────────────────────────────
// Utilitários puros
// ─────────────────────────────────────────────

describe("substituirPlaceholders", () => {
  it("substitui os placeholders presentes no contexto", () => {
    const r = substituirPlaceholders("Olá {{nome}}, às {{hora}}.", {
      nome: "João",
      hora: "19:30",
    });
    expect(r).toBe("Olá João, às 19:30.");
  });

  it("remove placeholders sem valor no contexto", () => {
    expect(substituirPlaceholders("Motivo: {{motivo}}.", {})).toBe("Motivo: .");
  });

  it("colapsa linhas em branco deixadas por placeholders removidos", () => {
    const r = substituirPlaceholders("A\n\n{{vazio}}\n\nB", {});
    expect(r).toBe("A\n\nB");
  });

  it("apara o texto final", () => {
    expect(substituirPlaceholders("\n\n{{x}}Texto{{y}}\n\n", { x: "", y: "" })).toBe("Texto");
  });

  it("não é vulnerável a chaves herdadas do prototype", () => {
    expect(substituirPlaceholders("[{{constructor}}]", {})).toBe("[]");
  });

  it("ignora placeholders malformados", () => {
    expect(substituirPlaceholders("{{ nome }} {nome}", { nome: "João" })).toBe(
      "{{ nome }} {nome}",
    );
  });

  it("gera a convocatória completa a partir do template de seed", () => {
    const modelo = MODELOS_COMUNICACAO_SEED.find((m) => m.tipo === "CONVOCATORIA");
    expect(modelo).toBeDefined();
    const texto = substituirPlaceholders(modelo!.template, {
      nomeEquipa: "CD Futsal Sub-13",
      diaSemana: "sábado",
      data: "12/09/2026",
      hora: "10:00",
      local: "Pavilhão Municipal",
      listaConvocados: "1. João Silva\n2. Pedro Santos",
      prazoConfirmacao: "11/09 às 20:00",
      nomeTreinador: "Treinador Silva",
    });
    expect(texto).toContain("*CONVOCATÓRIA — CD Futsal Sub-13*");
    expect(texto).toContain("1. João Silva");
    expect(texto).not.toContain("{{");
  });
});

describe("placeholdersDoTemplate", () => {
  it("devolve as chaves sem duplicados e pela ordem de ocorrência", () => {
    expect(placeholdersDoTemplate("{{a}} {{b}} {{a}}")).toEqual(["a", "b"]);
  });

  it("cobre os placeholders documentados da convocatória", () => {
    const modelo = MODELOS_COMUNICACAO_SEED.find((m) => m.tipo === "CONVOCATORIA")!;
    expect(placeholdersDoTemplate(modelo.template)).toEqual([
      "nomeEquipa",
      "diaSemana",
      "data",
      "hora",
      "local",
      "listaConvocados",
      "prazoConfirmacao",
      "nomeTreinador",
    ]);
  });
});

describe("MODELOS_COMUNICACAO_SEED", () => {
  it("tem exatamente um modelo por tipo de comunicação", () => {
    expect(MODELOS_COMUNICACAO_SEED).toHaveLength(TIPOS_COMUNICACAO.length);
    const tipos = MODELOS_COMUNICACAO_SEED.map((m) => m.tipo).sort();
    expect(tipos).toEqual([...TIPOS_COMUNICACAO].sort());
  });

  it("tem rótulo pt-PT para todos os tipos", () => {
    for (const tipo of TIPOS_COMUNICACAO) {
      expect(LABEL_TIPO_COMUNICACAO[tipo]).toBeTruthy();
    }
  });
});

describe("formatação de datas (pt-PT, Europe/Lisbon)", () => {
  const data = new Date("2026-09-12T09:00:00.000Z"); // 10:00 em Lisboa (verão)

  it("formata data completa e curta", () => {
    expect(formatarData(data)).toBe("12/09/2026");
    expect(formatarDataCurta(data)).toBe("12/09");
  });

  it("formata hora em h23", () => {
    expect(formatarHora(data)).toBe("10:00");
    expect(formatarHora(new Date("2026-09-11T23:30:00.000Z"))).toBe("00:30");
  });

  it("formata o dia da semana", () => {
    expect(formatarDiaSemana(data)).toBe("sábado");
  });

  it("formata mês/ano com inicial maiúscula", () => {
    expect(formatarMesAno(9, 2026)).toBe("Setembro de 2026");
    expect(formatarMesAno(1, 2026)).toBe("Janeiro de 2026");
  });
});

describe("listas formatadas", () => {
  it("numera os convocados", () => {
    expect(formatarListaConvocados(["João", "Pedro"])).toBe("1. João\n2. Pedro");
  });

  it("usa o marcador de vazio quando não há convocados", () => {
    expect(formatarListaConvocados([])).toBe(SEM_REGISTOS);
  });

  it("ordena marcadores por total e omite zeros", () => {
    expect(
      formatarContagemPorAtleta([
        { nome: "Pedro", total: 1 },
        { nome: "João", total: 3 },
        { nome: "Rui", total: 0 },
      ]),
    ).toBe("João (3), Pedro (1)");
  });

  it("devolve o marcador de vazio quando ninguém marcou", () => {
    expect(formatarContagemPorAtleta([{ nome: "Rui", total: 0 }])).toBe(SEM_REGISTOS);
  });

  it("formata treinos e jogos ordenados por data", () => {
    const texto = formatarListaEventos([
      { tipo: "JOGO", data: new Date("2026-09-14T16:00:00.000Z"), adversario: "Sporting" },
      { tipo: "TREINO", data: new Date("2026-09-12T18:30:00.000Z"), local: "Pavilhão" },
      { tipo: "TREINO", data: new Date("2026-09-15T18:30:00.000Z"), local: null },
    ]);
    expect(texto).toBe(
      "📅 12/09 — Treino (19:30, Pavilhão)\n" +
        "⚽ 14/09 — Jogo vs Sporting (17:00)\n" +
        "📅 15/09 — Treino (19:30)",
    );
  });

  it("indica ausência de eventos", () => {
    expect(formatarListaEventos([])).toBe("Sem eventos agendados para este mês.");
  });
});

// ─────────────────────────────────────────────
// Schemas
// ─────────────────────────────────────────────

describe("schemas de comunicação", () => {
  it("aceita uma geração de texto válida", () => {
    const r = gerarTextoComunicacaoSchema.safeParse({
      tipo: "CONVOCATORIA",
      contexto: { nomeEquipa: "Sub-13" },
    });
    expect(r.success).toBe(true);
  });

  it("rejeita tipo desconhecido", () => {
    const r = gerarTextoComunicacaoSchema.safeParse({ tipo: "SMS", contexto: {} });
    expect(r.success).toBe(false);
  });

  it("rejeita contexto com valores não string", () => {
    const r = gerarTextoComunicacaoSchema.safeParse({
      tipo: "AVISO_GERAL",
      contexto: { golos: 3 },
    });
    expect(r.success).toBe(false);
  });

  it("rejeita modeloId que não é cuid", () => {
    const r = gerarTextoComunicacaoSchema.safeParse({
      tipo: "AVISO_GERAL",
      contexto: {},
      modeloId: "123",
    });
    expect(r.success).toBe(false);
  });

  it("valida a edição de modelo", () => {
    expect(
      editarModeloComunicacaoSchema.safeParse({ id: CUID, nome: "X", template: "T" }).success,
    ).toBe(true);
    expect(
      editarModeloComunicacaoSchema.safeParse({ id: CUID, nome: "", template: "T" }).success,
    ).toBe(false);
    expect(
      editarModeloComunicacaoSchema.safeParse({ id: CUID, nome: "X", template: "" }).success,
    ).toBe(false);
  });

  it("valida mês e ano do calendário", () => {
    expect(calendarioTextoSchema.safeParse({ mes: 12, ano: 2026 }).success).toBe(true);
    expect(calendarioTextoSchema.safeParse({ mes: 13, ano: 2026 }).success).toBe(false);
    expect(calendarioTextoSchema.safeParse({ mes: 0, ano: 2026 }).success).toBe(false);
    expect(calendarioTextoSchema.safeParse({ mes: 1, ano: 1999 }).success).toBe(false);
  });
});

// ─────────────────────────────────────────────
// Server Actions
// ─────────────────────────────────────────────

describe("gerarTextoComunicacao", () => {
  it("rejeita input inválido antes de tocar na BD", async () => {
    const r = await gerarTextoComunicacao({ tipo: "INEXISTENTE", contexto: {} });
    expect(r.sucesso).toBe(false);
    expect(exigirCapacidade).not.toHaveBeenCalled();
  });

  it("exige a capacidade COMUNICACOES_GERIR", async () => {
    negar();
    const r = await gerarTextoComunicacao({ tipo: "AVISO_GERAL", contexto: {} });
    expect(r.sucesso).toBe(false);
    expect(exigirCapacidade).toHaveBeenCalledWith("COMUNICACOES_GERIR");
  });

  it("usa a variante do clube quando existe", async () => {
    permitir();
    vi.mocked(prisma.modeloComunicacao.findFirst).mockResolvedValueOnce({
      id: CUID,
      tipo: "AVISO_GERAL",
      nome: "Aviso do clube",
      template: "Olá {{assunto}}",
      clubeId: CLUBE.id,
      origemSeed: false,
      criadoEm: new Date(),
      atualizadoEm: new Date(),
    } as never);

    const r = await gerarTextoComunicacao({
      tipo: "AVISO_GERAL",
      contexto: { assunto: "Treino extra" },
    });
    expect(r).toEqual({ sucesso: true, dados: "Olá Treino extra" });
    expect(prisma.modeloComunicacao.findFirst).toHaveBeenCalledTimes(1);
  });

  it("cai para o modelo global quando o clube não tem variante", async () => {
    permitir();
    vi.mocked(prisma.modeloComunicacao.findFirst)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: CUID_2,
        tipo: "AVISO_GERAL",
        nome: "Aviso global",
        template: "Global: {{assunto}}",
        clubeId: null,
        origemSeed: true,
        criadoEm: new Date(),
        atualizadoEm: new Date(),
      } as never);

    const r = await gerarTextoComunicacao({
      tipo: "AVISO_GERAL",
      contexto: { assunto: "Reunião" },
    });
    expect(r).toEqual({ sucesso: true, dados: "Global: Reunião" });
    expect(prisma.modeloComunicacao.findFirst).toHaveBeenCalledTimes(2);
  });

  it("erra quando não existe nenhum modelo do tipo", async () => {
    permitir();
    vi.mocked(prisma.modeloComunicacao.findFirst).mockResolvedValue(null);
    const r = await gerarTextoComunicacao({ tipo: "RESULTADO", contexto: {} });
    expect(r.sucesso).toBe(false);
  });
});

describe("gerarCalendarioTexto", () => {
  it("valida mês/ano", async () => {
    const r = await gerarCalendarioTexto(0, 2026);
    expect(r.sucesso).toBe(false);
    expect(exigirCapacidade).not.toHaveBeenCalled();
  });

  it("gera a lista de treinos e jogos do mês", async () => {
    permitir();
    vi.mocked(escaloesLegiveis).mockResolvedValue("TODOS");
    vi.mocked(prisma.sessao.findMany).mockResolvedValue([
      { data: new Date("2026-09-12T18:30:00.000Z"), local: "Pavilhão" },
    ] as never);
    vi.mocked(prisma.jogo.findMany).mockResolvedValue([
      { data: new Date("2026-09-14T16:00:00.000Z"), adversario: "Sporting" },
    ] as never);
    vi.mocked(prisma.utilizador.findUnique).mockResolvedValue({ nome: "Treinador Silva" } as never);
    vi.mocked(prisma.modeloComunicacao.findFirst).mockResolvedValueOnce({
      id: CUID,
      tipo: "CALENDARIO_MENSAL",
      nome: "Calendário",
      template: "*{{mesAno}} — {{nomeEquipa}}*\n\n{{listaEventos}}\n\n_{{nomeTreinador}}_",
      clubeId: CLUBE.id,
      origemSeed: true,
      criadoEm: new Date(),
      atualizadoEm: new Date(),
    } as never);

    const r = await gerarCalendarioTexto(9, 2026);
    expect(r.sucesso).toBe(true);
    if (!r.sucesso) return;
    expect(r.dados).toBe(
      "*Setembro de 2026 — CD Futsal*\n\n" +
        "📅 12/09 — Treino (19:30, Pavilhão)\n" +
        "⚽ 14/09 — Jogo vs Sporting (17:00)\n\n" +
        "_Treinador Silva_",
    );
  });

  it("filtra pelos escalões legíveis quando o âmbito é limitado", async () => {
    permitir();
    vi.mocked(escaloesLegiveis).mockResolvedValue(["esc-1"]);
    vi.mocked(prisma.sessao.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.jogo.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.utilizador.findUnique).mockResolvedValue({ nome: "T" } as never);
    vi.mocked(prisma.modeloComunicacao.findFirst).mockResolvedValueOnce({
      template: "{{listaEventos}}",
    } as never);

    const r = await gerarCalendarioTexto(9, 2026);
    expect(r).toEqual({ sucesso: true, dados: "Sem eventos agendados para este mês." });

    const argsSessao = vi.mocked(prisma.sessao.findMany).mock.calls[0][0];
    expect(argsSessao?.where).toMatchObject({ escalaoId: { in: ["esc-1"] } });
    const argsJogo = vi.mocked(prisma.jogo.findMany).mock.calls[0][0];
    expect(argsJogo?.where).toMatchObject({ escalaoId: { in: ["esc-1"] } });
  });
});

describe("listarModelosComunicacao", () => {
  it("devolve os modelos do clube e os globais", async () => {
    permitir();
    vi.mocked(prisma.modeloComunicacao.findMany).mockResolvedValue([] as never);
    const r = await listarModelosComunicacao();
    expect(r.sucesso).toBe(true);
    const args = vi.mocked(prisma.modeloComunicacao.findMany).mock.calls[0][0];
    expect(args?.where).toEqual({ OR: [{ clubeId: CLUBE.id }, { clubeId: null }] });
  });

  it("exige a capacidade", async () => {
    negar();
    const r = await listarModelosComunicacao();
    expect(r.sucesso).toBe(false);
    expect(prisma.modeloComunicacao.findMany).not.toHaveBeenCalled();
  });
});

describe("editarModeloComunicacao", () => {
  it("recusa editar um modelo global do seed", async () => {
    permitir();
    vi.mocked(prisma.modeloComunicacao.findUnique).mockResolvedValue({
      id: CUID,
      clubeId: null,
    } as never);

    const r = await editarModeloComunicacao({ id: CUID, nome: "X", template: "T" });
    expect(r.sucesso).toBe(false);
    expect(prisma.modeloComunicacao.update).not.toHaveBeenCalled();
  });

  it("recusa editar o modelo de outro clube", async () => {
    permitir();
    vi.mocked(prisma.modeloComunicacao.findUnique).mockResolvedValue({
      id: CUID,
      clubeId: "outro-clube",
    } as never);

    const r = await editarModeloComunicacao({ id: CUID, nome: "X", template: "T" });
    expect(r.sucesso).toBe(false);
    expect(prisma.modeloComunicacao.update).not.toHaveBeenCalled();
  });

  it("edita o modelo do próprio clube", async () => {
    permitir();
    vi.mocked(prisma.modeloComunicacao.findUnique).mockResolvedValue({
      id: CUID,
      clubeId: CLUBE.id,
    } as never);
    vi.mocked(prisma.modeloComunicacao.update).mockResolvedValue({
      id: CUID,
      nome: "Novo",
      template: "T",
    } as never);

    const r = await editarModeloComunicacao({ id: CUID, nome: "Novo", template: "T" });
    expect(r.sucesso).toBe(true);
    expect(prisma.modeloComunicacao.update).toHaveBeenCalledWith({
      where: { id: CUID },
      data: { nome: "Novo", template: "T" },
    });
  });
});

describe("instalarSeedComunicacao", () => {
  it("cria uma cópia por tipo sem sobrepor as existentes", async () => {
    permitir();
    vi.mocked(prisma.$transaction).mockResolvedValue([] as never);
    vi.mocked(prisma.modeloComunicacao.upsert).mockImplementation(((args: unknown) => args) as never);

    const r = await instalarSeedComunicacao();
    expect(r.sucesso).toBe(true);
    expect(prisma.modeloComunicacao.upsert).toHaveBeenCalledTimes(
      MODELOS_COMUNICACAO_SEED.length,
    );
    const primeiro = vi.mocked(prisma.modeloComunicacao.upsert).mock.calls[0][0];
    expect(primeiro.update).toEqual({});
    expect(primeiro.create).toMatchObject({ clubeId: CLUBE.id, origemSeed: true });
  });

  it("exige a capacidade", async () => {
    negar();
    const r = await instalarSeedComunicacao();
    expect(r.sucesso).toBe(false);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});

describe("obterContextoConvocatoria", () => {
  const jogo = {
    id: "jogo-1",
    data: new Date("2026-09-12T09:00:00.000Z"),
    adversario: "Sporting",
    casaFora: "CASA",
    tipo: "OFICIAL",
    local: "Pavilhão Municipal",
    escalaoId: "esc-1",
    escalao: { nome: "Sub-13" },
    competicao: null,
    competicaoRef: null,
    golosMarcados: 4,
    golosSofridos: 2,
    relatorio: "Boa exibição.",
    convocatorias: [
      { atleta: { nome: "Pedro Santos" } },
      { atleta: { nome: "João Silva" } },
    ],
    estatisticas: [
      { atleta: { nome: "João Silva" }, golos: 3, assistencias: 0 },
      { atleta: { nome: "Pedro Santos" }, golos: 1, assistencias: 2 },
    ],
  };

  it("devolve o contexto completo da convocatória", async () => {
    vi.mocked(obterClubeIdAtual).mockResolvedValue(CLUBE.id);
    vi.mocked(prisma.jogo.findFirst).mockResolvedValue(jogo as never);
    permitir();
    vi.mocked(podeLerEscalao).mockResolvedValue(true);
    vi.mocked(prisma.utilizador.findUnique).mockResolvedValue({ nome: "Treinador Silva" } as never);

    const ctx = await obterContextoConvocatoria("jogo-1");
    expect(ctx).toEqual({
      nomeEquipa: "CD Futsal Sub-13",
      diaSemana: "sábado",
      data: "12/09/2026",
      hora: "10:00",
      local: "Pavilhão Municipal",
      listaConvocados: "1. João Silva\n2. Pedro Santos",
      prazoConfirmacao: "11/09 às 20:00",
      nomeTreinador: "Treinador Silva",
    });
  });

  it("lança quando o jogo não é do clube", async () => {
    vi.mocked(obterClubeIdAtual).mockResolvedValue(CLUBE.id);
    vi.mocked(prisma.jogo.findFirst).mockResolvedValue(null as never);
    await expect(obterContextoConvocatoria("jogo-x")).rejects.toThrow("Jogo não encontrado");
  });

  it("lança quando não há permissão no escalão", async () => {
    vi.mocked(obterClubeIdAtual).mockResolvedValue(CLUBE.id);
    vi.mocked(prisma.jogo.findFirst).mockResolvedValue(jogo as never);
    permitir();
    vi.mocked(podeLerEscalao).mockResolvedValue(false);
    await expect(obterContextoConvocatoria("jogo-1")).rejects.toThrow(
      "Sem permissão neste escalão",
    );
  });

  it("devolve o contexto do resultado com marcadores e assistências", async () => {
    vi.mocked(obterClubeIdAtual).mockResolvedValue(CLUBE.id);
    vi.mocked(prisma.jogo.findFirst).mockResolvedValue(jogo as never);
    permitir();
    vi.mocked(podeLerEscalao).mockResolvedValue(true);
    vi.mocked(prisma.utilizador.findUnique).mockResolvedValue({ nome: "Treinador Silva" } as never);

    const ctx = await obterContextoResultado("jogo-1");
    expect(ctx).toMatchObject({
      nomeEquipa: "CD Futsal Sub-13",
      adversario: "Sporting",
      resultado: "4-2",
      equipaCasa: "CD Futsal Sub-13",
      golosCasa: "4",
      golosFora: "2",
      equipaFora: "Sporting",
      marcadores: "João Silva (3), Pedro Santos (1)",
      assistencias: "Pedro Santos (2)",
      competicao: "Oficial",
      comentarioTreinador: "Boa exibição.",
    });
  });

  it("inverte casa/fora quando o jogo é fora", async () => {
    vi.mocked(obterClubeIdAtual).mockResolvedValue(CLUBE.id);
    vi.mocked(prisma.jogo.findFirst).mockResolvedValue({
      ...jogo,
      casaFora: "FORA",
      golosMarcados: null,
    } as never);
    permitir();
    vi.mocked(podeLerEscalao).mockResolvedValue(true);
    vi.mocked(prisma.utilizador.findUnique).mockResolvedValue({ nome: "T" } as never);

    const ctx = await obterContextoResultado("jogo-1");
    expect(ctx.equipaCasa).toBe("Sporting");
    expect(ctx.equipaFora).toBe("CD Futsal Sub-13");
    expect(ctx.golosCasa).toBe("2");
    expect(ctx.golosFora).toBe("?");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// F7 — Casos adicionais (complementam a cobertura acima, sem a duplicar)
// ═════════════════════════════════════════════════════════════════════════════

describe("substituirPlaceholders — casos F7 adicionais", () => {
  it("placeholder ausente vira string vazia e não deixa {{chave}} no texto", () => {
    const r = substituirPlaceholders("Antes {{ausente}} depois", {});
    expect(r).toBe("Antes  depois");
    expect(r).not.toContain("{{");
    expect(r).not.toContain("ausente");
  });

  it("substitui múltiplos placeholders distintos e repetidos", () => {
    const r = substituirPlaceholders("{{a}}-{{b}}-{{a}}-{{c}}", {
      a: "1",
      b: "2",
      c: "3",
    });
    expect(r).toBe("1-2-1-3");
  });

  it("guarda contra prototype pollution: __proto__ como chave é tratado como ausente", () => {
    expect(substituirPlaceholders("[{{__proto__}}]", {})).toBe("[]");
  });

  it("guarda contra prototype pollution: constructor só conta se for chave própria", () => {
    // Sem valor no contexto → removido; com valor próprio → usado (hasOwnProperty).
    expect(substituirPlaceholders("[{{constructor}}]", {})).toBe("[]");
    expect(substituirPlaceholders("[{{constructor}}]", { constructor: "ok" })).toBe("[ok]");
  });
});

describe("placeholdersDoTemplate — casos F7 adicionais", () => {
  it("extrai correctamente os placeholders de um template real (calendário)", () => {
    const modelo = MODELOS_COMUNICACAO_SEED.find((m) => m.tipo === "CALENDARIO_MENSAL")!;
    expect(placeholdersDoTemplate(modelo.template)).toEqual([
      "mesAno",
      "nomeEquipa",
      "listaEventos",
      "dataActualizacao",
    ]);
  });

  it("remove duplicados mantendo a ordem de primeira ocorrência", () => {
    expect(placeholdersDoTemplate("{{x}} {{y}} {{x}} {{z}} {{y}}")).toEqual(["x", "y", "z"]);
  });

  it("devolve lista vazia quando o template não tem placeholders", () => {
    expect(placeholdersDoTemplate("Texto sem qualquer placeholder.")).toEqual([]);
  });
});

describe("formatarListaConvocados — casos F7 adicionais", () => {
  it("lista vazia devolve o marcador de vazio", () => {
    expect(formatarListaConvocados([])).toBe(SEM_REGISTOS);
  });

  it("um único item fica numerado como 1", () => {
    expect(formatarListaConvocados(["João Silva"])).toBe("1. João Silva");
  });

  it("N itens ficam numerados sequencialmente", () => {
    expect(formatarListaConvocados(["Ana", "Bruno", "Carla"])).toBe("1. Ana\n2. Bruno\n3. Carla");
  });
});

describe("formatarListaEventos — casos F7 adicionais", () => {
  it("intercala TREINO e JOGO por ordem cronológica, ignorando a ordem de entrada", () => {
    const texto = formatarListaEventos([
      { tipo: "TREINO", data: new Date("2026-10-20T18:00:00.000Z"), local: "Pavilhão A" },
      { tipo: "JOGO", data: new Date("2026-10-05T15:00:00.000Z"), adversario: "Benfica" },
      { tipo: "JOGO", data: new Date("2026-10-25T15:00:00.000Z"), adversario: "Porto" },
      { tipo: "TREINO", data: new Date("2026-10-05T10:00:00.000Z"), local: null },
    ]);
    const linhas = texto.split("\n");
    expect(linhas).toHaveLength(4);
    // 05/10 (treino 10h) antes de 05/10 (jogo 15h), depois 20/10 e 25/10.
    expect(linhas[0]).toContain("05/10");
    expect(linhas[0]).toContain("Treino");
    expect(linhas[1]).toContain("05/10");
    expect(linhas[1]).toContain("Jogo vs Benfica");
    expect(linhas[2]).toContain("20/10");
    expect(linhas[2]).toContain("Treino");
    expect(linhas[3]).toContain("25/10");
    expect(linhas[3]).toContain("Jogo vs Porto");
  });
});

describe("gerarTextoComunicacaoSchema — casos F7 adicionais", () => {
  it("aceita um tipo válido e rejeita cada tipo fora do enum", () => {
    expect(
      gerarTextoComunicacaoSchema.safeParse({ tipo: "RESULTADO", contexto: {} }).success,
    ).toBe(true);
    for (const invalido of ["", "convocatoria", "SMS", "EMAIL"]) {
      expect(
        gerarTextoComunicacaoSchema.safeParse({ tipo: invalido, contexto: {} }).success,
      ).toBe(false);
    }
  });

  it("modeloId é opcional mas, se presente, tem de ser cuid", () => {
    const semModelo = gerarTextoComunicacaoSchema.safeParse({
      tipo: "AVISO_GERAL",
      contexto: {},
    });
    expect(semModelo.success).toBe(true);
    if (semModelo.success) expect(semModelo.data.modeloId).toBeUndefined();

    expect(
      gerarTextoComunicacaoSchema.safeParse({ tipo: "AVISO_GERAL", contexto: {}, modeloId: CUID })
        .success,
    ).toBe(true);
    expect(
      gerarTextoComunicacaoSchema.safeParse({ tipo: "AVISO_GERAL", contexto: {}, modeloId: "nope" })
        .success,
    ).toBe(false);
  });

  it("aceita contexto Record<string,string> com várias chaves e rejeita valores não string", () => {
    expect(
      gerarTextoComunicacaoSchema.safeParse({
        tipo: "AVISO_GERAL",
        contexto: { assunto: "X", mensagem: "Y" },
      }).success,
    ).toBe(true);
    expect(
      gerarTextoComunicacaoSchema.safeParse({
        tipo: "AVISO_GERAL",
        contexto: { golos: 3 },
      }).success,
    ).toBe(false);
  });
});

describe("editarModeloComunicacaoSchema — casos F7 adicionais", () => {
  it("aceita nome com exatamente 100 caracteres e rejeita 101", () => {
    expect(
      editarModeloComunicacaoSchema.safeParse({ id: CUID, nome: "a".repeat(100), template: "T" })
        .success,
    ).toBe(true);
    expect(
      editarModeloComunicacaoSchema.safeParse({ id: CUID, nome: "a".repeat(101), template: "T" })
        .success,
    ).toBe(false);
  });

  it("rejeita template vazio e aceita template não vazio", () => {
    expect(
      editarModeloComunicacaoSchema.safeParse({ id: CUID, nome: "Nome", template: "" }).success,
    ).toBe(false);
    expect(
      editarModeloComunicacaoSchema.safeParse({ id: CUID, nome: "Nome", template: "Conteúdo" })
        .success,
    ).toBe(true);
  });
});

describe("gerarTextoComunicacao — resolução de modelo (F7)", () => {
  it("consulta primeiro o modelo do clube e só depois o global (fallback)", async () => {
    permitir();
    vi.mocked(prisma.modeloComunicacao.findFirst)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ template: "Global {{x}}" } as never);

    const r = await gerarTextoComunicacao({ tipo: "AVISO_GERAL", contexto: { x: "1" } });
    expect(r).toEqual({ sucesso: true, dados: "Global 1" });

    const call1 = vi.mocked(prisma.modeloComunicacao.findFirst).mock.calls[0][0];
    expect(call1?.where).toEqual({ clubeId: CLUBE.id, tipo: "AVISO_GERAL" });
    const call2 = vi.mocked(prisma.modeloComunicacao.findFirst).mock.calls[1][0];
    expect(call2?.where).toEqual({ clubeId: null, tipo: "AVISO_GERAL" });
  });

  it("não consulta o global quando o clube já tem variante (precedência)", async () => {
    permitir();
    vi.mocked(prisma.modeloComunicacao.findFirst).mockResolvedValueOnce({
      template: "Clube {{x}}",
    } as never);

    const r = await gerarTextoComunicacao({ tipo: "AVISO_GERAL", contexto: { x: "9" } });
    expect(r).toEqual({ sucesso: true, dados: "Clube 9" });
    expect(prisma.modeloComunicacao.findFirst).toHaveBeenCalledTimes(1);
  });
});

describe("instalarSeedComunicacao — idempotência (F7)", () => {
  it("todos os upserts têm update no-op e chave única (uma reinstalação não duplica)", async () => {
    permitir();
    vi.mocked(prisma.$transaction).mockResolvedValue([] as never);
    vi.mocked(prisma.modeloComunicacao.upsert).mockImplementation(((args: unknown) => args) as never);

    await instalarSeedComunicacao();

    const calls = vi.mocked(prisma.modeloComunicacao.upsert).mock.calls;
    expect(calls).toHaveLength(MODELOS_COMUNICACAO_SEED.length);
    for (const [args] of calls) {
      // update:{} garante que um registo já existente fica intacto na 2.ª chamada.
      expect(args.update).toEqual({});
      // where por chave única clubeId_tipo → sem hipótese de criar duplicados.
      expect(args.where).toHaveProperty("clubeId_tipo");
    }
  });

  it("uma segunda instalação continua a devolver sucesso, sem novas criações forçadas", async () => {
    permitir();
    vi.mocked(prisma.$transaction).mockResolvedValue([] as never);
    vi.mocked(prisma.modeloComunicacao.upsert).mockImplementation(((args: unknown) => args) as never);

    const primeira = await instalarSeedComunicacao();
    vi.mocked(prisma.modeloComunicacao.upsert).mockClear();
    const segunda = await instalarSeedComunicacao();

    expect(primeira.sucesso).toBe(true);
    expect(segunda.sucesso).toBe(true);
    // A 2.ª chamada volta a emitir upserts idempotentes (update:{}), nunca creates cegos.
    for (const [args] of vi.mocked(prisma.modeloComunicacao.upsert).mock.calls) {
      expect(args.update).toEqual({});
    }
  });
});

describe("editarModeloComunicacao — âmbito do clube (F7)", () => {
  it("recusa um modelo global (clubeId null) mesmo com permissão", async () => {
    permitir();
    vi.mocked(prisma.modeloComunicacao.findUnique).mockResolvedValue({
      id: CUID,
      clubeId: null,
    } as never);

    const r = await editarModeloComunicacao({ id: CUID, nome: "N", template: "T" });
    expect(r.sucesso).toBe(false);
    expect(prisma.modeloComunicacao.update).not.toHaveBeenCalled();
  });

  it("valida contra o clube ativo da sessão, não contra um clube fixo", async () => {
    permitir("clube-ativo-2");
    vi.mocked(prisma.modeloComunicacao.findUnique).mockResolvedValue({
      id: CUID,
      clubeId: "clube-ativo-2",
    } as never);
    vi.mocked(prisma.modeloComunicacao.update).mockResolvedValue({
      id: CUID,
      nome: "N",
      template: "T",
    } as never);

    const r = await editarModeloComunicacao({ id: CUID, nome: "N", template: "T" });
    expect(r.sucesso).toBe(true);
    expect(prisma.modeloComunicacao.update).toHaveBeenCalledWith({
      where: { id: CUID },
      data: { nome: "N", template: "T" },
    });
  });
});
