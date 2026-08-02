import Link from "next/link";
import { Plus, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { listarModelosJogo } from "@/lib/actions/modeloJogo";
import { EstadoErro, EstadoVazio } from "@/components/layout/EstadosUI";
import { LABEL_MOMENTO, MOMENTOS } from "@/lib/schemas/modeloJogo";
import { diagramaSchema } from "@/lib/schemas/exercicio";
import { MiniaturaCampo } from "@/components/campo/MiniaturaCampo";
import type { MomentoJogo } from "@prisma/client";

export default async function ModeloJogoPage({
  searchParams,
}: {
  searchParams: Promise<{ momento?: string }>;
}) {
  const { momento: momentoParam } = await searchParams;
  const momento = MOMENTOS.includes(momentoParam as MomentoJogo)
    ? (momentoParam as MomentoJogo)
    : undefined;

  const res = await listarModelosJogo(momento);
  if (!res.sucesso) return <EstadoErro mensagem={res.erro} />;
  const modelos = res.dados;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1>Modelo de jogo</h1>
        <Button asChild>
          <Link href="/modelo-jogo/novo">
            <Plus className="h-4 w-4" />
            Nova representação
          </Link>
        </Button>
      </div>

      <div className="-mb-px flex flex-wrap border-b border-cinza-200">
        <Link
          href="/modelo-jogo"
          className={`px-4 py-2.5 text-corpo font-medium border-b-2 transition-colors ${!momento ? "border-primary text-primary" : "border-transparent text-cinza-600 hover:text-cinza-900"}`}
        >
          Todos
        </Link>
        {MOMENTOS.map((m) => (
          <Link
            key={m}
            href={`/modelo-jogo?momento=${m}`}
            className={`whitespace-nowrap px-4 py-2.5 text-corpo font-medium border-b-2 transition-colors ${momento === m ? "border-primary text-primary" : "border-transparent text-cinza-600 hover:text-cinza-900"}`}
          >
            {LABEL_MOMENTO[m]}
          </Link>
        ))}
      </div>

      {modelos.length === 0 ? (
        <EstadoVazio
          titulo="Define o teu modelo de jogo"
          descricao="Cria representações por momento (organização, transições, bolas paradas)."
          acao={
            <Button asChild>
              <Link href="/modelo-jogo/novo"><Plus className="h-4 w-4" />Criar</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {modelos.map((m) => {
            const diag = diagramaSchema.safeParse(m.diagrama);
            const temDiagrama = diag.success && diag.data.elementos.length > 0;
            return (
              <Link
                key={m.id}
                href={`/modelo-jogo/${m.id}`}
                className="flex flex-col gap-3 rounded-lg border border-cinza-200 bg-white p-4 shadow-card transition-all hover:border-azul-300 hover:shadow-md"
              >
                {temDiagrama ? (
                  <div className="overflow-hidden rounded">
                    <MiniaturaCampo diagrama={diag.data} largura={400} className="w-full" />
                  </div>
                ) : (
                  <div className="flex h-24 items-center justify-center rounded bg-cinza-50">
                    <ClipboardList className="h-8 w-8 text-cinza-300" />
                  </div>
                )}
                <p className="text-corpo font-semibold text-cinza-900 line-clamp-2">{m.nome}</p>
                <Badge variant="secondary" className="w-fit">{LABEL_MOMENTO[m.momento]}</Badge>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
