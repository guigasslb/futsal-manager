// lib/classificacao.ts
// F6 (Fase 16) — Cálculo puro da tabela de classificação de uma competição.
//
// A classificação NÃO é armazenada (bíblia §3.7, §16 fase 16): é CALCULADA a
// partir de (a) resultados inseridos manualmente para todas as equipas
// (`ResultadoCompeticao`) e (b) jogos da própria equipa (`Jogo`).
//
// Este módulo é PURO (sem "use server", sem Prisma) para ser reutilizável no
// cliente e testável sem base de dados.

import type { FormatoCompeticao } from "@prisma/client";

/** Uma linha da tabela de classificação (uma equipa). */
export interface LinhaClassificacao {
  equipa: string;
  jogos: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  golosMarcados: number;
  golosSofridos: number;
  pontos: number;
}

/** Jogo da própria equipa com resultado final, na perspetiva do clube. */
export interface JogoClassificacao {
  adversario: string;
  golosMarcados: number; // golos da própria equipa
  golosSofridos: number; // golos do adversário
}

/** Resultado externo (jogo de/entre outras equipas), inserido manualmente. */
export interface ResultadoClassificacao {
  equipaCasa: string;
  equipaFora: string;
  golosCasa: number;
  golosFora: number;
}

/**
 * Pontuação por formato (bíblia §3.7):
 *  - LIGA: 3 pts vitória, 1 pt empate, 0 derrota.
 *  - TORNEIO/TACA: sem pontos (a ordenação recai na diferença de golos).
 */
function pontosPorFormato(formato: FormatoCompeticao): {
  vitoria: number;
  empate: number;
} {
  return formato === "LIGA" ? { vitoria: 3, empate: 1 } : { vitoria: 0, empate: 0 };
}

/**
 * Calcula a tabela de classificação combinando os jogos da própria equipa com
 * os resultados externos. Agrupa por nome de equipa (após `trim`), acumulando
 * jogos, vitórias/empates/derrotas, golos e pontos.
 *
 * Ordenação: pontos desc → diferença de golos desc → golos marcados desc →
 * nome asc (desempate estável).
 */
export function calcularClassificacao(args: {
  nomeEquipaPropria: string;
  formato: FormatoCompeticao;
  jogosProprios: JogoClassificacao[];
  resultados: ResultadoClassificacao[];
}): LinhaClassificacao[] {
  const { nomeEquipaPropria, formato, jogosProprios, resultados } = args;
  const pontos = pontosPorFormato(formato);
  const tabela = new Map<string, LinhaClassificacao>();

  const linha = (equipaBruta: string): LinhaClassificacao | null => {
    const equipa = equipaBruta.trim();
    if (equipa === "") return null;
    let l = tabela.get(equipa);
    if (!l) {
      l = {
        equipa,
        jogos: 0,
        vitorias: 0,
        empates: 0,
        derrotas: 0,
        golosMarcados: 0,
        golosSofridos: 0,
        pontos: 0,
      };
      tabela.set(equipa, l);
    }
    return l;
  };

  // Regista um confronto na perspetiva de UMA equipa (marcados vs sofridos).
  const registar = (equipa: string, marcados: number, sofridos: number): void => {
    const l = linha(equipa);
    if (!l) return;
    l.jogos += 1;
    l.golosMarcados += marcados;
    l.golosSofridos += sofridos;
    if (marcados > sofridos) {
      l.vitorias += 1;
      l.pontos += pontos.vitoria;
    } else if (marcados === sofridos) {
      l.empates += 1;
      l.pontos += pontos.empate;
    } else {
      l.derrotas += 1;
    }
  };

  // Jogos próprios: a própria equipa e o adversário (espelho).
  for (const j of jogosProprios) {
    registar(nomeEquipaPropria, j.golosMarcados, j.golosSofridos);
    registar(j.adversario, j.golosSofridos, j.golosMarcados);
  }

  // Resultados externos: casa e fora (espelho).
  for (const r of resultados) {
    registar(r.equipaCasa, r.golosCasa, r.golosFora);
    registar(r.equipaFora, r.golosFora, r.golosCasa);
  }

  const diff = (l: LinhaClassificacao): number => l.golosMarcados - l.golosSofridos;

  return [...tabela.values()].sort((a, b) => {
    if (b.pontos !== a.pontos) return b.pontos - a.pontos;
    if (diff(b) !== diff(a)) return diff(b) - diff(a);
    if (b.golosMarcados !== a.golosMarcados) return b.golosMarcados - a.golosMarcados;
    return a.equipa.localeCompare(b.equipa, "pt");
  });
}
