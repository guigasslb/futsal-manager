"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TIPOS_SESSAO, LABEL_TIPO_SESSAO } from "@/lib/schemas/treino";
import type { TipoSessao } from "@prisma/client";

/** Configuração de UM dia do plano na UI (ISO 1=segunda … 7=domingo). */
export type DiaConfig = {
  diaSemana: number;
  ativo: boolean;
  horaInicio: string;
  horaFim: string;
  local: string;
  tipoSessao: TipoSessao;
};

/** Nomes dos dias na ordem ISO (índice 0 = segunda). */
const NOMES_DIAS = [
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
  "Domingo",
] as const;

/** Estado inicial: 7 dias (ISO 1–7), todos inativos, com um horário-tipo. */
export function diasIniciais(): DiaConfig[] {
  return NOMES_DIAS.map((_, i) => ({
    diaSemana: i + 1,
    ativo: false,
    horaInicio: "19:00",
    horaFim: "20:30",
    local: "",
    tipoSessao: "NORMAL" as TipoSessao,
  }));
}

/**
 * Seletor controlado dos dias da semana do plano. Cada dia selecionado expõe
 * hora de início/fim, local (opcional) e tipo de sessão (§8.8.1). Partilhado
 * entre a criação (`PlanoSemanalForm`) e a edição (`EditarPlanoDialog`).
 */
export function SeletorDiasPlano({
  valor,
  onChange,
  desativado = false,
  erro,
}: {
  valor: DiaConfig[];
  onChange: (dias: DiaConfig[]) => void;
  desativado?: boolean;
  erro?: string;
}) {
  function atualizar(indice: number, campos: Partial<DiaConfig>) {
    onChange(valor.map((d, i) => (i === indice ? { ...d, ...campos } : d)));
  }

  return (
    <div className="space-y-2">
      <Label>Dias da semana *</Label>
      <p className="text-legenda text-cinza-500">
        Seleciona os dias com treino e define o horário de cada um.
      </p>

      <div className="space-y-2">
        {valor.map((dia, i) => (
          <div
            key={dia.diaSemana}
            className={`rounded-md border p-3 transition-colors ${
              dia.ativo ? "border-primary/40 bg-primary/5" : "border-cinza-200 bg-white"
            }`}
          >
            <label className="flex min-h-[44px] cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={dia.ativo}
                disabled={desativado}
                onChange={(e) => atualizar(i, { ativo: e.target.checked })}
                className="h-5 w-5 accent-primary"
                aria-label={NOMES_DIAS[i]}
              />
              <span className="text-corpo font-medium text-cinza-900">{NOMES_DIAS[i]}</span>
            </label>

            {dia.ativo && (
              <div className="mt-3 grid grid-cols-1 gap-3 pl-8 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor={`inicio-${dia.diaSemana}`} className="text-legenda text-cinza-600">
                    Hora de início
                  </Label>
                  <Input
                    id={`inicio-${dia.diaSemana}`}
                    type="time"
                    value={dia.horaInicio}
                    disabled={desativado}
                    onChange={(e) => atualizar(i, { horaInicio: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`fim-${dia.diaSemana}`} className="text-legenda text-cinza-600">
                    Hora de fim
                  </Label>
                  <Input
                    id={`fim-${dia.diaSemana}`}
                    type="time"
                    value={dia.horaFim}
                    disabled={desativado}
                    onChange={(e) => atualizar(i, { horaFim: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`local-${dia.diaSemana}`} className="text-legenda text-cinza-600">
                    Local
                  </Label>
                  <Input
                    id={`local-${dia.diaSemana}`}
                    value={dia.local}
                    maxLength={200}
                    disabled={desativado}
                    placeholder="ex: Pavilhão Municipal"
                    onChange={(e) => atualizar(i, { local: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-legenda text-cinza-600">Tipo de sessão</Label>
                  <Select
                    value={dia.tipoSessao}
                    disabled={desativado}
                    onValueChange={(v) => atualizar(i, { tipoSessao: v as TipoSessao })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_SESSAO.map((t) => (
                        <SelectItem key={t} value={t}>
                          {LABEL_TIPO_SESSAO[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {erro && <p className="text-legenda text-vermelho-600">{erro}</p>}
    </div>
  );
}

/** Converte o estado da UI no payload de dias para os schemas/actions. */
export function diasParaPayload(dias: DiaConfig[]) {
  return dias
    .filter((d) => d.ativo)
    .map((d) => ({
      diaSemana: d.diaSemana,
      horaInicio: d.horaInicio,
      horaFim: d.horaFim,
      local: d.local.trim() || undefined,
      tipoSessao: d.tipoSessao,
    }));
}
