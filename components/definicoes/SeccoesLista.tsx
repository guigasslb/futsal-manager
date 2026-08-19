"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, UserPlus, X, Layers, Info } from "lucide-react";
import type { Modalidade } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BadgeModalidade } from "@/components/plantel/BadgeModalidade";
import {
  adicionarSeccaoAoClube,
  atribuirCoordenadorSeccao,
  removerMembroSeccao,
} from "@/lib/actions/seccoes";

const ROTULO_MODALIDADE: Record<Modalidade, string> = {
  FUTSAL: "Futsal",
  FUTEBOL: "Futebol",
};

interface Coordenador {
  membroClubeId: string;
  nome: string;
}

interface SeccaoItem {
  id: string;
  nome: string | null;
  modalidade: Modalidade;
  nEscaloes: number;
  coordenadores: Coordenador[];
}

interface Membro {
  membroClubeId: string;
  nome: string;
}

interface Props {
  seccoes: SeccaoItem[];
  modalidadesDisponiveis: Modalidade[];
  membros: Membro[];
  /** CLUBE_ESCALOES — pode criar/adicionar secções (§8.22). */
  podeCriarSeccoes: boolean;
  /** CLUBE_UTILIZADORES — pode atribuir/remover coordenadores (§8.2). */
  podeGerirCoordenadores: boolean;
}

function formatarCentimos(centimos: number): string {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
  }).format(centimos / 100);
}

