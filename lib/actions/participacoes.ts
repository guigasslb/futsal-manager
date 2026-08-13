"use server";

import { revalidatePath } from "next/cache";
import { Prisma, type AtletaEscalao } from "@prisma/client";
import { prisma } from "@/lib/db";
import { obterEpocaAtiva, obterClubeIdAtual } from "@/lib/epoca-context";
import { exigirCapacidade, podeLerAlgumEscalao } from "@/lib/permissoes";
import { ok, erro, erroDeValidacao, type Resultado } from "@/lib/utils";
import {
  associarAEscalaoSchema,
  transferirEscalaoSchema,
  terminarParticipacaoSchema,
  ficariaSemPrincipal,
  principaisADespromover,
} from "@/lib/schemas/participacao";

const PATH = "/plantel";
// O dashboard conta atletas por participações ativas (secção 8.16) — qualquer
// mutação de participação invalida também esse contador.
const PATH_DASHBOARD = "/dashboard";

/** Invalida as rotas afetadas por uma mutação de participação. */
function revalidarParticipacao(atletaId: string): void {
  revalidatePath(PATH);
  revalidatePath(`${PATH}/${atletaId}`);
  revalidatePath(PATH_DASHBOARD);
}

/** Época a usar: a indicada (validada contra o clube) ou a ativa. */
async function resolverEpocaId(
  clubeId: string,
  epocaId?: string,
): Promise<{ ok: true; epocaId: string } | { ok: false; erro: string }> {
  if (epocaId) {
    const epoca = await prisma.epoca.findFirst({
      where: { id: epocaId, clubeId },
      select: { id: true },
    });
    if (!epoca) return { ok: false, erro: "A época selecionada não existe" };
    return { ok: true, epocaId: epoca.id };
  }

  const ativa = await obterEpocaAtiva();
  if (!ativa)
    return {
      ok: false,
      erro: "Nenhuma época ativa definida. Define uma época ativa antes de gerir participações.",
    };
  return { ok: true, epocaId: ativa.id };
}

// Número de camisola: NÃO é único (secção 9 — «dois atletas com o mesmo número:
// permitido; aviso não-bloqueante por escalão»). O aviso é responsabilidade da
// UI (lista do plantel); as actions gravam o número tal como indicado.

// ─── Associar a escalão ──────────────────────────────────────────────────────

export async function associarAEscalao(
  dados: unknown,
): Promise<Resultado<AtletaEscalao>> {
  const parsed = associarAEscalaoSchema.safeParse(dados);
  if (!parsed.success) return erroDeValidacao(parsed.error);

  const perm = await exigirCapacidade("PLANTEL_GERIR", parsed.data.escalaoId);
  if (!perm.ok) return erro(perm.erro);
  const clubeId = perm.ctx.clube.id;

  const atleta = await prisma.atleta.findFirst({
    where: { id: parsed.data.atletaId, clubeId },
    select: { id: true },
  });
  if (!atleta) return erro("Atleta não encontrado");

  const escalao = await prisma.escalao.findFirst({
    where: { id: parsed.data.escalaoId, clubeId },
    select: { id: true },
  });
  if (!escalao) return erro("O escalão selecionado não existe");

  const epoca = await resolverEpocaId(clubeId, parsed.data.epocaId);
  if (!epoca.ok) return erro(epoca.erro);

  // Número duplicado é permitido (secção 9): sem validação de unicidade.
  const numero = parsed.data.numero ?? null;

  try {
    const participacao = await prisma.atletaEscalao.create({
      data: {
        atletaId: atleta.id,
        escalaoId: parsed.data.escalaoId,
        epocaId: epoca.epocaId,
        tipo: parsed.data.tipo,
        estado: "ATIVO",
        numero,
        dataInicio: new Date(),
      },
    });
    revalidarParticipacao(atleta.id);
    return ok(participacao);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")
      return erro("O atleta já participa neste escalão nesta época.");
    throw e;
  }
}

// ─── Transferir de escalão ───────────────────────────────────────────────────

