// prisma/data-migrations/f7_seed_comunicacao.ts
// F7 M11 — Seed dos modelos de comunicação globais (bíblia §3.9, §8.12).
//
// Instala UM modelo global por cada valor de TipoComunicacao:
//   clubeId = null  → disponível a todos os clubes
//   origemSeed = true → identifica-o como instalado pelo seed (não editável directamente;
//                       o clube cria a sua variante com clubeId preenchido)
//
// A app GERA texto formatado para partilhar no WhatsApp — não envia mensagens
// nem integra qualquer API de mensagens.
//
// PLACEHOLDERS: sintaxe {{nomeDoCampo}}. O gerador (`gerarTextoComunicacao`,
// em lib/actions/comunicacao.ts) substitui-os pelo contexto do evento;
// placeholders sem valor são removidos.
//
// TEXTOS: vivem em `lib/comunicacao-modelos.ts` (módulo puro) — fonte única
// partilhada por este seed e pela action `instalarSeedComunicacao`.
//
// EXECUÇÃO MANUAL:
//   npm run db:seed:comunicacao
//
// Idempotente: usa upsert por (clubeId, tipo). Re-executar actualiza o texto dos
// modelos globais (origemSeed = true) sem tocar em variantes de clube.

import { PrismaClient } from "@prisma/client";
import { MODELOS_COMUNICACAO_SEED } from "../../lib/comunicacao-modelos";

const prisma = new PrismaClient();

// Fonte única dos textos de arranque: `lib/comunicacao-modelos.ts` (módulo puro,
// partilhado por este seed e pela action `instalarSeedComunicacao`).
export { MODELOS_COMUNICACAO_SEED };

async function main() {
  console.log("Início do seed f7 (modelos de comunicação globais)...");

  let criados = 0;
  let actualizados = 0;

  for (const modelo of MODELOS_COMUNICACAO_SEED) {
    // NOTA: em PostgreSQL os NULLs são distintos num índice único, pelo que
    // `@@unique([clubeId, tipo])` não impede globais duplicados. A idempotência
    // do seed é garantida aqui: procura-se explicitamente o global do tipo.
    const existente = await prisma.modeloComunicacao.findFirst({
      where: { clubeId: null, tipo: modelo.tipo },
    });

    if (existente) {
      await prisma.modeloComunicacao.update({
        where: { id: existente.id },
        data: {
          nome: modelo.nome,
          template: modelo.template,
          origemSeed: true,
        },
      });
      actualizados++;
    } else {
      await prisma.modeloComunicacao.create({
        data: {
          tipo: modelo.tipo,
          nome: modelo.nome,
          template: modelo.template,
          clubeId: null,
          origemSeed: true,
        },
      });
      criados++;
    }
  }

  // Validação: um global por cada valor do enum.
  const totalGlobais = await prisma.modeloComunicacao.count({
    where: { clubeId: null, origemSeed: true },
  });
  const esperado = MODELOS_COMUNICACAO_SEED.length;

  if (totalGlobais !== esperado) {
    throw new Error(
      `Seed f7 INCONSISTENTE — esperados ${esperado} modelos globais, encontrados ${totalGlobais}. ` +
        `Verificar duplicados (clubeId = null) antes de prosseguir.`
    );
  }

  console.log(
    `✅ Seed f7 concluído: ${criados} criados, ${actualizados} actualizados (${totalGlobais} modelos globais).`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
