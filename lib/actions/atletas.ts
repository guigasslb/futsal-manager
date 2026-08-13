"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { obterEpocaAtiva, obterClubeIdAtual } from "@/lib/epoca-context";
import {
  exigirCapacidade,
  exigirCapacidadeEmAlgumEscalao,
  podeLerEscalao,
  podeLerAlgumEscalao,
  escaloesLegiveis,
} from "@/lib/permissoes";
import { ok, erro, erroDeValidacao, type Resultado } from "@/lib/utils";
import {
  criarAtletaSchema,
  atualizarAtletaSchema,
  apagarAtletaDefinitivamenteSchema,
} from "@/lib/schemas/atleta";
import { agregarEstatisticas, type EstatisticasAgregadas } from "@/lib/estatisticas";
import type {
  Atleta,
  EstadoParticipacao,
  Posicao,
  TipoParticipacao,
} from "@prisma/client";

const PATH = "/plantel";
// O dashboard conta atletas por participações ativas (secção 8.16): criar ou
// desativar um atleta muda esse contador, logo invalida também /dashboard.
const PATH_DASHBOARD = "/dashboard";

export type { EstatisticasAgregadas };

// ─── Tipos de leitura (F1 — atleta do clube + participações) ─────────────────

/** Resumo de uma participação (AtletaEscalao) para consumo na UI. */
export interface ParticipacaoResumo {
  id: string;
  escalaoId: string;
  escalaoNome: string;
  tipo: TipoParticipacao;
  estado: EstadoParticipacao;
  numero: number | null;
  dataInicio: Date;
  dataFim: Date | null;
}

/** Dados pessoais do atleta (sem escalão/número — esses vivem na participação). */
export interface AtletaPessoal {
  id: string;
  nome: string;
  dataNascimento: Date | null;
  posicoes: Posicao[];
  observacoes: string | null;
  fotoUrl: string | null;
  ativo: boolean;
  dataIngresso: Date | null;
  encarregadoNome: string | null;
  encarregadoContacto: string | null;
  encarregadoEmail: string | null;
  clubeId: string | null;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface AtletaComParticipacao extends AtletaPessoal {
  /** Participações ATIVAS na época em contexto. */
  participacoes: ParticipacaoResumo[];
  /**
   * Participação do escalão em contexto (quando a listagem é filtrada por escalão),
   * ou a PRINCIPAL. É daqui que sai o número de camisola a mostrar.
   */
  participacaoContexto: ParticipacaoResumo | null;
}

export interface AtletaDetalhe extends AtletaComParticipacao {
  epocaId: string;
  epocaNome: string;
}

const SELECT_PESSOAL = {
  id: true,
  nome: true,
  dataNascimento: true,
  posicoes: true,
  observacoes: true,
  fotoUrl: true,
  ativo: true,
  dataIngresso: true,
  encarregadoNome: true,
  encarregadoContacto: true,
  encarregadoEmail: true,
  clubeId: true,
  criadoEm: true,
  atualizadoEm: true,
} as const;

const INCLUDE_ESCALAO_NOME = { escalao: { select: { nome: true } } } as const;

type ParticipacaoBruta = {
  id: string;
  escalaoId: string;
  tipo: TipoParticipacao;
  estado: EstadoParticipacao;
  numero: number | null;
  dataInicio: Date;
  dataFim: Date | null;
  escalao: { nome: string };
};

function paraResumo(p: ParticipacaoBruta): ParticipacaoResumo {
  return {
    id: p.id,
    escalaoId: p.escalaoId,
    escalaoNome: p.escalao.nome,
    tipo: p.tipo,
    estado: p.estado,
    numero: p.numero,
    dataInicio: p.dataInicio,
    dataFim: p.dataFim,
  };
}

/** Participação a usar como contexto: a do escalão pedido, a PRINCIPAL, ou a primeira. */
function escolherContexto(
  participacoes: ParticipacaoResumo[],
  escalaoId?: string,
): ParticipacaoResumo | null {
  if (escalaoId) {
    const doEscalao = participacoes.find((p) => p.escalaoId === escalaoId);
    if (doEscalao) return doEscalao;
  }
  return participacoes.find((p) => p.tipo === "PRINCIPAL") ?? participacoes[0] ?? null;
}

/**
 * Um atleta é visível se o membro puder ler algum dos escalões onde participa.
 * Atletas sem qualquer participação só são visíveis com âmbito de todo o clube.
 */
async function podeVerAtleta(escalaoIds: string[]): Promise<boolean> {
  if (escalaoIds.length === 0) return (await escaloesLegiveis()) === "TODOS";
  return podeLerAlgumEscalao(escalaoIds);
}

/** Época em contexto: a indicada (validada contra o clube) ou a ativa. */
async function resolverEpoca(
  clubeId: string,
  epocaId?: string,
): Promise<{ id: string; nome: string } | null> {
  if (epocaId) {
    return prisma.epoca.findFirst({
      where: { id: epocaId, clubeId },
      select: { id: true, nome: true },
    });
  }
  const ativa = await obterEpocaAtiva();
  return ativa ? { id: ativa.id, nome: ativa.nome } : null;
}

// ─── Leitura ─────────────────────────────────────────────────────────────────

export async function listarAtletas(
  escalaoId?: string,
  epocaId?: string,
): Promise<Resultado<AtletaComParticipacao[]>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const epoca = await resolverEpoca(clubeId, epocaId);
  if (!epoca) return erro("Nenhuma época ativa");

