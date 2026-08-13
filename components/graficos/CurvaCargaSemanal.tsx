"use client";

import { useState } from "react";
import type { DadosCargaSemanal, ZonaCarga } from "@/lib/utils/cargaTreino";
import { LABEL_ZONA_CARGA } from "@/lib/utils/cargaTreino";

// Código de cores por zona de carga (§8.20). Tokens: verde-600 / ambar-500 / vermelho-600.
const C_IDEAL = "#1E9E5A";
const C_SUBCARGA = "#E0900A";
const C_RISCO = "#D33A3A";
const C_NEUTRO = "color-mix(in srgb, var(--cor-primaria, #F0531E) 22%, white)";
const C_ACWR = "#3A3A3A"; // linha ACWR (preto quente)
const C_SURFACE = "#ffffff";
const C_GRID = "#E4E1DB";
const C_TEXTO_MUTED = "#98938D";

const ML = 34; // eixo carga (esquerda)
const MR = 30; // eixo ACWR (direita)
const MT = 14;
const MB = 34;
const W = 440;
const H = 220;
const PW = W - ML - MR;
const PH = H - MT - MB;

// Escala do ACWR: 0–2 (as bandas 0.8 e 1.3 delimitam a zona ideal).
const ACWR_MAX = 2;

function corZona(zona: ZonaCarga | null): string {
  if (zona === "IDEAL") return C_IDEAL;
  if (zona === "SUBCARGA") return C_SUBCARGA;
  if (zona === "RISCO") return C_RISCO;
  return C_NEUTRO;
}