export async function transferirEscalao(
  dados: unknown,
): Promise<Resultado<AtletaEscalao>> {
  const parsed = transferirEscalaoSchema.safeParse(dados);
  if (!parsed.success) return erroDeValidacao(parsed.error);

  // Exige permissão nos DOIS escalões (origem e destino).
  const permOrigem = await exigirCapacidade("PLANTEL_GERIR", parsed.data.deEscalaoId);
  if (!permOrigem.ok) return erro(permOrigem.erro);
  const permDestino = await exigirCapacidade("PLANTEL_GERIR", parsed.data.paraEscalaoId);
  if (!permDestino.ok) return erro(permDestino.erro);
  const clubeId = permOrigem.ctx.clube.id;

  const atleta = await prisma.atleta.findFirst({
    where: { id: parsed.data.atletaId, clubeId },
    select: { id: true },
  });
  if (!atleta) return erro("Atleta não encontrado");

  const escaloes = await prisma.escalao.findMany({
    where: { id: { in: [parsed.data.deEscalaoId, parsed.data.paraEscalaoId] }, clubeId },
    select: { id: true },
  });
  if (escaloes.length !== 2) return erro("Um dos escalões selecionados não existe");

  const epoca = await resolverEpocaId(clubeId, parsed.data.epocaId);
  if (!epoca.ok) return erro(epoca.erro);

  const agora = new Date();
  const destinoRef = {
    escalaoId: parsed.data.paraEscalaoId,
    tipo: parsed.data.tipo,
  };

  // ⚠️ CAMPO LEGADO NÃO SINCRONIZADO: esta transferência opera exclusivamente
  // sobre `AtletaEscalao` (fonte de verdade da fase expand). O campo legado
  // `Atleta.escalaoId` (e `escalaoSecundarioId`) NÃO é atualizado aqui — após
  // uma transferência, o legado diverge intencionalmente da participação real.
  // A fase M4 (contract) deve remover a dependência do campo legado e passar a
  // ler SEMPRE de `AtletaEscalao`, nunca de `Atleta.escalaoId`. Não reintroduzir
  // escrita ao legado aqui: seria mascarar o problema, não resolvê-lo.

  // Tudo — leitura das participações ativas, validação do invariante do
  // principal (secção 9), encerramento da origem, despromoção de um eventual
  // segundo principal e upsert do destino — corre numa única transação
  // Serializable: o invariante é imposto na escrita, não só na leitura (evita
  // TOCTOU entre duas transferências concorrentes do mesmo atleta).
  const resultado = await prisma.$transaction(
    async (tx): Promise<{ erro: string } | { destino: AtletaEscalao }> => {
      const ativas = await tx.atletaEscalao.findMany({
        where: { atletaId: atleta.id, epocaId: epoca.epocaId, estado: "ATIVO" },
        select: { id: true, escalaoId: true, tipo: true, numero: true },
      });

      const origem = ativas.find((p) => p.escalaoId === parsed.data.deEscalaoId);
      if (!origem)
        return { erro: "O atleta não tem uma participação ativa no escalão de origem." };

      // A transferência não pode deixar o atleta sem participação principal.
      if (ficariaSemPrincipal(ativas, destinoRef, [parsed.data.deEscalaoId]))
        return {
          erro: "A transferência deixaria o atleta sem participação principal nesta época. Escolhe o tipo «Principal» no escalão de destino.",
        };

      // Número duplicado é permitido (secção 9): sem validação de unicidade.
      const numero = parsed.data.numero ?? origem.numero ?? null;

      await tx.atletaEscalao.update({
        where: { id: origem.id },
        data: { estado: "TRANSICAO_PERMANENTE", dataFim: agora },
      });

      // Um destino PRINCIPAL despromove qualquer outro principal que sobrasse
      // ativo, garantindo o principal único por atleta/época.
      for (const outro of principaisADespromover(ativas, destinoRef, [
        parsed.data.deEscalaoId,
      ])) {
        await tx.atletaEscalao.update({
          where: { id: outro.id },
          data: { tipo: "SIMULTANEA" },
        });
      }

      const destino = await tx.atletaEscalao.upsert({
        where: {
          atletaId_escalaoId_epocaId: {
            atletaId: atleta.id,
            escalaoId: parsed.data.paraEscalaoId,
            epocaId: epoca.epocaId,
          },
        },
        create: {
          atletaId: atleta.id,
          escalaoId: parsed.data.paraEscalaoId,
          epocaId: epoca.epocaId,
          tipo: parsed.data.tipo,
          estado: "ATIVO",
          numero,
          dataInicio: agora,
        },
        update: {
          tipo: parsed.data.tipo,
          estado: "ATIVO",
          numero,
          // Reentrada num escalão onde já houve participação: a nova etapa
          // começa agora (não herda a dataInicio da participação anterior).
          dataInicio: agora,
          dataFim: null,
        },
      });

      return { destino };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );

  if ("erro" in resultado) return erro(resultado.erro);

  revalidarParticipacao(atleta.id);
  return ok(resultado.destino);
}

// ─── Terminar participação ───────────────────────────────────────────────────

export async function terminarParticipacao(
  dados: unknown,
): Promise<Resultado<AtletaEscalao>> {
  const parsed = terminarParticipacaoSchema.safeParse(dados);
  if (!parsed.success) return erroDeValidacao(parsed.error);

  // PROMOVER_ATLETAS é uma capacidade de clube (não limitada por escalão).
  const perm = await exigirCapacidade("PROMOVER_ATLETAS");
  if (!perm.ok) return erro(perm.erro);
  const clubeId = perm.ctx.clube.id;

  const atleta = await prisma.atleta.findFirst({
    where: { id: parsed.data.atletaId, clubeId },
    select: { id: true },
  });
  if (!atleta) return erro("Atleta não encontrado");

  const epoca = await resolverEpocaId(clubeId, parsed.data.epocaId);
  if (!epoca.ok) return erro(epoca.erro);

  // ⚠️ CAMPO LEGADO NÃO SINCRONIZADO: o término de participação atua apenas
  // sobre `AtletaEscalao` (fonte de verdade). O campo legado `Atleta.escalaoId`
  // NÃO é atualizado aqui — após terminar uma participação, o legado pode
  // continuar a apontar para um escalão onde o atleta já não participa. A fase
  // M4 (contract) deve usar `AtletaEscalao` como fonte de verdade única, não o
  // campo legado. Não reintroduzir escrita ao legado aqui.

  // Leitura + escrita na mesma transação Serializable: o invariante «o atleta
  // tem sempre uma participação principal» (secção 9) é imposto na escrita.
  const resultado = await prisma.$transaction(
    async (tx): Promise<{ erro: string } | { terminada: AtletaEscalao }> => {
      const participacao = await tx.atletaEscalao.findFirst({
        where: {
          atletaId: atleta.id,
          escalaoId: parsed.data.escalaoId,
          epocaId: epoca.epocaId,
          estado: "ATIVO",
        },
        select: { id: true, tipo: true },
      });
      if (!participacao)
        return { erro: "O atleta não tem uma participação ativa neste escalão." };

      if (participacao.tipo === "PRINCIPAL")
        return {
          erro: "Não é possível terminar a participação principal. Transfira o atleta para outro escalão principal primeiro.",
        };

      const terminada = await tx.atletaEscalao.update({
        where: { id: participacao.id },
        data: { estado: "INATIVO", dataFim: new Date() },
      });
      return { terminada };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );

  if ("erro" in resultado) return erro(resultado.erro);

  revalidarParticipacao(atleta.id);
  return ok(resultado.terminada);
}

// ─── Leitura (histórico de participações) ────────────────────────────────────

export interface ParticipacaoHistorico {
  id: string;
  escalaoId: string;
  escalaoNome: string;
  epocaId: string;
  epocaNome: string;
  tipo: AtletaEscalao["tipo"];
  estado: AtletaEscalao["estado"];
  numero: number | null;
  dataInicio: Date;
  dataFim: Date | null;
}

/** Histórico completo de participações de um atleta (todas as épocas). */
export async function listarParticipacoes(
  atletaId: string,
): Promise<Resultado<ParticipacaoHistorico[]>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const atleta = await prisma.atleta.findFirst({
    where: { id: atletaId, clubeId },
    select: { id: true },
  });
  if (!atleta) return erro("Atleta não encontrado");

  const participacoes = await prisma.atletaEscalao.findMany({
    where: { atletaId, escalao: { clubeId } },
    include: {
      escalao: { select: { nome: true } },
      epoca: { select: { nome: true } },
    },
    orderBy: [{ dataInicio: "desc" }],
  });

  // Âmbito de leitura (secção 6.4): o histórico só é visível a quem possa ler
  // pelo menos um dos escalões onde o atleta participou.
  const escalaoIds = participacoes.map((p) => p.escalaoId);
  if (escalaoIds.length > 0 && !(await podeLerAlgumEscalao(escalaoIds)))
    return erro("Sem permissão para ler estes escalões");

  return ok(
    participacoes.map((p) => ({
      id: p.id,
      escalaoId: p.escalaoId,
      escalaoNome: p.escalao.nome,
      epocaId: p.epocaId,
      epocaNome: p.epoca.nome,
      tipo: p.tipo,
      estado: p.estado,
      numero: p.numero,
      dataInicio: p.dataInicio,
      dataFim: p.dataFim,
    })),
  );
}

// ─── Leitura (carreira / percurso do atleta) ─────────────────────────────────

/**
 * Uma etapa do percurso do atleta (época/escalão), para a aba «Carreira».
 * Vista só-de-leitura: os campos `dataIngresso`/`dataSaida` correspondem ao
 * início e fim da participação (AtletaEscalao.dataInicio/dataFim).
 */
export interface CarreiraEntry {
  id: string;
  epocaNome: string;
  /** A época em contexto é a época ativa do clube (marca a etapa atual). */
  epocaAtiva: boolean;
  escalaoNome: string;
  numero: number | null;
  estado: AtletaEscalao["estado"];
  dataIngresso: Date;
  dataSaida: Date | null;
}

/**
 * Percurso completo do atleta ao longo das épocas (aba «Carreira», secção 8.5).
 * Vista só-de-leitura sobre AtletaEscalao — sem ações de gestão (essas vivem na
 * aba «Participações»). Ordenado da época mais recente para a mais antiga.
 */
export async function obterCarreiraAtleta(
  atletaId: string,
): Promise<Resultado<CarreiraEntry[]>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const atleta = await prisma.atleta.findFirst({
    where: { id: atletaId, clubeId },
    select: { id: true },
  });
  if (!atleta) return erro("Atleta não encontrado");

  const participacoes = await prisma.atletaEscalao.findMany({
    where: { atletaId, escalao: { clubeId } },
    include: {
      escalao: { select: { nome: true } },
      epoca: { select: { nome: true, ativa: true } },
    },
    // Época mais recente primeiro; dentro da época, a etapa mais recente primeiro.
    orderBy: [{ epoca: { dataInicio: "desc" } }, { dataInicio: "desc" }],
  });

  // Âmbito de leitura (secção 6.4): o percurso só é visível a quem possa ler
  // pelo menos um dos escalões onde o atleta participou.
  const escalaoIds = participacoes.map((p) => p.escalaoId);
  if (escalaoIds.length > 0 && !(await podeLerAlgumEscalao(escalaoIds)))
    return erro("Sem permissão para ler estes escalões");

  return ok(
    participacoes.map((p) => ({
      id: p.id,
      epocaNome: p.epoca.nome,
      epocaAtiva: p.epoca.ativa,
      escalaoNome: p.escalao.nome,
      numero: p.numero,
      estado: p.estado,
      dataIngresso: p.dataInicio,
      dataSaida: p.dataFim,
    })),
  );
}
