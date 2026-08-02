"use client";

import { useState } from "react";

// Design system color tokens
const C_BARRA = "#1A2FD4";       // azul-700 (série 1, sequential)
const C_BARRA_HOVER = "#0F1E8A"; // azul-900
const C_GRID = "#E2E5EF";        // cinza-200 (hairline)
const C_TEXTO_MUTED = "#8A90A6"; // cinza-400 (axis/labels recessive)
const C_TEXTO = "#4A4F63";       // cinza-600

const LABEL_W = 148;
const BAR_AREA = 200;
const VAL_W = 40;
const TOTAL_W = LABEL_W + BAR_AREA + VAL_W;
const BAR_H = 14;    // ≤24px as required
const ROW_H = 28;    // total row height (gap = 14px around the bar)
const PAD_V = 8;

interface Barra {
  label: string;
  valor: number;
}

interface GraficoBarrasHProps {
  dados: Barra[];
  titulo?: string;
  unidade?: string;
  /** Max rows shown, default 8 */
  maxRows?: number;
}

export function GraficoBarrasH({
  dados,
  titulo,
  unidade,
  maxRows = 8,
}: GraficoBarrasHProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const visivel = dados.slice(0, maxRows);
  const maxValor = Math.max(...visivel.map((d) => d.valor), 1);
  const totalH = PAD_V + visivel.length * ROW_H + PAD_V;

  return (
    <div className="w-full select-none">
      {titulo && (
        <p className="mb-2 text-legenda font-medium uppercase tracking-wide text-cinza-400">
          {titulo}
        </p>
      )}
      <svg
        viewBox={`0 0 ${TOTAL_W} ${totalH}`}
        width="100%"
        role="img"
        aria-label={titulo ?? "Gráfico de barras"}
        style={{ display: "block", overflow: "visible" }}
      >
        {/* Hairline gridlines at 0%, 50%, 100% of bar area */}
        {[0, 0.5, 1].map((pct) => {
          const x = LABEL_W + pct * BAR_AREA;
          return (
            <line
              key={pct}
              x1={x} y1={PAD_V}
              x2={x} y2={PAD_V + visivel.length * ROW_H}
              stroke={C_GRID}
              strokeWidth={1}
            />
          );
        })}

        {/* Bars + labels */}
        {visivel.map((d, i) => {
          const barW = Math.max((d.valor / maxValor) * BAR_AREA, d.valor > 0 ? 2 : 0);
          const barY = PAD_V + i * ROW_H + (ROW_H - BAR_H) / 2;
          const isHov = hoveredIdx === i;

          const valStr = unidade ? `${d.valor} ${unidade}` : String(d.valor);
          const labelTrunc = d.label.length > 19 ? d.label.slice(0, 18) + "…" : d.label;

          return (
            <g
              key={i}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{ cursor: "default" }}
            >
              {/* Full-row hit target */}
              <rect
                x={0}
                y={PAD_V + i * ROW_H}
                width={TOTAL_W}
                height={ROW_H}
                fill="transparent"
              />

              {/* Row highlight */}
              {isHov && (
                <rect
                  x={0}
                  y={PAD_V + i * ROW_H}
                  width={TOTAL_W}
                  height={ROW_H}
                  fill="#F4F6FF"
                  rx={2}
                />
              )}

              {/* Label */}
              <text
                x={LABEL_W - 8}
                y={PAD_V + i * ROW_H + ROW_H / 2}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize={12}
                fill={isHov ? C_BARRA : C_TEXTO}
                fontFamily="system-ui, sans-serif"
              >
                {labelTrunc}
              </text>

              {/* Bar body — rounded at data-end (right), square at baseline (left) */}
              {barW > 0 && (
                <>
                  {/* Full rounded rect */}
                  <rect
                    x={LABEL_W}
                    y={barY}
                    width={barW}
                    height={BAR_H}
                    fill={isHov ? C_BARRA_HOVER : C_BARRA}
                    rx={4}
                    ry={4}
                  />
                  {/* Square overlay on left side to flatten baseline corners */}
                  {barW > 4 && (
                    <rect
                      x={LABEL_W}
                      y={barY}
                      width={Math.min(barW, 8)}
                      height={BAR_H}
                      fill={isHov ? C_BARRA_HOVER : C_BARRA}
                    />
                  )}
                </>
              )}

              {/* Value at bar end */}
              <text
                x={LABEL_W + barW + 6}
                y={PAD_V + i * ROW_H + ROW_H / 2}
                textAnchor="start"
                dominantBaseline="middle"
                fontSize={11}
                fill={isHov ? C_BARRA : C_TEXTO_MUTED}
                fontFamily="system-ui, sans-serif"
              >
                {valStr}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Table view for accessibility */}
      <table className="sr-only">
        <caption>{titulo}</caption>
        <thead>
          <tr>
            <th>Nome</th>
            <th>{unidade ?? "Valor"}</th>
          </tr>
        </thead>
        <tbody>
          {visivel.map((d, i) => (
            <tr key={i}>
              <td>{d.label}</td>
              <td>{d.valor}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
