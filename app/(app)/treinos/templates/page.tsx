import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, Clock, Dumbbell, Backpack, Landmark, Sparkles, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { listarModelosSessao } from "@/lib/actions/templatesSessao";
import { listarExercicios } from "@/lib/actions/exercicios";
import { listarEscaloes } from "@/lib/actions/escaloes";
import { obterMembroAtual } from "@/lib/permissoes";
import { EstadoErro, EstadoVazio } from "@/components/layout/EstadosUI";
import { LABEL_FASE_EPOCA, LABEL_PARTE_TREINO, FASES_EPOCA } from "@/lib/schemas/exercicio";
import { FiltroEscalaoAlvo } from "@/components/treinos/FiltroEscalaoAlvo";
import {
  BotaoNovoTemplate,
  TemplateSessaoForm,
  type ExercicioPicker,
  type ModeloParaEdicao,
} from "@/components/treinos/TemplateSessaoForm";
import {
  ApagarTemplateButton,
  CriarSessaoDeTemplateButton,
  PartilharTemplateButton,
} from "@/components/treinos/AcoesTemplate";
import { InstalarTemplatesButton } from "@/components/treinos/InstalarTemplatesButton";

type FaseEpocaValor = (typeof FASES_EPOCA)[number];

export const metadata: Metadata = { title: "Templates de treino" };

