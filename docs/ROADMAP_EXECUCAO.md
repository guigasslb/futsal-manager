# Mister — Roadmap de Execução (features de auditoria QA + personas)

> **Fonte de verdade do produto:** `docs/FutsalManager_Spec_v7.md` (secção 8 = analytics, secção 16 = ordem de desenvolvimento).
> **Regra inquebrável:** nenhuma alteração de código sem atualizar a bíblia no mesmo passo (changelog na secção 19).
> **Definição de pronto (por task):** conforme a bíblia · validação Zod + `Resultado<T>` · `auth()` + `obterEpocaAtiva()` + filtro por clube/época no servidor · estados loading/vazio/erro · responsivo (alvos ≥44px) · `npm run typecheck` + `npm run lint` + `npm run test` limpos (910 testes verdes) · secção da bíblia atualizada.

Este roadmap consolida os *findings* das **13 personas/agentes QA** de produto sobre o Mister e traduz as 5 features de roadmap (F1–F5) numa sequência priorizada por **impacto × esforço**. Complementa (não substitui) o `docs/EXECUTION_PLAN.md` — sempre que uma feature toca uma task já existente lá, é referenciada explicitamente para evitar duplicação e *scope creep*.

**Legenda de esforço:** S (≤0,5 dia) · M (~1–2 dias) · L (~3–5 dias) · XL (>1 semana).
**Legenda de impacto:** ALTO (pedido transversal / desbloqueia caso de uso sénior) · MÉDIO (fecha gap de completude) · BAIXO (higiene / rasto).

---

## 0. Sumário executivo

| Feature | Descrição curta | Impacto | Esforço | ROI | Ordem |
|---|---|---|---|---|---|
| **F1** | Export CSV/PDF dos analíticos | ALTO | **M** | ★★★★★ | **1.º** |
| **F2** | ACWR individual por atleta (via `RpeAtleta`) | ALTO | **M** | ★★★★☆ | **2.º** |
| **F3** | Deteção de conflitos de pavilhão na agenda | MÉDIO | **M** | ★★★☆☆ | **3.º** |
| **F4** | Upload de logótipo por ficheiro (Supabase Storage) | MÉDIO | **M–L** | ★★★☆☆ | **4.º** |
| **F5** | Audit trail básico de ações críticas | BAIXO/MÉDIO | **L** | ★★☆☆☆ | **5.º** |

**Ordem recomendada:** F1 → F2 → F3 → F4 → F5. F1 e F2 partilham a superfície analítica (`lib/actions/analise.ts` / `cargaTreino.ts`) e entregam o valor mais pedido pelos treinadores seniores; abrem o roadmap. F3 e F4 são melhorias de completude independentes entre si (podem correr em paralelo por especialistas diferentes). F5 é a de menor impacto/maior esforço — fecha o roadmap e **converge com a task já planeada `EXECUTION_PLAN.md` P3.3** (audit log / escrita concorrente).

**Nota de base factual (verificada no código):**
- Existe já um motor de carga puro e testável — `lib/utils/cargaTreino.ts` (`calcularCargaSemanal`) — mas hoje só é usado **por escalão/equipa** (`lib/actions/cargaTreino.ts::obterCargaSemanal`, RPE de `Sessao.rpeSessao`). **F2 reutiliza a mesma função pura** alimentando-a com `RpeAtleta.rpe × Sessao.duracaoMin` — não precisa de nova matemática nem de migração.
- Os analíticos (`lib/actions/analise.ts`) já produzem estruturas completas (`AnaliticoAtleta`, `AnaliticoEscalao`, `AnaliticoClubeEpoca`); **F1 é serialização** dessas estruturas para CSV/PDF, não recálculo.
- O relatório partilhável já imprime via `@media print` (`components/relatorios/BotaoImprimir.tsx`, `app/r/[token]/page.tsx`) e já existe geração de imagem server-side com `@vercel/og` (`app/api/social/card/route.tsx`) — **F1-PDF reaproveita uma destas duas vias**, não introduz um motor de PDF de raiz.
- A agenda unificada já lê treinos+jogos num stream cronológico (`lib/actions/agenda.ts`); `Sessao.local` e `Jogo.local` são **texto livre**, sem verificação de sobreposição — **F3 acrescenta deteção**, a estrutura de leitura já existe.
- O logótipo é hoje **só por URL** em dois sítios: `components/onboarding/WizardOnboarding.tsx` (linha ~238, "upload de ficheiro chega em breve") e `components/definicoes/BrandingForm.tsx` (linha ~91, mesmo texto). **F4 substitui o placeholder** por upload real.
- **Não existe** modelo de audit log genérico. Só há `criadorId` pontual em `Sessao`, `Jogo`, `Reuniao`, `RelatorioPartilhado`. **F5 introduz a entidade** e converge com `EXECUTION_PLAN.md` P3.3.

