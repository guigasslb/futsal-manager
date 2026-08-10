// prisma/data-migrations/seed_sport_lisboa_evora_fix.ts
//
// CORRECÇÃO (standalone) do seed do clube "Sport Lisboa e Évora".
// Equivalente à rota temporária app/api/seed-sle-fix/route.ts — ambos usam a
// MESMA lógica partilhada (seed_sport_lisboa_evora_fix_core.ts).
//
// PRÉ-REQUISITO: o clube base já tem de existir (npm run db:seed:sle).
//
// EXECUÇÃO MANUAL (com a BD acessível):
//   npm run db:seed:sle-fix
//
// Completa: épocas duplicadas (mantém só "2025/2026" activa), presenças em falta,
// e os 30 jogos (se ainda não existirem) com convocatórias e estatísticas.

import { PrismaClient } from "@prisma/client";
import { seedSleFix } from "./seed_sport_lisboa_evora_fix_core";

const prisma = new PrismaClient();

async function main() {
  const r = await seedSleFix(prisma);
  console.log(`✅ ${r.mensagem}`);
  console.log(`  Época corrigida (duplicados desactivados): ${r.epocaCorrigida}`);
  console.log(`  Presenças adicionadas: ${r.presencasAdicionadas}`);
  console.log(`  Jogos adicionados: ${r.jogosAdicionados}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
