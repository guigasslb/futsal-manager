"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { NotebookPen, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { atualizarNotasSessao } from "@/lib/actions/treinos";

/**
 * Notas da sessão editáveis inline (Melhoria 4.6) — sempre visíveis, sem passar
 * pelo formulário de edição. Guarda via Server Action `atualizarNotasSessao`.
 */
export function NotasSessao({
  sessaoId,
  notasIniciais,
}: {
  sessaoId: string;
  notasIniciais: string | null;
}) {
  const inicial = notasIniciais ?? "";
  const [valor, setValor] = useState(inicial);
  const [guardado, setGuardado] = useState(inicial);
  const [pending, startTransition] = useTransition();

  const alterado = valor !== guardado;

  function guardar() {
    startTransition(async () => {
      const res = await atualizarNotasSessao(sessaoId, valor);
      if (res.sucesso) {
        setGuardado(valor);
        toast.success("Notas guardadas");
      } else {
        toast.error(res.erro);
      }
    });
  }

  return (
    <section className="rounded-lg border border-cinza-200 bg-white p-5 shadow-card">
      <div className="flex items-center gap-2">
        <NotebookPen className="h-4 w-4 text-primary" />
        <h2 className="text-corpo font-semibold text-cinza-900">Notas</h2>
      </div>
      <Textarea
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        onBlur={() => {
          if (alterado) guardar();
        }}
        maxLength={2000}
        rows={4}
        placeholder="Notas da sessão (observações, ajustes, lembretes)…"
        className="mt-3"
      />
      <div className="mt-2 flex items-center justify-end">
        <Button
          type="button"
          onClick={guardar}
          disabled={pending || !alterado}
          size="sm"
        >
          <Check className="h-4 w-4" />
          {pending ? "A guardar…" : alterado ? "Guardar notas" : "Guardado"}
        </Button>
      </div>
    </section>
  );
}
