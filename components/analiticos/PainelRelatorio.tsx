// Desenha o corpo de um relatório partilhado consoante o seu tipo.
// A união `dados` é discriminada pelo campo `tipo` do snapshot (bíblia §10.6).

import type {
  AnaliticoAtleta,
  AnaliticoEscalao,
  AnaliticoClubeEpoca,
  RelatorioPublico,
} from "@/lib/actions/analise";
import { PainelAtleta } from "./PainelAtleta";
import { PainelEscalao } from "./PainelEscalao";
import { PainelClube } from "./PainelClube";

export function PainelRelatorio({ relatorio }: { relatorio: RelatorioPublico }) {
  switch (relatorio.tipo) {
    case "EPOCA_ATLETA":
      return <PainelAtleta dados={relatorio.dados as AnaliticoAtleta} />;
    case "EPOCA_EQUIPA":
      return <PainelEscalao dados={relatorio.dados as AnaliticoEscalao} />;
    case "EPOCA_CLUBE":
      return <PainelClube dados={relatorio.dados as AnaliticoClubeEpoca} />;
    default:
      return null;
  }
}