---

## F1 — Export CSV/PDF dos analíticos (ALTO · M · 1.º)

> **Justificação (personas):** treinadores de seniores e Diretor Técnico pediram, transversalmente, poder levar os dados para Excel/apresentações à direção. A bíblia §8.15 já promete **"exportável em PDF"**; o CSV é o formato universal que os mantém fora do Excel manual. O relatório web/token já existe — falta o **ficheiro**.
> **Âmbito:** serialização das estruturas analíticas **já calculadas**. Zero recálculo, zero migração, zero alteração de permissões (reutiliza `RELATORIOS_VER` / `exigirRelatorios`).

**Dependências:** nenhuma. É a fundação do roadmap.

### F1.1 — Utilitário puro de serialização CSV
- **Agente:** `backend-specialist`.
- **Descrição:** helper puro e testável `lib/utils/csv.ts` — `paraCsv(linhas, colunas)` com escape RFC 4180 (aspas, vírgulas, quebras de linha, BOM UTF-8 para Excel PT reconhecer acentos), separador `;` (convenção Excel PT-PT). Sem I/O, síncrono (mesma filosofia de `lib/utils/cargaTreino.ts`).
- **Ficheiros (novos):** `lib/utils/csv.ts`.
- **Critério de pronto:** função pura coberta por teste unitário (acentos, separadores, valores nulos, campos com aspas/`;`); zero dependências externas.

### F1.2 — Server Actions de export de analíticos
- **Agente:** `backend-specialist`.
- **Descrição:** actions que reaproveitam `obterAnaliticoEscalao` / `obterAnaliticoAtleta` e devolvem o CSV serializado (string + nome de ficheiro sugerido) dentro de `Resultado<T>`:
  - `exportarAnaliticoEscalaoCsv(escalaoId, epocaId?, competicaoId?)` — linhas por atleta: nome, golos, assistências, jogos utilizados, tempo acumulado, taxa de presença + colunas dinâmicas das métricas configuráveis (rankings de `AnaliticoEscalao.rankingsMetricas`).
  - `exportarEstatisticasAtletaCsv(atletaId, escalaoId?, epocaId?)` — linhas por jogo (evolução) + bloco de agregados + métricas configuráveis do atleta.
- **Ficheiros:** `lib/actions/analise.ts` (novas actions no fim do ficheiro), `lib/schemas/analise.ts` (schemas de input reutilizados/estendidos).
- **Critério de pronto:** actions validam Zod → `exigirRelatorios()` → `podeLerEscalao` → devolvem `Resultado<{ csv: string; nomeFicheiro: string }>`; os números batem **byte-a-byte** com o que a UI mostra (auto-revisão Regra Nº 6 — comparar contra a fonte `AnaliticoEscalao`, não contra o próprio teste); teste de action (permissão negada, escalão inexistente, época inexistente, agregados corretos).

### F1.3 — Botão de download CSV nos painéis de analíticos
- **Agente:** `frontend-specialist`.
- **Descrição:** botão "Exportar CSV" (client) que chama a action, cria um `Blob` e dispara o download no browser. Colocado no cabeçalho dos painéis de escalão e de atleta, ao lado de `GerarRelatorioBotao`. Estado de loading + toast de erro.
- **Ficheiros (novos):** `components/analiticos/ExportarCsvBotao.tsx`; integração em `components/analiticos/PainelEscalao.tsx` e `components/analiticos/PainelAtleta.tsx`.
- **Critério de pronto:** download funcional em desktop e mobile; `print:hidden` para não sair no PDF; alvo de toque ≥44px; estado desativado enquanto exporta.

