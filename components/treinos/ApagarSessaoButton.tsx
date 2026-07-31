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
import { apagarSessao } from "@/lib/actions/treinos";

export function ApagarSessaoButton({ sessaoId }: { sessaoId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleApagar() {
    startTransition(async () => {
      const res = await apagarSessao(sessaoId);
      if (res.sucesso) {
        toast.success("Sessão apagada");
        router.push("/treinos");
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
          Apagar sessão
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Apagar esta sessão?</AlertDialogTitle>
          <AlertDialogDescription>
            A sessão, os seus exercícios e presenças serão apagados permanentemente. Esta
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
