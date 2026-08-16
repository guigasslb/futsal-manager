// Schema do formulário de contacto da landing page.
// Fonte única de validação, partilhada cliente/servidor.

import { z } from "zod";

export const contactoSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(2, "O nome deve ter pelo menos 2 caracteres")
    .max(100, "Máximo 100 caracteres"),
  email: z
    .string()
    .trim()
    .min(1, "O email é obrigatório")
    .email("Email inválido")
    .max(200, "Máximo 200 caracteres"),
  assunto: z
    .string()
    .trim()
    .min(5, "O assunto deve ter pelo menos 5 caracteres")
    .max(200, "Máximo 200 caracteres"),
  mensagem: z
    .string()
    .trim()
    .min(20, "A mensagem deve ter pelo menos 20 caracteres")
    .max(2000, "Máximo 2000 caracteres"),
});

export type ContactoInput = z.infer<typeof contactoSchema>;
