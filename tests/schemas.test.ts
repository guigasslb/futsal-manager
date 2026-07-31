import { describe, it, expect } from "vitest";
import { atletaSchema } from "@/lib/schemas/atleta";
import { exercicioSchema, diagramaSchema } from "@/lib/schemas/exercicio";
import { jogoSchema, estatisticaSchema } from "@/lib/schemas/jogo";
import { sessaoSchema, presencaSchema } from "@/lib/schemas/treino";

const CUID = "ckv9v0z1w0000abcd1234efgh";

describe("atletaSchema", () => {
  it("aceita um atleta válido mínimo", () => {
    const r = atletaSchema.safeParse({ nome: "João Silva", escalaoId: CUID });
    expect(r.success).toBe(true);
  });

  it("rejeita nome com menos de 2 caracteres", () => {
    const r = atletaSchema.safeParse({ nome: "J", escalaoId: CUID });
    expect(r.success).toBe(false);
  });

  it("rejeita número fora do intervalo 1-99", () => {
    expect(atletaSchema.safeParse({ nome: "João", escalaoId: CUID, numero: 0 }).success).toBe(
      false,
    );
    expect(atletaSchema.safeParse({ nome: "João", escalaoId: CUID, numero: 100 }).success).toBe(
      false,
    );
    expect(atletaSchema.safeParse({ nome: "João", escalaoId: CUID, numero: 7 }).success).toBe(
      true,
    );
  });

  it("rejeita posição inválida", () => {
    const r = atletaSchema.safeParse({ nome: "João", escalaoId: CUID, posicao: "AVANCADO" });
    expect(r.success).toBe(false);
  });

  it("aceita as cinco posições válidas", () => {
    for (const posicao of ["GUARDA_REDES", "FIXO", "ALA", "PIVO", "UNIVERSAL"]) {
      expect(atletaSchema.safeParse({ nome: "João", escalaoId: CUID, posicao }).success).toBe(
        true,
      );
    }
  });
});

describe("exercicioSchema", () => {
  it("aceita exercício válido", () => {
    expect(exercicioSchema.safeParse({ nome: "1x1" }).success).toBe(true);
  });

  it("rejeita nome vazio", () => {
    expect(exercicioSchema.safeParse({ nome: "" }).success).toBe(false);
  });

  it("rejeita duração fora do intervalo", () => {
    expect(exercicioSchema.safeParse({ nome: "X", duracaoMin: 0 }).success).toBe(false);
    expect(exercicioSchema.safeParse({ nome: "X", duracaoMin: 181 }).success).toBe(false);
  });
});

describe("diagramaSchema", () => {
  it("aceita diagrama vazio", () => {
    expect(diagramaSchema.safeParse({ versao: 1, elementos: [] }).success).toBe(true);
  });

  it("aceita elementos válidos (jogador, bola, seta)", () => {
    const diagrama = {
      versao: 1,
      elementos: [
        { id: "a", tipo: "jogador", x: 100, y: 100, cor: "azul", numero: 7 },
        { id: "b", tipo: "bola", x: 50, y: 50 },
        {
          id: "c",
          tipo: "seta",
          estilo: "passe",
          cor: "#000",
          pontos: [
            { x: 0, y: 0 },
            { x: 40, y: 40 },
          ],
        },
      ],
    };
    expect(diagramaSchema.safeParse(diagrama).success).toBe(true);
  });

  it("rejeita versão diferente de 1", () => {
    expect(diagramaSchema.safeParse({ versao: 2, elementos: [] }).success).toBe(false);
  });

  it("rejeita coordenadas fora do campo (0-400 / 0-200)", () => {
    const mau = {
      versao: 1,
      elementos: [{ id: "a", tipo: "jogador", x: 500, y: 100, cor: "azul" }],
    };
    expect(diagramaSchema.safeParse(mau).success).toBe(false);
  });

  it("rejeita seta com menos de 2 pontos", () => {
    const mau = {
      versao: 1,
      elementos: [{ id: "c", tipo: "seta", estilo: "passe", cor: "#000", pontos: [{ x: 0, y: 0 }] }],
    };
    expect(diagramaSchema.safeParse(mau).success).toBe(false);
  });

  it("rejeita cor de jogador inválida", () => {
    const mau = {
      versao: 1,
      elementos: [{ id: "a", tipo: "jogador", x: 10, y: 10, cor: "rosa" }],
    };
    expect(diagramaSchema.safeParse(mau).success).toBe(false);
  });
});

describe("jogoSchema", () => {
  it("aceita jogo válido", () => {
    const r = jogoSchema.safeParse({
      data: "2026-01-10T18:00",
      adversario: "CD Aves",
      casaFora: "CASA",
      escalaoId: CUID,
    });
    expect(r.success).toBe(true);
  });

  it("rejeita adversário vazio", () => {
    const r = jogoSchema.safeParse({
      data: "2026-01-10T18:00",
      adversario: "",
      casaFora: "CASA",
      escalaoId: CUID,
    });
    expect(r.success).toBe(false);
  });

  it("rejeita casaFora inválido", () => {
    const r = jogoSchema.safeParse({
      data: "2026-01-10T18:00",
      adversario: "X",
      casaFora: "NEUTRO",
      escalaoId: CUID,
    });
    expect(r.success).toBe(false);
  });
});

describe("estatisticaSchema", () => {
  it("aceita estatística mínima (só utilização) e aplica defaults", () => {
    const r = estatisticaSchema.safeParse({ atletaId: CUID, utilizacao: "TITULAR" });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.golos).toBe(0);
      expect(r.data.assistencias).toBe(0);
    }
  });

  it("aceita valoresMetricas", () => {
    const r = estatisticaSchema.safeParse({
      atletaId: CUID,
      utilizacao: "UTILIZADO",
      valoresMetricas: [{ metricaId: CUID, valor: 3 }],
    });
    expect(r.success).toBe(true);
  });

  it("rejeita utilização inválida", () => {
    expect(
      estatisticaSchema.safeParse({ atletaId: CUID, utilizacao: "BANCO" }).success,
    ).toBe(false);
  });
});

describe("sessaoSchema", () => {
  it("aceita sessão válida", () => {
    const r = sessaoSchema.safeParse({ data: "2026-01-10T18:00", escalaoId: CUID });
    expect(r.success).toBe(true);
  });

  it("rejeita sem escalão", () => {
    expect(sessaoSchema.safeParse({ data: "2026-01-10T18:00" }).success).toBe(false);
  });
});

describe("presencaSchema", () => {
  it("aceita os cinco estados de presença", () => {
    for (const estado of ["PRESENTE", "FALTA", "FALTA_JUSTIFICADA", "LESIONADO", "ATRASADO"]) {
      expect(presencaSchema.safeParse({ atletaId: CUID, estado }).success).toBe(true);
    }
  });

  it("rejeita estado inválido", () => {
    expect(presencaSchema.safeParse({ atletaId: CUID, estado: "FERIAS" }).success).toBe(false);
  });
});
