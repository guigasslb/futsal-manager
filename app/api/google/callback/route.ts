// app/api/google/callback/route.ts
// Callback OAuth do Google Calendar (bíblia §3.12). Route handler GET, FORA do
// grupo (app) — não passa pelo middleware de autenticação da app. É a única
// excepção REST além do handler do Auth.js (e do futuro webhook Paddle).
//
// ⚠️ NÃO toca no login/autenticação da app: trata exclusivamente a integração
// de terceiros com o Google Calendar.

import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { encriptar } from "@/lib/crypto";
import { trocarCodePorTokens, googleCalendarConfigurado } from "@/lib/google-calendar";
import { googleCallbackSchema } from "@/lib/schemas/integracao";

const DESTINO = "/definicoes/integracao";

function redirecionar(req: NextRequest, query: string): NextResponse {
  const base = process.env.NEXTAUTH_URL ?? process.env.AUTH_URL ?? req.nextUrl.origin;
  return NextResponse.redirect(new URL(`${DESTINO}?${query}`, base));
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!googleCalendarConfigurado()) {
    return redirecionar(req, "erro=calendar");
  }

  const parsed = googleCallbackSchema.safeParse({
    code: req.nextUrl.searchParams.get("code"),
    state: req.nextUrl.searchParams.get("state"),
  });
  if (!parsed.success) {
    return redirecionar(req, "erro=calendar");
  }

  const { code, state: utilizadorId } = parsed.data;

  try {
    // Confirma que o utilizador do `state` existe (evita gravar integração órfã).
    const utilizador = await prisma.utilizador.findUnique({
      where: { id: utilizadorId },
      select: { id: true },
    });
    if (!utilizador) {
      return redirecionar(req, "erro=calendar");
    }

    const { refreshToken } = await trocarCodePorTokens(code);
    if (!refreshToken) {
      // Sem refresh token não é possível sincronizar mais tarde.
      return redirecionar(req, "erro=calendar");
    }

    const refreshTokenCifrado = encriptar(refreshToken);

    await prisma.integracaoCalendario.upsert({
      where: { utilizadorId },
      create: {
        utilizadorId,
        provedor: "google",
        refreshToken: refreshTokenCifrado,
        ativa: true,
      },
      update: {
        provedor: "google",
        refreshToken: refreshTokenCifrado,
        ativa: true,
      },
    });

    return redirecionar(req, "sucesso=calendar");
  } catch (e) {
    console.error("[google/callback] falha ao concluir integração:", e);
    return redirecionar(req, "erro=calendar");
  }
}
