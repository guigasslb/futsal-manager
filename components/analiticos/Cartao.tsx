// Bloco de estatística (tile) partilhado pelos painéis de analíticos.
// Presentacional puro — usado tanto na app autenticada como na vista pública.

export function Cartao({
  valor,
  label,
}: {
  valor: string | number;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-cinza-200 bg-white p-4 shadow-card">
      <span className="text-titulo-pagina font-bold text-primary">{valor}</span>
      <span className="text-legenda text-cinza-500">{label}</span>
    </div>
  );
}

/** Formata uma taxa 0–1 como percentagem inteira (ex.: 0.73 → "73%"). */
export function pct(taxa: number): string {
  return `${Math.round(taxa * 100)}%`;
}

/** Arredonda a uma casa decimal, sem casas se for inteiro (ex.: 2.0 → "2"). */
export function n1(valor: number): string {
  const arred = Math.round(valor * 10) / 10;
  return Number.isInteger(arred) ? String(arred) : arred.toFixed(1);
}
