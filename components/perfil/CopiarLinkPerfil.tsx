"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Copia o link do perfil do treinador para o clipboard (P4.5 — §8.17).
 *
 * Client-only e sem rota nova: a partilha pública propriamente dita requer mais
 * design (é FUTURO), por isso limitamo-nos a copiar `${origin}/perfil/{userId}`
 * para a área de transferência. Não cria coluna nova nem endpoint.
 */
export function CopiarLinkPerfil({ userId }: { userId: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    const url = `${window.location.origin}/perfil/${userId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      toast.error("Não foi possível copiar o link");
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={copiar}
      className="min-h-[44px]"
    >
      {copiado ? (
        <Check className="h-4 w-4" />
      ) : (
        <Link2 className="h-4 w-4" />
      )}
      {copiado ? "Link copiado" : "Copiar link do perfil"}
    </Button>
  );
}
