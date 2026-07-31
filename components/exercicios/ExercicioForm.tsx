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
import { criarExercicio, atualizarExercicio } from "@/lib/actions/exercicios";
import {
  LABEL_CATEGORIA,
  CATEGORIAS,
  diagramaSchema,
  DIAGRAMA_VAZIO,
  type DiagramaCampo,
} from "@/lib/schemas/exercicio";
import { EditorCampo } from "@/components/campo/EditorCampo";
import type { CategoriaExercicio, Exercicio } from "@prisma/client";

type ExercicioParaEdicao = Pick<
  Exercicio,
  "id" | "nome" | "descricao" | "objetivo" | "duracaoMin" | "categoria"
> & { diagrama?: unknown };

function lerDiagrama(raw: unknown): DiagramaCampo {
  const parsed = diagramaSchema.safeParse(raw);
  return parsed.success ? parsed.data : DIAGRAMA_VAZIO;
}

export function ExercicioForm({ exercicio }: { exercicio?: ExercicioParaEdicao }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [categoria, setCategoria] = useState<string>(exercicio?.categoria ?? "");
  const [diagrama, setDiagrama] = useState<DiagramaCampo>(() =>
    lerDiagrama(exercicio?.diagrama),
  );

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setErros({});
    setErroGeral(null);

    const duracaoRaw = String(fd.get("duracaoMin") ?? "").trim();

    const dados = {
      nome: String(fd.get("nome")),
      descricao: String(fd.get("descricao") ?? "").trim() || undefined,
      objetivo: String(fd.get("objetivo") ?? "").trim() || undefined,
      duracaoMin: duracaoRaw !== "" ? Number(duracaoRaw) : undefined,
      categoria: (categoria as CategoriaExercicio) || undefined,
      diagrama,
    };

    startTransition(async () => {
      const res = exercicio
        ? await atualizarExercicio(exercicio.id, dados)
        : await criarExercicio(dados);

      if (res.sucesso) {
        toast.success(exercicio ? "Exercício atualizado" : "Exercício criado");
        router.push(`/exercicios/${res.dados.id}`);
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

      <div className="max-w-lg space-y-1.5">
        <Label htmlFor="nome">Nome *</Label>
        <Input
          id="nome"
          name="nome"
          defaultValue={exercicio?.nome ?? ""}
          required
          maxLength={100}
          placeholder="ex: 1x1 com apoio"
        />
        {erros.nome && <p className="text-legenda text-vermelho-600">{erros.nome}</p>}
      </div>

      <div className="grid max-w-lg grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Categoria</Label>
          <Select value={categoria} onValueChange={setCategoria}>
            <SelectTrigger>
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIAS.map((c) => (
                <SelectItem key={c} value={c}>
                  {LABEL_CATEGORIA[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="duracaoMin">Duração (min)</Label>
          <Input
            id="duracaoMin"
            name="duracaoMin"
            type="number"
            min={1}
            max={180}
            defaultValue={exercicio?.duracaoMin ?? ""}
            placeholder="ex: 15"
          />
          {erros.duracaoMin && (
            <p className="text-legenda text-vermelho-600">{erros.duracaoMin}</p>
          )}
        </div>
      </div>

      <div className="max-w-lg space-y-1.5">
        <Label htmlFor="objetivo">Objetivo</Label>
        <Input
          id="objetivo"
          name="objetivo"
          defaultValue={exercicio?.objetivo ?? ""}
          maxLength={500}
          placeholder="ex: Melhorar a saída a pressão"
        />
      </div>

      <div className="max-w-lg space-y-1.5">
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea
          id="descricao"
          name="descricao"
          defaultValue={exercicio?.descricao ?? ""}
          maxLength={2000}
          rows={4}
          placeholder="Descreve a organização e dinâmica do exercício…"
        />
      </div>

      <div className="space-y-2">
        <Label>Diagrama de campo</Label>
        <EditorCampo valor={diagrama} onChange={setDiagrama} />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? "A guardar…" : exercicio ? "Guardar alterações" : "Criar exercício"}
        </Button>
        <Button type="button" variant="outline" disabled={pending} onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
