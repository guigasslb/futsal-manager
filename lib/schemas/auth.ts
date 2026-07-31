import { z } from "zod";

/** Requisito mínimo de password (secção 6.2). */
export const passwordSchema = z
  .string()
  .min(8, "A password deve ter pelo menos 8 caracteres");

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: passwordSchema,
});
export type LoginInput = z.infer<typeof loginSchema>;

export const alterarPasswordSchema = z
  .object({
    passwordAtual: z.string().min(1, "Indica a password atual"),
    novaPassword: passwordSchema,
  })
  .refine((d) => d.passwordAtual !== d.novaPassword, {
    message: "A nova password tem de ser diferente da atual",
    path: ["novaPassword"],
  });
export type AlterarPasswordInput = z.infer<typeof alterarPasswordSchema>;
