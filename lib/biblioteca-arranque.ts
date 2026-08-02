// Biblioteca de exercícios curada de arranque (Fase 9).
// Conteúdo autorado (uma vez), sem IA em runtime. Campo 400×200 unidades (secção 11).
// Instalável num clube via lib/actions/exercicios.ts → instalarBibliotecaArranque().

import type { CategoriaExercicioPrincipal } from "@prisma/client";
import type { DiagramaCampo } from "@/lib/schemas/exercicio";

export interface ExercicioArranque {
  nome: string;
  categoriaPrincipal: CategoriaExercicioPrincipal;
  duracaoMin: number;
  objetivo: string;
  descricao: string;
  diagrama: DiagramaCampo;
}

const j = (id: string, x: number, y: number, cor: "azul" | "vermelho", numero?: number) =>
  ({ id, tipo: "jogador" as const, x, y, cor, numero });
const bola = (id: string, x: number, y: number) => ({ id, tipo: "bola" as const, x, y });
const cone = (id: string, x: number, y: number) => ({ id, tipo: "cone" as const, x, y });
const seta = (
  id: string,
  estilo: "movimento" | "passe" | "conducao",
  pontos: { x: number; y: number }[],
) => ({ id, tipo: "seta" as const, estilo, cor: "#1A1D29", pontos });

