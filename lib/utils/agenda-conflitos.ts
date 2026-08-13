// F3.1 (§8.16) — Deteção de conflitos de pavilhão na agenda.
//
// Helper puro e testável (sem I/O). `Sessao.local` e `Jogo.local` são texto
// livre; esta unidade normaliza o local e deteta sobreposição temporal entre
// eventos no mesmo pavilhão. A deteção é NÃO-BLOQUEANTE — só avisa, nunca impede
// criar/editar. Mesma filosofia de `lib/utils/cargaTreino.ts`.

/**
 * Duração assumida (minutos) quando um evento não tem `duracaoMin` definido.
 * Aplica-se sobretudo a jogos (que não têm campo de duração no schema) e a
 * treinos sem duração preenchida.
 */
export const DURACAO_PADRAO_MIN = 90;

/**
 * Locais que são apenas marcadores de posição (texto livre à espera de definição).
 * Comparados na forma já normalizada por `normalizarLocal`. Um evento cujo local
 * seja um destes nunca gera conflito — dois "A definir" não são o mesmo pavilhão.
 */
export const LOCAIS_PLACEHOLDER = [
  "a definir",
  "tbd",
  "a confirmar",
  "por confirmar",
  "por definir",
];

export interface ConflitoAgenda {
  tipo: "TREINO" | "JOGO";
  escalaoNome: string;
  data: Date;
  local: string;
}

/**
 * Normaliza um local para comparação: trim + lowercase + colapso de múltiplos
 * espaços. Assim "Pavilhão A" ≡ "  pavilhao   A " → "pavilhão a".
 * (Nota: não remove acentos — "Pavilhão" e "Pavilhao" são locais distintos.)
 */
export function normalizarLocal(local: string): string {
  return local.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Verifica sobreposição da janela `[data, data + duracao)` de `a` com a de `b`.
 * `duracaoMin` a null assume `DURACAO_PADRAO_MIN`. Janelas meramente adjacentes
 * (fim de uma = início da outra) NÃO se sobrepõem (intervalo semiaberto).
 */
export function temSobreposicao(
  a: { data: Date; duracaoMin: number | null },
  b: { data: Date; duracaoMin: number | null },
): boolean {
  const inicioA = a.data.getTime();
  const fimA = inicioA + (a.duracaoMin ?? DURACAO_PADRAO_MIN) * 60_000;
  const inicioB = b.data.getTime();
  const fimB = inicioB + (b.duracaoMin ?? DURACAO_PADRAO_MIN) * 60_000;
  // [inicio, fim) semiaberto: sobrepõem-se sse inicioA < fimB && inicioB < fimA.
  return inicioA < fimB && inicioB < fimA;
}

/**
 * Deteta conflitos de pavilhão para um novo evento face aos eventos existentes
 * do clube (todos os escalões). Um conflito é: mesmo local normalizado + janelas
 * temporais sobrepostas.
 *
 * - `local` vazio/null (no novo evento ou no existente) → nunca conflito
 *   (texto livre pode ser "A definir").
 * - `excluirId` exclui o próprio evento em edição (não colide consigo mesmo).
 */
export function detetarConflitos(
  novoEvento: { data: Date; duracaoMin: number | null; local: string | null },
  eventosExistentes: {
    id: string;
    data: Date;
    duracaoMin: number | null;
    local: string | null;
    tipo: "TREINO" | "JOGO";
    escalaoNome: string;
  }[],
  excluirId?: string,
): ConflitoAgenda[] {
  if (!novoEvento.local) return [];
  const localNovo = normalizarLocal(novoEvento.local);
  if (localNovo === "") return [];
  // Placeholder (ex.: "A definir") não é um pavilhão concreto → nunca conflita.
  if (LOCAIS_PLACEHOLDER.includes(localNovo)) return [];

  const conflitos: ConflitoAgenda[] = [];
  for (const evento of eventosExistentes) {
    if (excluirId && evento.id === excluirId) continue;
    if (!evento.local) continue;
    const localEvento = normalizarLocal(evento.local);
    // Evento existente com local placeholder também não conflita com ninguém.
    if (LOCAIS_PLACEHOLDER.includes(localEvento)) continue;
    if (localEvento !== localNovo) continue;
    if (!temSobreposicao(novoEvento, evento)) continue;

    conflitos.push({
      tipo: evento.tipo,
      escalaoNome: evento.escalaoNome,
      data: evento.data,
      local: evento.local,
    });
  }
  return conflitos;
}
