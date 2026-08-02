"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { registarEventoJogo, apagarEventoJogo } from "@/lib/actions/jogos";
import { LABEL_EVENTO } from "@/lib/schemas/jogo";
import type { TipoEventoJogo } from "@prisma/client";

type Evento = {
  id: string;
  parte: number;
  minuto: number | null;
  tipo: TipoEventoJogo;
  atletaId: string | null;
};
type Atleta = { id: string; nome: string; numero: number | null };

const TIPOS: TipoEventoJogo[] = [
  "GOLO",
  "ASSISTENCIA",
  "DEFESA",
  "FALTA",
  "CARTAO_AMARELO",
  "CARTAO_VERMELHO",
  "SUBSTITUICAO",
  "GOLO_SOFRIDO",
  "TIMEOUT",
];

export function RegistoAoVivo({
  jogoId,
  eventos,
  atletas,
}: {
  jogoId: string;
  eventos: Evento[];
  atletas: Atleta[];
}) {
  const [pending, startTransition] = useTransition();
  const [parte, setParte] = useState("1");
  const [tipo, setTipo] = useState<TipoEventoJogo>("GOLO");
  const [atletaId, setAtletaId] = useState<string>("");
  const [minuto, setMinuto] = useState<string>("");

  const nomeAtleta = (id: string | null) => {
    if (!id) return null;
    const a = atletas.find((x) => x.id === id);
    return a ? `${a.numero != null ? `#${a.numero} ` : ""}${a.nome}` : null;
  };

  function adicionar() {
    startTransition(async () => {
      const res = await registarEventoJogo(jogoId, {
        parte: Number(parte),
        tipo,
        atletaId: atletaId || null,
        minuto: minuto.trim() !== "" ? Number(minuto) : null,
      });
      if (res.sucesso) {
        toast.success("Evento registado");
        setMinuto("");
      } else toast.error(res.erro);
    });
  }

  function remover(id: string) {
    startTransition(async () => {
      const res = await apagarEventoJogo(id);
      if (!res.sucesso) toast.error(res.erro);
    });
  }

  return (
    <div className="rounded-lg border border-cinza-200 bg-white p-5 shadow-card space-y-4">
      <div className="flex items-center gap-2">
        <Radio className="h-5 w-5 text-vermelho-600" />
        <h2 className="text-subtitulo text-cinza-900">Registo ao vivo</h2>
      </div>

      {/* Adicionar evento */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <Select value={parte} onValueChange={setParte}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1ª parte</SelectItem>
            <SelectItem value="2">2ª parte</SelectItem>
          </SelectContent>
        </Select>
        <Select value={tipo} onValueChange={(v) => setTipo(v as TipoEventoJogo)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {TIPOS.map((t) => (
              <SelectItem key={t} value={t}>{LABEL_EVENTO[t]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={atletaId || "none"} onValueChange={(v) => setAtletaId(v === "none" ? "" : v)}>
          <SelectTrigger><SelectValue placeholder="Atleta" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">— sem atleta —</SelectItem>
            {atletas.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.numero != null ? `#${a.numero} ` : ""}{a.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="number"
          min={0}
          max={60}
          value={minuto}
          onChange={(e) => setMinuto(e.target.value)}
          placeholder="min"
        />
        <Button onClick={adicionar} disabled={pending}>
          <Plus className="h-4 w-4" />
          Registar
        </Button>
      </div>

      {/* Log */}
      {eventos.length === 0 ? (
        <p className="text-corpo-sec text-cinza-500">Ainda não há eventos registados.</p>
      ) : (
        <ul className="space-y-1.5">
          {eventos.map((e) => (
            <li key={e.id} className="flex items-center gap-3 rounded-md border border-cinza-100 px-3 py-1.5 text-corpo-sec">
              <span className="w-16 text-cinza-500">
                {e.parte}ª{e.minuto != null ? ` · ${e.minuto}'` : ""}
              </span>
              <span className="font-medium text-cinza-900">{LABEL_EVENTO[e.tipo]}</span>
              {nomeAtleta(e.atletaId) && <span className="text-cinza-600">— {nomeAtleta(e.atletaId)}</span>}
              <button
                onClick={() => remover(e.id)}
                disabled={pending}
                className="ml-auto rounded p-1 text-vermelho-600 hover:bg-vermelho-600/10"
                aria-label="Apagar evento"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
