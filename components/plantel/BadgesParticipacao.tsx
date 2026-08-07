import { cn } from "@/lib/utils";
import {
  ABREV_TIPO_PARTICIPACAO,
  LABEL_ESTADO_PARTICIPACAO,
  LABEL_TIPO_PARTICIPACAO,
} from "@/lib/schemas/participacao";
import type { EstadoParticipacao, TipoParticipacao } from "@prisma/client";

/**
 * Etiquetas de participação (F1 — secção 8.5).
 * Componentes puros (sem estado) — utilizáveis em Server e Client Components.
 */

const BASE =
  "inline-flex items-center rounded-full border px-2 py-0.5 text-legenda font-medium leading-tight";

const ESTILO_TIPO: Record<TipoParticipacao, string> = {
  PRINCIPAL: "border-primary/30 bg-primary/5 text-primary",
  SIMULTANEA: "border-azul-300 bg-azul-50 text-azul-700",
  OCASIONAL: "border-cinza-300 bg-cinza-50 text-cinza-600",
};

export function BadgeTipoParticipacao({
  tipo,
  compacto = false,
  className,
}: {
  tipo: TipoParticipacao;
  /** Rótulo abreviado, para cartões e listas densas. */
  compacto?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(BASE, ESTILO_TIPO[tipo], className)}
      title={LABEL_TIPO_PARTICIPACAO[tipo]}
    >
      {compacto ? ABREV_TIPO_PARTICIPACAO[tipo] : LABEL_TIPO_PARTICIPACAO[tipo]}
    </span>
  );
}

const ESTILO_ESTADO: Record<EstadoParticipacao, string> = {
  ATIVO: "border-verde-600/30 bg-verde-600/10 text-verde-600",
  TRANSICAO_PERMANENTE: "border-ambar-500/40 bg-ambar-500/10 text-ambar-600",
  INATIVO: "border-cinza-300 bg-cinza-50 text-cinza-500",
};

export function BadgeEstadoParticipacao({
  estado,
  className,
}: {
  estado: EstadoParticipacao;
  className?: string;
}) {
  return (
    <span className={cn(BASE, ESTILO_ESTADO[estado], className)}>
      {LABEL_ESTADO_PARTICIPACAO[estado]}
    </span>
  );
}
