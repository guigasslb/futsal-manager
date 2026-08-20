"use client";

import { useId, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

/**
 * Alterna a visibilidade dos atletas inativos na lista do plantel (secção 8 —
 * plantel). O estado vive na URL (`?incluirInativos=1`) para ser lido pelo
 * server component que chama `listarAtletas`, preservando os restantes filtros
 * (escalão, secção, pesquisa).
 */
export function FiltroInativos() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const id = useId();

  const ativo = searchParams.get("incluirInativos") === "1";

  function alternar(mostrar: boolean) {
    const params = new URLSearchParams(searchParams.toString());
    if (mostrar) params.set("incluirInativos", "1");
    else params.delete("incluirInativos");
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div className="flex min-h-[44px] items-center gap-2.5">
      <Switch
        id={id}
        checked={ativo}
        onCheckedChange={alternar}
        disabled={pending}
        aria-label="Mostrar atletas inativos"
      />
      <Label htmlFor={id} className="cursor-pointer select-none">
        Mostrar atletas inativos
      </Label>
    </div>
  );
}
