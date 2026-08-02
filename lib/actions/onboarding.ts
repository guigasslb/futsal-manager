"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { ok, erro, erroDeValidacao, type Resultado } from "@/lib/utils";
import { registarSchema, criarClubeSchema } from "@/lib/schemas/onboarding";
import { PERFIS_ARRANQUE } from "@/lib/permissoes-catalogo";

const BCRYPT_COST = 12;

/** Registo de um novo utilizador (modo individual, sem clube). */
export async function registar(dados: unknown): Promise<Resultado<void>> {
  const parsed = registarSchema.safeParse(dados);
  if (!parsed.success) return erroDeValidacao(parsed.error);

  const existe = await prisma.utilizador.findUnique({
    where: { email: parsed.data.email },
  });
  if (existe) return erro("Já existe uma conta com este email");

  await prisma.utilizador.create({
    data: {
      nome: parsed.data.nome,
      email: parsed.data.email,
      passwordHash: await bcrypt.hash(parsed.data.password, BCRYPT_COST),
    },
  });
  return ok(undefined);
}

/**
 * Cria um clube e torna o utilizador autenticado Administrador.
 * Gera os perfis de arranque editáveis (secção 6.5).
 */
export async function criarClube(dados: unknown): Promise<Resultado<{ clubeId: string }>> {
  const session = await auth();
  if (!session?.user?.id) return erro("Não autenticado");

  const parsed = criarClubeSchema.safeParse(dados);
  if (!parsed.success) return erroDeValidacao(parsed.error);

  // Regra: uma adesão ativa de cada vez
  const jaAtivo = await prisma.membroClube.findFirst({
    where: { utilizadorId: session.user.id, estado: "ATIVO" },
  });
  if (jaAtivo) return erro("Já tens uma adesão ativa a um clube. Sai desse clube primeiro.");

  const resultado = await prisma.$transaction(async (tx) => {
    const clube = await tx.clube.create({
      data: {
        nome: parsed.data.nome,
        corPrimaria: parsed.data.corPrimaria ?? "#1A2FD4",
        corSecundaria: parsed.data.corSecundaria ?? "#FFD700",
      },
    });

    let perfilAdminId = "";
    for (const p of PERFIS_ARRANQUE) {
      const perfil = await tx.perfil.create({
        data: {
          clubeId: clube.id,
          nome: p.nome,
          descricao: p.descricao,
          ambito: p.ambito,
          capacidades: p.capacidades,
          sistema: true,
        },
      });
      if (p.nome === "Administrador") perfilAdminId = perfil.id;
    }

    await tx.membroClube.create({
      data: {
        utilizadorId: session.user!.id!,
        clubeId: clube.id,
        perfilId: perfilAdminId,
        estado: "ATIVO",
      },
    });

    return { clubeId: clube.id };
  });

  revalidatePath("/", "layout");
  return ok(resultado);
}
