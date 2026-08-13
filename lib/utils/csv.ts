// Serialização CSV pura e testável (F1.1 — bíblia §8.15).
//
// Vive fora de `lib/actions/` porque é síncrona e sem I/O — para ser reutilizável
// e testável sem BD (mesma filosofia de `lib/utils/cargaTreino.ts`). O formato é
// pensado para o Excel PT-PT:
//   - BOM UTF-8 no início (o Excel reconhece os acentos);
//   - separador ";" (convenção pt-PT em vez de ",");
//   - escape RFC 4180 (aspas, separador e quebras de linha);
//   - terminador de linha CRLF ("\r\n", conforme RFC 4180);
//   - números com ponto decimal (nunca vírgula), para o Excel os ler como número.

/** Marca de ordem de bytes UTF-8 — força o Excel a interpretar o ficheiro como UTF-8. */
export const BOM_UTF8 = "﻿";

const SEPARADOR = ";";
const FIM_LINHA = "\r\n";

/**
 * Caracteres que, no início de uma célula, o Excel/LibreOffice interpretam como
 * fórmula (CSV/formula injection). Prefixar com apóstrofo neutraliza-os,
 * forçando o conteúdo a ser tratado como texto.
 */
export const PREFIXOS_FORMULA = ["=", "+", "-", "@", "\t", "\r"];

/** Definição de uma coluna: a chave a ler de cada linha e o título do cabeçalho. */
export interface ColunaCsv {
  chave: string;
  titulo: string;
}

/**
 * Serializa uma célula individual com escape RFC 4180.
 *  - `null`/`undefined` → "" (célula vazia);
 *  - números → `String(n)`, que usa sempre ponto decimal (nunca vírgula);
 *  - campos com `;`, `"`, `\n` ou `\r` são envolvidos em aspas, com as aspas
 *    internas duplicadas.
 */
function serializarCelula(valor: unknown): string {
  if (valor === null || valor === undefined) return "";

  // `String()` de um número usa sempre ponto decimal — ao contrário de
  // `toLocaleString("pt-PT")`, que usaria vírgula e o Excel leria como texto.
  let texto = String(valor);

  // Neutraliza CSV/formula injection ANTES do escape RFC 4180: se a célula
  // começa por um carácter de fórmula, prefixa com apóstrofo (o Excel trata-o
  // como texto). O apóstrofo fica dentro do campo, incluído nas aspas se estas
  // forem necessárias a seguir.
  if (PREFIXOS_FORMULA.some((p) => texto.startsWith(p))) {
    texto = "'" + texto;
  }

  const precisaAspas =
    texto.includes(SEPARADOR) ||
    texto.includes('"') ||
    texto.includes("\n") ||
    texto.includes("\r");

  if (!precisaAspas) return texto;
  return `"${texto.replace(/"/g, '""')}"`;
}

/**
 * Converte um conjunto de linhas num CSV pronto para o Excel PT-PT.
 * A primeira linha é o cabeçalho (títulos das colunas); cada linha seguinte lê
 * `linha[coluna.chave]` na ordem das colunas. Devolve a string completa
 * (com BOM UTF-8 e terminadores CRLF). Função pura, sem I/O.
 */
export function paraCsv(
  linhas: Record<string, unknown>[],
  colunas: ColunaCsv[],
): string {
  const cabecalho = colunas.map((c) => serializarCelula(c.titulo)).join(SEPARADOR);
  const corpo = linhas.map((linha) =>
    colunas.map((c) => serializarCelula(linha[c.chave])).join(SEPARADOR),
  );
  return BOM_UTF8 + [cabecalho, ...corpo].join(FIM_LINHA) + FIM_LINHA;
}

/**
 * Junta vários blocos CSV (cada um já produzido por `paraCsv`) num único
 * ficheiro, com uma linha em branco a separar. O BOM só é mantido no primeiro
 * bloco (é removido dos seguintes para não aparecer no meio do ficheiro).
 * Útil quando um export tem uma tabela + um resumo (ex.: analíticos).
 */
export function juntarBlocosCsv(...blocos: string[]): string {
  return blocos
    .filter((b) => b.length > 0)
    .map((b, i) => (i === 0 ? b : b.startsWith(BOM_UTF8) ? b.slice(BOM_UTF8.length) : b))
    .join(FIM_LINHA);
}
