// Painel de analíticos do clube (Nível 3 — transversal — bíblia §8.15 / §10.3).
// Presentacional: recebe o AnaliticoClubeEpoca já calculado (Server Action).
// `linkEscaloes` liga cada escalão ao seu analítico (só na app autenticada).

import Link from "next/link";
import type { AnaliticoClubeEpoca } from "@/lib/actions/analise";
import { Cartao, pct } from "./Cartao";

export function PainelClube({
  dados,
  linkEscaloes = false,
}: {
  dados: AnaliticoClubeEpoca;
  linkEscaloes?: boolean;
}) {
  const { totais, escaloes } = dados;

  return (
    <div className="space-y-6">
      {/* KPIs globais */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        <Cartao valor={escaloes.length} label="escalões" />
        <Cartao valor={totais.nAtletas} label="atletas" />
        <Cartao valor={totais.jogos} label="jogos" />
        <Cartao valor={totais.sessoes} label="sessões" />
        <Cartao valor={totais.golosMarcados} label="golos M" />
        <Cartao valor={pct(totais.taxaPresencaMediaGlobal)} label="presença méd." />
      </div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-3">
        <Cartao valor={totais.vitorias} label="vitórias" />
        <Cartao valor={totais.empates} label="empates" />
        <Cartao valor={totais.derrotas} label="derrotas" />
      </div>

      {/* Comparação entre escalões */}
      <div className="rounded-lg border border-cinza-200 bg-white shadow-card">
        <p className="border-b border-cinza-100 px-5 py-3 text-legenda font-medium uppercase tracking-wide text-cinza-400">
          Escalões
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-corpo-sec">
            <thead>
              <tr className="text-left text-legenda uppercase tracking-wide text-cinza-500">
                <th className="px-5 py-2.5 font-medium">Escalão</th>
                <th className="px-3 py-2.5 text-right font-medium">Atletas</th>
                <th className="px-3 py-2.5 text-right font-medium">Jogos</th>
                <th className="px-3 py-2.5 text-center font-medium">V-E-D</th>
                <th className="px-3 py-2.5 text-right font-medium">Golos M/S</th>
                <th className="px-3 py-2.5 text-right font-medium">Sessões</th>
                <th className="px-5 py-2.5 text-right font-medium">Presença</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cinza-100">
              {escaloes.map((e) => (
                <tr key={e.escalaoId} className="text-cinza-900">
                  <td className="px-5 py-3 font-medium">
                    {linkEscaloes ? (
                      <Link
                        href={`/escaloes/${e.escalaoId}/analiticos`}
                        className="text-primary hover:underline"
                      >
                        {e.nome}
                      </Link>
                    ) : (
                      e.nome
                    )}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">{e.nAtletas}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{e.jogos}</td>
                  <td className="px-3 py-3 text-center tabular-nums text-cinza-600">
                    {e.vitorias}-{e.empates}-{e.derrotas}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-cinza-600">
                    {e.golosMarcados}/{e.golosSofridos}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">{e.sessoes}</td>
                  <td className="px-5 py-3 text-right tabular-nums font-medium text-primary">
                    {pct(e.taxaPresencaMedia)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
