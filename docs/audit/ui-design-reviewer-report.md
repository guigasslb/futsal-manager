# Auditoria UI/Design — Sofia Alves (UI Design Reviewer)

> FutsalCoach · revisão de sistema de design, marca, estados e acessibilidade visual.
> Âmbito: `globals.css`, `tailwind.config.ts`, `docs/BRAND.md`, `app/page.tsx`, `app/layout.tsx`, e componentes de layout (`BarraTopo`, `Navegacao`, `AlternadorTema`, `theme-provider`) + primitivos `button`/`input`.

## Checklist de Qualidade Visual

| Categoria | Estado | Problemas Encontrados |
|---|---|---|
| Brand & Tokens | 🟡 | Sistema de tokens sólido e bem pensado, mas a **landing (`page.tsx`) ignora-o por completo** — cores hardcoded (`const LARANJA`, `const INK`) + `style={{}}` inline. Fallback da cor do clube na **`Navegacao` é azul `#1A2FD4`** (legado), quando o default da marca é laranja `#F0531E`. |
| Tipografia | 🟢 | Bricolage Grotesque bem configurada (`--font-display`) e aplicada em `h1/h2/h3` e `font-display`. Escala semântica (`titulo-pagina`, `corpo`, `legenda`) coerente. Ressalva menor: a landing usa a escala default do Tailwind (`text-4xl/5xl/6xl`) em vez da escala do produto. |
| Spacing/Layout | 🟢 | Uso consistente da escala do Tailwind e de `borderRadius`/`boxShadow` tokenizados. Sem valores ad-hoc problemáticos. |
| Estados (hover/focus/disabled) | 🔴 | **Regressão no hover do botão primário**: `hover:bg-primary/50` *clareia* o botão (parece desativado) em vez de escurecer. Ring de foco do avatar (`BarraTopo`) sem cor de marca → cai no azul default do Tailwind. |
| Mobile/Touch | 🟡 | Ícones da barra de topo (sino, tema, avatar) a **36px (`h-9 w-9`)**, abaixo do mínimo de 44px que a própria spec exige. `viewport` com **`maximumScale: 1`** bloqueia zoom (a11y). |
| Dark/Light Mode | 🟡 | Alternador + `next-themes` OK; remapeamento `.dark` em `globals.css` é engenhoso. Mas **texto branco sobre laranja `#F0531E` = 3.5:1**, falha AA para texto normal (botões primários, badge "Recomendado"). Landing mistura hero fixo escuro com secções que trocam de tema. |

---

## Top 5 Problemas Visuais

### 1. 🔴 Hover do botão primário clareia em vez de escurecer — `components/ui/button.tsx:12`
```
default: "bg-primary text-white hover:bg-primary/50"
```
`hover:bg-primary/50` reduz o laranja a 50% de opacidade — no hover o botão fica **mais fraco/lavado**, lido como estado desativado. É o gesto de interação mais repetido da app e está invertido. Esperado: `hover:bg-primary/90` (escurecer) — como já é feito no `destructive` (`hover:bg-vermelho-600/90`).

### 2. 🔴 Texto branco sobre laranja da marca falha WCAG AA — transversal
`#F0531E` + texto branco = **3.51:1** (AA de texto normal exige 4.5:1). Afeta:
- `components/ui/button.tsx:12` (todos os botões primários, `text-corpo` 14px)
- `app/page.tsx:128,153,266` (CTAs "Registar grátis" / "Falar connosco")
- `app/page.tsx:231` (badge "Recomendado", `text-legenda` 12px — pior caso)

Recomendação: usar `laranja-600 #C7430F` para superfícies com texto branco (**4.95:1**, passa AA), mantendo `#F0531E` para acentos/ícones/bordas. O token já existe em `tailwind.config.ts:22`.

### 3. 🟡 Fallback da cor do clube é azul na navegação — `components/layout/Navegacao.tsx:72,122,126,140,145`
```
style={on ? { color: "var(--cor-primaria, #1A2FD4)" } : undefined}
```
O fallback `#1A2FD4` é o azul legado (`azul-700`). Em `BarraTopo.tsx:77` e em `globals.css` o fallback é `#F0531E`. Se `--cor-primaria` não estiver definida (ex.: estado transitório, clube sem cor), a **navegação fica azul enquanto o resto da app fica laranja** — inconsistência de marca gritante. Uniformizar todos os fallbacks para `#F0531E`.

