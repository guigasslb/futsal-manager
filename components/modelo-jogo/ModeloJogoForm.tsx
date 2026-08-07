"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Building2, User } from "lucide-react";
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
import { EditorSubprincipios } from "@/components/modelo-jogo/EditorSubprincipios";
import { criarModeloJogo, atualizarModeloJogo } from "@/lib/actions/modeloJogo";
import { LABEL_MOMENTO, MOMENTOS, modeloJogoSchema } from "@/lib/schemas/modeloJogo";
import {
  diagramaSchema,
  DIAGRAMA_VAZIO_V2,
  type DiagramaCampo,
} from "@/lib/schemas/exercicio";
import { erroDeValidacao } from "@/lib/utils";
import type { MomentoJogo, PropriedadeConteudo } from "@prisma/client";

const SENTINEL_NONE = "__none__";

export type OpcaoSimples = { id: string; nome: string };

/** Campos do modelo necessários para pré-preencher o formulário de edição. */
export type ModeloParaEdicao = {
  id: string;
  nome: string;
  momento: MomentoJogo;
  principios: string | null;
  proprietario: PropriedadeConteudo;
  escalaoId: string | null;
  epocaId: string | null;
  subprincipiosLista: string[];
  diagrama?: unknown;
};

function lerDiagrama(raw: unknown): DiagramaCampo {
  const parsed = diagramaSchema.safeParse(raw);
  return parsed.success ? parsed.data : DIAGRAMA_VAZIO_V2;
}

