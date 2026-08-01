"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { obterClubeIdAtual } from "@/lib/epoca-context";
import { exigirCapacidade, podeLerEscalao, escaloesLegiveis } from "@/lib/permissoes";
import { ok, erro, erroDeValidacao, type Resultado } from "@/lib/utils";
import { reuniaoSchema } from "@/lib/schemas/reuniao";
import type { Reuniao } from "@prisma/client";

const PATH = "/reunioes";

export async function listarReunioes(): Promise<Resultado<Reuniao[]>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  // Reuniões de clube: visíveis a todos os membros.
  // Reuniões de escalão: visíveis a quem pode ler o escalão.
  const legiveis = await escaloesLegiveis();
  const reunioes = await prisma.reuniao.findMany({
    where: {
      clubeId,
      OR: [
        { ambito: "CLUBE" },
        legiveis === "TODOS" ? { ambito: "ESCALAO" } : { escalaoId: { in: legiveis } },
      ],
    },
    orderBy: { data: "desc" },
  });
  return ok(reunioes);
}

export async function obterReuniao(id: string): Promise<Resultado<Reuniao>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const reuniao = await prisma.reuniao.findFirst({ where: { id, clubeId } });
  if (!reuniao) return erro("Reunião não encontrada");
  if (reuniao.ambito === "ESCALAO" && reuniao.escalaoId) {
    if (!(await podeLerEscalao(reuniao.escalaoId))) return erro("Sem permissão neste escalão");
  }
  return ok(reuniao);
}

export async function criarReuniao(dados: unknown): Promise<Resultado<Reuniao>> {
  const session = await auth();
  if (!session?.user?.id) return erro("Não autenticado");

  const parsed = reuniaoSchema.safeParse(dados);
  if (!parsed.success) return erroDeValidacao(parsed.error);

  const escalaoId = parsed.data.ambito === "ESCALAO" ? parsed.data.escalaoId ?? undefined : undefined;
  const perm = await exigirCapacidade("REUNIOES_GERIR", escalaoId);
  if (!perm.ok) return erro(perm.erro);

  const reuniao = await prisma.reuniao.create({
    data: {
      clubeId: perm.ctx.clube.id,
      ambito: parsed.data.ambito,
      escalaoId: escalaoId ?? null,
      titulo: parsed.data.titulo,
      data: parsed.data.data,
      participantes: parsed.data.participantes ?? null,
      ordemTrabalhos: parsed.data.ordemTrabalhos ?? null,
      ata: parsed.data.ata ?? null,
      criadorId: session.user.id,
    },
  });
  revalidatePath(PATH);
  return ok(reuniao);
}

export async function atualizarReuniao(id: string, dados: unknown): Promise<Resultado<Reuniao>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const parsed = reuniaoSchema.safeParse(dados);
  if (!parsed.success) return erroDeValidacao(parsed.error);

  const existe = await prisma.reuniao.findFirst({ where: { id, clubeId } });
  if (!existe) return erro("Reunião não encontrada");

  const escalaoId = parsed.data.ambito === "ESCALAO" ? parsed.data.escalaoId ?? undefined : undefined;
  const perm = await exigirCapacidade("REUNIOES_GERIR", escalaoId ?? existe.escalaoId ?? undefined);
  if (!perm.ok) return erro(perm.erro);

  const reuniao = await prisma.reuniao.update({
    where: { id },
    data: {
      ambito: parsed.data.ambito,
      escalaoId: escalaoId ?? null,
      titulo: parsed.data.titulo,
      data: parsed.data.data,
      participantes: parsed.data.participantes ?? null,
      ordemTrabalhos: parsed.data.ordemTrabalhos ?? null,
      ata: parsed.data.ata ?? null,
    },
  });
  revalidatePath(PATH);
  revalidatePath(`${PATH}/${id}`);
  return ok(reuniao);
}

export async function apagarReuniao(id: string): Promise<Resultado<void>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const existe = await prisma.reuniao.findFirst({ where: { id, clubeId } });
  if (!existe) return erro("Reunião não encontrada");

  const perm = await exigirCapacidade("REUNIOES_GERIR", existe.escalaoId ?? undefined);
  if (!perm.ok) return erro(perm.erro);

  await prisma.reuniao.delete({ where: { id } });
  revalidatePath(PATH);
  return ok(undefined);
}
