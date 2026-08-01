import Link from "next/link";
import { listarEscaloes } from "@/lib/actions/escaloes";
import { listarAtletas } from "@/lib/actions/atletas";
import { obterRelatorioEquipa } from "@/lib/actions/relatorios";
import { BotaoImprimir } from "@/components/relatorios/BotaoImprimir";
import { EstadoErro } from "@/components/layout/EstadosUI";

function Cartao({ valor, label }: { valor: string | number; label: string }) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-cinza-200 bg-white p-4">
      <span className="text-titulo-pagina font-bold text-azul-700">{valor}</span>
      <span className="text-legenda text-cinza-500">{label}</span>
    </div>
  );
}

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ escalaoId?: string }>;
}) {
  const { escalaoId } = await searchParams;
  const resEsc = await listarEscaloes();
  if (!resEsc.sucesso) return <EstadoErro mensagem={resEsc.erro} />;
  const escaloes = resEsc.dados;
  const selecionado = escalaoId ?? escaloes[0]?.id;

  const [resRel, resAtletas] = selecionado
    ? await Promise.all([obterRelatorioEquipa(selecionado), listarAtletas(selecionado)])
    : [null, null];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <h1>Relatórios</h1>
        <BotaoImprimir />
      </div>

      {escaloes.length > 0 && (
        <div className="-mb-px flex flex-wrap border-b border-cinza-200 print:hidden">
          {escaloes.map((e) => (
            <Link
              key={e.id}
              href={`/relatorios?escalaoId=${e.id}`}
              className={`px-4 py-2.5 text-corpo font-medium border-b-2 transition-colors ${
                selecionado === e.id
                  ? "border-azul-700 text-azul-700"
                  : "border-transparent text-cinza-600 hover:text-cinza-900"
              }`}
            >
              {e.nome}
            </Link>
          ))}
        </div>
      )}

      {resRel && resRel.sucesso ? (
        <div className="space-y-6">
          <div>
            <h2 className="text-titulo-seccao text-cinza-900">
              {resRel.dados.escalaoNome} — {resRel.dados.epocaNome}
            </h2>
            <p className="text-corpo-sec text-cinza-500">Relatório de equipa</p>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            <Cartao valor={resRel.dados.jogos} label="jogos" />
            <Cartao valor={resRel.dados.vitorias} label="vitórias" />
            <Cartao valor={resRel.dados.empates} label="empates" />
            <Cartao valor={resRel.dados.derrotas} label="derrotas" />
            <Cartao valor={resRel.dados.golosMarcados} label="golos M" />
            <Cartao valor={resRel.dados.golosSofridos} label="golos S" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Cartao valor={resRel.dados.nAtletas} label="atletas" />
            <Cartao valor={resRel.dados.sessoes} label="sessões" />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="mb-2 text-subtitulo text-cinza-900">Melhores marcadores</h3>
              {resRel.dados.marcadores.length === 0 ? (
                <p className="text-corpo-sec text-cinza-500">Sem golos registados.</p>
              ) : (
                <ol className="space-y-1">
                  {resRel.dados.marcadores.map((m, i) => (
                    <li key={m.nome} className="flex justify-between border-b border-cinza-100 py-1 text-corpo-sec">
                      <span className="text-cinza-900">{i + 1}. {m.nome}</span>
                      <span className="font-semibold text-azul-700">{m.golos}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
            <div>
              <h3 className="mb-2 text-subtitulo text-cinza-900">Melhores assistentes</h3>
              {resRel.dados.assistentes.length === 0 ? (
                <p className="text-corpo-sec text-cinza-500">Sem assistências registadas.</p>
              ) : (
                <ol className="space-y-1">
                  {resRel.dados.assistentes.map((m, i) => (
                    <li key={m.nome} className="flex justify-between border-b border-cinza-100 py-1 text-corpo-sec">
                      <span className="text-cinza-900">{i + 1}. {m.nome}</span>
                      <span className="font-semibold text-azul-700">{m.assistencias}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>

          {resAtletas && resAtletas.sucesso && resAtletas.dados.length > 0 && (
            <div className="print:hidden">
              <h3 className="mb-2 text-subtitulo text-cinza-900">Relatórios individuais</h3>
              <div className="flex flex-wrap gap-2">
                {resAtletas.dados.map((a) => (
                  <Link
                    key={a.id}
                    href={`/plantel/${a.id}/relatorio`}
                    className="rounded-full border border-cinza-200 px-3 py-1 text-legenda text-cinza-700 hover:bg-cinza-50"
                  >
                    {a.nome}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-corpo-sec text-cinza-500">Seleciona um escalão para ver o relatório.</p>
      )}
    </div>
  );
}
