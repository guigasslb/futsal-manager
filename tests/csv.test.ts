import { describe, it, expect } from "vitest";
import { paraCsv, juntarBlocosCsv, BOM_UTF8, type ColunaCsv } from "@/lib/utils/csv";

// F1.1 — serialização CSV pura (bíblia §8.15). Testa formato Excel PT-PT:
// BOM UTF-8, separador ";", escape RFC 4180, CRLF, ponto decimal, células vazias.

const COLS: ColunaCsv[] = [
  { chave: "nome", titulo: "Nome" },
  { chave: "golos", titulo: "Golos" },
];

describe("paraCsv — formato base", () => {
  it("começa com o BOM UTF-8 (Excel reconhece acentos)", () => {
    const csv = paraCsv([], COLS);
    expect(csv.startsWith(BOM_UTF8)).toBe(true);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
  });

  it("usa ';' como separador e '\\r\\n' como fim de linha", () => {
    const csv = paraCsv([{ nome: "João", golos: 3 }], COLS);
    const semBom = csv.slice(BOM_UTF8.length);
    expect(semBom).toBe("Nome;Golos\r\nJoão;3\r\n");
  });

  it("escreve a linha de cabeçalho com os títulos das colunas", () => {
    const csv = paraCsv([], COLS);
    expect(csv.slice(BOM_UTF8.length)).toBe("Nome;Golos\r\n");
  });

  it("preserva acentos e caracteres portugueses", () => {
    const csv = paraCsv([{ nome: "Sé António", golos: 1 }], [
      { chave: "nome", titulo: "Atleta" },
      { chave: "golos", titulo: "Golos" },
    ]);
    expect(csv).toContain("Sé António");
    expect(csv).toContain("Atleta;Golos");
  });
});

describe("paraCsv — valores nulos e vazios", () => {
  it("converte null e undefined em célula vazia", () => {
    const csv = paraCsv(
      [{ nome: null, golos: undefined }],
      COLS,
    );
    expect(csv.slice(BOM_UTF8.length)).toBe("Nome;Golos\r\n;\r\n");
  });

  it("trata uma chave em falta na linha como célula vazia", () => {
    const csv = paraCsv([{ nome: "Rui" }], COLS);
    expect(csv.slice(BOM_UTF8.length)).toBe("Nome;Golos\r\nRui;\r\n");
  });
});

describe("paraCsv — números com ponto decimal", () => {
  it("serializa números com ponto (não vírgula) para o Excel os ler como número", () => {
    const csv = paraCsv([{ nome: "Média", golos: 2.5 }], COLS);
    expect(csv).toContain("Média;2.5");
    expect(csv).not.toContain("2,5");
  });

  it("mantém inteiros sem casas decimais", () => {
    const csv = paraCsv([{ nome: "Total", golos: 1000 }], COLS);
    expect(csv).toContain("Total;1000");
  });
});

describe("paraCsv — escape RFC 4180", () => {
  it("envolve em aspas os campos que contêm o separador ';'", () => {
    const csv = paraCsv([{ nome: "Silva; Costa", golos: 0 }], COLS);
    expect(csv).toContain('"Silva; Costa";0');
  });

  it("duplica as aspas internas e envolve o campo em aspas", () => {
    const csv = paraCsv([{ nome: 'Ala "O Rápido"', golos: 0 }], COLS);
    expect(csv).toContain('"Ala ""O Rápido""";0');
  });

  it("envolve em aspas os campos com quebras de linha", () => {
    const csv = paraCsv([{ nome: "Linha1\nLinha2", golos: 0 }], COLS);
    expect(csv).toContain('"Linha1\nLinha2";0');
  });

  it("não envolve em aspas os campos simples", () => {
    const csv = paraCsv([{ nome: "Simples", golos: 0 }], COLS);
    expect(csv).toContain("Simples;0");
    expect(csv).not.toContain('"Simples"');
  });
});

describe("juntarBlocosCsv", () => {
  it("junta dois blocos mantendo o BOM só no primeiro", () => {
    const bloco1 = paraCsv([{ nome: "A", golos: 1 }], COLS);
    const bloco2 = paraCsv([{ indicador: "Total", valor: 1 }], [
      { chave: "indicador", titulo: "Indicador" },
      { chave: "valor", titulo: "Valor" },
    ]);
    const junto = juntarBlocosCsv(bloco1, bloco2);

    // Um único BOM, no início.
    expect(junto.charCodeAt(0)).toBe(0xfeff);
    expect(junto.slice(1).includes(BOM_UTF8)).toBe(false);
    // Ambos os cabeçalhos presentes, separados por uma linha em branco.
    expect(junto).toContain("Nome;Golos");
    expect(junto).toContain("Indicador;Valor");
    expect(junto).toContain("\r\n\r\n");
  });

  it("ignora blocos vazios", () => {
    const bloco1 = paraCsv([{ nome: "A", golos: 1 }], COLS);
    const junto = juntarBlocosCsv(bloco1, "");
    expect(junto).toBe(bloco1);
  });
});

describe("paraCsv — escape RFC 4180 (casos combinados)", () => {
  it("trata campo com '\"' e ';' simultâneos: duplica aspas e envolve o campo", () => {
    // Caso combinado: RFC 4180 exige aspas porque há ';', E as aspas internas
    // têm de ser duplicadas. O resultado correto é: "Ala ""O Rápido""; Sub-13"
    const csv = paraCsv([{ nome: 'Ala "O Rápido"; Sub-13', golos: 0 }], COLS);
    expect(csv).toContain('"Ala ""O Rápido""; Sub-13";0');
  });

  it("envolve em aspas os campos com '\\r' isolado (CR sem LF)", () => {
    const csv = paraCsv([{ nome: "Linha1\rLinha2", golos: 0 }], COLS);
    expect(csv).toContain('"Linha1\rLinha2";0');
  });

  it("campos que começam com '=' não são transformados (RFC 4180 puro; sem proteção de injeção de fórmula)", () => {
    // Documenta o comportamento atual: a função implementa RFC 4180 puro e
    // NÃO sanitiza fórmulas Excel (=, +, -, @). O valor sai tal como está.
    // Se a política de segurança mudar, este teste deve ser atualizado.
    const csv = paraCsv([{ nome: "=SOMA(A1:A10)", golos: 0 }], COLS);
    expect(csv).toContain("=SOMA(A1:A10);0");
    // Sem aspas: o campo não contém ';', '"', '\n', nem '\r'.
    expect(csv).not.toContain('"=SOMA(A1:A10)"');
  });
});
