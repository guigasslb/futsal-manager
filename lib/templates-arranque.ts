// Templates de sessão curados de arranque (F3, secção 3.4).
// Conteúdo autorado (uma vez), sem IA em runtime. Cada template é uma sessão
// completa: aquecimento → parte principal → jogo reduzido → retorno à calma.
// Os exercícios são referenciados pelo NOME exato da biblioteca curada
// (lib/biblioteca-arranque.ts) e resolvidos no clube em
// lib/actions/templatesSessao.ts → instalarTemplatesArranque().

import type { ParteTreino, PeriodoEpoca } from "@prisma/client";

export interface ExercicioTemplateArranque {
  /** Nome exato do exercício em BIBLIOTECA_ARRANQUE. */
  nomeExercicio: string;
  parteTreino: ParteTreino;
  duracaoMin: number;
  notas?: string;
}

export interface TemplateSessaoArranque {
  nome: string;
  objetivoTatico: string;
  faseEpoca: PeriodoEpoca;
  escalaoAlvo: string;
  duracaoMin: number;
  descricao: string;
  exercicios: ExercicioTemplateArranque[];
}

export const TEMPLATES_ARRANQUE: TemplateSessaoArranque[] = [
  {
    nome: "Posse e circulação — 60 min, sub-10",
    objetivoTatico: "Manter a posse sob pressão e melhorar a qualidade do passe curto.",
    faseEpoca: "PREPARATORIO",
    escalaoAlvo: "sub-10",
    duracaoMin: 60,
    descricao:
      "Sessão de base técnica para o período preparatório: ativação com bola, trabalho de passe e receção orientada, manutenção de posse e jogo reduzido condicionado.",
    exercicios: [
      {
        nomeExercicio: "Ativação — Roda de passe",
        parteTreino: "AQUECIMENTO",
        duracaoMin: 10,
        notas: "Trocar os jogadores do meio a cada minuto.",
      },
      {
        nomeExercicio: "Passe e receção em losango",
        parteTreino: "PRINCIPAL",
        duracaoMin: 12,
        notas: "Progressão: dois toques → um toque.",
      },
      {
        nomeExercicio: "Manutenção 4x4+3 apoios",
        parteTreino: "PRINCIPAL",
        duracaoMin: 18,
      },
      {
        nomeExercicio: "Jogo reduzido 3x3 com balizas pequenas",
        parteTreino: "JOGO_REDUZIDO",
        duracaoMin: 12,
        notas: "Golo só conta após 3 passes.",
      },
      {
        nomeExercicio: "Retorno à calma — mobilidade e alongamentos",
        parteTreino: "RETORNO_CALMA",
        duracaoMin: 8,
      },
    ],
  },
  {
    nome: "Transição rápida — 60 min, sub-13",
    objetivoTatico: "Explorar a superioridade numérica após recuperação da bola.",
    faseEpoca: "COMPETITIVO",
    escalaoAlvo: "sub-13",
    duracaoMin: 60,
    descricao:
      "Sessão do período competitivo centrada na transição ofensiva: ativação, saída de bola pressionada, transição 3x2 e jogo reduzido com transições contínuas.",
    exercicios: [
      {
        nomeExercicio: "Ativação — Roda de passe",
        parteTreino: "AQUECIMENTO",
        duracaoMin: 10,
      },
      {
        nomeExercicio: "Saída de bola pressionada (4-0)",
        parteTreino: "PRINCIPAL",
        duracaoMin: 18,
        notas: "Pressão homem-a-homem a partir do meio-campo.",
      },
      {
        nomeExercicio: "Transição ofensiva 3x2",
        parteTreino: "PRINCIPAL",
        duracaoMin: 14,
        notas: "Finalizar em menos de 6 segundos.",
      },
      {
        nomeExercicio: "Jogo reduzido 3x3 com balizas pequenas",
        parteTreino: "JOGO_REDUZIDO",
        duracaoMin: 10,
      },
      {
        nomeExercicio: "Retorno à calma — mobilidade e alongamentos",
        parteTreino: "RETORNO_CALMA",
        duracaoMin: 8,
      },
    ],
  },
  {
    nome: "Finalização e 1x1 — 55 min, sub-11",
    objetivoTatico: "Resolver o 1x1 ofensivo e finalizar com eficácia.",
    faseEpoca: "COMPETITIVO",
    escalaoAlvo: "sub-11",
    duracaoMin: 55,
    descricao:
      "Sessão orientada para a finalização: ativação física com bola, condução e remate, situações de 1x1 com apoio e jogo reduzido.",
    exercicios: [
      {
        nomeExercicio: "Circuito físico com bola",
        parteTreino: "AQUECIMENTO",
        duracaoMin: 12,
        notas: "40s de trabalho / 20s de pausa, 3 voltas.",
      },
      {
        nomeExercicio: "Condução em slalom + finalização",
        parteTreino: "PRINCIPAL",
        duracaoMin: 15,
        notas: "Alternar o pé de finalização.",
      },
      {
        nomeExercicio: "Situação 1x1 com apoio",
        parteTreino: "PRINCIPAL",
        duracaoMin: 12,
      },
      {
        nomeExercicio: "Jogo reduzido 3x3 com balizas pequenas",
        parteTreino: "JOGO_REDUZIDO",
        duracaoMin: 8,
      },
      {
        nomeExercicio: "Retorno à calma — mobilidade e alongamentos",
        parteTreino: "RETORNO_CALMA",
        duracaoMin: 8,
      },
    ],
  },
];
