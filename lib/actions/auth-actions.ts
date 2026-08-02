"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/lib/auth";
import { loginSchema } from "@/lib/schemas/auth";
import { erro, erroDeValidacao, ok, type Resultado } from "@/lib/utils";

/**
 * Rate-limiting de login em memória (mitigação de brute-force).
 * Janela deslizante por email: máx. MAX_TENTATIVAS falhas em JANELA_MS.
 * Nota: em memória por instância — adequado a deploy single-VM. Para
 * multi-instância (serverless) migrar para store partilhado (BD/Redis).
 */
const MAX_TENTATIVAS = 5;
const JANELA_MS = 15 * 60 * 1000; // 15 minutos
const tentativas = new Map<string, { contador: number; expiraEm: number }>();

function chaveLimite(email: string): string {
  return email.trim().toLowerCase();
}

function estaBloqueado(email: string): boolean {
  const reg = tentativas.get(chaveLimite(email));
  if (!reg) return false;
  if (Date.now() > reg.expiraEm) {
    tentativas.delete(chaveLimite(email));
    return false;
  }
  return reg.contador >= MAX_TENTATIVAS;
}

function registarFalha(email: string): void {
  const chave = chaveLimite(email);
  const agora = Date.now();
  const reg = tentativas.get(chave);
  if (!reg || agora > reg.expiraEm) {
    tentativas.set(chave, { contador: 1, expiraEm: agora + JANELA_MS });
  } else {
    reg.contador++;
  }
}

/**
 * Autentica o utilizador. Não redireciona no servidor — devolve Resultado
 * para o cliente tratar (mostrar erro inline ou navegar em caso de sucesso).
 */
export async function iniciarSessao(dados: unknown): Promise<Resultado<null>> {
  const parsed = loginSchema.safeParse(dados);
  if (!parsed.success) return erroDeValidacao(parsed.error);

  if (estaBloqueado(parsed.data.email)) {
    return erro("Demasiadas tentativas falhadas. Tenta novamente dentro de 15 minutos.");
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
    // Sucesso — limpa o contador de falhas.
    tentativas.delete(chaveLimite(parsed.data.email));
    return ok(null);
  } catch (e) {
    if (e instanceof AuthError) {
      // CredentialsSignin = email/password errados
      registarFalha(parsed.data.email);
      return erro("Email ou password incorretos");
    }
    // Next.js relança erros de redirect internamente — reencaminhar
    throw e;
  }
}

export async function terminarSessao(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
