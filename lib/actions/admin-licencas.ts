"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { exigirAdminPlataforma } from "@/lib/admin-guard";
import {
  AlterarEstadoLicencaSchema,
  EditarDataFimLicencaSchema,
} from "@/lib/schemas/admin";
import { ok, erro, erroDeValidacao, type Resultado } from "@/lib/utils";
import { z } from "zod";

// Fase 2 — Backoffice interno: Server Actions CROSS-TENANT de gestão de licenças.
//
// ATENÇÃO: ao contrário de `lib/actions/licenciamento.ts` (club-scoped, usa
// `obterMembroAtual()`), estas actions operam sobre TODAS as licenças da
// plataforma. O único gate de acesso é `exigirAdminPlataforma()`, chamado no
// início de cada action. NUNCA usar `obterMembroAtual()` aqui.

const PATH = "/admin";

// Campos selecionados para a listagem cross-tenant, incluindo o titular resolvido
// (utilizador OU clube — exatamente um dos dois preenchido no modelo).
const selecaoLicencaAdmin = {
  id: true,
  tipo: true,
  tier: true,
  estado: true,
  ciclo: true,
  dataInicio: true,
  dataFim: true,
  precoCentimos: true,
  modalidade: true,
  numSeccoes: true,
  criadoEm: true,
  utilizador: { select: { id: true, nome: true, email: true } },
  clube: { select: { id: true, nome: true } },
} as const;

/** Licença enriquecida com o titular resolvido, tal como exibida no backoffice. */
export type LicencaAdmin = Awaited<ReturnType<typeof consultarLicencasAdmin>>[number];

/** Query interna partilhada (não exportada; não é Server Action). */
async function consultarLicencasAdmin() {
  return prisma.licenca.findMany({
    select: selecaoLicencaAdmin,
    orderBy: { criadoEm: "desc" },
  });
}

/**
 * Lista TODAS as licenças da plataforma (cross-tenant), com o titular resolvido
 * (utilizador ou clube). Ordena por data de criação desc. Só admins de plataforma.
 */
export async function listarTodasLicencas(): Promise<Resultado<LicencaAdmin[]>> {
  await exigirAdminPlataforma();

  try {
    const licencas = await consultarLicencasAdmin();
    return ok(licencas);
  } catch {
    return erro("Não foi possível listar as licenças");
  }
}

/**
 * Altera o estado de uma licença para ATIVA, SUSPENSA ou CANCELADA.
 * EXPIRADA não é permitida (estado derivado de `dataFim`). Só admins de plataforma.
 */
export async function alterarEstadoLicenca(
  dados: unknown,
): Promise<Resultado<LicencaAdmin>> {
  await exigirAdminPlataforma();

  const parsed = AlterarEstadoLicencaSchema.safeParse(dados);
  if (!parsed.success) return erroDeValidacao(parsed.error);

  try {
    const licenca = await prisma.licenca.update({
      where: { id: parsed.data.licencaId },
      data: { estado: parsed.data.estado },
      select: selecaoLicencaAdmin,
    });

    revalidatePath(PATH);
    return ok(licenca);
  } catch (e) {
    if (e instanceof z.ZodError) return erroDeValidacao(e);
    return erro("Não foi possível alterar o estado da licença");
  }
}

/**
 * Edita a data de fim de uma licença (`null` = sem expiração).
 * Só admins de plataforma.
 */
export async function editarDataFimLicenca(
  dados: unknown,
): Promise<Resultado<LicencaAdmin>> {
  await exigirAdminPlataforma();

  const parsed = EditarDataFimLicencaSchema.safeParse(dados);
  if (!parsed.success) return erroDeValidacao(parsed.error);

  try {
    const licenca = await prisma.licenca.update({
      where: { id: parsed.data.licencaId },
      data: { dataFim: parsed.data.dataFim },
      select: selecaoLicencaAdmin,
    });

    revalidatePath(PATH);
    return ok(licenca);
  } catch (e) {
    if (e instanceof z.ZodError) return erroDeValidacao(e);
    return erro("Não foi possível editar a data de fim da licença");
  }
}
