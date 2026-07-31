import type { Utilizacao } from "@prisma/client";

export interface EstatisticasAgregadas {
  jogosConvocado: number;
  jogosUtilizados: number;
  titularidades: number;
  totalGolos: number;
  totalAssistencias: number;
  totalMinutos: number | null;
  totalDefesas: number | null;
  totalGolosSofridos: number | null;
  sessoesTotais: number;
  presencas: number;
  taxaPresenca: number;
}

export interface LinhaEstatistica {
  utilizacao: Utilizacao;
  minutos: number | null;
  golos: number;
  assistencias: number;
  defesas: number | null;
  golosSofridosGR: number | null;
}

export interface EntradaAgregacao {
  eGR: boolean;
  jogosConvocado: number;
  sessoesTotais: number;
  presencas: number;
  estatisticas: LinhaEstatistica[];
}

/**
 * Agrega as estatísticas de um atleta na época (secção 15.2).
 * Função pura — toda a matemática de agregação vive aqui para ser testável sem BD.
 *
 * Regras:
 *  - `totalMinutos`: null se nenhum jogo tiver minutos registados (distingue "não registado" de "zero").
 *  - Estatísticas de GR (defesas, golos sofridos) só calculadas se `eGR`; caso contrário null.
 *  - `taxaPresenca`: presencas / sessoesTotais (0 se sessoesTotais = 0).
 *    ATRASADO conta como presença (já refletido em `presencas`); o divisor são as sessões
 *    desde o ingresso do atleta (calculado a montante — secção 22.3).
 */
export function agregarEstatisticas(entrada: EntradaAgregacao): EstatisticasAgregadas {
  const { eGR, jogosConvocado, sessoesTotais, presencas, estatisticas } = entrada;

  const jogosUtilizados = estatisticas.filter(
    (e) => e.utilizacao !== "NAO_UTILIZADO",
  ).length;
  const titularidades = estatisticas.filter((e) => e.utilizacao === "TITULAR").length;
  const totalGolos = estatisticas.reduce((acc, e) => acc + e.golos, 0);
  const totalAssistencias = estatisticas.reduce((acc, e) => acc + e.assistencias, 0);

  const minutosRegistados = estatisticas
    .map((e) => e.minutos)
    .filter((m): m is number => m != null);
  const totalMinutos = minutosRegistados.length
    ? minutosRegistados.reduce((acc, m) => acc + m, 0)
    : null;

  const totalDefesas = eGR
    ? estatisticas.reduce((acc, e) => acc + (e.defesas ?? 0), 0)
    : null;
  const totalGolosSofridos = eGR
    ? estatisticas.reduce((acc, e) => acc + (e.golosSofridosGR ?? 0), 0)
    : null;

  const taxaPresenca = sessoesTotais > 0 ? presencas / sessoesTotais : 0;

  return {
    jogosConvocado,
    jogosUtilizados,
    titularidades,
    totalGolos,
    totalAssistencias,
    totalMinutos,
    totalDefesas,
    totalGolosSofridos,
    sessoesTotais,
    presencas,
    taxaPresenca,
  };
}
