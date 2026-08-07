"use client";

import { useState, useTransition, type ReactNode } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { criarCompeticao, atualizarCompeticao } from "@/lib/actions/competicoes";
import { LABEL_FORMATO_COMPETICAO } from "@/lib/schemas/competicao";
import { LABEL_TIPO_JOGO } from "@/lib/schemas/jogo";
import type { FormatoCompeticao, TipoJogo } from "@prisma/client";

type EscalaoBasico = { id: string; nome: string };
type EpocaBasica = { id: string; nome: string; ativa: boolean };

/** Dados mínimos de uma competição para pré-preencher o formulário em edição. */
export type CompeticaoParaEdicao = {
  id: string;
  nome: string;
  tipo: TipoJogo;
  formato: FormatoCompeticao;
  escalaoId: string;
  epocaId: string;
};

const FORMATOS: FormatoCompeticao[] = ["LIGA", "TORNEIO", "TACA"];

export function CompeticaoForm({
  escaloes,
  epocas,
  competicao,
  trigger,
}: {
  escaloes: EscalaoBasico[];
  epocas: EpocaBasica[];
  competicao?: CompeticaoParaEdicao;
  trigger: ReactNode;
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  const epocaAtivaId = epocas.find((e) => e.ativa)?.id ?? epocas[0]?.id ?? "";
  const [escalaoId, setEscalaoId] = useState(competicao?.escalaoId ?? escaloes[0]?.id ?? "");
  const [epocaId, setEpocaId] = useState(competicao?.epocaId ?? epocaAtivaId);
  const [tipo, setTipo] = useState<TipoJogo>(competicao?.tipo ?? "OFICIAL");
  const [formato, setFormato] = useState<FormatoCompeticao>(competicao?.formato ?? "LIGA");

  const emEdicao = Boolean(competicao);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setErro(null);

    // A época é fixada na criação (o servidor não a altera em edição).
    const dados = {
      nome: String(fd.get("nome") ?? "").trim(),
      tipo,
      formato,
      escalaoId,
      ...(emEdicao ? {} : { epocaId: epocaId || undefined }),
    };

    startTransition(async () => {
      const res = competicao
        ? await atualizarCompeticao(competicao.id, dados)
        : await criarCompeticao(dados);
      if (res.sucesso) {
        toast.success(emEdicao ? "Competição atualizada" : "Competição criada");
        setAberto(false);
        router.refresh();
      } else {
        setErro(res.erro);
      }
    });
  }

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{emEdicao ? "Editar competição" : "Nova competição"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {erro && <p className="text-corpo-sec text-vermelho-600">{erro}</p>}

          <div className="space-y-1.5">
            <Label htmlFor="nome">Nome *</Label>
            <Input
              id="nome"
              name="nome"
              required
              maxLength={100}
              defaultValue={competicao?.nome ?? ""}
              placeholder="ex: Liga distrital"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Formato</Label>
              <Select value={formato} onValueChange={(v) => setFormato(v as FormatoCompeticao)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORMATOS.map((f) => (
                    <SelectItem key={f} value={f}>
                      {LABEL_FORMATO_COMPETICAO[f]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as TipoJogo)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OFICIAL">{LABEL_TIPO_JOGO.OFICIAL}</SelectItem>
                  <SelectItem value="AMIGAVEL">{LABEL_TIPO_JOGO.AMIGAVEL}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
            </div>
            <div className="space-y-1.5">
              <Label>Época</Label>
              <Select value={epocaId} onValueChange={setEpocaId} disabled={emEdicao}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleciona" />
                </SelectTrigger>
                <SelectContent>
                  {epocas.map((ep) => (
                    <SelectItem key={ep.id} value={ep.id}>
                      {ep.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {emEdicao && (
                <p className="text-legenda text-cinza-500">A época não se altera após a criação.</p>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={pending || !escalaoId}>
              {pending
                ? emEdicao
                  ? "A guardar…"
                  : "A criar…"
                : emEdicao
                  ? "Guardar alterações"
                  : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
