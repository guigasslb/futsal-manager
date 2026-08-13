import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ───────────────────────────────────────────────────────────────────
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/permissoes", () => ({
  obterMembroAtual: vi.fn(),
  exigirCapacidade: vi.fn(),
}));
vi.mock("@/lib/db", () => ({
  prisma: {
    lembrete: {
      findMany: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    membroClube: { findMany: vi.fn() },
    lembreteDestinatario: { findUnique: vi.fn(), update: vi.fn() },
  },
}));

import {
  obterLembretes,
  criarLembrete,
  atualizarLembrete,
  eliminarLembrete,
  marcarVisto,
} from "@/lib/actions/lembretes";
import { auth } from "@/lib/auth";
import { obterMembroAtual, exigirCapacidade } from "@/lib/permissoes";
import { prisma } from "@/lib/db";

// ─── Constantes ───────────────────────────────────────────────────────────────
const CUID    = "ckv9v0z1w0000abcd1234efgh";
const CUID2   = "ckv9v0z1w0001abcd1234efgh";
const USER_ID = "ckv9v0z1w0002abcd1234efgh";
const OUTRO   = "ckv9v0z1w0003abcd1234efgh";

const mocked = <T,>(fn: T) => fn as unknown as {
  mockResolvedValue: (v: unknown) => void;
  mockImplementation: (f: (...a: unknown[]) => unknown) => void;
};

const calls = (fn: unknown) => (fn as { mock: { calls: unknown[][] } }).mock.calls;

const CTX     = { utilizadorId: USER_ID, membroId: "mem1", clube: { id: "clube1" } };
const PERM_OK = { ok: true, ctx: CTX };

const LEMBRETE_BD = {
  id: CUID,
  titulo: "Reunião semanal",
  descricao: null,
  dataLimite: null,
  concluido: false,
  criadoPorId: USER_ID,
  createdAt: new Date("2026-08-01"),
  criadoPor: { nome: "João Silva" },
  destinatarios: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  mocked(obterMembroAtual).mockResolvedValue(CTX);
  mocked(exigirCapacidade).mockResolvedValue(PERM_OK);
  mocked(auth).mockResolvedValue({ user: { id: USER_ID } });
  mocked(prisma.lembrete.findMany).mockResolvedValue([]);
  mocked(prisma.lembrete.create).mockResolvedValue({ id: CUID });
  mocked(prisma.lembrete.findFirst).mockResolvedValue({ id: CUID, criadoPorId: USER_ID });
  mocked(prisma.lembrete.update).mockResolvedValue({ id: CUID });
  mocked(prisma.lembrete.delete).mockResolvedValue(undefined);
  mocked(prisma.membroClube.findMany).mockResolvedValue([]);
  mocked(prisma.lembreteDestinatario.findUnique).mockResolvedValue({ id: "ld1" });
  mocked(prisma.lembreteDestinatario.update).mockResolvedValue({ id: "ld1" });
});

// ─── obterLembretes ───────────────────────────────────────────────────────────
describe("obterLembretes", () => {
  it("retorna erro quando não autenticado (obterMembroAtual null)", async () => {
    mocked(obterMembroAtual).mockResolvedValue(null);
    const r = await obterLembretes();
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.erro).toMatch(/sem acesso/i);
    expect(prisma.lembrete.findMany).not.toHaveBeenCalled();
  });

  it("filtra por clubeId do utilizador autenticado (isolamento multi-tenant)", async () => {
    await obterLembretes();
    const arg = calls(prisma.lembrete.findMany)[0][0] as { where: { clubeId: string } };
    expect(arg.where.clubeId).toBe("clube1");
  });

  it("devolve lista vazia quando não há lembretes relevantes", async () => {
    const r = await obterLembretes();
    expect(r.sucesso).toBe(true);
    if (r.sucesso) expect(r.dados).toHaveLength(0);
  });

  it("mapeia DTO: souCriador=true e visto=true quando é criador e destinatário que viu", async () => {
    mocked(prisma.lembrete.findMany).mockResolvedValue([
      {
        ...LEMBRETE_BD,
        criadoPorId: USER_ID,
        destinatarios: [{ utilizadorId: USER_ID, visto: true }],
      },
    ]);
    const r = await obterLembretes();
    expect(r.sucesso).toBe(true);
    if (r.sucesso) {
      expect(r.dados[0].souCriador).toBe(true);
      expect(r.dados[0].souDestinatario).toBe(true);
      expect(r.dados[0].visto).toBe(true);
    }
  });

  it("souCriador=false, souDestinatario=false, visto=false para lembrete de outro sem destinatário", async () => {
    mocked(prisma.lembrete.findMany).mockResolvedValue([
      { ...LEMBRETE_BD, criadoPorId: OUTRO, destinatarios: [] },
    ]);
    const r = await obterLembretes();
    expect(r.sucesso).toBe(true);
    if (r.sucesso) {
      expect(r.dados[0].souCriador).toBe(false);
      expect(r.dados[0].souDestinatario).toBe(false);
      expect(r.dados[0].visto).toBe(false);
    }
  });
});