export function ModeloJogoForm({
  modelo,
  escaloes,
  epocas,
  epocaAtivaId,
}: {
  modelo?: ModeloParaEdicao;
  escaloes: OpcaoSimples[];
  epocas: OpcaoSimples[];
  epocaAtivaId?: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  const [momento, setMomento] = useState<MomentoJogo>(modelo?.momento ?? "ORG_OFENSIVA");
  const [proprietario, setProprietario] = useState<PropriedadeConteudo>(
    modelo?.proprietario ?? "CLUBE",
  );
  const [escalaoId, setEscalaoId] = useState<string>(modelo?.escalaoId ?? SENTINEL_NONE);
  const [epocaId, setEpocaId] = useState<string>(
    modelo?.epocaId ?? epocaAtivaId ?? SENTINEL_NONE,
  );
  const [subprincipios, setSubprincipios] = useState<string[]>(
    modelo?.subprincipiosLista ?? [],
  );
  const [diagrama, setDiagrama] = useState<DiagramaCampo>(() =>
    lerDiagrama(modelo?.diagrama),
  );

  // Metodologia genérica portátil: sem escalão nem época (bíblia §3.6).
  const portatil = proprietario === "TREINADOR";

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setErros({});
    setErroGeral(null);

    const dados = {
      nome: String(fd.get("nome") ?? "").trim(),
      momento,
      principios: String(fd.get("principios") ?? "").trim() || undefined,
      subprincipios,
      diagrama,
      proprietario,
      escalaoId: portatil || escalaoId === SENTINEL_NONE ? null : escalaoId,
      epocaId: portatil || epocaId === SENTINEL_NONE ? null : epocaId,
    };

    // Validação Zod no cliente com o mesmo schema do servidor (fonte única).
    const parsed = modeloJogoSchema.safeParse(dados);
    if (!parsed.success) {
      const resultado = erroDeValidacao(parsed.error);
      if (!resultado.sucesso) {
        setErroGeral(resultado.erro);
        setErros(resultado.camposInvalidos ?? {});
      }
      return;
    }

    startTransition(async () => {
      const res = modelo
        ? await atualizarModeloJogo(modelo.id, parsed.data)
        : await criarModeloJogo(parsed.data);
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {erroGeral && !Object.keys(erros).length && (
        <p className="text-corpo-sec text-vermelho-600">{erroGeral}</p>
      )}

      {/* ── Identificação ── */}
      <div className="grid max-w-lg grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="nome">Nome *</Label>
          <Input
            id="nome"
            name="nome"
            defaultValue={modelo?.nome ?? ""}
            required
            maxLength={100}
            placeholder="ex: Saída a jogar 1-2-1"
          />
          {erros.nome && <p className="text-legenda text-vermelho-600">{erros.nome}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="momento">Momento</Label>
          <Select
            value={momento}
            onValueChange={(v) => setMomento(v as MomentoJogo)}
          >
            <SelectTrigger id="momento" className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MOMENTOS.map((m) => (
                <SelectItem key={m} value={m}>
                  {LABEL_MOMENTO[m]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {erros.momento && (
            <p className="text-legenda text-vermelho-600">{erros.momento}</p>
          )}
        </div>
      </div>

      {/* ── Âmbito: documento da equipa vs metodologia portátil ── */}
      <fieldset className="max-w-lg space-y-4 rounded-lg border border-cinza-200 p-4">
        <legend className="px-1 text-corpo-sec text-cinza-600">Âmbito</legend>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {(
            [
              {
                v: "CLUBE" as const,
                Icon: Building2,
                titulo: "Documento da equipa",
                descricao: "Fica no clube, por escalão e época.",
              },
              {
                v: "TREINADOR" as const,
                Icon: User,
                titulo: "Metodologia portátil",
                descricao: "Biblioteca pessoal, viaja contigo.",
              },
            ]
          ).map(({ v, Icon, titulo, descricao }) => (
            <button
              key={v}
              type="button"
              aria-pressed={proprietario === v}
              onClick={() => setProprietario(v)}
              className={`flex min-h-11 flex-col items-start gap-0.5 rounded-md border p-3 text-left transition-colors ${
                proprietario === v
                  ? "border-primary bg-primary/5"
                  : "border-cinza-200 hover:bg-cinza-50"
              }`}
            >
              <span className="flex items-center gap-1.5 text-corpo-sec font-medium text-cinza-900">
                <Icon className="h-4 w-4" />
                {titulo}
              </span>
              <span className="text-legenda text-cinza-600">{descricao}</span>
            </button>
          ))}
        </div>

        {portatil ? (
          <p className="text-legenda text-cinza-500">
            A metodologia portátil não fica associada a escalão nem a época.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="escalao">Escalão</Label>
              {escaloes.length === 0 ? (
                <p className="pt-2 text-legenda text-cinza-400">Sem escalões definidos.</p>
              ) : (
                <Select value={escalaoId} onValueChange={setEscalaoId}>
                  <SelectTrigger id="escalao" className="h-11">
                    <SelectValue placeholder="— Todos —" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SENTINEL_NONE}>— Todos os escalões —</SelectItem>
                    {escaloes.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {erros.escalaoId && (
                <p className="text-legenda text-vermelho-600">{erros.escalaoId}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="epoca">Época</Label>
              {epocas.length === 0 ? (
                <p className="pt-2 text-legenda text-cinza-400">Sem épocas definidas.</p>
              ) : (
                <Select value={epocaId} onValueChange={setEpocaId}>
                  <SelectTrigger id="epoca" className="h-11">
                    <SelectValue placeholder="— Todas —" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SENTINEL_NONE}>— Todas as épocas —</SelectItem>
                    {epocas.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {erros.epocaId && (
                <p className="text-legenda text-vermelho-600">{erros.epocaId}</p>
              )}
            </div>
          </div>
        )}
      </fieldset>

      {/* ── Princípios e subprincípios ── */}
      <div className="max-w-lg space-y-1.5">
        <Label htmlFor="principios">Princípios</Label>
        <Textarea
          id="principios"
          name="principios"
          rows={4}
          maxLength={3000}
          defaultValue={modelo?.principios ?? ""}
          placeholder="Ideias-chave deste momento de jogo."
        />
        {erros.principios && (
          <p className="text-legenda text-vermelho-600">{erros.principios}</p>
        )}
      </div>

      <div className="max-w-lg space-y-1.5">
        <Label>Subprincípios</Label>
        <EditorSubprincipios
          valor={subprincipios}
          onChange={setSubprincipios}
          erro={erros.subprincipios}
        />
      </div>

      {/* ── Diagrama ── */}
      <div className="space-y-2">
        <Label>Representação gráfica</Label>
        <EditorCampo valor={diagrama} onChange={setDiagrama} />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? "A guardar…" : modelo ? "Guardar alterações" : "Criar modelo"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => router.back()}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