### F1.4 — PDF do relatório (decisão de via + melhoria do print)
- **Agente:** `frontend-specialist` (execução) + `design-reviewer` (validação visual de impressão).
- **Descrição:** **decisão técnica a tomar no arranque da task** entre duas vias já disponíveis no repositório, sem introduzir motor novo:
  - **(a) Via print (recomendada, menor risco):** reforçar `@media print` no relatório partilhável (`app/r/[token]/page.tsx`) e nos painéis — forçar tema claro, alto contraste, quebras de página coerentes, esconder navegação — e expor um botão "Guardar como PDF" que aciona `window.print()`. Reaproveita `components/relatorios/BotaoImprimir.tsx`.
  - **(b) Via `@vercel/og`/render server-side:** só se (a) não der qualidade suficiente para multi-página; reaproveita o padrão de `app/api/social/card/route.tsx`.
- **Ficheiros:** `app/r/[token]/page.tsx`, `app/globals.css` (bloco `@media print`), `components/relatorios/BotaoImprimir.tsx`, `components/analiticos/PainelRelatorio.tsx`.
- **Critério de pronto:** relatório imprime **legível a preto sobre branco** (validação visual obrigatória — ver memória `feedback_visual_validation.md`: typecheck/lint/test **não** substitui verificação visual); identidade do clube (cor + logótipo) presente; **não** altera o tema default da app.
- **Nota de convergência:** sobrepõe-se a `EXECUTION_PLAN.md` P1.1 ("Relatórios PDF/impressão legíveis"). Se P1.1 já estiver feita, F1.4 fica reduzida a validar e adicionar o botão explícito de PDF.

**Critério de saída F1:** CSV de escalão e de atleta a descarregar com acentos corretos no Excel PT · números idênticos aos painéis · relatório imprime legível em PDF · testes de serialização + actions verdes · bíblia §8.15 atualizada (menção ao export de ficheiro) + changelog §19.

---

## F2 — ACWR individual por atleta (ALTO · M · 2.º)

> **Justificação (personas seniores + QA negócio):** o ACWR é **por atleta** por definição científica (cada jogador tem o seu sRPE = `duracaoMin × RPE individual`). Hoje só existe a curva agregada por escalão (`obterCargaSemanal`), que mascara o jogador em risco. `RpeAtleta` já está no schema e já é escrito (`registarRpeAtleta`) — os dados **entram e nunca são devolvidos** (write-only, mesmo anti-padrão que as métricas configuráveis pré-P1.9).
> **Âmbito:** leitura + visualização. Reutiliza a função pura `calcularCargaSemanal` alimentada com o RPE individual. **Sem migração** (`RpeAtleta` já existe) e **sem matemática nova**.

**Dependências:** nenhuma técnica. Beneficia de F1 estar feito primeiro (mesma superfície de analíticos, evita conflitos de merge nos painéis).

### F2.1 — Server Action de carga/ACWR individual
- **Agente:** `backend-specialist`.
- **Descrição:** `obterCargaAtletas(escalaoId, semanas?)` — para cada atleta ativo do escalão, constrói `SessaoCarga[]` onde `rpeSessao := RpeAtleta.rpe` do atleta naquela sessão (só sessões em que o atleta reportou RPE contam) e `duracaoMin := Sessao.duracaoMin`; corre `calcularCargaSemanal` e devolve o ACWR da semana corrente + zona por atleta. Uma query a `RpeAtleta` (com `sessao: { epocaId, escalaoId, data: { gte: janela } }`) + join ao atleta, agregada em memória por `atletaId` (mesmo padrão de `montarRankingsMetricas`).
- **Ficheiros:** `lib/actions/cargaTreino.ts` (nova action), `lib/schemas/cargaTreino.ts` (input).
- **Critério de pronto:** `obterMembroAtual` → `RELATORIOS_VER` → `podeLerEscalao`; devolve `Resultado<{ atletas: { atletaId, nome, acwrAtual, zona, cargaSemana }[] }>`; atletas sem RPE reportado surgem com `acwr: null`/zona `null` (não são excluídos silenciosamente); teste de action (permissão, agregação por atleta correta, zona correta nas fronteiras 0.8/1.3 — reutilizar `classificarAcwr`).

