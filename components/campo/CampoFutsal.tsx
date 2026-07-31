import { CAMPO_W, CAMPO_H, LinhasCampo, ElementoSVG } from "./desenho";
import type { DiagramaCampo } from "@/lib/schemas/exercicio";

export function CampoFutsal({
  diagrama,
  className,
}: {
  diagrama: DiagramaCampo;
  className?: string;
}) {
  return (
    <svg
      viewBox={`0 0 ${CAMPO_W} ${CAMPO_H}`}
      className={className ?? "w-full h-auto rounded-md"}
      role="img"
      aria-label="Diagrama de campo de futsal"
    >
      <LinhasCampo />
      {diagrama.elementos.map((el) => (
        <ElementoSVG key={el.id} elemento={el} />
      ))}
    </svg>
  );
}
