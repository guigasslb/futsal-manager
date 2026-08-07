"use client";

// Instala no clube uma cópia editável dos 7 modelos de arranque (§3.9).
// A action é idempotente: nunca sobrepõe personalizações já existentes.

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { instalarSeedComunicacao } from "@/lib/actions/comunicacao";

export function InstalarModelosButton({
  rotulo = "Instalar templates base",
  variant = "outline",
}: {
  rotulo?: string;
  variant?: "default" | "outline";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function instalar() {
    startTransition(async () => {
      const res = await instalarSeedComunicacao();
      if (res.sucesso) {
        toast.success("Templates instalados no clube");
        router.refresh();
      } else {
        toast.error(res.erro);
      }
    });
  }

  return (
    <Button type="button" variant={variant} onClick={instalar} disabled={pending}>
      <Download className="h-4 w-4" />
      {pending ? "A instalar…" : rotulo}
    </Button>
  );
}
