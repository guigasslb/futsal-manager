/**
 * §8.8.1 — Geração de datas do plano semanal (helper puro, sem I/O).
 *
 * Dado um intervalo de datas e uma lista de dias da semana (ISO 1-7), devolve
 * todas as datas no intervalo cujo dia da semana está na lista. É a base da
 * geração de sessões (`criarPlanoSemanal`) e da pré-visualização
 * (`preverPlanoSemanal`). Sendo pura, é testável isoladamente.
 *
 * Nunca devolve datas anteriores a `hoje` (o plano nunca gera treinos no
 * passado — §8.8.1). `hoje` é injetável para testes deterministas; por defeito
 * usa o momento atual.
 */

/** Dia da semana ISO-8601 (1=segunda … 7=domingo) de uma data JS. */
export function diaSemanaISO(d: Date): number {
  const dow = d.getDay(); // 0=domingo … 6=sábado
  return dow === 0 ? 7 : dow;
}

/** Cópia da data ao início do dia (00:00:00.000, hora local). */
export function inicioDoDia(d: Date): Date {
  const dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
  return dt;
}

/** Chave de calendário `YYYY-MM-DD` (hora local) para deduplicação por dia. */
export function chaveDia(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dia}`;
}

/** Combina o dia de `data` com a hora "HH:MM" (hora local). */
export function combinarDataHora(data: Date, hora: string): Date {
  const [h, m] = hora.split(":").map(Number);
  const dt = new Date(data);
  dt.setHours(h, m, 0, 0);
  return dt;
}

/** "HH:MM" (hora local) de uma data. */
export function horaDeData(d: Date): string {
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

/** Minutos entre duas horas "HH:MM" (fim − início). */
export function duracaoEntreHoras(inicio: string, fim: string): number {
  const [hi, mi] = inicio.split(":").map(Number);
  const [hf, mf] = fim.split(":").map(Number);
  return hf * 60 + mf - (hi * 60 + mi);
}

/** "HH:MM" resultante de somar `minutos` a uma hora "HH:MM" (limitado a 23:59). */
export function somarMinutos(inicio: string, minutos: number): string {
  const [hi, mi] = inicio.split(":").map(Number);
  const total = Math.min(hi * 60 + mi + minutos, 23 * 60 + 59);
  const h = String(Math.floor(total / 60)).padStart(2, "0");
  const m = String(total % 60).padStart(2, "0");
  return `${h}:${m}`;
}

/**
 * Todas as datas (ao início do dia) no intervalo [dataInicio, dataFim] cujo dia
 * da semana ISO está em `diasSemana`, excluindo datas anteriores a `hoje`.
 *
 * @param dataInicio Início do intervalo (inclusive).
 * @param dataFim    Fim do intervalo (inclusive).
 * @param diasSemana Dias ISO a incluir (1=segunda … 7=domingo).
 * @param hoje       Momento de referência para o corte do passado (default: agora).
 */
export function gerarDatasDePlano(
  dataInicio: Date,
  dataFim: Date,
  diasSemana: number[],
  hoje: Date = new Date(),
): Date[] {
  const dias = new Set(diasSemana);
  if (dias.size === 0) return [];

  const fim = inicioDoDia(dataFim);
  const corte = inicioDoDia(hoje);

  // Arranca no maior de (dataInicio, hoje): nunca gera no passado.
  const inicioIntervalo = inicioDoDia(dataInicio);
  let cursor = inicioIntervalo.getTime() < corte.getTime() ? corte : inicioIntervalo;

  const datas: Date[] = [];
  while (cursor.getTime() <= fim.getTime()) {
    if (dias.has(diaSemanaISO(cursor))) {
      datas.push(new Date(cursor));
    }
    cursor = new Date(cursor);
    cursor.setDate(cursor.getDate() + 1);
  }
  return datas;
}
