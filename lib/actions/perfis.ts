"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { obterMembroAtual, exigirCapacidade } from "@/lib/permissoes";
import { ok, erro, erroDeValidacao, type Resultado } from "@/lib/utils";
import { perfilSchema } from "@/lib/schemas/membro";
import type { Perfil } from "@prisma/client";

const PATH = "/definicoes/perfis";

export async function listarPerfis(): Promise<Resultado<Perfil[]>> {
  const ctx = await obterMembroAtual();
  if (!ctx) return erro("Sem acesso a este clube");

  const perfis = await prisma.perfil.findMany({
    where: { clubeId: ctx.clube.id },
    orderBy: { criadoEm: "asc" },
  });
  return ok(perfis);
}

export async function criarPerfil(dados: unknown): Promise<Resultado<Perfil>> {
  const perm = await exigirCapacidade("CLUBE_PERFIS");
  if (!perm.ok) return erro(perm.erro);

  const parsed = perfilSchema.safeParse(dados);
  if (!parsed.success) return erroDeValidacao(parsed.error);

  const perfil = await prisma.perfil.create({
    data: {
      clubeId: perm.ctx.clube.id,
      nome: parsed.data.nome,
      descricao: parsed.data.descricao ?? null,
      ambito: parsed.data.ambito,
      capacidades: parsed.data.capacidades,
      sistema: false,
    },
  });
  revalidatePath(PATH);
  return ok(perfil);
}

export async function atualizarPerfil(id: string, dados: unknown): Promise<Resultado<Perfil>> {
  const perm = await exigirCapacidade("CLUBE_PERFIS");
  if (!perm.ok) return erro(perm.erro);

  const parsed = perfilSchema.safeParse(dados);
  if (!parsed.success) return erroDeValidacao(parsed.error);

  const existe = await prisma.perfil.findFirst({
    where: { id, clubeId: perm.ctx.clube.id },
  });
  if (!existe) return erro("Perfil não encontrado");

  const perfil = await prisma.perfil.update({
    where: { id },
    data: {
      nome: parsed.data.nome,
      descricao: parsed.data.descricao ?? null,
      ambito: parsed.data.ambito,
      capacidades: parsed.data.capacidades,
    },
  });
  revalidatePath(PATH);
  return ok(perfil);
}

export async function apagarPerfil(id: string): Promise<Resultado<void>> {
  const perm = await exigirCapacidade("CLUBE_PERFIS");
  if (!perm.ok) return erro(perm.erro);

  const existe = await prisma.perfil.findFirst({
    where: { id, clubeId: perm.ctx.clube.id },
  });
  if (!existe) return erro("Perfil não encontrado");

  const emUso = await prisma.membroClube.count({ where: { perfilId: id } });
  if (emUso > 0)
    return erro(`Este perfil está atribuído a ${emUso} membro(s). Reatribui-os primeiro.`);

  await prisma.perfil.delete({ where: { id } });
  revalidatePath(PATH);
  return ok(undefined);
}
