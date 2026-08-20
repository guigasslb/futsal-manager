import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Mail,
  ArrowRight,
  LockKeyhole,
  User,
  Building2,
  Landmark,
  Receipt,
} from "lucide-react";
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

// Dados de pagamento por transferência bancária. Placeholders substituídos
// depois pelos valores reais (IBAN e email de receção do comprovativo).
const IBAN = "IBAN_PLACEHOLDER";
const EMAIL_COMPROVATIVO = "EMAIL_PLACEHOLDER";

// Tabela de preços da licença de Clube (§3.11 / §17.1 da bíblia). Tiers por
// número total de escalões (transversal às secções).
const TIERS_CLUBE = [
  { tier: "Pequeno", escaloes: "até 2 escalões", mensal: "€15", anual: "€149" },
  { tier: "Médio", escaloes: "até 4 escalões", mensal: "€19", anual: "€190" },
  { tier: "Grande", escaloes: "até 8 escalões", mensal: "€34", anual: "€340" },
  { tier: "Parceiro", escaloes: "sob medida", mensal: "negociado", anual: "" },
] as const;

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
  const emailTitular = session.user.email ?? "o teu email";
  const referencia = `${nomeClube} + ${emailTitular}`;

  return (
    <div className="flex min-h-screen items-start justify-center bg-cinza-50 px-4 py-8 sm:items-center">
      <Card className="w-full max-w-lg">
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
            ainda não tem uma subscrição ativa.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Instrução principal */}
          <p className="rounded-md bg-laranja-50 p-4 text-corpo text-cinza-900">
            Para ativar a tua subscrição, faz uma{" "}
            <span className="font-semibold">transferência bancária</span> e envia
            o comprovativo.
          </p>

          {/* Planos */}
          <section className="space-y-3">
            <h2 className="text-titulo-seccao text-cinza-900">Planos</h2>

            {/* Individual */}
            <div className="rounded-md border border-cinza-200 p-4">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-laranja-600" aria-hidden />
                <h3 className="text-subtitulo text-cinza-900">Individual</h3>
              </div>
              <p className="mt-1 text-corpo text-cinza-900">
                <span className="font-semibold">€4,99</span>/mês ou{" "}
                <span className="font-semibold">€49</span>/ano
              </p>
              <p className="mt-1 text-corpo-sec text-cinza-600">
                Para uma modalidade (futsal ou futebol).
              </p>
            </div>

            {/* Clube */}
            <div className="rounded-md border border-cinza-200 p-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-laranja-600" aria-hidden />
                <h3 className="text-subtitulo text-cinza-900">Clube</h3>
              </div>
              <p className="mt-1 text-corpo-sec text-cinza-600">
                Preço por número de escalões:
              </p>

              <ul className="mt-3 divide-y divide-cinza-200">
                {TIERS_CLUBE.map((t) => (
                  <li
                    key={t.tier}
                    className="flex items-baseline justify-between gap-3 py-2"
                  >
                    <span className="text-corpo text-cinza-900">
                      <span className="font-semibold">{t.tier}</span>{" "}
                      <span className="text-corpo-sec text-cinza-600">
                        ({t.escaloes})
                      </span>
                    </span>
                    <span className="shrink-0 text-right text-corpo text-cinza-900">
                      {t.anual ? (
                        <>
                          <span className="font-semibold">{t.mensal}</span>/mês
                          <span className="text-cinza-400"> · </span>
                          <span className="font-semibold">{t.anual}</span>/ano
                        </>
                      ) : (
                        <span className="font-semibold">{t.mensal}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>

              <p className="mt-3 text-corpo-sec text-cinza-600">
                Clube com mais do que uma modalidade: <span className="font-semibold">+50%</span>{" "}
                por cada secção adicional.
              </p>
            </div>
          </section>

          {/* Dados para transferência */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Landmark className="h-5 w-5 text-laranja-600" aria-hidden />
              <h2 className="text-titulo-seccao text-cinza-900">
                Dados para transferência
              </h2>
            </div>

            <dl className="space-y-3 rounded-md border border-cinza-200 p-4">
              <div>
                <dt className="text-corpo-sec text-cinza-600">IBAN</dt>
                <dd className="mt-0.5 select-all break-all font-mono text-corpo text-cinza-900">
                  {IBAN}
                </dd>
              </div>
              <div>
                <dt className="text-corpo-sec text-cinza-600">Referência</dt>
                <dd className="mt-0.5 break-words text-corpo text-cinza-900">
                  {referencia}
                </dd>
              </div>
            </dl>
          </section>

          {/* Enviar comprovativo */}
          <section className="space-y-2">
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-laranja-600" aria-hidden />
              <h2 className="text-titulo-seccao text-cinza-900">
                Enviar comprovativo para
              </h2>
            </div>
            <p className="select-all break-all rounded-md border border-cinza-200 p-4 font-mono text-corpo text-cinza-900">
              {EMAIL_COMPROVATIVO}
            </p>
          </section>

          {/* Ações */}
          <div className="space-y-3 pt-1">
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
