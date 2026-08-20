"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { obterEpocaAtiva, obterClubeIdAtual } from "@/lib/epoca-context";
import { exigirCapacidade, podeLerEscalao, escaloesLegiveis } from "@/lib/permissoes";
import { ok, erro, erroDeValidacao, type Resultado } from "@/lib/utils";
import {
  criarCompeticaoSchema,
  atualizarCompeticaoSchema,
  registarResultadoExternoSchema,
  criarCompeticaoCompletaSchema,
  equipaCompeticaoSchema,
  atualizarAgendamentoSchema,
} from "@/lib/schemas/competicao";
import { calcularClassificacao, type LinhaClassificacao } from "@/lib/classificacao";
import { gerarLiga, gerarBracket, type Equipa } from "@/lib/quadro";
import {
  Prisma,
  type Competicao,
  type ResultadoCompeticao,
  type EquipaCompeticao,
} from "@prisma/client";

export type { LinhaClassificacao } from "@/lib/classificacao";

const PATH = "/jogos/competicoes";

// ─────────────────────────────────────────────
// Tipos de leitura
// ─────────────────────────────────────────────

const INCLUDE_RESUMO = {
  escalao: { select: { id: true, nome: true } },
  _count: { select: { jogos: true, resultados: true } },
} as const;

const ORDER_RESULTADOS: Prisma.ResultadoCompeticaoOrderByWithRelationInput[] = [
  { data: "asc" },
  { criadoEm: "asc" },
];

const INCLUDE_DETALHE = {
  escalao: { select: { id: true, nome: true } },
  resultados: { orderBy: ORDER_RESULTADOS },
  jogos: {
    select: {
      id: true,
      data: true,
      adversario: true,
      casaFora: true,
      golosMarcados: true,
      golosSofridos: true,
    },
    orderBy: { data: "asc" },
  },
  _count: { select: { jogos: true, resultados: true } },
} as const;

export type CompeticaoResumo = Prisma.CompeticaoGetPayload<{ include: typeof INCLUDE_RESUMO }>;
export type CompeticaoDetalhe = Prisma.CompeticaoGetPayload<{ include: typeof INCLUDE_DETALHE }>;

/** Alias retrocompatível (usado pela UI anterior a F6). */
export type CompeticaoComRelacoes = CompeticaoResumo;

// ─────────────────────────────────────────────
// CRUD de competições
// ─────────────────────────────────────────────

export async function listarCompeticoes(
  escalaoId?: string,
): Promise<Resultado<CompeticaoResumo[]>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");
  const epoca = await obterEpocaAtiva();
  if (!epoca) return erro("Nenhuma época ativa");

  const legiveis = await escaloesLegiveis();
  let filtro: Prisma.CompeticaoWhereInput = {};
  if (escalaoId) {
    if (!(await podeLerEscalao(escalaoId))) return ok([]);
    filtro = { escalaoId };
  } else if (legiveis !== "TODOS") {
    filtro = { escalaoId: { in: legiveis } };
  }

  const competicoes = await prisma.competicao.findMany({
    where: { epocaId: epoca.id, clubeId, ...filtro },
    include: INCLUDE_RESUMO,
    orderBy: { criadoEm: "desc" },
  });
  return ok(competicoes);
}

export async function obterCompeticao(id: string): Promise<Resultado<CompeticaoDetalhe>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const competicao = await prisma.competicao.findFirst({
    where: { id, clubeId },
    include: INCLUDE_DETALHE,
  });
  if (!competicao) return erro("Competição não encontrada");
  if (!(await podeLerEscalao(competicao.escalaoId)))
    return erro("Sem permissão neste escalão");

  return ok(competicao);
}

export async function criarCompeticao(dados: unknown): Promise<Resultado<Competicao>> {
  const parsed = criarCompeticaoSchema.safeParse(dados);
  if (!parsed.success) return erroDeValidacao(parsed.error);

  const perm = await exigirCapacidade("COMPETICOES_GERIR", parsed.data.escalaoId);
  if (!perm.ok) return erro(perm.erro);

  const clubeId = perm.ctx.clube.id;

  // Época: a indicada (validada contra o clube) ou a época ativa.
  let epocaId = parsed.data.epocaId ?? null;
  if (epocaId) {
    const epoca = await prisma.epoca.findFirst({ where: { id: epocaId, clubeId } });
    if (!epoca) return erro("A época selecionada não existe");
  } else {
    const epoca = await obterEpocaAtiva();
    if (!epoca) return erro("Nenhuma época ativa");
    epocaId = epoca.id;
  }

  const escalao = await prisma.escalao.findFirst({
    where: { id: parsed.data.escalaoId, clubeId },
  });
  if (!escalao) return erro("O escalão selecionado não existe");

  const competicao = await prisma.competicao.create({
    data: {
      clubeId,
      escalaoId: parsed.data.escalaoId,
      epocaId,
      nome: parsed.data.nome,
      tipo: parsed.data.tipo,
      formato: parsed.data.formato,
    },
  });
  revalidatePath(PATH);
  return ok(competicao);
}

