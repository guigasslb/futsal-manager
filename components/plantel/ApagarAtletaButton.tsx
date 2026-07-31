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
import { apagarAtleta } from "@/lib/actions/atletas";

export function ApagarAtletaButton({ atletaId, nomeAtleta }: { atletaId: string; nomeAtleta: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleApagar() {
    startTransition(async () => {
      const res = await apagarAtleta(atletaId);
      if (res.sucesso) {
        toast.success("Atleta arquivado");
        router.push("/plantel");
      } else {
        toast.error(res.erro);
      }
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" className="text-vermelho-600 hover:text-vermelho-600 hover:bg-vermelho-600/10" disabled={pending}>
          <Trash2 className="h-4 w-4" />
          Arquivar atleta
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Arquivar «{nomeAtleta}»?</AlertDialogTitle>
          <AlertDialogDescription>
            O atleta ficará inativo e deixará de aparecer nas listas. As estatísticas e
            presenças são preservadas.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleApagar}
            className="bg-vermelho-600 hover:bg-vermelho-600/90 text-white"
          >
            Arquivar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
