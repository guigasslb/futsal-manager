"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { exigirCapacidade, obterMembroAtual } from "@/lib/permissoes";
import { ok, erro, erroDeValidacao, type Resultado } from "@/lib/utils";
import { z } from "zod";
import { Modalidade, PapelSeccao, type Seccao } from "@prisma/client";

const PATH = "/definicoes";

// Rótulo pt-PT por modalidade (fallback quando `nome` não é personalizado — §3.1.1).
const ROTULO_MODALIDADE: Record<Modalidade, string> = {
  FUTSAL: "Futsal",
  FUTEBOL: "Futebol",
};

/**
 * Garante que existe uma `Seccao` para a modalidade do clube atual (§8.1.1).
 *
 * Idempotente por `@@unique([clubeId, modalidade])`: cria a secção se ainda não
 * existir, caso contrário devolve a existente. Usada no onboarding e em
 * `criarEscalao` — a criação de secções é transparente para clubes de uma só
 * modalidade. Não requer capacidade especial: qualquer membro autenticado pode
 * garantir a secção da sua modalidade (a autorização de escrita real vive na
 * action que a invoca, ex.: `criarEscalao`).
 */
export async function garantirSeccaoParaModalidade(
  modalidade: Modalidade,
): Promise<Resultado<{ seccaoId: string }>> {
  const ctx = await obterMembroAtual();
  if (!ctx) return erro("Sem acesso a este clube");

  const seccao = await prisma.seccao.upsert({
    where: { clubeId_modalidade: { clubeId: ctx.clube.id, modalidade } },
    update: {},
    create: {
      clubeId: ctx.clube.id,
      modalidade,
      nome: ROTULO_MODALIDADE[modalidade],
    },
    select: { id: true },
  });

  return ok({ seccaoId: seccao.id });
}

/**
 * Lista as secções do clube atual, com os membros coordenadores (§8.2).
 * Requer apenas autenticação (a UI de gestão faz gating por capacidade).
 */
export async function obterSeccoes(): Promise<Resultado<Seccao[]>> {
  const ctx = await obterMembroAtual();
  if (!ctx) return erro("Sem acesso a este clube");

  const seccoes = await prisma.seccao.findMany({
    where: { clubeId: ctx.clube.id },
    orderBy: { criadoEm: "asc" },
    include: {
      membros: {
        select: {
          id: true,
          papel: true,
          membroClube: {
            select: { id: true, utilizador: { select: { nome: true } } },
          },
        },
      },
    },
  });

  return ok(seccoes);
}

const atribuirCoordenadorSchema = z.object({
  seccaoId: z.string().min(1),
  membroClubeId: z.string().min(1),
  papel: z.nativeEnum(PapelSeccao),
});

/**
 * Atribui um membro como Coordenador de uma secção (§6.9).
 *
 * A gestão de membros é uma capacidade de nível clube (`CLUBE_UTILIZADORES` —
 * ver §8.2, "atribuir secções (Coordenador)"). Idempotente por
 * `@@unique([seccaoId, membroClubeId])`.
 */
export async function atribuirCoordenadorSeccao(dados: unknown): Promise<Resultado<void>> {
  const perm = await exigirCapacidade("CLUBE_UTILIZADORES");
  if (!perm.ok) return erro(perm.erro);

  const parsed = atribuirCoordenadorSchema.safeParse(dados);
  if (!parsed.success) return erroDeValidacao(parsed.error);

  // Isolamento multi-tenant: secção e membro têm de pertencer ao clube ativo.
  const [seccao, membro] = await Promise.all([
    prisma.seccao.findFirst({
      where: { id: parsed.data.seccaoId, clubeId: perm.ctx.clube.id },
      select: { id: true },
    }),
    prisma.membroClube.findFirst({
      where: { id: parsed.data.membroClubeId, clubeId: perm.ctx.clube.id },
      select: { id: true },
    }),
  ]);
  if (!seccao) return erro("Secção não encontrada");
  if (!membro) return erro("Membro não encontrado");

  await prisma.membroSeccao.upsert({
    where: {
      seccaoId_membroClubeId: {
        seccaoId: parsed.data.seccaoId,
        membroClubeId: parsed.data.membroClubeId,
      },
    },
    update: { papel: parsed.data.papel },
    create: {
      seccaoId: parsed.data.seccaoId,
      membroClubeId: parsed.data.membroClubeId,
      papel: parsed.data.papel,
    },
  });

  revalidatePath(PATH);
  return ok(undefined);
}

const removerMembroSchema = z.object({
  seccaoId: z.string().min(1),
  membroClubeId: z.string().min(1),
});

/**
 * Remove um membro de uma secção (§6.9). Requer `CLUBE_UTILIZADORES` (§8.2).
 */
export async function removerMembroSeccao(dados: unknown): Promise<Resultado<void>> {
  const perm = await exigirCapacidade("CLUBE_UTILIZADORES");
  if (!perm.ok) return erro(perm.erro);

  const parsed = removerMembroSchema.safeParse(dados);
  if (!parsed.success) return erroDeValidacao(parsed.error);

  // Isolamento multi-tenant: a secção alvo tem de pertencer ao clube ativo.
  const seccao = await prisma.seccao.findFirst({
    where: { id: parsed.data.seccaoId, clubeId: perm.ctx.clube.id },
    select: { id: true },
  });
  if (!seccao) return erro("Secção não encontrada");

  await prisma.membroSeccao.deleteMany({
    where: {
      seccaoId: parsed.data.seccaoId,
      membroClubeId: parsed.data.membroClubeId,
    },
  });

  revalidatePath(PATH);
  return ok(undefined);
}
