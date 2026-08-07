import type { ElementoCampo } from "@/lib/schemas/exercicio";
import { ancoraElemento, rotuloElemento } from "./animacao";

// Dimensões internas do campo (secção 13.1): 1 unidade = 10 cm, campo 400×200.
export const CAMPO_W = 400;
export const CAMPO_H = 200;

const COR_HEX: Record<string, string> = {
  azul: "#1A2FD4",
  vermelho: "#DC2626",
  amarelo: "#F5C518",
  verde: "#16A34A",
};

function corParaHex(cor: string): string {
  return COR_HEX[cor] ?? cor;
}

// ─── Linhas de referência do campo (secção 13.1) ────────────────────────────

export function LinhasCampo() {
  return (
    <g>
      {/* Relvado */}
      <rect x={0} y={0} width={CAMPO_W} height={CAMPO_H} fill="#0E7A3C" />
      {/* Contorno */}
      <rect
        x={4}
        y={4}
        width={CAMPO_W - 8}
        height={CAMPO_H - 8}
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={1.5}
      />
      {/* Linha de meio-campo */}
      <line
        x1={CAMPO_W / 2}
        y1={4}
        x2={CAMPO_W / 2}
        y2={CAMPO_H - 4}
        stroke="#FFFFFF"
        strokeWidth={1.5}
      />
      {/* Círculo central (raio 3m = 30 unidades) */}
      <circle
        cx={CAMPO_W / 2}
        cy={CAMPO_H / 2}
        r={30}
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={1.5}
      />
      <circle cx={CAMPO_W / 2} cy={CAMPO_H / 2} r={2} fill="#FFFFFF" />

      {/* Área esquerda: quarto de círculo 6m (60 unidades) em cada poste */}
      <path
        d={`M 4 ${CAMPO_H / 2 - 30 - 60} A 60 60 0 0 1 64 ${CAMPO_H / 2 - 30}`}
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={1.5}
      />
      <path
        d={`M 64 ${CAMPO_H / 2 + 30} A 60 60 0 0 1 4 ${CAMPO_H / 2 + 30 + 60}`}
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={1.5}
      />
      <line
        x1={64}
        y1={CAMPO_H / 2 - 30}
        x2={64}
        y2={CAMPO_H / 2 + 30}
        stroke="#FFFFFF"
        strokeWidth={1.5}
      />
      {/* Grande penalidade esquerda (6m) e segunda penalidade (10m) */}
      <circle cx={64} cy={CAMPO_H / 2} r={1.6} fill="#FFFFFF" />
      <circle cx={100} cy={CAMPO_H / 2} r={1.6} fill="#FFFFFF" />

      {/* Área direita */}
      <path
        d={`M ${CAMPO_W - 4} ${CAMPO_H / 2 - 30 - 60} A 60 60 0 0 0 ${CAMPO_W - 64} ${CAMPO_H / 2 - 30}`}
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={1.5}
      />
      <path
        d={`M ${CAMPO_W - 64} ${CAMPO_H / 2 + 30} A 60 60 0 0 0 ${CAMPO_W - 4} ${CAMPO_H / 2 + 30 + 60}`}
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={1.5}
      />
      <line
        x1={CAMPO_W - 64}
        y1={CAMPO_H / 2 - 30}
        x2={CAMPO_W - 64}
        y2={CAMPO_H / 2 + 30}
        stroke="#FFFFFF"
        strokeWidth={1.5}
      />
      <circle cx={CAMPO_W - 64} cy={CAMPO_H / 2} r={1.6} fill="#FFFFFF" />
      <circle cx={CAMPO_W - 100} cy={CAMPO_H / 2} r={1.6} fill="#FFFFFF" />
    </g>
  );
}

// ─── Caminho suave a partir de pontos ────────────────────────────────────────

function pontosParaPath(pontos: { x: number; y: number }[]): string {
  if (pontos.length === 0) return "";
  if (pontos.length === 1) return `M ${pontos[0].x} ${pontos[0].y}`;
  // Linha poligonal simples (quebrada) — suficiente e previsível.
  return pontos.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
}

// ─── Render de um elemento ───────────────────────────────────────────────────