  // Filtrado por escalão: a listagem é conduzida pelas participações desse escalão.
  if (escalaoId) {
    if (!(await podeLerEscalao(escalaoId))) return ok([]);

    const participacoes = await prisma.atletaEscalao.findMany({
      where: {
        escalaoId,
        epocaId: epoca.id,
        estado: "ATIVO",
        atleta: { ativo: true, clubeId },
      },
      include: {
        ...INCLUDE_ESCALAO_NOME,
        atleta: {
          select: {
            ...SELECT_PESSOAL,
            participacoes: {
              where: { epocaId: epoca.id, estado: "ATIVO" },
              include: INCLUDE_ESCALAO_NOME,
            },
          },
        },
      },
      orderBy: [{ numero: "asc" }, { atleta: { nome: "asc" } }],
    });

    return ok(
      participacoes.map((p) => {
        const todas = p.atleta.participacoes.map(paraResumo);
        return {
          ...p.atleta,
          participacoes: todas,
          participacaoContexto: escolherContexto(todas, escalaoId),
        };
      }),
    );
  }

  // Sem filtro: todos os atletas do clube com participação ativa na época,
  // restringido aos escalões legíveis (secção 6.4).
  const legiveis = await escaloesLegiveis();
  const filtroLegiveis =
    legiveis === "TODOS" ? {} : { escalaoId: { in: legiveis } };

  const atletas = await prisma.atleta.findMany({
    where: {
      clubeId,
      ativo: true,
      participacoes: {
        some: { epocaId: epoca.id, estado: "ATIVO", ...filtroLegiveis },
      },
    },
    select: {
      ...SELECT_PESSOAL,
      participacoes: {
        where: { epocaId: epoca.id, estado: "ATIVO" },
        include: INCLUDE_ESCALAO_NOME,
      },
    },
    orderBy: { nome: "asc" },
  });

  return ok(
    atletas.map((a) => {
      const todas = a.participacoes.map(paraResumo);
      return {
        ...a,
        participacoes: todas,
        participacaoContexto: escolherContexto(todas),
      };
    }),
  );
}

export async function obterAtleta(
  id: string,
  escalaoId?: string,
): Promise<Resultado<AtletaDetalhe>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const epoca = await resolverEpoca(clubeId, undefined);
  if (!epoca) return erro("Nenhuma época ativa");

  const atleta = await prisma.atleta.findFirst({
    where: { id, clubeId },
    select: {
      ...SELECT_PESSOAL,
      participacoes: {
        where: { epocaId: epoca.id, estado: "ATIVO" },
        include: INCLUDE_ESCALAO_NOME,
      },
    },
  });
  if (!atleta) return erro("Atleta não encontrado");

  const participacoes = atleta.participacoes.map(paraResumo);
  if (!(await podeVerAtleta(participacoes.map((p) => p.escalaoId))))
    return erro("Sem permissão neste escalão");

  return ok({
    ...atleta,
    participacoes,
    participacaoContexto: escolherContexto(participacoes, escalaoId),
    epocaId: epoca.id,
    epocaNome: epoca.nome,
  });
}

// ─── Escrita ─────────────────────────────────────────────────────────────────

