"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { instalarBibliotecaArranque } from "@/lib/actions/exercicios";

export function InstalarBibliotecaButton({ variant = "outline" }: { variant?: "outline" | "default" }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function instalar() {
    startTransition(async () => {
      const res = await instalarBibliotecaArranque();
      if (res.sucesso) {
        // Idempotente: criados = 0 significa que já estava instalada.
        toast.success(
          res.dados.criados > 0
            ? `${res.dados.criados} exercícios instalados`
            : "A biblioteca de arranque já está instalada neste clube.",
        );
        router.refresh();
      } else {
        toast.error(res.erro);
      }
    });
  }

  return (
    <Button variant={variant} onClick={instalar} disabled={pending}>
      <Download className="h-4 w-4" />
      {pending ? "A instalar…" : "Instalar biblioteca de arranque"}
    </Button>
  );
}
