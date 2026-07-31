import { z } from "zod";
import { CAPACIDADES } from "@/lib/permissoes-catalogo";

export const convidarMembroSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100),
  email: z.string().email("Email inválido").toLowerCase(),
  passwordInicial: z.string().min(8, "A password deve ter pelo menos 8 caracteres"),
  perfilId: z.string().cuid("Perfil inválido"),
});

export const perfilSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(60),
  descricao: z.string().max(200).optional(),
  ambito: z.enum(["TODO_CLUBE", "PROPRIOS_ESCALOES"]),
  capacidades: z.array(z.enum(CAPACIDADES)).default([]),
});

export type ConvidarMembroInput = z.infer<typeof convidarMembroSchema>;
export type PerfilInput = z.infer<typeof perfilSchema>;
