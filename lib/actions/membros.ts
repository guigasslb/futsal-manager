"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { capacidadesEfetivas, exigirCapacidade } from "@/lib/permissoes";
import { definirOverridesSchema } from "@/lib/schemas/membro";
import type { Capacidade } from "@/lib/permissoes-catalogo";
import { ok, erro, erroDeValidacao, type Resultado } from "@/lib/utils";

const PATH = "/definicoes/utilizadores";

// Um membro é administrador se as suas capacidades efetivas incluírem a gestão
// de utilizadores E de perfis (mesma definição usada em utilizadores.ts).
function eAdmin(caps: Set<Capacidade>): boolean {
  return caps.has("CLUBE_UTILIZADORES") && caps.has("CLUBE_PERFIS");
}

/**
 * Define os overrides de capacidades de um membro sobre o seu perfil base (F0).
 *
 * Regras:
 *  - Requer capacidade CLUBE_UTILIZADORES (gestão de membros) no clube ativo.
 *  - Delegação: só é possível atribuir em `extra` capacidades que o próprio
 *    utilizador possui efetivamente.
 *  - Proteção do último admin: não se pode revogar as capacidades de
 *    administração (CLUBE_UTILIZADORES/CLUBE_PERFIS) do último administrador do clube.
 */
export async function definirOverrides(
  membroId: string,
  extra: string[],
  revogadas: string[],
): Promise<Resultado<void>> {
  // 1. Autenticação + permissão para gerir membros (exigirCapacidade valida auth).
  const perm = await exigirCapacidade("CLUBE_UTILIZADORES");
  if (!perm.ok) return erro(perm.erro);

  // 2. Validação de input.
  const parsed = definirOverridesSchema.safeParse({ membroId, extra, revogadas });
  if (!parsed.success) return erroDeValidacao(parsed.error);

  // 3. O membro alvo tem de pertencer ao clube ativo (isolamento multi-tenant).
  const membro = await prisma.membroClube.findFirst({
    where: { id: parsed.data.membroId, clubeId: perm.ctx.clube.id },
    select: { id: true, perfil: { select: { capacidades: true } } },
  });
  if (!membro) return erro("Membro não encontrado");

  // 4. Regra de delegação: só se pode conceder o que o próprio possui.
  const capsProprias = new Set<Capacidade>(perm.ctx.capacidades);
  const semAutoridade = parsed.data.extra.filter((cap) => !capsProprias.has(cap));
  if (semAutoridade.length > 0) {
    return erro(
      "Só pode atribuir capacidades que você próprio possui",
    );
  }

  // 5 + 6. Proteção do último administrador e persistência, atomicamente.
  // A leitura dos membros ativos (last-admin check) e o update têm de correr na
  // mesma transação para evitar TOCTOU: duas invocações concorrentes não podem
  // ambas passar o check e, em conjunto, deixar o clube sem administrador.
  //
  // READ COMMITTED (o default do PostgreSQL) não chega: cada transação leria o
  // snapshot anterior e ambas veriam «ainda há outro admin». Só o isolamento
  // SERIALIZABLE deteta a dependência de leitura/escrita e aborta uma delas
  // (P2034) — a operação falha e o utilizador repete, que é o comportamento
  // correto face a perder o último administrador.
  const semAdmin = await prisma.$transaction(async (tx) => {
    const ativos = await tx.membroClube.findMany({
      where: { clubeId: perm.ctx.clube.id, estado: "ATIVO" },
      select: {
        id: true,
        capacidadesExtra: true,
        capacidadesRevogadas: true,
        perfil: { select: { capacidades: true } },
      },
    });

    const haAdmin = ativos.some((m) => {
      const efetivas =
        m.id === membro.id
          ? capacidadesEfetivas(
              m.perfil.capacidades,
              parsed.data.extra,
              parsed.data.revogadas,
            )
          : capacidadesEfetivas(
              m.perfil.capacidades,
              m.capacidadesExtra,
              m.capacidadesRevogadas,
            );
      return eAdmin(efetivas);
    });

    // Aborta a transação sem escrever se o clube ficasse sem admin.
    if (!haAdmin) return true;

    await tx.membroClube.update({
      where: { id: membro.id },
      data: {
        capacidadesExtra: parsed.data.extra,
        capacidadesRevogadas: parsed.data.revogadas,
      },
    });
    return false;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

  if (semAdmin) {
    return erro(
      "Não é possível revogar as permissões de administração do último administrador do clube",
    );
  }

  revalidatePath(PATH);
  return ok(undefined);
}
