// prisma/data-migrations/seed_sport_lisboa_evora_extra.ts
//
// Seed suplementar (standalone) do clube "Sport Lisboa e Évora".
// Equivalente à rota temporária app/api/seed-sle-extra/route.ts — ambos usam a
// MESMA lógica partilhada (seed_sport_lisboa_evora_extra_core.ts).
//
// PRÉ-REQUISITO: o clube base já tem de existir (npm run db:seed:sle).
//
// EXECUÇÃO MANUAL (com a BD acessível):
//   npm run db:seed:sle-extra
//
// Acrescenta: 5 subcategorias, 20 exercícios, exercícios nas sessões,
// periodização (7 mesociclos em 3 períodos), 6 reuniões e 10 habilidades
// com progresso na caderneta.

import { PrismaClient } from "@prisma/client";
import { seedSleExtra } from "./seed_sport_lisboa_evora_extra_core";

const prisma = new PrismaClient();

async function main() {
  const resultado = await seedSleExtra(prisma);
  if (!resultado.ok) {
    console.log(`⚠️  ${resultado.mensagem}`);
    return;
  }
  console.log(`✅ ${resultado.mensagem}`);
  if (resultado.dados) {
    const d = resultado.dados;
    console.log(`  Subcategorias: ${d.subcategorias}`);
    console.log(`  Exercícios: ${d.exercicios}`);
    console.log(`  Exercícios em sessões (criados): ${d.sessaoExercicios}`);
    console.log(`  Planeamentos (mesociclos): ${d.planeamentos}`);
    console.log(`  Sessões ligadas a planeamento: ${d.sessoesLigadas}`);
    console.log(`  Reuniões: ${d.reunioes}`);
    console.log(`  Habilidades: ${d.habilidades}`);
    console.log(`  Progressos de caderneta (criados): ${d.progressos}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
