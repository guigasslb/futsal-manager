"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { criarSessao, atualizarSessao } from "@/lib/actions/treinos";
import type { Escalao, Sessao } from "@prisma/client";

function paraInputDateTime(date: Date | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60000);
  return local.toISOString().slice(0, 16);
}

type EscalaoBasico = Pick<Escalao, "id" | "nome">;
type SessaoParaEdicao = Pick<
  Sessao,
  "id" | "data" | "escalaoId" | "duracaoMin" | "objetivo" | "local" | "notas"
>;

export function SessaoForm({
  escaloes,
  sessao,
  escalaoIdInicial,
}: {
  escaloes: EscalaoBasico[];
  sessao?: SessaoParaEdicao;
  escalaoIdInicial?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [escalaoId, setEscalaoId] = useState<string>(
    sessao?.escalaoId ?? escalaoIdInicial ?? "",
  );

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setErros({});
    setErroGeral(null);

    const duracaoRaw = String(fd.get("duracaoMin") ?? "").trim();

    const dados = {
      data: String(fd.get("data")),
      escalaoId: escalaoId || undefined,
      duracaoMin: duracaoRaw !== "" ? Number(duracaoRaw) : undefined,
      objetivo: String(fd.get("objetivo") ?? "").trim() || undefined,
      local: String(fd.get("local") ?? "").trim() || undefined,
      notas: String(fd.get("notas") ?? "").trim() || undefined,
    };

    startTransition(async () => {
      const res = sessao
        ? await atualizarSessao(sessao.id, dados)
        : await criarSessao(dados);
      if (res.sucesso) {
        toast.success(sessao ? "Sessão atualizada" : "Sessão criada");
        router.push(`/treinos/${res.dados.id}`);
        router.refresh();
      } else {
        setErroGeral(res.erro);
        if (res.camposInvalidos) setErros(res.camposInvalidos);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-5">
      {erroGeral && !Object.keys(erros).length && (
        <p className="text-corpo-sec text-vermelho-600">{erroGeral}</p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="data">Data e hora *</Label>
          <Input
            id="data"
            name="data"
            type="datetime-local"
            required
            defaultValue={paraInputDateTime(sessao?.data)}
          />
          {erros.data && <p className="text-legenda text-vermelho-600">{erros.data}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="duracaoMin">Duração (min)</Label>
          <Input
            id="duracaoMin"
            name="duracaoMin"
            type="number"
            min={1}
            max={300}
            defaultValue={sessao?.duracaoMin ?? ""}
            placeholder="ex: 80"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Escalão *</Label>
        <Select value={escalaoId} onValueChange={setEscalaoId}>
          <SelectTrigger>
            <SelectValue placeholder="Seleciona um escalão" />
          </SelectTrigger>
          <SelectContent>
            {escaloes.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {erros.escalaoId && <p className="text-legenda text-vermelho-600">{erros.escalaoId}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="objetivo">Objetivo</Label>
        <Input
          id="objetivo"
          name="objetivo"
          defaultValue={sessao?.objetivo ?? ""}
          maxLength={500}
          placeholder="ex: 1x1 ofensivo e finalização"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="local">Local</Label>
        <Input
          id="local"
          name="local"
          defaultValue={sessao?.local ?? ""}
          maxLength={100}
          placeholder="ex: Pavilhão Municipal"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notas">Notas</Label>
        <Textarea
          id="notas"
          name="notas"
          defaultValue={sessao?.notas ?? ""}
          maxLength={2000}
          rows={3}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={pending || !escalaoId}>
          {pending ? "A guardar…" : sessao ? "Guardar alterações" : "Criar sessão"}
        </Button>
        <Button type="button" variant="outline" disabled={pending} onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
