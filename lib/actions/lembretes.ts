"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { obterMembroAtual, exigirCapacidade } from "@/lib/permissoes";
import {
  criarLembreteSchema,
  atualizarLembreteSchema,
  idLembreteSchema,
} from "@/lib/schemas/lembretes";
import { ok, erro, erroDeValidacao, type Resultado } from "@/lib/utils";

const PATH = "/dashboard";

// Lembrete com o estado calculado para o utilizador atual.
export interface LembreteComEstado {
  id: string;
  titulo: string;
  descricao: string | null;
  dataLimite: Date | null;
  concluido: boolean;
  criadoPorId: string;
  criadoPorNome: string;
  souCriador: boolean;
  souDestinatario: boolean;
  visto: boolean;
  createdAt: Date;
}

/**
 * Lembretes relevantes para o utilizador atual: criados por mim OU onde sou
 * destinatário, sempre dentro do clube ativo (isolamento multi-tenant).
 * Ordenados por dataLimite ascendente (sem data no fim), depois por criação.
 */
export async function obterLembretes(): Promise<Resultado<LembreteComEstado[]>> {
  const ctx = await obterMembroAtual();
  if (!ctx) return erro("Sem acesso a este clube");

  const userId = ctx.utilizadorId;

  const lembretes = await prisma.lembrete.findMany({
    where: {
      clubeId: ctx.clube.id,
      OR: [
        { criadoPorId: userId },
        { destinatarios: { some: { utilizadorId: userId } } },
      ],
    },
    include: {
      criadoPor: { select: { nome: true } },
      destinatarios: { select: { utilizadorId: true, visto: true } },
    },
    orderBy: [{ dataLimite: "asc" }, { createdAt: "desc" }],
  });

  const dto = lembretes.map<LembreteComEstado>((l) => {
    const meu = l.destinatarios.find((d) => d.utilizadorId === userId);
    return {
      id: l.id,
      titulo: l.titulo,
      descricao: l.descricao,
      dataLimite: l.dataLimite,
      concluido: l.concluido,
      criadoPorId: l.criadoPorId,
      criadoPorNome: l.criadoPor.nome,
      souCriador: l.criadoPorId === userId,
      souDestinatario: !!meu,
      visto: meu?.visto ?? false,
      createdAt: l.createdAt,
    };
  });

  return ok(dto);
}

/**
 * Cria um lembrete e os respetivos destinatários (membros do clube).
 * Requer a capacidade LEMBRETES_EQUIPA_GERIR.
 */
export async function criarLembrete(
  dados: unknown,
): Promise<Resultado<{ id: string }>> {
  const perm = await exigirCapacidade("LEMBRETES_EQUIPA_GERIR");
  if (!perm.ok) return erro(perm.erro);

  const parsed = criarLembreteSchema.safeParse(dados);
  if (!parsed.success) return erroDeValidacao(parsed.error);

  const ids = Array.from(new Set(parsed.data.destinatarioIds));

  // Os destinatários têm de ser membros do clube ativo (isolamento multi-tenant).
  if (ids.length > 0) {
    const membros = await prisma.membroClube.findMany({
      where: { clubeId: perm.ctx.clube.id, utilizadorId: { in: ids } },
      select: { utilizadorId: true },
    });
    if (membros.length !== ids.length) {
      return erro("Um ou mais destinatários não pertencem ao clube");
    }
  }

  const lembrete = await prisma.lembrete.create({
    data: {
      clubeId: perm.ctx.clube.id,
      criadoPorId: perm.ctx.utilizadorId,
      titulo: parsed.data.titulo,
      descricao: parsed.data.descricao ?? null,
      dataLimite: parsed.data.dataLimite ?? null,
      destinatarios: {
        create: ids.map((utilizadorId) => ({ utilizadorId })),
      },
    },
    select: { id: true },
  });

  revalidatePath(PATH);
  return ok(lembrete);
}

/**
 * Atualiza título/descrição/dataLimite/concluído. Só o criador pode editar.
 */
export async function atualizarLembrete(
  dados: unknown,
): Promise<Resultado<{ id: string }>> {
  const ctx = await obterMembroAtual();
  if (!ctx) return erro("Sem acesso a este clube");

  const parsed = atualizarLembreteSchema.safeParse(dados);
  if (!parsed.success) return erroDeValidacao(parsed.error);

  const existe = await prisma.lembrete.findFirst({
    where: { id: parsed.data.id, clubeId: ctx.clube.id },
    select: { id: true, criadoPorId: true },
  });
  if (!existe) return erro("Lembrete não encontrado");
  if (existe.criadoPorId !== ctx.utilizadorId) {
    return erro("Só o criador pode editar o lembrete");
  }

  await prisma.lembrete.update({
    where: { id: existe.id },
    data: {
      ...(parsed.data.titulo !== undefined ? { titulo: parsed.data.titulo } : {}),
      ...(parsed.data.descricao !== undefined
        ? { descricao: parsed.data.descricao ?? null }
        : {}),
      ...(parsed.data.dataLimite !== undefined
        ? { dataLimite: parsed.data.dataLimite ?? null }
        : {}),
      ...(parsed.data.concluido !== undefined
        ? { concluido: parsed.data.concluido }
        : {}),
    },
  });

  revalidatePath(PATH);
  return ok({ id: existe.id });
}

/**
 * Marca como visto o registo de destinatário do utilizador atual.
 */
export async function marcarVisto(id: unknown): Promise<Resultado<void>> {
  const session = await auth();
  if (!session?.user?.id) return erro("Não autenticado");

  const parsed = idLembreteSchema.safeParse(typeof id === "string" ? { id } : id);
  if (!parsed.success) return erroDeValidacao(parsed.error);

  const destinatario = await prisma.lembreteDestinatario.findUnique({
    where: {
      lembreteId_utilizadorId: {
        lembreteId: parsed.data.id,
        utilizadorId: session.user.id,
      },
    },
    select: { id: true },
  });
  if (!destinatario) return erro("Não és destinatário deste lembrete");

  await prisma.lembreteDestinatario.update({
    where: { id: destinatario.id },
    data: { visto: true },
  });

  revalidatePath(PATH);
  return ok(undefined);
}

/**
 * Elimina um lembrete. Só o criador pode; requer LEMBRETES_EQUIPA_GERIR.
 */
export async function eliminarLembrete(id: unknown): Promise<Resultado<void>> {
  const perm = await exigirCapacidade("LEMBRETES_EQUIPA_GERIR");
  if (!perm.ok) return erro(perm.erro);

  const parsed = idLembreteSchema.safeParse(typeof id === "string" ? { id } : id);
  if (!parsed.success) return erroDeValidacao(parsed.error);

  const existe = await prisma.lembrete.findFirst({
    where: { id: parsed.data.id, clubeId: perm.ctx.clube.id },
    select: { id: true, criadoPorId: true },
  });
  if (!existe) return erro("Lembrete não encontrado");
  if (existe.criadoPorId !== perm.ctx.utilizadorId) {
    return erro("Só o criador pode eliminar o lembrete");
  }

  await prisma.lembrete.delete({ where: { id: existe.id } });

  revalidatePath(PATH);
  return ok(undefined);
}