export function CurvaCargaSemanal({ dados }: { dados: DadosCargaSemanal[] }) {
  const [hovIdx, setHovIdx] = useState<number | null>(null);

  if (dados.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-cinza-200 p-4 text-center text-corpo-sec text-cinza-400">
        Sem dados de carga para visualizar.
      </p>
    );
  }

  const n = dados.length;
  const maxCarga = Math.max(...dados.map((d) => d.cargaAcumulada), 1);
  const yMax = Math.ceil(maxCarga / 100) * 100 || 100;

  const slotW = PW / n;
  const barW = Math.min(Math.floor(slotW * 0.5), 26);
  const barOffset = (slotW - barW) / 2;

  const yCarga = (v: number) => MT + PH - (v / yMax) * PH;
  const yAcwr = (v: number) => MT + PH - (Math.min(v, ACWR_MAX) / ACWR_MAX) * PH;
  const xCentro = (i: number) => ML + i * slotW + slotW / 2;

  // Pontos ACWR (só semanas com valor definido).
  const pontosAcwr = dados
    .map((d, i) => (d.acwr !== null ? { i, x: xCentro(i), y: yAcwr(d.acwr) } : null))
    .filter((p): p is { i: number; x: number; y: number } => p !== null);
  const linhaAcwr = pontosAcwr
    .map((p, k) => `${k === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  const yTicks = [0, yMax / 2, yMax];

  return (
    <div className="w-full select-none">
      {/* Legenda das zonas */}
      <div className="mb-2 flex flex-wrap gap-3">
        <LegendaItem cor={C_SUBCARGA} texto="Subcarga" />
        <LegendaItem cor={C_IDEAL} texto="Zona ideal" />
        <LegendaItem cor={C_RISCO} texto="Risco" />
        <span className="flex items-center gap-1.5 text-legenda text-cinza-600">
          <span className="inline-block h-0.5 w-6" style={{ background: C_ACWR }} />
          ACWR
        </span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        role="img"
        aria-label="Curva de carga semanal e ACWR"
        style={{ display: "block" }}
      >
        {/* Grelha + eixo de carga (esquerda) */}
        {yTicks.map((t) => (
          <g key={t}>
            <line x1={ML} y1={yCarga(t)} x2={ML + PW} y2={yCarga(t)} stroke={C_GRID} strokeWidth={1} />
            <text
              x={ML - 5}
              y={yCarga(t)}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={10}
              fill={C_TEXTO_MUTED}
              fontFamily="system-ui, sans-serif"
            >
              {Math.round(t)}
            </text>
          </g>
        ))}

        {/* Banda da zona ideal do ACWR (0.8–1.3) no eixo direito */}
        <rect
          x={ML}
          y={yAcwr(1.3)}
          width={PW}
          height={yAcwr(0.8) - yAcwr(1.3)}
          fill={C_IDEAL}
          fillOpacity={0.06}
        />
        {[0.8, 1.3].map((t) => (
          <line
            key={t}
            x1={ML}
            y1={yAcwr(t)}
            x2={ML + PW}
            y2={yAcwr(t)}
            stroke={C_IDEAL}
            strokeWidth={1}
            strokeDasharray="4 3"
            opacity={0.5}
          />
        ))}

        {/* Marcas do eixo ACWR (direita) */}
        {[0, 1, ACWR_MAX].map((t) => (
          <text
            key={t}
            x={ML + PW + 5}
            y={yAcwr(t)}
            textAnchor="start"
            dominantBaseline="middle"
            fontSize={10}
            fill={C_TEXTO_MUTED}
            fontFamily="system-ui, sans-serif"
          >
            {t.toFixed(1)}
          </text>
        ))}

        {/* Barras de carga */}
        {dados.map((d, i) => {
          const isHov = hovIdx === i;
          const barH = (d.cargaAcumulada / yMax) * PH;
          const barY = yCarga(d.cargaAcumulada);
          const cor = corZona(d.zona);
          return (
            <g
              key={i}
              onMouseEnter={() => setHovIdx(i)}
              onMouseLeave={() => setHovIdx(null)}
              style={{ cursor: "default" }}
            >
              <rect x={ML + i * slotW} y={MT} width={slotW} height={PH + MB / 2} fill="transparent" />
              {d.cargaAcumulada > 0 ? (
                <rect
                  x={ML + i * slotW + barOffset}
                  y={barY}
                  width={barW}
                  height={barH}
                  fill={cor}
                  fillOpacity={isHov ? 1 : 0.85}
                  rx={3}
                />
              ) : (
                <rect
                  x={ML + i * slotW + barOffset}
                  y={yCarga(0) - 2}
                  width={barW}
                  height={2}
                  fill={C_NEUTRO}
                />
              )}
              <text
                x={xCentro(i)}
                y={H - MB + 14}
                textAnchor="middle"
                fontSize={10}
                fill={isHov ? "#3A3A3A" : C_TEXTO_MUTED}
                fontFamily="system-ui, sans-serif"
              >
                {d.semana}
              </text>
            </g>
          );
        })}

        {/* Linha ACWR sobreposta */}
        {pontosAcwr.length >= 2 && (
          <path
            d={linhaAcwr}
            fill="none"
            stroke={C_ACWR}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}
        {pontosAcwr.map((p) => {
          const d = dados[p.i];
          return (
            <g key={p.i}>
              <circle cx={p.x} cy={p.y} r={6} fill={C_SURFACE} />
              <circle cx={p.x} cy={p.y} r={4} fill={corZona(d.zona)} stroke={C_ACWR} strokeWidth={1.5} />
            </g>
          );
        })}

        {/* Tooltip da semana em hover */}
        {hovIdx !== null && (() => {
          const d = dados[hovIdx];
          const anchorLeft = xCentro(hovIdx) < ML + PW / 2;
          const tx = anchorLeft ? xCentro(hovIdx) + 6 : xCentro(hovIdx) - 6;
          return (
            <g pointerEvents="none">
              <text
                x={tx}
                y={MT + 10}
                textAnchor={anchorLeft ? "start" : "end"}
                fontSize={10}
                fill="#3A3A3A"
                fontFamily="system-ui, sans-serif"
                fontWeight={600}
              >
                {`Carga ${d.cargaAcumulada}`}
                {d.acwr !== null ? ` · ACWR ${d.acwr.toFixed(2)}` : ""}
              </text>
            </g>
          );
        })()}
      </svg>

      {/* Vista acessível */}
      <table className="sr-only">
        <caption>Carga semanal e ACWR</caption>
        <thead>
          <tr>
            <th>Semana</th>
            <th>Carga</th>
            <th>RPE médio</th>
            <th>ACWR</th>
            <th>Zona</th>
          </tr>
        </thead>
        <tbody>
          {dados.map((d, i) => (
            <tr key={i}>
              <td>{d.inicioSemana}</td>
              <td>{d.cargaAcumulada}</td>
              <td>{d.rpeMedia.toFixed(1)}</td>
              <td>{d.acwr !== null ? d.acwr.toFixed(2) : "—"}</td>
              <td>{d.zona ? LABEL_ZONA_CARGA[d.zona] : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LegendaItem({ cor, texto }: { cor: string; texto: string }) {
  return (
    <span className="flex items-center gap-1.5 text-legenda text-cinza-600">
      <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: cor }} />
      {texto}
    </span>
  );
}
