import type { Metadata } from "next";
import { obterAnaliticoEscalao, obterCompeticoesEscalao } from "@/lib/actions/analise";
import { obterCargaSemanal } from "@/lib/actions/cargaTreino";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { PainelEscalao } from "@/components/analiticos/PainelEscalao";
import { CurvaCargaSemanal } from "@/components/graficos/CurvaCargaSemanal";
import { GerarRelatorioBotao } from "@/components/relatorios/GerarRelatorioBotao";
import { BotaoPartilhaRanking } from "@/components/social/BotaoPartilhaRanking";
import { EstadoVazio } from "@/components/layout/EstadosUI";
import { eEscalaoFormacaoJovem } from "@/lib/schemas/social";
import { urlCard } from "@/lib/social/token";

export const metadata: Metadata = { title: "Analíticos do escalão" };

export default async function AnaliticosEscalaoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ competicao?: string }>;
}) {
  const { id } = await params;
  const { competicao } = await searchParams;
  // P2.5: filtro opcional por competição (campeonato / taça / particulares).
  const [res, resCompeticoes, resCarga] = await Promise.all([
    obterAnaliticoEscalao(id, undefined, competicao || undefined),
    obterCompeticoesEscalao(id),
    obterCargaSemanal(id),
  ]);
  const competicoes = resCompeticoes.sucesso ? resCompeticoes.dados : [];
  // P4.8 (§8.20): só mostra a secção de carga se houver RPE registado.
  const carga = resCarga.sucesso && resCarga.dados.temDados ? resCarga.dados : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <Breadcrumbs
          items={[
            { label: "Analíticos", href: "/analiticos" },
            { label: res.sucesso ? res.dados.escalao.nome : "Escalão" },
          ]}
        />
        {res.sucesso && (
          <div className="flex flex-wrap gap-2">
            {/* P4.7: card social do top 5 marcadores. Bloqueado para formação jovem (RGPD). */}
            {!eEscalaoFormacaoJovem(res.dados.escalao.nome) && (
              <BotaoPartilhaRanking
                url={urlCard("ranking", {
                  escalaoId: id,
                  epocaId: res.dados.epoca.id,
                })}
              />
            )}
            <GerarRelatorioBotao tipo="EPOCA_EQUIPA" escalaoId={id} />
          </div>
        )}
      </div>

      {res.sucesso ? (
        <>
          <div>
            <h1>{res.dados.escalao.nome}</h1>
            <p className="mt-1 text-corpo-sec text-cinza-500">
              Analíticos da equipa · {res.dados.epoca.nome}
            </p>
          </div>
          <PainelEscalao
            dados={res.dados}
            competicoes={competicoes}
            competicaoId={competicao || undefined}
          />
          {/* P4.8 (§8.20): carga de treino (RPE/ACWR) — só quando há RPE registado. */}
          {carga && (
            <div className="rounded-lg border border-cinza-200 bg-white p-5 shadow-card">
              <p className="mb-3 text-legenda font-medium uppercase tracking-wide text-cinza-400">
                Carga de treino
              </p>
              <CurvaCargaSemanal dados={carga.semanas} />
            </div>
          )}
        </>
      ) : res.erro === "Sem permissão" ? (
        <EstadoVazio
          titulo="Sem acesso a este escalão"
          descricao="Não tens permissão para ver os analíticos deste escalão."
        />
      ) : (
        <EstadoVazio titulo="Analíticos indisponíveis" descricao={res.erro} />
      )}
    </div>
  );
}
