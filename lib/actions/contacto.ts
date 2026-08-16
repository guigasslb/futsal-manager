"use server";

// Envio de mensagens do formulário de contacto da landing page.
//
// Formulário PÚBLICO (landing page): não requer autenticação nem época ativa.
// Usa o serviço Resend para entregar a mensagem no email do administrador.
// Se `RESEND_API_KEY` estiver ausente, a funcionalidade desliga-se de forma
// controlada (devolve erro claro, sem crash) — à semelhança de outras
// integrações de terceiros do projeto.

import { Resend } from "resend";
import { contactoSchema } from "@/lib/schemas/contacto";
import { ok, erro, erroDeValidacao, type Resultado } from "@/lib/utils";

/** Email de destino fixo (não configurável) das mensagens de contacto. */
const EMAIL_DESTINO = "goncalo.pereira.1992@gmail.com";

/**
 * Remetente. Em produção usa um domínio verificado no Resend
 * (`noreply@futsalcoach.pt`); em testes/dev pode usar `onboarding@resend.dev`
 * via a env var `RESEND_FROM`.
 */
const EMAIL_REMETENTE = process.env.RESEND_FROM ?? "FutsalCoach <noreply@futsalcoach.pt>";

/** Escapa caracteres HTML para evitar injeção no corpo do email. */
function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Valida e envia uma mensagem do formulário de contacto.
 * Aceita FormData (submissão de `<form action={...}>`) ou um objeto simples.
 */
export async function enviarMensagemContacto(
  entrada: FormData | Record<string, unknown>,
): Promise<Resultado<void>> {
  const dados =
    entrada instanceof FormData
      ? {
          nome: entrada.get("nome"),
          email: entrada.get("email"),
          assunto: entrada.get("assunto"),
          mensagem: entrada.get("mensagem"),
        }
      : entrada;

  const parsed = contactoSchema.safeParse(dados);
  if (!parsed.success) return erroDeValidacao(parsed.error);

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return erro(
      "O serviço de email não está configurado. Tenta novamente mais tarde ou contacta-nos diretamente.",
    );
  }

  const { nome, email, assunto, mensagem } = parsed.data;

  const html = `
    <div style="font-family: system-ui, sans-serif; line-height: 1.5; color: #1a1a1a;">
      <h2 style="color: #F0531E;">Nova mensagem de contacto — FutsalCoach</h2>
      <p><strong>Nome:</strong> ${escaparHtml(nome)}</p>
      <p><strong>Email:</strong> ${escaparHtml(email)}</p>
      <p><strong>Assunto:</strong> ${escaparHtml(assunto)}</p>
      <p><strong>Mensagem:</strong></p>
      <p style="white-space: pre-wrap; border-left: 3px solid #F0531E; padding-left: 12px;">${escaparHtml(
        mensagem,
      )}</p>
    </div>
  `.trim();

  const texto = [
    "Nova mensagem de contacto — FutsalCoach",
    "",
    `Nome: ${nome}`,
    `Email: ${email}`,
    `Assunto: ${assunto}`,
    "",
    "Mensagem:",
    mensagem,
  ].join("\n");

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: EMAIL_REMETENTE,
      to: EMAIL_DESTINO,
      replyTo: email,
      subject: `[Contacto] ${assunto}`,
      html,
      text: texto,
    });

    if (error) {
      return erro("Não foi possível enviar a mensagem. Tenta novamente mais tarde.");
    }

    return ok(undefined);
  } catch {
    return erro("Não foi possível enviar a mensagem. Tenta novamente mais tarde.");
  }
}
