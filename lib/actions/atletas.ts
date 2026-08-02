"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { obterEpocaAtiva, obterClubeIdAtual } from "@/lib/epoca-context";
import { exigirCapacidade, podeLerEscalao, escaloesLegiveis } from "@/lib/permissoes";
import { ok, erro, erroDeValidacao, type Resultado } from "@/lib/utils";
import { atletaSchema } from "@/lib/schemas/atleta";
import { agregarEstatisticas, type EstatisticasAgregadas } from "@/lib/estatisticas";
import { Prisma, type Atleta } from "@prisma/client";

const PATH = "/plantel";

const INCLUDE_RELACOES = {
  escalao: { select: { id: true, nome: true } },
  escalaoSecundario: { select: { id: true, nome: true } },
  epoca: { select: { id: true, nome: true } },
} as const;

type AtletaComRelacoes = Prisma.AtletaGetPayload<{ include: typeof INCLUDE_RELACOES }>;

export type { EstatisticasAgregadas };

export async function listarAtletas(
  escalaoId?: string,
): Promise<Resultado<AtletaComRelacoes[]>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const epoca = await obterEpocaAtiva();
  if (!epoca) return erro("Nenhuma época ativa");

  // Filtro de âmbito: escalões que o membro pode ler (secção 6.4).
  // Um atleta aparece no seu escalão principal OU secundário.
  const legiveis = await escaloesLegiveis();
  let filtroEscalao: Prisma.AtletaWhereInput = {};
  if (escalaoId) {
    if (!(await podeLerEscalao(escalaoId))) return ok([]);
    filtroEscalao = { OR: [{ escalaoId }, { escalaoSecundarioId: escalaoId }] };
  } else if (legiveis !== "TODOS") {
    filtroEscalao = {
      OR: [{ escalaoId: { in: legiveis } }, { escalaoSecundarioId: { in: legiveis } }],
    };
  }

  const atletas = await prisma.atleta.findMany({
    where: {
      epocaId: epoca.id,
      escalao: { clubeId },
      ativo: true,
      ...filtroEscalao,
    },
    include: INCLUDE_RELACOES,
    orderBy: [{ numero: "asc" }, { nome: "asc" }],
  });
  return ok(atletas);
}

export async function obterAtleta(id: string): Promise<Resultado<AtletaComRelacoes>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const atleta = await prisma.atleta.findFirst({
    where: { id, escalao: { clubeId } },
    include: INCLUDE_RELACOES,
  });
  if (!atleta) return erro("Atleta não encontrado");
  if (!(await podeLerEscalao(atleta.escalaoId))) return erro("Sem permissão neste escalão");
  return ok(atleta);
}

