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
import { apagarJogo } from "@/lib/actions/jogos";

export function ApagarJogoButton({ jogoId }: { jogoId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleApagar() {
    startTransition(async () => {
      const res = await apagarJogo(jogoId);
      if (res.sucesso) {
        toast.success("Jogo apagado");
        router.push("/jogos");
      } else {
        toast.error(res.erro);
      }
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          className="text-vermelho-600 hover:text-vermelho-600"
          disabled={pending}
        >
          <Trash2 className="h-4 w-4" />
          Apagar
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Apagar este jogo?</AlertDialogTitle>
          <AlertDialogDescription>
            O jogo, a convocatória e as estatísticas serão apagados permanentemente. Esta
            ação é irreversível.
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