### F2.2 — Tabela de atletas com ACWR e zona de risco
- **Agente:** `frontend-specialist`.
- **Descrição:** componente que lista os atletas do escalão ordenados por risco (zona RISCO no topo), com badge colorido por zona (verde ideal / âmbar subcarga / vermelho risco — **mesmos tokens** de `CurvaCargaSemanal`: `#1E9E5A` / `#E0900A` / `#D33A3A`), valor de ACWR e carga da semana. Estado vazio "Sem RPE individual registado" quando ninguém reportou. Localização: secção "Carga de treino" do analítico de escalão, por baixo da `CurvaCargaSemanal` existente.
- **Ficheiros (novos):** `components/analiticos/TabelaAcwrAtletas.tsx`; integração em `components/analiticos/PainelEscalao.tsx` (secção §8.20 já existente).
- **Critério de pronto:** cores de zona idênticas ao gráfico existente (consistência); tabela acessível (`<table>` semântica, não divs); só aparece com ≥1 RPE individual na janela; validação visual das cores de risco.

**Critério de saída F2:** tabela de ACWR individual visível no analítico de escalão · zonas de risco corretas por atleta · dados que só entravam agora saem · testes verdes · bíblia §8.20 atualizada (remover o "FUTURO: agregação por atleta na vista individual" — passa a implementado) + changelog §19.

---

## F3 — Deteção de conflitos de pavilhão na agenda (MÉDIO · M · 3.º)

> **Justificação (persona DT):** a agenda unificada existe, mas com `local` em texto livre o DT não vê quando dois escalões marcam treino/jogo no mesmo pavilhão à mesma hora. É a dor concreta "não sei se o pavilhão está ocupado".
> **Âmbito:** verificação **não-bloqueante** (avisa, não impede). Sem migração; a leitura da agenda já existe.

**Dependências:** nenhuma. Independente de F1/F2 e F4 — pode correr em paralelo com F4 (especialistas distintos).

### F3.1 — Helper puro de sobreposição temporal
- **Agente:** `backend-specialist`.
- **Descrição:** helper puro `lib/utils/agenda-conflitos.ts` — normalização de `local` (trim + lowercase + colapso de espaços, para "Pavilhão A" ≡ "pavilhao a") e deteção de sobreposição de janelas `[data, data+duracao)` (duração default assumida quando `duracaoMin` é null — ex. 90 min, constante documentada). Puro e testável.
- **Ficheiros (novos):** `lib/utils/agenda-conflitos.ts`.
- **Critério de pronto:** teste unitário (mesma hora/mesmo local → conflito; local diferente → sem conflito; locais com capitalização/espaços diferentes → conflito; janelas adjacentes sem overlap → sem conflito; `local` vazio → nunca conflito).

### F3.2 — Deteção de conflito nas actions de criação/edição
- **Agente:** `backend-specialist`.
- **Descrição:** ao criar/editar sessão e jogo, consultar outros eventos do **mesmo clube** (todos os escalões) na mesma janela temporal e com `local` normalizado igual; devolver os conflitos encontrados **sem bloquear** a escrita (o `Resultado<T>` de sucesso passa a incluir `avisos?: ConflitoAgenda[]`, ou uma action de pré-verificação `verificarConflitoAgenda(...)` chamada pela UI antes de submeter). Decidir a via no arranque (preferência: pré-verificação, mantém a action de escrita com diff mínimo).
- **Ficheiros:** `lib/actions/treinos.ts`, `lib/actions/jogos.ts`, `lib/actions/agenda.ts` (se pré-verificação partilhada), `lib/schemas/` conforme via escolhida.
- **Critério de pronto:** verificação atravessa **todos os escalões do clube** (não só o do evento) respeitando o âmbito de leitura; **nunca impede** criar/editar (regra explícita da feature); a própria sessão/jogo em edição é excluída da verificação (não colide consigo mesma); teste de action.

### F3.3 — Aviso não-bloqueante na UI
- **Agente:** `frontend-specialist`.
- **Descrição:** banner/alerta suave (âmbar, não vermelho — é aviso, não erro) no `SessaoForm`/`JogoForm` quando há sobreposição: "Este pavilhão já tem [escalão] às [hora]". Também assinalar visualmente o conflito na vista de agenda/calendário do DT (`components/calendario/` se existir, ou lista da agenda).
- **Ficheiros:** `components/treinos/SessaoForm.tsx` (ou equivalente), `components/jogos/JogoForm.tsx`, componente de agenda do DT.
- **Critério de pronto:** aviso claramente distinto de erro de validação; permite submeter na mesma; alvo/contraste conformes; validação visual.