export const BIBLIOTECA_ARRANQUE: ExercicioArranque[] = [
  {
    nome: "Ativação — Roda de passe",
    categoriaPrincipal: "FISICO",
    duracaoMin: 10,
    objetivo: "Elevar a temperatura corporal e melhorar a qualidade do passe curto.",
    descricao:
      "Jogadores em círculo, dois no meio a pressionar. Passe a um toque, apoios ativos. Trocar os do meio a cada minuto.",
    diagrama: {
      versao: 1,
      elementos: [
        j("a1", 120, 60, "azul", 1),
        j("a2", 200, 40, "azul", 2),
        j("a3", 280, 60, "azul", 3),
        j("a4", 280, 140, "azul", 4),
        j("a5", 200, 160, "azul", 5),
        j("a6", 120, 140, "azul", 6),
        j("d1", 180, 90, "vermelho"),
        j("d2", 220, 110, "vermelho"),
        bola("b1", 130, 65),
        seta("s1", "passe", [
          { x: 130, y: 65 },
          { x: 200, y: 45 },
        ]),
      ],
    },
  },
  {
    nome: "Passe e receção em losango",
    categoriaPrincipal: "ATAQUE",
    duracaoMin: 12,
    objetivo: "Melhorar a orientação da receção e o passe com o pé de dentro.",
    descricao:
      "Quatro apoios em losango. Passar, receber orientado e seguir para o apoio seguinte. Progressão: dois toques → um toque.",
    diagrama: {
      versao: 1,
      elementos: [
        j("a1", 200, 40, "azul", 1),
        j("a2", 300, 100, "azul", 2),
        j("a3", 200, 160, "azul", 3),
        j("a4", 100, 100, "azul", 4),
        bola("b1", 200, 48),
        seta("s1", "passe", [
          { x: 200, y: 48 },
          { x: 295, y: 100 },
        ]),
        seta("s2", "movimento", [
          { x: 200, y: 55 },
          { x: 290, y: 105 },
        ]),
      ],
    },
  },
  {
    nome: "Condução em slalom + finalização",
    categoriaPrincipal: "ATAQUE",
    duracaoMin: 15,
    objetivo: "Condução de bola em espaço reduzido e finalização em corrida.",
    descricao:
      "Slalom por cones, condução com sola e planta, remate colocado ao 2.º poste. Alternar pé de finalização.",
    diagrama: {
      versao: 1,
      elementos: [
        cone("c1", 120, 100),
        cone("c2", 170, 120),
        cone("c3", 220, 90),
        cone("c4", 270, 120),
        j("a1", 80, 100, "azul", 1),
        bola("b1", 92, 100),
        seta("s1", "conducao", [
          { x: 92, y: 100 },
          { x: 150, y: 105 },
          { x: 210, y: 100 },
          { x: 300, y: 100 },
        ]),
        seta("s2", "passe", [
          { x: 300, y: 100 },
          { x: 388, y: 100 },
        ]),
      ],
    },
  },
  {
    nome: "Manutenção 4x4+3 apoios",
    categoriaPrincipal: "ATAQUE",
    duracaoMin: 18,
    objetivo: "Manter a posse sob pressão, criar linhas de passe e apoio.",
    descricao:
      "Num quadrado 20×20, 4x4 com 3 apoios exteriores neutros. Máximo 2 toques. Objetivo: 8 passes seguidos = ponto.",
    diagrama: {
      versao: 1,
      elementos: [
        j("a1", 130, 70, "azul", 1),
        j("a2", 270, 70, "azul", 2),
        j("a3", 270, 130, "azul", 3),
        j("a4", 130, 130, "azul", 4),
        j("d1", 180, 90, "vermelho"),
        j("d2", 220, 90, "vermelho"),
        j("d3", 220, 130, "vermelho"),
        j("d4", 180, 130, "vermelho"),
        cone("c1", 100, 100),
        cone("c2", 200, 40),
        cone("c3", 300, 100),
        bola("b1", 135, 72),
      ],
    },
  },
  {
    nome: "Transição ofensiva 3x2",
    categoriaPrincipal: "TRANSICAO",
    duracaoMin: 15,
    objetivo: "Explorar a superioridade numérica na transição rápida.",
    descricao:
      "Recuperada a bola, sair em 3x2 para finalizar em menos de 6 segundos. Largura e profundidade obrigatórias.",
    diagrama: {
      versao: 1,
      elementos: [
        j("a1", 120, 100, "azul", 1),
        j("a2", 180, 50, "azul", 2),
        j("a3", 180, 150, "azul", 3),
        j("d1", 260, 80, "vermelho"),
        j("d2", 260, 120, "vermelho"),
        bola("b1", 128, 100),
        seta("s1", "conducao", [
          { x: 128, y: 100 },
          { x: 210, y: 100 },
        ]),
        seta("s2", "passe", [
          { x: 210, y: 100 },
          { x: 300, y: 60 },
        ]),
      ],
    },
  },
  {
    nome: "Situação 1x1 com apoio",
    categoriaPrincipal: "ATAQUE",
    duracaoMin: 12,
    objetivo: "Resolver o 1x1 ofensivo com uso do apoio para fixar e encarar.",
    descricao:
      "Atacante recebe do apoio, encara o defesa e procura a finalização ou o passe de retorno. Trocar funções.",
    diagrama: {
      versao: 1,
      elementos: [
        j("a1", 160, 100, "azul", 1),
        j("ap", 100, 100, "azul", 9),
        j("d1", 230, 100, "vermelho"),
        bola("b1", 108, 100),
        seta("s1", "passe", [
          { x: 108, y: 100 },
          { x: 155, y: 100 },
        ]),
        seta("s2", "movimento", [
          { x: 170, y: 100 },
          { x: 250, y: 80 },
        ]),
      ],
    },
  },
  {
    nome: "Jogo reduzido 3x3 com balizas pequenas",
    categoriaPrincipal: "ATAQUE",
    duracaoMin: 20,
    objetivo: "Tomada de decisão, transições e ocupação de espaços em contexto real.",
    descricao:
      "3x3 em meio-campo, quatro mini-balizas. Sem GR. Regra: golo só vale após 3 passes. Rotação a cada 3 minutos.",
    diagrama: {
      versao: 1,
      elementos: [
        j("a1", 140, 70, "azul", 1),
        j("a2", 120, 130, "azul", 2),
        j("a3", 190, 100, "azul", 3),
        j("d1", 260, 70, "vermelho", 1),
        j("d2", 280, 130, "vermelho", 2),
        j("d3", 220, 100, "vermelho", 3),
        bola("b1", 195, 100),
      ],
    },
  },
  {
    nome: "Canto ofensivo — bloqueio e cortina",
    categoriaPrincipal: "BOLAS_PARADAS",
    duracaoMin: 12,
    objetivo: "Criar espaço no canto com bloqueio direto e finalização.",
    descricao:
      "Batedor no canto; dois jogadores fazem cortina para libertar o rematador ao 1.º poste. Ensaiar timing.",
    diagrama: {
      versao: 1,
      elementos: [
        j("bat", 20, 30, "azul", 7),
        j("blo", 90, 80, "azul", 4),
        j("blo2", 110, 100, "azul", 5),
        j("rem", 140, 60, "azul", 9),
        bola("b1", 26, 32),
        seta("s1", "passe", [
          { x: 26, y: 32 },
          { x: 135, y: 60 },
        ]),
      ],
    },
  },
  {
    nome: "Circuito físico com bola",
    categoriaPrincipal: "FISICO",
    duracaoMin: 15,
    objetivo: "Trabalho de resistência específica intercalado com técnica.",
    descricao:
      "Estações: skipping, mudanças de direção, condução rápida e remate. 40s trabalho / 20s pausa, 3 voltas.",
    diagrama: {
      versao: 1,
      elementos: [
        cone("c1", 80, 60),
        cone("c2", 160, 60),
        cone("c3", 240, 60),
        cone("c4", 320, 60),
        cone("c5", 80, 140),
        cone("c6", 160, 140),
        cone("c7", 240, 140),
        cone("c8", 320, 140),
        j("a1", 60, 100, "azul", 1),
        bola("b1", 70, 100),
      ],
    },
  },
  {
    nome: "Saída de bola pressionada (4-0)",
    categoriaPrincipal: "ATAQUE",
    duracaoMin: 18,
    objetivo: "Construir a saída sob pressão alta com estrutura 4-0.",
    descricao:
      "Guarda-redes inicia; quatro em linha rodam para criar linha de passe. Adversário pressiona homem-a-homem. Progressão até meio-campo.",
    diagrama: {
      versao: 1,
      elementos: [
        j("gr", 40, 100, "azul", 1),
        j("f1", 110, 60, "azul", 4),
        j("f2", 110, 140, "azul", 3),
        j("a1", 190, 70, "azul", 7),
        j("a2", 190, 130, "azul", 11),
        j("d1", 150, 70, "vermelho"),
        j("d2", 150, 130, "vermelho"),
        bola("b1", 48, 100),
        seta("s1", "passe", [
          { x: 48, y: 100 },
          { x: 108, y: 62 },
        ]),
      ],
    },
  },
];
