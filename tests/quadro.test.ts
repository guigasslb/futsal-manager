import { describe, it, expect } from "vitest";
import { gerarLiga, gerarBracket, type Equipa } from "@/lib/quadro";

const nomes = (n: number): Equipa[] =>
  Array.from({ length: n }, (_, i) => ({ nome: `E${i + 1}` }));

// ─────────────────────────────────────────────────────────────────────────────
// gerarLiga — round-robin (método do círculo)
// ─────────────────────────────────────────────────────────────────────────────

describe("gerarLiga — N par", () => {
  it("4 equipas → 3 rondas, 2 jogos por ronda, 6 jogos no total", () => {
    const jogos = gerarLiga(nomes(4), false);
    expect(jogos).toHaveLength(6);

    const rondas = new Set(jogos.map((j) => j.ronda));
    expect([...rondas].sort()).toEqual([1, 2, 3]);
    for (const r of rondas) {
      expect(jogos.filter((j) => j.ronda === r)).toHaveLength(2);
    }
  });

  it("cada par de equipas joga exatamente uma vez (sem duas mãos)", () => {
    const jogos = gerarLiga(nomes(4), false);
    const pares = jogos.map((j) => [j.equipaCasa, j.equipaFora].sort().join("-"));
    expect(new Set(pares).size).toBe(6); // C(4,2) = 6 confrontos únicos
  });

  it("nenhuma equipa joga contra si própria", () => {
    const jogos = gerarLiga(nomes(6), false);
    expect(jogos.every((j) => j.equipaCasa !== j.equipaFora)).toBe(true);
  });
});

describe("gerarLiga — N ímpar (bye)", () => {
  it("5 equipas → 5 rondas, 2 jogos por ronda (uma equipa de bye por ronda)", () => {
    const jogos = gerarLiga(nomes(5), false);
    // C(5,2) = 10 confrontos únicos.
    expect(jogos).toHaveLength(10);
    const rondas = [...new Set(jogos.map((j) => j.ronda))];
    expect(rondas).toHaveLength(5);
    for (const r of rondas) {
      expect(jogos.filter((j) => j.ronda === r)).toHaveLength(2);
    }
    // A equipa fantasma (bye) nunca aparece.
    expect(jogos.every((j) => j.equipaCasa !== "" && j.equipaFora !== "")).toBe(true);
  });
});

describe("gerarLiga — duas mãos", () => {
  it("duplica os jogos invertendo casa/fora e deslocando a ronda", () => {
    const ida = gerarLiga(nomes(4), false);
    const total = gerarLiga(nomes(4), true);
    expect(total).toHaveLength(ida.length * 2);

    // A 2.ª volta tem as rondas deslocadas por N-1 (3) e mandos invertidos.
    const volta = total.slice(ida.length);
    expect(volta.every((j) => j.ronda > 3)).toBe(true);
    for (let i = 0; i < ida.length; i++) {
      expect(volta[i].equipaCasa).toBe(ida[i].equipaFora);
      expect(volta[i].equipaFora).toBe(ida[i].equipaCasa);
      expect(volta[i].ronda).toBe(ida[i].ronda + 3);
    }
  });
});

