import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Mail, ArrowRight, LockKeyhole } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { obterMembroAtual } from "@/lib/permissoes";
import { temLicencaValida } from "@/lib/licenca";
import { terminarSessao } from "@/lib/actions/auth-actions";
import { Logo } from "@/components/layout/Logo";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Subscrição necessária" };

// Contacto direto da equipa (mesmo endereço usado na página pública, secção
// #contacto de app/page.tsx).
const EMAIL_CONTACTO = "goncalo.pereira.1992@gmail.com";
const MAILTO = `mailto:${EMAIL_CONTACTO}?subject=${encodeURIComponent(
  "Subscrição Mister",
)}`;

/**
 * Paywall (§3.11). Vive FORA do grupo de rotas (app), pelo que não passa pela
 * guarda de licença do layout (evita ciclo de redirect). Continua protegida por
 * autenticação (middleware) — só utilizadores autenticados chegam aqui.
 */
export default async function SemLicencaPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Sessão obsoleta (JWT válido mas utilizador apagado) → login.
  const utilizadorExiste = await prisma.utilizador.findUnique({
    where: { id: session.user.id },
    select: { id: true },
  });
  if (!utilizadorExiste) redirect("/login");

  // Sem clube ativo → onboarding (a licença ainda não faz sentido).
  const membro = await obterMembroAtual();
  if (!membro) redirect("/criar-clube");

  // Se (entretanto) já tem licença válida, não faz sentido ficar preso no
  // paywall — segue para a app.
  if (await temLicencaValida(membro.clube.id, membro.utilizadorId)) {
    redirect("/dashboard");
  }

  const nomeClube = membro.clube.nome;

  return (
    <div className="flex min-h-screen items-center justify-center bg-cinza-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <div className="mb-4 flex flex-col items-center gap-3">
            <Logo variant="light" />
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-laranja-600/10 text-laranja-600">
              <LockKeyhole className="h-6 w-6" aria-hidden />
            </span>
          </div>
          <CardTitle className="text-titulo-pagina">Sem subscrição ativa</CardTitle>
          <CardDescription>
            O clube <span className="font-semibold text-cinza-900">{nomeClube}</span>{" "}
            não tem uma subscrição ativa. Para continuar a usar o Mister, ativa ou
            renova a tua subscrição.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          <Button asChild className="w-full">
            <a href={MAILTO}>
              <Mail aria-hidden />
              Falar com a equipa
            </a>
          </Button>

          <Button asChild variant="outline" className="w-full">
            <Link href="/#contacto">
              Ver planos
              <ArrowRight aria-hidden />
            </Link>
          </Button>

          <form action={terminarSessao}>
            <Button type="submit" variant="ghost" className="w-full">
              Terminar sessão
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
