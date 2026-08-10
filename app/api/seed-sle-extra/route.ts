// ROTA TEMPORÁRIA — seed suplementar de dados de demonstração do clube
// "Sport Lisboa e Évora" (exercícios, sessões, periodização, reuniões, caderneta).
// Remover após execução.
//
// Uso: GET /api/seed-sle-extra?token=sle2026-extra-7k2m
//
// PRÉ-REQUISITO: o clube base já tem de existir (rota /api/seed-sle ou db:seed:sle).
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { seedSleExtra } from "../../../prisma/data-migrations/seed_sport_lisboa_evora_extra_core";

export const maxDuration = 60;

const TOKEN = "sle2026-extra-7k2m";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (token !== TOKEN) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }

  const prisma = new PrismaClient();
  try {
    const resultado = await seedSleExtra(prisma);
    return NextResponse.json(resultado, { status: resultado.ok ? 200 : 409 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, erro: msg }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