export async function criarAtleta(dados: unknown): Promise<Resultado<Atleta>> {
  const parsed = atletaSchema.safeParse(dados);
  if (!parsed.success) return erroDeValidacao(parsed.error);

  const perm = await exigirCapacidade("PLANTEL_GERIR", parsed.data.escalaoId);
  if (!perm.ok) return erro(perm.erro);
  const clubeId = perm.ctx.clube.id;

  const epoca = await obterEpocaAtiva();
  if (!epoca)
    return erro("Nenhuma época ativa definida. Define uma época ativa antes de criar atletas.");

  const escalao = await prisma.escalao.findFirst({
    where: { id: parsed.data.escalaoId, clubeId },
  });
  if (!escalao) return erro("O escalão selecionado não existe");

  const secundarioId = await validarEscalaoSecundario(parsed.data.escalaoSecundarioId, clubeId);
  if (secundarioId === "INVALIDO") return erro("O escalão secundário selecionado não existe");

  const atleta = await prisma.atleta.create({
    data: {
      nome: parsed.data.nome,
      escalaoId: parsed.data.escalaoId,
      escalaoSecundarioId: secundarioId,
      epocaId: epoca.id,
      posicoes: parsed.data.posicoes,
      numero: parsed.data.numero ?? null,
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
  return ok(atleta);
}

// Valida o escalão secundário: devolve o id (ou null se ausente), ou "INVALIDO".
async function validarEscalaoSecundario(
  id: string | null | undefined,
  clubeId: string,
): Promise<string | null | "INVALIDO"> {
  if (!id) return null;
  const escalao = await prisma.escalao.findFirst({ where: { id, clubeId } });
  return escalao ? id : "INVALIDO";
}

export async function atualizarAtleta(
  id: string,
  dados: unknown,
): Promise<Resultado<Atleta>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const parsed = atletaSchema.safeParse(dados);
  if (!parsed.success) return erroDeValidacao(parsed.error);

  const existe = await prisma.atleta.findFirst({
    where: { id, escalao: { clubeId } },
  });
  if (!existe) return erro("Atleta não encontrado");

  // Permissão sobre o escalão atual do atleta
  const perm = await exigirCapacidade("PLANTEL_GERIR", existe.escalaoId);
  if (!perm.ok) return erro(perm.erro);

  if (parsed.data.escalaoId !== existe.escalaoId) {
    // Mover para outro escalão exige permissão também no escalão de destino
    const permDestino = await exigirCapacidade("PLANTEL_GERIR", parsed.data.escalaoId);
    if (!permDestino.ok) return erro(permDestino.erro);
    const escalao = await prisma.escalao.findFirst({
      where: { id: parsed.data.escalaoId, clubeId },
    });
    if (!escalao) return erro("O escalão selecionado não existe");
  }

  const secundarioId = await validarEscalaoSecundario(parsed.data.escalaoSecundarioId, clubeId);
  if (secundarioId === "INVALIDO") return erro("O escalão secundário selecionado não existe");

  // Campos opcionais: undefined não limpa o valor existente no Prisma — usar null explicitamente.
  const atleta = await prisma.atleta.update({
    where: { id },
    data: {
      nome: parsed.data.nome,
      escalaoId: parsed.data.escalaoId,
      escalaoSecundarioId: secundarioId,
      posicoes: parsed.data.posicoes,
      numero: parsed.data.numero ?? null,
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
    where: { id, escalao: { clubeId } },
  });
  if (!existe) return erro("Atleta não encontrado");

  const perm = await exigirCapacidade("PLANTEL_GERIR", existe.escalaoId);
  if (!perm.ok) return erro(perm.erro);

  await prisma.atleta.update({ where: { id }, data: { ativo: false } });
  revalidatePath(PATH);
  return ok(undefined);
}

// ─── Estatísticas agregadas (secção 15) ──────────────────────────────────────

export async function obterEstatisticasAtleta(
  id: string,
): Promise<Resultado<EstatisticasAgregadas>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const epoca = await obterEpocaAtiva();
  if (!epoca) return erro("Nenhuma época ativa");

  const atleta = await prisma.atleta.findFirst({
    where: { id, escalao: { clubeId } },
    select: { id: true, escalaoId: true, posicoes: true, criadoEm: true, dataIngresso: true, epocaId: true },
  });
  if (!atleta) return erro("Atleta não encontrado");
  if (!(await podeLerEscalao(atleta.escalaoId))) return erro("Sem permissão neste escalão");

  const eGR = atleta.posicoes.includes("GUARDA_REDES");
  // Divisor da taxa de presença: sessões desde o ingresso (secção 22.3).
  const ingresso = atleta.dataIngresso ?? atleta.criadoEm;

  // Jogos: convocatórias e estatísticas da época
  const [jogosConvocado, estatisticas, sessoesTotais, presencas] = await Promise.all([
    prisma.convocatoria.count({
      where: { convocado: true, atletaId: id, jogo: { epocaId: epoca.id } },
    }),
    prisma.estatisticaAtleta.findMany({
      where: { atletaId: id, jogo: { epocaId: epoca.id } },
    }),
    // Sessões do escalão na época a partir da data de ingresso do atleta (secção 22.3)
    prisma.sessao.count({
      where: {
        epocaId: epoca.id,
        escalaoId: atleta.escalaoId,
        data: { gte: ingresso },
      },
    }),
    prisma.presenca.count({
      where: {
        atletaId: id,
        estado: { in: ["PRESENTE", "ATRASADO"] },
        sessao: { epocaId: epoca.id },
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
