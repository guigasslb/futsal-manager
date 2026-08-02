"use client";

import { useState } from "react";

// Cor do clube (herda de --cor-primaria) + neutros quentes
const C_BARRA = "var(--cor-primaria, #F0531E)";
const C_BARRA_HOVER = "color-mix(in srgb, var(--cor-primaria, #F0531E) 80%, #000)";
const C_BARRA_0 = "color-mix(in srgb, var(--cor-primaria, #F0531E) 18%, white)"; // barra zero
const C_GRID = "#E4E1DB";
const C_TEXTO_MUTED = "#98938D";

const ML = 28;   // left margin (y-axis)
const MR = 8;
const MT = 12;
const MB = 32;   // bottom margin (x labels)
const W = 400;
const H = 190;
const PW = W - ML - MR;
const PH = H - MT - MB;

const MAX_BARS = 12;

export interface BarraV {
  label: string;  // "Jan", "Set", …
  valor: number;  // 0–1 (taxa) or any magnitude
  /** Display format, default rounds to % */
  format?: (v: number) => string;
}

interface GraficoBarrasVProps {
  dados: BarraV[];
  titulo?: string;
}

export function GraficoBarrasV({ dados, titulo }: GraficoBarrasVProps) {
  const [hovIdx, setHovIdx] = useState<number | null>(null);

  const visivel = dados.slice(-MAX_BARS); // show last N months
  const n = visivel.length;

  if (n === 0) {
    return (
      <p className="rounded-md border border-dashed border-cinza-200 p-4 text-center text-corpo-sec text-cinza-400">
        Sem dados para visualizar.
      </p>
    );
  }

  // Bar slot width + gap
  const slotW = PW / n;
  const barW = Math.min(Math.floor(slotW * 0.55), 24); // ≤24px per spec
  const barOffset = (slotW - barW) / 2;

  // Y ticks: 0%, 50%, 100%
  const yTicks = [0, 0.5, 1];
  const yOf = (v: number) => MT + PH - v * PH;
  const xBarLeft = (i: number) => ML + i * slotW + barOffset;

  return (
    <div className="w-full select-none">
      {titulo && (
        <p className="mb-1 text-legenda font-medium uppercase tracking-wide text-cinza-400">
          {titulo}
        </p>
      )}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        role="img"
        aria-label={titulo ?? "Gráfico de barras"}
        style={{ display: "block" }}
      >
        {/* Horizontal hairline grid at 0%, 50%, 100% */}
        {yTicks.map((t) => (
          <g key={t}>
            <line
              x1={ML} y1={yOf(t)}
              x2={ML + PW} y2={yOf(t)}
              stroke={C_GRID}
              strokeWidth={1}
            />
            <text
              x={ML - 5}
              y={yOf(t)}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={10}
              fill={C_TEXTO_MUTED}
              fontFamily="system-ui, sans-serif"
            >
              {Math.round(t * 100)}%
            </text>
          </g>
        ))}

        {/* Bars */}
        {visivel.map((d, i) => {
          const barH = d.valor * PH;
          const barY = yOf(d.valor);
          const isHov = hovIdx === i;
          const fmt = d.format ? d.format(d.valor) : `${Math.round(d.valor * 100)}%`;

          return (
            <g
              key={i}
              onMouseEnter={() => setHovIdx(i)}
              onMouseLeave={() => setHovIdx(null)}
              style={{ cursor: "default" }}
            >
              {/* Full column hit target */}
              <rect
                x={ML + i * slotW}
                y={MT}
                width={slotW}
                height={PH + MB / 2}
                fill="transparent"
              />

              {d.valor > 0 ? (
                <>
                  {/* Bar: 4px rounded at data-end (top), square at baseline (bottom) */}
                  <rect
                    x={xBarLeft(i)}
                    y={barY}
                    width={barW}
                    height={barH}
                    fill={isHov ? C_BARRA_HOVER : C_BARRA}
                    rx={4}
                    ry={4}
                  />
                  {/* Square bottom corners overlay */}
                  {barH > 4 && (
                    <rect
                      x={xBarLeft(i)}
                      y={yOf(0) - Math.min(barH, 8)}
                      width={barW}
                      height={Math.min(barH, 8)}
                      fill={isHov ? C_BARRA_HOVER : C_BARRA}
                    />
                  )}
                </>
              ) : (
                /* Zero bar placeholder */
                <rect
                  x={xBarLeft(i)}
                  y={yOf(0) - 2}
                  width={barW}
                  height={2}
                  fill={C_BARRA_0}
                />
              )}

              {/* Value label on top of bar (only if bar is tall enough) */}
              {barH > 18 && (
                <text
                  x={xBarLeft(i) + barW / 2}
                  y={barY - 4}
                  textAnchor="middle"
                  fontSize={10}
                  fill={isHov ? C_BARRA_HOVER : C_TEXTO_MUTED}
                  fontFamily="system-ui, sans-serif"
                >
                  {fmt}
                </text>
              )}

              {/* X-axis label */}
              <text
                x={ML + i * slotW + slotW / 2}
                y={H - MB + 14}
                textAnchor="middle"
                fontSize={11}
                fill={isHov ? C_BARRA : C_TEXTO_MUTED}
                fontFamily="system-ui, sans-serif"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Accessible table view */}
      <table className="sr-only">
        <caption>{titulo}</caption>
        <thead>
          <tr>
            <th>Mês</th>
            <th>Taxa de presença</th>
          </tr>
        </thead>
        <tbody>
          {visivel.map((d, i) => (
            <tr key={i}>
              <td>{d.label}</td>
              <td>{Math.round(d.valor * 100)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
