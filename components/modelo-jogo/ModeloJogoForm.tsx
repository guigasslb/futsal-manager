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
import { EditorCampo } from "@/components/campo/EditorCampo";
import { criarModeloJogo, atualizarModeloJogo } from "@/lib/actions/modeloJogo";
import { LABEL_MOMENTO, MOMENTOS } from "@/lib/schemas/modeloJogo";
import {
  diagramaSchema,
  DIAGRAMA_VAZIO,
  type DiagramaCampo,
} from "@/lib/schemas/exercicio";
import type { ModeloJogo, MomentoJogo } from "@prisma/client";

function lerDiagrama(raw: unknown): DiagramaCampo {
  const parsed = diagramaSchema.safeParse(raw);
  return parsed.success ? parsed.data : DIAGRAMA_VAZIO;
}

type ModeloParaEdicao = Pick<
  ModeloJogo,
  "id" | "nome" | "momento" | "principios"
> & { diagrama?: unknown };

export function ModeloJogoForm({ modelo }: { modelo?: ModeloParaEdicao }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [momento, setMomento] = useState<string>(modelo?.momento ?? "ORG_OFENSIVA");
  const [diagrama, setDiagrama] = useState<DiagramaCampo>(() => lerDiagrama(modelo?.diagrama));

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setErros({});
    setErroGeral(null);
    const dados = {
      nome: String(fd.get("nome")),
      momento: momento as MomentoJogo,
      principios: String(fd.get("principios") ?? "").trim() || undefined,
      diagrama,
    };
    startTransition(async () => {
      const res = modelo
        ? await atualizarModeloJogo(modelo.id, dados)
        : await criarModeloJogo(dados);
      if (res.sucesso) {
        toast.success(modelo ? "Modelo atualizado" : "Modelo criado");
        router.push(`/modelo-jogo/${res.dados.id}`);
        router.refresh();
      } else {
        setErroGeral(res.erro);
        if (res.camposInvalidos) setErros(res.camposInvalidos);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {erroGeral && !Object.keys(erros).length && (
        <p className="text-corpo-sec text-vermelho-600">{erroGeral}</p>
      )}
      <div className="grid max-w-lg grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="nome">Nome *</Label>
          <Input id="nome" name="nome" defaultValue={modelo?.nome ?? ""} required maxLength={100} />
          {erros.nome && <p className="text-legenda text-vermelho-600">{erros.nome}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Momento</Label>
          <Select value={momento} onValueChange={setMomento}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {MOMENTOS.map((m) => (
                <SelectItem key={m} value={m}>{LABEL_MOMENTO[m]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="max-w-lg space-y-1.5">
        <Label htmlFor="principios">Princípios / subprincípios</Label>
        <Textarea id="principios" name="principios" rows={4} maxLength={3000} defaultValue={modelo?.principios ?? ""} />
      </div>

      <div className="space-y-2">
        <Label>Representação gráfica</Label>
        <EditorCampo valor={diagrama} onChange={setDiagrama} />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? "A guardar…" : modelo ? "Guardar alterações" : "Criar modelo"}
        </Button>
        <Button type="button" variant="outline" disabled={pending} onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