**Critério de saída F3:** criar dois eventos no mesmo pavilhão/hora mostra aviso em ambos sem bloquear · deteção transversal aos escalões · helper puro testado · bíblia §8.16 (dashboard/agenda) atualizada com a regra de aviso de conflito + changelog §19.

---

## F4 — Upload de logótipo por ficheiro (MÉDIO · M–L · 4.º)

> **Justificação (QA produto / onboarding):** o campo de logo pede URL e mostra "upload de ficheiro chega em breve" (hardcoded em dois sítios). Treinadores não sabem hospedar imagens → o clube fica sem identidade visual no relatório (o "wow" do produto) e nos cards sociais.
> **Âmbito:** upload real para Supabase Storage (o projeto já usa Supabase para a BD). **Não toca em auth** — Supabase Storage é um serviço distinto do Auth.js; o `logoUrl` continua a ser uma `String` no schema (guarda a URL pública do ficheiro), **sem migração de schema**.

**Dependências:** nenhuma de código. **Dependência de ops:** criar o bucket público de Storage no Supabase + credenciais de service role em variável de ambiente (a confirmar com o supervisor; documentar em `docs/DEPLOY.md` e `.env.example`).

> ⚠️ **Nota de segurança (não-auth):** o upload usa a *service role key* do Supabase **apenas no servidor** (Server Action). Nunca expor a chave ao cliente. Isto **não** é código de autenticação da app (Regra Sagrada Nº 3 não se aplica), mas exige cuidado de segredo — confirmar env com o supervisor antes de executar.

### F4.1 — Cliente de Storage + Server Action de upload
- **Agente:** `backend-specialist` (Server Action + integração Storage) · apoio de `devops-specialist` para bucket/env se necessário.
- **Descrição:** `lib/storage/supabase-storage.ts` (cliente server-only) + action `carregarLogotipoClube(formData)` que: valida `auth()` + capacidade `CLUBE_BRANDING`; valida o ficheiro com Zod (tipo `image/png|jpeg|webp|svg+xml`, tamanho ≤ ex. 2 MB, dimensões razoáveis); faz upload para o bucket (`clubes/{clubeId}/logo.{ext}`, upsert); grava a URL pública em `Clube.logoUrl`; `revalidatePath`. Devolve `Resultado<{ logoUrl: string }>`.
- **Ficheiros (novos):** `lib/storage/supabase-storage.ts`, `lib/schemas/upload.ts`; alterações em `lib/actions/clubes.ts` e/ou `lib/actions/onboarding.ts`.
- **Critério de pronto:** validação de tipo/tamanho no servidor (não confiar no cliente); chave de service role só no servidor; erro amigável quando o upload falha; teste de action (tipo inválido, tamanho excedido, sem permissão).

### F4.2 — Campo de upload no wizard e nas definições
- **Agente:** `frontend-specialist` · `preline-specialist` (componente de upload/preview consistente com o design system).
- **Descrição:** substituir o input de URL + texto "chega em breve" por um componente de upload com pré-visualização (drag&drop opcional, botão de ficheiro), mantendo a opção de URL como fallback. Aplicar nos **dois** sítios: `WizardOnboarding` (passo de identidade) e `BrandingForm` (definições do clube).
- **Ficheiros:** `components/onboarding/WizardOnboarding.tsx` (~linha 227-238), `components/definicoes/BrandingForm.tsx` (~linha 88-93); componente novo partilhado `components/definicoes/UploadLogotipo.tsx`.
- **Critério de pronto:** upload com preview funcional nos dois sítios; **remover** o texto "chega em breve" em ambos (auto-revisão Regra Nº 6 — não deixar placeholder morto); estado de loading/erro; alvo de toque ≥44px; validação visual.

