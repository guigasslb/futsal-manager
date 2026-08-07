"use client";

// Gestão dos relatórios partilhados do clube (bíblia §10.6): lista com tipo,
// datas, link copiável e revogação (capacidade RELATORIOS_VER — já validada no
// servidor). Remove a linha localmente após revogar, com refresh do servidor.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RelatorioResumo } from "@/lib/actions/analise";
import { revogarRelatorioPartilhado } from "@/lib/actions/analise";
import { LABEL_TIPO_RELATORIO } from "@/lib/schemas/analise";
import { copiarTexto } from "@/lib/clipboard";

function formatarData(d: Date): string {
  return new Date(d).toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function GerirRelatorios({
  relatorios: inicial,
}: {
  relatorios: RelatorioResumo[];
}) {
  const router = useRouter();
  const [relatorios, setRelatorios] = useState(inicial);
  const [pending, startTransition] = useTransition();
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  function copiar(token: string, id: string) {
    startTransition(async () => {
      const url = `${window.location.origin}/r/${token}`;
      const feito = await copiarTexto(url);
      if (feito) {
        setCopiadoId(id);
        toast.success("Link copiado");
        window.setTimeout(() => setCopiadoId(null), 2000);
      } else {
        toast.error("Não foi possível copiar. Copia o link manualmente.");
      }
    });
  }

  function revogar(id: string) {
    startTransition(async () => {
      const res = await revogarRelatorioPartilhado(id);
      if (!res.sucesso) {
        toast.error(res.erro);
        return;
      }
      setRelatorios((rs) => rs.filter((r) => r.id !== id));
      toast.success("Link revogado");
      router.refresh();
    });
  }

  if (relatorios.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-cinza-300 p-6 text-center text-corpo-sec text-cinza-500">
        Ainda não há relatórios partilhados. Gera um a partir de um atleta,
        escalão ou do clube.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-cinza-100 rounded-lg border border-cinza-200 bg-white shadow-card">
      {relatorios.map((r) => {
        const expirado = r.expiraEm != null && new Date(r.expiraEm).getTime() < Date.now();
        return (
          <li
            key={r.id}
            className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="text-corpo font-medium text-cinza-900">
                {LABEL_TIPO_RELATORIO[r.tipo]}
              </p>
              <p className="text-legenda text-cinza-500">
                Criado {formatarData(r.criadoEm)}
                {r.expiraEm ? (
                  <span className={expirado ? "text-vermelho-600" : ""}>
                    {" · "}
                    {expirado ? "expirou" : "expira"} {formatarData(r.expiraEm)}
                  </span>
                ) : (
                  " · sem expiração"
                )}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copiar(r.token, r.id)}
                disabled={pending}
              >
                {copiadoId === r.id ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copiadoId === r.id ? "Copiado" : "Copiar link"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => revogar(r.id)}
                disabled={pending}
                className="text-vermelho-600 hover:bg-vermelho-600/5"
                aria-label="Revogar relatório"
              >
                <Trash2 className="h-4 w-4" />
                Revogar
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
