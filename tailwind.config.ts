import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        // ─── Tokens do sistema de design (secção 19.2) ───
        azul: {
          900: "#0F1E8A",
          700: "#1A2FD4", // PRIMÁRIA
          500: "#3A50E0",
          100: "#E4E8FF",
          50: "#F4F6FF",
        },
        cinza: {
          900: "#1A1D29",
          600: "#4A4F63",
          400: "#8A90A6",
          200: "#E2E5EF",
          50: "#F8F9FC",
        },
        verde: { 600: "#1E9E5A" },
        ambar: { 500: "#E0900A" },
        vermelho: { 600: "#D33A3A" },
        "amarelo-jsc": "#FFD700", // decorativo/identitário — nunca ação

        // ─── Mapeamento semântico (shadcn/ui) ───
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
      },
      borderRadius: {
        lg: "12px", // modais/painéis grandes
        md: "8px", // cartões, inputs, botões
        sm: "6px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
      },
      fontSize: {
        // Escala tipográfica (secção 19.3)
        "titulo-pagina": ["24px", { lineHeight: "1.5", fontWeight: "700" }],
        "titulo-seccao": ["18px", { lineHeight: "1.5", fontWeight: "600" }],
        subtitulo: ["15px", { lineHeight: "1.5", fontWeight: "600" }],
        corpo: ["14px", { lineHeight: "1.5" }],
        "corpo-sec": ["13px", { lineHeight: "1.5" }],
        legenda: ["12px", { lineHeight: "1.5" }],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
