"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarClock, Check, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { apagarResultadoExterno, atualizarAgendamentoJogo } from "@/lib/actions/competicoes";
import { formatarData, formatarHora } from "@/lib/comunicacao-utils";
import type { EstadoResultado, FormatoCompeticao } from "@prisma/client";

export type ResultadoQuadro = {
  id: string;
  equipaCasa: string;
  equipaFora: string;
  golosCasa: number | null;
  golosFora: number | null;
  ronda: number | null;
  data: Date | null;
  dataHora: Date | null;
  estado: EstadoResultado;
};

// ── Helpers de data/hora para inputs nativos (hora local) ────────────────────
function paraInputData(d: Date): string {
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function paraInputHora(d: Date): string {
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function combinarDataHora(data: string, hora: string): Date | null {
  if (data === "") return null;
  const d = new Date(`${data}T${hora || "00:00"}`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function QuadroAgendamento({
  resultados,
  formato,
}: {
  resultados: ResultadoQuadro[];
  formato: FormatoCompeticao;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editando, setEditando] = useState<string | null>(null);
  const [dataEdit, setDataEdit] = useState("");
  const [horaEdit, setHoraEdit] = useState("");

  const agruparPorRonda = formato !== "LIGA";

  const agendados = useMemo(
    () => resultados.filter((r) => r.estado === "AGENDADO"),
    [resultados],
  );
  const realizados = useMemo(
    () => resultados.filter((r) => r.estado === "REALIZADO"),
    [resultados],
  );

  function iniciarEdicao(r: ResultadoQuadro) {
    const ref = r.dataHora ?? r.data;
    setDataEdit(ref ? paraInputData(ref) : "");
    setHoraEdit(r.dataHora ? paraInputHora(r.dataHora) : "");
    setEditando(r.id);
  }

  function guardarAgendamento(id: string) {
    const dataHora = combinarDataHora(dataEdit, horaEdit);
    startTransition(async () => {
      const res = await atualizarAgendamentoJogo(id, dataHora);
      if (res.sucesso) {
        toast.success("Agendamento atualizado");
        setEditando(null);
        router.refresh();
      } else {
        toast.error(res.erro);
      }
    });
  }

  function remover(id: string) {
    startTransition(async () => {
      const res = await apagarResultadoExterno(id);
      if (res.sucesso) {
        toast.success("Jogo removido");
        router.refresh();
      } else {
        toast.error(res.erro);
      }
    });
  }

  function LinhaAgendado({ r }: { r: ResultadoQuadro }) {
    const emEdicao = editando === r.id;
    const ref = r.dataHora ?? r.data;
    return (
      <li className="rounded-md border border-cinza-200 bg-white p-3 shadow-card">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-corpo text-cinza-900">
              <span className="font-medium">{r.equipaCasa}</span>
              <span className="px-1.5 text-cinza-400">vs</span>
              <span className="font-medium">{r.equipaFora}</span>
            </p>
            {!emEdicao && (
              <p className="text-legenda text-cinza-500">
                {r.dataHora
                  ? `${formatarData(r.dataHora)} · ${formatarHora(r.dataHora)}`
                  : ref
                    ? formatarData(ref)
                    : "Por definir"}
              </p>
            )}
          </div>

          {emEdicao ? (
            <div className="flex flex-wrap items-center gap-2">
              <Input
                type="date"
                value={dataEdit}
                onChange={(e) => setDataEdit(e.target.value)}
                className="h-10 w-40"
                aria-label="Data do jogo"
              />
              <Input
                type="time"
                value={horaEdit}
                onChange={(e) => setHoraEdit(e.target.value)}
                disabled={dataEdit === ""}
                className="h-10 w-28"
                aria-label="Hora do jogo"
              />
              <Button
                type="button"
                size="icon"
                onClick={() => guardarAgendamento(r.id)}
                disabled={pending}
                aria-label="Guardar agendamento"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setEditando(null)}
                disabled={pending}
                aria-label="Cancelar"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => iniciarEdicao(r)}
                disabled={pending}
                className="gap-1.5"
              >
                <Pencil className="h-3.5 w-3.5" />
                {ref ? "Editar" : "Agendar"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remover(r.id)}
                disabled={pending}
                aria-label="Remover jogo"
              >
                <Trash2 className="h-4 w-4 text-vermelho-600" />
              </Button>
            </div>
          )}
        </div>
      </li>
    );
  }

  function LinhaRealizado({ r }: { r: ResultadoQuadro }) {
    const ref = r.dataHora ?? r.data;
    return (
      <li className="flex items-center gap-3 rounded-md border border-cinza-200 bg-white p-3 shadow-card">
        <div className="min-w-0 flex-1">
          <p className="text-corpo text-cinza-900">
            <span className="font-medium">{r.equipaCasa}</span>{" "}
            <span className="font-semibold tabular-nums">
              {r.golosCasa ?? "—"} — {r.golosFora ?? "—"}
            </span>{" "}
            <span className="font-medium">{r.equipaFora}</span>
          </p>
          {ref && <p className="text-legenda text-cinza-500">{formatarData(ref)}</p>}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => remover(r.id)}
          disabled={pending}
          aria-label="Remover resultado"
        >
          <Trash2 className="h-4 w-4 text-vermelho-600" />
        </Button>
      </li>
    );
  }

  function agruparRondas(lista: ResultadoQuadro[]) {
    const mapa = new Map<number, ResultadoQuadro[]>();
    for (const r of lista) {
      const chave = r.ronda ?? 0;
      const g = mapa.get(chave) ?? [];
      g.push(r);
      mapa.set(chave, g);
    }
    return [...mapa.entries()].sort((a, b) => a[0] - b[0]);
  }

  if (resultados.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-cinza-300 p-6 text-center text-corpo-sec text-cinza-500">
        Sem jogos no quadro. Gera o quadro ao criar a competição ou adiciona resultados.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {/* Jogos agendados (por disputar) */}
      {agendados.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-cinza-900">
            <CalendarClock className="h-4 w-4 text-primary" />
            <h3 className="text-corpo font-semibold">Por disputar</h3>
            <Badge variant="secondary">{agendados.length}</Badge>
          </div>
          {agruparPorRonda ? (
            agruparRondas(agendados).map(([ronda, lista]) => (
              <div key={ronda} className="space-y-2">
                <p className="text-legenda font-medium uppercase tracking-wide text-cinza-500">
                  {ronda === 0 ? "Sem ronda" : `Ronda ${ronda}`}
                </p>
                <ul className="space-y-2">
                  {lista.map((r) => (
                    <LinhaAgendado key={r.id} r={r} />
                  ))}
                </ul>
              </div>
            ))
          ) : (
            <ul className="space-y-2">
              {agendados.map((r) => (
                <LinhaAgendado key={r.id} r={r} />
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Jogos realizados (com resultado) */}
      {realizados.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-cinza-900">
            <Check className="h-4 w-4 text-verde-600" />
            <h3 className="text-corpo font-semibold">Realizados</h3>
            <Badge variant="secondary">{realizados.length}</Badge>
          </div>
          {agruparPorRonda ? (
            agruparRondas(realizados).map(([ronda, lista]) => (
              <div key={ronda} className="space-y-2">
                <p className="text-legenda font-medium uppercase tracking-wide text-cinza-500">
                  {ronda === 0 ? "Sem ronda" : `Ronda ${ronda}`}
                </p>
                <ul className="space-y-2">
                  {lista.map((r) => (
                    <LinhaRealizado key={r.id} r={r} />
                  ))}
                </ul>
              </div>
            ))
          ) : (
            <ul className="space-y-2">
              {realizados.map((r) => (
                <LinhaRealizado key={r.id} r={r} />
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
