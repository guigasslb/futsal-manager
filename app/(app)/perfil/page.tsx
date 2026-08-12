import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { obterResumoCarreira } from "@/lib/actions/perfis";
import { ListaRegistosCarreira } from "@/components/perfil/ListaRegistosCarreira";
import { NovoRegistoCarreira } from "@/components/perfil/NovoRegistoCarreira";
import { CopiarLinkPerfil } from "@/components/perfil/CopiarLinkPerfil";

export const metadata: Metadata = { title: "Perfil do treinador" };

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

/**
 * Perfil do treinador e histórico de carreira (P2.4 — §8.17).
 * Espaço pessoal (🎒), portátil: o percurso pertence à pessoa, não ao clube.
 */
export default async function PerfilPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const utilizador = await prisma.utilizador.findUnique({
    where: { id: session.user.id },
    select: { nome: true, email: true },
  });
  if (!utilizador) redirect("/login");

  const resumoRes = await obterResumoCarreira();
  const resumo = resumoRes.sucesso ? resumoRes.dados : null;

  return (
    <div className="space-y-8">
      {/* Cabeçalho — identidade do treinador */}
      <header className="flex flex-wrap items-center gap-4">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-full text-titulo font-semibold text-white select-none"
          style={{ backgroundColor: "var(--cor-primaria, #F0531E)" }}
          aria-hidden
        >
          {iniciais(utilizador.nome)}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-titulo text-cinza-900">{utilizador.nome}</h1>
          <p className="text-corpo-sec text-cinza-600">{utilizador.email}</p>
        </div>
        <CopiarLinkPerfil userId={session.user.id} />
      </header>

      {/* Métricas de carreira agregadas (P4.5) */}
      {resumo && resumo.totalRegistos > 0 && (
        <section className="grid grid-cols-3 gap-3">
          <div className="card-base bg-cinza-50 p-4 text-center">
            <p className="text-titulo font-bold text-cinza-900">
              {resumo.totalRegistos}
            </p>
            <p className="text-legenda text-cinza-600">
              {resumo.totalRegistos === 1 ? "época" : "épocas"} em{" "}
              {resumo.clubesDistintos}{" "}
              {resumo.clubesDistintos === 1 ? "clube" : "clubes"}
            </p>
          </div>
          <div className="card-base bg-laranja-50 p-4 text-center">
            <p className="text-titulo font-bold text-cinza-900">
              {resumo.conquistasTotal}
            </p>
            <p className="text-legenda text-cinza-600">
              {resumo.conquistasTotal === 1 ? "conquista" : "conquistas"}
            </p>
          </div>
          <div className="card-base bg-cinza-50 p-4 text-center">
            <p className="text-titulo font-bold text-cinza-900">
              {resumo.primeiraEpoca ?? "—"}
            </p>
            <p className="text-legenda text-cinza-600">Desde</p>
          </div>
        </section>
      )}

      {/* Histórico de carreira */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-subtitulo text-cinza-900">Histórico de carreira</h2>
            <p className="text-corpo-sec text-cinza-600">
              As tuas passagens por clubes e escalões. Este percurso é teu e
              acompanha-te em toda a carreira.
            </p>
          </div>
          <NovoRegistoCarreira />
        </div>

        <ListaRegistosCarreira />
      </section>
    </div>
  );
}
