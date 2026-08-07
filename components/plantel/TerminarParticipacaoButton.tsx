"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogOut } from "lucide-react";
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
import { terminarParticipacao } from "@/lib/actions/participacoes";

/**
 * Termina a participação ativa do atleta num escalão (secção 8.5).
 * A participação passa a inativa com data de fim — o histórico é preservado.
 */
export function TerminarParticipacaoButton({
  atletaId,
  escalaoId,
  escalaoNome,
  nomeAtleta,
}: {
  atletaId: string;
  escalaoId: string;
  escalaoNome: string;
  nomeAtleta: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleTerminar() {
    startTransition(async () => {
      const res = await terminarParticipacao({ atletaId, escalaoId });
      if (res.sucesso) {
        toast.success("Participação terminada");
        router.refresh();
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
          size="sm"
          className="h-11 text-vermelho-600 hover:bg-vermelho-600/10 hover:text-vermelho-600"
          disabled={pending}
        >
          <LogOut className="h-4 w-4" />
          Terminar
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Terminar participação em «{escalaoNome}»?</AlertDialogTitle>
          <AlertDialogDescription>
            {nomeAtleta} deixa de constar no plantel de {escalaoNome} a partir de hoje. As
            presenças e estatísticas já registadas são preservadas no histórico.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleTerminar}
            className="bg-vermelho-600 text-white hover:bg-vermelho-600/90"
          >
            Terminar participação
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
