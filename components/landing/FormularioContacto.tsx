"use client";

// Formulário de contacto da landing page (secção pública, sem autenticação).
// Validação com o mesmo schema Zod do servidor (fonte única) e submissão via
// a Server Action enviarMensagemContacto. Estados: idle / loading / sucesso /
// erro, com feedback acessível.

import { useState } from "react";
import { Loader2, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { contactoSchema, type ContactoInput } from "@/lib/schemas/contacto";
import { enviarMensagemContacto } from "@/lib/actions/contacto";

const LARANJA_ACAO = "#C7430F"; // laranja-600: fundo c/ texto branco (AA)

type Estado = "idle" | "loading" | "sucesso" | "erro";

const VAZIO: ContactoInput = { nome: "", email: "", assunto: "", mensagem: "" };

export function FormularioContacto() {
  const [valores, setValores] = useState<ContactoInput>(VAZIO);
  const [estado, setEstado] = useState<Estado>("idle");
  const [erros, setErros] = useState<Record<string, string>>({});
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);

  const atualizar =
    (campo: keyof ContactoInput) =>
    (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
      setValores((v) => ({ ...v, [campo]: e.target.value }));
      // Limpa o erro do campo assim que o utilizador o corrige.
      setErros((prev) => {
        if (!prev[campo]) return prev;
        const { [campo]: _omitido, ...resto } = prev;
        return resto;
      });
    };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEstado("loading");
    setMensagemErro(null);
    setErros({});

    // Validação cliente (mesma fonte que o servidor).
    const parsed = contactoSchema.safeParse(valores);
    if (!parsed.success) {
      const campos = Object.fromEntries(
        parsed.error.issues.map((i) => [i.path.join("."), i.message]),
      );
      setErros(campos);
      setMensagemErro("Corrige os campos assinalados e tenta novamente.");
      setEstado("erro");
      return;
    }

    const res = await enviarMensagemContacto(parsed.data);
    if (res.sucesso) {
      setValores(VAZIO);
      setEstado("sucesso");
      return;
    }

    setErros(res.camposInvalidos ?? {});
    setMensagemErro(res.erro);
    setEstado("erro");
  }

  const aCarregar = estado === "loading";

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Campo
          id="contacto-nome"
          label="Nome"
          erro={erros.nome}
          disabled={aCarregar}
          value={valores.nome}
          onChange={atualizar("nome")}
          autoComplete="name"
          placeholder="O teu nome"
        />
        <Campo
          id="contacto-email"
          label="Email"
          type="email"
          erro={erros.email}
          disabled={aCarregar}
          value={valores.email}
          onChange={atualizar("email")}
          autoComplete="email"
          placeholder="nome@exemplo.pt"
        />
      </div>

      <Campo
        id="contacto-assunto"
        label="Assunto"
        erro={erros.assunto}
        disabled={aCarregar}
        value={valores.assunto}
        onChange={atualizar("assunto")}
        placeholder="Em que podemos ajudar?"
      />

      <div>
        <label
          htmlFor="contacto-mensagem"
          className="mb-1.5 block text-corpo-sec font-semibold text-cinza-900"
        >
          Mensagem
        </label>
        <textarea
          id="contacto-mensagem"
          rows={5}
          value={valores.mensagem}
          onChange={atualizar("mensagem")}
          disabled={aCarregar}
          placeholder="Escreve aqui a tua mensagem…"
          aria-invalid={erros.mensagem ? true : undefined}
          aria-describedby={erros.mensagem ? "contacto-mensagem-erro" : undefined}
          className="block w-full resize-y rounded-lg border border-cinza-300 bg-white px-4 py-3 text-corpo text-cinza-900 placeholder:text-cinza-400 focus:border-laranja-500 focus:outline-none focus:ring-2 focus:ring-laranja-500/30 disabled:opacity-60"
        />
        {erros.mensagem && (
          <p id="contacto-mensagem-erro" className="mt-1.5 text-corpo-sec text-vermelho-600">
            {erros.mensagem}
          </p>
        )}
      </div>

      {/* Feedback global */}
      {estado === "sucesso" && (
        <p
          role="status"
          className="flex items-start gap-2 rounded-lg border border-verde-600/30 bg-verde-600/10 px-4 py-3 text-corpo-sec text-verde-600"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden />
          Mensagem enviada com sucesso. Entraremos em contacto em breve.
        </p>
      )}
      {estado === "erro" && mensagemErro && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-vermelho-600/30 bg-vermelho-600/10 px-4 py-3 text-corpo-sec text-vermelho-600"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden />
          {mensagemErro}
        </p>
      )}

      <button
        type="submit"
        disabled={aCarregar}
        className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl px-7 py-3 text-base font-semibold text-white shadow-lg transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-60 sm:w-auto"
        style={{ backgroundColor: LARANJA_ACAO }}
      >
        {aCarregar ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            A enviar…
          </>
        ) : (
          <>
            Enviar mensagem
            <Send className="h-4 w-4" aria-hidden />
          </>
        )}
      </button>
    </form>
  );
}

function Campo({
  id,
  label,
  erro,
  type = "text",
  ...props
}: {
  id: string;
  label: string;
  erro?: string;
  type?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-corpo-sec font-semibold text-cinza-900"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        aria-invalid={erro ? true : undefined}
        aria-describedby={erro ? `${id}-erro` : undefined}
        className="block w-full rounded-lg border border-cinza-300 bg-white px-4 py-3 text-corpo text-cinza-900 placeholder:text-cinza-400 focus:border-laranja-500 focus:outline-none focus:ring-2 focus:ring-laranja-500/30 disabled:opacity-60"
        {...props}
      />
      {erro && (
        <p id={`${id}-erro`} className="mt-1.5 text-corpo-sec text-vermelho-600">
          {erro}
        </p>
      )}
    </div>
  );
}
