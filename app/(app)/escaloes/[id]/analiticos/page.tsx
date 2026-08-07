import type { Metadata } from "next";
import { obterAnaliticoEscalao } from "@/lib/actions/analise";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { PainelEscalao } from "@/components/analiticos/PainelEscalao";
import { GerarRelatorioBotao } from "@/components/relatorios/GerarRelatorioBotao";
import { EstadoVazio } from "@/components/layout/EstadosUI";

export const metadata: Metadata = { title: "Analíticos do escalão" };

export default async function AnaliticosEscalaoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const res = await obterAnaliticoEscalao(id);

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
          <GerarRelatorioBotao tipo="EPOCA_EQUIPA" escalaoId={id} />
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
          <PainelEscalao dados={res.dados} />
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
