"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { eliminarRegistoCarreira } from "@/lib/actions/perfis";
import { RegistoCarreiraForm } from "./RegistoCarreiraForm";
import type { RegistoCarreira } from "@prisma/client";

/**
 * Ações (editar / eliminar) de um registo de carreira (P2.4 — §8.17).
 * Componente cliente usado por cada item da lista (Server Component).
 */
export function RegistoCarreiraAcoes({ registo }: { registo: RegistoCarreira }) {
  const router = useRouter();
  const [editar, setEditar] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const [pending, startTransition] = useTransition();

  function eliminar() {
    startTransition(async () => {
      const res = await eliminarRegistoCarreira(registo.id);
      if (res.sucesso) {
        toast.success("Registo eliminado");
        setConfirmar(false);
        router.refresh();
      } else {
        toast.error(res.erro);
      }
    });
  }

  return (
    <div className="flex flex-shrink-0 items-center gap-1">
      <Dialog open={editar} onOpenChange={setEditar}>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Editar registo"
          onClick={() => setEditar(true)}
        >
          <Pencil className="h-4 w-4 text-cinza-500" />
        </Button>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar registo de carreira</DialogTitle>
          </DialogHeader>
          <RegistoCarreiraForm
            registo={registo}
            onDone={() => {
              setEditar(false);
              router.refresh();
            }}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmar} onOpenChange={setConfirmar}>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Eliminar registo"
          onClick={() => setConfirmar(true)}
        >
          <Trash2 className="h-4 w-4 text-cinza-500" />
        </Button>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar registo de carreira?</AlertDialogTitle>
            <AlertDialogDescription>
              Vais eliminar {registo.clube} ({registo.escalao}). Esta ação não
              pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending}
              onClick={(e) => {
                e.preventDefault();
                eliminar();
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
