"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Unlink } from "lucide-react";
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
import { desconectarGoogleCalendar } from "@/lib/actions/integracao";

/**
 * Desliga a integração com o Google Calendar (§3.12), com confirmação.
 * Nota: desligar não apaga eventos já criados no calendário (§8.13).
 */
export function DesligarCalendarioButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function desligar() {
    startTransition(async () => {
      const res = await desconectarGoogleCalendar();
      if (res.sucesso) {
        toast.success("Google Calendar desligado");
        router.refresh();
      } else {
        toast.error(res.erro);
      }
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" disabled={pending}>
          <Unlink className="h-4 w-4" />
          Desligar
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Tens a certeza que queres desligar o Google Calendar?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Deixaremos de sincronizar novos treinos e jogos. Os eventos já criados no
            teu calendário não serão apagados.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={desligar}
            className="bg-vermelho-600 hover:bg-vermelho-600/90 text-white"
          >
            Desligar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