export async function atualizarCompeticao(
  id: string,
  dados: unknown,
): Promise<Resultado<Competicao>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  // O `id` do parâmetro é a autoridade (ignora um eventual id no payload).
  const parsed = atualizarCompeticaoSchema.safeParse({
    ...(typeof dados === "object" && dados !== null ? dados : {}),
    id,
  });
  if (!parsed.success) return erroDeValidacao(parsed.error);

  const existe = await prisma.competicao.findFirst({ where: { id, clubeId } });
  if (!existe) return erro("Competição não encontrada");

  const perm = await exigirCapacidade("COMPETICOES_GERIR", existe.escalaoId);
  if (!perm.ok) return erro(perm.erro);

  // Mudança de escalão: exige permissão no destino e que pertença ao clube.
  const novoEscalaoId = parsed.data.escalaoId;
  if (novoEscalaoId && novoEscalaoId !== existe.escalaoId) {
    const permDestino = await exigirCapacidade("COMPETICOES_GERIR", novoEscalaoId);
    if (!permDestino.ok) return erro(permDestino.erro);
    const escalao = await prisma.escalao.findFirst({
      where: { id: novoEscalaoId, clubeId },
    });
    if (!escalao) return erro("O escalão selecionado não existe");
  }

  const data: Prisma.CompeticaoUpdateInput = {};
  if (parsed.data.nome !== undefined) data.nome = parsed.data.nome;
  if (parsed.data.tipo !== undefined) data.tipo = parsed.data.tipo;
  if (parsed.data.formato !== undefined) data.formato = parsed.data.formato;
  if (novoEscalaoId !== undefined)
    data.escalao = { connect: { id: novoEscalaoId } };

  const competicao = await prisma.competicao.update({ where: { id }, data });
  revalidatePath(PATH);
  revalidatePath(`${PATH}/${id}`);
  return ok(competicao);
}

export async function apagarCompeticao(id: string): Promise<Resultado<void>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const existe = await prisma.competicao.findFirst({ where: { id, clubeId } });
  if (!existe) return erro("Competição não encontrada");

  const perm = await exigirCapacidade("COMPETICOES_GERIR", existe.escalaoId);
  if (!perm.ok) return erro(perm.erro);

  // Desliga os jogos da competição (não os apaga). Os resultados externos são
  // apagados em cascata (FK onDelete: Cascade).
  await prisma.$transaction([
    prisma.jogo.updateMany({ where: { competicaoId: id }, data: { competicaoId: null } }),
    prisma.competicao.delete({ where: { id } }),
  ]);
  revalidatePath(PATH);
  return ok(undefined);
}

// ─────────────────────────────────────────────
// Resultados externos (outras equipas)
// ─────────────────────────────────────────────

export async function registarResultadoExterno(
  dados: unknown,
): Promise<Resultado<ResultadoCompeticao>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const parsed = registarResultadoExternoSchema.safeParse(dados);
  if (!parsed.success) return erroDeValidacao(parsed.error);

  const competicao = await prisma.competicao.findFirst({
    where: { id: parsed.data.competicaoId, clubeId },
  });
  if (!competicao) return erro("Competição não encontrada");

  const perm = await exigirCapacidade("COMPETICOES_GERIR", competicao.escalaoId);
  if (!perm.ok) return erro(perm.erro);

  if (parsed.data.equipaCasa.trim() === parsed.data.equipaFora.trim())
    return erro("As duas equipas têm de ser diferentes");

  // Golos opcionais (schema Prisma nullable): com ambos preenchidos o jogo está
  // REALIZADO; caso contrário fica AGENDADO (sem resultado).
  const golosCasa = parsed.data.golosCasa ?? null;
  const golosFora = parsed.data.golosFora ?? null;
  const realizado = golosCasa !== null && golosFora !== null;

  const resultado = await prisma.resultadoCompeticao.create({
    data: {
      competicaoId: parsed.data.competicaoId,
      equipaCasa: parsed.data.equipaCasa.trim(),
      equipaFora: parsed.data.equipaFora.trim(),
      golosCasa,
      golosFora,
      data: parsed.data.data ?? null,
      estado: realizado ? "REALIZADO" : "AGENDADO",
    },
  });
  revalidatePath(`${PATH}/${parsed.data.competicaoId}`);
  return ok(resultado);
}

