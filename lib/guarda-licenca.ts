// ─────────────────────────────────────────────
// Guarda de licença — decisão PURA e dependente da rota (§3.11 / §8.1).
//
// Isolada de infra (sem prisma / sem `server-only`) para poder ser usada num
// componente client (<GuardaLicenca>) E testada isoladamente. NÃO importar aqui
// nada de `lib/licenca.ts` (esse módulo importa `prisma` e não pode ir para o
// bundle do cliente).
//
// Regra: sem licença válida → bloquear o acesso à área da app, EXCETO no fluxo
// de onboarding (`/onboarding`), que fica sempre acessível para o utilizador
// concluir o setup do clube antes de ser confrontado com o paywall.
// ─────────────────────────────────────────────

/**
 * Verdadeiro quando a guarda deve bloquear o acesso e redirecionar para o
 * paywall (/sem-licenca), dado o estado da licença e a rota atual.
 *
 * - Licença válida → nunca bloqueia.
 * - Sem licença + rota de onboarding → não bloqueia (deixa concluir o setup).
 * - Sem licença + qualquer outra rota → bloqueia.
 *
 * O match de onboarding é exato (`/onboarding` ou `/onboarding/...`) para não
 * apanhar falsos positivos como `/onboarding-algo`.
 */
export function deveBloquearPorLicenca(
  licencaOk: boolean,
  pathname: string | null | undefined,
): boolean {
  if (licencaOk) return false;
  const p = pathname ?? "";
  if (p === "/onboarding" || p.startsWith("/onboarding/")) return false;
  return true;
}
