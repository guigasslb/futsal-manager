import { describe, it, expect } from "vitest";
import {
  normalizarLocal,
  temSobreposicao,
  detetarConflitos,
  DURACAO_PADRAO_MIN,
  type ConflitoAgenda,
} from "@/lib/utils/agenda-conflitos";

// F3.1 (§8.16) — Helper puro de deteção de conflitos de pavilhão.

describe("normalizarLocal", () => {
  it("faz trim das extremidades", () => {
    expect(normalizarLocal("  Pavilhão A  ")).toBe("pavilhão a");
  });

  it("passa a minúsculas", () => {
    expect(normalizarLocal("PAVILHÃO A")).toBe("pavilhão a");
  });

  it("colapsa múltiplos espaços internos num só", () => {
    expect(normalizarLocal("Pavilhão    Municipal   A")).toBe(
      "pavilhão municipal a",
    );
  });

  it("combina trim + lowercase + colapso", () => {
    expect(normalizarLocal("  PavilhÃo    A ")).toBe("pavilhÃo a".toLowerCase());
  });

  it("mantém acentos (não normaliza diacríticos)", () => {
    expect(normalizarLocal("Pavilhão")).not.toBe(normalizarLocal("Pavilhao"));
  });

  it("local só com espaços fica vazio", () => {
    expect(normalizarLocal("   ")).toBe("");
  });
});

describe("temSobreposicao", () => {
  const base = new Date("2026-08-15T18:00:00");

  it("expõe a duração padrão como 90 minutos", () => {
    expect(DURACAO_PADRAO_MIN).toBe(90);
  });

  it("deteta sobreposição parcial de janelas", () => {
    const a = { data: base, duracaoMin: 90 }; // 18:00–19:30
    const b = { data: new Date("2026-08-15T19:00:00"), duracaoMin: 60 }; // 19:00–20:00
    expect(temSobreposicao(a, b)).toBe(true);
  });

  it("deteta sobreposição total (uma contém a outra)", () => {
    const a = { data: base, duracaoMin: 120 }; // 18:00–20:00
    const b = { data: new Date("2026-08-15T18:30:00"), duracaoMin: 30 }; // 18:30–19:00
    expect(temSobreposicao(a, b)).toBe(true);
  });

  it("janelas adjacentes (fim = início) NÃO se sobrepõem", () => {
    const a = { data: base, duracaoMin: 60 }; // 18:00–19:00
    const b = { data: new Date("2026-08-15T19:00:00"), duracaoMin: 60 }; // 19:00–20:00
    expect(temSobreposicao(a, b)).toBe(false);
  });

  it("janelas separadas no tempo não se sobrepõem", () => {
    const a = { data: base, duracaoMin: 60 }; // 18:00–19:00
    const b = { data: new Date("2026-08-15T21:00:00"), duracaoMin: 60 }; // 21:00–22:00
    expect(temSobreposicao(a, b)).toBe(false);
  });

  it("assume 90 min quando duracaoMin é null", () => {
    const a = { data: base, duracaoMin: null }; // 18:00–19:30
    const b = { data: new Date("2026-08-15T19:15:00"), duracaoMin: null }; // 19:15–20:45
    expect(temSobreposicao(a, b)).toBe(true);
  });

  it("com null e sem overlap real", () => {
    const a = { data: base, duracaoMin: null }; // 18:00–19:30
    const b = { data: new Date("2026-08-15T19:30:00"), duracaoMin: null }; // 19:30–21:00
    expect(temSobreposicao(a, b)).toBe(false);
  });
});

describe("detetarConflitos", () => {
  const base = new Date("2026-08-15T18:00:00");

  const evento = (over: Partial<{
    id: string;
    data: Date;
    duracaoMin: number | null;
    local: string | null;
    tipo: "TREINO" | "JOGO";
    escalaoNome: string;
  }> = {}) => ({
    id: "e1",
    data: new Date("2026-08-15T18:30:00"),
    duracaoMin: 60,
    local: "Pavilhão A",
    tipo: "TREINO" as const,
    escalaoNome: "Sub-15",
    ...over,
  });

  it("deteta conflito real (mesmo local + hora sobreposta)", () => {
    const conflitos = detetarConflitos(
      { data: base, duracaoMin: 90, local: "Pavilhão A" },
      [evento()],
    );
    expect(conflitos).toHaveLength(1);
    const c: ConflitoAgenda = conflitos[0];
    expect(c).toMatchObject({
      tipo: "TREINO",
      escalaoNome: "Sub-15",
      local: "Pavilhão A",
    });
  });

  it("iguala locais com capitalização/espaços diferentes", () => {
    const conflitos = detetarConflitos(
      { data: base, duracaoMin: 90, local: "  pavilhão   a " },
      [evento({ local: "Pavilhão A" })],
    );
    expect(conflitos).toHaveLength(1);
  });

  it("sem conflito quando o local é diferente", () => {
    const conflitos = detetarConflitos(
      { data: base, duracaoMin: 90, local: "Pavilhão B" },
      [evento({ local: "Pavilhão A" })],
    );
    expect(conflitos).toHaveLength(0);
  });

  it("sem conflito quando o novo local é vazio", () => {
    const conflitos = detetarConflitos(
      { data: base, duracaoMin: 90, local: "" },
      [evento()],
    );
    expect(conflitos).toHaveLength(0);
  });

  it("sem conflito quando o novo local é null", () => {
    const conflitos = detetarConflitos(
      { data: base, duracaoMin: 90, local: null },
      [evento()],
    );
    expect(conflitos).toHaveLength(0);
  });

  it("ignora eventos existentes sem local", () => {
    const conflitos = detetarConflitos(
      { data: base, duracaoMin: 90, local: "Pavilhão A" },
      [evento({ local: null })],
    );
    expect(conflitos).toHaveLength(0);
  });

  it("exclui o próprio evento em edição via excluirId", () => {
    const conflitos = detetarConflitos(
      { data: base, duracaoMin: 90, local: "Pavilhão A" },
      [evento({ id: "self" })],
      "self",
    );
    expect(conflitos).toHaveLength(0);
  });

  it("sem conflito quando as janelas não se sobrepõem", () => {
    const conflitos = detetarConflitos(
      { data: base, duracaoMin: 30, local: "Pavilhão A" }, // 18:00–18:30
      [evento({ data: new Date("2026-08-15T18:30:00"), duracaoMin: 60 })], // 18:30–19:30
    );
    expect(conflitos).toHaveLength(0);
  });

  it("deteta múltiplos conflitos e preserva o tipo de cada um", () => {
    const conflitos = detetarConflitos(
      { data: base, duracaoMin: 120, local: "Pavilhão A" }, // 18:00–20:00
      [
        evento({ id: "t1", tipo: "TREINO", escalaoNome: "Sub-13" }),
        evento({
          id: "j1",
          tipo: "JOGO",
          escalaoNome: "Seniores",
          data: new Date("2026-08-15T19:00:00"),
          duracaoMin: null,
        }),
      ],
    );
    expect(conflitos).toHaveLength(2);
    expect(conflitos.map((c) => c.tipo)).toEqual(["TREINO", "JOGO"]);
  });
});
