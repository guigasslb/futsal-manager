import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Pencil, Home, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { obterJogo } from "@/lib/actions/jogos";
import { listarAtletas } from "@/lib/actions/atletas";
import { JogoDetalhe } from "@/components/jogos/JogoDetalhe";
import { ApagarJogoButton } from "@/components/jogos/ApagarJogoButton";
import { LABEL_CASA_FORA } from "@/lib/schemas/jogo";

function formatarData(data: Date): string {
  return new Date(data).toLocaleDateString("pt-PT", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}

export default async function DetalheJogoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const res = await obterJogo(id);
  if (!res.sucesso) notFound();

  const j = res.dados;
  const resAtletas = await listarAtletas(j.escalaoId);
  const atletas = resAtletas.sucesso ? resAtletas.dados : [];

  const convocadosIniciais = j.convocatorias
    .filter((c) => c.convocado)
    .map((c) => c.atletaId);

  const estatisticasIniciais = Object.fromEntries(
    j.estatisticas.map((e) => [
      e.atletaId,
      {
        atletaId: e.atletaId,
        utilizacao: e.utilizacao,
        minutos: e.minutos,
        golos: e.golos,
        assistencias: e.assistencias,
        defesas: e.defesas,
        golosSofridosGR: e.golosSofridosGR,
        faltasCometidas: e.faltasCometidas,
      },
    ]),
  );

  const temResultado = j.golosMarcados != null && j.golosSofridos != null;

  return (
    <div className="space-y-6">
      {/* Navegação */}
      <div className="flex items-center justify-between">
        <Link
          href="/jogos"
          className="flex items-center gap-1 text-corpo-sec text-cinza-600 hover:text-cinza-900 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Jogos
        </Link>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/jogos/${j.id}/editar`}>
              <Pencil className="h-4 w-4" />
              Editar
            </Link>
          </Button>
          <ApagarJogoButton jogoId={j.id} />
        </div>
      </div>

      {/* Cabeçalho */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1>vs {j.adversario}</h1>
          <span className="flex items-center gap-1 rounded-full bg-cinza-50 px-2.5 py-0.5 text-legenda text-cinza-600">
            {j.casaFora === "CASA" ? (
              <Home className="h-3.5 w-3.5" />
            ) : (
              <Plane className="h-3.5 w-3.5" />
            )}
            {LABEL_CASA_FORA[j.casaFora]}
          </span>
          <span className="rounded-full bg-azul-50 px-2.5 py-0.5 text-legenda text-azul-700">
            {j.escalao.nome}
          </span>
        </div>
        <p className="text-corpo-sec text-cinza-600 capitalize">
          {formatarData(j.data)}
          {j.competicao ? ` · ${j.competicao}` : ""}
          {j.local ? ` · ${j.local}` : ""}
        </p>
        {temResultado && (
          <p className="text-titulo-pagina font-bold text-cinza-900">
            {j.golosMarcados} – {j.golosSofridos}
          </p>
        )}
      </div>

      <JogoDetalhe
        jogoId={j.id}
        atletas={atletas.map((a) => ({
          id: a.id,
          nome: a.nome,
          numero: a.numero,
          posicao: a.posicao,
        }))}
        convocadosIniciais={convocadosIniciais}
        estatisticasIniciais={estatisticasIniciais}
        relatorioInicial={j.relatorio ?? ""}
      />
    </div>
  );
}
