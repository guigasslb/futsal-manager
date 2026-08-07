import { describe, it, expect, vi, beforeEach } from "vitest";

// Mocks necessários apenas para isolar o carregamento do módulo @/lib/permissoes,
// que importa transitivamente prisma e auth ao nível do módulo. A função pura sob
// teste (`capacidadesEfetivas`) não usa nenhum destes — os mocks existem para
// evitar efeitos colaterais de import (instanciar PrismaClient, ler env de auth)
// e para as Server Actions de `definirOverrides` mais abaixo.
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: vi.fn(), signIn: vi.fn(), signOut: vi.fn(), handlers: {} }));

vi.mock("@/lib/db", () => ({
  prisma: {
    membroClube: { findFirst: vi.fn(), findMany: vi.fn(), update: vi.fn() },
    $transaction: vi.fn(),
  },
}));

// Só `exigirCapacidade` é substituída: `capacidadesEfetivas` mantém-se REAL,
// porque é precisamente a lógica que decide quem continua administrador.
vi.mock("@/lib/permissoes", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/permissoes")>()),
  exigirCapacidade: vi.fn(),
}));

import { capacidadesEfetivas, exigirCapacidade } from "@/lib/permissoes";
import { CAPACIDADE_FUTURA_FATURACAO } from "@/lib/permissoes-catalogo";
import { definirOverridesSchema } from "@/lib/schemas/membro";
import { definirOverrides } from "@/lib/actions/membros";
import { prisma } from "@/lib/db";

const CUID = "ckv9v0z1w0000abcd1234efgh";

describe("capacidadesEfetivas", () => {
  it("sem overrides devolve exatamente as capacidades base", () => {
    const base = ["PLANTEL_GERIR", "TREINOS_GERIR"];
    const efetivas = capacidadesEfetivas(base, [], []);
    expect([...efetivas].sort()).toEqual([...base].sort());
    expect(efetivas.size).toBe(2);
  });

  it("extra adiciona uma capacidade que não estava na base", () => {
    const efetivas = capacidadesEfetivas(["PLANTEL_GERIR"], ["TREINOS_GERIR"], []);
    expect(efetivas.has("PLANTEL_GERIR")).toBe(true);
    expect(efetivas.has("TREINOS_GERIR")).toBe(true);
    expect(efetivas.size).toBe(2);
  });

  it("revogadas remove uma capacidade que estava na base", () => {
    const efetivas = capacidadesEfetivas(
      ["PLANTEL_GERIR", "TREINOS_GERIR"],
      [],
      ["TREINOS_GERIR"],
    );
    expect(efetivas.has("PLANTEL_GERIR")).toBe(true);
    expect(efetivas.has("TREINOS_GERIR")).toBe(false);
    expect(efetivas.size).toBe(1);
  });

  it("aplica extra e revogadas na ordem correta: (base ∪ extra) \\ revogadas", () => {
    // JOGOS_GERIR entra por extra; PLANTEL_GERIR (base) sai por revogadas.
    const efetivas = capacidadesEfetivas(
      ["PLANTEL_GERIR"],
      ["JOGOS_GERIR"],
      ["PLANTEL_GERIR"],
    );
    expect([...efetivas]).toEqual(["JOGOS_GERIR"]);
  });

  it("revogar vence sobre extra quando a mesma capacidade está em ambos", () => {
    // ESTATISTICAS_GERIR é adicionada por extra e removida por revogadas → não fica.
    const efetivas = capacidadesEfetivas([], ["ESTATISTICAS_GERIR"], ["ESTATISTICAS_GERIR"]);
    expect(efetivas.has("ESTATISTICAS_GERIR")).toBe(false);
    expect(efetivas.size).toBe(0);
  });

  it("revogar uma capacidade inexistente na base não gera erro e devolve vazio", () => {
    const chamada = () => capacidadesEfetivas([], [], ["JOGOS_GERIR"]);
    expect(chamada).not.toThrow();
    expect(chamada().size).toBe(0);
  });

  it("extra com capacidade já presente na base é idempotente (não duplica)", () => {
    const efetivas = capacidadesEfetivas(["PLANTEL_GERIR"], ["PLANTEL_GERIR"], []);
    expect([...efetivas]).toEqual(["PLANTEL_GERIR"]);
    expect(efetivas.size).toBe(1);
  });

  it("filtra capacidade FUTURA (FATURACAO_GERIR) presente em extra", () => {
    const efetivas = capacidadesEfetivas(
      ["PLANTEL_GERIR"],
      [CAPACIDADE_FUTURA_FATURACAO],
      [],
    );
    expect(efetivas.has("PLANTEL_GERIR")).toBe(true);
    // FATURACAO_GERIR não pertence ao catálogo ativo → ignorada.
    expect([...efetivas]).not.toContain(CAPACIDADE_FUTURA_FATURACAO);
    expect(efetivas.size).toBe(1);
  });

  it("filtra capacidade FUTURA também quando surge na base", () => {
    const efetivas = capacidadesEfetivas(
      [CAPACIDADE_FUTURA_FATURACAO, "PLANTEL_GERIR"],
      [],
      [],
    );
    expect([...efetivas]).toEqual(["PLANTEL_GERIR"]);
  });
});

