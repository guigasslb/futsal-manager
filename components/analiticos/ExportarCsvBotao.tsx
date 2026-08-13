"use client";

// Botão de download CSV dos analíticos (F1.3 — bíblia §8.15).
//
// Recebe uma Server Action já parametrizada (`acao`) que devolve o CSV serializado
// (string + nome de ficheiro) dentro de `Resultado<T>`. O BOM UTF-8 já vem no
// próprio CSV (ver `lib/utils/csv.ts`), por isso o Blob é criado tal-e-qual.
// Ação secundária, discreta (variant outline). `print:hidden` para não sair no PDF.

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { Resultado } from "@/lib/utils";

interface Props {
  /** Server Action já ligada aos parâmetros (ex.: `acao.bind(null, { escalaoId })`). */
  acao: () => Promise<Resultado<{ csv: string; nomeFicheiro: string }>>;
  rotulo?: string;
}

export function ExportarCsvBotao({ acao, rotulo = "Exportar CSV" }: Props) {
  const [aExportar, setAExportar] = useState(false);

  async function exportar() {
    setAExportar(true);
    try {
      const resultado = await acao();
      if (!resultado.sucesso) {
        toast.error(resultado.erro ?? "Erro ao exportar");
        return;
      }

      const { csv, nomeFicheiro } = resultado.dados;
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const ancora = document.createElement("a");
      ancora.href = url;
      ancora.download = nomeFicheiro;
      document.body.appendChild(ancora);
      ancora.click();
      ancora.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Erro ao exportar");
    } finally {
      setAExportar(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={exportar}
      disabled={aExportar}
      className="print:hidden"
    >
      {aExportar ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <Download className="h-4 w-4" aria-hidden />
      )}
      {aExportar ? "A exportar…" : rotulo}
    </Button>
  );
}
