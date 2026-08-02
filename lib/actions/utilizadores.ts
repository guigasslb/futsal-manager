"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { obterMembroAtual, exigirCapacidade } from "@/lib/permissoes";
import { ok, erro, erroDeValidacao, type Resultado } from "@/lib/utils";
import { convidarMembroSchema } from "@/lib/schemas/membro";
import { alterarPasswordSchema, passwordSchema } from "@/lib/schemas/utilizador";

const BCRYPT_COST = 12;
const PATH = "/definicoes/membros";

export interface MembroLista {
  membroId: string;
  utilizadorId: string;
  nome: string;
  email: string;
  perfilId: string;
  perfilNome: string;
  estado: string;
  escaloesAtribuidos: string[];
}

export async function listarMembros(): Promise<Resultado<MembroLista[]>> {
  const ctx = await obterMembroAtual();
  if (!ctx) return erro("Sem acesso a este clube");

  const membros = await prisma.membroClube.findMany({
    where: { clubeId: ctx.clube.id },
    include: {
      utilizador: { select: { id: true, nome: true, email: true } },
      perfil: { select: { id: true, nome: true } },
      atribuicoes: { select: { escalaoId: true } },
    },
    orderBy: { utilizador: { nome: "asc" } },
  });

  return ok(
    membros.map((m) => ({
      membroId: m.id,
      utilizadorId: m.utilizadorId,
      nome: m.utilizador.nome,
      email: m.utilizador.email,
      perfilId: m.perfilId,
      perfilNome: m.perfil.nome,
      estado: m.estado,
      escaloesAtribuidos: m.atribuicoes.map((a) => a.escalaoId),
    })),
  );
}

export async function convidarMembro(dados: unknown): Promise<Resultado<void>> {
  const perm = await exigirCapacidade("CLUBE_UTILIZADORES");
  if (!perm.ok) return erro(perm.erro);

  const parsed = convidarMembroSchema.safeParse(dados);
  if (!parsed.success) return erroDeValidacao(parsed.error);

  const perfil = await prisma.perfil.findFirst({
    where: { id: parsed.data.perfilId, clubeId: perm.ctx.clube.id },
  });
  if (!perfil) return erro("O perfil selecionado não existe");

  let utilizador = await prisma.utilizador.findUnique({
    where: { email: parsed.data.email },
  });

  if (utilizador) {
    const jaMembro = await prisma.membroClube.findUnique({
      where: {
        utilizadorId_clubeId: {
          utilizadorId: utilizador.id,
          clubeId: perm.ctx.clube.id,
        },
      },
    });
    if (jaMembro) return erro("Este utilizador já é membro do clube");
    const outraAtiva = await prisma.membroClube.findFirst({
      where: { utilizadorId: utilizador.id, estado: "ATIVO" },
    });
    if (outraAtiva) return erro("Este utilizador já tem uma adesão ativa noutro clube");
  } else {
    utilizador = await prisma.utilizador.create({
      data: {
        nome: parsed.data.nome,
        email: parsed.data.email,
        passwordHash: await bcrypt.hash(parsed.data.passwordInicial, BCRYPT_COST),
      },
    });
  }

  await prisma.membroClube.create({
    data: {
      utilizadorId: utilizador.id,
      clubeId: perm.ctx.clube.id,
      perfilId: perfil.id,
      estado: "ATIVO",
    },
  });
  revalidatePath(PATH);
  return ok(undefined);
}

export async function atribuirPerfilMembro(
  membroId: string,
  perfilId: string,
): Promise<Resultado<void>> {
  const perm = await exigirCapacidade("CLUBE_UTILIZADORES");
  if (!perm.ok) return erro(perm.erro);

  const membro = await prisma.membroClube.findFirst({
    where: { id: membroId, clubeId: perm.ctx.clube.id },
  });
  if (!membro) return erro("Membro não encontrado");

  const perfil = await prisma.perfil.findFirst({
    where: { id: perfilId, clubeId: perm.ctx.clube.id },
  });
  if (!perfil) return erro("Perfil não encontrado");

  if (await ficariaSemAdmin(perm.ctx.clube.id, membroId, perfilId)) {
    return erro("O clube não pode ficar sem administrador");
  }

  await prisma.membroClube.update({ where: { id: membroId }, data: { perfilId } });
  revalidatePath(PATH);
  return ok(undefined);
}