export async function apagarResultadoExterno(id: string): Promise<Resultado<void>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const resultado = await prisma.resultadoCompeticao.findFirst({
    where: { id, competicao: { clubeId } },
    select: { id: true, competicaoId: true, competicao: { select: { escalaoId: true } } },
  });
  if (!resultado) return erro("Resultado não encontrado");

  const perm = await exigirCapacidade("COMPETICOES_GERIR", resultado.competicao.escalaoId);
  if (!perm.ok) return erro(perm.erro);

  await prisma.resultadoCompeticao.delete({ where: { id } });
  revalidatePath(`${PATH}/${resultado.competicaoId}`);
  return ok(undefined);
}

// ─────────────────────────────────────────────
// Classificação (calculada)
// ─────────────────────────────────────────────

/**
 * Tabela de classificação de uma competição, combinando os jogos da própria
 * equipa (com resultado final) e os resultados externos inseridos manualmente.
 * A tabela é CALCULADA (não armazenada) — bíblia §3.7.
 */
export async function obterClassificacao(
  competicaoId: string,
): Promise<Resultado<LinhaClassificacao[]>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const competicao = await prisma.competicao.findFirst({
    where: { id: competicaoId, clubeId },
    include: { escalao: { select: { nome: true } } },
  });
  if (!competicao) return erro("Competição não encontrada");
  if (!(await podeLerEscalao(competicao.escalaoId)))
    return erro("Sem permissão neste escalão");

  // Jogos próprios com resultado final (ambos os golos preenchidos).
  const jogosBrutos = await prisma.jogo.findMany({
    where: {
      competicaoId,
      golosMarcados: { not: null },
      golosSofridos: { not: null },
    },
    select: { adversario: true, golosMarcados: true, golosSofridos: true },
  });

  // Só jogos REALIZADOS entram na classificação: os agendados (quadro competitivo)
  // ainda não têm golos e não devem contar. Filtra por golos preenchidos — robusto
  // independentemente do `estado`. `golosCasa`/`golosFora` são `Int?` (number | null)
  // no schema Prisma; o flatMap abaixo estreita o tipo para `number` SEM asserção.
  const resultadosBrutos = await prisma.resultadoCompeticao.findMany({
    where: { competicaoId, golosCasa: { not: null }, golosFora: { not: null } },
    select: { equipaCasa: true, equipaFora: true, golosCasa: true, golosFora: true },
  });

  // Narrowing por type guard (flatMap): descarta linhas com golos nulos e devolve
  // objetos com golos garantidamente `number`, satisfazendo Jogo/ResultadoClassificacao.
  const jogosProprios = jogosBrutos.flatMap((j) =>
    j.golosMarcados === null || j.golosSofridos === null
      ? []
      : [
          {
            adversario: j.adversario,
            golosMarcados: j.golosMarcados,
            golosSofridos: j.golosSofridos,
          },
        ],
  );

  const resultados = resultadosBrutos.flatMap((r) =>
    r.golosCasa === null || r.golosFora === null
      ? []
      : [
          {
            equipaCasa: r.equipaCasa,
            equipaFora: r.equipaFora,
            golosCasa: r.golosCasa,
            golosFora: r.golosFora,
          },
        ],
  );

  const classificacao = calcularClassificacao({
    nomeEquipaPropria: competicao.escalao.nome,
    formato: competicao.formato,
    jogosProprios,
    resultados,
  });

  return ok(classificacao);
}

// ─────────────────────────────────────────────
// Equipas da competição (quadro competitivo)
// ─────────────────────────────────────────────

// Equipas ordenadas por posição (seed) ascendente, com os sem seed no fim, e o
// nome como desempate. O Postgres ordena NULLS LAST por defeito em ASC.
const ORDER_EQUIPAS: Prisma.EquipaCompeticaoOrderByWithRelationInput[] = [
  { posicao: { sort: "asc", nulls: "last" } },
  { nome: "asc" },
];

export async function obterEquipasCompeticao(
  competicaoId: string,
): Promise<Resultado<EquipaCompeticao[]>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const competicao = await prisma.competicao.findFirst({
    where: { id: competicaoId, clubeId },
    select: { id: true, escalaoId: true },
  });
  if (!competicao) return erro("Competição não encontrada");
  if (!(await podeLerEscalao(competicao.escalaoId)))
    return erro("Sem permissão neste escalão");

  const equipas = await prisma.equipaCompeticao.findMany({
    where: { competicaoId },
    orderBy: ORDER_EQUIPAS,
  });
  return ok(equipas);
}