describe("gerarLiga — casos-limite", () => {
  it("menos de 2 equipas → sem jogos", () => {
    expect(gerarLiga(nomes(1), false)).toHaveLength(0);
    expect(gerarLiga([], false)).toHaveLength(0);
  });

  it("2 equipas → 1 jogo (ida) e 2 jogos (ida e volta)", () => {
    expect(gerarLiga(nomes(2), false)).toHaveLength(1);
    expect(gerarLiga(nomes(2), true)).toHaveLength(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// gerarBracket — eliminatório com seeding e byes
// ─────────────────────────────────────────────────────────────────────────────

describe("gerarBracket — potência de 2 (sem byes)", () => {
  it("4 equipas → 2 jogos na ronda 1, bracket clássico (1v4, 2v3)", () => {
    const equipas: Equipa[] = [
      { nome: "A", posicao: 1 },
      { nome: "B", posicao: 2 },
      { nome: "C", posicao: 3 },
      { nome: "D", posicao: 4 },
    ];
    const jogos = gerarBracket(equipas);
    expect(jogos).toHaveLength(2);
    expect(jogos.every((j) => j.ronda === 1)).toBe(true);
    expect(jogos[0]).toMatchObject({ equipaCasa: "A", equipaFora: "D" });
    expect(jogos[1]).toMatchObject({ equipaCasa: "B", equipaFora: "C" });
  });
});

describe("gerarBracket — com byes", () => {
  it("6 equipas → potência 8, 2 byes (seeds 1,2), ronda 1 = 3v6 e 4v5", () => {
    const equipas: Equipa[] = Array.from({ length: 6 }, (_, i) => ({
      nome: `S${i + 1}`,
      posicao: i + 1,
    }));
    const jogos = gerarBracket(equipas);
    // (6 - 2 byes)/2 = 2 jogos na ronda 1.
    expect(jogos).toHaveLength(2);
    expect(jogos[0]).toMatchObject({ equipaCasa: "S3", equipaFora: "S6", ronda: 1 });
    expect(jogos[1]).toMatchObject({ equipaCasa: "S4", equipaFora: "S5", ronda: 1 });
    // Seeds 1 e 2 (byes) não aparecem na ronda 1.
    const emCampo = jogos.flatMap((j) => [j.equipaCasa, j.equipaFora]);
    expect(emCampo).not.toContain("S1");
    expect(emCampo).not.toContain("S2");
  });

  it("3 equipas → potência 4, 1 bye (seed 1), ronda 1 = 2v3", () => {
    const equipas: Equipa[] = [
      { nome: "A", posicao: 1 },
      { nome: "B", posicao: 2 },
      { nome: "C", posicao: 3 },
    ];
    const jogos = gerarBracket(equipas);
    expect(jogos).toHaveLength(1);
    expect(jogos[0]).toMatchObject({ equipaCasa: "B", equipaFora: "C", ronda: 1 });
  });
});

describe("gerarBracket — ordenação por seed", () => {
  it("ordena por posicao ascendente independentemente da ordem de entrada", () => {
    const equipas: Equipa[] = [
      { nome: "D", posicao: 4 },
      { nome: "A", posicao: 1 },
      { nome: "C", posicao: 3 },
      { nome: "B", posicao: 2 },
    ];
    const jogos = gerarBracket(equipas);
    expect(jogos[0]).toMatchObject({ equipaCasa: "A", equipaFora: "D" });
    expect(jogos[1]).toMatchObject({ equipaCasa: "B", equipaFora: "C" });
  });

  it("equipas sem seed mantêm a ordem original, a seguir às semeadas", () => {
    const equipas: Equipa[] = [
      { nome: "X" }, // sem seed
      { nome: "Y" }, // sem seed
      { nome: "Top", posicao: 1 },
      { nome: "Seg", posicao: 2 },
    ];
    const jogos = gerarBracket(equipas);
    // Ordem final por seed: Top, Seg, X, Y → 1v4 (Top v Y), 2v3 (Seg v X).
    expect(jogos[0]).toMatchObject({ equipaCasa: "Top", equipaFora: "Y" });
    expect(jogos[1]).toMatchObject({ equipaCasa: "Seg", equipaFora: "X" });
  });
});

describe("gerarBracket — casos-limite", () => {
  it("menos de 2 equipas → sem jogos", () => {
    expect(gerarBracket([{ nome: "Só" }])).toHaveLength(0);
    expect(gerarBracket([])).toHaveLength(0);
  });

  it("2 equipas → 1 jogo na ronda 1", () => {
    const jogos = gerarBracket([{ nome: "A", posicao: 1 }, { nome: "B", posicao: 2 }]);
    expect(jogos).toHaveLength(1);
    expect(jogos[0]).toMatchObject({ equipaCasa: "A", equipaFora: "B", ronda: 1 });
  });
});
