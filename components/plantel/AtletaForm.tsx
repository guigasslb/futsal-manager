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
import { criarAtleta, atualizarAtleta } from "@/lib/actions/atletas";
import { LABEL_POSICAO } from "@/lib/schemas/atleta";
import type { Atleta, Escalao, Posicao } from "@prisma/client";

const POSICOES: Posicao[] = ["GUARDA_REDES", "FIXO", "ALA", "PIVO", "UNIVERSAL"];

function formatDateForInput(date: Date | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

type EscalaoBasico = Pick<Escalao, "id" | "nome">;
type AtletaParaEdicao = Pick<
  Atleta,
  "id" | "nome" | "escalaoId" | "dataNascimento" | "posicao" | "numero" | "observacoes"
>;

export function AtletaForm({
  escaloes,
  atleta,
}: {
  escaloes: EscalaoBasico[];
  atleta?: AtletaParaEdicao;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [posicao, setPosicao] = useState<string>(atleta?.posicao ?? "");
  const [escalaoId, setEscalaoId] = useState<string>(atleta?.escalaoId ?? "");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setErros({});
    setErroGeral(null);

    const numeroRaw = String(fd.get("numero") ?? "").trim();
    const dataRaw = String(fd.get("dataNascimento") ?? "").trim();
    const obsRaw = String(fd.get("observacoes") ?? "").trim();

    const dados = {
      nome: String(fd.get("nome")),
      escalaoId: escalaoId || undefined,
      posicao: posicao !== "" ? posicao : undefined,
      numero: numeroRaw !== "" ? Number(numeroRaw) : undefined,
      dataNascimento: dataRaw !== "" ? dataRaw : undefined,
      observacoes: obsRaw !== "" ? obsRaw : undefined,
    };

    startTransition(async () => {
      const res = atleta
        ? await atualizarAtleta(atleta.id, dados)
        : await criarAtleta(dados);

      if (res.sucesso) {
        toast.success(atleta ? "Atleta atualizado" : "Atleta criado");
        router.push(atleta ? `/plantel/${atleta.id}` : "/plantel");
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
        <Label htmlFor="nome">Nome *</Label>
        <Input
          id="nome"
          name="nome"
          defaultValue={atleta?.nome ?? ""}
          required
          minLength={2}
          maxLength={100}
          placeholder="Nome completo"
        />
        {erros.nome && <p className="text-legenda text-vermelho-600">{erros.nome}</p>}
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Posição</Label>
          <Select value={posicao} onValueChange={setPosicao}>
            <SelectTrigger>
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              {POSICOES.map((p) => (
                <SelectItem key={p} value={p}>
                  {LABEL_POSICAO[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="numero">Número</Label>
          <Input
            id="numero"
            name="numero"
            type="number"
            min={1}
            max={99}
            defaultValue={atleta?.numero ?? ""}
            placeholder="ex: 7"
          />
          {erros.numero && <p className="text-legenda text-vermelho-600">{erros.numero}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="dataNascimento">Data de nascimento</Label>
        <Input
          id="dataNascimento"
          name="dataNascimento"
          type="date"
          defaultValue={formatDateForInput(atleta?.dataNascimento)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea
          id="observacoes"
          name="observacoes"
          defaultValue={atleta?.observacoes ?? ""}
          maxLength={1000}
          rows={3}
          placeholder="Notas sobre o atleta…"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={pending || !escalaoId}>
          {pending ? "A guardar…" : atleta ? "Guardar alterações" : "Criar atleta"}
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
