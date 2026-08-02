import Link from "next/link";
import { Plus, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { listarExercicios } from "@/lib/actions/exercicios";
import { EstadoErro, EstadoVazio } from "@/components/layout/EstadosUI";
import { CampoPesquisa } from "@/components/layout/CampoPesquisa";
import { LABEL_CATEGORIA, CATEGORIAS, diagramaSchema } from "@/lib/schemas/exercicio";
import { MiniaturaCampo } from "@/components/campo/MiniaturaCampo";
import { InstalarBibliotecaButton } from "@/components/exercicios/InstalarBibliotecaButton";
import type { CategoriaExercicioPrincipal } from "@prisma/client";

export default async function ExerciciosPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; q?: string }>;
}) {
  const { categoria: categoriaParam, q } = await searchParams;
  const categoria = CATEGORIAS.includes(categoriaParam as CategoriaExercicioPrincipal)
    ? (categoriaParam as CategoriaExercicioPrincipal)
    : undefined;

  const res = await listarExercicios(categoria);
  if (!res.sucesso) return <EstadoErro mensagem={res.erro} />;

  const termo = (q ?? "").trim().toLowerCase();
  const exercicios = termo
    ? res.dados.filter((e) => e.nome.toLowerCase().includes(termo))
    : res.dados;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1>Exercícios</h1>
        <div className="flex gap-2">
          <InstalarBibliotecaButton />
          <Button asChild>
            <Link href="/exercicios/novo">
              <Plus className="h-4 w-4" />
              Novo exercício
            </Link>
          </Button>
        </div>
      </div>

      {/* Filtro por categoria */}
      <div className="-mb-px flex overflow-x-auto border-b border-cinza-200">
        <Link
          href="/exercicios"
          className={`whitespace-nowrap px-4 py-2.5 text-corpo font-medium border-b-2 transition-colors ${
            !categoria
              ? "border-azul-700 text-azul-700"
              : "border-transparent text-cinza-600 hover:text-cinza-900"
          }`}
        >
          Todos
        </Link>
        {CATEGORIAS.map((c) => (
          <Link
            key={c}
            href={`/exercicios?categoria=${c}`}
            className={`whitespace-nowrap px-4 py-2.5 text-corpo font-medium border-b-2 transition-colors ${
              categoria === c
                ? "border-azul-700 text-azul-700"
                : "border-transparent text-cinza-600 hover:text-cinza-900"
            }`}
          >
            {LABEL_CATEGORIA[c]}
          </Link>
        ))}
      </div>

      <CampoPesquisa placeholder="Pesquisar exercício por nome…" />

      {exercicios.length === 0 ? (
        <EstadoVazio
          titulo="A biblioteca está vazia"
          descricao={
            categoria
              ? `Não há exercícios na categoria "${LABEL_CATEGORIA[categoria]}".`
              : "Cria o primeiro exercício para começar a construir a tua biblioteca."
          }
          acao={
            <Button asChild>
              <Link href="/exercicios/novo">
                <Plus className="h-4 w-4" />
                Criar exercício
              </Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {exercicios.map((e) => {
              const diag = diagramaSchema.safeParse(e.diagrama);
              const temDiagrama = diag.success && diag.data.elementos.length > 0;
              return (
              <Link
                key={e.id}
                href={`/exercicios/${e.id}`}
                className="flex flex-col gap-3 rounded-lg border border-cinza-200 bg-white p-4 shadow-card transition-all hover:border-azul-300 hover:shadow-md"
              >
                {temDiagrama && (
                  <div className="overflow-hidden rounded">
                    <MiniaturaCampo diagrama={diag.data} largura={400} className="w-full" />
                  </div>
                )}
                <div className="flex items-start justify-between gap-2">
                  <p className="line-clamp-2 flex-1 text-corpo font-semibold text-cinza-900">
                    {e.nome}
                  </p>
                  {e.duracaoMin && (
                    <span className="flex flex-shrink-0 items-center gap-1 whitespace-nowrap text-legenda text-cinza-500">
                      <Clock className="h-3.5 w-3.5" />
                      {e.duracaoMin} min
                    </span>
                  )}
                </div>
                {e.objetivo && (
                  <p className="line-clamp-2 text-corpo-sec text-cinza-600">{e.objetivo}</p>
                )}
                <div className="mt-auto">
                  {e.categoriaPrincipal ? (
                    <Badge variant="secondary">{LABEL_CATEGORIA[e.categoriaPrincipal]}</Badge>
                  ) : (
                    <Badge variant="outline" className="text-cinza-400">
                      Sem categoria
                    </Badge>
                  )}
                </div>
              </Link>
              );
            })}
          </div>
          <p className="text-corpo-sec text-cinza-600">
            {exercicios.length} {exercicios.length === 1 ? "exercício" : "exercícios"}
          </p>
        </>
      )}
    </div>
  );
}
