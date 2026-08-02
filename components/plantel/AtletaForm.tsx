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
const SEM_SECUNDARIO = "__none__";

function formatDateForInput(date: Date | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

type EscalaoBasico = Pick<Escalao, "id" | "nome">;
type AtletaParaEdicao = Pick<
  Atleta,
  | "id"
  | "nome"
  | "escalaoId"
  | "escalaoSecundarioId"
  | "dataNascimento"
  | "dataIngresso"
  | "posicoes"
  | "numero"
  | "observacoes"
  | "fotoUrl"
  | "encarregadoNome"
  | "encarregadoContacto"
  | "encarregadoEmail"
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
  const [posicoes, setPosicoes] = useState<Set<Posicao>>(
    () => new Set(atleta?.posicoes ?? []),
  );
  const [escalaoId, setEscalaoId] = useState<string>(atleta?.escalaoId ?? "");
  const [escalaoSecundarioId, setEscalaoSecundarioId] = useState<string>(
    atleta?.escalaoSecundarioId ?? SEM_SECUNDARIO,
  );

  function alternarPosicao(p: Posicao) {
    setPosicoes((prev) => {
      const novo = new Set(prev);
      if (novo.has(p)) novo.delete(p);
      else novo.add(p);
      return novo;
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setErros({});
    setErroGeral(null);

    const val = (k: string) => String(fd.get(k) ?? "").trim();
    const numeroRaw = val("numero");
    const dataRaw = val("dataNascimento");
    const ingressoRaw = val("dataIngresso");

    const dados = {
      nome: String(fd.get("nome")),
      escalaoId: escalaoId || undefined,
      escalaoSecundarioId:
        escalaoSecundarioId !== SEM_SECUNDARIO ? escalaoSecundarioId : null,
      posicoes: [...posicoes],
      numero: numeroRaw !== "" ? Number(numeroRaw) : undefined,
      dataNascimento: dataRaw !== "" ? dataRaw : undefined,
      dataIngresso: ingressoRaw !== "" ? ingressoRaw : undefined,
      observacoes: val("observacoes") || undefined,
      fotoUrl: val("fotoUrl"),
      encarregadoNome: val("encarregadoNome") || undefined,
      encarregadoContacto: val("encarregadoContacto") || undefined,
      encarregadoEmail: val("encarregadoEmail"),
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

  const secundarios = escaloes.filter((e) => e.id !== escalaoId);

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-6">
      {erroGeral && !Object.keys(erros).length && (
        <p className="text-corpo-sec text-vermelho-600">{erroGeral}</p>
      )}

      {/* Identidade */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="nome">Nome *</Label>
          <Input id="nome" name="nome" defaultValue={atleta?.nome ?? ""} required minLength={2} maxLength={100} placeholder="Nome completo" />
          {erros.nome && <p className="text-legenda text-vermelho-600">{erros.nome}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="numero">Número</Label>
            <Input id="numero" name="numero" type="number" min={1} max={99} defaultValue={atleta?.numero ?? ""} placeholder="ex: 7" />
            {erros.numero && <p className="text-legenda text-vermelho-600">{erros.numero}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dataNascimento">Data de nascimento</Label>
            <Input id="dataNascimento" name="dataNascimento" type="date" defaultValue={formatDateForInput(atleta?.dataNascimento)} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="dataIngresso">Data de ingresso</Label>
          <Input id="dataIngresso" name="dataIngresso" type="date" defaultValue={formatDateForInput(atleta?.dataIngresso)} />
          <p className="text-legenda text-cinza-400">
            Se o atleta entrou a meio da época, a taxa de presença conta a partir desta data.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label>Posições</Label>
          <div className="flex flex-wrap gap-2">
            {POSICOES.map((p) => {
              const ativo = posicoes.has(p);
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => alternarPosicao(p)}
                  className={`rounded-full border px-3 py-1.5 text-corpo-sec transition-colors ${
                    ativo
                      ? "border-azul-700 bg-azul-50 text-azul-700"
                      : "border-cinza-200 text-cinza-600 hover:bg-cinza-50"
                  }`}
                >
                  {LABEL_POSICAO[p]}
                </button>
              );
            })}
          </div>
          <p className="text-legenda text-cinza-400">Podes escolher mais do que uma.</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="fotoUrl">Fotografia (URL)</Label>
          <Input id="fotoUrl" name="fotoUrl" defaultValue={atleta?.fotoUrl ?? ""} placeholder="https://…" />
          {erros.fotoUrl && <p className="text-legenda text-vermelho-600">{erros.fotoUrl}</p>}
        </div>
      </div>

      {/* Escalões */}
      <div className="space-y-4 border-t border-cinza-200 pt-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Escalão principal *</Label>
            <Select value={escalaoId} onValueChange={setEscalaoId}>
              <SelectTrigger><SelectValue placeholder="Seleciona" /></SelectTrigger>
              <SelectContent>
                {escaloes.map((e) => (<SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>))}
              </SelectContent>
            </Select>
            {erros.escalaoId && <p className="text-legenda text-vermelho-600">{erros.escalaoId}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Escalão secundário</Label>
            <Select value={escalaoSecundarioId} onValueChange={setEscalaoSecundarioId}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={SEM_SECUNDARIO}>— nenhum —</SelectItem>
                {secundarios.map((e) => (<SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>))}
              </SelectContent>
            </Select>
            {erros.escalaoSecundarioId && (
              <p className="text-legenda text-vermelho-600">{erros.escalaoSecundarioId}</p>
            )}
          </div>
        </div>
        <p className="text-legenda text-cinza-400">Um atleta pode jogar em até dois escalões.</p>
      </div>

      {/* Encarregado de educação */}
      <div className="space-y-4 border-t border-cinza-200 pt-5">
        <p className="text-corpo font-semibold text-cinza-900">Encarregado de educação</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="encarregadoNome">Nome</Label>
            <Input id="encarregadoNome" name="encarregadoNome" defaultValue={atleta?.encarregadoNome ?? ""} maxLength={100} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="encarregadoContacto">Contacto</Label>
            <Input id="encarregadoContacto" name="encarregadoContacto" defaultValue={atleta?.encarregadoContacto ?? ""} maxLength={40} placeholder="Telemóvel" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="encarregadoEmail">Email</Label>
          <Input id="encarregadoEmail" name="encarregadoEmail" type="email" defaultValue={atleta?.encarregadoEmail ?? ""} />
          {erros.encarregadoEmail && <p className="text-legenda text-vermelho-600">{erros.encarregadoEmail}</p>}
        </div>
      </div>

      {/* Observações */}
      <div className="space-y-1.5">
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea id="observacoes" name="observacoes" defaultValue={atleta?.observacoes ?? ""} maxLength={1000} rows={3} placeholder="Notas sobre o atleta…" />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={pending || !escalaoId}>
          {pending ? "A guardar…" : atleta ? "Guardar alterações" : "Criar atleta"}
        </Button>
        <Button type="button" variant="outline" disabled={pending} onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