// ─── criarLembrete ────────────────────────────────────────────────────────────
describe("criarLembrete", () => {
  it("rejeita utilizador sem permissão LEMBRETES_EQUIPA_GERIR", async () => {
    mocked(exigirCapacidade).mockResolvedValue({ ok: false, erro: "Sem permissão" });
    const r = await criarLembrete({ titulo: "Teste", destinatarioIds: [] });
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.erro).toMatch(/sem permissão/i);
    expect(prisma.lembrete.create).not.toHaveBeenCalled();
  });

  it("rejeita input inválido (sem título) com erroDeValidacao (camposInvalidos preenchido)", async () => {
    const r = await criarLembrete({ destinatarioIds: [] });
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.camposInvalidos).toBeTruthy();
    expect(prisma.lembrete.create).not.toHaveBeenCalled();
  });

  it("rejeita destinatário que não pertence ao clube (isolamento multi-tenant)", async () => {
    // membroClube.findMany devolve [] — o ID pedido não existe no clube
    mocked(prisma.membroClube.findMany).mockResolvedValue([]);
    const r = await criarLembrete({ titulo: "Aviso externo", destinatarioIds: [CUID2] });
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.erro).toMatch(/não pertencem ao clube/i);
    expect(prisma.lembrete.create).not.toHaveBeenCalled();
  });

  it("cria lembrete com sucesso quando sem destinatários", async () => {
    const r = await criarLembrete({ titulo: "Tarefa simples", destinatarioIds: [] });
    expect(r.sucesso).toBe(true);
    if (r.sucesso) expect(r.dados.id).toBe(CUID);
    expect(prisma.lembrete.create).toHaveBeenCalledOnce();
  });

  it("verifica membership com filtro por clubeId ao criar com destinatário", async () => {
    mocked(prisma.membroClube.findMany).mockResolvedValue([{ utilizadorId: CUID2 }] as never[]);
    await criarLembrete({ titulo: "Aviso ao adjunto", destinatarioIds: [CUID2] });
    const arg = calls(prisma.membroClube.findMany)[0][0] as { where: { clubeId: string } };
    expect(arg.where.clubeId).toBe("clube1");
  });
});

// ─── atualizarLembrete ────────────────────────────────────────────────────────
describe("atualizarLembrete", () => {
  it("retorna erro quando não autenticado (obterMembroAtual null)", async () => {
    mocked(obterMembroAtual).mockResolvedValue(null);
    const r = await atualizarLembrete({ id: CUID, concluido: true });
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.erro).toMatch(/sem acesso/i);
    expect(prisma.lembrete.update).not.toHaveBeenCalled();
  });

  it("rejeita id inválido (não é cuid) com erroDeValidacao", async () => {
    const r = await atualizarLembrete({ id: "nao-e-cuid", concluido: true });
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.camposInvalidos).toBeTruthy();
    expect(prisma.lembrete.update).not.toHaveBeenCalled();
  });

  it("retorna erro quando lembrete não existe no clube (isolamento multi-tenant)", async () => {
    mocked(prisma.lembrete.findFirst).mockResolvedValue(null);
    const r = await atualizarLembrete({ id: CUID, concluido: true });
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.erro).toMatch(/não encontrado/i);
    expect(prisma.lembrete.update).not.toHaveBeenCalled();
  });

  it("rejeita edição por utilizador que não é o criador", async () => {
    mocked(prisma.lembrete.findFirst).mockResolvedValue({ id: CUID, criadoPorId: OUTRO });
    const r = await atualizarLembrete({ id: CUID, titulo: "Alterado" });
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.erro).toMatch(/só o criador/i);
    expect(prisma.lembrete.update).not.toHaveBeenCalled();
  });

  it("permite edição pelo criador do lembrete", async () => {
    mocked(prisma.lembrete.findFirst).mockResolvedValue({ id: CUID, criadoPorId: USER_ID });
    const r = await atualizarLembrete({ id: CUID, titulo: "Novo título", concluido: true });
    expect(r.sucesso).toBe(true);
    expect(prisma.lembrete.update).toHaveBeenCalledOnce();
  });
});

