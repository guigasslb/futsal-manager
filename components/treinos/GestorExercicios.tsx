"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Trash2, ChevronUp, ChevronDown, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  adicionarExercicioSessao,
  removerExercicioSessao,
  reordenarExercicios,
} from "@/lib/actions/treinos";
import { LABEL_CATEGORIA } from "@/lib/schemas/exercicio";
import type { CategoriaExercicioPrincipal } from "@prisma/client";

type ExercicioSessao = {
  id: string;
  ordem: number;
  duracaoMin: number | null;
  exercicio: { id: string; nome: string; categoriaPrincipal: CategoriaExercicioPrincipal | null };
};

type ExercicioBiblioteca = {
  id: string;
  nome: string;
  categoriaPrincipal: CategoriaExercicioPrincipal | null;
  duracaoMin: number | null;
};

export function GestorExercicios({
  sessaoId,
  exercicios,
  biblioteca,
}: {
  sessaoId: string;
  exercicios: ExercicioSessao[];
  biblioteca: ExercicioBiblioteca[];
}) {
  const [pending, startTransition] = useTransition();
  const [dialogAberto, setDialogAberto] = useState(false);

  const total = exercicios.reduce((acc, e) => acc + (e.duracaoMin ?? 0), 0);
  const jaAdicionados = new Set(exercicios.map((e) => e.exercicio.id));

  function adicionar(exercicioId: string) {
    startTransition(async () => {
      const res = await adicionarExercicioSessao(sessaoId, exercicioId);
      if (res.sucesso) {
        toast.success("Exercício adicionado");
        setDialogAberto(false);
      } else {
        toast.error(res.erro);
      }
    });
  }

  function remover(sessaoExercicioId: string) {
    startTransition(async () => {
      const res = await removerExercicioSessao(sessaoExercicioId);
      if (!res.sucesso) toast.error(res.erro);
    });
  }

  function mover(index: number, direcao: -1 | 1) {
    const novo = index + direcao;
    if (novo < 0 || novo >= exercicios.length) return;
    const reordenado = [...exercicios];
    [reordenado[index], reordenado[novo]] = [reordenado[novo], reordenado[index]];
    const ordens = reordenado.map((e, i) => ({ id: e.id, ordem: i }));
    startTransition(async () => {
      const res = await reordenarExercicios(sessaoId, ordens);
      if (!res.sucesso) toast.error(res.erro);
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-subtitulo text-cinza-900">Exercícios</h2>
        <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4" />
              Adicionar
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Adicionar exercício da biblioteca</DialogTitle>
            </DialogHeader>
            {biblioteca.length === 0 ? (
              <p className="text-corpo-sec text-cinza-600">
                A biblioteca está vazia. Cria exercícios primeiro.
              </p>
            ) : (
              <ul className="space-y-2">
                {biblioteca.map((ex) => (
                  <li
                    key={ex.id}
                    className="flex items-center justify-between gap-3 rounded-md border border-cinza-200 p-3"
                  >
                    <div>
                      <p className="text-corpo font-medium text-cinza-900">{ex.nome}</p>
                      <p className="text-legenda text-cinza-500">
                        {ex.categoriaPrincipal ? LABEL_CATEGORIA[ex.categoriaPrincipal] : "Sem categoria"}
                        {ex.duracaoMin ? ` · ${ex.duracaoMin} min` : ""}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant={jaAdicionados.has(ex.id) ? "ghost" : "outline"}
                      disabled={pending}
                      onClick={() => adicionar(ex.id)}
                    >
                      {jaAdicionados.has(ex.id) ? "Adicionar +1" : "Adicionar"}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {exercicios.length === 0 ? (
        <p className="rounded-md border border-dashed border-cinza-300 p-4 text-center text-corpo-sec text-cinza-500">
          Sem exercícios. Adiciona exercícios da biblioteca.
        </p>
      ) : (
        <>
          <ol className="space-y-2">
            {exercicios.map((e, i) => (
              <li
                key={e.id}
                className="flex items-center gap-3 rounded-md border border-cinza-200 bg-white p-3 shadow-card"
              >
                <div className="flex flex-col">
                  <button
                    onClick={() => mover(i, -1)}
                    disabled={i === 0 || pending}
                    className="flex h-8 w-8 items-center justify-center rounded text-cinza-400 hover:text-cinza-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-30"
                    aria-label="Subir"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => mover(i, 1)}
                    disabled={i === exercicios.length - 1 || pending}
                    className="flex h-8 w-8 items-center justify-center rounded text-cinza-400 hover:text-cinza-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-30"
                    aria-label="Descer"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
                <span className="text-corpo font-semibold text-cinza-400">{i + 1}.</span>
                <div className="flex-1">
                  <p className="text-corpo font-medium text-cinza-900">{e.exercicio.nome}</p>
                  <p className="text-legenda text-cinza-500">
                    {e.exercicio.categoriaPrincipal
                      ? LABEL_CATEGORIA[e.exercicio.categoriaPrincipal]
                      : "Sem categoria"}
                    {e.duracaoMin ? ` · ${e.duracaoMin} min` : ""}
                  </p>
                </div>
                <button
                  onClick={() => remover(e.id)}
                  disabled={pending}
                  className="rounded p-1 text-vermelho-600 hover:bg-vermelho-600/10 disabled:opacity-30"
                  aria-label="Remover exercício"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ol>
          {total > 0 && (
            <p className="flex items-center gap-1 text-corpo-sec text-cinza-600">
              <Clock className="h-4 w-4" />
              Total: {total} min
            </p>
          )}
        </>
      )}
    </div>
  );
}
