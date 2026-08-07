"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { criarJogo, atualizarJogo } from "@/lib/actions/jogos";
import { LABEL_CASA_FORA, LABEL_TIPO_JOGO } from "@/lib/schemas/jogo";
import type { CasaFora, Escalao, Jogo, TipoJogo } from "@prisma/client";

/** Valor sentinela do Select para «sem competição associada». */
const SEM_COMPETICAO = "__nenhuma__";

type CompeticaoBasica = { id: string; nome: string; escalaoId: string };

function paraInputDateTime(date: Date | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

type EscalaoBasico = Pick<Escalao, "id" | "nome">;
type JogoParaEdicao = Pick<
  Jogo,
  | "id"
  | "data"
  | "adversario"
  | "casaFora"
  | "tipo"
  | "escalaoId"
  | "competicao"
  | "competicaoId"
  | "local"
  | "golosMarcados"
  | "golosSofridos"
  | "faltas1aParte"
  | "faltas2aParte"
  | "videoUrl"
>;

export function JogoForm({
  escaloes,
  competicoes = [],
  jogo,
}: {
  escaloes: EscalaoBasico[];
  competicoes?: CompeticaoBasica[];
  jogo?: JogoParaEdicao;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [escalaoId, setEscalaoId] = useState<string>(jogo?.escalaoId ?? "");
  const [casaFora, setCasaFora] = useState<CasaFora>(jogo?.casaFora ?? "CASA");
  const [tipo, setTipo] = useState<TipoJogo>(jogo?.tipo ?? "OFICIAL");
  const [competicaoId, setCompeticaoId] = useState<string>(
    jogo?.competicaoId ?? SEM_COMPETICAO,
  );

  // Só as competições do escalão selecionado podem ser associadas ao jogo.
  const competicoesDoEscalao = competicoes.filter((c) => c.escalaoId === escalaoId);

  function mudarEscalao(novo: string) {
    setEscalaoId(novo);
    // Se a competição atual não pertence ao novo escalão, limpa a seleção.
    if (
      competicaoId !== SEM_COMPETICAO &&
      !competicoes.some((c) => c.id === competicaoId && c.escalaoId === novo)
    ) {
      setCompeticaoId(SEM_COMPETICAO);
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setErros({});
    setErroGeral(null);

    const gm = String(fd.get("golosMarcados") ?? "").trim();
    const gs = String(fd.get("golosSofridos") ?? "").trim();
    const f1 = String(fd.get("faltas1aParte") ?? "").trim();
    const f2 = String(fd.get("faltas2aParte") ?? "").trim();

    const dados = {
      data: String(fd.get("data")),
      adversario: String(fd.get("adversario")),
      casaFora,
      tipo,
      escalaoId: escalaoId || undefined,
      competicao: String(fd.get("competicao") ?? "").trim() || undefined,
      competicaoId: competicaoId === SEM_COMPETICAO ? null : competicaoId,
      local: String(fd.get("local") ?? "").trim() || undefined,
      golosMarcados: gm !== "" ? Number(gm) : null,
      golosSofridos: gs !== "" ? Number(gs) : null,
      faltas1aParte: f1 !== "" ? Number(f1) : null,
      faltas2aParte: f2 !== "" ? Number(f2) : null,
      videoUrl: String(fd.get("videoUrl") ?? "").trim(),
    };

    startTransition(async () => {
      const res = jogo ? await atualizarJogo(jogo.id, dados) : await criarJogo(dados);
      if (res.sucesso) {
        toast.success(jogo ? "Jogo atualizado" : "Jogo criado");
        router.push(`/jogos/${res.dados.id}`);
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

      <div className="space-y-1.5">
        <Label htmlFor="data">Data e hora *</Label>
        <Input
          id="data"
          name="data"
          type="datetime-local"
          required
          defaultValue={paraInputDateTime(jogo?.data)}
        />
        {erros.data && <p className="text-legenda text-vermelho-600">{erros.data}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="adversario">Adversário *</Label>
        <Input
          id="adversario"
          name="adversario"
          required
          maxLength={100}
          defaultValue={jogo?.adversario ?? ""}
          placeholder="ex: CD Aves"
        />
        {erros.adversario && (
          <p className="text-legenda text-vermelho-600">{erros.adversario}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Local do jogo *</Label>
          <Select value={casaFora} onValueChange={(v) => setCasaFora(v as CasaFora)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CASA">{LABEL_CASA_FORA.CASA}</SelectItem>
              <SelectItem value="FORA">{LABEL_CASA_FORA.FORA}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Escalão *</Label>
          <Select value={escalaoId} onValueChange={mudarEscalao}>
            <SelectTrigger>
              <SelectValue placeholder="Seleciona" />
            </SelectTrigger>
            <SelectContent>
              {escaloes.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {erros.escalaoId && (
            <p className="text-legenda text-vermelho-600">{erros.escalaoId}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Competição</Label>
          <Select
            value={competicaoId}
            onValueChange={setCompeticaoId}
            disabled={!escalaoId}
          >
            <SelectTrigger>
              <SelectValue placeholder={escalaoId ? "Sem competição" : "Escolhe o escalão"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SEM_COMPETICAO}>Sem competição</SelectItem>
              {competicoesDoEscalao.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {escalaoId && competicoesDoEscalao.length === 0 && (
            <p className="text-legenda text-cinza-500">Sem competições neste escalão.</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="local">Recinto</Label>
          <Input
            id="local"
            name="local"
            maxLength={100}
            defaultValue={jogo?.local ?? ""}
            placeholder="ex: Pavilhão"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="competicao">Competição (texto livre)</Label>
        <Input
          id="competicao"
          name="competicao"
          maxLength={100}
          defaultValue={jogo?.competicao ?? ""}
          placeholder="ex: Liga distrital"
        />
        <p className="text-legenda text-cinza-500">
          Nota opcional. Para classificação, associa uma competição acima.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="golosMarcados">Golos marcados</Label>
          <Input
            id="golosMarcados"
            name="golosMarcados"
            type="number"
            min={0}
            max={99}
            defaultValue={jogo?.golosMarcados ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="golosSofridos">Golos sofridos</Label>
          <Input
            id="golosSofridos"
            name="golosSofridos"
            type="number"
            min={0}
            max={99}
            defaultValue={jogo?.golosSofridos ?? ""}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label>Tipo</Label>
          <Select value={tipo} onValueChange={(v) => setTipo(v as TipoJogo)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="OFICIAL">{LABEL_TIPO_JOGO.OFICIAL}</SelectItem>
              <SelectItem value="AMIGAVEL">{LABEL_TIPO_JOGO.AMIGAVEL}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="faltas1aParte">Faltas 1ª parte</Label>
          <Input id="faltas1aParte" name="faltas1aParte" type="number" min={0} max={50} defaultValue={jogo?.faltas1aParte ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="faltas2aParte">Faltas 2ª parte</Label>
          <Input id="faltas2aParte" name="faltas2aParte" type="number" min={0} max={50} defaultValue={jogo?.faltas2aParte ?? ""} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="videoUrl">Vídeo (link YouTube)</Label>
        <Input id="videoUrl" name="videoUrl" defaultValue={jogo?.videoUrl ?? ""} placeholder="https://youtube.com/…" />
        {erros.videoUrl && <p className="text-legenda text-vermelho-600">{erros.videoUrl}</p>}
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={pending || !escalaoId}>
          {pending ? "A guardar…" : jogo ? "Guardar alterações" : "Criar jogo"}
        </Button>
        <Button type="button" variant="outline" disabled={pending} onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
