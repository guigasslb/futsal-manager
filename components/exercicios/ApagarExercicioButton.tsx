"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { apagarExercicio } from "@/lib/actions/exercicios";

export function ApagarExercicioButton({
  exercicioId,
  nomeExercicio,
}: {
  exercicioId: string;
  nomeExercicio: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleApagar() {
    startTransition(async () => {
      const res = await apagarExercicio(exercicioId);
      if (res.sucesso) {
        toast.success("Exercício apagado");
        router.push("/exercicios");
      } else {
        toast.error(res.erro);
      }
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          className="text-vermelho-600 hover:text-vermelho-600 hover:bg-vermelho-600/10"
          disabled={pending}
        >
          <Trash2 className="h-4 w-4" />
          Apagar exercício
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Apagar «{nomeExercicio}»?</AlertDialogTitle>
          <AlertDialogDescription>
            O exercício será apagado permanentemente. Esta ação é irreversível. Não é
            possível apagar exercícios que estejam a ser usados em sessões de treino.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleApagar}
            className="bg-vermelho-600 hover:bg-vermelho-600/90 text-white"
          >
            Apagar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
