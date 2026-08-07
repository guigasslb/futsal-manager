"use client";

// Ações sobre um texto de comunicação já gerado (bíblia §8.12):
// copiar para a área de transferência e abrir o WhatsApp com o texto pré-preenchido.
// A app não envia nada — o utilizador escolhe o destinatário dentro do WhatsApp.

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, Copy, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { linkWhatsApp } from "@/lib/comunicacao-cliente";
import { cn } from "@/lib/utils";

/** Copia para a área de transferência, com alternativa para contextos sem Clipboard API. */
async function copiarParaAreaTransferencia(texto: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(texto);
      return true;
    } catch {
      // Sem permissão ou contexto inseguro — tenta a alternativa abaixo.
    }
  }
  if (typeof document === "undefined") return false;
  try {
    const campo = document.createElement("textarea");
    campo.value = texto;
    campo.setAttribute("readonly", "");
    campo.style.position = "fixed";
    campo.style.top = "-1000px";
    campo.style.opacity = "0";
    document.body.appendChild(campo);
    campo.select();
    const copiado = document.execCommand("copy");
    document.body.removeChild(campo);
    return copiado;
  } catch {
    return false;
  }
}

export function AccoesTexto({
  texto,
  className,
}: {
  texto: string;
  className?: string;
}) {
  const [copiado, setCopiado] = useState(false);
  const [pending, startTransition] = useTransition();

  function copiar() {
    startTransition(async () => {
      const feito = await copiarParaAreaTransferencia(texto);
      if (feito) {
        setCopiado(true);
        toast.success("Texto copiado");
        window.setTimeout(() => setCopiado(false), 2000);
      } else {
        toast.error("Não foi possível copiar. Seleciona o texto e copia manualmente.");
      }
    });
  }

  const desativado = texto.trim() === "";

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <Button
        type="button"
        variant="outline"
        onClick={copiar}
        disabled={desativado || pending}
      >
        {copiado ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copiado ? "Copiado" : "Copiar texto"}
      </Button>
      {desativado ? (
        <Button type="button" disabled>
          <Share2 className="h-4 w-4" />
          Partilhar no WhatsApp
        </Button>
      ) : (
        <Button asChild>
          <a href={linkWhatsApp(texto)} target="_blank" rel="noreferrer">
            <Share2 className="h-4 w-4" />
            Partilhar no WhatsApp
          </a>
        </Button>
      )}
    </div>
  );
}

/** Bloco de texto gerado, com a formatação do WhatsApp preservada. */
export function TextoGerado({
  texto,
  className,
}: {
  texto: string;
  className?: string;
}) {
  return (
    <pre
      className={cn(
        "whitespace-pre-wrap break-words rounded-md border border-cinza-200 bg-white p-4 font-sans text-corpo text-cinza-900 shadow-card",
        className,
      )}
    >
      {texto}
    </pre>
  );
}