### F4.3 — Documentação de ops
- **Agente:** `documentation-specialist`.
- **Descrição:** documentar no `docs/DEPLOY.md` (§6) a criação do bucket, as políticas de acesso e as variáveis de ambiente; atualizar `.env.example`.
- **Ficheiros:** `docs/DEPLOY.md`, `.env.example`.
- **Critério de pronto:** um operador consegue provisionar o Storage seguindo o doc, sem conhecimento prévio.

**Critério de saída F4:** upload de logótipo funcional no onboarding e nas definições · ficheiro servido por URL pública do Supabase · placeholder "em breve" removido dos dois sítios · segredo de Storage só no servidor · `docs/DEPLOY.md`/`.env.example` atualizados · bíblia §3.1 (comentário "ficheiro no Supabase Storage" já existe — confirmar) + changelog §19.

---

## F5 — Audit trail básico (BAIXO/MÉDIO · L · 5.º)

> **Justificação (persona DT):** trabalho a dois (treinador + adjunto) sem rasto de quem alterou o quê; o DT não consegue justificar decisões de equipa técnica. Sem auditoria não há accountability.
> **Âmbito:** log de **ações críticas** (criar/apagar atleta, alterar resultado de jogo, convidar/remover membro) + vista de consulta para DT/Admin. **É a de maior esforço e menor impacto do roadmap** — fecha a lista.
> **Convergência obrigatória:** esta feature **é** a task `EXECUTION_PLAN.md` P3.3 ("Audit log / escrita concorrente — last-write-wins"). **Não duplicar.** Antes de executar, alinhar âmbito com P3.3: decidir se inclui apenas audit log (esta F5) ou também *optimistic locking* (fica em P3.3). Recomendação: F5 entrega o **audit log**; o *optimistic locking* mantém-se decisão separada em P3.3.

**Dependências:** decisão de âmbito com `code-reviewer`/supervisor (fronteira F5 ↔ P3.3). Beneficia de vir por último (todas as actions críticas já estabilizadas por F1–F4).

### F5.1 — Modelo `RegistoAuditoria` + migração
- **Agente:** `database-specialist`.
- **Descrição:** modelo simples: `id`, `clubeId` (FK, index), `utilizadorId` (quem — FK `SetNull` para preservar histórico se o utilizador for apagado), `acao` (enum: `ATLETA_CRIADO`, `ATLETA_APAGADO`, `RESULTADO_ALTERADO`, `MEMBRO_CONVIDADO`, `MEMBRO_REMOVIDO`, …), `entidade` (string, ex. "Atleta"), `entidadeId` (string), `detalhe` (Json? — snapshot mínimo do antes/depois relevante), `criadoEm` (index desc). Índices por `clubeId, criadoEm`.
- **Ficheiros:** `prisma/schema.prisma` (novo modelo + enum), migração Prisma.
- **Critério de pronto:** migração aplica limpa; índices adequados à query dominante (feed por clube ordenado por data); `onDelete` coerente (auditoria **nunca** desaparece por cascata de utilizador).

### F5.2 — Helper de registo + instrumentação das actions críticas
- **Agente:** `backend-specialist`.
- **Descrição:** helper `registarAuditoria(ctx, { acao, entidade, entidadeId, detalhe })` chamado dentro das actions críticas, **na mesma transação** da escrita quando possível (para não registar ações que falharam). Instrumentar: `lib/actions/atletas.ts` (criar/apagar), `lib/actions/jogos.ts` (alterar resultado), `lib/actions/utilizadores.ts` / `onboarding.ts` (convidar/remover membro). Diff **mínimo** por action — só a chamada ao helper, sem refactor colateral (Regra Nº 6).
- **Ficheiros (novos):** `lib/actions/auditoria.ts` (helper + `listarAuditoria`); alterações mínimas em `atletas.ts`, `jogos.ts`, `utilizadores.ts`/`onboarding.ts`.
- **Critério de pronto:** cada ação crítica gera exatamente um registo com o autor correto; ação falhada **não** gera registo; sem *scope creep* nas actions instrumentadas; teste de action por cada gatilho.

