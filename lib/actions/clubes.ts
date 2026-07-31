"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { exigirCapacidade } from "@/lib/permissoes";
import { ok, erro, erroDeValidacao, type Resultado } from "@/lib/utils";
import { brandingSchema } from "@/lib/schemas/onboarding";
import type { Clube } from "@prisma/client";

export async function atualizarBrandingClube(dados: unknown): Promise<Resultado<Clube>> {
  const perm = await exigirCapacidade("CLUBE_BRANDING");
  if (!perm.ok) return erro(perm.erro);

  const parsed = brandingSchema.safeParse(dados);
  if (!parsed.success) return erroDeValidacao(parsed.error);

  const clube = await prisma.clube.update({
    where: { id: perm.ctx.clube.id },
    data: {
      nome: parsed.data.nome,
      corPrimaria: parsed.data.corPrimaria,
      corSecundaria: parsed.data.corSecundaria,
      logoUrl: parsed.data.logoUrl ? parsed.data.logoUrl : null,
      morada: parsed.data.morada ?? null,
      email: parsed.data.email ? parsed.data.email : null,
      telefone: parsed.data.telefone ?? null,
    },
  });
  revalidatePath("/", "layout");
  return ok(clube);
}
