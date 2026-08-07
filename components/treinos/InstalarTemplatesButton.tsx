"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { instalarTemplatesArranque } from "@/lib/actions/templatesSessao";

/**
 * Instala os templates 🏛️ curados de arranque no clube. Idempotente — requer a
 * biblioteca de exercícios de arranque instalada (os templates referenciam-na).
 */
export function InstalarTemplatesButton({
  variant = "outline",
}: {
  variant?: "outline" | "default";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function instalar() {
    startTransition(async () => {
      const res = await instalarTemplatesArranque();
      if (res.sucesso) {
        toast.success(
          res.dados.criados > 0
            ? `${res.dados.criados} template(s) instalado(s)`
            : "Os templates de arranque já estão instalados neste clube.",
        );
        router.refresh();
      } else {
        toast.error(res.erro);
      }
    });
  }

  return (
    <Button variant={variant} onClick={instalar} disabled={pending} className="min-h-[44px]">
      <Download className="h-4 w-4" />
      {pending ? "A instalar…" : "Instalar templates de arranque"}
    </Button>
  );
}
