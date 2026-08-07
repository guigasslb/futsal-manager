"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Props = {
  sucesso?: string;
  erro?: string;
};

/**
 * Mostra o feedback do callback OAuth (§3.12) via toast e limpa os
 * search params do URL para evitar repetição em refresh/navegação.
 */
export function NotificacaoCalendario({ sucesso, erro }: Props) {
  const router = useRouter();
  const jaMostrado = useRef(false);

  useEffect(() => {
    if (jaMostrado.current) return;
    if (sucesso !== "calendar" && erro !== "calendar") return;

    jaMostrado.current = true;

    if (sucesso === "calendar") {
      toast.success("Google Calendar ligado com sucesso!");
    } else if (erro === "calendar") {
      toast.error("Não foi possível ligar o Google Calendar.");
    }

    router.replace("/definicoes/integracao");
  }, [sucesso, erro, router]);

  return null;
}
