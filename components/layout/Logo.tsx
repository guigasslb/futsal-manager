import React from "react";

/**
 * FutsalCoach — logótipo (portátil, sem dependências).
 * Ícone = quadra preta com marcadores do quadro tático (O, X, seta) a laranja.
 */

const ORANGE = "#F0531E";
const INK = "#141210";
const DISPLAY = "var(--font-display), 'Bricolage Grotesque', system-ui, sans-serif";

export function LogoIcon({
  size = 36,
  inverted = false,
  className,
  style,
}: {
  size?: number;
  inverted?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const c = inverted
    ? { tile: ORANGE, area: "#C7430F", line: INK, play: INK }
    : { tile: INK, area: "#34302A", line: "#F4F1EC", play: ORANGE };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={className}
      style={style}
      role="img"
      aria-label="FutsalCoach"
    >
      <rect width="48" height="48" rx="13" fill={c.tile} />
      <path d="M6 18 A6.5 6.5 0 0 1 6 30 Z" fill={c.area} />
      <path d="M42 18 A6.5 6.5 0 0 0 42 30 Z" fill={c.area} />
      <circle cx="24" cy="24" r="6" fill={c.area} />
      <g stroke={c.line} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <rect x="6" y="13" width="36" height="22" rx="1.5" />
        <line x1="24" y1="13" x2="24" y2="35" />
        <circle cx="24" cy="24" r="6" />
      </g>
      <g stroke={c.play} fill="none" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="31" cy="19" r="2.3" strokeWidth="2" />
        <path d="M31.5 27.5 L34.5 30.5 M34.5 27.5 L31.5 30.5" strokeWidth="2" />
        <path d="M29 30 Q 15.5 31.5 14 21.5" strokeWidth="2.2" />
        <path d="M14 21.5 L12.6 23.5 M14 21.5 L16 22.6" strokeWidth="2.2" />
      </g>
    </svg>
  );
}

export function Logo({
  size = 22,
  iconSize,
  variant = "auto",
  iconOnly = false,
  className,
  style,
}: {
  size?: number;
  iconSize?: number;
  /** "auto" adapta ao tema CSS; "light" força modo claro; "dark" força modo escuro */
  variant?: "auto" | "light" | "dark";
  iconOnly?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  // Ícone com fundo laranja (inverted) é visível em ambos os fundos
  const inverted = variant === "dark" || variant === "auto";

  return (
    <span
      className={className}
      style={{ display: "inline-flex", alignItems: "center", gap: 10, ...style }}
    >
      <LogoIcon size={iconSize ?? Math.round(size * 1.72)} inverted={inverted} />
      {!iconOnly && (
        <span
          style={{
            fontFamily: DISPLAY,
            fontSize: size,
            lineHeight: 1,
            letterSpacing: "-0.02em",
            whiteSpace: "nowrap",
          }}
        >
          {/* Cor do texto adapta via Tailwind: escuro em light mode, branco em dark mode */}
          <span
            className="text-[#141210] dark:text-white"
            style={{ fontWeight: 800 }}
          >
            Futsal
          </span>
          <span style={{ fontWeight: 500, color: ORANGE }}>coach</span>
        </span>
      )}
    </span>
  );
}