export function ElementoSVG({
  elemento,
  selecionado,
  focado,
  raioHit = 0,
  onFocarHit,
}: {
  elemento: ElementoCampo;
  selecionado?: boolean;
  focado?: boolean;
  // Raio (em unidades) do círculo de hit/toque invisível. 0 = read-only.
  raioHit?: number;
  onFocarHit?: (id: string) => void;
}) {
  // B3: para setas/linhas o anel usa o primeiro ponto do trajecto (não (0,0)).
  const ancora = ancoraElemento(elemento);
  const temPonto = "x" in elemento && "y" in elemento;

  const anelSelecao = selecionado ? (
    <circle
      cx={ancora.x}
      cy={ancora.y}
      r={12}
      fill="none"
      stroke="#F5C518"
      strokeWidth={2}
      strokeDasharray="4 3"
    />
  ) : null;

  // Anel de foco de teclado — distinto do anel de selecção (cor do clube).
  const anelFoco = focado ? (
    <circle
      cx={ancora.x}
      cy={ancora.y}
      r={15}
      fill="none"
      stroke="var(--cor-primaria, #F0531E)"
      strokeWidth={1.5}
      strokeDasharray="2 3"
    />
  ) : null;

  // Círculo de hit/toque invisível (só no editor) — alvo ≥32px e foco de teclado.
  const hit =
    temPonto && raioHit > 0 ? (
      <circle
        cx={ancora.x}
        cy={ancora.y}
        r={raioHit}
        fill="transparent"
        tabIndex={0}
        role="button"
        aria-label={rotuloElemento(elemento)}
        style={{ cursor: "grab", outline: "none" }}
        onFocus={onFocarHit ? () => onFocarHit(elemento.id) : undefined}
      />
    ) : null;

  const decoracoes = (
    <>
      {hit}
      {anelSelecao}
      {anelFoco}
    </>
  );

  switch (elemento.tipo) {
    case "jogador":
      return (
        <g>
          {decoracoes}
          <circle
            cx={elemento.x}
            cy={elemento.y}
            r={8}
            fill={corParaHex(elemento.cor)}
            stroke="#FFFFFF"
            strokeWidth={1.5}
          />
          {elemento.numero != null && (
            <text
              x={elemento.x}
              y={elemento.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={8}
              fontWeight={700}
              fill="#FFFFFF"
            >
              {elemento.numero}
            </text>
          )}
        </g>
      );

    case "bola":
      return (
        <g>
          {decoracoes}
          <circle
            cx={elemento.x}
            cy={elemento.y}
            r={4}
            fill="#FFFFFF"
            stroke="#1A1D29"
            strokeWidth={1}
          />
          <circle cx={elemento.x} cy={elemento.y} r={1.5} fill="#1A1D29" />
        </g>
      );

    case "cone":
      return (
        <g>
          {decoracoes}
          <polygon
            points={`${elemento.x},${elemento.y - 7} ${elemento.x - 5},${elemento.y + 5} ${elemento.x + 5},${elemento.y + 5}`}
            fill="#F97316"
            stroke="#7C2D12"
            strokeWidth={0.8}
          />
        </g>
      );

    case "baliza": {
      const horizontal = elemento.orientacao === "horizontal";
      const w = horizontal ? 30 : 6;
      const h = horizontal ? 6 : 30;
      return (
        <g>
          {decoracoes}
          <rect
            x={elemento.x - w / 2}
            y={elemento.y - h / 2}
            width={w}
            height={h}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={2}
          />
        </g>
      );
    }

    case "seta": {
      const dash =
        elemento.estilo === "passe"
          ? "6 4"
          : elemento.estilo === "conducao"
            ? undefined
            : undefined;
      const isConducao = elemento.estilo === "conducao";
      const d = isConducao
        ? pathOndulado(elemento.pontos)
        : pontosParaPath(elemento.pontos);
      const markerId = `seta-${elemento.id}`;
      const cor = corParaHex(elemento.cor);
      return (
        <g>
          {decoracoes}
          <defs>
            <marker
              id={markerId}
              markerWidth={6}
              markerHeight={6}
              refX={4}
              refY={3}
              orient="auto"
            >
              <path d="M0,0 L6,3 L0,6 Z" fill={cor} />
            </marker>
          </defs>
          <path
            d={d}
            fill="none"
            stroke={cor}
            strokeWidth={2}
            strokeDasharray={dash}
            markerEnd={`url(#${markerId})`}
          />
        </g>
      );
    }

    case "linha":
      return (
        <g>
          {decoracoes}
          <path
            d={pontosParaPath(elemento.pontos)}
            fill="none"
            stroke={corParaHex(elemento.cor)}
            strokeWidth={1.5}
          />
        </g>
      );

    case "texto":
      return (
        <g>
          {decoracoes}
          <text
            x={elemento.x}
            y={elemento.y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={10}
            fontWeight={600}
            fill="#FFFFFF"
            stroke="#1A1D29"
            strokeWidth={0.4}
            paintOrder="stroke"
          >
            {elemento.conteudo}
          </text>
        </g>
      );
  }
}

// Caminho ondulado (condução de bola)
function pathOndulado(pontos: { x: number; y: number }[]): string {
  if (pontos.length < 2) return pontosParaPath(pontos);
  const segs: string[] = [`M ${pontos[0].x} ${pontos[0].y}`];
  for (let i = 1; i < pontos.length; i++) {
    const a = pontos[i - 1];
    const b = pontos[i];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.hypot(dx, dy) || 1;
    const nx = -dy / dist;
    const ny = dx / dist;
    const ondas = Math.max(2, Math.round(dist / 12));
    for (let k = 1; k <= ondas; k++) {
      const t = k / ondas;
      const px = a.x + dx * t;
      const py = a.y + dy * t;
      const amp = k % 2 === 0 ? 0 : 3;
      segs.push(`L ${px + nx * amp} ${py + ny * amp}`);
    }
  }
  return segs.join(" ");
}
