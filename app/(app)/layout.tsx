import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listarEpocas } from "@/lib/actions/epocas";
import { obterEpocaAtiva } from "@/lib/epoca-context";
import { obterMembroAtual } from "@/lib/permissoes";
import { BarraTopo } from "@/components/layout/BarraTopo";
import { Navegacao } from "@/components/layout/Navegacao";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Sem clube ativo → onboarding (criar clube ou aceitar convite).
  const membro = await obterMembroAtual();
  if (!membro) redirect("/criar-clube");

  const [epocasResult, epocaAtiva] = await Promise.all([
    listarEpocas(),
    obterEpocaAtiva(),
  ]);
  const epocas = epocasResult.sucesso ? epocasResult.dados : [];
  const clube = membro.clube;

  return (
    <div
      className="flex min-h-screen flex-col"
      style={
        {
          "--cor-primaria": clube.corPrimaria,
          "--cor-secundaria": clube.corSecundaria,
        } as React.CSSProperties
      }
    >
      <BarraTopo
        nomeUtilizador={session.user.name ?? "Utilizador"}
        epocas={epocas}
        epocaAtivaId={epocaAtiva?.id ?? null}
        nomeClube={clube.nome}
        logoClube={clube.logoUrl}
      />

      <div className="flex flex-1 overflow-hidden">
        <Navegacao />

        <main className="flex-1 overflow-y-auto p-4 pb-20 md:pb-6 md:p-6">
          <div className="mx-auto max-w-[1200px]">
            {!epocaAtiva && (
              <div className="mb-4 rounded-md border border-ambar-500/30 bg-ambar-500/10 px-4 py-3 text-corpo text-cinza-900">
                Nenhuma época ativa —{" "}
                <a href="/definicoes/epocas" className="font-medium underline">
                  define uma nas Definições
                </a>
                .
              </div>
            )}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