export async function criarAtleta(dados: unknown): Promise<Resultado<Atleta>> {
  const parsed = criarAtletaSchema.safeParse(dados);
  if (!parsed.success) return erroDeValidacao(parsed.error);

  const { participacaoInicial, ...pessoal } = parsed.data;

  const perm = await exigirCapacidade("PLANTEL_GERIR", participacaoInicial.escalaoId);
  if (!perm.ok) return erro(perm.erro);
  const clubeId = perm.ctx.clube.id;

  const epoca = await obterEpocaAtiva();
  if (!epoca)
    return erro("Nenhuma época ativa definida. Define uma época ativa antes de criar atletas.");

  const escalao = await prisma.escalao.findFirst({
    where: { id: participacaoInicial.escalaoId, clubeId },
    select: { id: true },
  });
  if (!escalao) return erro("O escalão selecionado não existe");

  // Número duplicado é permitido (secção 9 — «dois atletas com o mesmo número:
  // permitido; aviso não-bloqueante por escalão»). O aviso vive na lista do
  // plantel; a action não valida unicidade.
  const numero = participacaoInicial.numero ?? null;

  const dataInicio = pessoal.dataIngresso ?? new Date();

  // Dual-write (fase expand): os campos legados do Atleta continuam a ser escritos
  // até M4 os remover, para permitir rollback de código sem migração.
  const atleta = await prisma.$transaction(async (tx) => {
    const criado = await tx.atleta.create({
      data: {
        nome: pessoal.nome,
        clubeId,
        posicoes: pessoal.posicoes,
        dataNascimento: pessoal.dataNascimento ?? null,
        dataIngresso: pessoal.dataIngresso ?? null,
        observacoes: pessoal.observacoes ?? null,
        fotoUrl: pessoal.fotoUrl ? pessoal.fotoUrl : null,
        encarregadoNome: pessoal.encarregadoNome ?? null,
        encarregadoContacto: pessoal.encarregadoContacto ?? null,
        encarregadoEmail: pessoal.encarregadoEmail ? pessoal.encarregadoEmail : null,
        // LEGADO (expand) — remover em M4.
        escalaoId: participacaoInicial.escalaoId,
        epocaId: epoca.id,
        numero,
      },
    });

    await tx.atletaEscalao.create({
      data: {
        atletaId: criado.id,
        escalaoId: participacaoInicial.escalaoId,
        epocaId: epoca.id,
        tipo: participacaoInicial.tipo,
        estado: "ATIVO",
        numero,
        dataInicio,
      },
    });

    return criado;
  });

  revalidatePath(PATH);
  revalidatePath(PATH_DASHBOARD);
  return ok(atleta);
}

export async function atualizarAtleta(
  id: string,
  dados: unknown,
): Promise<Resultado<Atleta>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const parsed = atualizarAtletaSchema.safeParse(dados);
  if (!parsed.success) return erroDeValidacao(parsed.error);

  const existe = await prisma.atleta.findFirst({
    where: { id, clubeId },
    select: {
      id: true,
      participacoes: { where: { estado: "ATIVO" }, select: { escalaoId: true } },
    },
  });
  if (!existe) return erro("Atleta não encontrado");

  const perm = await exigirCapacidadeEmAlgumEscalao(
    "PLANTEL_GERIR",
    existe.participacoes.map((p) => p.escalaoId),
  );
  if (!perm.ok) return erro(perm.erro);

  // Campos opcionais: undefined não limpa o valor existente no Prisma — usar null explicitamente.
  const atleta = await prisma.atleta.update({
    where: { id },
    data: {
      nome: parsed.data.nome,
      posicoes: parsed.data.posicoes,
      dataNascimento: parsed.data.dataNascimento ?? null,
      dataIngresso: parsed.data.dataIngresso ?? null,
      observacoes: parsed.data.observacoes ?? null,
      fotoUrl: parsed.data.fotoUrl ? parsed.data.fotoUrl : null,
      encarregadoNome: parsed.data.encarregadoNome ?? null,
      encarregadoContacto: parsed.data.encarregadoContacto ?? null,
      encarregadoEmail: parsed.data.encarregadoEmail ? parsed.data.encarregadoEmail : null,
    },
  });
  revalidatePath(PATH);
  revalidatePath(`${PATH}/${id}`);
  return ok(atleta);
}

export async function apagarAtleta(id: string): Promise<Resultado<void>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const existe = await prisma.atleta.findFirst({
    where: { id, clubeId },
    select: {
      id: true,
      participacoes: { where: { estado: "ATIVO" }, select: { escalaoId: true } },
    },
  });
  if (!existe) return erro("Atleta não encontrado");

  const perm = await exigirCapacidadeEmAlgumEscalao(
    "PLANTEL_GERIR",
    existe.participacoes.map((p) => p.escalaoId),
  );
  if (!perm.ok) return erro(perm.erro);

  await prisma.atleta.update({ where: { id }, data: { ativo: false } });
  revalidatePath(PATH);
  revalidatePath(`${PATH}/${id}`);
  revalidatePath(PATH_DASHBOARD);
  return ok(undefined);
}

/**
 * Hard-delete definitivo do atleta (P1.3 — RGPD, direito ao apagamento de menores).
 *
 * Ao contrário de `apagarAtleta` (soft-delete: ativo=false), esta ação remove
 * IRREVERSIVELMENTE o atleta e todos os dados pessoais associados. As FK com
 * onDelete: Cascade (presenças, convocatórias, participações, caderneta, eventos
 * de jogo, consentimentos e — transitivamente — valores de métricas) garantem a
 * limpeza em cadeia.
 *
 * Guarda de segurança: recusa apagar atletas com estatísticas de jogo registadas,
 * para que o clube possa exportar/preservar os dados desportivos antes do apagamento.
 */
