// ─────────────────────────────────────────────
// Guarda de plataforma — acesso ao backoffice interno (/admin).
//
// SEPARADA da autenticação e da guarda de licença (segue o padrão de
// `lib/guarda-licenca.ts` / `lib/permissoes.ts`): a auth continua intocável.
// Um admin de plataforma é um operador do produto Mister (não um papel de
// clube) — identificado por uma allowlist de emails em `ADMIN_EMAILS`.
//
// NÃO usa a diretiva `"use server"`: um módulo de Server Actions só pode
// exportar funções `async`, e `eAdminPlataforma` é um predicado puro
// (síncrono) reutilizável e testável. É o mesmo padrão de `permissoes.ts`,
// que expõe helpers server-side sem essa diretiva.
// ─────────────────────────────────────────────

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

/**
 * Verdadeiro quando `email` consta na allowlist `ADMIN_EMAILS` (lista separada
 * por vírgulas). Predicado PURO — a comparação é case-insensitive e ignora
 * espaços e entradas vazias. Sem a variável definida, ninguém é admin.
 */
export function eAdminPlataforma(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowlist = process.env.ADMIN_EMAILS ?? "";
  return allowlist
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.trim().toLowerCase());
}

/**
 * Guarda para Server Components / layouts do grupo (admin): redireciona para
 * /dashboard quem não seja admin de plataforma (sessão em falta ou email fora
 * da allowlist). Não expõe a existência do backoffice a não-admins.
 */
export async function exigirAdminPlataforma(): Promise<void> {
  const sessao = await auth();
  if (!eAdminPlataforma(sessao?.user?.email)) {
    redirect("/dashboard");
  }
}
