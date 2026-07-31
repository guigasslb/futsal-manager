import { CAMPO_W, CAMPO_H, LinhasCampo, ElementoSVG } from "./desenho";
import type { DiagramaCampo } from "@/lib/schemas/exercicio";

export function MiniaturaCampo({
  diagrama,
  largura = 240,
  className,
}: {
  diagrama: DiagramaCampo;
  largura?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox={`0 0 ${CAMPO_W} ${CAMPO_H}`}
      width={largura}
      height={(largura * CAMPO_H) / CAMPO_W}
      className={className ?? "rounded"}
      role="img"
      aria-label="Miniatura de diagrama de campo"
    >
      <LinhasCampo />
      {diagrama.elementos.map((el) => (
        <ElementoSVG key={el.id} elemento={el} />
      ))}
    </svg>
  );
}