export async function apagarAtletaDefinitivamente(
  atletaId: string,
): Promise<Resultado<void>> {
  const parsed = apagarAtletaDefinitivamenteSchema.safeParse({ atletaId });
  if (!parsed.success) return erroDeValidacao(parsed.error);

  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const existe = await prisma.atleta.findFirst({
    where: { id: parsed.data.atletaId, clubeId },
    select: {
      id: true,
      participacoes: { select: { escalaoId: true } },
      _count: { select: { estatisticas: true } },
    },
  });
  if (!existe) return erro("Atleta não encontrado");

  const perm = await exigirCapacidadeEmAlgumEscalao(
    "PLANTEL_GERIR",
    existe.participacoes.map((p) => p.escalaoId),
  );
  if (!perm.ok) return erro(perm.erro);

  if (existe._count.estatisticas > 0) {
    return erro(
      "Atleta com estatísticas registadas — exportar dados antes de apagar",
    );
  }

  // Os cascades do schema removem os dados relacionados (P1.3).
  await prisma.atleta.delete({ where: { id: parsed.data.atletaId } });

  revalidatePath(PATH);
  revalidatePath(`${PATH}/${atletaId}`);
  revalidatePath(PATH_DASHBOARD);
  return ok(undefined);
}

// ─── Estatísticas agregadas (secção 15) ──────────────────────────────────────

export async function obterEstatisticasAtleta(
  id: string,
  escalaoId?: string,
): Promise<Resultado<EstatisticasAgregadas>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const epoca = await obterEpocaAtiva();
  if (!epoca) return erro("Nenhuma época ativa");

  const atleta = await prisma.atleta.findFirst({
    where: { id, clubeId },
    select: {
      id: true,
      posicoes: true,
      criadoEm: true,
      dataIngresso: true,
      participacoes: {
        where: { epocaId: epoca.id, estado: "ATIVO" },
        select: { escalaoId: true, tipo: true },
      },
    },
  });
  if (!atleta) return erro("Atleta não encontrado");

  const escaloesAtivos = atleta.participacoes.map((p) => p.escalaoId);
  if (!(await podeVerAtleta(escaloesAtivos))) return erro("Sem permissão neste escalão");

  // Escalão de contexto: o pedido (tem de ser um onde o atleta participa) ou o principal.
  let escalaoCtx: string | null = null;
  if (escalaoId) {
    if (!escaloesAtivos.includes(escalaoId))
      return erro("O atleta não participa neste escalão nesta época");
    if (!(await podeLerEscalao(escalaoId))) return erro("Sem permissão neste escalão");
    escalaoCtx = escalaoId;
  } else {
    const principal = atleta.participacoes.find((p) => p.tipo === "PRINCIPAL");
    escalaoCtx = principal?.escalaoId ?? escaloesAtivos[0] ?? null;
  }

  const eGR = atleta.posicoes.includes("GUARDA_REDES");
  // Divisor da taxa de presença: sessões desde o ingresso (secção 22.3).
  const ingresso = atleta.dataIngresso ?? atleta.criadoEm;

  const [jogosConvocado, estatisticas, sessoesTotais, presencas] = await Promise.all([
    prisma.convocatoria.count({
      where: {
        convocado: true,
        atletaId: id,
        jogo: {
          epocaId: epoca.id,
          ...(escalaoCtx ? { escalaoId: escalaoCtx } : {}),
        },
      },
    }),
    prisma.estatisticaAtleta.findMany({
      where: {
        atletaId: id,
        jogo: {
          epocaId: epoca.id,
          ...(escalaoCtx ? { escalaoId: escalaoCtx } : {}),
        },
      },
    }),
    // Sessões do escalão de contexto na época, a partir do ingresso (secção 22.3).
    escalaoCtx
      ? prisma.sessao.count({
          where: { epocaId: epoca.id, escalaoId: escalaoCtx, data: { gte: ingresso } },
        })
      : Promise.resolve(0),
    // Presenças do atleta nesse escalão (F1 — Presenca.escalaoId).
    prisma.presenca.count({
      where: {
        atletaId: id,
        estado: { in: ["PRESENTE", "ATRASADO"] },
        // Simetria com o denominador (sessoesTotais): só presenças desde o ingresso (secção 22.3).
        sessao: { epocaId: epoca.id, data: { gte: ingresso } },
        ...(escalaoCtx ? { escalaoId: escalaoCtx } : {}),
      },
    }),
  ]);

  return ok(
    agregarEstatisticas({
      eGR,
      jogosConvocado,
      sessoesTotais,
      presencas,
      estatisticas,
    }),
  );
}
