// prisma/data-migrations/f1b_backfill_participacoes.ts
// M3 — Backfill dos dados da fase expand (M2: f1a_atletaescalao_expand).
//
// Preenche:
//   1. Atleta.clubeId          ← escalao.clubeId
//   2. AtletaEscalao           ← escalaoId (PRINCIPAL) + escalaoSecundarioId (SIMULTANEA)
//   3. Presenca.escalaoId      ← sessao.escalaoId
//   4. Presenca.motivo=LESAO   ← estado=LESIONADO
//
// EXECUÇÃO MANUAL, após o deploy do código de switch (BE).
//   npm run db:backfill:f1b
//
// Idempotente: pode ser re-executado sem duplicar dados (UPDATE ... IS NULL + upsert).
// Falha com erro se a validação final detetar registos por preencher — nesse caso
// NÃO avançar para M4 (que torna as colunas NOT NULL).

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Início do backfill f1b...");

  // Passo 1: Atleta.clubeId ← escalao.clubeId
  const r1 = await prisma.$executeRaw`
    UPDATE "Atleta" a
    SET "clubeId" = e."clubeId"
    FROM "Escalao" e
    WHERE a."escalaoId" = e."id"
      AND a."clubeId" IS NULL
  `;
  console.log(`Passo 1: ${r1} atletas com clubeId preenchido.`);

  // Passo 2: Participações PRINCIPAL + SIMULTANEA
  const atletas = await prisma.atleta.findMany({
    select: {
      id: true,
      escalaoId: true,
      escalaoSecundarioId: true,
      epocaId: true,
      numero: true,
      dataIngresso: true,
      criadoEm: true,
    },
  });

  let criadas = 0;
  for (const a of atletas) {
    const dataInicio = a.dataIngresso ?? a.criadoEm;

    // PRINCIPAL
    await prisma.atletaEscalao.upsert({
      where: {
        atletaId_escalaoId_epocaId: {
          atletaId: a.id,
          escalaoId: a.escalaoId,
          epocaId: a.epocaId,
        },
      },
      create: {
        atletaId: a.id,
        escalaoId: a.escalaoId,
        epocaId: a.epocaId,
        tipo: "PRINCIPAL",
        estado: "ATIVO",
        numero: a.numero,
        dataInicio,
      },
      update: {},
    });
    criadas++;

    // SIMULTANEA
    if (a.escalaoSecundarioId) {
      await prisma.atletaEscalao.upsert({
        where: {
          atletaId_escalaoId_epocaId: {
            atletaId: a.id,
            escalaoId: a.escalaoSecundarioId,
            epocaId: a.epocaId,
          },
        },
        create: {
          atletaId: a.id,
          escalaoId: a.escalaoSecundarioId,
          epocaId: a.epocaId,
          tipo: "SIMULTANEA",
          estado: "ATIVO",
          numero: a.numero,
          dataInicio,
        },
        update: {},
      });
      criadas++;
    }
  }
  console.log(`Passo 2: ${criadas} participações criadas/confirmadas.`);

  // Passo 3: Presenca.escalaoId ← escalão da sessão
  const r3 = await prisma.$executeRaw`
    UPDATE "Presenca" p
    SET "escalaoId" = s."escalaoId"
    FROM "Sessao" s
    WHERE p."sessaoId" = s."id"
      AND p."escalaoId" IS NULL
  `;
  console.log(`Passo 3: ${r3} presenças com escalaoId preenchido.`);

  // Passo 4: motivo LESAO para atletas com estado LESIONADO (se existir)
  // Só se o enum EstadoPresenca tiver esse valor — verificar antes de executar
  try {
    const r4 = await prisma.$executeRaw`
      UPDATE "Presenca"
      SET "motivo" = 'LESAO'
      WHERE "estado" = 'LESIONADO' AND "motivo" IS NULL
    `;
    console.log(`Passo 4: ${r4} presenças com motivo=LESAO derivado de estado=LESIONADO.`);
  } catch {
    console.log("Passo 4: estado LESIONADO não existe (ignorado).");
  }

  // Validação
  const atletasSemClube = await prisma.atleta.count({ where: { clubeId: null } });
  const presencasSemEscalao = await prisma.presenca.count({ where: { escalaoId: null } });
  const atletasSemParticipacao = await prisma.$queryRaw<{ n: bigint }[]>`
    SELECT COUNT(*)::bigint AS n FROM "Atleta" a
    WHERE NOT EXISTS (SELECT 1 FROM "AtletaEscalao" ae WHERE ae."atletaId" = a."id")
  `;

  if (
    atletasSemClube > 0 ||
    presencasSemEscalao > 0 ||
    Number(atletasSemParticipacao[0].n) > 0
  ) {
    throw new Error(
      `Backfill INCOMPLETO — NÃO avançar para M4.\n` +
        `  atletasSemClube=${atletasSemClube}\n` +
        `  presencasSemEscalao=${presencasSemEscalao}\n` +
        `  atletasSemParticipacao=${atletasSemParticipacao[0].n}`
    );
  }

  console.log("✅ Backfill f1b concluído e validado. Pode avançar para M4 após deploy do código.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
