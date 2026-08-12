// lib/social/token.ts
// P4.7 — Token de verificação dos cards sociais (bíblia §3.16).
//
// Objetivo: evitar scraping/enumeração da rota pública de imagem. Não é um
// mecanismo de autenticação (a rota também exige sessão) — é uma assinatura
// HMAC determinística do recurso, gerada no servidor e embutida no URL de
// partilha. NÃO usa segredos de autenticação (regra: auth intocável); usa um
// segredo dedicado com degradação graciosa em desenvolvimento.

import { createHmac, timingSafeEqual } from "node:crypto";
import type { TipoCard } from "@/lib/schemas/social";

function segredo(): string {
  return (
    process.env.SOCIAL_CARD_SECRET ||
    process.env.ENCRYPTION_KEY ||
    "futsalcoach-social-card"
  );
}

/** Identificador canónico do recurso para cada tipo de card. */
function idRecurso(tipo: TipoCard, ids: { jogoId?: string; escalaoId?: string; epocaId?: string }): string {
  if (tipo === "ranking") return `ranking:${ids.escalaoId ?? ""}:${ids.epocaId ?? ""}`;
  return `${tipo}:${ids.jogoId ?? ""}`;
}

/** Gera o token (HMAC-SHA256, base64url, 24 chars) para um recurso. */
export function gerarTokenCard(
  tipo: TipoCard,
  ids: { jogoId?: string; escalaoId?: string; epocaId?: string },
): string {
  return createHmac("sha256", segredo())
    .update(idRecurso(tipo, ids))
    .digest("base64url")
    .slice(0, 24);
}

/** Valida o token de forma resistente a timing attacks. */
export function validarTokenCard(
  tipo: TipoCard,
  ids: { jogoId?: string; escalaoId?: string; epocaId?: string },
  token: string,
): boolean {
  const esperado = gerarTokenCard(tipo, ids);
  const a = Buffer.from(esperado);
  const b = Buffer.from(token);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Constrói o caminho relativo do card social (a usar em `<a href>` /
 * `window.open`). O token é sempre incluído.
 */
export function urlCard(
  tipo: TipoCard,
  ids: { jogoId?: string; escalaoId?: string; epocaId?: string },
): string {
  const q = new URLSearchParams({ tipo });
  if (tipo === "ranking") {
    if (ids.escalaoId) q.set("escalaoId", ids.escalaoId);
    if (ids.epocaId) q.set("epocaId", ids.epocaId);
  } else if (ids.jogoId) {
    q.set("jogoId", ids.jogoId);
  }
  q.set("token", gerarTokenCard(tipo, ids));
  return `/api/social/card?${q.toString()}`;
}
