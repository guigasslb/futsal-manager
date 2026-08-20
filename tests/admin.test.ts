import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// ─── Mocks ───────────────────────────────────────────────────────────────────
// admin-guard.ts importa auth e redirect, mas eAdminPlataforma é um predicado
// puro que não os usa em runtime — isolar para não requerer env de Next.js.
vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

import { eAdminPlataforma } from "@/lib/admin-guard";
import {
  AlterarEstadoLicencaSchema,
  EditarDataFimLicencaSchema,
} from "@/lib/schemas/admin";

// ─── eAdminPlataforma ─────────────────────────────────────────────────────────

describe("eAdminPlataforma — allowlist de acesso ao backoffice", () => {
  const ENV_KEY = "ADMIN_EMAILS";
  let original: string | undefined;

  beforeEach(() => {
    original = process.env[ENV_KEY];
  });

  afterEach(() => {
    if (original === undefined) {
      delete process.env[ENV_KEY];
    } else {
      process.env[ENV_KEY] = original;
    }
  });

  it("devolve true quando o email está na allowlist", () => {
    process.env[ENV_KEY] = "admin@teste.pt,outro@teste.pt";
    expect(eAdminPlataforma("admin@teste.pt")).toBe(true);
  });

  it("devolve false quando o email não está na allowlist", () => {
    process.env[ENV_KEY] = "admin@teste.pt";
    expect(eAdminPlataforma("intruso@malicio.so")).toBe(false);
  });

  it("comparação case-insensitive: email em maiúsculas é reconhecido", () => {
    process.env[ENV_KEY] = "admin@teste.pt";
    expect(eAdminPlataforma("ADMIN@TESTE.PT")).toBe(true);
  });

  it("comparação case-insensitive: allowlist em maiúsculas é reconhecida", () => {
    process.env[ENV_KEY] = "ADMIN@TESTE.PT";
    expect(eAdminPlataforma("admin@teste.pt")).toBe(true);
  });

  it("allowlist com espaços à volta das vírgulas é tratada corretamente", () => {
    process.env[ENV_KEY] = "admin@a.pt , outro@b.pt , terceiro@c.pt";
    expect(eAdminPlataforma("outro@b.pt")).toBe(true);
  });

  it("espaços no input do email são ignorados via trim", () => {
    process.env[ENV_KEY] = "admin@teste.pt";
    expect(eAdminPlataforma("  admin@teste.pt  ")).toBe(true);
  });

  it("devolve false quando ADMIN_EMAILS está undefined", () => {
    delete process.env[ENV_KEY];
    expect(eAdminPlataforma("admin@teste.pt")).toBe(false);
  });

  it("devolve false quando ADMIN_EMAILS é string vazia", () => {
    process.env[ENV_KEY] = "";
    expect(eAdminPlataforma("admin@teste.pt")).toBe(false);
  });

  it("devolve false quando ADMIN_EMAILS contém apenas vírgulas", () => {
    process.env[ENV_KEY] = ",,,";
    expect(eAdminPlataforma("admin@teste.pt")).toBe(false);
  });

  it("devolve false quando o email passado é null", () => {
    process.env[ENV_KEY] = "admin@teste.pt";
    expect(eAdminPlataforma(null)).toBe(false);
  });

  it("devolve false quando o email passado é undefined", () => {
    process.env[ENV_KEY] = "admin@teste.pt";
    expect(eAdminPlataforma(undefined)).toBe(false);
  });

  it("devolve false quando o email passado é string vazia", () => {
    process.env[ENV_KEY] = "admin@teste.pt";
    expect(eAdminPlataforma("")).toBe(false);
  });
});

// ─── AlterarEstadoLicencaSchema ───────────────────────────────────────────────

const CUID = "ckv9v0z1w0000abcd1234efgh";

describe("AlterarEstadoLicencaSchema", () => {
  it("aceita estado ATIVA com licencaId válido", () => {
    const r = AlterarEstadoLicencaSchema.safeParse({ licencaId: CUID, estado: "ATIVA" });
    expect(r.success).toBe(true);
  });

  it("aceita estado SUSPENSA", () => {
    const r = AlterarEstadoLicencaSchema.safeParse({ licencaId: CUID, estado: "SUSPENSA" });
    expect(r.success).toBe(true);
  });

  it("aceita estado CANCELADA", () => {
    const r = AlterarEstadoLicencaSchema.safeParse({ licencaId: CUID, estado: "CANCELADA" });
    expect(r.success).toBe(true);
  });

  it("rejeita estado EXPIRADA — é estado derivado, nunca definido manualmente", () => {
    const r = AlterarEstadoLicencaSchema.safeParse({ licencaId: CUID, estado: "EXPIRADA" });
    expect(r.success).toBe(false);
  });

  it("rejeita estado arbitrário inválido", () => {
    const r = AlterarEstadoLicencaSchema.safeParse({ licencaId: CUID, estado: "PENDENTE" });
    expect(r.success).toBe(false);
  });

  it("rejeita licencaId que não é CUID", () => {
    const r = AlterarEstadoLicencaSchema.safeParse({ licencaId: "nao-e-um-cuid", estado: "ATIVA" });
    expect(r.success).toBe(false);
    if (!r.success) {
      const campos = r.error.flatten().fieldErrors;
      expect(campos.licencaId).toBeTruthy();
    }
  });

  it("rejeita quando licencaId está ausente", () => {
    const r = AlterarEstadoLicencaSchema.safeParse({ estado: "ATIVA" });
    expect(r.success).toBe(false);
  });

  it("rejeita quando estado está ausente", () => {
    const r = AlterarEstadoLicencaSchema.safeParse({ licencaId: CUID });
    expect(r.success).toBe(false);
  });
});

// ─── EditarDataFimLicencaSchema ───────────────────────────────────────────────

describe("EditarDataFimLicencaSchema", () => {
  it("aceita data futura como string ISO — coerce para Date", () => {
    const r = EditarDataFimLicencaSchema.safeParse({
      licencaId: CUID,
      dataFim: "2027-12-31",
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.dataFim).toBeInstanceOf(Date);
  });

  it("aceita dataFim como null (licença perpétua/sem expiração)", () => {
    const r = EditarDataFimLicencaSchema.safeParse({ licencaId: CUID, dataFim: null });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.dataFim).toBeNull();
  });

  it("aceita dataFim como objeto Date diretamente", () => {
    const r = EditarDataFimLicencaSchema.safeParse({
      licencaId: CUID,
      dataFim: new Date("2027-06-01"),
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.dataFim).toBeInstanceOf(Date);
  });

  it("rejeita dataFim como string não-data", () => {
    const r = EditarDataFimLicencaSchema.safeParse({ licencaId: CUID, dataFim: "não-é-data" });
    expect(r.success).toBe(false);
  });

  it("rejeita licencaId inválido", () => {
    const r = EditarDataFimLicencaSchema.safeParse({
      licencaId: "invalido",
      dataFim: "2027-12-31",
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      const campos = r.error.flatten().fieldErrors;
      expect(campos.licencaId).toBeTruthy();
    }
  });

  it("rejeita quando licencaId está ausente", () => {
    const r = EditarDataFimLicencaSchema.safeParse({ dataFim: "2027-12-31" });
    expect(r.success).toBe(false);
  });

  it("rejeita quando dataFim está ausente (undefined — campo obrigatório)", () => {
    const r = EditarDataFimLicencaSchema.safeParse({ licencaId: CUID });
    expect(r.success).toBe(false);
  });
});
