import type { EstatisticasAgregadas } from "@/lib/actions/atletas";

function Cartao({ valor, label }: { valor: string | number; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-cinza-200 bg-white p-4 shadow-card">
      <span className="text-titulo-pagina font-bold text-azul-700">{valor}</span>
      <span className="text-legenda text-cinza-500">{label}</span>
    </div>
  );
}

export function EstatisticasAtleta({
  stats,
  eGR,
}: {
  stats: EstatisticasAgregadas;
  eGR: boolean;
}) {
  const semDados =
    stats.jogosConvocado === 0 && stats.sessoesTotais === 0;

  if (semDados) {
    return (
      <p className="rounded-md border border-dashed border-cinza-300 p-6 text-center text-corpo-sec text-cinza-500">
        Sem jogos ou sessões registados nesta época.
      </p>
    );
  }

  const taxa = `${Math.round(stats.taxaPresenca * 100)}%`;

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
      {eGR ? (
        <>
          <Cartao valor={stats.totalDefesas ?? 0} label="defesas" />
          <Cartao valor={stats.totalGolosSofridos ?? 0} label="sofridos" />
        </>
      ) : (
        <>
          <Cartao valor={stats.totalGolos} label="golos" />
          <Cartao valor={stats.totalAssistencias} label="assist." />
        </>
      )}
      <Cartao valor={stats.jogosUtilizados} label="jogos" />
      <Cartao valor={stats.titularidades} label="titular" />
      <Cartao valor={taxa} label="presenças" />
    </div>
  );
}
