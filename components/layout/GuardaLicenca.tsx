"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { deveBloquearPorLicenca } from "@/lib/guarda-licenca";

/**
 * Guarda de licença dependente da rota (§3.11 / §8.1).
 *
 * A validade da licença é avaliada server-side no layout e chega aqui via
 * `licencaOk`. Esta guarda apenas DECIDE, no cliente, se deve bloquear com base
 * na rota atual — necessário porque o pathname não está disponível de forma
 * limpa num layout server-side sem alterar o middleware (intocável).
 *
 * O fluxo de `/onboarding` fica sempre acessível (mesmo sem licença) para o
 * utilizador poder concluir o setup do clube antes do paywall.
 *
 * Quando bloqueia, NÃO renderiza os filhos (evita flash de conteúdo protegido)
 * e redireciona para /sem-licenca.
 */
export function GuardaLicenca({
  licencaOk,
  children,
}: {
  licencaOk: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const bloquear = deveBloquearPorLicenca(licencaOk, pathname);

  useEffect(() => {
    if (bloquear) router.replace("/sem-licenca");
  }, [bloquear, router]);

  if (bloquear) return null;
  return <>{children}</>;
}