describe("definirOverridesSchema", () => {
  it("aceita input válido com extra e revogadas", () => {
    const r = definirOverridesSchema.safeParse({
      membroId: CUID,
      extra: ["PLANTEL_GERIR"],
      revogadas: ["TREINOS_GERIR"],
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.extra).toEqual(["PLANTEL_GERIR"]);
      expect(r.data.revogadas).toEqual(["TREINOS_GERIR"]);
    }
  });

  it("aceita arrays vazios para extra e revogadas", () => {
    const r = definirOverridesSchema.safeParse({
      membroId: CUID,
      extra: [],
      revogadas: [],
    });
    expect(r.success).toBe(true);
  });

  it("aplica default [] quando extra e revogadas são omitidos", () => {
    const r = definirOverridesSchema.safeParse({ membroId: CUID });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.extra).toEqual([]);
      expect(r.data.revogadas).toEqual([]);
    }
  });

  it("rejeita capacidade fora do catálogo", () => {
    const r = definirOverridesSchema.safeParse({
      membroId: CUID,
      extra: ["CAPACIDADE_INEXISTENTE"],
      revogadas: [],
    });
    expect(r.success).toBe(false);
  });

  it("rejeita a capacidade FUTURA FATURACAO_GERIR (não está no catálogo ativo)", () => {
    const r = definirOverridesSchema.safeParse({
      membroId: CUID,
      extra: [CAPACIDADE_FUTURA_FATURACAO],
      revogadas: [],
    });
    expect(r.success).toBe(false);
  });

  it("rejeita membroId que não seja cuid", () => {
    const r = definirOverridesSchema.safeParse({
      membroId: "nao-e-cuid",
      extra: [],
      revogadas: [],
    });
    expect(r.success).toBe(false);
  });

  it("permite a mesma capacidade em extra e revogadas; a resolução fica a cargo de capacidadesEfetivas (revogar vence)", () => {
    // O schema não impõe exclusividade — o overlap é comportamento definido:
    // aceite na validação e resolvido deterministicamente na função pura.
    const r = definirOverridesSchema.safeParse({
      membroId: CUID,
      extra: ["ESTATISTICAS_GERIR"],
      revogadas: ["ESTATISTICAS_GERIR"],
    });
    expect(r.success).toBe(true);
    if (r.success) {
      const efetivas = capacidadesEfetivas([], r.data.extra, r.data.revogadas);
      expect(efetivas.has("ESTATISTICAS_GERIR")).toBe(false);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// definirOverrides — delegação e proteção do último administrador (F0)
// ─────────────────────────────────────────────────────────────────────────────

const mocked = <T,>(fn: T) =>
  fn as unknown as {
    mockResolvedValue: (v: unknown) => void;
    mockImplementation: (f: (...a: unknown[]) => unknown) => void;
  };

const chamadas = (fn: unknown) => (fn as { mock: { calls: unknown[][] } }).mock.calls;

const CAPS_ADMIN = ["CLUBE_UTILIZADORES", "CLUBE_PERFIS"];

/** Membro ativo tal como é lido dentro da transação do last-admin check. */
const membroAtivo = (
  id: string,
  capacidades: string[],
  extra: string[] = [],
  revogadas: string[] = [],
) => ({
  id,
  capacidadesExtra: extra,
  capacidadesRevogadas: revogadas,
  perfil: { capacidades },
});

/** Quem chama tem, por defeito, poderes de administração completos. */
function chamanteCom(capacidades: string[]) {
  mocked(exigirCapacidade).mockResolvedValue({
    ok: true,
    ctx: { clube: { id: "clube1" }, capacidades },
  });
}

describe("definirOverrides (F0 — delegação e último administrador)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    chamanteCom([...CAPS_ADMIN, "PLANTEL_GERIR", "TREINOS_GERIR"]);
    mocked(prisma.membroClube.findFirst).mockResolvedValue({
      id: "m1",
      perfil: { capacidades: ["TREINOS_GERIR"] },
    });
    mocked(prisma.membroClube.findMany).mockResolvedValue([
      membroAtivo("m1", ["TREINOS_GERIR"]),
      membroAtivo("m2", CAPS_ADMIN),
    ]);
    mocked(prisma.membroClube.update).mockResolvedValue({ id: "m1" });
    mocked(prisma.$transaction).mockImplementation((arg: unknown) =>
      typeof arg === "function"
        ? (arg as (tx: unknown) => unknown)(prisma)
        : Promise.all(arg as unknown[]),
    );
  });

  it("exige a capacidade CLUBE_UTILIZADORES", async () => {
    mocked(exigirCapacidade).mockResolvedValue({ ok: false, erro: "Sem permissão" });

    const r = await definirOverrides(CUID, [], []);
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.erro).toMatch(/permiss/i);
    expect(prisma.membroClube.findFirst).not.toHaveBeenCalled();
    expect(prisma.membroClube.update).not.toHaveBeenCalled();
  });

  it("verifica a capacidade antes de tudo o resto", async () => {
    await definirOverrides(CUID, [], []);
    expect(chamadas(exigirCapacidade)[0]).toEqual(["CLUBE_UTILIZADORES"]);
  });

  it("falha na validação Zod sem tocar na BD", async () => {
    const r = await definirOverrides("nao-e-cuid", [], []);
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.camposInvalidos?.membroId).toBeTruthy();
    expect(prisma.membroClube.findFirst).not.toHaveBeenCalled();
  });

  it("rejeita capacidade fora do catálogo sem tocar na BD", async () => {
    const r = await definirOverrides(CUID, ["CAPACIDADE_INEXISTENTE"], []);
    expect(r.sucesso).toBe(false);
    expect(prisma.membroClube.findFirst).not.toHaveBeenCalled();
  });

  it("isola por clube: falha se o membro não pertence ao clube ativo", async () => {
    mocked(prisma.membroClube.findFirst).mockResolvedValue(null);

    const r = await definirOverrides(CUID, [], []);
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.erro).toMatch(/não encontrado/i);
    expect(prisma.membroClube.update).not.toHaveBeenCalled();
  });

  // ─── Delegação: só se concede o que se tem ─────────────────────────────────

  it("recusa conceder uma capacidade que o próprio não possui", async () => {
    chamanteCom([...CAPS_ADMIN]); // sem PLANTEL_GERIR

    const r = await definirOverrides(CUID, ["PLANTEL_GERIR"], []);
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.erro).toMatch(/que você próprio possui/i);
    expect(prisma.membroClube.update).not.toHaveBeenCalled();
  });

  it("recusa se apenas UMA das capacidades concedidas estiver fora do seu alcance", async () => {
    chamanteCom([...CAPS_ADMIN, "TREINOS_GERIR"]); // tem TREINOS, não tem JOGOS

    const r = await definirOverrides(CUID, ["TREINOS_GERIR", "JOGOS_GERIR"], []);
    expect(r.sucesso).toBe(false);
    expect(prisma.membroClube.update).not.toHaveBeenCalled();
  });

  it("permite conceder uma capacidade que o próprio possui", async () => {
    const r = await definirOverrides(CUID, ["PLANTEL_GERIR"], []);
    expect(r.sucesso).toBe(true);

    const arg = chamadas(prisma.membroClube.update)[0][0] as {
      where: { id: string };
      data: { capacidadesExtra: string[]; capacidadesRevogadas: string[] };
    };
    expect(arg.where.id).toBe("m1");
    expect(arg.data.capacidadesExtra).toEqual(["PLANTEL_GERIR"]);
    expect(arg.data.capacidadesRevogadas).toEqual([]);
  });

  it("a regra de delegação não se aplica a revogações", async () => {
    // Quem não tem TREINOS_GERIR pode ainda assim revogá-la a outrem.
    chamanteCom([...CAPS_ADMIN]);

    const r = await definirOverrides(CUID, [], ["TREINOS_GERIR"]);
    expect(r.sucesso).toBe(true);

    const arg = chamadas(prisma.membroClube.update)[0][0] as {
      data: { capacidadesRevogadas: string[] };
    };
    expect(arg.data.capacidadesRevogadas).toEqual(["TREINOS_GERIR"]);
  });

  // ─── Proteção do último administrador ──────────────────────────────────────

  it("bloqueia a revogação que deixaria o clube sem administrador", async () => {
    // m1 é o ÚNICO administrador e perderia CLUBE_PERFIS.
    mocked(prisma.membroClube.findFirst).mockResolvedValue({
      id: "m1",
      perfil: { capacidades: CAPS_ADMIN },
    });
    mocked(prisma.membroClube.findMany).mockResolvedValue([
      membroAtivo("m1", CAPS_ADMIN),
      membroAtivo("m2", ["TREINOS_GERIR"]),
    ]);

    const r = await definirOverrides(CUID, [], ["CLUBE_PERFIS"]);
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.erro).toMatch(/último administrador/i);
    expect(prisma.membroClube.update).not.toHaveBeenCalled();
  });

  it("bloqueia também quando se revoga apenas CLUBE_UTILIZADORES ao último admin", async () => {
    mocked(prisma.membroClube.findFirst).mockResolvedValue({
      id: "m1",
      perfil: { capacidades: CAPS_ADMIN },
    });
    mocked(prisma.membroClube.findMany).mockResolvedValue([
      membroAtivo("m1", CAPS_ADMIN),
    ]);

    const r = await definirOverrides(CUID, [], ["CLUBE_UTILIZADORES"]);
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.erro).toMatch(/último administrador/i);
    expect(prisma.membroClube.update).not.toHaveBeenCalled();
  });

  it("permite a revogação quando existe outro administrador ativo", async () => {
    mocked(prisma.membroClube.findFirst).mockResolvedValue({
      id: "m1",
      perfil: { capacidades: CAPS_ADMIN },
    });
    mocked(prisma.membroClube.findMany).mockResolvedValue([
      membroAtivo("m1", CAPS_ADMIN),
      membroAtivo("m2", CAPS_ADMIN),
    ]);

    const r = await definirOverrides(CUID, [], ["CLUBE_PERFIS"]);
    expect(r.sucesso).toBe(true);
    expect(prisma.membroClube.update).toHaveBeenCalledOnce();
  });

  it("conta como administrador quem o é por override extra (não só pelo perfil)", async () => {
    // m2 não é admin pelo perfil, mas recebeu as duas capacidades por override.
    mocked(prisma.membroClube.findFirst).mockResolvedValue({
      id: "m1",
      perfil: { capacidades: CAPS_ADMIN },
    });
    mocked(prisma.membroClube.findMany).mockResolvedValue([
      membroAtivo("m1", CAPS_ADMIN),
      membroAtivo("m2", ["TREINOS_GERIR"], CAPS_ADMIN),
    ]);

    const r = await definirOverrides(CUID, [], ["CLUBE_PERFIS"]);
    expect(r.sucesso).toBe(true);
  });

  it("o membro alvo pode tornar-se administrador pelos overrides que recebe agora", async () => {
    // Nenhum admin no estado atual; m1 passa a admin com este mesmo pedido.
    mocked(prisma.membroClube.findFirst).mockResolvedValue({
      id: "m1",
      perfil: { capacidades: ["TREINOS_GERIR"] },
    });
    mocked(prisma.membroClube.findMany).mockResolvedValue([
      membroAtivo("m1", ["TREINOS_GERIR"]),
    ]);

    const r = await definirOverrides(CUID, CAPS_ADMIN, []);
    expect(r.sucesso).toBe(true);
    expect(prisma.membroClube.update).toHaveBeenCalledOnce();
  });

  it("o last-admin check e a escrita correm na MESMA transação (sem TOCTOU)", async () => {
    await definirOverrides(CUID, [], []);
    expect(prisma.$transaction).toHaveBeenCalledOnce();
    expect(typeof chamadas(prisma.$transaction)[0][0]).toBe("function");
  });
});