### F5.3 — Vista de auditoria para DT/Admin
- **Agente:** `frontend-specialist`.
- **Descrição:** página/painel de consulta (só `CLUBE_UTILIZADORES` ou capacidade equivalente de Admin/DT) com feed cronológico, filtrável por tipo de ação e por autor; paginação. Estado vazio "Sem registos de auditoria".
- **Ficheiros (novos):** `app/(app)/definicoes/auditoria/page.tsx` (ou secção no painel de DT), `components/auditoria/`.
- **Critério de pronto:** só visível a quem tem a capacidade; feed legível em pt-PT com terminologia do glossário; responsivo; validação visual.

**Critério de saída F5:** ações críticas deixam rasto com autor e timestamp · DT/Admin consulta o feed filtrável · auditoria sobrevive a apagamento de utilizador · âmbito alinhado com P3.3 (sem duplicação) · testes verdes · bíblia (nova subsecção em §5.6/§8) + changelog §19.

---

## 1. Grafo de dependências

```
F1 (export)  ─┐
              ├─ superfície analítica partilhada (analise.ts / painéis) → fazer F1 antes de F2
F2 (ACWR ind) ┘

F3 (conflitos)  ── independente ──┐ podem correr em paralelo
F4 (logo upload) ── independente ─┘ (backend-specialist vs devops/frontend distintos)

F5 (audit)  ── por último ── converge com EXECUTION_PLAN.md P3.3 (decidir fronteira antes)
```

- **Sem dependências duras entre features.** A única ordem *recomendada* (não obrigatória) é F1 antes de F2 para evitar conflitos de merge nos painéis de analíticos.
- **F3 e F4 são paralelizáveis** por especialistas diferentes assim que F1/F2 libertarem a superfície analítica.
- **F5 depende de uma decisão** (fronteira com P3.3), não de código.

## 2. Cronograma sugerido (esforço acumulado)

| Sprint | Features | Esforço | Marco |
|---|---|---|---|
| Sprint 1 | **F1** (F1.1→F1.4) | M | Treinadores exportam CSV + PDF legível |
| Sprint 2 | **F2** (F2.1→F2.2) | M | ACWR individual visível; risco por atleta |
| Sprint 3 | **F3** ‖ **F4** (paralelo) | M + M–L | Conflitos de pavilhão + upload de logótipo |
| Sprint 4 | **F5** (F5.1→F5.3) | L | Audit trail; convergência com P3.3 |

## 3. Regras transversais (não negociáveis)

1. **Bíblia primeiro:** cada feature fecha com `docs/FutsalManager_Spec_v7.md` (secção relevante + changelog §19) atualizada **no mesmo passo** do código.
2. **Auth intocável:** nenhuma destas 5 features toca login/sessão/middleware/SDK de identidade. F4 usa Supabase **Storage** (serviço distinto do Auth.js) — se surgir qualquer dúvida de fronteira com auth, **parar e perguntar** (Regra Sagrada Nº 3).
3. **Gate de conclusão:** nada é "pronto" sem `typecheck` + `lint` + `test` (910 verdes) e zero stubs/TODOs (Regra Sagrada Nº 1). Tasks de UI/tema exigem **validação visual** adicional (memória `feedback_visual_validation.md`).
4. **Auto-revisão à primeira (Regra Nº 6):** sem *scope creep* (F5 instrumenta actions com diff mínimo), sem *dead code* (F4 remove o placeholder "em breve"), formatos validados contra a fonte real (F1 CSV comparado contra a estrutura analítica, não contra o próprio teste).
5. **Delegação (Regra Nº 2):** `database-specialist` (modelo/migração de F5) · `backend-specialist` (helpers puros, Server Actions, instrumentação) · `frontend-specialist`/`preline-specialist` (UI + Server Actions de wiring) · `design-reviewer` (validação visual de impressão/cores de risco) · `devops-specialist` (bucket/env de Storage) · `documentation-specialist` (DEPLOY/env) · `qa-specialist` (testes) · `functional-analyst` (bíblia).
6. **Convergência com o plano existente:** F1.4 ↔ `EXECUTION_PLAN.md` P1.1; F5 ↔ `EXECUTION_PLAN.md` P3.3. Verificar o estado dessas tasks antes de arrancar para não duplicar trabalho.

---

*Documento gerado a 2026-08-13. Fonte de verdade permanece `docs/FutsalManager_Spec_v7.md`. Este roadmap é um plano de execução — não altera a bíblia; cada task, ao ser executada, atualiza a bíblia no mesmo passo.*
