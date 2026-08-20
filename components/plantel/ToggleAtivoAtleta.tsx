"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toggleAtivoAtleta } from "@/lib/actions/atletas";

/**
 * Alterna o estado ativo/inativo do atleta a partir do perfil (secção 8 — plantel).
 *
 * Distingue os atletas do plantel de quem saiu ou está em período experimental.
 * Um atleta inativo continua a existir (histórico preservado), mas deixa de
 * aparecer nas listas por defeito. A atualização é otimista, com reversão em
 * caso de falha no servidor.
 */
export function ToggleAtivoAtleta({
  atletaId,
  ativoInicial,
}: {
  atletaId: string;
  ativoInicial: boolean;
}) {
  const router = useRouter();
  const id = useId();
  const [pending, startTransition] = useTransition();
  const [ativo, setAtivo] = useState(ativoInicial);

  function alternar() {
    const anterior = ativo;
    const proximo = !anterior;
    setAtivo(proximo); // otimista
    startTransition(async () => {
      const res = await toggleAtivoAtleta(atletaId);
      if (res.sucesso) {
        toast.success(proximo ? "Atleta reativado" : "Atleta marcado como inativo");
        router.refresh();
      } else {
        setAtivo(anterior); // reverter
        toast.error(res.erro);
      }
    });
  }

  return (
    <div className="flex min-h-[44px] items-center justify-between gap-4">
      <div>
        <Label htmlFor={id} className="cursor-pointer select-none">
          {ativo ? "Atleta ativo" : "Atleta inativo"}
        </Label>
        <p className="text-legenda text-cinza-500">
          {ativo
            ? "Consta no plantel e aparece nas listas."
            : "Não aparece nas listas por defeito. O histórico é preservado."}
        </p>
      </div>
      <Switch
        id={id}
        checked={ativo}
        onCheckedChange={alternar}
        disabled={pending}
        aria-label={ativo ? "Marcar atleta como inativo" : "Reativar atleta"}
      />
    </div>
  );
}
