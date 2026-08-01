"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { obterClubeIdAtual } from "@/lib/epoca-context";
import { exigirCapacidade } from "@/lib/permissoes";
import { ok, erro, erroDeValidacao, type Resultado } from "@/lib/utils";
import { observacaoAdversarioSchema } from "@/lib/schemas/competicao";
import type { ObservacaoAdversario } from "@prisma/client";

const PATH = "/jogos/scouting";

export async function listarObservacoes(): Promise<Resultado<ObservacaoAdversario[]>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const observacoes = await prisma.observacaoAdversario.findMany({
    where: { clubeId },
    orderBy: { criadoEm: "desc" },
  });
  return ok(observacoes);
}

export async function obterObservacao(
  id: string,
): Promise<Resultado<ObservacaoAdversario>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const obs = await prisma.observacaoAdversario.findFirst({ where: { id, clubeId } });
  if (!obs) return erro("Observação não encontrada");
  return ok(obs);
}

export async function criarObservacao(dados: unknown): Promise<Resultado<ObservacaoAdversario>> {
  const perm = await exigirCapacidade("SCOUTING_GERIR");
  if (!perm.ok) return erro(perm.erro);

  const parsed = observacaoAdversarioSchema.safeParse(dados);
  if (!parsed.success) return erroDeValidacao(parsed.error);

  const obs = await prisma.observacaoAdversario.create({
    data: {
      clubeId: perm.ctx.clube.id,
      escalaoId: parsed.data.escalaoId ?? null,
      equipa: parsed.data.equipa,
      jogoObservado: parsed.data.jogoObservado ?? null,
      competicao: parsed.data.competicao ?? null,
      sistemaTatico: parsed.data.sistemaTatico ?? null,
      pontosFortes: parsed.data.pontosFortes ?? null,
      pontosFracos: parsed.data.pontosFracos ?? null,
      notas: parsed.data.notas ?? null,
    },
  });
  revalidatePath(PATH);
  return ok(obs);
}

export async function atualizarObservacao(
  id: string,
  dados: unknown,
): Promise<Resultado<ObservacaoAdversario>> {
  const perm = await exigirCapacidade("SCOUTING_GERIR");
  if (!perm.ok) return erro(perm.erro);

  const parsed = observacaoAdversarioSchema.safeParse(dados);
  if (!parsed.success) return erroDeValidacao(parsed.error);

  const existe = await prisma.observacaoAdversario.findFirst({
    where: { id, clubeId: perm.ctx.clube.id },
  });
  if (!existe) return erro("Observação não encontrada");

  const obs = await prisma.observacaoAdversario.update({
    where: { id },
    data: {
      equipa: parsed.data.equipa,
      escalaoId: parsed.data.escalaoId ?? null,
      jogoObservado: parsed.data.jogoObservado ?? null,
      competicao: parsed.data.competicao ?? null,
      sistemaTatico: parsed.data.sistemaTatico ?? null,
      pontosFortes: parsed.data.pontosFortes ?? null,
      pontosFracos: parsed.data.pontosFracos ?? null,
      notas: parsed.data.notas ?? null,
    },
  });
  revalidatePath(PATH);
  return ok(obs);
}

export async function apagarObservacao(id: string): Promise<Resultado<void>> {
  const perm = await exigirCapacidade("SCOUTING_GERIR");
  if (!perm.ok) return erro(perm.erro);

  const existe = await prisma.observacaoAdversario.findFirst({
    where: { id, clubeId: perm.ctx.clube.id },
  });
  if (!existe) return erro("Observação não encontrada");

  await prisma.observacaoAdversario.delete({ where: { id } });
  revalidatePath(PATH);
  return ok(undefined);
}
