import { describe, it, expect } from "vitest";
import {
  modeloJogoSchema,
  quadroTaticoSchema,
  criarQuadroTaticoSchema,
  lerSubprincipios,
  LABEL_TIPO_QUADRO,
  TIPOS_QUADRO,
} from "@/lib/schemas/modeloJogo";

const CUID = "ckv9v0z1w0000abcd1234efgh";
const OUTRO_CUID = "ckv9v0z1w0001abcd1234efgh";

describe("modeloJogoSchema (F4 — documento vivo, bíblia §3.6)", () => {
  it("aceita o mínimo e assume proprietário CLUBE", () => {
    const r = modeloJogoSchema.safeParse({ nome: "Saída a 4", momento: "ORG_OFENSIVA" });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.proprietario).toBe("CLUBE");
      expect(r.data.escalaoId).toBeUndefined();
      expect(r.data.epocaId).toBeUndefined();
    }
  });

  it("aceita escalão e época (documento da equipa)", () => {
    const r = modeloJogoSchema.safeParse({
      nome: "Pressão alta",
      momento: "ORG_DEFENSIVA",
      escalaoId: CUID,
      epocaId: OUTRO_CUID,
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.escalaoId).toBe(CUID);
      expect(r.data.epocaId).toBe(OUTRO_CUID);
    }
  });

  it("aceita proprietário TREINADOR (metodologia portátil)", () => {
    const r = modeloJogoSchema.safeParse({
      nome: "Metodologia própria",
      momento: "TRANS_OFENSIVA",
      proprietario: "TREINADOR",
    });
    expect(r.success).toBe(true);
  });

  it("normaliza escalaoId vazio para null (limpar = portátil)", () => {
    const r = modeloJogoSchema.safeParse({
      nome: "Genérico",
      momento: "TRANS_DEFENSIVA",
      escalaoId: "",
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.escalaoId).toBeNull();
  });

  it("rejeita escalaoId que não é cuid", () => {
    const r = modeloJogoSchema.safeParse({
      nome: "Inválido",
      momento: "ORG_OFENSIVA",
      escalaoId: "123",
    });
    expect(r.success).toBe(false);
  });

  it("aceita subprincípios como array de textos", () => {
    const r = modeloJogoSchema.safeParse({
      nome: "Saída a jogar",
      momento: "ORG_OFENSIVA",
      subprincipios: ["Pressão alta", "Saída a jogar", "Basculação"],
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.subprincipios).toHaveLength(3);
  });

  it("aceita lista vazia de subprincípios (limpar)", () => {
    const r = modeloJogoSchema.safeParse({
      nome: "Sem subprincípios",
      momento: "ORG_OFENSIVA",
      subprincipios: [],
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.subprincipios).toEqual([]);
  });

  it("rejeita subprincípio vazio", () => {
    const r = modeloJogoSchema.safeParse({
      nome: "X",
      momento: "ORG_OFENSIVA",
      subprincipios: ["Pressão alta", "   "],
    });
    expect(r.success).toBe(false);
  });

  it("rejeita mais de 50 subprincípios", () => {
    const r = modeloJogoSchema.safeParse({
      nome: "X",
      momento: "ORG_OFENSIVA",
      subprincipios: Array.from({ length: 51 }, (_, i) => `Sub ${i}`),
    });
    expect(r.success).toBe(false);
  });

  it("rejeita momento inválido", () => {
    const r = modeloJogoSchema.safeParse({ nome: "X", momento: "ORGANIZACAO" });
    expect(r.success).toBe(false);
  });

  it("aceita o momento BOLAS_PARADAS", () => {
    const r = modeloJogoSchema.safeParse({ nome: "Canto curto", momento: "BOLAS_PARADAS" });
    expect(r.success).toBe(true);
  });

  it("rejeita nome vazio (obrigatório)", () => {
    const r = modeloJogoSchema.safeParse({ nome: "", momento: "ORG_OFENSIVA" });
    expect(r.success).toBe(false);
  });

  it("aceita nome no limite de 100 caracteres", () => {
    const r = modeloJogoSchema.safeParse({ nome: "a".repeat(100), momento: "ORG_OFENSIVA" });
    expect(r.success).toBe(true);
  });

  it("rejeita nome com mais de 100 caracteres", () => {
    const r = modeloJogoSchema.safeParse({ nome: "a".repeat(101), momento: "ORG_OFENSIVA" });
    expect(r.success).toBe(false);
  });

  it("aceita subprincípio no limite de 300 caracteres", () => {
    const r = modeloJogoSchema.safeParse({
      nome: "X",
      momento: "ORG_OFENSIVA",
      subprincipios: ["a".repeat(300)],
    });
    expect(r.success).toBe(true);
  });

  it("rejeita subprincípio com mais de 300 caracteres", () => {
    const r = modeloJogoSchema.safeParse({
      nome: "X",
      momento: "ORG_OFENSIVA",
      subprincipios: ["a".repeat(301)],
    });
    expect(r.success).toBe(false);
  });

  it("aceita exatamente 50 subprincípios (limite)", () => {
    const r = modeloJogoSchema.safeParse({
      nome: "X",
      momento: "ORG_OFENSIVA",
      subprincipios: Array.from({ length: 50 }, (_, i) => `Sub ${i}`),
    });
    expect(r.success).toBe(true);
  });

  it("aceita epocaId como cuid", () => {
    const r = modeloJogoSchema.safeParse({
      nome: "X",
      momento: "ORG_OFENSIVA",
      epocaId: OUTRO_CUID,
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.epocaId).toBe(OUTRO_CUID);
  });

  it("rejeita epocaId que não é cuid", () => {
    const r = modeloJogoSchema.safeParse({
      nome: "X",
      momento: "ORG_OFENSIVA",
      epocaId: "456",
    });
    expect(r.success).toBe(false);
  });

  it("normaliza epocaId vazio para null (limpar)", () => {
    const r = modeloJogoSchema.safeParse({
      nome: "X",
      momento: "ORG_OFENSIVA",
      epocaId: "",
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.epocaId).toBeNull();
  });

  it("aceita escalaoId e epocaId null explícitos (portátil)", () => {
    const r = modeloJogoSchema.safeParse({
      nome: "X",
      momento: "ORG_OFENSIVA",
      escalaoId: null,
      epocaId: null,
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.escalaoId).toBeNull();
      expect(r.data.epocaId).toBeNull();
    }
  });
});

describe("lerSubprincipios (normalização do Json)", () => {
  it("devolve lista vazia para valores não-array", () => {
    expect(lerSubprincipios(null)).toEqual([]);
    expect(lerSubprincipios(undefined)).toEqual([]);
    expect(lerSubprincipios("Pressão alta")).toEqual([]);
    expect(lerSubprincipios({ titulo: "Pressão alta" })).toEqual([]);
  });

  it("normaliza o formato simples e ignora entradas vazias", () => {
    expect(lerSubprincipios(["Pressão alta", "  ", " Saída a jogar "])).toEqual([
      "Pressão alta",
      "Saída a jogar",
    ]);
  });

  it("normaliza o formato estruturado {titulo, detalhe}", () => {
    expect(
      lerSubprincipios([
        { titulo: "Pressão alta", detalhe: "A partir do meio-campo" },
        { detalhe: "sem titulo" },
        { titulo: 42 },
      ]),
    ).toEqual(["Pressão alta"]);
  });
});

describe("quadroTaticoSchema (F4 — tipo GERAL/BOLA_PARADA)", () => {
  it("assume tipo GERAL por omissão", () => {
    const r = quadroTaticoSchema.safeParse({ nome: "Bloco defensivo" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.tipo).toBe("GERAL");
  });

  it("aceita tipo BOLA_PARADA", () => {
    const r = quadroTaticoSchema.safeParse({ nome: "Canto ofensivo", tipo: "BOLA_PARADA" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.tipo).toBe("BOLA_PARADA");
  });

  it("rejeita tipo inválido", () => {
    const r = quadroTaticoSchema.safeParse({ nome: "X", tipo: "LIVRE" });
    expect(r.success).toBe(false);
  });

  it("rejeita nome vazio", () => {
    const r = quadroTaticoSchema.safeParse({ nome: "" });
    expect(r.success).toBe(false);
  });

  it("aceita diagrama de campo", () => {
    const r = quadroTaticoSchema.safeParse({
      nome: "Canto curto",
      tipo: "BOLA_PARADA",
      diagrama: { versao: 1, elementos: [] },
    });
    expect(r.success).toBe(true);
  });

  it("aceita notas opcionais", () => {
    const r = quadroTaticoSchema.safeParse({ nome: "Canto", notas: "Ao primeiro poste" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.notas).toBe("Ao primeiro poste");
  });

  it("aceita sem notas (campo opcional)", () => {
    const r = quadroTaticoSchema.safeParse({ nome: "Canto" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.notas).toBeUndefined();
  });

  it("rejeita notas com mais de 2000 caracteres", () => {
    const r = quadroTaticoSchema.safeParse({ nome: "Canto", notas: "a".repeat(2001) });
    expect(r.success).toBe(false);
  });

  it("aceita nome no limite de 100 caracteres", () => {
    const r = quadroTaticoSchema.safeParse({ nome: "a".repeat(100) });
    expect(r.success).toBe(true);
  });

  it("rejeita nome com mais de 100 caracteres", () => {
    const r = quadroTaticoSchema.safeParse({ nome: "a".repeat(101) });
    expect(r.success).toBe(false);
  });
});

describe("criarQuadroTaticoSchema (exige o jogo)", () => {
  it("aceita com jogoId válido", () => {
    const r = criarQuadroTaticoSchema.safeParse({ jogoId: CUID, nome: "Livre direto" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.tipo).toBe("GERAL");
  });

  it("rejeita sem jogoId", () => {
    const r = criarQuadroTaticoSchema.safeParse({ nome: "Livre direto" });
    expect(r.success).toBe(false);
  });

  it("rejeita jogoId inválido", () => {
    const r = criarQuadroTaticoSchema.safeParse({ jogoId: "abc", nome: "Livre direto" });
    expect(r.success).toBe(false);
  });
});

describe("etiquetas de tipo de quadro tático", () => {
  it("cobre os dois tipos do enum", () => {
    expect(TIPOS_QUADRO).toEqual(["GERAL", "BOLA_PARADA"]);
    expect(LABEL_TIPO_QUADRO.GERAL).toBe("Geral");
    expect(LABEL_TIPO_QUADRO.BOLA_PARADA).toBe("Bola parada");
  });
});
