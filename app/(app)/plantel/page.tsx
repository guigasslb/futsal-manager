import Link from "next/link";
import { Plus, AlertTriangle, FileBarChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listarAtletas } from "@/lib/actions/atletas";
import { listarEscaloes } from "@/lib/actions/escaloes";
import { EstadoErro, EstadoVazio } from "@/components/layout/EstadosUI";
import { CampoPesquisa } from "@/components/layout/CampoPesquisa";
import { AvatarAtleta } from "@/components/plantel/AvatarAtleta";
import { ABREV_POSICAO } from "@/lib/schemas/atleta";

export default async function PlantelPage({
  searchParams,
}: {
  searchParams: Promise<{ escalaoId?: string; q?: string }>;
}) {
  const { escalaoId, q } = await searchParams;

  const [resEscaloes, resAtletas] = await Promise.all([
    listarEscaloes(),
    listarAtletas(escalaoId),
  ]);

  if (!resEscaloes.sucesso) return <EstadoErro mensagem={resEscaloes.erro} />;
  if (!resAtletas.sucesso) return <EstadoErro mensagem={resAtletas.erro} />;

  const escaloes = resEscaloes.dados;
  const termo = (q ?? "").trim().toLowerCase();
  const atletas = termo
    ? resAtletas.dados.filter((a) => a.nome.toLowerCase().includes(termo))
    : resAtletas.dados;
  const tabTodos = !escalaoId;

  // Números duplicados entre atletas ativos do mesmo escalão (secção 22.8)
  const contagemNumeros = new Map<string, number>();
  for (const a of resAtletas.dados) {
    if (a.numero == null) continue;
    const chave = `${a.escalaoId}:${a.numero}`;
    contagemNumeros.set(chave, (contagemNumeros.get(chave) ?? 0) + 1);
  }
  const numeroDuplicado = (escalaoIdA: string, numero: number | null) =>
    numero != null && (contagemNumeros.get(`${escalaoIdA}:${numero}`) ?? 0) > 1;
  const haDuplicados = [...contagemNumeros.values()].some((n) => n > 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1>Plantel</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/relatorios">
              <FileBarChart className="h-4 w-4" />
              Relatórios
            </Link>
          </Button>
          <Button asChild>
            <Link href="/plantel/novo">
              <Plus className="h-4 w-4" />
              Novo atleta
            </Link>
          </Button>
        </div>
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

      <CampoPesquisa placeholder="Pesquisar atleta por nome…" />

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
          {haDuplicados && (
            <p className="flex items-center gap-1.5 rounded-md bg-ambar-500/10 px-3 py-2 text-corpo-sec text-ambar-500">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              Há atletas do mesmo escalão com o mesmo número (assinalados a laranja).
            </p>
          )}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {atletas.map((a) => {
              const dup = numeroDuplicado(a.escalaoId, a.numero);
              return (
              <Link
                key={a.id}
                href={`/plantel/${a.id}`}
                className="flex flex-col items-center gap-3 rounded-lg border border-cinza-200 bg-white p-4 text-center shadow-card transition-all hover:border-azul-300 hover:shadow-md"
              >
                <AvatarAtleta nome={a.nome} tamanho="lg" fotoUrl={a.fotoUrl} />
                <div className="w-full">
                  <p className="truncate text-corpo font-semibold text-cinza-900">{a.nome}</p>
                  <p className="text-legenda text-cinza-600">
                    {a.numero != null && (
                      <span className={dup ? "font-semibold text-ambar-500" : ""}>
                        #{a.numero}
                      </span>
                    )}
                    {a.numero != null && a.posicoes.length ? " · " : ""}
                    {a.posicoes.map((p) => ABREV_POSICAO[p]).join(", ")}
                    {a.numero == null && a.posicoes.length === 0 ? "—" : ""}
                  </p>
                </div>
              </Link>
              );
            })}
          </div>
          <p className="text-corpo-sec text-cinza-600">
            {atletas.length} {atletas.length === 1 ? "atleta" : "atletas"}
          </p>
        </>
      )}
    </div>
  );
}
