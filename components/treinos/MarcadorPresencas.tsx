"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { marcarPresencas } from "@/lib/actions/treinos";
import { ESTADOS_PRESENCA, LABEL_PRESENCA } from "@/lib/schemas/treino";
import type { EstadoPresenca } from "@prisma/client";

type Atleta = { id: string; nome: string; numero: number | null };

const PRESENTES = new Set<EstadoPresenca>(["PRESENTE", "ATRASADO"]);

export function MarcadorPresencas({
  sessaoId,
  atletas,
  presencasIniciais,
}: {
  sessaoId: string;
  atletas: Atleta[];
  presencasIniciais: Record<string, EstadoPresenca>;
}) {
  const [pending, startTransition] = useTransition();
  const [estados, setEstados] = useState<Record<string, EstadoPresenca>>(() => {
    const inicial: Record<string, EstadoPresenca> = {};
    for (const a of atletas) {
      inicial[a.id] = presencasIniciais[a.id] ?? "PRESENTE";
    }
    return inicial;
  });

  const presentes = Object.values(estados).filter((e) => PRESENTES.has(e)).length;
  const faltas = atletas.length - presentes;

  function guardar() {
    const payload = atletas.map((a) => ({ atletaId: a.id, estado: estados[a.id] }));
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
      <ul className="space-y-2">
        {atletas.map((a) => (
          <li
            key={a.id}
            className="flex items-center gap-3 rounded-md border border-cinza-200 bg-white p-2.5 shadow-card"
          >
            <span className="flex-1 text-corpo text-cinza-900">
              {a.numero != null && (
                <span className="mr-1 text-cinza-400">#{a.numero}</span>
              )}
              {a.nome}
            </span>
            <Select
              value={estados[a.id]}
              onValueChange={(v) =>
                setEstados((prev) => ({ ...prev, [a.id]: v as EstadoPresenca }))
              }
            >
              <SelectTrigger className="w-44">
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
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between">
        <p className="text-corpo-sec text-cinza-600">
          {presentes} presentes · {faltas} faltas
        </p>
        <Button onClick={guardar} disabled={pending}>
          <Check className="h-4 w-4" />
          {pending ? "A guardar…" : "Guardar presenças"}
        </Button>
      </div>
    </div>
  );
}
