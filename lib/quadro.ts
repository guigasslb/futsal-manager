// lib/quadro.ts
// Geração do quadro competitivo (calendário) de uma competição.
//
// Módulo PURO (sem "use server", sem Prisma) para ser testável sem base de
// dados e reutilizável no cliente (pré-visualização do quadro no wizard).
//
//  - gerarLiga:   round-robin (método do círculo / Berger) — todos contra todos.
//  - gerarBracket: quadro eliminatório com seeding e byes.

/** Equipa participante (só o que a geração precisa: nome + seed opcional). */
export type Equipa = { nome: string; posicao?: number | null };

/** Um jogo gerado do quadro: confronto + ronda (jornada/fase). */
export type JogoGerado = { equipaCasa: string; equipaFora: string; ronda: number };

// Sentinela para a equipa "fantasma" quando o nº de equipas é ímpar (bye).
const BYE = Symbol("bye");
type Slot = string | typeof BYE;

/**
 * Round-robin (todos contra todos) pelo método do círculo.
 *
 * Para N equipas (N par) gera N-1 rondas, com N/2 jogos por ronda. Se N for
 * ímpar, adiciona-se uma equipa "fantasma": em cada ronda a equipa emparelhada
 * com ela fica de fora (bye) e esse jogo não é gerado — resultando em N rondas
 * com (N-1)/2 jogos cada.
 *
 * Se `duasMaos` for true, gera a 2.ª volta invertendo casa/fora e deslocando a
 * ronda pelo número de rondas da 1.ª volta.
 */
export function gerarLiga(equipas: Equipa[], duasMaos: boolean): JogoGerado[] {
  const nomes = equipas.map((e) => e.nome);
  if (nomes.length < 2) return [];

  // Método do círculo: adiciona bye se ímpar, fixa o 1.º e roda os restantes.
  const slots: Slot[] = [...nomes];
  if (slots.length % 2 !== 0) slots.push(BYE);

  const n = slots.length;
  const rondas = n - 1;
  const metade = n / 2;
  const jogos: JogoGerado[] = [];

  let arranjo = [...slots];
  for (let r = 0; r < rondas; r++) {
    for (let i = 0; i < metade; i++) {
      const casa = arranjo[i];
      const fora = arranjo[n - 1 - i];
      // Alterna casa/fora por ronda para equilibrar mandos (par ↔ ímpar).
      const [c, f] = r % 2 === 0 ? [casa, fora] : [fora, casa];
      if (typeof c === "string" && typeof f === "string") {
        jogos.push({ equipaCasa: c, equipaFora: f, ronda: r + 1 });
      }
    }
    // Roda todos menos o primeiro (fixo).
    const fixo = arranjo[0];
    const resto = arranjo.slice(1);
    resto.unshift(resto.pop() as Slot);
    arranjo = [fixo, ...resto];
  }

  if (duasMaos) {
    const volta = jogos.map((j) => ({
      equipaCasa: j.equipaFora,
      equipaFora: j.equipaCasa,
      ronda: j.ronda + rondas,
    }));
    jogos.push(...volta);
  }

  return jogos;
}

/**
 * Quadro eliminatório (bracket) com seeding e byes.
 *
 * As equipas são ordenadas por `posicao` (seed) ascendente; as que não têm seed
 * mantêm a ordem original, a seguir às semeadas. Calcula-se a próxima potência
 * de 2 ≥ N; os `byes = potencia - N` melhores seeds avançam automaticamente
 * (ronda 0, sem jogo gerado). A ronda 1 emparelha as restantes equipas em
 * bracket clássico (melhor seed vs pior seed). As rondas seguintes não são
 * geradas — aguardam os resultados.
 */
export function gerarBracket(equipas: Equipa[]): JogoGerado[] {
  if (equipas.length < 2) return [];

  // Ordenação estável por seed (posicao asc); sem seed → fim, ordem original.
  const ordenadas = equipas
    .map((e, i) => ({ nome: e.nome, seed: e.posicao ?? Number.POSITIVE_INFINITY, i }))
    .sort((a, b) => (a.seed !== b.seed ? a.seed - b.seed : a.i - b.i))
    .map((x) => x.nome);

  const n = ordenadas.length;
  const potencia = 2 ** Math.ceil(Math.log2(n));
  const byes = potencia - n;

  // Os `byes` melhores seeds avançam sem jogar; os restantes disputam a ronda 1.
  const jogadores = ordenadas.slice(byes);
  const jogos: JogoGerado[] = [];
  let i = 0;
  let j = jogadores.length - 1;
  while (i < j) {
    jogos.push({ equipaCasa: jogadores[i], equipaFora: jogadores[j], ronda: 1 });
    i += 1;
    j -= 1;
  }

  return jogos;
}
