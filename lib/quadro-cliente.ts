// ─────────────────────────────────────────────────────────────────────────────
// Geração de quadro competitivo no cliente (Passo 3 do WizardCompeticao).
//
// Funções PURAS (sem Prisma, sem I/O) — reutilizáveis e testáveis. Espelham a
// lógica que a Server Action `gerarQuadroCompeticao` aplica no servidor; aqui
// servem para a pré-visualização e edição do calendário antes da submissão.
// ─────────────────────────────────────────────────────────────────────────────

export type EquipaQuadro = { nome: string; posicao?: number };

export type JogoGerado = {
  equipaCasa: string;
  equipaFora: string;
  ronda: number;
  dataHora: Date | null;
};

/** Marcador interno de folga (nº ímpar de equipas) — nunca gera jogo. */
const FOLGA = Symbol("folga");
type Slot = string | typeof FOLGA;

/**
 * Liga em formato de todos-contra-todos pelo método do círculo (circle method).
 *
 * - Com N equipas gera `N-1` rondas (ou `N` rondas com folga, se N for ímpar);
 *   cada jogo recebe a sua ronda.
 * - A mão-de-casa alterna por ronda para equilibrar casa/fora.
 * - Se `duasMaos` for `true`, a segunda volta duplica cada jogo com as equipas
 *   invertidas e a ronda deslocada pelo nº de rondas da primeira volta
 *   (`ronda + (N-1)` para N par).
 */
export function gerarLiga(equipas: EquipaQuadro[], duasMaos: boolean): JogoGerado[] {
  const nomes = equipas.map((e) => e.nome);
  if (nomes.length < 2) return [];

  const slots: Slot[] = [...nomes];
  if (slots.length % 2 !== 0) slots.push(FOLGA);

  const total = slots.length;
  const rondas = total - 1;
  const metade = total / 2;

  const jogos: JogoGerado[] = [];
  const arranjo: Slot[] = [...slots];

  for (let r = 0; r < rondas; r++) {
    for (let i = 0; i < metade; i++) {
      const a = arranjo[i];
      const b = arranjo[total - 1 - i];
      if (a === FOLGA || b === FOLGA) continue;
      // Alterna a mão-de-casa por paridade de ronda (justiça casa/fora).
      const [casa, fora] = r % 2 === 0 ? [a, b] : [b, a];
      jogos.push({ equipaCasa: casa, equipaFora: fora, ronda: r + 1, dataHora: null });
    }
    // Rotação do círculo: fixa o primeiro slot, roda os restantes.
    const [fixo, ...resto] = arranjo;
    const ultimo = resto.pop() as Slot;
    arranjo.splice(0, arranjo.length, fixo, ultimo, ...resto);
  }

  if (duasMaos) {
    const primeiraVolta = [...jogos];
    for (const j of primeiraVolta) {
      jogos.push({
        equipaCasa: j.equipaFora,
        equipaFora: j.equipaCasa,
        ronda: j.ronda + rondas,
        dataHora: null,
      });
    }
  }

  return jogos;
}

/**
 * Emparelhamento inicial de um quadro eliminatório (torneio/taça).
 *
 * Ordena as equipas por `posicao` (as sem posição vão para o fim) e emparelha
 * 1 vs N, 2 vs N-1, etc. — todos na ronda 1. Não gera rondas seguintes (essas
 * dependem dos resultados). Com nº ímpar, a equipa do meio fica isenta (bye).
 */
export function gerarBracket(equipas: EquipaQuadro[]): JogoGerado[] {
  const ordenadas = [...equipas].sort(
    (a, b) => (a.posicao ?? Number.MAX_SAFE_INTEGER) - (b.posicao ?? Number.MAX_SAFE_INTEGER),
  );
  const nomes = ordenadas.map((e) => e.nome);

  const jogos: JogoGerado[] = [];
  let i = 0;
  let j = nomes.length - 1;
  while (i < j) {
    jogos.push({ equipaCasa: nomes[i], equipaFora: nomes[j], ronda: 1, dataHora: null });
    i++;
    j--;
  }
  return jogos;
}
