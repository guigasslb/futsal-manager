import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks (hoisted pelo Vitest) ─────────────────────────────────────────────
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  handlers: {},
}));

vi.mock("@/lib/permissoes", () => ({
  obterMembroAtual: vi.fn(),
  exigirCapacidade: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    registoCarreira: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  criarRegistoCarreiraSchema,
  atualizarRegistoCarreiraSchema,
  idRegistoCarreiraSchema,
} from "@/lib/schemas/perfil";
import {
  obterRegistosCarreira,
  obterResumoCarreira,
  criarRegistoCarreira,
  atualizarRegistoCarreira,
  eliminarRegistoCarreira,
} from "@/lib/actions/perfis";

const USER = "ckv9v0z1w0000abcd1234efgh";
const OUTRO = "ckv9v0z1w0001abcd1234efgh";
const REG = "ckv9v0z1w0002abcd1234efgh";

const mocked = <T,>(fn: T) =>
  fn as unknown as {
    mockResolvedValue: (v: unknown) => void;
    mockReturnValue: (v: unknown) => void;
  };

const chamadas = (fn: unknown) =>
  (fn as { mock: { calls: unknown[][] } }).mock.calls;

// ─────────────────────────────────────────────────────────────────────────────
// 1. Schemas (puros)
// ─────────────────────────────────────────────────────────────────────────────

describe("criarRegistoCarreiraSchema (P2.4 — histórico de carreira)", () => {
  const base = { clube: "Sporting CP", escalao: "Seniores", epocaInicio: "2022/2023" };

  it("aceita um registo mínimo (clube, escalão, época início)", () => {
    const r = criarRegistoCarreiraSchema.safeParse(base);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.clube).toBe("Sporting CP");
      expect(r.data.epocaFim).toBeUndefined();
    }
  });

  it("aceita campos opcionais (épocaFim, conquistas, notas)", () => {
    const r = criarRegistoCarreiraSchema.safeParse({
      ...base,
      epocaFim: "2023/2024",
      conquistas: "Campeão Distrital",
      notas: "Época de arranque",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.epocaFim).toBe("2023/2024");
      expect(r.data.conquistas).toBe("Campeão Distrital");
    }
  });

  it("faz trim dos campos de texto", () => {
    const r = criarRegistoCarreiraSchema.safeParse({
      clube: "  Benfica  ",
      escalao: " Sub-17 ",
      epocaInicio: " 2021/2022 ",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.clube).toBe("Benfica");
      expect(r.data.escalao).toBe("Sub-17");
      expect(r.data.epocaInicio).toBe("2021/2022");
    }
  });

  it("rejeita clube em falta", () => {
    const r = criarRegistoCarreiraSchema.safeParse({
      escalao: "Seniores",
      epocaInicio: "2022/2023",
    });
    expect(r.success).toBe(false);
  });

  it("rejeita escalão vazio", () => {
    const r = criarRegistoCarreiraSchema.safeParse({ ...base, escalao: "" });
    expect(r.success).toBe(false);
  });

  it("rejeita época de início em falta", () => {
    const r = criarRegistoCarreiraSchema.safeParse({
      clube: "Sporting CP",
      escalao: "Seniores",
    });
    expect(r.success).toBe(false);
  });

  it("rejeita clube com menos de 2 caracteres", () => {
    const r = criarRegistoCarreiraSchema.safeParse({ ...base, clube: "x" });
    expect(r.success).toBe(false);
  });

  it("rejeita conquistas acima de 500 caracteres", () => {
    const r = criarRegistoCarreiraSchema.safeParse({
      ...base,
      conquistas: "x".repeat(501),
    });
    expect(r.success).toBe(false);
  });
});

