import { describe, it, expect } from "vitest";
import {
  criarLembreteSchema,
  atualizarLembreteSchema,
  idLembreteSchema,
} from "@/lib/schemas/lembretes";

const CUID = "ckv9v0z1w0000abcd1234efgh";
const CUID2 = "ckv9v0z1w0001abcd1234efgh";

describe("criarLembreteSchema (P2.1 — Lembretes/Tarefas)", () => {
  it("aceita um lembrete mínimo (só título) sem destinatários", () => {
    const r = criarLembreteSchema.safeParse({ titulo: "Levar coletes", destinatarioIds: [] });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.titulo).toBe("Levar coletes");
      expect(r.data.destinatarioIds).toEqual([]);
    }
  });

  it("aceita descrição, data limite e destinatários", () => {
    const r = criarLembreteSchema.safeParse({
      titulo: "Reunião de pais",
      descricao: "Preparar apresentação",
      dataLimite: "2026-09-01T18:00",
      destinatarioIds: [CUID, CUID2],
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.dataLimite).toBeInstanceOf(Date);
      expect(r.data.destinatarioIds).toHaveLength(2);
    }
  });

  it("rejeita título com menos de 2 caracteres", () => {
    const r = criarLembreteSchema.safeParse({ titulo: "a", destinatarioIds: [] });
    expect(r.success).toBe(false);
  });

  it("rejeita título vazio", () => {
    const r = criarLembreteSchema.safeParse({ titulo: "", destinatarioIds: [] });
    expect(r.success).toBe(false);
  });

  it("rejeita destinatário que não é cuid", () => {
    const r = criarLembreteSchema.safeParse({ titulo: "Teste", destinatarioIds: ["nope"] });
    expect(r.success).toBe(false);
  });

  it("rejeita descrição acima de 1000 caracteres", () => {
    const r = criarLembreteSchema.safeParse({
      titulo: "Teste",
      descricao: "x".repeat(1001),
      destinatarioIds: [],
    });
    expect(r.success).toBe(false);
  });
});

describe("atualizarLembreteSchema", () => {
  it("aceita atualização parcial só com id e concluido", () => {
    const r = atualizarLembreteSchema.safeParse({ id: CUID, concluido: true });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.concluido).toBe(true);
  });

  it("aceita atualização só de título", () => {
    const r = atualizarLembreteSchema.safeParse({ id: CUID, titulo: "Novo título" });
    expect(r.success).toBe(true);
  });

  it("exige um id válido (cuid)", () => {
    const r = atualizarLembreteSchema.safeParse({ id: "nope", concluido: true });
    expect(r.success).toBe(false);
  });
});

describe("idLembreteSchema", () => {
  it("aceita um cuid", () => {
    expect(idLembreteSchema.safeParse({ id: CUID }).success).toBe(true);
  });
  it("rejeita id inválido", () => {
    expect(idLembreteSchema.safeParse({ id: "123" }).success).toBe(false);
  });
});
