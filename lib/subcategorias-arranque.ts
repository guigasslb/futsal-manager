import type { CategoriaExercicioPrincipal } from "@prisma/client";

export interface SubcategoriaArranque {
  nome: string;
  categoria: CategoriaExercicioPrincipal;
  ordem: number;
}

export const SUBCATEGORIAS_ARRANQUE: SubcategoriaArranque[] = [
  // ATAQUE
  { nome: "Finalização", categoria: "ATAQUE", ordem: 0 },
  { nome: "1x1 ofensivo", categoria: "ATAQUE", ordem: 1 },
  { nome: "Posse de bola", categoria: "ATAQUE", ordem: 2 },
  { nome: "Combinações ofensivas", categoria: "ATAQUE", ordem: 3 },
  { nome: "Jogo reduzido", categoria: "ATAQUE", ordem: 4 },
  // DEFESA
  { nome: "Bloco defensivo", categoria: "DEFESA", ordem: 0 },
  { nome: "1x1 defensivo", categoria: "DEFESA", ordem: 1 },
  { nome: "Pressão alta", categoria: "DEFESA", ordem: 2 },
  // TRANSICAO
  { nome: "Contra-ataque", categoria: "TRANSICAO", ordem: 0 },
  { nome: "Transição defensiva", categoria: "TRANSICAO", ordem: 1 },
  { nome: "Situações de jogo", categoria: "TRANSICAO", ordem: 2 },
  // BOLAS_PARADAS
  { nome: "Livre direto", categoria: "BOLAS_PARADAS", ordem: 0 },
  { nome: "Canto", categoria: "BOLAS_PARADAS", ordem: 1 },
  { nome: "Lateral defensivo", categoria: "BOLAS_PARADAS", ordem: 2 },
  // FISICO
  { nome: "Ativação / Aquecimento", categoria: "FISICO", ordem: 0 },
  { nome: "Resistência", categoria: "FISICO", ordem: 1 },
  { nome: "Velocidade / Agilidade", categoria: "FISICO", ordem: 2 },
  // GUARDA_REDES
  { nome: "Defesa / Reação", categoria: "GUARDA_REDES", ordem: 0 },
  { nome: "Saída a pressão", categoria: "GUARDA_REDES", ordem: 1 },
  { nome: "Jogo com os pés", categoria: "GUARDA_REDES", ordem: 2 },
  // OUTRO
  { nome: "Lúdico / Recreativo", categoria: "OUTRO", ordem: 0 },
  { nome: "Apresentação tática", categoria: "OUTRO", ordem: 1 },
];
