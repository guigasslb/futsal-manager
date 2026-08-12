"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  criarRegistoCarreira,
  atualizarRegistoCarreira,
} from "@/lib/actions/perfis";
import type { RegistoCarreira } from "@prisma/client";

/**
 * Formulário de criação/edição de um registo de carreira (P2.4 — §8.17).
 * Sem `registo` cria um novo; com `registo` edita o existente.
 */
export function RegistoCarreiraForm({
  registo,
  onDone,
}: {
  registo?: RegistoCarreira;
  onDone?: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const editar = !!registo;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setErro(null);
    const dados = {
      clube: String(fd.get("clube") ?? "").trim(),
      escalao: String(fd.get("escalao") ?? "").trim(),
      epocaInicio: String(fd.get("epocaInicio") ?? "").trim(),
      epocaFim: String(fd.get("epocaFim") ?? "").trim() || undefined,
      conquistas: String(fd.get("conquistas") ?? "").trim() || undefined,
      notas: String(fd.get("notas") ?? "").trim() || undefined,
    };
    startTransition(async () => {
      const res = editar
        ? await atualizarRegistoCarreira(registo!.id, dados)
        : await criarRegistoCarreira(dados);
      if (res.sucesso) {
        toast.success(editar ? "Registo atualizado" : "Registo adicionado");
        onDone?.();
      } else {
        setErro(res.erro);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {erro && <p className="text-corpo-sec text-vermelho-600">{erro}</p>}

      <div className="space-y-1.5">
        <Label htmlFor="clube">Clube *</Label>
        <Input
          id="clube"
          name="clube"
          required
          minLength={2}
          maxLength={120}
          defaultValue={registo?.clube ?? ""}
          placeholder="ex. Sporting CP"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="escalao">Escalão *</Label>
          <Input
            id="escalao"
            name="escalao"
            required
            maxLength={80}
            defaultValue={registo?.escalao ?? ""}
            placeholder="ex. Seniores"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="epocaInicio">Época de início *</Label>
          <Input
            id="epocaInicio"
            name="epocaInicio"
            required
            maxLength={20}
            defaultValue={registo?.epocaInicio ?? ""}
            placeholder="ex. 2022/2023"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="epocaFim">Época de fim</Label>
        <Input
          id="epocaFim"
          name="epocaFim"
          maxLength={20}
          defaultValue={registo?.epocaFim ?? ""}
          placeholder="Deixa em branco se ainda em curso"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="conquistas">Conquistas</Label>
        <Textarea
          id="conquistas"
          name="conquistas"
          rows={2}
          maxLength={500}
          defaultValue={registo?.conquistas ?? ""}
          placeholder="ex. Campeão Distrital"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notas">Notas</Label>
        <Textarea
          id="notas"
          name="notas"
          rows={3}
          maxLength={1000}
          defaultValue={registo?.notas ?? ""}
        />
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={pending}>
          {pending
            ? "A guardar…"
            : editar
              ? "Guardar alterações"
              : "Adicionar registo"}
        </Button>
      </div>
    </form>
  );
}