export function SeccoesLista({
  seccoes,
  modalidadesDisponiveis,
  membros,
  podeCriarSeccoes,
  podeGerirCoordenadores,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function adicionarModalidade(modalidade: Modalidade) {
    startTransition(async () => {
      const res = await adicionarSeccaoAoClube(modalidade);
      if (res.sucesso) {
        // O preço novo é a fonte de verdade do servidor (§17.4). Billing deferido:
        // pode não haver licença de Clube, caso em que novoPreco é null.
        const preco =
          res.dados.novoPreco != null
            ? ` A subscrição passa a ${formatarCentimos(res.dados.novoPreco)}.`
            : "";
        toast.success(`Secção de ${ROTULO_MODALIDADE[modalidade]} adicionada.${preco}`);
        router.refresh();
      } else {
        toast.error(res.erro);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1>Secções</h1>
        <p className="mt-1 text-corpo-sec text-cinza-600">
          As modalidades do clube. Uma secção é criada automaticamente ao criar o
          primeiro escalão de uma nova modalidade — normalmente não é preciso criá-la
          aqui.
        </p>
      </div>

      {/* Aviso quando o clube tem uma única secção (§8.22 — estado vazio). */}
      {seccoes.length <= 1 && (
        <div className="flex items-start gap-3 rounded-md border border-cinza-200 bg-cinza-50 p-4">
          <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-cinza-400" />
          <p className="text-corpo-sec text-cinza-600">
            Este clube tem uma única modalidade. Basta criar escalões de outra
            modalidade — ou adicioná-la abaixo — para surgir uma nova secção.
          </p>
        </div>
      )}

      {/* Lista de secções */}
      <ul className="space-y-3">
        {seccoes.map((s) => (
          <li
            key={s.id}
            className="rounded-lg border border-cinza-200 bg-white p-4 shadow-card"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-primary/5 text-primary">
                  <Layers className="h-5 w-5" />
                </span>
                <div>
                  <p className="flex items-center gap-2 text-corpo font-semibold text-cinza-900">
                    {s.nome ?? ROTULO_MODALIDADE[s.modalidade]}
                    <BadgeModalidade modalidade={s.modalidade} compacto />
                  </p>
                  <p className="text-legenda text-cinza-500">
                    {s.nEscaloes} {s.nEscaloes === 1 ? "escalão" : "escalões"}
                  </p>
                </div>
              </div>
            </div>

            {/* Coordenadores da secção (§6.9 / §8.2) */}
            <div className="mt-4 border-t border-cinza-100 pt-3">
              <p className="text-legenda font-semibold uppercase tracking-wide text-cinza-400">
                Coordenadores
              </p>
              {s.coordenadores.length > 0 ? (
                <ul className="mt-2 flex flex-wrap gap-2">
                  {s.coordenadores.map((c) => (
                    <li
                      key={c.membroClubeId}
                      className="inline-flex items-center gap-1.5 rounded-full border border-cinza-200 bg-cinza-50 py-1 pe-1 ps-3 text-corpo-sec text-cinza-700"
                    >
                      {c.nome}
                      {podeGerirCoordenadores && (
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() =>
                            startTransition(async () => {
                              const res = await removerMembroSeccao({
                                seccaoId: s.id,
                                membroClubeId: c.membroClubeId,
                              });
                              if (res.sucesso) {
                                toast.success("Coordenador removido");
                                router.refresh();
                              } else {
                                toast.error(res.erro);
                              }
                            })
                          }
                          className="flex h-6 w-6 items-center justify-center rounded-full text-cinza-400 transition-colors hover:bg-vermelho-600/10 hover:text-vermelho-600 disabled:opacity-50"
                          aria-label={`Remover ${c.nome} da coordenação`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-corpo-sec text-cinza-500">
                  Sem coordenadores atribuídos.
                </p>
              )}

              {podeGerirCoordenadores && (
                <AdicionarCoordenador
                  membros={membros.filter(
                    (m) =>
                      !s.coordenadores.some((c) => c.membroClubeId === m.membroClubeId),
                  )}
                  pending={pending}
                  onAtribuir={(membroClubeId) =>
                    startTransition(async () => {
                      const res = await atribuirCoordenadorSeccao({
                        seccaoId: s.id,
                        membroClubeId,
                        papel: "COORDENADOR",
                      });
                      if (res.sucesso) {
                        toast.success("Coordenador atribuído");
                        router.refresh();
                      } else {
                        toast.error(res.erro);
                      }
                    })
                  }
                />
              )}
            </div>
          </li>
        ))}
      </ul>

      {/* Adicionar modalidade (com aviso de billing — §17.4) */}
      {podeCriarSeccoes && modalidadesDisponiveis.length > 0 && (
        <div className="space-y-3 rounded-lg border border-dashed border-cinza-300 p-4">
          <p className="text-corpo font-semibold text-cinza-900">Adicionar modalidade</p>
          {modalidadesDisponiveis.map((m) => (
            <div
              key={m}
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-cinza-200 bg-white p-3"
            >
              <div className="flex items-center gap-2">
                <BadgeModalidade modalidade={m} />
                <span className="text-corpo-sec text-cinza-600">
                  Adicionar {ROTULO_MODALIDADE[m]} cria uma nova secção e aumenta a
                  subscrição (tier mais caro + 50% por secção adicional).
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => adicionarModalidade(m)}
              >
                <Plus className="h-4 w-4" />
                Adicionar {ROTULO_MODALIDADE[m]}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AdicionarCoordenador({
  membros,
  pending,
  onAtribuir,
}: {
  membros: Membro[];
  pending: boolean;
  onAtribuir: (membroClubeId: string) => void;
}) {
  const [selecionado, setSelecionado] = useState<string>("");

  if (membros.length === 0) {
    return (
      <p className="mt-3 text-legenda text-cinza-400">
        Todos os membros já coordenam esta secção.
      </p>
    );
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <Select value={selecionado} onValueChange={setSelecionado}>
        <SelectTrigger
          className="h-9 w-56 border-cinza-200 bg-white text-corpo"
          aria-label="Escolher membro para coordenar a secção"
        >
          <SelectValue placeholder="Escolher membro…" />
        </SelectTrigger>
        <SelectContent>
          {membros.map((m) => (
            <SelectItem key={m.membroClubeId} value={m.membroClubeId}>
              {m.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending || !selecionado}
        onClick={() => {
          if (selecionado) {
            onAtribuir(selecionado);
            setSelecionado("");
          }
        }}
      >
        <UserPlus className="h-4 w-4" />
        Atribuir
      </Button>
    </div>
  );
}
