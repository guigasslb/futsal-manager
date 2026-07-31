"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/lib/auth";
import { loginSchema } from "@/lib/schemas/auth";
import { erro, erroDeValidacao, ok, type Resultado } from "@/lib/utils";

/**
 * Autentica o utilizador. Não redireciona no servidor — devolve Resultado
 * para o cliente tratar (mostrar erro inline ou navegar em caso de sucesso).
 */
export async function iniciarSessao(dados: unknown): Promise<Resultado<null>> {
  const parsed = loginSchema.safeParse(dados);
  if (!parsed.success) return erroDeValidacao(parsed.error);

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
    return ok(null);
  } catch (e) {
    if (e instanceof AuthError) {
      // CredentialsSignin = email/password errados
      return erro("Email ou password incorretos");
    }
    // Next.js relança erros de redirect internamente — reencaminhar
    throw e;
  }
}

export async function terminarSessao(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