describe("atualizarRegistoCarreiraSchema", () => {
  it("aceita atualização parcial (só conquistas)", () => {
    const r = atualizarRegistoCarreiraSchema.safeParse({ conquistas: "Vice-campeão" });
    expect(r.success).toBe(true);
  });

  it("aceita objeto vazio (nenhum campo a alterar)", () => {
    const r = atualizarRegistoCarreiraSchema.safeParse({});
    expect(r.success).toBe(true);
  });

  it("rejeita clube demasiado curto quando presente", () => {
    const r = atualizarRegistoCarreiraSchema.safeParse({ clube: "x" });
    expect(r.success).toBe(false);
  });
});

describe("idRegistoCarreiraSchema", () => {
  it("aceita um cuid", () => {
    expect(idRegistoCarreiraSchema.safeParse(REG).success).toBe(true);
  });

  it("rejeita um id inválido", () => {
    expect(idRegistoCarreiraSchema.safeParse("nope").success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Server Actions
// ─────────────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mocked(auth).mockResolvedValue({ user: { id: USER } });
});

describe("obterRegistosCarreira", () => {
  it("recusa sem sessão", async () => {
    mocked(auth).mockResolvedValue(null);
    const r = await obterRegistosCarreira();
    expect(r.sucesso).toBe(false);
    expect(chamadas(prisma.registoCarreira.findMany)).toHaveLength(0);
  });

  it("filtra pelo utilizador autenticado e ordena por ordem desc", async () => {
    mocked(prisma.registoCarreira.findMany).mockResolvedValue([{ id: REG }]);
    const r = await obterRegistosCarreira();
    expect(r.sucesso).toBe(true);
    const [args] = chamadas(prisma.registoCarreira.findMany)[0] as [
      { where: { utilizadorId: string }; orderBy: unknown },
    ];
    expect(args.where.utilizadorId).toBe(USER);
    expect(args.orderBy).toEqual([{ ordem: "desc" }, { createdAt: "desc" }]);
  });
});

describe("obterResumoCarreira (P4.5 — métricas de carreira)", () => {
  it("recusa sem sessão", async () => {
    mocked(auth).mockResolvedValue(null);
    const r = await obterResumoCarreira();
    expect(r.sucesso).toBe(false);
    expect(chamadas(prisma.registoCarreira.findMany)).toHaveLength(0);
  });

  it("devolve zeros quando não há registos", async () => {
    mocked(prisma.registoCarreira.findMany).mockResolvedValue([]);
    const r = await obterResumoCarreira();
    expect(r.sucesso).toBe(true);
    if (r.sucesso) {
      expect(r.dados).toEqual({
        totalRegistos: 0,
        clubesDistintos: 0,
        epocasAtivas: 0,
        conquistasTotal: 0,
        primeiraEpoca: null,
      });
    }
    // filtra pelo utilizador autenticado
    const [args] = chamadas(prisma.registoCarreira.findMany)[0] as [
      { where: { utilizadorId: string } },
    ];
    expect(args.where.utilizadorId).toBe(USER);
  });

  it("agrega 3 registos (2 clubes, 1 conquista, 1 em curso)", async () => {
    mocked(prisma.registoCarreira.findMany).mockResolvedValue([
      {
        clube: "Sporting CP",
        epocaInicio: "2022/2023",
        epocaFim: "2023/2024",
        conquistas: "Campeão Distrital",
      },
      {
        clube: "Sporting CP",
        epocaInicio: "2021/2022",
        epocaFim: "2022/2023",
        conquistas: null,
      },
      {
        clube: "Benfica",
        epocaInicio: "2024/2025",
        epocaFim: null,
        conquistas: "  ",
      },
    ]);
    const r = await obterResumoCarreira();
    expect(r.sucesso).toBe(true);
    if (r.sucesso) {
      expect(r.dados).toEqual({
        totalRegistos: 3,
        clubesDistintos: 2,
        epocasAtivas: 1,
        conquistasTotal: 1,
        primeiraEpoca: "2021/2022",
      });
    }
  });
});

describe("criarRegistoCarreira", () => {
  const dados = { clube: "Sporting CP", escalao: "Seniores", epocaInicio: "2022/2023" };

  it("recusa sem sessão", async () => {
    mocked(auth).mockResolvedValue(null);
    const r = await criarRegistoCarreira(dados);
    expect(r.sucesso).toBe(false);
    expect(chamadas(prisma.registoCarreira.create)).toHaveLength(0);
  });

  it("recusa dados inválidos (sem tocar na BD)", async () => {
    const r = await criarRegistoCarreira({ clube: "x" });
    expect(r.sucesso).toBe(false);
    expect(chamadas(prisma.registoCarreira.create)).toHaveLength(0);
  });

  it("cria com a ordem acima do máximo atual e revalida /perfil", async () => {
    mocked(prisma.registoCarreira.findFirst).mockResolvedValue({ ordem: 3 });
    mocked(prisma.registoCarreira.create).mockResolvedValue({ id: REG });
    const r = await criarRegistoCarreira(dados);
    expect(r.sucesso).toBe(true);
    const [args] = chamadas(prisma.registoCarreira.create)[0] as [
      { data: { utilizadorId: string; ordem: number } },
    ];
    expect(args.data.utilizadorId).toBe(USER);
    expect(args.data.ordem).toBe(4);
    expect(chamadas(revalidatePath)[0]).toEqual(["/perfil"]);
  });

  it("assume ordem 1 quando não há registos", async () => {
    mocked(prisma.registoCarreira.findFirst).mockResolvedValue(null);
    mocked(prisma.registoCarreira.create).mockResolvedValue({ id: REG });
    await criarRegistoCarreira(dados);
    const [args] = chamadas(prisma.registoCarreira.create)[0] as [
      { data: { ordem: number } },
    ];
    expect(args.data.ordem).toBe(1);
  });
});

describe("atualizarRegistoCarreira", () => {
  it("recusa editar registo de outro utilizador (ownership)", async () => {
    mocked(prisma.registoCarreira.findUnique).mockResolvedValue({
      id: REG,
      utilizadorId: OUTRO,
    });
    const r = await atualizarRegistoCarreira(REG, { conquistas: "Hack" });
    expect(r.sucesso).toBe(false);
    expect(chamadas(prisma.registoCarreira.update)).toHaveLength(0);
  });

  it("atualiza o próprio registo", async () => {
    mocked(prisma.registoCarreira.findUnique).mockResolvedValue({
      id: REG,
      utilizadorId: USER,
    });
    mocked(prisma.registoCarreira.update).mockResolvedValue({ id: REG });
    const r = await atualizarRegistoCarreira(REG, { conquistas: "Campeão" });
    expect(r.sucesso).toBe(true);
    expect(chamadas(prisma.registoCarreira.update)).toHaveLength(1);
    expect(chamadas(revalidatePath)[0]).toEqual(["/perfil"]);
  });
});

describe("eliminarRegistoCarreira", () => {
  it("recusa sem sessão", async () => {
    mocked(auth).mockResolvedValue(null);
    const r = await eliminarRegistoCarreira(REG);
    expect(r.sucesso).toBe(false);
    expect(chamadas(prisma.registoCarreira.delete)).toHaveLength(0);
  });

  it("recusa eliminar registo de outro utilizador (ownership)", async () => {
    mocked(prisma.registoCarreira.findUnique).mockResolvedValue({
      id: REG,
      utilizadorId: OUTRO,
    });
    const r = await eliminarRegistoCarreira(REG);
    expect(r.sucesso).toBe(false);
    expect(chamadas(prisma.registoCarreira.delete)).toHaveLength(0);
  });

  it("elimina o próprio registo e revalida /perfil", async () => {
    mocked(prisma.registoCarreira.findUnique).mockResolvedValue({
      id: REG,
      utilizadorId: USER,
    });
    mocked(prisma.registoCarreira.delete).mockResolvedValue({ id: REG });
    const r = await eliminarRegistoCarreira(REG);
    expect(r.sucesso).toBe(true);
    expect(chamadas(prisma.registoCarreira.delete)[0]).toEqual([
      { where: { id: REG } },
    ]);
    expect(chamadas(revalidatePath)[0]).toEqual(["/perfil"]);
  });
});
