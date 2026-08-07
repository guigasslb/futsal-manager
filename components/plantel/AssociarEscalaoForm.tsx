"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
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
import { associarAEscalao } from "@/lib/actions/participacoes";
import {
  LABEL_TIPO_PARTICIPACAO,
  TIPOS_PARTICIPACAO_ADICIONAL,
} from "@/lib/schemas/participacao";
import type { TipoParticipacao } from "@prisma/client";

export interface EscalaoOpcao {
  id: string;
  nome: string;
}

/**
 * Associar o atleta a um escalão adicional (secção 8.5).
 * A participação PRINCIPAL define-se na criação do atleta ou por transferência —
 * aqui só se associam participações simultâneas/ocasionais (o schema recusa
 * PRINCIPAL, pelo que a lista de tipos vem do próprio contrato).
 */
export function AssociarEscalaoForm({
  atletaId,
  nomeAtleta,
  escaloesDisponiveis,
}: {
  atletaId: string;
  nomeAtleta: string;
  escaloesDisponiveis: EscalaoOpcao[];
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [pending, startTransition] = useTransition();
  const [escalaoId, setEscalaoId] = useState("");
  const [tipo, setTipo] = useState<TipoParticipacao>("SIMULTANEA");
  const [numero, setNumero] = useState("");
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  const semEscaloes = escaloesDisponiveis.length === 0;

  function alternar(valor: boolean) {
    setAberto(valor);
    if (!valor) {
      setEscalaoId("");
      setTipo("SIMULTANEA");
      setNumero("");
      setErros({});
      setErroGeral(null);
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErros({});
    setErroGeral(null);

    startTransition(async () => {
      const res = await associarAEscalao({
        atletaId,
        escalaoId,
        tipo,
        numero: numero.trim() !== "" ? Number(numero) : undefined,
      });

      if (res.sucesso) {
        toast.success("Atleta associado ao escalão");
        alternar(false);
        router.refresh();
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
          disabled={semEscaloes}
          title={
            semEscaloes
              ? "O atleta já participa em todos os escalões do clube"
              : undefined
          }
        >
          <UserPlus className="h-4 w-4" />
          Associar a escalão
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Associar a escalão</DialogTitle>
          <DialogDescription>
            Adiciona uma participação de {nomeAtleta} noutro escalão, na época ativa.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="associar-escalao">Escalão *</Label>
            <Select value={escalaoId} onValueChange={setEscalaoId}>
              <SelectTrigger
                id="associar-escalao"
                className="h-11"
                aria-invalid={!!erros.escalaoId}
                aria-describedby={erros.escalaoId ? "associar-escalao-erro" : undefined}
              >
                <SelectValue placeholder="Seleciona o escalão" />
              </SelectTrigger>
              <SelectContent>
                {escaloesDisponiveis.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {erros.escalaoId && (
              <p id="associar-escalao-erro" className="text-legenda text-vermelho-600">
                {erros.escalaoId}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="associar-tipo">Tipo de participação</Label>
              <Select
                value={tipo}
                onValueChange={(v) => setTipo(v as TipoParticipacao)}
              >
                <SelectTrigger
                  id="associar-tipo"
                  className="h-11"
                  aria-invalid={!!erros.tipo}
                  aria-describedby={erros.tipo ? "associar-tipo-erro" : undefined}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_PARTICIPACAO_ADICIONAL.map((t) => (
                    <SelectItem key={t} value={t}>
                      {LABEL_TIPO_PARTICIPACAO[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {erros.tipo && (
                <p id="associar-tipo-erro" className="text-legenda text-vermelho-600">
                  {erros.tipo}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="associar-numero">Número neste escalão</Label>
              <Input
                id="associar-numero"
                type="number"
                inputMode="numeric"
                min={1}
                max={999}
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                placeholder="ex: 7"
                aria-invalid={!!erros.numero}
                aria-describedby={erros.numero ? "associar-numero-erro" : undefined}
              />
              {erros.numero && (
                <p id="associar-numero-erro" className="text-legenda text-vermelho-600">
                  {erros.numero}
                </p>
              )}
            </div>
          </div>

          <p className="text-legenda text-cinza-400">
            O número de camisola é opcional e pode ser diferente em cada escalão.
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
            <Button type="submit" disabled={pending || escalaoId === ""}>
              {pending ? "A associar…" : "Associar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
