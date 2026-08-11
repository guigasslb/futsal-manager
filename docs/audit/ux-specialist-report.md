# Auditoria UX — Marta Sousa (UX Specialist)

> Testado mentalmente em iPhone SE (375×667) e num Android entry-level lento.
> Foco: fricção, carga cognitiva, alvos de toque e dark patterns.
> Data: 2026-08-11 · Âmbito: onboarding, dia-de-treino, registo de jogo, formulários.

---

## Journey Map — Fluxo mais crítico (Treinador, dia de treino)

O fluxo diário é o coração da app — é o que o treinador faz 2-3x por semana à beira do campo, muitas vezes com frio, com miúdos a chegar e o telemóvel numa mão. Tem de ser à prova de pressa.

| Passo | Ecrã | O que acontece | Fricção |
|---|---|---|---|
| 1 | Dashboard | Cartão-herói "Próximo treino · Marcar presenças" | ✅ Excelente. O atalho está onde deve estar, um toque. |
| 2 | `/treinos/[id]` | Página de detalhe do treino com 2 colunas (exercícios + presenças) | ⚠️ Em mobile as colunas empilham; o marcador de presenças fica **abaixo** da fila do gestor de exercícios. Scroll obrigatório antes de chegar ao que interessa naquele momento. |
| 3 | MarcadorPresencas | 16 atletas, todos default `PRESENTE` | ✅ O default "todos presentes" é a melhor decisão de UX da app. Só se toca nos ausentes. |
| 4 | Por cada ausente | Abrir `Select` → escolher entre 5 estados → (se falta) abrir 2º `Select` do motivo | ⚠️ 2 a 4 toques por ausente. Um dropdown com 5 opções para dizer "faltou" é peso a mais. Um toggle segmentado (Presente / Falta) resolvia em 1 toque. |
| 5 | Rodapé | "X presentes · Y faltas" + botão "Guardar presenças" | ✅ Contador em tempo real e gravação em lote. Bom. |

**Veredicto do fluxo:** o esqueleto está certo (default inteligente + save em lote), mas o passo 4 multiplica micro-fricção por cada ausente e o passo 2 obriga a scroll antes do valor. Num treino com 5 faltas, são ~15 toques onde podiam ser ~5.

---

## Top 10 Friction Points

| # | Severidade | Ecrã/Componente | Problema | Impacto |
|---|---|---|---|---|
| 1 | **CRÍTICO** | `RegistarForm.tsx` | Após registar, **não há auto-login**: `toast("Inicia sessão")` → empurra para `/login` e obriga a reintroduzir email + password. | Passo extra de zero valor logo no momento mais frágil. Perda de utilizadores no funil. Dark-pattern-adjacente (fricção gratuita). |
| 2 | **CRÍTICO** | Onboarding global | Do "Registar grátis" até marcar a 1ª presença: registo → re-login → criar clube → wizard 3 passos → vitória rápida 3 passos. São **~6 ecrãs de formulário antes do primeiro valor**. | Excede largamente a regra dos 3 passos. Onboarding percebido como "trabalho de setup", não como "já estou a usar". |
| 3 | **ALTO** | `JogoForm.tsx` | Formulário mistura **agendar** (quando/quem/onde) com **registar resultado** (golos marcados/sofridos, faltas 1ª/2ª parte) no mesmo ecrã. 13 campos para criar um jogo que ainda não aconteceu. | Carga cognitiva desnecessária. Pede-se o resultado de um jogo futuro. |
| 4 | **ALTO** | `JogoForm.tsx` | Dois campos com o **mesmo rótulo "Competição"**: um `Select` e um "Competição (texto livre)". | Confusão garantida. O utilizador não sabe qual preencher nem porquê. |
| 5 | **ALTO** | `select.tsx` (default) | `SelectTrigger` renderiza a **`h-10` (40px)** — abaixo do mínimo de 44px definido na própria §19.5. Afeta JogoForm, SessaoForm, JogoDetalhe (todos os selects sem override). | Falha de alvo de toque em ecrãs-chave. Dedos grandes, campo molhado, erros de toque. |
| 6 | **ALTO** | `AtletaForm.tsx` — chips de posição | Botões de posição `px-3 py-1.5` (~32px de altura) abaixo de 44px. | Toggle de posições difícil de acertar em mobile. |
| 7 | **MÉDIO** | MarcadorPresencas | Marcar ausência exige dropdown de 5 estados em vez de toggle rápido; sem ação "marcar todos" alternativa ao default. | Micro-fricção repetida por cada ausente. |
| 8 | **MÉDIO** | `WizardOnboarding.tsx` — remover escalão | Botão de lixo `h-9 w-9` (36px); input de cor `h-9 w-12`. | Abaixo de 44px num fluxo de setup mobile. |
| 9 | **MÉDIO** | Branding / AtletaForm | Logótipo e fotografia **só por URL** ("upload chega em breve"). | Treinador real não tem URLs de imagens à mão. Campo morto na prática → clubes sem logo/foto. |
| 10 | **MÉDIO** | Risco de rota pós-registo | Novo utilizador sem clube é empurrado para `/dashboard`, que mostra "Nenhuma época ativa" com link para Épocas — mas Épocas exige clube. `/criar-clube` existe mas não há redirect óbvio para lá. | Potencial beco sem saída/loop para o primeiro utilizador. **Precisa verificação em runtime.** |

---

## Avaliação Mobile (ecrã de 375px)

