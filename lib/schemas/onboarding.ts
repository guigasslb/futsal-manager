import { z } from "zod";

const corHex = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida (ex: #1A2FD4)");

export const registarSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100),
  email: z.string().email("Email inválido").toLowerCase(),
  password: z.string().min(8, "A password deve ter pelo menos 8 caracteres"),
});

export const criarClubeSchema = z.object({
  nome: z.string().min(2, "Nome do clube obrigatório").max(100),
  corPrimaria: corHex.optional(),
  corSecundaria: corHex.optional(),
});

export const brandingSchema = z.object({
  nome: z.string().min(2).max(100),
  corPrimaria: corHex,
  corSecundaria: corHex,
  logoUrl: z.string().url("URL inválido").optional().or(z.literal("")),
  morada: z.string().max(200).optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  telefone: z.string().max(30).optional(),
});

export type RegistarInput = z.infer<typeof registarSchema>;
export type CriarClubeInput = z.infer<typeof criarClubeSchema>;
export type BrandingInput = z.infer<typeof brandingSchema>;