export default async function TemplatesSessaoPage({
  searchParams,
}: {
  searchParams: Promise<{ escalaoAlvo?: string }>;
}) {
  const { escalaoAlvo } = await searchParams;

  // A lista completa é necessária para construir as opções do filtro (o escalão
  // alvo é texto livre) — a filtragem em si é feita sobre esse conjunto.
  const [resModelos, resExercicios, resEscaloes, membro] = await Promise.all([
    listarModelosSessao(),
    listarExercicios(),
    listarEscaloes(),
    obterMembroAtual(),
  ]);

  if (!resModelos.sucesso) return <EstadoErro mensagem={resModelos.erro} />;
  if (!resExercicios.sucesso) return <EstadoErro mensagem={resExercicios.erro} />;
  if (!resEscaloes.sucesso) return <EstadoErro mensagem={resEscaloes.erro} />;

  const todos = resModelos.dados;
  const escaloes = resEscaloes.dados.map((e) => ({ id: e.id, nome: e.nome }));
  const utilizadorId = membro?.utilizadorId ?? null;
  const podeBibliotecaClube = membro?.capacidades.includes("EXERCICIOS_GERIR") ?? false;

  const biblioteca: ExercicioPicker[] = resExercicios.dados.map((e) => ({
    id: e.id,
    nome: e.nome,
    duracaoMin: e.duracaoMin,
    parteTreino: e.parteTreino,
  }));

  // Opções do filtro: valores distintos de escalão alvo presentes nos templates.
  const opcoesEscalao = [
    ...new Set(todos.map((m) => m.escalaoAlvo).filter((v): v is string => Boolean(v))),
  ].sort((a, b) => a.localeCompare(b, "pt-PT"));

  const filtro = escalaoAlvo?.trim() ?? "";
  const modelos = filtro
    ? todos.filter((m) => (m.escalaoAlvo ?? "").toLowerCase() === filtro.toLowerCase())
    : todos;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/treinos"
          className="flex min-h-[44px] items-center gap-1 text-corpo-sec text-cinza-600 transition-colors hover:text-cinza-900"
        >
          <ChevronLeft className="h-4 w-4" />
          Treinos
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1>Templates de sessão</h1>
        <div className="flex flex-wrap gap-2">
          {podeBibliotecaClube && todos.length > 0 && <InstalarTemplatesButton />}
          <BotaoNovoTemplate
            biblioteca={biblioteca}
            escaloes={escaloes}
            podeBibliotecaClube={podeBibliotecaClube}
          />
        </div>
      </div>

      <p className="text-corpo-sec text-cinza-600">
        Sessões completas pré-construídas e reutilizáveis. Criar uma sessão a partir de um
        template copia os exercícios e durações — o template não fica ligado à sessão.
      </p>

      {opcoesEscalao.length > 0 && (
        <FiltroEscalaoAlvo valor={filtro || undefined} opcoes={opcoesEscalao} />
      )}

      {modelos.length === 0 ? (
        <EstadoVazio
          titulo={filtro ? "Nenhum template para este escalão" : "Ainda não há templates"}
          descricao={
            filtro
              ? "Ajusta o filtro para veres mais templates."
              : "Instala os templates curados de arranque ou cria o teu primeiro template."
          }
          acao={
            filtro ? (
              <Button asChild variant="outline">
                <Link href="/treinos/templates">Limpar filtro</Link>
              </Button>
            ) : podeBibliotecaClube ? (
              <InstalarTemplatesButton variant="default" />
            ) : undefined
          }
        />
      ) : (
        <ul className="space-y-3">
          {modelos.map((m) => {
            const totalMin =
              m.duracaoMin ??
              m.exercicios.reduce(
                (acc, e) => acc + (e.duracaoMin ?? e.exercicio.duracaoMin ?? 0),
                0,
              );
            const ehPessoal = m.origem === "PESSOAL";
            const podeEditar = ehPessoal || podeBibliotecaClube;
            const podeApagar = ehPessoal || podeBibliotecaClube;
            const podePartilhar = ehPessoal && podeBibliotecaClube && m.autorId === utilizadorId;

            const paraEdicao: ModeloParaEdicao = {
              id: m.id,
              nome: m.nome,
              descricao: m.descricao,
              objetivoTatico: m.objetivoTatico,
              faseEpoca: (m.faseEpoca as FaseEpocaValor | null) ?? null,
              escalaoAlvo: m.escalaoAlvo,
              duracaoMin: m.duracaoMin,
              proprietario: m.proprietario,
              exercicios: m.exercicios.map((e) => ({
                exercicioId: e.exercicioId,
                nome: e.exercicio.nome,
                duracaoMin: e.duracaoMin,
                parteTreino: e.parteTreino,
                notas: e.notas,
              })),
            };

            return (
              <li
                key={m.id}
                className="rounded-lg border border-cinza-200 bg-white p-4 shadow-card"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-[12rem] flex-1 space-y-1">
                    <p className="text-corpo font-semibold text-cinza-900">{m.nome}</p>
                    {m.objetivoTatico && (
                      <p className="text-corpo-sec text-cinza-600">{m.objetivoTatico}</p>
                    )}
                  </div>
                  <Badge variant="outline" className="gap-1">
                    {ehPessoal ? (
                      <>
                        <Backpack className="h-3 w-3" />
                        Pessoal
                      </>
                    ) : (
                      <>
                        <Landmark className="h-3 w-3" />
                        Clube
                      </>
                    )}
                  </Badge>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-3 text-legenda text-cinza-500">
                  <span className="flex items-center gap-1">
                    <Dumbbell className="h-3.5 w-3.5" />
                    {m.exercicios.length} exercício(s)
                  </span>
                  {totalMin > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {totalMin} min
                    </span>
                  )}
                  {m.escalaoAlvo && <Badge variant="secondary">{m.escalaoAlvo}</Badge>}
                  {m.faseEpoca && (
                    <Badge variant="outline">
                      {LABEL_FASE_EPOCA[m.faseEpoca as FaseEpocaValor]}
                    </Badge>
                  )}
                  {m.origemSeed && (
                    <Badge variant="outline" className="gap-1">
                      <Sparkles className="h-3 w-3" />
                      Curado
                    </Badge>
                  )}
                </div>

                {m.exercicios.length > 0 && (
                  <ol className="mt-3 space-y-1 border-l-2 border-cinza-200 pl-3">
                    {m.exercicios.map((e) => (
                      <li key={e.id} className="text-legenda text-cinza-600">
                        {e.exercicio.nome}
                        {e.parteTreino ? ` · ${LABEL_PARTE_TREINO[e.parteTreino]}` : ""}
                        {e.duracaoMin ? ` · ${e.duracaoMin} min` : ""}
                      </li>
                    ))}
                  </ol>
                )}

                <div className="mt-4 flex flex-wrap gap-2 border-t border-cinza-200 pt-3">
                  <CriarSessaoDeTemplateButton
                    modeloSessaoId={m.id}
                    nomeTemplate={m.nome}
                    escaloes={escaloes}
                    escalaoIdSugerido={
                      escaloes.find(
                        (e) => e.nome.toLowerCase() === (m.escalaoAlvo ?? "").toLowerCase(),
                      )?.id
                    }
                  />
                  {podeEditar && (
                    <TemplateSessaoForm
                      biblioteca={biblioteca}
                      escaloes={escaloes}
                      modelo={paraEdicao}
                      podeBibliotecaClube={podeBibliotecaClube}
                      trigger={
                        <Button variant="outline" size="sm" className="min-h-[44px]">
                          <Pencil className="h-4 w-4" />
                          Editar
                        </Button>
                      }
                    />
                  )}
                  {podePartilhar && <PartilharTemplateButton modeloSessaoId={m.id} />}
                  {podeApagar && (
                    <ApagarTemplateButton modeloSessaoId={m.id} nomeTemplate={m.nome} />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
