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
import { apagarModeloJogo } from "@/lib/actions/modeloJogo";

export function ApagarModeloJogoButton({ id, nome }: { id: string; nome: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleApagar() {
    startTransition(async () => {
      const res = await apagarModeloJogo(id);
      if (res.sucesso) {
        toast.success("Modelo apagado");
        router.push("/modelo-jogo");
      } else toast.error(res.erro);
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" className="text-vermelho-600 hover:text-vermelho-600 hover:bg-vermelho-600/10" disabled={pending}>
          <Trash2 className="h-4 w-4" />
          Apagar modelo
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Apagar «{nome}»?</AlertDialogTitle>
          <AlertDialogDescription>Esta ação é irreversível.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleApagar} className="bg-vermelho-600 hover:bg-vermelho-600/90 text-white">
            Apagar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
