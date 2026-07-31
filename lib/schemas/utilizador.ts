import { z } from "zod";

// Secção 10.2 da spec
export const passwordSchema = z
  .string()
  .min(8, "A password deve ter pelo menos 8 caracteres");

export const criarUtilizadorSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100),
  email: z.string().email("Email inválido").toLowerCase(),
  passwordInicial: passwordSchema,
});

export const atualizarUtilizadorSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100),
  email: z.string().email("Email inválido").toLowerCase(),
});

export const alterarPasswordSchema = z
  .object({
    passwordAtual: z.string().min(1, "Obrigatório"),
    novaPassword: passwordSchema,
    confirmarPassword: z.string(),
  })
  .refine((d) => d.novaPassword === d.confirmarPassword, {
    message: "As passwords não coincidem",
    path: ["confirmarPassword"],
  });

export type CriarUtilizadorInput = z.infer<typeof criarUtilizadorSchema>;
export type AtualizarUtilizadorInput = z.infer<typeof atualizarUtilizadorSchema>;
export type AlterarPasswordInput = z.infer<typeof alterarPasswordSchema>;
