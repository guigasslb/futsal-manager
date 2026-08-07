"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { transferirEscalao } from "@/lib/actions/participacoes";
import {
  LABEL_TIPO_PARTICIPACAO,
  TIPOS_PARTICIPACAO,
} from "@/lib/schemas/participacao";
import type { TipoParticipacao } from "@prisma/client";
import type { EscalaoOpcao } from "@/components/plantel/AssociarEscalaoForm";

export interface ParticipacaoAtivaOpcao {
  escalaoId: string;
  escalaoNome: string;
  numero: number | null;
}

/**
 * Transferir o atleta entre escalões (secção 8.5).
 * A participação de origem fica em «transição permanente» (com data de fim) e é
 * criada/reativada a participação no escalão de destino.
 *
 * `escaloesPossiveis` só contém os escalões que o utilizador PODE GERIR: a action
 * exige `PLANTEL_GERIR` na origem **e** no destino (secção 6.7), pelo que oferecer
 * destinos fora do âmbito só produziria erros "Sem permissão neste escalão".
 */
export function TransferirEscalaoForm({
  atletaId,
  nomeAtleta,
  participacoesAtivas,
  escaloesPossiveis,
}: {
  atletaId: string;
  nomeAtleta: string;
  participacoesAtivas: ParticipacaoAtivaOpcao[];
  escaloesPossiveis: EscalaoOpcao[];
}) {
  const router = useRouter();
  const origemInicial = participacoesAtivas[0]?.escalaoId ?? "";

  const [aberto, setAberto] = useState(false);
  const [pending, startTransition] = useTransition();
  const [deEscalaoId, setDeEscalaoId] = useState(origemInicial);
  const [paraEscalaoId, setParaEscalaoId] = useState("");
  const [tipo, setTipo] = useState<TipoParticipacao>("PRINCIPAL");
  const [numero, setNumero] = useState("");
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  const destinos = escaloesPossiveis.filter((e) => e.id !== deEscalaoId);
  const indisponivel = participacoesAtivas.length === 0 || destinos.length === 0;

  // As props vêm do servidor e mudam depois de cada `router.refresh()` (a origem
  // acabada de transferir deixa de estar ativa). Sem esta ressincronização o
  // estado local ficaria a apontar para uma participação que já não existe.
  useEffect(() => {
    if (!participacoesAtivas.some((p) => p.escalaoId === deEscalaoId)) {
      setDeEscalaoId(participacoesAtivas[0]?.escalaoId ?? "");
    }
  }, [participacoesAtivas, deEscalaoId]);

  useEffect(() => {
    if (paraEscalaoId !== "" && !destinos.some((e) => e.id === paraEscalaoId)) {
      setParaEscalaoId("");
    }
  }, [destinos, paraEscalaoId]);

  function alternar(valor: boolean) {
    setAberto(valor);
    if (!valor) {
      setDeEscalaoId(origemInicial);
      setParaEscalaoId("");
      setTipo("PRINCIPAL");
      setNumero("");
      setErros({});
      setErroGeral(null);
    }
  }

  function mudarOrigem(valor: string) {
    setDeEscalaoId(valor);
    // O destino não pode coincidir com a nova origem.
    if (valor === paraEscalaoId) setParaEscalaoId("");
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErros({});
    setErroGeral(null);

    startTransition(async () => {
      const res = await transferirEscalao({
        atletaId,
        deEscalaoId,
        paraEscalaoId,
        tipo,
        numero: numero.trim() !== "" ? Number(numero) : undefined,
      });

      if (res.sucesso) {
        toast.success("Atleta transferido");
        // Refrescar ANTES de fechar: o reset do formulário parte das props novas
        // (a origem transferida já não é uma participação ativa) e o efeito de
        // ressincronização acima corrige o estado quando elas chegarem.
        router.refresh();
        alternar(false);
      } else {
        setErroGeral(res.erro);
        if (res.camposInvalidos) setErros(res.camposInvalidos);
      }
    });
  }

  return (
    <Dialog open={aberto} onOpenChange={alternar}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          disabled={indisponivel}
          title={
            indisponivel
              ? "É preciso uma participação ativa e outro escalão de destino"
              : undefined
          }
        >
          <ArrowRightLeft className="h-4 w-4" />
          Transferir escalão
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Transferir escalão</DialogTitle>
          <DialogDescription>
            A participação de origem de {nomeAtleta} fica em transição permanente e o
            histórico é preservado.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="transferir-origem">Escalão de origem *</Label>
            <Select value={deEscalaoId} onValueChange={mudarOrigem}>
              <SelectTrigger
                id="transferir-origem"
                className="h-11"
                aria-invalid={!!erros.deEscalaoId}
                aria-describedby={erros.deEscalaoId ? "transferir-origem-erro" : undefined}
              >
                <SelectValue placeholder="Seleciona a participação" />
              </SelectTrigger>
              <SelectContent>
                {participacoesAtivas.map((p) => (
                  <SelectItem key={p.escalaoId} value={p.escalaoId}>
                    {p.escalaoNome}
                    {p.numero != null ? ` · #${p.numero}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {erros.deEscalaoId && (
              <p id="transferir-origem-erro" className="text-legenda text-vermelho-600">
                {erros.deEscalaoId}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="transferir-destino">Escalão de destino *</Label>
            <Select value={paraEscalaoId} onValueChange={setParaEscalaoId}>
              <SelectTrigger
                id="transferir-destino"
                className="h-11"
                aria-invalid={!!erros.paraEscalaoId}
                aria-describedby={
                  erros.paraEscalaoId ? "transferir-destino-erro" : undefined
                }
              >
                <SelectValue placeholder="Seleciona o escalão" />
              </SelectTrigger>
              <SelectContent>
                {destinos.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {erros.paraEscalaoId && (
              <p id="transferir-destino-erro" className="text-legenda text-vermelho-600">
                {erros.paraEscalaoId}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="transferir-tipo">Tipo no destino</Label>
              <Select
                value={tipo}
                onValueChange={(v) => setTipo(v as TipoParticipacao)}
              >
                <SelectTrigger
                  id="transferir-tipo"
                  className="h-11"
                  aria-invalid={!!erros.tipo}
                  aria-describedby={erros.tipo ? "transferir-tipo-erro" : undefined}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_PARTICIPACAO.map((t) => (
                    <SelectItem key={t} value={t}>
                      {LABEL_TIPO_PARTICIPACAO[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {erros.tipo && (
                <p id="transferir-tipo-erro" className="text-legenda text-vermelho-600">
                  {erros.tipo}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="transferir-numero">Número no destino</Label>
              <Input
                id="transferir-numero"
                type="number"
                inputMode="numeric"
                min={1}
                max={999}
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                placeholder="Manter"
                aria-invalid={!!erros.numero}
                aria-describedby={erros.numero ? "transferir-numero-erro" : undefined}
              />
              {erros.numero && (
                <p id="transferir-numero-erro" className="text-legenda text-vermelho-600">
                  {erros.numero}
                </p>
              )}
            </div>
          </div>

          <p className="text-legenda text-cinza-400">
            Se deixares o número em branco, mantém-se o número da participação de origem.
          </p>

          {erroGeral && !Object.keys(erros).length && (
            <p role="alert" className="text-corpo-sec text-vermelho-600">
              {erroGeral}
            </p>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => alternar(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={pending || deEscalaoId === "" || paraEscalaoId === ""}
            >
              {pending ? "A transferir…" : "Transferir"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