export async function atribuirEscaloesMembro(
  membroId: string,
  escalaoIds: string[],
): Promise<Resultado<void>> {
  const perm = await exigirCapacidade("CLUBE_UTILIZADORES");
  if (!perm.ok) return erro(perm.erro);

  const membro = await prisma.membroClube.findFirst({
    where: { id: membroId, clubeId: perm.ctx.clube.id },
  });
  if (!membro) return erro("Membro não encontrado");

  const validos = await prisma.escalao.findMany({
    where: { id: { in: escalaoIds }, clubeId: perm.ctx.clube.id },
    select: { id: true },
  });

  await prisma.$transaction([
    prisma.atribuicaoEscalao.deleteMany({ where: { membroClubeId: membroId } }),
    ...validos.map((e) =>
      prisma.atribuicaoEscalao.create({
        data: { membroClubeId: membroId, escalaoId: e.id },
      }),
    ),
  ]);
  revalidatePath(PATH);
  return ok(undefined);
}

export async function removerMembro(membroId: string): Promise<Resultado<void>> {
  const perm = await exigirCapacidade("CLUBE_UTILIZADORES");
  if (!perm.ok) return erro(perm.erro);

  const membro = await prisma.membroClube.findFirst({
    where: { id: membroId, clubeId: perm.ctx.clube.id },
  });
  if (!membro) return erro("Membro não encontrado");

  if (await ficariaSemAdmin(perm.ctx.clube.id, membroId, null)) {
    return erro("O clube não pode ficar sem administrador");
  }

  await prisma.membroClube.delete({ where: { id: membroId } });
  revalidatePath(PATH);
  return ok(undefined);
}

export async function redefinirPasswordMembro(
  membroId: string,
  novaPassword: unknown,
): Promise<Resultado<void>> {
  const perm = await exigirCapacidade("CLUBE_UTILIZADORES");
  if (!perm.ok) return erro(perm.erro);

  const parsed = passwordSchema.safeParse(novaPassword);
  if (!parsed.success) return erro(parsed.error.issues[0]?.message ?? "Password inválida");

  const membro = await prisma.membroClube.findFirst({
    where: { id: membroId, clubeId: perm.ctx.clube.id },
    select: { utilizadorId: true },
  });
  if (!membro) return erro("Membro não encontrado");

  const passwordHash = await bcrypt.hash(parsed.data, BCRYPT_COST);
  await prisma.utilizador.update({
    where: { id: membro.utilizadorId },
    data: { passwordHash },
  });
  return ok(undefined);
}

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

  const correta = await bcrypt.compare(parsed.data.passwordAtual, utilizador.passwordHash);
  if (!correta) return erro("Password atual incorreta");

  const passwordHash = await bcrypt.hash(parsed.data.novaPassword, BCRYPT_COST);
  await prisma.utilizador.update({ where: { id: session.user.id }, data: { passwordHash } });
  return ok(undefined);
}

// Admin = perfil com CLUBE_UTILIZADORES e CLUBE_PERFIS. Impede ficar sem admin (secção 6.7).
async function ficariaSemAdmin(
  clubeId: string,
  membroIdAlvo: string,
  novoPerfilId: string | null,
): Promise<boolean> {
  const membros = await prisma.membroClube.findMany({
    where: { clubeId, estado: "ATIVO" },
    include: { perfil: { select: { id: true, capacidades: true } } },
  });

  const eAdmin = (caps: string[]) =>
    caps.includes("CLUBE_UTILIZADORES") && caps.includes("CLUBE_PERFIS");

  let novoCaps: string[] = [];
  if (novoPerfilId) {
    const encontrado = membros.find((m) => m.perfil.id === novoPerfilId)?.perfil.capacidades;
    novoCaps =
      encontrado ??
      (await prisma.perfil.findUnique({
        where: { id: novoPerfilId },
        select: { capacidades: true },
      }))?.capacidades ??
      [];
  }

  const adminsRestantes = membros.filter((m) => {
    if (m.id === membroIdAlvo) {
      if (novoPerfilId === null) return false;
      return eAdmin(novoCaps);
    }
    return eAdmin(m.perfil.capacidades);
  });

  return adminsRestantes.length === 0;
}
