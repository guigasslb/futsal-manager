import { describe, it, expect } from "vitest";
import {
  cardQuerySchema,
  eEscalaoFormacaoJovem,
  LABEL_TIPO_CARD,
  TIPOS_CARD,
} from "@/lib/schemas/social";
import { gerarTokenCard, validarTokenCard, urlCard } from "@/lib/social/token";

// P4.7 — Cards sociais para Instagram (bíblia §3.16).

describe("cardQuerySchema", () => {
  it("aceita 'resultado' com jogoId e token", () => {
    const r = cardQuerySchema.safeParse({ tipo: "resultado", jogoId: "j1", token: "abc" });
    expect(r.success).toBe(true);
  });

  it("rejeita 'resultado' sem jogoId", () => {
    const r = cardQuerySchema.safeParse({ tipo: "resultado", token: "abc" });
    expect(r.success).toBe(false);
  });

  it("aceita 'mvp' com jogoId e token", () => {
    const r = cardQuerySchema.safeParse({ tipo: "mvp", jogoId: "j1", token: "abc" });
    expect(r.success).toBe(true);
  });

  it("rejeita 'ranking' sem escalaoId nem epocaId", () => {
    const r = cardQuerySchema.safeParse({ tipo: "ranking", token: "abc" });
    expect(r.success).toBe(false);
  });

  it("aceita 'ranking' com escalaoId + epocaId + token", () => {
    const r = cardQuerySchema.safeParse({
      tipo: "ranking",
      escalaoId: "e1",
      epocaId: "ep1",
      token: "abc",
    });
    expect(r.success).toBe(true);
  });

  it("rejeita tipo desconhecido", () => {
    const r = cardQuerySchema.safeParse({ tipo: "foo", token: "abc" });
    expect(r.success).toBe(false);
  });

  it("rejeita sem token", () => {
    const r = cardQuerySchema.safeParse({ tipo: "resultado", jogoId: "j1" });
    expect(r.success).toBe(false);
  });

  it("expõe rótulos para todos os tipos", () => {
    for (const t of TIPOS_CARD) expect(LABEL_TIPO_CARD[t]).toBeTruthy();
  });
});

describe("eEscalaoFormacaoJovem (RGPD)", () => {
  it("bloqueia sub-14 e abaixo em várias grafias", () => {
    for (const n of ["Sub-14", "sub 12", "SUB10", "Sub-8", "sub-9", "Sub 11", "Sub-13"]) {
      expect(eEscalaoFormacaoJovem(n)).toBe(true);
    }
  });

  it("bloqueia categorias tradicionais de formação", () => {
    for (const n of ["Petizes", "Traquinas", "Benjamins", "Escolas", "Minis"]) {
      expect(eEscalaoFormacaoJovem(n)).toBe(true);
    }
  });

  it("permite escalões seniores/juvenis acima de 14", () => {
    for (const n of ["Seniores", "Sub-15", "Sub-17", "Sub-19", "Sub-20", "Juniores"]) {
      expect(eEscalaoFormacaoJovem(n)).toBe(false);
    }
  });

  it("lida com nome vazio", () => {
    expect(eEscalaoFormacaoJovem("")).toBe(false);
  });
});

describe("token dos cards", () => {
  it("gera token determinístico para o mesmo recurso", () => {
    const a = gerarTokenCard("resultado", { jogoId: "j1" });
    const b = gerarTokenCard("resultado", { jogoId: "j1" });
    expect(a).toBe(b);
    expect(a.length).toBeGreaterThan(0);
  });

  it("gera tokens diferentes para recursos diferentes", () => {
    const a = gerarTokenCard("resultado", { jogoId: "j1" });
    const b = gerarTokenCard("resultado", { jogoId: "j2" });
    const c = gerarTokenCard("mvp", { jogoId: "j1" });
    expect(a).not.toBe(b);
    expect(a).not.toBe(c);
  });

  it("valida o token correto e rejeita o errado", () => {
    const token = gerarTokenCard("ranking", { escalaoId: "e1", epocaId: "ep1" });
    expect(validarTokenCard("ranking", { escalaoId: "e1", epocaId: "ep1" }, token)).toBe(true);
    expect(validarTokenCard("ranking", { escalaoId: "e1", epocaId: "ep2" }, token)).toBe(false);
    expect(validarTokenCard("ranking", { escalaoId: "e1", epocaId: "ep1" }, "invalido")).toBe(false);
  });

  it("urlCard produz um caminho com tipo, ids e token válidos", () => {
    const url = urlCard("ranking", { escalaoId: "e1", epocaId: "ep1" });
    expect(url.startsWith("/api/social/card?")).toBe(true);
    const q = new URLSearchParams(url.split("?")[1]);
    expect(q.get("tipo")).toBe("ranking");
    expect(q.get("escalaoId")).toBe("e1");
    expect(q.get("epocaId")).toBe("ep1");
    expect(validarTokenCard("ranking", { escalaoId: "e1", epocaId: "ep1" }, q.get("token")!)).toBe(true);
  });

  it("urlCard de resultado inclui jogoId e não inclui escalaoId/epocaId", () => {
    const url = urlCard("resultado", { jogoId: "j1" });
    const q = new URLSearchParams(url.split("?")[1]);
    expect(q.get("jogoId")).toBe("j1");
    expect(q.get("escalaoId")).toBeNull();
    expect(q.get("epocaId")).toBeNull();
  });
});
