import { describe, it, expect } from "vitest";
import { agregarEstatisticas, type LinhaEstatistica } from "@/lib/estatisticas";

function linha(over: Partial<LinhaEstatistica> = {}): LinhaEstatistica {
  return {
    utilizacao: "TITULAR",
    minutos: null,
    golos: 0,
    assistencias: 0,
    defesas: null,
    golosSofridosGR: null,
    ...over,
  };
}

describe("agregarEstatisticas — jogador de campo", () => {
  it("soma golos, assistências e conta utilizações/titularidades", () => {
    const r = agregarEstatisticas({
      eGR: false,
      jogosConvocado: 3,
      sessoesTotais: 10,
      presencas: 8,
      estatisticas: [
        linha({ utilizacao: "TITULAR", golos: 2, assistencias: 1 }),
        linha({ utilizacao: "UTILIZADO", golos: 1, assistencias: 0 }),
        linha({ utilizacao: "NAO_UTILIZADO", golos: 0, assistencias: 0 }),
      ],
    });
    expect(r.totalGolos).toBe(3);
    expect(r.totalAssistencias).toBe(1);
    expect(r.jogosUtilizados).toBe(2); // TITULAR + UTILIZADO
    expect(r.titularidades).toBe(1);
    expect(r.jogosConvocado).toBe(3);
  });

  it("estatísticas de GR ficam null para jogador de campo", () => {
    const r = agregarEstatisticas({
      eGR: false,
      jogosConvocado: 1,
      sessoesTotais: 1,
      presencas: 1,
      estatisticas: [linha({ defesas: 5, golosSofridosGR: 2 })],
    });
    expect(r.totalDefesas).toBeNull();
    expect(r.totalGolosSofridos).toBeNull();
  });
});

describe("agregarEstatisticas — guarda-redes", () => {
  it("soma defesas e golos sofridos quando é GR", () => {
    const r = agregarEstatisticas({
      eGR: true,
      jogosConvocado: 2,
      sessoesTotais: 4,
      presencas: 4,
      estatisticas: [
        linha({ defesas: 7, golosSofridosGR: 2 }),
        linha({ defesas: 3, golosSofridosGR: 1 }),
      ],
    });
    expect(r.totalDefesas).toBe(10);
    expect(r.totalGolosSofridos).toBe(3);
  });
});

describe("agregarEstatisticas — totalMinutos (secção 15.2)", () => {
  it("é null quando nenhum jogo tem minutos registados", () => {
    const r = agregarEstatisticas({
      eGR: false,
      jogosConvocado: 2,
      sessoesTotais: 0,
      presencas: 0,
      estatisticas: [linha({ minutos: null }), linha({ minutos: null })],
    });
    expect(r.totalMinutos).toBeNull();
  });

  it("soma apenas os minutos registados (ignora null)", () => {
    const r = agregarEstatisticas({
      eGR: false,
      jogosConvocado: 2,
      sessoesTotais: 0,
      presencas: 0,
      estatisticas: [linha({ minutos: 18 }), linha({ minutos: null }), linha({ minutos: 12 })],
    });
    expect(r.totalMinutos).toBe(30);
  });

  it("distingue zero minutos de não registado", () => {
    const r = agregarEstatisticas({
      eGR: false,
      jogosConvocado: 1,
      sessoesTotais: 0,
      presencas: 0,
      estatisticas: [linha({ minutos: 0 })],
    });
    expect(r.totalMinutos).toBe(0); // 0 registado ≠ null
  });
});

describe("agregarEstatisticas — taxaPresenca (secção 15.2 / 22.3)", () => {
  it("é 0 quando não há sessões (evita divisão por zero)", () => {
    const r = agregarEstatisticas({
      eGR: false,
      jogosConvocado: 0,
      sessoesTotais: 0,
      presencas: 0,
      estatisticas: [],
    });
    expect(r.taxaPresenca).toBe(0);
  });

  it("calcula presencas / sessoesTotais", () => {
    const r = agregarEstatisticas({
      eGR: false,
      jogosConvocado: 0,
      sessoesTotais: 10,
      presencas: 8,
      estatisticas: [],
    });
    expect(r.taxaPresenca).toBeCloseTo(0.8);
  });

  it("atleta que entra a meio (divisor menor) não é penalizado", () => {
    // Só 5 sessões desde o ingresso, presente em todas → 100%
    const r = agregarEstatisticas({
      eGR: false,
      jogosConvocado: 0,
      sessoesTotais: 5,
      presencas: 5,
      estatisticas: [],
    });
    expect(r.taxaPresenca).toBe(1);
  });
});