### 4. 🟡 Alvos de toque a 36px + zoom bloqueado — `components/layout/BarraTopo.tsx:58,75` · `app/layout.tsx:25`
Sino, alternador de tema e avatar são `h-9 w-9` (36px), abaixo dos ≥44px que a spec (secção 19.5 / `docs/BRAND.md`) impõe. Em paralelo, `viewport.maximumScale: 1` (`layout.tsx:25`) impede pinch-zoom — barreira de acessibilidade (WCAG 1.4.4/1.4.10). Aumentar a área de toque (ex.: `h-11 w-11` com ícone centrado) e remover `maximumScale`.

### 5. 🟡 Landing contorna o sistema de design — `app/page.tsx:15-16` + estilos inline
```
const LARANJA = "#F0531E";
const INK = "#141210";
```
A primeira impressão do produto é a única superfície construída **fora dos tokens**: dezenas de `style={{ backgroundColor: LARANJA }}`, bordas hardcoded, e escala tipográfica default. Quando a cor de marca/tema evoluir, a landing fica para trás. Migrar para `bg-primary`, `text-primary`, `border-cinza-200` e a escala semântica.

---

## O que está bem (não regredir)

- **Arquitetura de tema dupla** (marca fixa FutsalCoach + `--cor-primaria` dinâmica do clube injetada em `--primary`/`--ring`) é uma decisão de design system madura e bem documentada em `BRAND.md`.
- **Remapeamento `.dark`** das utilitárias claras (`globals.css:238-322`) — solução pragmática e correta para dar dark mode a toda a app sem editar centenas de ficheiros; especificidade bem raciocinada nos comentários.
- **Bricolage Grotesque** corretamente carregada via `next/font` com pesos certos e `letter-spacing` negativo nos títulos — dá a personalidade editorial esperada.
- **Escala tipográfica e de raio/sombra tokenizadas** (`tailwind.config.ts:88-104`) — semântica clara (`titulo-pagina`, `corpo`, `legenda`).
- **`prefers-reduced-motion` respeitado** (`globals.css:391-409`) e uso de skeleton/shimmer em vez de spinner genérico — cuidado acima da média.
- **`tabular-nums`** para estatísticas, `focus-visible` (não `focus`) nos primitivos, `min-h-[44px]` nos itens de navegação — detalhes certos.
- Estados `disabled` presentes e coerentes em `button`/`input`.

---

## Recomendações (por ordem de impacto visual)

1. **Corrigir o hover do botão primário** → `hover:bg-primary/90` (`button.tsx:12`). Impacto imediato na perceção de qualidade em toda a app.
2. **Resolver o contraste laranja/branco** → adotar `laranja-600 #C7430F` como superfície de botões/badges com texto branco; manter `#F0531E` para acentos. Corrige AA de uma só vez.
3. **Uniformizar fallbacks da cor do clube** para `#F0531E` (`Navegacao.tsx`, 5 ocorrências).
4. **Alvos de toque ≥44px** na barra de topo e **remover `maximumScale: 1`** do viewport.
5. **Refatorar a landing** para tokens + escala semântica; alinhar dark mode (decidir se a marketing page é sempre escura ou segue o tema).
6. **Ring de foco do avatar** com `focus-visible:ring-primary` (`BarraTopo.tsx:75`) para consistência com os restantes primitivos.

---

## Veredicto Visual

**"Parece profissional o suficiente para ser vendido?"** → **COM CONDIÇÕES.**

O *bones* do design system é genuinamente bom — arquitetura de marca/clube, dark mode, tipografia e motion revelam maturidade acima do típico "projeto de faculdade". Mas há **dois defeitos que um comprador nota nos primeiros 10 segundos**: o botão primário que "apaga" no hover (#1) e o contraste fraco do texto branco sobre laranja (#2). Ambos são correções de 1-2 linhas cada. Resolvidos os 5 pontos do Top 5 (todos localizados e baratos), o produto passa de "quase lá" para **vendável sem hesitação**.
