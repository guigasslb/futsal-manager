"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Settings } from "lucide-react";
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
import { listarSubcategorias } from "@/lib/actions/subcategorias";
import {
  diagramaSchema,
  DIAGRAMA_VAZIO,
  type DiagramaCampo,
} from "@/lib/schemas/exercicio";
import {
  LABEL_CATEGORIA_PRINCIPAL,
  CATEGORIAS_PRINCIPAIS,
} from "@/lib/schemas/subcategoria";
import { EditorCampo } from "@/components/campo/EditorCampo";
import type { CategoriaExercicioPrincipal, Exercicio, SubcategoriaExercicio } from "@prisma/client";

const SENTINEL_NONE = "__none__";

type ExercicioParaEdicao = Pick<
  Exercicio,
  "id" | "nome" | "descricao" | "objetivo" | "duracaoMin" | "categoriaPrincipal" | "subcategoriaId"
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
  const [categoriaPrincipal, setCategoriaPrincipal] = useState<string>(
    exercicio?.categoriaPrincipal ?? SENTINEL_NONE,
  );
  const [subcategoriaId, setSubcategoriaId] = useState<string>(
    exercicio?.subcategoriaId ?? SENTINEL_NONE,
  );
  const [subcategorias, setSubcategorias] = useState<SubcategoriaExercicio[]>([]);
  const [diagrama, setDiagrama] = useState<DiagramaCampo>(() =>
    lerDiagrama(exercicio?.diagrama),
  );

  // Carregar subcategorias quando a categoria principal muda
  useEffect(() => {
    if (categoriaPrincipal === SENTINEL_NONE) {
      setSubcategorias([]);
      setSubcategoriaId(SENTINEL_NONE);
      return;
    }
    listarSubcategorias(categoriaPrincipal as CategoriaExercicioPrincipal).then((res) => {
      if (res.sucesso) {
        setSubcategorias(res.dados);
        // Manter subcategoria se pertence à mesma categoria (modo edição)
        const mantida =
          exercicio?.subcategoriaId &&
          res.dados.some((s) => s.id === exercicio.subcategoriaId) &&
          categoriaPrincipal === exercicio.categoriaPrincipal;
        if (!mantida) setSubcategoriaId(SENTINEL_NONE);
      }
    });
  }, [categoriaPrincipal, exercicio?.subcategoriaId, exercicio?.categoriaPrincipal]);

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
      categoriaPrincipal:
        categoriaPrincipal !== SENTINEL_NONE
          ? (categoriaPrincipal as CategoriaExercicioPrincipal)
          : undefined,
      subcategoriaId: subcategoriaId !== SENTINEL_NONE ? subcategoriaId : null,
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {erroGeral && !Object.keys(erros).length && (
        <p className="text-corpo-sec text-vermelho-600">{erroGeral}</p>
      )}

      {/* ── Identificação ── */}
      <div className="max-w-lg space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="nome">Nome *</Label>
          <Input
            id="nome"
            name="nome"
            defaultValue={exercicio?.nome ?? ""}
            required
            maxLength={100}
            placeholder="ex: 1x1 com apoio lateral"
          />
          {erros.nome && <p className="text-legenda text-vermelho-600">{erros.nome}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="objetivo">Objetivo</Label>
          <Input
            id="objetivo"
            name="objetivo"
            defaultValue={exercicio?.objetivo ?? ""}
            maxLength={500}
            placeholder="ex: Melhorar a saída a pressão"
          />
        </div>
      </div>

      {/* ── Classificação ── */}
      <fieldset className="max-w-lg space-y-4 rounded-lg border border-cinza-200 p-4">
        <legend className="px-1 text-corpo-sec text-cinza-600">Classificação</legend>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Categoria principal</Label>
            <Select value={categoriaPrincipal} onValueChange={setCategoriaPrincipal}>
              <SelectTrigger>
                <SelectValue placeholder="— Nenhuma —" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SENTINEL_NONE}>— Nenhuma —</SelectItem>
                {CATEGORIAS_PRINCIPAIS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {LABEL_CATEGORIA_PRINCIPAL[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Subcategoria</Label>
            {categoriaPrincipal === SENTINEL_NONE ? (
              <p className="pt-2 text-legenda text-cinza-400">Seleciona uma categoria primeiro.</p>
            ) : subcategorias.length === 0 ? (
              <p className="pt-2 text-legenda text-cinza-400">
                Sem subcategorias.{" "}
                <a href="/definicoes/subcategorias" className="underline hover:text-cinza-700">
                  Criar
                </a>
              </p>
            ) : (
              <Select value={subcategoriaId} onValueChange={setSubcategoriaId}>
                <SelectTrigger>
                  <SelectValue placeholder="— Nenhuma —" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SENTINEL_NONE}>— Nenhuma —</SelectItem>
                  {subcategorias.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => router.push("/definicoes/subcategorias")}
          >
            <Settings className="h-3.5 w-3.5" />
            Gerir subcategorias
          </Button>
        </div>
      </fieldset>

      {/* ── Detalhes ── */}
      <div className="max-w-lg space-y-4">
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
            className="max-w-32"
          />
          {erros.duracaoMin && (
            <p className="text-legenda text-vermelho-600">{erros.duracaoMin}</p>
          )}
        </div>

        <div className="space-y-1.5">
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
      </div>

      {/* ── Diagrama ── */}
      <div className="space-y-2">
        <Label>Diagrama de campo</Label>
        <p className="text-legenda text-cinza-400">
          Usa o editor para desenhar a organização espacial do exercício. Podes adicionar
          jogadores, bola, cones, setas e texto.
        </p>
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