export async function adicionarEquipaCompeticao(
  competicaoId: string,
  dados: { nome: string; posicao?: number },
): Promise<Resultado<EquipaCompeticao>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const parsed = equipaCompeticaoSchema.safeParse(dados);
  if (!parsed.success) return erroDeValidacao(parsed.error);

  const competicao = await prisma.competicao.findFirst({
    where: { id: competicaoId, clubeId },
    select: { id: true, escalaoId: true },
  });
  if (!competicao) return erro("Competição não encontrada");

  const perm = await exigirCapacidade("COMPETICOES_GERIR", competicao.escalaoId);
  if (!perm.ok) return erro(perm.erro);

  const nome = parsed.data.nome.trim();

  // Unicidade case-insensitive dentro da competição.
  const duplicada = await prisma.equipaCompeticao.findFirst({
    where: { competicaoId, nome: { equals: nome, mode: "insensitive" } },
    select: { id: true },
  });
  if (duplicada) return erro("Já existe uma equipa com esse nome nesta competição");

  const equipa = await prisma.equipaCompeticao.create({
    data: { competicaoId, nome, posicao: parsed.data.posicao ?? null },
  });
  revalidatePath(`${PATH}/${competicaoId}`);
  return ok(equipa);
}

export async function removerEquipaCompeticao(equipaId: string): Promise<Resultado<void>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const equipa = await prisma.equipaCompeticao.findFirst({
    where: { id: equipaId, competicao: { clubeId } },
    select: {
      id: true,
      nome: true,
      competicaoId: true,
      competicao: { select: { escalaoId: true } },
    },
  });
  if (!equipa) return erro("Equipa não encontrada");

  const perm = await exigirCapacidade("COMPETICOES_GERIR", equipa.competicao.escalaoId);
  if (!perm.ok) return erro(perm.erro);

  // Impede a remoção se a equipa já tem jogos REALIZADOS (casa ou fora): apagá-la
  // deixaria a classificação inconsistente.
  const comResultado = await prisma.resultadoCompeticao.findFirst({
    where: {
      competicaoId: equipa.competicaoId,
      estado: "REALIZADO",
      OR: [{ equipaCasa: equipa.nome }, { equipaFora: equipa.nome }],
    },
    select: { id: true },
  });
  if (comResultado)
    return erro("Não é possível remover: a equipa já tem jogos realizados nesta competição");

  await prisma.equipaCompeticao.delete({ where: { id: equipaId } });
  revalidatePath(`${PATH}/${equipa.competicaoId}`);
  return ok(undefined);
}

// ─────────────────────────────────────────────
// Geração do quadro competitivo (calendário)
// ─────────────────────────────────────────────

export async function gerarQuadroCompeticao(
  competicaoId: string,
  opcoes: { duasMaos?: boolean } = {},
): Promise<Resultado<ResultadoCompeticao[]>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const competicao = await prisma.competicao.findFirst({
    where: { id: competicaoId, clubeId },
    include: { equipas: { orderBy: ORDER_EQUIPAS } },
  });
  if (!competicao) return erro("Competição não encontrada");

  const perm = await exigirCapacidade("COMPETICOES_GERIR", competicao.escalaoId);
  if (!perm.ok) return erro(perm.erro);

  if (competicao.equipas.length < 2)
    return erro("Adiciona pelo menos 2 equipas antes de gerar o quadro");

  // Não regenerar por cima de um quadro já agendado (evita duplicar jogos).
  const jaAgendado = await prisma.resultadoCompeticao.findFirst({
    where: { competicaoId, estado: "AGENDADO" },
    select: { id: true },
  });
  if (jaAgendado)
    return erro("Quadro já gerado. Apaga os jogos agendados antes de regenerar.");

  const equipas: Equipa[] = competicao.equipas.map((e) => ({
    nome: e.nome,
    posicao: e.posicao,
  }));

  const jogos =
    competicao.formato === "LIGA"
      ? gerarLiga(equipas, opcoes.duasMaos ?? false)
      : gerarBracket(equipas);

  if (jogos.length === 0) return erro("Não foi possível gerar jogos para este quadro");

  await prisma.resultadoCompeticao.createMany({
    data: jogos.map((j) => ({
      competicaoId,
      equipaCasa: j.equipaCasa,
      equipaFora: j.equipaFora,
      ronda: j.ronda,
      golosCasa: null,
      golosFora: null,
      estado: "AGENDADO" as const,
    })),
  });

  // createMany não devolve os registos: relê o quadro gerado para retornar.
  const criados = await prisma.resultadoCompeticao.findMany({
    where: { competicaoId, estado: "AGENDADO" },
    orderBy: [{ ronda: "asc" }, { criadoEm: "asc" }],
  });
  revalidatePath(`${PATH}/${competicaoId}`);
  return ok(criados);
}

