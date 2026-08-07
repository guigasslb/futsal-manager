// Apoio de cliente ao gerador de comunicações (bíblia §3.9, §8.12).
// Módulo PURO e seguro no browser (sem prisma/auth/next) — complementa
// `lib/comunicacao-utils.ts` com o que só interessa à UI: rótulos dos
// placeholders e a construção do deep link do WhatsApp.
//
// A app NÃO envia mensagens: gera texto e entrega-o ao WhatsApp através de
// um link `https://api.whatsapp.com/send?text=…`, que abre a conversa com o
// texto pré-preenchido para o utilizador escolher o destinatário.

import type { TipoComunicacaoValor } from "@/lib/schemas/comunicacao";

/** Endpoint público do WhatsApp que funciona em web, Android e iOS. */
export const BASE_LINK_WHATSAPP = "https://api.whatsapp.com/send";

/** Deep link do WhatsApp com o texto pré-preenchido (a abrir em nova janela). */
export function linkWhatsApp(texto: string): string {
  return `${BASE_LINK_WHATSAPP}?text=${encodeURIComponent(texto)}`;
}

// ─────────────────────────────────────────────
// Rótulos dos placeholders (pt-PT)
// ─────────────────────────────────────────────

/** Rótulo legível de cada placeholder documentado na bíblia (§3.9). */
export const LABEL_PLACEHOLDER: Readonly<Record<string, string>> = {
  nomeEquipa: "Nome da equipa",
  nomeTreinador: "Nome do treinador",
  diaSemana: "Dia da semana",
  data: "Data",
  hora: "Hora",
  local: "Local",
  listaConvocados: "Lista de convocados",
  prazoConfirmacao: "Prazo de confirmação",
  tipoCancelamento: "O que foi cancelado",
  tipoEvento: "Tipo de evento",
  motivo: "Motivo",
  horaAnterior: "Hora anterior",
  horaNova: "Hora nova",
  localAnterior: "Local anterior",
  localNovo: "Local novo",
  indicacoesAcesso: "Indicações de acesso",
  competicao: "Competição",
  adversario: "Adversário",
  equipaCasa: "Equipa da casa",
  golosCasa: "Golos da casa",
  golosFora: "Golos de fora",
  equipaFora: "Equipa de fora",
  resultado: "Resultado",
  marcadores: "Marcadores",
  assistencias: "Assistências",
  comentarioTreinador: "Comentário do treinador",
  assunto: "Assunto",
  mensagem: "Mensagem",
  prazoResposta: "Prazo de resposta",
  mesAno: "Mês e ano",
  listaEventos: "Lista de eventos",
  dataActualizacao: "Data de atualização",
};

/** Rótulo do placeholder; para chaves novas (templates personalizados) devolve a própria chave. */
export function rotuloPlaceholder(chave: string): string {
  return LABEL_PLACEHOLDER[chave] ?? chave;
}

/** Sugestão de preenchimento para os campos menos óbvios. */
export const DICA_PLACEHOLDER: Readonly<Record<string, string>> = {
  tipoCancelamento: "ex.: treino",
  tipoEvento: "ex.: jogo",
  motivo: "ex.: pavilhão indisponível",
  prazoResposta: "ex.: responder até sexta-feira",
  indicacoesAcesso: "ex.: entrada pela porta lateral",
};

/** Placeholders cujo valor é habitualmente multilinha (mostrados em textarea). */
const MULTILINHA: ReadonlySet<string> = new Set([
  "listaConvocados",
  "listaEventos",
  "mensagem",
  "comentarioTreinador",
  "indicacoesAcesso",
]);

/** O campo deste placeholder deve ser uma caixa de texto multilinha? */
export function placeholderMultilinha(chave: string): boolean {
  return MULTILINHA.has(chave);
}

// ─────────────────────────────────────────────
// Tipos com contexto obtido do servidor
// ─────────────────────────────────────────────

/** Estes tipos preenchem-se a partir de um jogo (`obterContexto*`). */
export function tipoUsaJogo(
  tipo: TipoComunicacaoValor,
): tipo is "CONVOCATORIA" | "RESULTADO" {
  return tipo === "CONVOCATORIA" || tipo === "RESULTADO";
}

/** O calendário mensal é gerado inteiramente no servidor (`gerarCalendarioTexto`). */
export function tipoUsaCalendario(
  tipo: TipoComunicacaoValor,
): tipo is "CALENDARIO_MENSAL" {
  return tipo === "CALENDARIO_MENSAL";
}

/** Meses em pt-PT, indexados de 0 (Janeiro) a 11 (Dezembro). */
export const MESES_PT = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
] as const;

// ─────────────────────────────────────────────
// Pré-visualização de um template
// ─────────────────────────────────────────────

/** Primeiras `n` linhas não vazias de um template (para os cartões da lista). */
export function primeirasLinhas(template: string, n = 3): string {
  return template
    .split("\n")
    .filter((linha) => linha.trim() !== "")
    .slice(0, n)
    .join("\n");
}
