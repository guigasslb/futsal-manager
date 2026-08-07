"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, ChevronUp, ChevronDown, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleBiblioteca } from "@/components/exercicios/ToggleBiblioteca";
import { criarModeloSessao, atualizarModeloSessao } from "@/lib/actions/templatesSessao";
import {
  PARTES_TREINO,
  LABEL_PARTE_TREINO,
  FASES_EPOCA,
  LABEL_FASE_EPOCA,
  type ParteTreinoValor,
  type PropriedadeConteudoValor,
} from "@/lib/schemas/exercicio";

const SENTINEL_NONE = "__none__";

type FaseEpocaValor = (typeof FASES_EPOCA)[number];

export type ExercicioPicker = {
  id: string;
  nome: string;
  duracaoMin: number | null;
  parteTreino: ParteTreinoValor | null;
};

export type ModeloParaEdicao = {
  id: string;
  nome: string;
  descricao: string | null;
  objetivoTatico: string | null;
  faseEpoca: FaseEpocaValor | null;
  escalaoAlvo: string | null;
  duracaoMin: number | null;
  proprietario: PropriedadeConteudoValor;
  exercicios: {
    exercicioId: string;
    nome: string;
    duracaoMin: number | null;
    parteTreino: ParteTreinoValor | null;
    notas: string | null;
  }[];
};

/** Linha editável da lista de exercícios do template. */
type Linha = {
  exercicioId: string;
  nome: string;
  duracaoMin: string;
  parteTreino: ParteTreinoValor | typeof SENTINEL_NONE;
};

function linhasIniciais(modelo?: ModeloParaEdicao): Linha[] {
  if (!modelo) return [];
  return modelo.exercicios.map((e) => ({
    exercicioId: e.exercicioId,
    nome: e.nome,
    duracaoMin: e.duracaoMin != null ? String(e.duracaoMin) : "",
    parteTreino: e.parteTreino ?? SENTINEL_NONE,
  }));
}

/**
 * Formulário de template de sessão (secção 3.4): um plano de treino completo,
 * reutilizável, com exercícios ordenados, durações e parte do treino.
 */