// ─────────────────────────────────────────────
// Criação completa (wizard) — base + equipas + jogos pré-agendados
// ─────────────────────────────────────────────

export async function criarCompeticaoCompleta(dados: unknown): Promise<Resultado<Competicao>> {
  const parsed = criarCompeticaoCompletaSchema.safeParse(dados);
  if (!parsed.success) return erroDeValidacao(parsed.error);

  const perm = await exigirCapacidade("COMPETICOES_GERIR", parsed.data.escalaoId);
  if (!perm.ok) return erro(perm.erro);

  const clubeId = perm.ctx.clube.id;

  const epoca = await obterEpocaAtiva();
  if (!epoca) return erro("Nenhuma época ativa");

  const escalao = await prisma.escalao.findFirst({
    where: { id: parsed.data.escalaoId, clubeId },
  });
  if (!escalao) return erro("O escalão selecionado não existe");

  // Nomes de equipa únicos (case-insensitive) dentro da competição.
  const nomes = parsed.data.equipas.map((e) => e.nome.trim());
  const vistos = new Set<string>();
  for (const n of nomes) {
    const chave = n.toLowerCase();
    if (vistos.has(chave)) return erro(`Equipa duplicada: "${n}"`);
    vistos.add(chave);
  }

  // Jogos pré-agendados só podem referir equipas declaradas.
  const nomesValidos = new Set(nomes.map((n) => n.toLowerCase()));
  for (const j of parsed.data.jogos) {
    const casa = j.equipaCasa.trim();
    const fora = j.equipaFora.trim();
    if (casa.toLowerCase() === fora.toLowerCase())
      return erro("Um jogo não pode ter a mesma equipa em casa e fora");
    if (!nomesValidos.has(casa.toLowerCase()) || !nomesValidos.has(fora.toLowerCase()))
      return erro("Um jogo agendado refere uma equipa que não está na lista");
  }

  const competicao = await prisma.$transaction(async (tx) => {
    const comp = await tx.competicao.create({
      data: {
        clubeId,
        escalaoId: parsed.data.escalaoId,
        epocaId: epoca.id,
        nome: parsed.data.nome,
        tipo: parsed.data.tipo,
        formato: parsed.data.formato,
        formatoJogo: parsed.data.formatoJogo ?? null,
      },
    });

    await tx.equipaCompeticao.createMany({
      data: parsed.data.equipas.map((e) => ({
        competicaoId: comp.id,
        nome: e.nome.trim(),
        posicao: e.posicao ?? null,
      })),
    });

    if (parsed.data.jogos.length > 0) {
      await tx.resultadoCompeticao.createMany({
        data: parsed.data.jogos.map((j) => ({
          competicaoId: comp.id,
          equipaCasa: j.equipaCasa.trim(),
          equipaFora: j.equipaFora.trim(),
          ronda: j.ronda ?? null,
          dataHora: j.dataHora ?? null,
          golosCasa: null,
          golosFora: null,
          estado: "AGENDADO" as const,
        })),
      });
    }

    return comp;
  });

  revalidatePath(PATH);
  return ok(competicao);
}

// ─────────────────────────────────────────────
// Agendamento de um jogo do quadro
// ─────────────────────────────────────────────

export async function atualizarAgendamentoJogo(
  resultadoId: string,
  dataHora: Date | null,
): Promise<Resultado<void>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const parsed = atualizarAgendamentoSchema.safeParse({ resultadoId, dataHora });
  if (!parsed.success) return erroDeValidacao(parsed.error);

  const resultado = await prisma.resultadoCompeticao.findFirst({
    where: { id: resultadoId, competicao: { clubeId } },
    select: {
      id: true,
      competicaoId: true,
      competicao: { select: { escalaoId: true } },
    },
  });
  if (!resultado) return erro("Jogo não encontrado");

  const perm = await exigirCapacidade("COMPETICOES_GERIR", resultado.competicao.escalaoId);
  if (!perm.ok) return erro(perm.erro);

  await prisma.resultadoCompeticao.update({
    where: { id: resultadoId },
    data: { dataHora: parsed.data.dataHora ?? null },
  });
  revalidatePath(`${PATH}/${resultado.competicaoId}`);
  return ok(undefined);
}
