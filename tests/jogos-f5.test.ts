import { describe, it, expect } from "vitest";
import { BlocoTempo, Posicao, TipoEventoJogo } from "@prisma/client";
import {
  registarEventoJogoSchema,
  planoTaticoSchema,
  convocatoriaPrevistaSchema,
  estatisticaSchema,
  LABEL_BLOCO_TEMPO,
  LABEL_TIPO_EVENTO,
  LABEL_EVENTO,
} from "@/lib/schemas/jogo";
import { observacaoAdversarioSchema } from "@/lib/schemas/competicao";

const CUID = "ckv9v0z1w0000abcd1234efgh";
const CUID2 = "ckv9v0z1w0001abcd1234efgh";

describe("registarEventoJogoSchema (F5 — evento ao vivo)", () => {
  it("aceita um evento mínimo válido com jogoId", () => {
    const r = registarEventoJogoSchema.safeParse({
      jogoId: CUID,
      parte: 1,
      tipo: "GOLO",
    });
    expect(r.success).toBe(true);
  });

  it("aceita bloco de tempo (substituição)", () => {
    const r = registarEventoJogoSchema.safeParse({
      jogoId: CUID,
      parte: 2,
      tipo: "SUBSTITUICAO",
      bloco: "BLOCO_10MIN",
      atletaId: CUID,
      atletaSecundarioId: CUID2,
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.bloco).toBe(BlocoTempo.BLOCO_10MIN);
  });

  it("rejeita sem jogoId", () => {
    const r = registarEventoJogoSchema.safeParse({ parte: 1, tipo: "GOLO" });
    expect(r.success).toBe(false);
  });

  it("rejeita parte fora de 1..2", () => {
    const r = registarEventoJogoSchema.safeParse({ jogoId: CUID, parte: 3, tipo: "GOLO" });
    expect(r.success).toBe(false);
  });

  it("rejeita tipo de evento inválido", () => {
    const r = registarEventoJogoSchema.safeParse({ jogoId: CUID, parte: 1, tipo: "PENALTI" });
    expect(r.success).toBe(false);
  });

  it("rejeita bloco de tempo inválido", () => {
    const r = registarEventoJogoSchema.safeParse({
      jogoId: CUID,
      parte: 1,
      tipo: "GOLO",
      bloco: "BLOCO_15MIN",
    });
    expect(r.success).toBe(false);
  });

  it("aceita tipo GOLO explicitamente", () => {
    const r = registarEventoJogoSchema.safeParse({
      jogoId: CUID,
      parte: 1,
      tipo: "GOLO",
      atletaId: CUID,
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.tipo).toBe(TipoEventoJogo.GOLO);
  });

  it("aceita minuto no limite superior (120)", () => {
    const r = registarEventoJogoSchema.safeParse({
      jogoId: CUID,
      parte: 2,
      tipo: "GOLO",
      minuto: 120,
    });
    expect(r.success).toBe(true);
  });

  it("rejeita minuto acima do máximo (121)", () => {
    const r = registarEventoJogoSchema.safeParse({
      jogoId: CUID,
      parte: 2,
      tipo: "GOLO",
      minuto: 121,
    });
    expect(r.success).toBe(false);
  });

  it("aceita evento sem atleta nem bloco (ambos opcionais)", () => {
    const r = registarEventoJogoSchema.safeParse({
      jogoId: CUID,
      parte: 1,
      tipo: "TIMEOUT",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.atletaId ?? null).toBeNull();
      expect(r.data.bloco ?? null).toBeNull();
    }
  });
});

describe("planoTaticoSchema (F5 — plano de dia de jogo)", () => {
  it("aceita entrada mínima só com convocadoId", () => {
    const r = convocatoriaPrevistaSchema.safeParse({ convocadoId: CUID });
    expect(r.success).toBe(true);
  });

  it("aceita posição e titularidade previstas", () => {
    const r = planoTaticoSchema.safeParse([
      { convocadoId: CUID, posicaoPrevista: "PIVO", titularPrevisto: true },
      { convocadoId: CUID2, posicaoPrevista: "GUARDA_REDES", titularPrevisto: false },
    ]);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data[0].posicaoPrevista).toBe(Posicao.PIVO);
      expect(r.data[0].titularPrevisto).toBe(true);
    }
  });

  it("aceita array vazio", () => {
    const r = planoTaticoSchema.safeParse([]);
    expect(r.success).toBe(true);
  });

  it("rejeita posição prevista inválida", () => {
    const r = convocatoriaPrevistaSchema.safeParse({
      convocadoId: CUID,
      posicaoPrevista: "LIBERO",
    });
    expect(r.success).toBe(false);
  });

  it("rejeita convocadoId que não é cuid", () => {
    const r = convocatoriaPrevistaSchema.safeParse({ convocadoId: "abc" });
    expect(r.success).toBe(false);
  });

  it("rejeita posição inválida dentro do array (planoTaticoSchema)", () => {
    const r = planoTaticoSchema.safeParse([
      { convocadoId: CUID, posicaoPrevista: "PIVO", titularPrevisto: true },
      { convocadoId: CUID2, posicaoPrevista: "LIBERO" },
    ]);
    expect(r.success).toBe(false);
  });

  it("aceita titularPrevisto boolean", () => {
    const r = convocatoriaPrevistaSchema.safeParse({
      convocadoId: CUID,
      titularPrevisto: false,
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.titularPrevisto).toBe(false);
  });

  it("rejeita titularPrevisto não-boolean", () => {
    const r = convocatoriaPrevistaSchema.safeParse({
      convocadoId: CUID,
      titularPrevisto: "sim",
    });
    expect(r.success).toBe(false);
  });
});

describe("estatisticaSchema (F5 — blocoTempo)", () => {
  it("aceita estatística com blocoTempo", () => {
    const r = estatisticaSchema.safeParse({
      atletaId: CUID,
      utilizacao: "TITULAR",
      blocoTempo: "JOGO_COMPLETO",
      golos: 1,
      assistencias: 0,
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.blocoTempo).toBe(BlocoTempo.JOGO_COMPLETO);
  });

  it("aceita estatística sem blocoTempo (opcional)", () => {
    const r = estatisticaSchema.safeParse({
      atletaId: CUID,
      utilizacao: "UTILIZADO",
      golos: 0,
      assistencias: 0,
    });
    expect(r.success).toBe(true);
  });

  it("rejeita blocoTempo inválido", () => {
    const r = estatisticaSchema.safeParse({
      atletaId: CUID,
      utilizacao: "TITULAR",
      blocoTempo: "MEIO_JOGO",
      golos: 0,
      assistencias: 0,
    });
    expect(r.success).toBe(false);
  });

  it("aceita blocoTempo NAO_JOGOU", () => {
    const r = estatisticaSchema.safeParse({
      atletaId: CUID,
      utilizacao: "NAO_UTILIZADO",
      blocoTempo: "NAO_JOGOU",
      golos: 0,
      assistencias: 0,
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.blocoTempo).toBe(BlocoTempo.NAO_JOGOU);
  });

  it("rejeita valor inválido (golos negativos)", () => {
    const r = estatisticaSchema.safeParse({
      atletaId: CUID,
      utilizacao: "TITULAR",
      blocoTempo: "JOGO_COMPLETO",
      golos: -1,
      assistencias: 0,
    });
    expect(r.success).toBe(false);
  });
});

describe("observacaoAdversarioSchema (F5 — jogoId opcional)", () => {
  it("aceita observação ligada a um jogo", () => {
    const r = observacaoAdversarioSchema.safeParse({ equipa: "SL Benfica", jogoId: CUID });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.jogoId).toBe(CUID);
  });

  it("aceita observação avulsa (sem jogoId)", () => {
    const r = observacaoAdversarioSchema.safeParse({ equipa: "Sporting CP" });
    expect(r.success).toBe(true);
  });

  it("rejeita jogoId que não é cuid", () => {
    const r = observacaoAdversarioSchema.safeParse({ equipa: "FC Porto", jogoId: "xyz" });
    expect(r.success).toBe(false);
  });

  it("aceita jogoId null (opcional)", () => {
    const r = observacaoAdversarioSchema.safeParse({ equipa: "Sporting CP", jogoId: null });
    expect(r.success).toBe(true);
  });
});

describe("labels F5", () => {
  it("LABEL_BLOCO_TEMPO cobre todos os valores do enum", () => {
    for (const v of Object.values(BlocoTempo)) {
      expect(LABEL_BLOCO_TEMPO[v]).toBeTruthy();
    }
  });

  it("LABEL_TIPO_EVENTO cobre todos os valores do enum", () => {
    for (const v of Object.values(TipoEventoJogo)) {
      expect(LABEL_TIPO_EVENTO[v]).toBeTruthy();
    }
  });

  it("LABEL_EVENTO é alias de LABEL_TIPO_EVENTO", () => {
    expect(LABEL_EVENTO).toBe(LABEL_TIPO_EVENTO);
  });
});
