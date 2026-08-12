"use client";

import { useCallback, useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, ListChecks, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { marcarPresencas } from "@/lib/actions/treinos";
import {
  ESTADOS_PRESENCA,
  LABEL_MOTIVO_FALTA,
  LABEL_PRESENCA,
  MOTIVOS_FALTA,
} from "@/lib/schemas/treino";
import type { EstadoPresenca, MotivoFalta } from "@prisma/client";

type Atleta = { id: string; nome: string; numero: number | null };

/** Estado de presença + motivo da falta (F1 — secção 8.5). */
export type PresencaInicial = {
  estado: EstadoPresenca;
  motivo: MotivoFalta | null;
};

const PRESENTES = new Set<EstadoPresenca>(["PRESENTE", "ATRASADO"]);

/** Estados em que faz sentido indicar o motivo da falta. */
const AUSENCIAS = new Set<EstadoPresenca>([
  "FALTA",
  "FALTA_JUSTIFICADA",
  "LESIONADO",
]);

/** Radix Select não aceita valor vazio — sentinela para «motivo não indicado». */
const SEM_MOTIVO = "SEM_MOTIVO";

export function MarcadorPresencas({
  sessaoId,
  atletas,
  presencasIniciais,
}: {
  sessaoId: string;
  atletas: Atleta[];
  presencasIniciais: Record<string, PresencaInicial>;
}) {
  const [pending, startTransition] = useTransition();

  // Estado original (o que veio da base de dados; ausência → PRESENTE por defeito).
  const construirInicial = useCallback((): Record<string, PresencaInicial> => {
    const inicial: Record<string, PresencaInicial> = {};
    for (const a of atletas) {
      inicial[a.id] = presencasIniciais[a.id] ?? { estado: "PRESENTE", motivo: null };
    }
    return inicial;
  }, [atletas, presencasIniciais]);

  const [registos, setRegistos] = useState<Record<string, PresencaInicial>>(construirInicial);

  const valores = Object.values(registos);
  const presentes = valores.filter((r) => PRESENTES.has(r.estado)).length;
  const faltas = atletas.length - presentes;

  function mudarEstado(atletaId: string, estado: EstadoPresenca) {
    setRegistos((prev) => ({
      ...prev,
      // O motivo só se aplica a ausências — volta a null quando o atleta está presente.
      [atletaId]: { estado, motivo: AUSENCIAS.has(estado) ? prev[atletaId].motivo : null },
    }));
  }

  function mudarMotivo(atletaId: string, valor: string) {
    setRegistos((prev) => ({
      ...prev,
      [atletaId]: {
        ...prev[atletaId],
        motivo: valor === SEM_MOTIVO ? null : (valor as MotivoFalta),
      },
    }));
  }

  /** Marca todos os atletas como PRESENTE (limpa motivos de falta). */
  function marcarTodosPresentes() {
    setRegistos((prev) => {
      const proximo: Record<string, PresencaInicial> = {};
      for (const id of Object.keys(prev)) proximo[id] = { estado: "PRESENTE", motivo: null };
      return proximo;
    });
  }

  /** Repõe o estado tal como estava guardado (descarta alterações não guardadas). */
  function repor() {
    setRegistos(construirInicial());
  }

  function guardar() {
    const payload = atletas.map((a) => ({
      atletaId: a.id,
      estado: registos[a.id].estado,
      motivo: registos[a.id].motivo,
    }));
    startTransition(async () => {
      const res = await marcarPresencas(sessaoId, payload);
      if (res.sucesso) toast.success("Presenças guardadas");
      else toast.error(res.erro);
    });
  }

  if (atletas.length === 0) {
    return (
      <div className="space-y-3">
        <h2 className="text-subtitulo text-cinza-900">Presenças</h2>
        <p className="rounded-md border border-dashed border-cinza-300 p-4 text-center text-corpo-sec text-cinza-500">
          Não há atletas neste escalão nesta época.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-subtitulo text-cinza-900">Presenças</h2>

      {/* Controlo rápido (P4.1) — atalhos client-side, não submetem o formulário. */}
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" onClick={marcarTodosPresentes}>
          <ListChecks className="h-4 w-4" />
          Marcar todos presentes
        </Button>
        <Button type="button" variant="ghost" onClick={repor}>
          <RotateCcw className="h-4 w-4" />
          Repor
        </Button>
      </div>

      <ul className="space-y-2">
        {atletas.map((a) => {
          const registo = registos[a.id];
          const ausente = AUSENCIAS.has(registo.estado);
          return (
            <li
              key={a.id}
              className="rounded-md border border-cinza-200 bg-white p-2.5 shadow-card"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-corpo text-cinza-900">
                  {a.numero != null && (
                    <span className="mr-1 text-cinza-400">#{a.numero}</span>
                  )}
                  {a.nome}
                </span>
                <Select
                  value={registo.estado}
                  onValueChange={(v) => mudarEstado(a.id, v as EstadoPresenca)}
                >
                  <SelectTrigger
                    id={`estado-${a.id}`}
                    aria-label={`Estado de presença de ${a.nome}`}
                    className="h-11 w-full sm:w-44"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS_PRESENCA.map((e) => (
                      <SelectItem key={e} value={e}>
                        {LABEL_PRESENCA[e]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {ausente && (
                <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-cinza-100 pt-2">
                  <Label
                    htmlFor={`motivo-${a.id}`}
                    className="text-legenda text-cinza-500"
                  >
                    Motivo
                  </Label>
                  <Select
                    value={registo.motivo ?? SEM_MOTIVO}
                    onValueChange={(v) => mudarMotivo(a.id, v)}
                  >
                    <SelectTrigger
                      id={`motivo-${a.id}`}
                      aria-label={`Motivo da falta de ${a.nome}`}
                      className="h-11 w-full sm:ms-auto sm:w-44"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={SEM_MOTIVO}>Não indicado</SelectItem>
                      {MOTIVOS_FALTA.map((m) => (
                        <SelectItem key={m} value={m}>
                          {LABEL_MOTIVO_FALTA[m]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {/* Barra de guardar fixa (P4.2) — sempre visível ao percorrer a lista. */}
      <div className="sticky bottom-0 z-10 -mx-1 flex flex-wrap items-center justify-between gap-2 border-t border-cinza-200 bg-white px-1 py-3">
        <p className="text-corpo-sec text-cinza-600">
          {presentes} presentes · {faltas} faltas
        </p>
        <Button
          onClick={guardar}
          disabled={pending}
          className="min-h-[44px] w-full sm:w-auto"
        >
          <Check className="h-4 w-4" />
          {pending ? "A guardar…" : "Guardar presenças"}
        </Button>
      </div>
    </div>
  );
}
