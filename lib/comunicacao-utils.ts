// Utilitários puros do gerador de comunicações (bíblia §3.9, §8.12).
// Módulo PURO (sem imports de prisma/auth/next) — partilhado por Server Actions e testes.
//
// A app NÃO é canal de comunicação: gera texto formatado para o utilizador
// copiar/partilhar no WhatsApp. O deep link (`https://api.whatsapp.com/send?text=…`,
// link universal) é construído no cliente, não aqui.

/** Fuso usado em toda a formatação de datas das comunicações. */
export const FUSO_HORARIO = "Europe/Lisbon";

/** Hora-limite por defeito para confirmar presença numa convocatória. */
export const HORA_LIMITE_CONFIRMACAO = "20:00";

/** Texto usado quando um evento não tem local definido. */
export const LOCAL_POR_DEFINIR = "A definir";

/** Texto usado quando uma lista (marcadores, assistências, eventos) está vazia. */
export const SEM_REGISTOS = "—";

// ─────────────────────────────────────────────
// Substituição de placeholders
// ─────────────────────────────────────────────

const PADRAO_PLACEHOLDER = /\{\{(\w+)\}\}/g;

/**
 * Substitui os placeholders `{{chave}}` do template pelos valores do contexto.
 * Placeholders sem valor no contexto são removidos (bíblia §3.9).
 *
 * Normalização final: as linhas em branco deixadas por placeholders removidos
 * são colapsadas (no máximo uma linha em branco seguida) e o texto é aparado,
 * para o resultado ficar legível no WhatsApp.
 */
export function substituirPlaceholders(
  template: string,
  contexto: Record<string, string>,
): string {
  const substituido = template.replace(PADRAO_PLACEHOLDER, (_, chave: string) =>
    Object.prototype.hasOwnProperty.call(contexto, chave) ? contexto[chave] : "",
  );
  return substituido
    .split("\n")
    .map((linha) => linha.trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Lista dos placeholders `{{chave}}` presentes num template (sem duplicados, pela ordem de ocorrência). */
export function placeholdersDoTemplate(template: string): string[] {
  const encontrados: string[] = [];
  for (const m of template.matchAll(PADRAO_PLACEHOLDER)) {
    const chave = m[1];
    if (!encontrados.includes(chave)) encontrados.push(chave);
  }
  return encontrados;
}

// ─────────────────────────────────────────────
// Formatação de datas (pt-PT, Europe/Lisbon)
// ─────────────────────────────────────────────

function formatar(data: Date, opcoes: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("pt-PT", { timeZone: FUSO_HORARIO, ...opcoes }).format(data);
}

/** "12/09/2026" */
export function formatarData(data: Date): string {
  return formatar(data, { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** "12/09" */
export function formatarDataCurta(data: Date): string {
  return formatar(data, { day: "2-digit", month: "2-digit" });
}

/** "19:30" */
export function formatarHora(data: Date): string {
  return formatar(data, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
}

/** "sexta-feira" */
export function formatarDiaSemana(data: Date): string {
  return formatar(data, { weekday: "long" });
}

/** "Setembro de 2026" (mês 1–12). */
export function formatarMesAno(mes: number, ano: number): string {
  // Dia 15 evita qualquer deslocação de mês por causa do fuso.
  const referencia = new Date(Date.UTC(ano, mes - 1, 15, 12, 0, 0));
  const texto = formatar(referencia, { month: "long", year: "numeric" });
  return texto.charAt(0).toLocaleUpperCase("pt-PT") + texto.slice(1);
}

// ─────────────────────────────────────────────
// Listas formatadas
// ─────────────────────────────────────────────

/** "1. João Silva\n2. Pedro Santos" */
export function formatarListaConvocados(nomes: readonly string[]): string {
  if (nomes.length === 0) return SEM_REGISTOS;
  return nomes.map((nome, i) => `${i + 1}. ${nome}`).join("\n");
}

/** "João Silva (2), Pedro Santos (1)" — omite quem tem contagem <= 0. */
export function formatarContagemPorAtleta(
  entradas: readonly { nome: string; total: number }[],
): string {
  const relevantes = entradas
    .filter((e) => e.total > 0)
    .sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome, "pt-PT"));
  if (relevantes.length === 0) return SEM_REGISTOS;
  return relevantes.map((e) => `${e.nome} (${e.total})`).join(", ");
}

export type EventoCalendario =
  | { tipo: "TREINO"; data: Date; local: string | null }
  | { tipo: "JOGO"; data: Date; adversario: string };

/**
 * Lista de eventos do mês, uma linha por evento, ordenada por data:
 *   "📅 12/09 — Treino (19:30, Pavilhão Municipal)"
 *   "⚽ 14/09 — Jogo vs Sporting (17:00)"
 */
export function formatarListaEventos(eventos: readonly EventoCalendario[]): string {
  if (eventos.length === 0) return "Sem eventos agendados para este mês.";

  return [...eventos]
    .sort((a, b) => a.data.getTime() - b.data.getTime())
    .map((e) => {
      const dia = formatarDataCurta(e.data);
      const hora = formatarHora(e.data);
      if (e.tipo === "TREINO") {
        const detalhe = e.local && e.local.trim() ? `${hora}, ${e.local.trim()}` : hora;
        return `📅 ${dia} — Treino (${detalhe})`;
      }
      return `⚽ ${dia} — Jogo vs ${e.adversario} (${hora})`;
    })
    .join("\n");
}