export function TemplateSessaoForm({
  biblioteca,
  escaloes,
  modelo,
  podeBibliotecaClube,
  trigger,
}: {
  biblioteca: ExercicioPicker[];
  escaloes: { id: string; nome: string }[];
  modelo?: ModeloParaEdicao;
  podeBibliotecaClube: boolean;
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [pending, startTransition] = useTransition();
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  const [nome, setNome] = useState(modelo?.nome ?? "");
  const [escalaoAlvo, setEscalaoAlvo] = useState(modelo?.escalaoAlvo ?? SENTINEL_NONE);
  const [faseEpoca, setFaseEpoca] = useState<string>(modelo?.faseEpoca ?? SENTINEL_NONE);
  const [objetivoTatico, setObjetivoTatico] = useState(modelo?.objetivoTatico ?? "");
  const [duracaoMin, setDuracaoMin] = useState(
    modelo?.duracaoMin != null ? String(modelo.duracaoMin) : "",
  );
  const [descricao, setDescricao] = useState(modelo?.descricao ?? "");
  const [proprietario, setProprietario] = useState<PropriedadeConteudoValor>(
    modelo?.proprietario ?? "TREINADOR",
  );
  const [linhas, setLinhas] = useState<Linha[]>(() => linhasIniciais(modelo));
  // O picker é remontado após cada escolha para voltar ao placeholder e permitir
  // adicionar o mesmo exercício mais do que uma vez.
  const [pickerKey, setPickerKey] = useState(0);

  const totalMin = linhas.reduce((acc, l) => acc + (Number(l.duracaoMin) || 0), 0);

  function adicionar(exercicioId: string) {
    const ex = biblioteca.find((b) => b.id === exercicioId);
    if (!ex) return;
    setLinhas((atual) => [
      ...atual,
      {
        exercicioId: ex.id,
        nome: ex.nome,
        duracaoMin: ex.duracaoMin != null ? String(ex.duracaoMin) : "",
        parteTreino: ex.parteTreino ?? SENTINEL_NONE,
      },
    ]);
  }

  function remover(index: number) {
    setLinhas((atual) => atual.filter((_, i) => i !== index));
  }

  function mover(index: number, direcao: -1 | 1) {
    const destino = index + direcao;
    if (destino < 0 || destino >= linhas.length) return;
    setLinhas((atual) => {
      const copia = [...atual];
      [copia[index], copia[destino]] = [copia[destino], copia[index]];
      return copia;
    });
  }

  function atualizarLinha(index: number, campo: "duracaoMin" | "parteTreino", valor: string) {
    setLinhas((atual) =>
      atual.map((l, i) =>
        i === index
          ? {
              ...l,
              [campo]: campo === "parteTreino" ? (valor as Linha["parteTreino"]) : valor,
            }
          : l,
      ),
    );
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErros({});
    setErroGeral(null);

    const dados = {
      nome: nome.trim(),
      descricao: descricao.trim() || undefined,
      objetivoTatico: objetivoTatico.trim() || undefined,
      faseEpoca: faseEpoca !== SENTINEL_NONE ? (faseEpoca as FaseEpocaValor) : undefined,
      escalaoAlvo: escalaoAlvo !== SENTINEL_NONE ? escalaoAlvo : undefined,
      duracaoMin: duracaoMin.trim() !== "" ? Number(duracaoMin) : undefined,
      proprietario,
      // A ordem é sempre reindexada 0..n-1 (unique [modeloSessaoId, ordem]).
      exercicios: linhas.map((l, i) => ({
        exercicioId: l.exercicioId,
        ordem: i,
        duracaoMin: l.duracaoMin.trim() !== "" ? Number(l.duracaoMin) : undefined,
        parteTreino:
          l.parteTreino !== SENTINEL_NONE ? (l.parteTreino as ParteTreinoValor) : undefined,
      })),
    };

    startTransition(async () => {
      const res = modelo
        ? await atualizarModeloSessao(modelo.id, dados)
        : await criarModeloSessao(dados);

      if (res.sucesso) {
        toast.success(modelo ? "Template atualizado" : "Template criado");
        setAberto(false);
        if (!modelo) {
          setNome("");
          setObjetivoTatico("");
          setDuracaoMin("");
          setDescricao("");
          setLinhas([]);
        }
        router.refresh();
      } else {
        setErroGeral(res.erro);
        if (res.camposInvalidos) setErros(res.camposInvalidos);
      }
    });
  }

  // Erros das linhas vêm com o caminho "exercicios" ou "exercicios.0.duracaoMin".
  const erroExercicios = Object.entries(erros).find(([k]) => k.startsWith("exercicios"))?.[1];

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{modelo ? "Editar template" : "Novo template de sessão"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {erroGeral && !Object.keys(erros).length && (
            <p className="text-corpo-sec text-vermelho-600">{erroGeral}</p>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="template-nome">Nome *</Label>
            <Input
              id="template-nome"
              value={nome}
              onChange={(ev) => setNome(ev.target.value)}
              required
              maxLength={120}
              placeholder="ex: Pressing defensivo, 60 min, sub-10"
            />
            {erros.nome && <p className="text-legenda text-vermelho-600">{erros.nome}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="template-escalao">Escalão alvo</Label>
              <Select value={escalaoAlvo} onValueChange={setEscalaoAlvo}>
                <SelectTrigger id="template-escalao">
                  <SelectValue placeholder="— Nenhum —" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SENTINEL_NONE}>— Nenhum —</SelectItem>
                  {/* O escalão alvo é texto livre: guardamos o nome do escalão. */}
                  {escaloes.map((e) => (
                    <SelectItem key={e.id} value={e.nome}>
                      {e.nome}
                    </SelectItem>
                  ))}
                  {modelo?.escalaoAlvo &&
                    !escaloes.some((e) => e.nome === modelo.escalaoAlvo) && (
                      <SelectItem value={modelo.escalaoAlvo}>{modelo.escalaoAlvo}</SelectItem>
                    )}
                </SelectContent>
              </Select>
              {erros.escalaoAlvo && (
                <p className="text-legenda text-vermelho-600">{erros.escalaoAlvo}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="template-fase">Fase da época</Label>
              <Select value={faseEpoca} onValueChange={setFaseEpoca}>
                <SelectTrigger id="template-fase">
                  <SelectValue placeholder="— Nenhuma —" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SENTINEL_NONE}>— Nenhuma —</SelectItem>
                  {FASES_EPOCA.map((f) => (
                    <SelectItem key={f} value={f}>
                      {LABEL_FASE_EPOCA[f]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="template-objetivo">Objetivo tático</Label>
              <Input
                id="template-objetivo"
                value={objetivoTatico}
                onChange={(ev) => setObjetivoTatico(ev.target.value)}
                maxLength={500}
                placeholder="ex: Saída a pressão"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="template-duracao">Duração total (min)</Label>
              <Input
                id="template-duracao"
                type="number"
                min={1}
                max={300}
                value={duracaoMin}
                onChange={(ev) => setDuracaoMin(ev.target.value)}
                placeholder="ex: 60"
              />
              {erros.duracaoMin && (
                <p className="text-legenda text-vermelho-600">{erros.duracaoMin}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="template-descricao">Descrição</Label>
            <Textarea
              id="template-descricao"
              value={descricao}
              onChange={(ev) => setDescricao(ev.target.value)}
              maxLength={2000}
              rows={3}
              placeholder="Notas gerais da sessão…"
            />
          </div>

          {podeBibliotecaClube && (
            <ToggleBiblioteca
              valor={proprietario}
              onChange={setProprietario}
              disabled={pending}
              legenda="Onde fica guardado o template"
            />
          )}

          {/* ── Exercícios do template ── */}
          <div className="space-y-3 rounded-md border border-cinza-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-corpo font-medium text-cinza-900">Exercícios *</p>
              {totalMin > 0 && (
                <span className="flex items-center gap-1 text-legenda text-cinza-500">
                  <Clock className="h-3.5 w-3.5" />
                  Total: {totalMin} min
                </span>
              )}
            </div>

            {biblioteca.length === 0 ? (
              <p className="text-corpo-sec text-cinza-600">
                A biblioteca está vazia. Cria ou instala exercícios primeiro.
              </p>
            ) : (
              <Select
                key={pickerKey}
                onValueChange={(v) => {
                  adicionar(v);
                  setPickerKey((k) => k + 1);
                }}
              >
                <SelectTrigger aria-label="Adicionar exercício ao template">
                  <SelectValue placeholder="+ Adicionar exercício da biblioteca…" />
                </SelectTrigger>
                <SelectContent>
                  {biblioteca.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.nome}
                      {b.duracaoMin ? ` · ${b.duracaoMin} min` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {linhas.length === 0 ? (
              <p className="rounded-md border border-dashed border-cinza-300 p-4 text-center text-corpo-sec text-cinza-500">
                Sem exercícios. Adiciona pelo menos um.
              </p>
            ) : (
              <ol className="space-y-2">
                {linhas.map((l, i) => (
                  <li
                    key={`${l.exercicioId}-${i}`}
                    className="flex flex-wrap items-center gap-2 rounded-md border border-cinza-200 bg-white p-2"
                  >
                    <div className="flex flex-col">
                      <button
                        type="button"
                        onClick={() => mover(i, -1)}
                        disabled={i === 0 || pending}
                        className="flex h-6 w-8 items-center justify-center rounded text-cinza-400 hover:text-cinza-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-30"
                        aria-label={`Subir ${l.nome}`}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => mover(i, 1)}
                        disabled={i === linhas.length - 1 || pending}
                        className="flex h-6 w-8 items-center justify-center rounded text-cinza-400 hover:text-cinza-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-30"
                        aria-label={`Descer ${l.nome}`}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </div>

                    <span className="text-corpo font-semibold text-cinza-400">{i + 1}.</span>
                    <span className="min-w-[8rem] flex-1 text-corpo text-cinza-900">
                      {l.nome}
                    </span>

                    <Select
                      value={l.parteTreino}
                      onValueChange={(v) => atualizarLinha(i, "parteTreino", v)}
                    >
                      <SelectTrigger
                        className="w-44"
                        aria-label={`Parte do treino de ${l.nome}`}
                      >
                        <SelectValue placeholder="— Parte —" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={SENTINEL_NONE}>— Parte —</SelectItem>
                        {PARTES_TREINO.map((p) => (
                          <SelectItem key={p} value={p}>
                            {LABEL_PARTE_TREINO[p]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Input
                      type="number"
                      min={1}
                      max={180}
                      value={l.duracaoMin}
                      onChange={(ev) => atualizarLinha(i, "duracaoMin", ev.target.value)}
                      className="w-24"
                      placeholder="min"
                      aria-label={`Duração de ${l.nome} em minutos`}
                    />

                    <button
                      type="button"
                      onClick={() => remover(i)}
                      disabled={pending}
                      className="flex h-11 w-11 items-center justify-center rounded text-vermelho-600 hover:bg-vermelho-600/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-30"
                      aria-label={`Remover ${l.nome}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ol>
            )}

            {erroExercicios && (
              <p className="text-legenda text-vermelho-600">{erroExercicios}</p>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <Button type="submit" disabled={pending || linhas.length === 0 || !nome.trim()}>
              {pending ? "A guardar…" : modelo ? "Guardar alterações" : "Criar template"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => setAberto(false)}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Botão padrão de abertura do formulário em modo de criação. */
export function BotaoNovoTemplate(props: {
  biblioteca: ExercicioPicker[];
  escaloes: { id: string; nome: string }[];
  podeBibliotecaClube: boolean;
}) {
  return (
    <TemplateSessaoForm
      {...props}
      trigger={
        <Button>
          <Plus className="h-4 w-4" />
          Novo template
        </Button>
      }
    />
  );
}
