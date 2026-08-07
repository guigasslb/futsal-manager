"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Landmark, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  partilharExercicioNoClube,
  removerPartilhaNoClube,
} from "@/lib/actions/exercicios";

/**
 * Toggle de contribuição de um exercício 🎒 pessoal para a biblioteca 🏛️ do clube
 * (secção 3.3). A propriedade nunca é transferida — o autor mantém o exercício.
 * Só o autor pode partilhar/remover, pelo que o botão só deve ser renderizado
 * para os exercícios do próprio.
 */
export function PartilhaExercicioButton({
  exercicioId,
  partilhado,
  tamanho = "sm",
}: {
  exercicioId: string;
  partilhado: boolean;
  tamanho?: "sm" | "default";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function alternar() {
    startTransition(async () => {
      const res = partilhado
        ? await removerPartilhaNoClube({ exercicioId })
        : await partilharExercicioNoClube({ exercicioId });

      if (res.sucesso) {
        toast.success(
          partilhado
            ? "Exercício removido da biblioteca do clube"
            : "Exercício partilhado na biblioteca do clube",
        );
        router.refresh();
      } else {
        toast.error(res.erro);
      }
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      size={tamanho}
      disabled={pending}
      onClick={alternar}
      className="min-h-[44px]"
    >
      {partilhado ? <Undo2 className="h-4 w-4" /> : <Landmark className="h-4 w-4" />}
      {pending
        ? "A guardar…"
        : partilhado
          ? "Remover da biblioteca do clube"
          : "Partilhar no clube"}
    </Button>
  );
}
