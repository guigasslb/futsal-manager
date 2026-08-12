"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RegistoCarreiraForm } from "./RegistoCarreiraForm";

/**
 * Botão + diálogo para adicionar um novo registo de carreira (P2.4 — §8.17).
 */
export function NovoRegistoCarreira() {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" /> Adicionar registo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo registo de carreira</DialogTitle>
        </DialogHeader>
        <RegistoCarreiraForm
          onDone={() => {
            setAberto(false);
            router.refresh();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
