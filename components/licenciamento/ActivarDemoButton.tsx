"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { criarLicencaDemostracao } from "@/lib/actions/licenciamento";

/**
 * Botão para o Admin activar uma licença de demonstração (F11).
 * Idempotente do lado da action; usa `router.refresh()` para reobter o
 * estado no Server Component após sucesso.
 */
export function ActivarDemoButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function activar() {
    startTransition(async () => {
      const res = await criarLicencaDemostracao();
      if (res.sucesso) {
        toast.success("Licença de demonstração ativada");
        router.refresh();
      } else {
        toast.error(res.erro);
      }
    });
  }

  return (
    <Button onClick={activar} disabled={pending}>
      <Sparkles className="h-4 w-4" />
      {pending ? "A ativar…" : "Ativar licença de demonstração"}
    </Button>
  );
}
