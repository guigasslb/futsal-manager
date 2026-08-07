"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { definirOverrides } from "@/lib/actions/membros";
import {
  CAPACIDADES,
  CAPACIDADES_ESTRUTURA,
  LABEL_CAPACIDADE,
  capacidadesEfetivas,
  type Capacidade,
} from "@/lib/permissoes-catalogo";
import type { MembroLista } from "@/lib/actions/utilizadores";

/** Etiqueta da origem de cada capacidade, para o membro perceber o que herda. */
function Etiqueta({ texto, tom }: { texto: string; tom: "perfil" | "extra" | "revogada" }) {
  const cores: Record<typeof tom, string> = {
    perfil: "bg-cinza-50 text-cinza-500",
    extra: "bg-primary/10 text-primary",
    revogada: "bg-vermelho-600/10 text-vermelho-600",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-legenda ${cores[tom]}`}>{texto}</span>
  );
}

/**
 * Editor de overrides de capacidades de um membro (secções 6.4 e 8.2).
 *
 * O estado local é o conjunto de capacidades **efetivas** desejadas; os arrays
 * `extra`/`revogadas` são derivados na submissão a partir da diferença para o
 * perfil base — assim nunca se persistem overrides redundantes (uma capacidade
 * em `extra` que já vem do perfil, ou em `revogadas` que o perfil não tem).
 *
 * Regra de delegação (6.4): só se pode CONCEDER (`extra`) uma capacidade que o
 * próprio possui. Revogar não está sujeito a essa regra. O servidor revalida
 * ambas as coisas — isto é apenas gating de UI.
 *
 * O catálogo `CAPACIDADES` já exclui as capacidades FUTURO (ex.: `FATURACAO_GERIR`).
 */
export function OverridesMembroDialog({
  membro,
  capacidadesProprias,
}: {
  membro: MembroLista;
  capacidadesProprias: Capacidade[];
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  const base = useMemo(
    () =>
      new Set<Capacidade>(
        CAPACIDADES.filter((c) => membro.perfilCapacidades.includes(c)),
      ),
    [membro.perfilCapacidades],
  );
  const proprias = useMemo(
    () => new Set<Capacidade>(capacidadesProprias),
    [capacidadesProprias],
  );
  const efetivasAtuais = useMemo(
    () =>
      capacidadesEfetivas(
        membro.perfilCapacidades,
        membro.capacidadesExtra,
        membro.capacidadesRevogadas,
      ),
    [membro.perfilCapacidades, membro.capacidadesExtra, membro.capacidadesRevogadas],
  );

  const [desejadas, setDesejadas] = useState<Set<Capacidade>>(
    () => new Set(efetivasAtuais),
  );

  function alternarDialogo(valor: boolean) {
    setAberto(valor);
    // Reabrir parte sempre do estado persistido (descarta edições não guardadas).
    if (!valor) {
      setDesejadas(new Set(efetivasAtuais));
      setErro(null);
    }
  }

  function alternarCapacidade(cap: Capacidade) {
    setDesejadas((prev) => {
      const novo = new Set(prev);
      if (novo.has(cap)) novo.delete(cap);
      else novo.add(cap);
      return novo;
    });
  }

  function guardar() {
    // extra = concedidas para além do perfil · revogadas = retiradas ao perfil.
    const extra = CAPACIDADES.filter((c) => desejadas.has(c) && !base.has(c));
    const revogadas = CAPACIDADES.filter((c) => !desejadas.has(c) && base.has(c));

    setErro(null);
    startTransition(async () => {
      const res = await definirOverrides(membro.membroId, extra, revogadas);
      if (res.sucesso) {
        toast.success("Permissões atualizadas");
        router.refresh();
        setAberto(false);
      } else {
        setErro(res.erro);
      }
    });
  }

  const nExtra = CAPACIDADES.filter((c) => desejadas.has(c) && !base.has(c)).length;
  const nRevogadas = CAPACIDADES.filter((c) => !desejadas.has(c) && base.has(c)).length;

  return (
    <Dialog open={aberto} onOpenChange={alternarDialogo}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Gerir permissões de ${membro.nome}`}>
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerir permissões — {membro.nome}</DialogTitle>
          <DialogDescription>
            Capacidades efetivas do membro. As que vêm do perfil «{membro.perfilNome}» podem
            ser revogadas; as restantes podem ser concedidas individualmente.
          </DialogDescription>
        </DialogHeader>

        {erro && (
          <p role="alert" className="text-corpo-sec text-vermelho-600">
            {erro}
          </p>
        )}

        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {CAPACIDADES.map((cap) => {
            const doPerfil = base.has(cap);
            const ativa = desejadas.has(cap);
            // Não se concede o que não se tem; retirar é sempre permitido.
            const bloqueada = !ativa && !doPerfil && !proprias.has(cap);
            return (
              <label
                key={cap}
                title={
                  bloqueada
                    ? "Não podes conceder uma capacidade que tu próprio não tens"
                    : undefined
                }
                className={`flex min-h-11 items-center gap-2 rounded border px-2.5 py-1.5 text-corpo-sec ${
                  bloqueada ? "border-cinza-100 opacity-60" : "border-cinza-200"
                }`}
              >
                <input
                  type="checkbox"
                  checked={ativa}
                  disabled={bloqueada || pending}
                  onChange={() => alternarCapacidade(cap)}
                  className="h-4 w-4 accent-primary"
                />
                <span
                  className={`flex-1 ${
                    CAPACIDADES_ESTRUTURA.includes(cap) ? "font-medium" : ""
                  }`}
                >
                  {LABEL_CAPACIDADE[cap]}
                </span>
                {doPerfil && ativa && <Etiqueta texto="perfil" tom="perfil" />}
                {doPerfil && !ativa && <Etiqueta texto="revogada" tom="revogada" />}
                {!doPerfil && ativa && <Etiqueta texto="extra" tom="extra" />}
              </label>
            );
          })}
        </div>

        <p className="text-legenda text-cinza-500">
          {nExtra} concedida(s) além do perfil · {nRevogadas} revogada(s) do perfil.
        </p>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => alternarDialogo(false)}
          >
            Cancelar
          </Button>
          <Button type="button" disabled={pending} onClick={guardar}>
            {pending ? "A guardar…" : "Guardar permissões"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
