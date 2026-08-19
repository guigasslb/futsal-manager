# Mister — Guia de marca

Identidade visual do produto **Mister**. Complementa a secção 12 da bíblia (`FutsalManager_Spec_v7.md`). Regra de ouro: **a marca do produto é fixa; a cor do clube é dinâmica**.

## 1. Logótipo

- **Símbolo:** quadra de futsal (preto) com marcadores do quadro tático — círculo (O), cruz (X) e seta — a laranja. Ecoa a ferramenta do treinador.
- **Wordmark:** **Mister** — palavra única em Bricolage Grotesque (peso 800); adapta a cor ao contexto (tinta em fundo claro, branco em fundo escuro). O acento laranja da marca vive no símbolo, ao lado.
- **Ficheiros:**
  - `components/layout/Logo.tsx` — `<Logo />` (lockup) e `<LogoIcon />` (só símbolo); variantes `light`/`dark` (`inverted`).
  - `public/icon.svg` — ícone da app / favicon / PWA.
- **Usos:** barra de topo (`<Logo size={20} />`), login (`size={26}`), PWA/favicon (ícone).
- **Não fazer:** distorcer, recolorir o símbolo fora de preto/laranja, ou juntar o logótipo do clube ao lado (o clube aparece na **marca de água** e no contexto da página, nunca ao pé do logótipo do produto).

## 2. Cores

### 2.1 Marca (fixa)
| Papel | Hex | Token |
|---|---|---|
| Laranja (acento da marca / default sem clube) | `#F0531E` | `laranja-500` |
| Laranja escuro (texto/hover) | `#C7430F` | `laranja-600` |
| Preto quente (texto/ícone/tile) | `#141210` | `ink` / `cinza-900` |
| Carvão (áreas do logo) | `#34302A` | — |

### 2.2 Neutros quentes (papel/cremes)
| Papel | Hex | Token |
|---|---|---|
| Papel (fundo da página) | `#EDEBE7` | — (bg do `app-surface`) |
| Superfície de cartão | `#F7F5F2` | `cinza-50` |
| Borda | `#E4E1DB` | `cinza-200` |
| Linhas creme (sobre escuro) | `#F4F1EC` | — |
| Texto secundário | `#57514A` | `cinza-600` |
| Muted (eixos/legendas) | `#98938D` | `cinza-400` |

### 2.3 Estado (fixas)
Sucesso `verde-600 #1E9E5A` · aviso `ambar-600 #8A5A06` (texto) / `ambar-500 #E0900A` (ícone) · erro `vermelho-600 #D33A3A`.

## 3. Cor do clube (dinâmica)

A cor primária escolhida no **criar clube** (`Clube.corPrimaria`) alimenta **todos os acentos**:
- Aplicada no layout como `--cor-primaria` **e** convertida para HSL e injetada em `--primary`/`--ring` (shadcn), para os **botões** seguirem o clube.
- Usada em: cartão-herói (gradiente), navegação ativa, botões primários, chips, avatar, links/tabs (via `text-primary`/`bg-primary`), focus rings, e a **cor da marca de água**.
- **Default** (sem clube, ex.: login) = laranja da marca.

> Arquitetura: o *shell* (logo, tipografia, neutros quentes) é sempre Mister; a cor do clube entra nos acentos. Um clube azul → app quente com acentos azuis; um clube vermelho → acentos vermelhos.

## 4. Marca de água do clube

O **logótipo do clube** (`Clube.logoUrl`) aparece como marca de água **centrada, a preencher a página** (`.club-watermark`: `inset:0`, `object-fit:contain`, opacidade ~0.14), atrás do conteúdo. Visível em **desktop e mobile** (não depende da sidebar). Sem logótipo, o clube identifica-se pela cor dos acentos + nome no contexto da página.

## 5. Tipografia

- **Display (títulos, wordmark):** Bricolage Grotesque — `font-display` (var `--font-display`), pesos 500/600/700/800, `letter-spacing` negativo.
- **Corpo/UI:** Inter — `font-sans` (var `--font-inter`).
- Números grandes: figuras proporcionais; `tabular-nums` só em colunas/eixos.

## 6. Superfícies e chrome

- Fundo da página: papel `#EDEBE7` + brilho radial subtil da cor do clube (`app-surface`).
- Barra de topo: vidro fosco (`topbar-glass`).
- Cartões: `card-base` (cantos 16px, sombra em duas camadas, borda quente); hover eleva e tinge a sombra/borda com a cor do clube (`card-hover`).
- Cartão-herói: `hero-card` (gradiente da cor do clube) com `hero-btn`/`hero-btn-solid`.

## 7. Identidade da página

Cabeçalho compacto (pensado para tablet): **{treinador} · {papel}** em display 18px; por baixo **{clube} · {escalões} · Época {época}**. Sem saudação.
