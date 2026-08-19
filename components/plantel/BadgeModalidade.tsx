import type { Modalidade } from "@prisma/client";

// 🔁 v7 (§3.2): indicador visual de modalidade. O emoji é decorativo (aria-hidden);
// o rótulo textual garante acessibilidade (sr-only quando compacto).
const CONFIG: Record<Modalidade, { rotulo: string; emoji: string }> = {
  FUTSAL: { rotulo: "Futsal", emoji: "🥅" },
  FUTEBOL: { rotulo: "Futebol", emoji: "⚽" },
};

export function BadgeModalidade({
  modalidade,
  compacto = false,
}: {
  modalidade: Modalidade;
  compacto?: boolean;
}) {
  const c = CONFIG[modalidade];
  return (
    <span
      title={c.rotulo}
      className="inline-flex items-center gap-1 rounded-full border border-cinza-200 bg-cinza-50 px-2 py-0.5 text-legenda text-cinza-600"
    >
      <span aria-hidden>{c.emoji}</span>
      {compacto ? <span className="sr-only">{c.rotulo}</span> : <span>{c.rotulo}</span>}
    </span>
  );
}
