import { describe, it, expect } from "vitest";
import {
  mesmoDia,
  horaCurta,
  construirLembretesHoje,
  temEventoHoje,
  type EventoLite,
} from "@/lib/dashboard-lembretes";

/** Data local (evita ambiguidades de UTC nos testes). */
function d(
  ano: number,
  mes: number,
  dia: number,
  hora = 0,
  min = 0,
): Date {
  return new Date(ano, mes - 1, dia, hora, min, 0, 0);
}

describe("mesmoDia", () => {
  it("verdadeiro no mesmo dia civil, independentemente da hora", () => {
    expect(mesmoDia(d(2026, 8, 6, 8, 30), d(2026, 8, 6, 22, 0))).toBe(true);
  });
  it("falso em dias diferentes", () => {
    expect(mesmoDia(d(2026, 8, 6, 23, 59), d(2026, 8, 7, 0, 1))).toBe(false);
  });
});

describe("horaCurta", () => {
  it("formata HH:MM com zeros à esquerda", () => {
    expect(horaCurta(d(2026, 8, 6, 9, 5))).toBe("09:05");
    expect(horaCurta(d(2026, 8, 6, 19, 30))).toBe("19:30");
  });
});

describe("construirLembretesHoje", () => {
  const agora = d(2026, 8, 6, 12, 0);

  const treinoHoje: EventoLite = {
    id: "s1",
    data: d(2026, 8, 6, 19, 0),
    escalaoNome: "Sub-13",
    local: "Pavilhão Municipal",
  };
  const treinoManha: EventoLite = {
    id: "s2",
    data: d(2026, 8, 6, 9, 0),
    escalaoNome: "Sub-15",
  };
  const treinoAmanha: EventoLite = {
    id: "s3",
    data: d(2026, 8, 7, 19, 0),
    escalaoNome: "Sub-13",
  };
  const jogoHoje: EventoLite = {
    id: "j1",
    data: d(2026, 8, 6, 16, 0),
    escalaoNome: "Sub-17",
    adversario: "Benfica",
    local: "Casa",
  };

  it("inclui apenas eventos de hoje", () => {
    const r = construirLembretesHoje([treinoHoje, treinoAmanha], [jogoHoje], agora);
    const ids = r.map((l) => l.id);
    expect(ids).toContain("s1");
    expect(ids).toContain("j1");
    expect(ids).not.toContain("s3");
  });

  it("marca como passou os eventos anteriores a agora e ordena por vir primeiro", () => {
    const r = construirLembretesHoje([treinoManha, treinoHoje], [jogoHoje], agora);
    // treinoManha (09:00) já passou; treinoHoje (19:00) e jogoHoje (16:00) por vir.
    expect(r[0].passou).toBe(false);
    expect(r[r.length - 1].id).toBe("s2");
    const manha = r.find((l) => l.id === "s2");
    expect(manha?.passou).toBe(true);
  });

  it("ordena os eventos por vir por hora ascendente", () => {
    const r = construirLembretesHoje([treinoHoje], [jogoHoje], agora);
    const porVir = r.filter((l) => !l.passou);
    expect(porVir.map((l) => l.id)).toEqual(["j1", "s1"]); // 16:00 antes de 19:00
  });

  it("constrói título e detalhe legíveis", () => {
    const r = construirLembretesHoje([treinoHoje], [], agora);
    expect(r[0].titulo).toBe("Treino hoje às 19:00");
    expect(r[0].detalhe).toBe("Sub-13 · Pavilhão Municipal");
    expect(r[0].href).toBe("/treinos/s1");
  });

  it("no jogo mostra o adversário no detalhe", () => {
    const r = construirLembretesHoje([], [jogoHoje], agora);
    expect(r[0].titulo).toBe("Jogo hoje às 16:00");
    expect(r[0].detalhe).toBe("vs Benfica · Sub-17 · Casa");
    expect(r[0].href).toBe("/jogos/j1");
  });

  it("devolve lista vazia sem eventos de hoje", () => {
    expect(construirLembretesHoje([treinoAmanha], [], agora)).toEqual([]);
  });
});

describe("temEventoHoje", () => {
  const agora = d(2026, 8, 6, 12, 0);
  it("verdadeiro quando há treino ou jogo hoje", () => {
    expect(
      temEventoHoje([{ id: "s", data: d(2026, 8, 6, 9, 0), escalaoNome: "Sub-13" }], [], agora),
    ).toBe(true);
  });
  it("falso quando não há eventos hoje", () => {
    expect(
      temEventoHoje([{ id: "s", data: d(2026, 8, 7, 9, 0), escalaoNome: "Sub-13" }], [], agora),
    ).toBe(false);
  });
});