// ─── eliminarLembrete ─────────────────────────────────────────────────────────
describe("eliminarLembrete", () => {
  it("rejeita utilizador sem permissão LEMBRETES_EQUIPA_GERIR", async () => {
    mocked(exigirCapacidade).mockResolvedValue({ ok: false, erro: "Sem permissão" });
    const r = await eliminarLembrete(CUID);
    expect(r.sucesso).toBe(false);
    expect(prisma.lembrete.delete).not.toHaveBeenCalled();
  });

  it("retorna erro quando lembrete não existe no clube", async () => {
    mocked(prisma.lembrete.findFirst).mockResolvedValue(null);
    const r = await eliminarLembrete(CUID);
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.erro).toMatch(/não encontrado/i);
    expect(prisma.lembrete.delete).not.toHaveBeenCalled();
  });

  it("rejeita eliminação por utilizador que não é o criador", async () => {
    mocked(prisma.lembrete.findFirst).mockResolvedValue({ id: CUID, criadoPorId: OUTRO });
    const r = await eliminarLembrete(CUID);
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.erro).toMatch(/só o criador/i);
    expect(prisma.lembrete.delete).not.toHaveBeenCalled();
  });

  it("elimina com sucesso quando é o criador e tem permissão", async () => {
    mocked(prisma.lembrete.findFirst).mockResolvedValue({ id: CUID, criadoPorId: USER_ID });
    const r = await eliminarLembrete(CUID);
    expect(r.sucesso).toBe(true);
    expect(prisma.lembrete.delete).toHaveBeenCalledOnce();
    const arg = calls(prisma.lembrete.delete)[0][0] as { where: { id: string } };
    expect(arg.where.id).toBe(CUID);
  });
});

// ─── marcarVisto ──────────────────────────────────────────────────────────────
describe("marcarVisto", () => {
  it("retorna erro quando não autenticado (sessão null)", async () => {
    mocked(auth).mockResolvedValue(null);
    const r = await marcarVisto(CUID);
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.erro).toMatch(/não autenticado/i);
    expect(prisma.lembreteDestinatario.update).not.toHaveBeenCalled();
  });

  it("rejeita id inválido (string que não é cuid) com erroDeValidacao", async () => {
    const r = await marcarVisto("nao-e-um-cuid");
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.camposInvalidos).toBeTruthy();
    expect(prisma.lembreteDestinatario.update).not.toHaveBeenCalled();
  });

  it("retorna erro quando o utilizador não é destinatário do lembrete", async () => {
    mocked(prisma.lembreteDestinatario.findUnique).mockResolvedValue(null);
    const r = await marcarVisto(CUID);
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.erro).toMatch(/não és destinatário/i);
    expect(prisma.lembreteDestinatario.update).not.toHaveBeenCalled();
  });

  it("marca como visto com sucesso quando é destinatário", async () => {
    const r = await marcarVisto(CUID);
    expect(r.sucesso).toBe(true);
    expect(prisma.lembreteDestinatario.update).toHaveBeenCalledOnce();
    const arg = calls(prisma.lembreteDestinatario.update)[0][0] as { data: { visto: boolean } };
    expect(arg.data.visto).toBe(true);
  });

  it("consulta destinatário por lembreteId e utilizadorId da sessão", async () => {
    await marcarVisto(CUID);
    const arg = calls(prisma.lembreteDestinatario.findUnique)[0][0] as {
      where: { lembreteId_utilizadorId: { lembreteId: string; utilizadorId: string } };
    };
    expect(arg.where.lembreteId_utilizadorId.lembreteId).toBe(CUID);
    expect(arg.where.lembreteId_utilizadorId.utilizadorId).toBe(USER_ID);
  });
});
