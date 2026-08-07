"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { obterUrlAutorizacaoCalendario } from "@/lib/actions/integracao";

/**
 * Inicia o fluxo OAuth de ligação ao Google Calendar (§3.12).
 * Obtém o URL de consentimento via Server Action e redireciona o browser.
 */
export function LigarCalendarioButton() {
  const [pending, startTransition] = useTransition();

  function ligar() {
    startTransition(async () => {
      const res = await obterUrlAutorizacaoCalendario();
      if (res.sucesso) {
        window.location.href = res.dados;
      } else {
        toast.error(res.erro);
      }
    });
  }

  return (
    <Button onClick={ligar} disabled={pending}>
      <Calendar className="h-4 w-4" />
      {pending ? "A ligar…" : "Ligar Google Calendar"}
    </Button>
  );
}
