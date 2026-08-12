import { Share2, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

// P4.7 — Botões de partilha de cards sociais no ecrã de jogo (bíblia §3.16).
// Abrem a imagem PNG (1080×1080) numa nova aba; o utilizador guarda-a a partir
// do browser. Não são renderizados para escalões de formação jovem (RGPD) — o
// controlo é feito no servidor (page + rota), aqui só recebemos os URLs.

interface Props {
  urlResultado: string | null;
  urlMvp: string | null;
}

export function BotoesPartilhaJogo({ urlResultado, urlMvp }: Props) {
  if (!urlResultado && !urlMvp) return null;

  return (
    <>
      {urlResultado && (
        <Button asChild variant="outline">
          <a href={urlResultado} target="_blank" rel="noreferrer">
            <Share2 className="h-4 w-4" />
            Partilhar resultado
          </a>
        </Button>
      )}
      {urlMvp && (
        <Button asChild variant="outline">
          <a href={urlMvp} target="_blank" rel="noreferrer">
            <Trophy className="h-4 w-4" />
            Ver MVP
          </a>
        </Button>
      )}
    </>
  );
}
