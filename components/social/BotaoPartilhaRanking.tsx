import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// P4.7 — Botão de partilha do card social "Top 5 marcadores" (bíblia §3.16).
// Abre a imagem PNG (1080×1080) numa nova aba. Não é renderizado para escalões
// de formação jovem (RGPD) — o controlo é feito no servidor.

export function BotaoPartilhaRanking({ url }: { url: string }) {
  return (
    <Button asChild variant="outline">
      <a href={url} target="_blank" rel="noreferrer">
        <Share2 className="h-4 w-4" />
        Partilhar ranking
      </a>
    </Button>
  );
}
