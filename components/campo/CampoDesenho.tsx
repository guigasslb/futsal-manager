import { FormatoJogo } from "@prisma/client";
import { CAMPO_W, CAMPO_H, LinhasCampo, ElementoSVG, rotuloCampo } from "./desenho";
import type { DiagramaCampo } from "@/lib/schemas/exercicio";

/**
 * Render estático (read-only) de um diagrama de campo para qualquer formato
 * (§11.5). O `formato` é resolvido por: prop `formato` → `diagrama.campo` →
 * `FUTSAL_5` (retrocompatível). O espaço de coordenadas interno é sempre 400×200.
 */
export function CampoDesenho({
  diagrama,
  formato,
  className,
}: {
  diagrama: DiagramaCampo;
  formato?: FormatoJogo;
  className?: string;
}) {
  const fmt = formato ?? diagrama.campo ?? FormatoJogo.FUTSAL_5;
  return (
    <svg
      viewBox={`0 0 ${CAMPO_W} ${CAMPO_H}`}
      className={className ?? "w-full h-auto rounded-md"}
      role="img"
      aria-label={`Diagrama de ${rotuloCampo(fmt)}`}
    >
      <LinhasCampo formato={fmt} />
      {diagrama.elementos.map((el) => (
        <ElementoSVG key={el.id} elemento={el} />
      ))}
    </svg>
  );
}
