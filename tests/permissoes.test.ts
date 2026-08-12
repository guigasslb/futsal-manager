import { describe, it, expect } from "vitest";
import { PERFIS_ARRANQUE, CAPACIDADES } from "@/lib/permissoes-catalogo";

// P1.8 — o Treinador Principal precisa de COMUNICACOES_GERIR para que o botão
// "Gerar convocatória" (WhatsApp) apareça no detalhe do jogo. É o caso de uso nº1
// da semana do treinador de escalão: comunicar a convocatória.

function perfil(nome: string) {
  const p = PERFIS_ARRANQUE.find((x) => x.nome === nome);
  if (!p) throw new Error(`Perfil de arranque não encontrado: ${nome}`);
  return p;
}

describe("Perfis de arranque — capacidades", () => {
  it("COMUNICACOES_GERIR existe no catálogo de capacidades", () => {
    expect(CAPACIDADES).toContain("COMUNICACOES_GERIR");
  });

  it("Treinador Principal inclui COMUNICACOES_GERIR", () => {
    expect(perfil("Treinador Principal").capacidades).toContain("COMUNICACOES_GERIR");
  });

  it("Administrador inclui COMUNICACOES_GERIR", () => {
    expect(perfil("Administrador").capacidades).toContain("COMUNICACOES_GERIR");
  });

  it("Diretor Técnico inclui COMUNICACOES_GERIR", () => {
    expect(perfil("Diretor Técnico").capacidades).toContain("COMUNICACOES_GERIR");
  });

  it("Adjunto NÃO inclui COMUNICACOES_GERIR (operação do dia-a-dia)", () => {
    expect(perfil("Adjunto").capacidades).not.toContain("COMUNICACOES_GERIR");
  });
});
