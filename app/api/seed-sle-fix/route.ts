// ROTA TEMPORÁRIA — CORRECÇÃO do seed do clube "Sport Lisboa e Évora".
// Completa o que ficou por fazer quando o seed base foi interrompido pelo Vercel:
//   - desactiva épocas duplicadas (mantém só "2025/2026" activa);
//   - completa as presenças em falta;
//   - cria os 30 jogos (se ainda não existirem), com convocatórias e estatísticas.
// Remover após execução.
//
// Uso: GET /api/seed-sle-fix?token=sle2026-fix-3p9q
//
// PRÉ-REQUISITO: o clube base já tem de existir (seed_sport_lisboa_evora / rota /api/seed-sle).
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { seedSleFix } from "../../../prisma/data-migrations/seed_sport_lisboa_evora_fix_core";

export const maxDuration = 60;

const TOKEN = "sle2026-fix-3p9q";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (token !== TOKEN) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }

  const prisma = new PrismaClient();
  try {
    const resultado = await seedSleFix(prisma);
    return NextResponse.json(resultado, { status: resultado.ok ? 200 : 409 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, erro: msg }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
