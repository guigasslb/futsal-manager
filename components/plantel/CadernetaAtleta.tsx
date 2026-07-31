"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Lock, CircleDashed, CircleCheck } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { atualizarProgresso, type HabilidadeComProgresso } from "@/lib/actions/caderneta";
import { LABEL_NIVEL } from "@/lib/schemas/habilidade";
import type { EstadoHabilidade, NivelHabilidade } from "@prisma/client";

const NIVEIS: NivelHabilidade[] = ["BASICO", "INTERMEDIO", "AVANCADO"];

const LABEL_ESTADO: Record<EstadoHabilidade, string> = {
  NAO_INICIADO: "Não iniciado",
  EM_PROGRESSO: "Em progresso",
  DESBLOQUEADO: "Desbloqueado",
};

function IconeEstado({ estado }: { estado: EstadoHabilidade }) {
  if (estado === "DESBLOQUEADO")
    return <CircleCheck className="h-5 w-5 text-verde-600" />;
  if (estado === "EM_PROGRESSO")
    return <CircleDashed className="h-5 w-5 text-ambar-500" />;
  return <Lock className="h-5 w-5 text-cinza-400" />;
}

export function CadernetaAtleta({
  atletaId,
  habilidades,
}: {
  atletaId: string;
  habilidades: HabilidadeComProgresso[];
}) {
  const [estados, setEstados] = useState<Record<string, EstadoHabilidade>>(() =>
    Object.fromEntries(habilidades.map((h) => [h.id, h.estado])),
  );
  const [pending, startTransition] = useTransition();

  const desbloqueadas = Object.values(estados).filter((e) => e === "DESBLOQUEADO").length;

  function mudar(habilidadeId: string, estado: EstadoHabilidade) {
    const anterior = estados[habilidadeId];
    setEstados((prev) => ({ ...prev, [habilidadeId]: estado }));
    startTransition(async () => {
      const res = await atualizarProgresso(atletaId, habilidadeId, estado);
      if (res.sucesso) {
        toast.success("Progresso atualizado");
      } else {
        setEstados((prev) => ({ ...prev, [habilidadeId]: anterior }));
        toast.error(res.erro);
      }
    });
  }

  if (habilidades.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-cinza-300 p-6 text-center text-corpo-sec text-cinza-500">
        Nenhuma habilidade no catálogo. Adiciona habilidades em Definições → Habilidades.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-corpo-sec text-cinza-600">
        {desbloqueadas} de {habilidades.length} habilidades desbloqueadas
      </p>

      {NIVEIS.map((nivel, i) => {
        const doNivel = habilidades.filter((h) => h.nivel === nivel);
        if (doNivel.length === 0) return null;
        return (
          <div key={nivel} className="space-y-3">
            {i > 0 && <Separator />}
            <h3 className="text-subtitulo text-cinza-900">{LABEL_NIVEL[nivel]}</h3>
            <ul className="space-y-2">
              {doNivel.map((h) => (
                <li
                  key={h.id}
                  className="flex items-center gap-3 rounded-md border border-cinza-200 bg-white p-3 shadow-card"
                >
                  <IconeEstado estado={estados[h.id]} />
                  <div className="flex-1">
                    <p className="text-corpo font-medium text-cinza-900">{h.nome}</p>
                    {h.descricao && (
                      <p className="text-legenda text-cinza-500">{h.descricao}</p>
                    )}
                  </div>
                  <Select
                    value={estados[h.id]}
                    onValueChange={(v) => mudar(h.id, v as EstadoHabilidade)}
                    disabled={pending}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(["NAO_INICIADO", "EM_PROGRESSO", "DESBLOQUEADO"] as const).map((e) => (
                        <SelectItem key={e} value={e}>
                          {LABEL_ESTADO[e]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
