"use client";

// Atalho «Gerar mensagem de convocatória» a partir do jogo (bíblia §8.12).
// Monta o contexto no servidor (convocados, data, local) e devolve o texto
// pronto a copiar ou a partilhar no WhatsApp. A app não envia nada.

import { useState, useTransition } from "react";
import Link from "next/link";
import { Loader2, MessageSquareShare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AccoesTexto, TextoGerado } from "@/components/comunicacoes/AccoesTexto";
import {
  gerarTextoComunicacao,
  obterContextoConvocatoria,
} from "@/lib/actions/comunicacao";

export function ConvocatoriaWhatsApp({ jogoId }: { jogoId: string }) {
  const [aberto, setAberto] = useState(false);
  const [texto, setTexto] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function abrir() {
    setAberto(true);
    setTexto(null);
    setErro(null);
    startTransition(async () => {
      try {
        const contexto = await obterContextoConvocatoria(jogoId);
        const res = await gerarTextoComunicacao({ tipo: "CONVOCATORIA", contexto });
        if (res.sucesso) setTexto(res.dados);
        else setErro(res.erro);
      } catch {
        setErro("Não foi possível carregar os dados deste jogo.");
      }
    });
  }

  return (
    <>
      <Button type="button" variant="outline" onClick={abrir}>
        <MessageSquareShare className="h-4 w-4" />
        Gerar convocatória
      </Button>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mensagem de convocatória</DialogTitle>
            <DialogDescription>
              Copia o texto ou abre o WhatsApp para o enviares ao grupo do escalão.
            </DialogDescription>
          </DialogHeader>

          {pending && (
            <p className="flex items-center gap-2 text-corpo-sec text-cinza-600">
              <Loader2 className="h-4 w-4 animate-spin" />A gerar mensagem…
            </p>
          )}

          {erro && <p className="text-corpo-sec text-vermelho-600">{erro}</p>}

          {texto !== null && (
            <div className="space-y-3">
              <TextoGerado texto={texto} className="max-h-72 overflow-y-auto" />
              <AccoesTexto texto={texto} />
              <Button asChild variant="ghost" size="sm">
                <Link href={`/comunicacoes/gerar?tipo=CONVOCATORIA&jogo=${jogoId}`}>
                  Editar no gerador
                </Link>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
