// Painel de analíticos do atleta (Nível 1 — bíblia §8.15 / §10.1).
// Presentacional: recebe o AnaliticoAtleta já calculado (Server Action) e
// desenha os tiles, a comparação com a equipa, a caderneta e os gráficos.

import type { AnaliticoAtleta } from "@/lib/actions/analise";
import { LABEL_POSICAO } from "@/lib/schemas/atleta";
import { GraficoLinhas } from "@/components/graficos/GraficoLinhas";
import { GraficoBarrasV } from "@/components/graficos/GraficoBarrasV";
import { Cartao, pct, n1 } from "./Cartao";

export function PainelAtleta({ dados }: { dados: AnaliticoAtleta }) {
  const {
    atleta,
    agregado,
    caderneta,
    comparacaoEquipa,
    evolucaoJogos,
    presencasMensais,
    escalaoContexto,
  } = dados;
  const eGR = atleta.eGR;

  const semDados =
    agregado.jogosConvocado === 0 && agregado.sessoesTotais === 0;

  const pontosJogos = evolucaoJogos
    .filter((j) => j.utilizado)
    .map((j) =>
      eGR
        ? { label: j.adversario, valor1: j.defesas ?? 0 }
        : { label: j.adversario, valor1: j.golos, valor2: j.assistencias },
    );
  const pontosPresenca = presencasMensais.map((p) => ({
    label: p.mes,
    valor: p.taxa,
  }));

  const temEvolucaoJogos = pontosJogos.length >= 2;
  const temPresencaMensal = pontosPresenca.length >= 2;

  const contexto = [
    atleta.posicoes.map((p) => LABEL_POSICAO[p]).join(", ") || null,
    escalaoContexto?.nome ?? "Todos os escalões",
  ]
    .filter((v): v is string => !!v)
    .join(" · ");

  if (semDados) {
    return (
      <div className="space-y-3">
        {contexto && <p className="text-corpo-sec text-cinza-500">{contexto}</p>}
        <p className="rounded-md border border-dashed border-cinza-300 p-6 text-center text-corpo-sec text-cinza-500">
          Sem jogos ou sessões registados nesta época.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {contexto && <p className="text-corpo-sec text-cinza-500">{contexto}</p>}

      {/* Tiles de estatística */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {eGR ? (
          <>
            <Cartao valor={agregado.totalDefesas ?? 0} label="defesas" />
            <Cartao valor={agregado.totalGolosSofridos ?? 0} label="sofridos" />
          </>
        ) : (
          <>
            <Cartao valor={agregado.totalGolos} label="golos" />
            <Cartao valor={agregado.totalAssistencias} label="assist." />
          </>
        )}
        <Cartao valor={agregado.jogosUtilizados} label="jogos" />
        <Cartao valor={agregado.titularidades} label="titular" />
        <Cartao valor={pct(agregado.taxaPresenca)} label="presenças" />
        <Cartao valor={agregado.tempoJogoAcumulado} label="min" />
      </div>

      {/* Comparação com a média da equipa */}
      {comparacaoEquipa && (
        <div className="rounded-lg border border-cinza-200 bg-white p-5 shadow-card">
          <p className="mb-3 text-legenda font-medium uppercase tracking-wide text-cinza-400">
            Comparação com a média da equipa
          </p>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Comparacao
              label={eGR ? "Golos sofridos" : "Golos"}
              atleta={eGR ? agregado.totalGolosSofridos ?? 0 : agregado.totalGolos}
              equipa={comparacaoEquipa.golosMediaEquipa}
            />
            <Comparacao
              label="Presenças"
              atleta={agregado.taxaPresenca}
              equipa={comparacaoEquipa.taxaPresencaMediaEquipa}
              percentagem
            />
            <Comparacao
              label="Tempo de jogo"
              atleta={agregado.tempoJogoAcumulado}
              equipa={comparacaoEquipa.tempoJogoMedioEquipa}
              unidade="min"
            />
          </dl>
        </div>
      )}

      {/* Caderneta */}
      <div className="rounded-lg border border-cinza-200 bg-white p-5 shadow-card">
        <p className="mb-1 text-legenda font-medium uppercase tracking-wide text-cinza-400">
          Caderneta
        </p>
        <p className="text-corpo text-cinza-900">
          <span className="font-semibold text-primary">{caderneta.desbloqueadas}</span>{" "}
          de {caderneta.total} habilidades desbloqueadas
          {caderneta.emProgresso > 0 && (
            <span className="text-cinza-500"> · {caderneta.emProgresso} em progresso</span>
          )}
          .
        </p>
      </div>

      {/* Evolução por jogo */}
      {temEvolucaoJogos && (
        <div className="rounded-lg border border-cinza-200 bg-white p-5 shadow-card">
          <GraficoLinhas
            pontos={pontosJogos}
            serie1={eGR ? "Defesas" : "Golos"}
            serie2={eGR ? undefined : "Assistências"}
            titulo={eGR ? "Defesas por jogo" : "Golos e assistências por jogo"}
          />
        </div>
      )}

      {/* Presença mensal */}
      {temPresencaMensal && (
        <div className="rounded-lg border border-cinza-200 bg-white p-5 shadow-card">
          <GraficoBarrasV dados={pontosPresenca} titulo="Taxa de presença por mês" />
        </div>
      )}
    </div>
  );
}

function Comparacao({
  label,
  atleta,
  equipa,
  percentagem = false,
  unidade,
}: {
  label: string;
  atleta: number;
  equipa: number;
  percentagem?: boolean;
  unidade?: string;
}) {
  const fmt = (v: number) =>
    percentagem ? pct(v) : unidade ? `${n1(v)} ${unidade}` : n1(v);
  return (
    <div className="rounded-md border border-cinza-100 bg-cinza-50 p-3">
      <dt className="text-legenda uppercase tracking-wide text-cinza-500">{label}</dt>
      <dd className="mt-0.5 flex items-baseline gap-2">
        <span className="text-titulo-seccao font-bold text-cinza-900">{fmt(atleta)}</span>
        <span className="text-corpo-sec text-cinza-500">
          média {fmt(equipa)}
        </span>
      </dd>
    </div>
  );
}