**O que funciona:**
- `Button` (`h-11`) e `Input` (`h-11`) cumprem os 44px. Base sólida.
- Dashboard é genuinamente bom em mobile: herói + ações rápidas empilham bem, cartões com toque generoso, lembretes de hoje no topo.
- Native `<select>` da Vitória Rápida usa `h-11` — correto (ao contrário do `Select` do design system).
- Tabelas com `overflow-x-auto` (plantel em massa) evitam quebra brutal.

**O que falha:**
- **Selects do design system a 40px** — inconsistência interna: o marcador de presenças e a participação do atleta forçam `h-11`, mas JogoForm e SessaoForm confiam no default `h-10`. Regressão silenciosa dos 44px.
- **Chips de posição a ~32px** — o pior alvo de toque da app.
- **Detalhe do treino** empilha exercícios *antes* das presenças: em dia de jogo o treinador quer presenças primeiro. Ordem errada para mobile.
- **JogoForm em coluna única** com 13 campos = scroll longo; os campos de resultado no meio interrompem o raciocínio de "estou só a agendar".
- Sem indicação de progresso de scroll nem sticky de ação em formulários longos (o botão "Guardar" fica no fim do scroll).

---

## Cognitive Load — Formulários

### `AtletaForm.tsx` — **Aceitável, mas longo**
- ✅ Só `nome` verdadeiramente obrigatório. Bom mínimo.
- ✅ Posições múltiplas com ajuda ("Podes escolher mais do que uma").
- ✅ Explicação da `dataIngresso` no sítio certo.
- ⚠️ Ecrã longo: Identidade + Participação + Encarregado + Observações. Em mobile é muito scroll para adicionar 1 miúdo. Para adicionar 16, a **Vitória Rápida (plantel em massa)** é a resposta certa — mas está escondida atrás do onboarding.
- ⚠️ Foto só por URL (ver #9).

### `SessaoForm.tsx` — **Bom**
- ✅ Só `data` + `escalão` obrigatórios; 6 campos opcionais bem sinalizados.
- ✅ Aviso âmbar "recomendado associar a planeamento" é gentil, não bloqueia.
- ✅ Reset do planeamento ao mudar de escalão evita estados inválidos.
- Nada a apontar de grave. É o formulário mais bem calibrado da app.

### `JogoForm.tsx` — **Sobrecarregado**
- ❌ 13 campos, mistura agendamento com resultado (ver #3).
- ❌ Duplicação "Competição" select vs texto livre (ver #4).
- ⚠️ `videoUrl`, faltas por parte e golos não pertencem ao momento de criação.
- **Recomendação:** dividir em "Agendar jogo" (data, adversário, casa/fora, escalão, competição, recinto) e mover resultado/estatísticas para o detalhe pós-jogo (onde a `JogoDetalhe` já vive, aliás).

### `JogoDetalhe` (estatísticas) — **Expert, tolerável**
- A grelha por atleta (utilização, bloco de tempo, minutos, golos, assistências, defesas, golos sofridos GR, faltas + métricas custom) é densa, mas é território de análise pós-jogo, provavelmente em tablet. Aceitável **se** os selects subirem para 44px.

---

## Recomendações Prioritizadas (Top 5)

1. **Auto-login após registo** — eliminar o passo de re-login. Registar deve criar sessão e ir direto para `/criar-clube` (ou wizard). *Ficheiro:* `components/auth/RegistarForm.tsx` + action `registar` em `lib/actions/onboarding.ts`. **(Nota: mexe em fluxo de autenticação — requer aprovação explícita antes de tocar.)**

2. **Corrigir alvo de toque dos Selects para 44px** — mudar o default `h-10` → `h-11` no `SelectTrigger`. Resolve JogoForm, SessaoForm e JogoDetalhe de uma vez. *Ficheiro:* `components/ui/select.tsx` (linha 22).

3. **Partir o `JogoForm`** — separar "agendar" de "registar resultado" e remover a duplicação "Competição". *Ficheiro:* `components/jogos/JogoForm.tsx`.

4. **Presenças com toggle rápido** — substituir o dropdown de 5 estados por um toggle segmentado Presente/Falta (com "mais opções" para justificar), e inverter a ordem no detalhe do treino (presenças antes de exercícios em mobile). *Ficheiros:* `components/treinos/MarcadorPresencas.tsx`, `app/(app)/treinos/[id]/page.tsx`.

5. **Chips de posição e botões de lixo a 44px** — subir os alvos de toque dos chips (`AtletaForm`) e dos botões de remover (`WizardOnboarding`). *Ficheiros:* `components/plantel/AtletaForm.tsx`, `components/onboarding/WizardOnboarding.tsx`.

---

## Veredicto UX

"Isto foi desenhado por alguém que percebe de futsal — o default 'todos presentes', a Vitória Rápida, o dashboard-herói e o SessaoForm mostram instinto de produto a sério. Mas ainda não está pronto para o treinador comum: obrigo-o a fazer login **duas vezes** para começar, atravesso-o por seis ecrãs antes de lhe entregar valor, dou-lhe um formulário de jogo que lhe pede o resultado de um jogo que ainda não jogou, e ponho-lhe metade dos botões abaixo dos 44px que o próprio código diz respeitar. Nada disto é arquitetura — é polish de fricção. Uma semana a apertar o funil de onboarding e os alvos de toque, e isto passa de 'promissor' a 'dou à minha equipa sem pedir desculpa'."

— Marta Sousa
