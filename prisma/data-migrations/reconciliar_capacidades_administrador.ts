// prisma/data-migrations/reconciliar_capacidades_administrador.ts
//
// BUG: utilizadores com perfil "Administrador" veem "Não tens permissão para
// gerir comunicações" porque os perfis criados ANTES da feature de comunicações
// (F7) não têm a capacidade COMUNICACOES_GERIR gravada em `Perfil.capacidades`.
//
// Causa: os perfis são materializados por clube a partir de PERFIS_ARRANQUE
// (secção 6.5 da bíblia) no momento em que o clube é criado. Capacidades
// adicionadas ao catálogo DEPOIS (COMUNICACOES_GERIR, LEMBRETES_EQUIPA_GERIR,
// PROMOVER_ATLETAS, SECCAO_ESCALOES_GERIR, ...) NÃO retroagem aos perfis já
// existentes na BD — só aparecem em clubes criados a partir daí.
//
// FIX: o perfil "Administrador" é, por definição, `[...CAPACIDADES]` (controlo
// total do clube — ver PERFIS_ARRANQUE em lib/permissoes-catalogo.ts). Este
// script reconcilia todos os perfis "Administrador" existentes para conterem
// o catálogo COMPLETO de capacidades. Resolve o COMUNICACOES_GERIR em falta e,
// pela mesma via, qualquer outra capacidade nova ausente (mesmo problema).
//
// ÂMBITO: apenas perfis com nome = "Administrador". Não toca noutros perfis
// (Diretor Técnico, Treinador Principal, Adjunto, Coordenador de Secção), que
// têm subconjuntos deliberados do catálogo. Não toca em auth.
//
// EXECUÇÃO MANUAL:
//   npm run db:migrate:cap-admin
//
// Idempotente: só grava quando há capacidades em falta; re-executar não altera
// nada depois da primeira passagem.

import { PrismaClient } from "@prisma/client";
import { CAPACIDADES } from "../../lib/permissoes-catalogo";

const prisma = new PrismaClient();

// Nome canónico do perfil de controlo total (PERFIS_ARRANQUE).
const NOME_PERFIL_ADMIN = "Administrador";

async function main() {
  console.log("Início da reconciliação de capacidades dos perfis Administrador...");

  const catalogo = [...CAPACIDADES];

  const perfisAdmin = await prisma.perfil.findMany({
    where: { nome: NOME_PERFIL_ADMIN },
    select: { id: true, clubeId: true, capacidades: true },
  });

  console.log(`Perfis "Administrador" encontrados: ${perfisAdmin.length}`);

  let atualizados = 0;
  let jaConformes = 0;
  // Contagem por capacidade em falta (para o relatório: "outras capacidades novas").
  const emFaltaPorCapacidade: Record<string, number> = {};

  for (const perfil of perfisAdmin) {
    const atuais = new Set(perfil.capacidades);
    const emFalta = catalogo.filter((cap) => !atuais.has(cap));

    if (emFalta.length === 0) {
      jaConformes++;
      continue;
    }

    for (const cap of emFalta) {
      emFaltaPorCapacidade[cap] = (emFaltaPorCapacidade[cap] ?? 0) + 1;
    }

    // União: preserva quaisquer capacidades extra já presentes e acrescenta as em falta.
    const novas = Array.from(new Set([...perfil.capacidades, ...catalogo]));

    await prisma.perfil.update({
      where: { id: perfil.id },
      data: { capacidades: novas },
    });

    atualizados++;
    console.log(
      `  ✎ Perfil ${perfil.id} (clube ${perfil.clubeId}): +${emFalta.length} capacidade(s) [${emFalta.join(", ")}]`,
    );
  }

  console.log("");
  console.log("─── Resumo ─────────────────────────────────────────────");
  console.log(`  Perfis Administrador:        ${perfisAdmin.length}`);
  console.log(`  Já conformes (sem alteração): ${jaConformes}`);
  console.log(`  Atualizados:                 ${atualizados}`);

  const capacidadesQueFaltavam = Object.keys(emFaltaPorCapacidade).sort();
  if (capacidadesQueFaltavam.length > 0) {
    console.log("");
    console.log("  Capacidades que estavam em falta (nº de perfis afetados):");
    for (const cap of capacidadesQueFaltavam) {
      const marcador = cap === "COMUNICACOES_GERIR" ? " ← bug reportado" : "";
      console.log(`    • ${cap}: ${emFaltaPorCapacidade[cap]}${marcador}`);
    }
  } else {
    console.log("  Todos os perfis Administrador já continham o catálogo completo.");
  }

  // Validação final: nenhum perfil Administrador pode ficar sem uma capacidade do catálogo.
  const restantes = await prisma.perfil.findMany({
    where: { nome: NOME_PERFIL_ADMIN },
    select: { id: true, capacidades: true },
  });
  const inconsistentes = restantes.filter(
    (p) => catalogo.some((cap) => !p.capacidades.includes(cap)),
  );
  if (inconsistentes.length > 0) {
    throw new Error(
      `Reconciliação INCONSISTENTE — ${inconsistentes.length} perfil(is) Administrador ` +
        `ainda sem o catálogo completo: ${inconsistentes.map((p) => p.id).join(", ")}`,
    );
  }

  console.log("");
  console.log("✅ Reconciliação concluída. Todos os perfis Administrador têm o catálogo completo.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
