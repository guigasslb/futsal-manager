"use client";

// Gera um relatório partilhável (bíblia §3.10 / §10.6) e mostra o link público
// resultante, com cópia para a área de transferência e revogação imediata.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Copy, Link2, Share2, Trash2 } from "lucide-react";
import type { TipoRelatorio } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  gerarRelatorioPartilhado,
  revogarRelatorioPartilhado,
} from "@/lib/actions/analise";
import { copiarTexto } from "@/lib/clipboard";

interface Props {
  tipo: TipoRelatorio;
  atletaId?: string;
  escalaoId?: string;
}

export function GerarRelatorioBotao({ tipo, atletaId, escalaoId }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [gerado, setGerado] = useState<{ id: string; url: string } | null>(null);
  const [copiado, setCopiado] = useState(false);

  function gerar() {
    startTransition(async () => {
      const res = await gerarRelatorioPartilhado({ tipo, atletaId, escalaoId });
      if (!res.sucesso) {
        toast.error(res.erro);
        return;
      }
      const url = `${window.location.origin}/r/${res.dados.token}`;
      setGerado({ id: res.dados.id, url });
      toast.success("Relatório partilhável gerado");
    });
  }

  function copiar() {
    if (!gerado) return;
    startTransition(async () => {
      const feito = await copiarTexto(gerado.url);
      if (feito) {
        setCopiado(true);
        toast.success("Link copiado");
        window.setTimeout(() => setCopiado(false), 2000);
      } else {
        toast.error("Não foi possível copiar. Copia o link manualmente.");
      }
    });
  }

  function revogar() {
    if (!gerado) return;
    startTransition(async () => {
      const res = await revogarRelatorioPartilhado(gerado.id);
      if (!res.sucesso) {
        toast.error(res.erro);
        return;
      }
      setGerado(null);
      toast.success("Link revogado");
      router.refresh();
    });
  }

  if (!gerado) {
    return (
      <Button variant="outline" onClick={gerar} disabled={pending}>
        <Share2 className="h-4 w-4" />
        Gerar relatório partilhável
      </Button>
    );
  }

  return (
    <div className="rounded-lg border border-cinza-200 bg-white p-4 shadow-card">
      <p className="mb-2 flex items-center gap-1.5 text-legenda font-medium uppercase tracking-wide text-cinza-400">
        <Link2 className="h-3.5 w-3.5" />
        Link público
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          readOnly
          value={gerado.url}
          onFocus={(e) => e.currentTarget.select()}
          className="w-full flex-1 rounded-md border border-cinza-200 bg-cinza-50 px-3 py-2 text-corpo-sec text-cinza-700"
          aria-label="Link público do relatório"
        />
        <div className="flex gap-2">
          <Button variant="outline" onClick={copiar} disabled={pending}>
            {copiado ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copiado ? "Copiado" : "Copiar"}
          </Button>
          <Button variant="destructive" onClick={revogar} disabled={pending}>
            <Trash2 className="h-4 w-4" />
            Revogar
          </Button>
        </div>
      </div>
      <p className="mt-2 text-legenda text-cinza-500">
        Qualquer pessoa com este link vê o relatório. Revoga-o para o desativar.
      </p>
    </div>
  );
}
