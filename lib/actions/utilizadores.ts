"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { obterClubeIdAtual } from "@/lib/epoca-context";
import { auth } from "@/lib/auth";
import { ok, erro, erroDeValidacao, type Resultado } from "@/lib/utils";
import {
  criarUtilizadorSchema,
  atualizarUtilizadorSchema,
  passwordSchema,
  alterarPasswordSchema,
} from "@/lib/schemas/utilizador";
import type { Utilizador } from "@prisma/client";

const BCRYPT_COST = 10;
const PATH = "/definicoes/utilizadores";

type UtilizadorSemHash = Omit<Utilizador, "passwordHash">;

const SELECT_SEM_HASH = {
  id: true,
  nome: true,
  email: true,
  clubeId: true,
  criadoEm: true,
  atualizadoEm: true,
} as const;

export async function listarUtilizadores(): Promise<Resultado<UtilizadorSemHash[]>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const utilizadores = await prisma.utilizador.findMany({
    where: { clubeId },
    select: SELECT_SEM_HASH,
    orderBy: { nome: "asc" },
  });
  return ok(utilizadores);
}

export async function criarUtilizador(dados: unknown): Promise<Resultado<UtilizadorSemHash>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const parsed = criarUtilizadorSchema.safeParse(dados);
  if (!parsed.success) return erroDeValidacao(parsed.error);

  const emailExiste = await prisma.utilizador.findFirst({
    where: { email: parsed.data.email },
  });
  if (emailExiste) return erro("Já existe um utilizador com este email");

  const passwordHash = await bcrypt.hash(parsed.data.passwordInicial, BCRYPT_COST);

  const utilizador = await prisma.utilizador.create({
    data: { nome: parsed.data.nome, email: parsed.data.email, passwordHash, clubeId },
    select: SELECT_SEM_HASH,
  });
  revalidatePath(PATH);
  return ok(utilizador);
}

export async function atualizarUtilizador(
  id: string,
  dados: unknown,
): Promise<Resultado<UtilizadorSemHash>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const parsed = atualizarUtilizadorSchema.safeParse(dados);
  if (!parsed.success) return erroDeValidacao(parsed.error);

  const existe = await prisma.utilizador.findFirst({ where: { id, clubeId } });
  if (!existe) return erro("Utilizador não encontrado");

  // Verifica unicidade de email (excluindo o próprio)
  const emailEmUso = await prisma.utilizador.findFirst({
    where: { email: parsed.data.email, id: { not: id } },
  });
  if (emailEmUso) return erro("Já existe um utilizador com este email");

  const utilizador = await prisma.utilizador.update({
    where: { id },
    data: parsed.data,
    select: SELECT_SEM_HASH,
  });
  revalidatePath(PATH);
  return ok(utilizador);
}

// Redefinição por administrador — não requer password atual (secção 9.6)
export async function redefinirPassword(
  id: string,
  novaPassword: unknown,
): Promise<Resultado<void>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const parsed = passwordSchema.safeParse(novaPassword);
  if (!parsed.success) return erro(parsed.error.issues[0]?.message ?? "Password inválida");

  const existe = await prisma.utilizador.findFirst({ where: { id, clubeId } });
  if (!existe) return erro("Utilizador não encontrado");

  const passwordHash = await bcrypt.hash(parsed.data, BCRYPT_COST);
  await prisma.utilizador.update({ where: { id }, data: { passwordHash } });
  return ok(undefined);
}

// Alteração pelo próprio — requer password atual (secção 9.6)
export async function alterarMinhaPassword(dados: unknown): Promise<Resultado<void>> {
  const session = await auth();
  if (!session?.user?.id) return erro("Não autenticado");

  const parsed = alterarPasswordSchema.safeParse(dados);
  if (!parsed.success) return erroDeValidacao(parsed.error);

  const utilizador = await prisma.utilizador.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });
  if (!utilizador) return erro("Utilizador não encontrado");

  const passwordCorreta = await bcrypt.compare(
    parsed.data.passwordAtual,
    utilizador.passwordHash,
  );
  if (!passwordCorreta) return erro("Password atual incorreta");

  const passwordHash = await bcrypt.hash(parsed.data.novaPassword, BCRYPT_COST);
  await prisma.utilizador.update({ where: { id: session.user.id }, data: { passwordHash } });
  return ok(undefined);
}
