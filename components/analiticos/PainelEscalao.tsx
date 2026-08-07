// Painel de analíticos da equipa/escalão (Nível 2 — bíblia §8.15 / §10.2).
// Presentacional: recebe o AnaliticoEscalao já calculado (Server Action).

import type { TipoSessao } from "@prisma/client";
import type { AnaliticoEscalao } from "@/lib/actions/analise";
import { GraficoBarrasH } from "@/components/graficos/GraficoBarrasH";
import { GraficoBarrasV } from "@/components/graficos/GraficoBarrasV";
import { Cartao, pct, n1 } from "./Cartao";

const LABEL_TIPO_SESSAO: Record<TipoSessao, string> = {
  NORMAL: "Normal",
  ABERTO: "Aberto",
  CAPTACAO: "Captação",
  EVENTO: "Evento",
};

function formatarData(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit" });
}

export function PainelEscalao({ dados }: { dados: AnaliticoEscalao }) {
  const pontosMarcadores = dados.marcadores.map((m) => ({
    label: m.nome,
    valor: m.valor,
  }));
  const pontosAssistentes = dados.assistentes.map((m) => ({
    label: m.nome,
    valor: m.valor,
  }));
  const pontosUtilizados = dados.maisUtilizados.map((u) => ({
    label: u.nome,
    valor: u.tempoJogoAcumulado,
  }));
  const pontosPresenca = dados.presencaMensal.map((p) => ({
    label: p.mes,
    valor: p.taxa,
  }));

  const tiposTreino = (Object.keys(dados.distribuicaoTipoTreino) as TipoSessao[])
    .map((t) => ({ tipo: t, n: dados.distribuicaoTipoTreino[t] }))
    .filter((x) => x.n > 0);

  const semJogos = dados.jogos === 0;

  return (
    <div className="space-y-6">
      {/* Resultados */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        <Cartao valor={dados.jogos} label="jogos" />
        <Cartao valor={dados.vitorias} label="vitórias" />
        <Cartao valor={dados.empates} label="empates" />
        <Cartao valor={dados.derrotas} label="derrotas" />
        <Cartao valor={dados.golosMarcados} label="golos M" />
        <Cartao valor={dados.golosSofridos} label="golos S" />
      </div>

      {/* Plantel e assiduidade */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Cartao valor={dados.nAtletas} label="atletas" />
        <Cartao valor={dados.sessoes} label="sessões" />
        <Cartao valor={pct(dados.taxaPresencaMedia)} label="presença méd." />
        <Cartao valor={n1(dados.golosMarcadosMedia)} label="golos M/jogo" />
        <Cartao valor={n1(dados.golosSofridosMedia)} label="golos S/jogo" />
      </div>

      {/* Distribuição de tipos de treino */}
      {tiposTreino.length > 0 && (
        <div className="rounded-lg border border-cinza-200 bg-white p-5 shadow-card">
          <p className="mb-3 text-legenda font-medium uppercase tracking-wide text-cinza-400">
            Tipos de treino
          </p>
          <ul className="flex flex-wrap gap-2">
            {tiposTreino.map(({ tipo, n }) => (
              <li
                key={tipo}
                className="rounded-full border border-cinza-200 px-3 py-1 text-legenda text-cinza-700"
              >
                {LABEL_TIPO_SESSAO[tipo]}
                <span className="ml-1.5 font-semibold text-primary">{n}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Rankings */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-lg border border-cinza-200 bg-white p-5 shadow-card">
          {pontosMarcadores.length === 0 ? (
            <>
              <p className="mb-3 text-legenda font-medium uppercase tracking-wide text-cinza-400">
                Melhores marcadores
              </p>
              <p className="text-corpo-sec text-cinza-500">Sem golos registados.</p>
            </>
          ) : (
            <GraficoBarrasH
              dados={pontosMarcadores}
              titulo="Melhores marcadores"
              unidade="golos"
            />
          )}
        </div>

        <div className="rounded-lg border border-cinza-200 bg-white p-5 shadow-card">
          {pontosAssistentes.length === 0 ? (
            <>
              <p className="mb-3 text-legenda font-medium uppercase tracking-wide text-cinza-400">
                Melhores assistentes
              </p>
              <p className="text-corpo-sec text-cinza-500">
                Sem assistências registadas.
              </p>
            </>
          ) : (
            <GraficoBarrasH
              dados={pontosAssistentes}
              titulo="Melhores assistentes"
              unidade="assist."
            />
          )}
        </div>
      </div>

      {/* Jogadores mais utilizados */}
      {pontosUtilizados.length > 0 && (
        <div className="rounded-lg border border-cinza-200 bg-white p-5 shadow-card">
          <GraficoBarrasH
            dados={pontosUtilizados}
            titulo="Jogadores mais utilizados"
            unidade="min"
          />
        </div>
      )}

      {/* Assiduidade mensal */}
      {pontosPresenca.length >= 2 && (
        <div className="rounded-lg border border-cinza-200 bg-white p-5 shadow-card">
          <GraficoBarrasV dados={pontosPresenca} titulo="Assiduidade mensal" />
        </div>
      )}

      {/* Resultados jogo a jogo */}
      <div className="rounded-lg border border-cinza-200 bg-white p-5 shadow-card">
        <p className="mb-3 text-legenda font-medium uppercase tracking-wide text-cinza-400">
          Resultados
        </p>
        {semJogos ? (
          <p className="text-corpo-sec text-cinza-500">Sem jogos registados.</p>
        ) : (
          <ul className="divide-y divide-cinza-100">
            {dados.resultados.map((r) => (
              <li
                key={r.jogoId}
                className="flex items-center justify-between gap-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-corpo text-cinza-900">{r.adversario}</p>
                  <p className="text-legenda text-cinza-500">{formatarData(r.data)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-corpo font-semibold text-cinza-900">
                    {r.golosMarcados ?? "—"}–{r.golosSofridos ?? "—"}
                  </span>
                  <ResultadoBadge resultado={r.resultado} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ResultadoBadge({ resultado }: { resultado: "V" | "E" | "D" | null }) {
  if (!resultado) {
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-cinza-100 text-legenda font-bold text-cinza-400">
        –
      </span>
    );
  }
  const estilo =
    resultado === "V"
      ? "bg-verde-600/10 text-verde-600"
      : resultado === "E"
        ? "bg-ambar-600/10 text-ambar-600"
        : "bg-vermelho-600/10 text-vermelho-600";
  return (
    <span
      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-legenda font-bold ${estilo}`}
    >
      {resultado}
    </span>
  );
}
