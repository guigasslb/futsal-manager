import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ───────────────────────────────────────────────────────────────────
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: vi.fn(), signIn: vi.fn(), signOut: vi.fn(), handlers: {} }));
vi.mock("@/lib/permissoes", () => ({ obterMembroAtual: vi.fn() }));

vi.mock("@/lib/db", () => ({
  prisma: {
    utilizador: { findUnique: vi.fn(), create: vi.fn() },
    membroClube: { findFirst: vi.fn(), create: vi.fn() },
    clube: { create: vi.fn(), update: vi.fn() },
    epoca: { create: vi.fn() },
    escalao: { create: vi.fn() },
    perfil: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import { criarClube } from "@/lib/actions/onboarding";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const mocked = <T,>(fn: T) =>
  fn as unknown as {
    mockResolvedValue: (v: unknown) => void;
    mockImplementation: (f: (...a: unknown[]) => unknown) => void;
  };

type Calls = { mock: { calls: unknown[][] } };
const calls = (fn: unknown) => (fn as unknown as Calls).mock.calls;

beforeEach(() => {
  vi.clearAllMocks();

  // Sessão válida por defeito.
  mocked(auth).mockResolvedValue({ user: { id: "user1", name: "Treinador" } });
  // Utilizador da sessão existe.
  mocked(prisma.utilizador.findUnique).mockResolvedValue({ id: "user1" });
  // Sem adesão ativa prévia.
  mocked(prisma.membroClube.findFirst).mockResolvedValue(null);

  // Writes dentro da transação.
  mocked(prisma.clube.create).mockResolvedValue({ id: "clube1" });
  mocked(prisma.epoca.create).mockResolvedValue({ id: "epoca1" });
  mocked(prisma.escalao.create).mockResolvedValue({ id: "escalao1" });
  mocked(prisma.perfil.create).mockImplementation((args: unknown) => {
    const { data } = args as { data: { nome: string } };
    return Promise.resolve({ id: `perfil-${data.nome}` });
  });
  mocked(prisma.membroClube.create).mockResolvedValue({ id: "membro1" });

  // $transaction interativo: invoca o callback com o próprio prisma como `tx`.
  mocked(prisma.$transaction).mockImplementation((arg: unknown) =>
    typeof arg === "function"
      ? (arg as (tx: unknown) => unknown)(prisma)
      : Promise.all(arg as unknown[]),
  );
});

describe("criarClube — semeia época ativa + escalão (P1.6)", () => {
  it("cria uma época ativa para o novo clube", async () => {
    const r = await criarClube({ nome: "Juventude SC" });

    expect(r.sucesso).toBe(true);
    expect(prisma.epoca.create).toHaveBeenCalledOnce();

    const arg = calls(prisma.epoca.create)[0][0] as {
      data: {
        clubeId: string;
        ativa: boolean;
        nome: string;
        dataInicio: Date;
        dataFim: Date;
      };
    };
    expect(arg.data.clubeId).toBe("clube1");
    expect(arg.data.ativa).toBe(true);
    // Nome no formato "AAAA/AAAA" (época desportiva).
    expect(arg.data.nome).toMatch(/^\d{4}\/\d{4}$/);
    expect(arg.data.dataInicio).toBeInstanceOf(Date);
    expect(arg.data.dataFim).toBeInstanceOf(Date);
    expect(arg.data.dataInicio.getTime()).toBeLessThan(arg.data.dataFim.getTime());
  });

  it("cria o escalão-semente 'Seniores' editável e visível", async () => {
    const r = await criarClube({ nome: "Juventude SC" });

    expect(r.sucesso).toBe(true);
    expect(prisma.escalao.create).toHaveBeenCalledOnce();

    const arg = calls(prisma.escalao.create)[0][0] as {
      data: {
        clubeId: string;
        nome: string;
        ordem: number;
        visivelOutrosTreinadores: boolean;
      };
    };
    expect(arg.data).toMatchObject({
      clubeId: "clube1",
      nome: "Seniores",
      ordem: 1,
      visivelOutrosTreinadores: true,
    });
  });

  it("semeia época e escalão dentro da mesma transação do clube", async () => {
    await criarClube({ nome: "Juventude SC" });

    expect(prisma.$transaction).toHaveBeenCalledOnce();
    expect(prisma.clube.create).toHaveBeenCalledOnce();
    expect(prisma.epoca.create).toHaveBeenCalledOnce();
    expect(prisma.escalao.create).toHaveBeenCalledOnce();
    // O membro administrador continua a ser criado (regressão do fluxo base).
    expect(prisma.membroClube.create).toHaveBeenCalledOnce();
  });

  it("devolve o id do clube criado", async () => {
    const r = await criarClube({ nome: "Juventude SC" });
    expect(r.sucesso).toBe(true);
    if (r.sucesso) expect(r.dados.clubeId).toBe("clube1");
  });

  it("não semeia nada quando a sessão é inválida", async () => {
    mocked(auth).mockResolvedValue(null);

    const r = await criarClube({ nome: "Juventude SC" });
    expect(r.sucesso).toBe(false);
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.epoca.create).not.toHaveBeenCalled();
    expect(prisma.escalao.create).not.toHaveBeenCalled();
  });

  it("não semeia nada quando já existe uma adesão ativa", async () => {
    mocked(prisma.membroClube.findFirst).mockResolvedValue({ id: "membro-existente" });

    const r = await criarClube({ nome: "Juventude SC" });
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.erro).toMatch(/adesão ativa/i);
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.epoca.create).not.toHaveBeenCalled();
  });

  it("rejeita input inválido sem tocar na base de dados", async () => {
    const r = await criarClube({ nome: "" });
    expect(r.sucesso).toBe(false);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
