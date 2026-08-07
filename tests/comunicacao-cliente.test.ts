import { describe, it, expect } from "vitest";

import {
  BASE_LINK_WHATSAPP,
  DICA_PLACEHOLDER,
  LABEL_PLACEHOLDER,
  MESES_PT,
  linkWhatsApp,
  placeholderMultilinha,
  primeirasLinhas,
  rotuloPlaceholder,
  tipoUsaCalendario,
  tipoUsaJogo,
} from "@/lib/comunicacao-cliente";
import { MODELOS_COMUNICACAO_SEED } from "@/lib/comunicacao-modelos";
import { formatarMesAno, placeholdersDoTemplate } from "@/lib/comunicacao-utils";
import { TIPOS_COMUNICACAO } from "@/lib/schemas/comunicacao";

// ─────────────────────────────────────────────
// Deep link do WhatsApp
// ─────────────────────────────────────────────

describe("linkWhatsApp", () => {
  it("aponta para o endpoint público do WhatsApp", () => {
    expect(linkWhatsApp("olá").startsWith(`${BASE_LINK_WHATSAPP}?text=`)).toBe(true);
  });

  it("codifica o texto para o query string", () => {
    const link = linkWhatsApp("*Jogo* & treino\n#1");
    expect(link).toBe(
      `${BASE_LINK_WHATSAPP}?text=${encodeURIComponent("*Jogo* & treino\n#1")}`,
    );
    expect(link).not.toContain("\n");
    expect(link).not.toContain(" ");
  });

  it("mantém o texto intacto ao descodificar (ida e volta)", () => {
    const texto =
      "🏃 *CONVOCATÓRIA — Sub-13*\n📅 sexta-feira, 12/09/2026 às 19:30\n1. João Silva";
    const param = new URL(linkWhatsApp(texto)).searchParams.get("text");
    expect(param).toBe(texto);
  });

  it("codifica um texto vazio sem partir o link", () => {
    expect(linkWhatsApp("")).toBe(`${BASE_LINK_WHATSAPP}?text=`);
  });
});

// ─────────────────────────────────────────────
// Rótulos dos placeholders
// ─────────────────────────────────────────────

describe("rotuloPlaceholder", () => {
  it("devolve o rótulo em português dos campos conhecidos", () => {
    expect(rotuloPlaceholder("nomeEquipa")).toBe("Nome da equipa");
    expect(rotuloPlaceholder("listaConvocados")).toBe("Lista de convocados");
  });

  it("devolve a própria chave para campos de templates personalizados", () => {
    expect(rotuloPlaceholder("campoInventado")).toBe("campoInventado");
  });
});

describe("cobertura dos rótulos", () => {
  it("todos os placeholders dos modelos de arranque têm rótulo", () => {
    const semRotulo = MODELOS_COMUNICACAO_SEED.flatMap((m) =>
      placeholdersDoTemplate(m.template).filter(
        (chave) => LABEL_PLACEHOLDER[chave] === undefined,
      ),
    );
    expect(semRotulo).toEqual([]);
  });

  it("os placeholders de contexto de jogo (resultado) têm rótulo", () => {
    // `adversario` e `resultado` são devolvidos por obterContextoResultado
    // mesmo não estando no template de arranque.
    expect(LABEL_PLACEHOLDER.adversario).toBeDefined();
    expect(LABEL_PLACEHOLDER.resultado).toBeDefined();
  });

  it("as dicas só existem para campos com rótulo", () => {
    for (const chave of Object.keys(DICA_PLACEHOLDER)) {
      expect(LABEL_PLACEHOLDER[chave]).toBeDefined();
    }
  });
});

// ─────────────────────────────────────────────
// Tipo de campo
// ─────────────────────────────────────────────

describe("placeholderMultilinha", () => {
  it("marca as listas e os textos longos como multilinha", () => {
    expect(placeholderMultilinha("listaConvocados")).toBe(true);
    expect(placeholderMultilinha("listaEventos")).toBe(true);
    expect(placeholderMultilinha("mensagem")).toBe(true);
    expect(placeholderMultilinha("comentarioTreinador")).toBe(true);
  });

  it("deixa os campos curtos em linha única", () => {
    expect(placeholderMultilinha("hora")).toBe(false);
    expect(placeholderMultilinha("nomeEquipa")).toBe(false);
    expect(placeholderMultilinha("desconhecido")).toBe(false);
  });
});

// ─────────────────────────────────────────────
// Tipos com contexto do servidor
// ─────────────────────────────────────────────

describe("tipoUsaJogo / tipoUsaCalendario", () => {
  it("só convocatória e resultado partem de um jogo", () => {
    const comJogo = TIPOS_COMUNICACAO.filter(tipoUsaJogo);
    expect(comJogo).toEqual(["CONVOCATORIA", "RESULTADO"]);
  });

  it("só o calendário mensal é gerado inteiramente no servidor", () => {
    const calendario = TIPOS_COMUNICACAO.filter(tipoUsaCalendario);
    expect(calendario).toEqual(["CALENDARIO_MENSAL"]);
  });

  it("os dois grupos não se sobrepõem", () => {
    for (const tipo of TIPOS_COMUNICACAO) {
      expect(tipoUsaJogo(tipo) && tipoUsaCalendario(tipo)).toBe(false);
    }
  });
});

// ─────────────────────────────────────────────
// Meses
// ─────────────────────────────────────────────

describe("MESES_PT", () => {
  it("tem os 12 meses", () => {
    expect(MESES_PT).toHaveLength(12);
  });

  it("coincide com o mês usado pelo servidor em formatarMesAno", () => {
    MESES_PT.forEach((nome, i) => {
      expect(formatarMesAno(i + 1, 2026)).toBe(`${nome} de 2026`);
    });
  });
});

// ─────────────────────────────────────────────
// Pré-visualização curta
// ─────────────────────────────────────────────

describe("primeirasLinhas", () => {
  it("devolve as primeiras linhas não vazias", () => {
    const template = "Linha 1\n\nLinha 2\n\n\nLinha 3\nLinha 4";
    expect(primeirasLinhas(template)).toBe("Linha 1\nLinha 2\nLinha 3");
  });

  it("respeita o número de linhas pedido", () => {
    expect(primeirasLinhas("a\nb\nc\nd", 2)).toBe("a\nb");
  });

  it("lida com templates curtos ou vazios", () => {
    expect(primeirasLinhas("única")).toBe("única");
    expect(primeirasLinhas("")).toBe("");
    expect(primeirasLinhas("\n\n\n")).toBe("");
  });
});
