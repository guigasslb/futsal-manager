// Tabela de ACWR individual por atleta (F2.2 — bíblia §8.20).
//
// Server Component presentacional: recebe a lista `CargaAtleta[]` já calculada por
// `obterCargaAtletas` (ordenada por risco descendente) e desenha uma tabela
// semântica com a carga da semana, o ACWR e a zona de risco por atleta. As cores
// das zonas são os mesmos tokens do gráfico `CurvaCargaSemanal` (verde-600 /
// ambar-600 / vermelho-600), para consistência visual em toda a superfície de
// carga. Atletas sem RPE individual reportado surgem com "—"/"Sem dados".

import type { CargaAtleta } from "@/lib/actions/cargaTreino";
import type { ZonaCarga } from "@/lib/utils/cargaTreino";
import { LABEL_ZONA_CARGA } from "@/lib/utils/cargaTreino";

function ZonaBadge({ zona }: { zona: ZonaCarga | null }) {
  if (!zona) {
    return (
      <span className="inline-flex items-center rounded-full bg-cinza-100 px-2.5 py-0.5 text-legenda font-medium text-cinza-500">
        Sem dados
      </span>
    );
  }
  const estilo =
    zona === "RISCO"
      ? "bg-vermelho-600/10 text-vermelho-600"
      : zona === "IDEAL"
        ? "bg-verde-600/10 text-verde-600"
        : "bg-ambar-600/10 text-ambar-600";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-legenda font-medium ${estilo}`}
    >
      {LABEL_ZONA_CARGA[zona]}
    </span>
  );
}

export function TabelaAcwrAtletas({ atletas }: { atletas: CargaAtleta[] }) {
  if (atletas.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-cinza-200 p-4 text-center text-corpo-sec text-cinza-400">
        Sem dados de RPE para este escalão.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-corpo">
        <thead>
          <tr className="border-b border-cinza-200 text-left text-legenda uppercase tracking-wide text-cinza-400">
            <th scope="col" className="py-2 pr-3 font-medium">
              Atleta
            </th>
            <th scope="col" className="px-3 py-2 text-right font-medium">
              Carga semana
            </th>
            <th scope="col" className="px-3 py-2 text-right font-medium">
              ACWR
            </th>
            <th scope="col" className="py-2 pl-3 font-medium">
              Zona
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-cinza-100">
          {atletas.map((a) => (
            <tr key={a.atletaId}>
              <td className="py-2.5 pr-3 text-cinza-900">{a.nome}</td>
              <td className="px-3 py-2.5 text-right tabular-nums text-cinza-700">
                {a.cargaSemanaAtual}
              </td>
              <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-cinza-900">
                {a.acwrAtual === null ? "—" : a.acwrAtual.toFixed(2)}
              </td>
              <td className="py-2.5 pl-3">
                <ZonaBadge zona={a.zona} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
