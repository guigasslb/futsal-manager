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
import { LABEL_CASA_FORA } from "@/lib/schemas/jogo";
import type { CasaFora, Escalao, Jogo } from "@prisma/client";

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
  | "escalaoId"
  | "competicao"
  | "local"
  | "golosMarcados"
  | "golosSofridos"
>;

export function JogoForm({
  escaloes,
  jogo,
}: {
  escaloes: EscalaoBasico[];
  jogo?: JogoParaEdicao;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [escalaoId, setEscalaoId] = useState<string>(jogo?.escalaoId ?? "");
  const [casaFora, setCasaFora] = useState<CasaFora>(jogo?.casaFora ?? "CASA");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setErros({});
    setErroGeral(null);

    const gm = String(fd.get("golosMarcados") ?? "").trim();
    const gs = String(fd.get("golosSofridos") ?? "").trim();

    const dados = {
      data: String(fd.get("data")),
      adversario: String(fd.get("adversario")),
      casaFora,
      escalaoId: escalaoId || undefined,
      competicao: String(fd.get("competicao") ?? "").trim() || undefined,
      local: String(fd.get("local") ?? "").trim() || undefined,
      golosMarcados: gm !== "" ? Number(gm) : null,
      golosSofridos: gs !== "" ? Number(gs) : null,
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
          <Select value={escalaoId} onValueChange={setEscalaoId}>
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
          <Label htmlFor="competicao">Competição</Label>
          <Input
            id="competicao"
            name="competicao"
            maxLength={100}
            defaultValue={jogo?.competicao ?? ""}
            placeholder="ex: Liga distrital"
          />
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
