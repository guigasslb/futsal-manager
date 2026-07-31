import Link from "next/link";
import { Plus, Home, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listarJogos } from "@/lib/actions/jogos";
import { listarEscaloes } from "@/lib/actions/escaloes";
import { EstadoErro, EstadoVazio } from "@/components/layout/EstadosUI";

function formatarData(data: Date): string {
  return new Date(data).toLocaleDateString("pt-PT", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

export default async function JogosPage({
  searchParams,
}: {
  searchParams: Promise<{ escalaoId?: string }>;
}) {
  const { escalaoId } = await searchParams;

  const [resEscaloes, resJogos] = await Promise.all([
    listarEscaloes(),
    listarJogos(escalaoId),
  ]);

  if (!resEscaloes.sucesso) return <EstadoErro mensagem={resEscaloes.erro} />;
  if (!resJogos.sucesso) return <EstadoErro mensagem={resJogos.erro} />;

  const escaloes = resEscaloes.dados;
  const jogos = resJogos.dados;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1>Jogos</h1>
        <Button asChild>
          <Link href="/jogos/novo">
            <Plus className="h-4 w-4" />
            Novo jogo
          </Link>
        </Button>
      </div>

      {escaloes.length > 0 && (
        <div className="-mb-px flex flex-wrap border-b border-cinza-200">
          <Link
            href="/jogos"
            className={`px-4 py-2.5 text-corpo font-medium border-b-2 transition-colors ${
              !escalaoId
                ? "border-azul-700 text-azul-700"
                : "border-transparent text-cinza-600 hover:text-cinza-900"
            }`}
          >
            Todos
          </Link>
          {escaloes.map((e) => (
            <Link
              key={e.id}
              href={`/jogos?escalaoId=${e.id}`}
              className={`px-4 py-2.5 text-corpo font-medium border-b-2 transition-colors ${
                escalaoId === e.id
                  ? "border-azul-700 text-azul-700"
                  : "border-transparent text-cinza-600 hover:text-cinza-900"
              }`}
            >
              {e.nome}
            </Link>
          ))}
        </div>
      )}

      {jogos.length === 0 ? (
        <EstadoVazio
          titulo="Sem jogos nesta época"
          descricao="Regista o primeiro jogo."
          acao={
            <Button asChild>
              <Link href="/jogos/novo">
                <Plus className="h-4 w-4" />
                Registar jogo
              </Link>
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {jogos.map((j) => {
            const temResultado = j.golosMarcados != null && j.golosSofridos != null;
            return (
              <li key={j.id}>
                <Link
                  href={`/jogos/${j.id}`}
                  className="flex items-center gap-4 rounded-lg border border-cinza-200 bg-white p-4 shadow-card transition-all hover:border-azul-300 hover:shadow-md"
                >
                  <div className="flex flex-col items-center">
                    {j.casaFora === "CASA" ? (
                      <Home className="h-5 w-5 text-cinza-400" />
                    ) : (
                      <Plane className="h-5 w-5 text-cinza-400" />
                    )}
                    <span className="text-legenda text-cinza-400 capitalize">
                      {formatarData(j.data)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-corpo font-semibold text-cinza-900">
                      vs {j.adversario}
                    </p>
                    <p className="text-legenda text-cinza-500">
                      {j.escalao.nome}
                      {j.competicao ? ` · ${j.competicao}` : ""}
                    </p>
                  </div>
                  {temResultado && (
                    <div className="text-titulo-seccao font-bold text-cinza-900">
                      {j.golosMarcados}–{j.golosSofridos}
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
