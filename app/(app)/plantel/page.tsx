import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listarAtletas } from "@/lib/actions/atletas";
import { listarEscaloes } from "@/lib/actions/escaloes";
import { EstadoErro, EstadoVazio } from "@/components/layout/EstadosUI";
import { AvatarAtleta } from "@/components/plantel/AvatarAtleta";
import { ABREV_POSICAO } from "@/lib/schemas/atleta";

export default async function PlantelPage({
  searchParams,
}: {
  searchParams: Promise<{ escalaoId?: string }>;
}) {
  const { escalaoId } = await searchParams;

  const [resEscaloes, resAtletas] = await Promise.all([
    listarEscaloes(),
    listarAtletas(escalaoId),
  ]);

  if (!resEscaloes.sucesso) return <EstadoErro mensagem={resEscaloes.erro} />;
  if (!resAtletas.sucesso) return <EstadoErro mensagem={resAtletas.erro} />;

  const escaloes = resEscaloes.dados;
  const atletas = resAtletas.dados;
  const tabTodos = !escalaoId;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1>Plantel</h1>
        <Button asChild>
          <Link href="/plantel/novo">
            <Plus className="h-4 w-4" />
            Novo atleta
          </Link>
        </Button>
      </div>

      {escaloes.length > 0 && (
        <div className="-mb-px flex flex-wrap gap-0 border-b border-cinza-200">
          <Link
            href="/plantel"
            className={`px-4 py-2.5 text-corpo font-medium border-b-2 transition-colors ${
              tabTodos
                ? "border-azul-700 text-azul-700"
                : "border-transparent text-cinza-600 hover:text-cinza-900"
            }`}
          >
            Todos
          </Link>
          {escaloes.map((e) => {
            const ativo = escalaoId === e.id;
            return (
              <Link
                key={e.id}
                href={`/plantel?escalaoId=${e.id}`}
                className={`px-4 py-2.5 text-corpo font-medium border-b-2 transition-colors ${
                  ativo
                    ? "border-azul-700 text-azul-700"
                    : "border-transparent text-cinza-600 hover:text-cinza-900"
                }`}
              >
                {e.nome}
              </Link>
            );
          })}
        </div>
      )}

      {atletas.length === 0 ? (
        <EstadoVazio
          titulo="Ainda não há atletas neste escalão"
          descricao="Adiciona o primeiro atleta ao plantel."
          acao={
            <Button asChild>
              <Link href="/plantel/novo">
                <Plus className="h-4 w-4" />
                Adicionar atleta
              </Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {atletas.map((a) => (
              <Link
                key={a.id}
                href={`/plantel/${a.id}`}
                className="flex flex-col items-center gap-3 rounded-lg border border-cinza-200 bg-white p-4 text-center shadow-card transition-all hover:border-azul-300 hover:shadow-md"
              >
                <AvatarAtleta nome={a.nome} tamanho="lg" />
                <div className="w-full">
                  <p className="truncate text-corpo font-semibold text-cinza-900">{a.nome}</p>
                  <p className="text-legenda text-cinza-600">
                    {a.numero != null ? `#${a.numero}` : ""}
                    {a.numero != null && a.posicao ? " · " : ""}
                    {a.posicao ? ABREV_POSICAO[a.posicao] : ""}
                    {a.numero == null && !a.posicao ? "—" : ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>
          <p className="text-corpo-sec text-cinza-600">
            {atletas.length} {atletas.length === 1 ? "atleta" : "atletas"}
          </p>
        </>
      )}
    </div>
  );
}
