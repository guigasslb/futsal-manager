# FutsalCoach — Plano de Execução

> **Fonte de verdade do produto:** `docs/FutsalManager_Spec_v6.md` (secção 16 = ordem de desenvolvimento).
> **Regra inquebrável:** nenhuma alteração de código sem atualizar a bíblia no mesmo passo (changelog na secção 19).
> **Definição de pronto (por task):** conforme a bíblia · validação Zod + `Resultado<T>` · permissões verificadas no servidor · estados loading/vazio/erro · responsivo · `npm run typecheck` + `npm run lint` + `npm run test` limpos · secção da bíblia atualizada.

Este plano consolida os *findings* da auditoria (8 agentes) e da voz das personas (Rui, Carlos, Dr. António) numa sequência priorizada por **risco de segurança → bloqueio comercial → completude → qualidade → crescimento**.

**Legenda de complexidade:** S (≤0,5 dia) · M (~1–2 dias) · L (~3–5 dias) · XL (>1 semana).

**Nota de rigor factual (verificada no código antes de escrever este plano):**
- `AtletaEscalao` **já tem** `@@index([escalaoId, epocaId, estado])` (`prisma/schema.prisma:438`). O finding "sem índice" não é exato — a task real é **validar a ordem das colunas** face à query mais frequente, não criar de raiz.
- `EventoJogo.atletaId` é **scalar-only** sem `@relation` (`prisma/schema.prisma:854`) → confirmado sem constraint de FK. O mesmo padrão aplica-se aos restantes campos listados no finding.
- A rota pública `/r/[token]` está **intercetada pelo middleware de auth** (changelog 2026-08-06). Tornar B1 plenamente utilizável por visitantes anónimos **toca em auth** → exige autorização explícita do supervisor (Regra Sagrada Nº 3). Ver nota em B1.

---

## Phase 0 — Segurança & Desbloqueio (Semana 1)

Objetivo: eliminar as vulnerabilidades exploráveis **antes** de qualquer trabalho de produto. Nenhuma feature nova entra enquanto esta fase não fechar.

### P0.1 — Remover rotas de seed com tokens estáticos commitados (B3)
- **Descrição:** eliminar (ou proteger atrás de flag de ambiente + verificação de papel Admin) as rotas de seed que aceitam tokens estáticos versionados no repositório e disparam escritas em massa. Migrar qualquer seed legítimo para script `npm run db:seed*` fora do runtime HTTP.
- **Ficheiros:** `app/api/seed-sle-extra/route.ts`, `app/api/seed-sle-fix/route.ts` (remover); commit `d8f85c9` introduziu-os — reverter a superfície HTTP.
- **Complexidade:** S
- **Justificação de negócio:** qualquer utilizador autenticado pode corromper dados de clubes em massa — risco direto de integridade e de confiança comercial.
- **Dependências:** nenhuma.

### P0.2 — Corrigir vulnerabilidade `nanoid` (high severity)
- **Descrição:** `npm audit fix` para elevar `nanoid` acima da versão vulnerável; confirmar `npm audit --omit=dev` = 0 e re-correr `typecheck`/`lint`/`test`.
- **Ficheiros:** `package.json`, `package-lock.json`.
- **Complexidade:** S
- **Justificação de negócio:** dependência com CVE high — bloqueia qualquer *sign-off* de segurança para produção.
- **Dependências:** nenhuma.

### P0.3 — Impor no servidor "só `TipoSessao.NORMAL` pode ter `planeamentoId`"
- **Descrição:** validação de servidor (Zod `superRefine` + guarda na action) a rejeitar `planeamentoId` quando `tipo !== NORMAL`; incluído na Phase 0 por ser uma regra de integridade barata que evita dados inconsistentes já em circulação.
- **Ficheiros:** `lib/actions/treinos.ts`, `lib/schemas/` (schema da sessão).
- **Complexidade:** S
- **Justificação de negócio:** dados de periodização inconsistentes contaminam analytics do DT (argumento de venda do tier Clube).
- **Dependências:** nenhuma.

**Critério de "pronto" para avançar à Phase 1:** rotas de seed removidas/protegidas · `npm audit --omit=dev` = 0 vulnerabilidades · regra de `planeamentoId` com teste · build + testes verdes.

---

## Phase 1 — Bloqueadores Comerciais (Semanas 2–3)

Objetivo: tornar o produto **apresentável e vendável** (relatórios legíveis, landing clara para visitantes, conformidade RGPD mínima) e resolver a dívida de integridade de dados que trava analytics multi-escalão.

### P1.1 — Relatórios PDF/impressão legíveis (B1)
- **Descrição:** garantir que a vista pública de relatório imprime a preto sobre branco. Introduzir `@media print` (forçar tema claro na impressão, texto de alto contraste, remover fundos escuros do `.dark`), rever tokens usados nos painéis de relatório. **Não** alterar o tema *default* escuro da app — apenas o contexto de impressão/token de relatório.
- **Ficheiros:** `app/r/[token]/page.tsx`, `app/globals.css` (bloco `@media print`), `components/relatorios/`, `components/analiticos/PainelRelatorio.tsx`.
- **Complexidade:** M
- **Justificação de negócio:** relatório de época é a peça que o clube mostra a pais/direção — ilegível = produto parece amador.
- **Dependências:** nenhuma. **Nota de auth:** tornar `/r/[token]` acessível a **visitante anónimo** exige alterar o matcher do middleware (`middleware.ts` / `lib/auth.ts`) → **toca em auth, requer autorização explícita do supervisor** (Regra Sagrada Nº 3). B1 (legibilidade) resolve-se sem tocar em auth; a exposição pública é uma decisão separada a confirmar.

### P1.2 — Landing page pública legível para visitantes (B2)
- **Descrição:** garantir que `app/page.tsx` (landing pública, fora de `(app)`) apresenta cartões de preços e CTAs visíveis para um visitante novo — forçar contexto de tema claro na landing ou tokens explícitos independentes do `.dark`, sem depender da preferência persistida.
- **Ficheiros:** `app/page.tsx`, `app/globals.css` (escopo da landing).
- **Complexidade:** M
- **Justificação de negócio:** primeira impressão do funil de aquisição; preços invisíveis = zero conversão.
- **Dependências:** nenhuma.

### P1.3 — Hard-delete RGPD de atletas menores (B4)
- **Descrição:** implementar apagamento definitivo (hard-delete/anonimização irreversível) do atleta e dados pessoais associados, respeitando FKs (eventos, estatísticas, presenças, participações), distinto do soft-delete atual. Ação restrita por permissão, com confirmação forte e registo de auditoria.
- **Ficheiros:** `lib/actions/atletas.ts`, `components/plantel/ApagarAtletaButton.tsx`, `lib/schemas/` (schema de apagamento), `prisma/schema.prisma` (rever `onDelete` das relações do atleta), migração Prisma associada.
- **Complexidade:** L
- **Justificação de negócio:** exigência explícita do Presidente (Dr. António) antes de assinar; conformidade RGPD é condição de venda a clubes com menores.
- **Dependências:** P1.5 (constraints de FK devem existir antes de garantir apagamento em cascata consistente).

### P1.4 — Validar/alinhar índice de `AtletaEscalao` com a query mais frequente
- **Descrição:** confirmar que a query dominante (plantel por escalão/época/estado) usa o índice existente `@@index([escalaoId, epocaId, estado])`; se o padrão de acesso real for por `{epocaId, estado}` primeiro, **ajustar a ordem das colunas** ou adicionar índice complementar. Medir com `EXPLAIN` antes/depois.
- **Ficheiros:** `prisma/schema.prisma` (modelo `AtletaEscalao`, ~linha 438), nova migração Prisma.
- **Complexidade:** S
- **Justificação de negócio:** query mais frequente do produto; latência do plantel afeta toda a navegação diária do treinador.
- **Dependências:** nenhuma.

### P1.5 — Adicionar constraints de FK em falta na BD
- **Descrição:** converter os campos scalar-only em relações Prisma com `@relation` + `onDelete` apropriado, garantindo integridade referencial: `EventoJogo.atletaId`, `Planeamento.clubeId`, `Competicao.clubeId`, `ObservacaoAdversario.clubeId`, `ModeloJogo.clubeProprietarioId`. Rever a semântica de `onDelete` (Restrict vs Cascade vs SetNull) caso a caso.
- **Ficheiros:** `prisma/schema.prisma` (modelos nas linhas ~159, ~617, ~795, ~874, ~845), migração Prisma; rever actions que criam/apagam estas entidades (`lib/actions/jogos.ts`, `lib/actions/periodizacao.ts`, `lib/actions/competicoes.ts`, `lib/actions/scouting.ts`, `lib/actions/modeloJogo.ts`).
- **Complexidade:** M
- **Justificação de negócio:** dados órfãos corrompem analytics e relatórios que sustentam a subscrição de clube; base para o hard-delete RGPD (P1.3).
- **Dependências:** nenhuma (mas habilita P1.3).

**Critério de "pronto" para avançar à Phase 2:** relatório imprime legível (validado em PDF real) · landing legível para visitante anónimo · hard-delete RGPD funcional com teste · migrações de índice/FK aplicadas sem perda de dados · build + testes verdes · bíblia atualizada.

---

## Phase 2 — Completude do Produto (Semanas 4–8)

Objetivo: fechar os *gaps* comerciais que justificam a subscrição — sobretudo o tier Clube (€15+/mês) e o diferenciador do treinador. Mapeamento à spec: Lembretes = §3.15/§8.19 (fase 24); Analytics/Calendário DT alavancam §8.15/§8.16.

### P2.1 — Sistema de Lembretes / Tarefas (§3.15, §8.19)
- **Descrição:** modelo `Lembrete` + `LembreteDestinatario`; capacidade `LEMBRETES_EQUIPA_GERIR`; actions CRUD em `lib/actions/lembretes.ts`; schemas Zod; integração no dashboard (secção "atenção necessária"). Nota: já existe uma camada leve derivada (`lib/dashboard-lembretes.ts`, sem persistência) — esta task introduz a **entidade persistida** que a spec define.
- **Ficheiros (novos):** `prisma/schema.prisma` (modelos `Lembrete`/`LembreteDestinatario` + enum), migração, `lib/actions/lembretes.ts`, `lib/schemas/lembretes.ts`, `components/lembretes/`, integração em `app/(app)/dashboard/page.tsx`.
- **Complexidade:** L
- **Justificação de negócio:** funcionalidade completamente ausente vs. spec; organização do dia-a-dia é *sticky feature* de retenção.
- **Dependências:** nenhuma.

### P2.2 — Calendário unificado para Diretor Técnico (§8.16)
- **Descrição:** vista agregada de todos os treinos, jogos e reuniões de **todos os escalões** do clube numa única linha temporal/calendário, filtrável por escalão, com destaque temporal. Novo Server Component de leitura agregada respeitando permissões de DT/Admin.
- **Ficheiros (novos/alterados):** `app/(app)/calendario/page.tsx`, `components/calendario/`, action de leitura agregada em `lib/actions/` (nova, ex. `agenda.ts`), item de navegação em `components/layout/Navegacao.tsx`.
- **Complexidade:** L
- **Justificação de negócio:** identificado como o **maior gap para justificar a subscrição de clube**; pedido explícito do DT (Carlos): "os dados existem — ninguém os juntou".
- **Dependências:** nenhuma (usa dados existentes de Sessao/Jogo/Reuniao).

### P2.3 — UI de carreira do atleta (dados já existem em `AtletaEscalao`)
- **Descrição:** vista de percurso do atleta ao longo de épocas/escalões (transferências, promoções, número por escalão, datas), a partir de `AtletaEscalao`. Nova aba no perfil do atleta.
- **Ficheiros:** `app/(app)/plantel/[id]/page.tsx` (nova aba "Carreira"), `components/plantel/`, leitura em `lib/actions/participacoes.ts` ou `lib/actions/atletas.ts`.
- **Complexidade:** M
- **Justificação de negócio:** dados existentes sem exposição = valor por libertar; reforça a narrativa "percurso do atleta" para o clube.
- **Dependências:** nenhuma.

### P2.4 — Perfil do treinador / Histórico de carreira
- **Descrição:** perfil profissional do treinador com histórico de carreira (clubes, escalões, épocas, conquistas), como diferenciador comercial e âncora do argumento "o que crias é teu para toda a carreira" (§17.3).
- **Ficheiros (novos):** `prisma/schema.prisma` (extensão do perfil/`Utilizador` ou entidade de histórico) + migração, `lib/actions/perfis.ts` (extensão), `lib/schemas/`, `app/(app)/perfil/` (nova rota/aba), `components/perfil/`.
- **Complexidade:** L
- **Justificação de negócio:** diferenciador comercial chave para a licença Individual (treinador); sustenta o percurso "individual → mostra ao clube → clube adere".
- **Dependências:** nenhuma.

**Critério de "pronto" para avançar à Phase 3:** Lembretes persistidos + no dashboard · calendário unificado do DT funcional · carreira do atleta e perfil do treinador visíveis · cada feature com testes de action · build + testes verdes · bíblia atualizada (secções 3.15/8.16/8.19 e changelog).

---

## Phase 3 — Qualidade & Testes (contínuo)

Objetivo: fechar a dívida de testes. **Corre em paralelo** com Phases 1–2 — cada feature nova entrega já com testes; esta fase recupera a cobertura em falta do existente. Estado atual: 21 ficheiros de teste, 584 testes; **14 de 28 ficheiros de actions sem teste**.

### P3.1 — Testes de unidade das actions sem cobertura
- **Descrição:** cobrir com testes (validação Zod, guardas de `auth()`, filtro por clube/época, caminhos de erro `Resultado<T>`) as 14 actions sem teste: caderneta, épocas, métricas, reuniões, periodização, jogos, convocatória (participações), analise, exercícios, escalões, habilidades, atletas, utilizadores, comunicação.
- **Ficheiros (novos):** `tests/caderneta.test.ts`, `tests/epocas.test.ts`, `tests/metricas.test.ts`, `tests/reunioes.test.ts`, `tests/periodizacao.test.ts`, `tests/jogos.test.ts`, `tests/participacoes-convocatoria.test.ts`, `tests/analise.test.ts`, `tests/exercicios.test.ts`, `tests/escaloes.test.ts`, `tests/habilidades.test.ts`, `tests/atletas.test.ts`, `tests/utilizadores.test.ts`, `tests/comunicacao-actions.test.ts` — sobre `lib/actions/*.ts` correspondentes.
- **Complexidade:** L
- **Justificação de negócio:** metade das actions sem rede de segurança = regressões silenciosas em fase sensível de go-live.
- **Dependências:** nenhuma (mas atualizar quando P1/P2 alteram estas actions).

### P3.2 — Testes de integração real (não mockados)
- **Descrição:** introduzir camada de integração contra BD real (Postgres de teste/`testcontainers` ou Supabase branch) para os fluxos críticos: criação de atleta → participação → convocatória → estatística → agregação; e hard-delete RGPD. Complementa (não substitui) os testes mockados.
- **Ficheiros (novos):** `tests/integration/` + configuração Vitest de integração, ajuste em `package.json` (script `test:integration`).
- **Complexidade:** XL
- **Justificação de negócio:** todos os testes atuais usam Prisma mock — não validam migrações, constraints (P1.5) nem cascatas reais (P1.3).
- **Dependências:** P1.3 e P1.5 (para validar constraints/cascade reais).

**Critério de "pronto" (revisitado a cada release):** ≥ 90% dos ficheiros de actions com teste · fluxo crítico coberto por teste de integração real · `npm run test` verde em CI.

---

## Phase 4 — Melhorias de UX & Crescimento (pós-launch)

Objetivo: reduzir fricção diária (voz do Rui) e desbloquear monetização self-service. Entra depois do launch estar seguro e vendável.

### P4.1 — Botão "todos presentes" no marcador de presenças
- **Descrição:** ação única que marca todos os convocados/atletas do escalão como presentes, com upsert em lote; toggle rápido por atleta mantém-se.
- **Ficheiros:** `components/treinos/MarcadorPresencas.tsx`, `lib/actions/treinos.ts` (ou `participacoes.ts`).
- **Complexidade:** S
- **Justificação de negócio:** Rui: "16 miúdos = 16 toques" — atrito diário direto que afeta adoção do treinador solo.
- **Dependências:** nenhuma.

### P4.2 — Botão "Guardar presenças" sticky/floating
- **Descrição:** tornar a ação de guardar sempre visível (barra fixa/flutuante), com alvo de toque ≥44px.
- **Ficheiros:** `components/treinos/MarcadorPresencas.tsx`.
- **Complexidade:** S
- **Justificação de negócio:** reduz erros de "esqueci de guardar" em listas longas no telemóvel.
- **Dependências:** P4.1 (mesma superfície).

### P4.3 — Simplificar `JogoForm` (modo básico)
- **Descrição:** reduzir a fricção do registo de jogo — modo básico com o mínimo de campos obrigatórios e restantes em "avançado/opcional", mantendo a validação Zod.
- **Ficheiros:** `components/jogos/JogoForm.tsx`, `lib/schemas/` (revisão de obrigatórios), `lib/actions/jogos.ts`.
- **Complexidade:** M
- **Justificação de negócio:** Rui: "12+ campos obrigatórios para um jogo" — barreira ao registo rápido no dia de jogo.
- **Dependências:** nenhuma.

### P4.4 — Billing funcional self-service (Paddle)
- **Descrição:** substituir o placeholder "Upgrade em breve" por checkout real e webhook de subscrição, sobre a arquitetura `Licenca`/`Carteira` já desenhada (§17.5). Tiers por nº de escalões; absorção/crédito. **Não toca em auth** — apenas subscrição/faturação. Confirmar servidores/faturação europeus (exigência do Presidente).
- **Ficheiros:** `lib/actions/licenciamento.ts`, `app/(app)/definicoes/licenca/page.tsx`, novo webhook `app/api/paddle/webhook/route.ts`, `prisma/schema.prisma` (campos `paddle*` se em falta) + migração, `lib/schemas/`.
- **Complexidade:** XL
- **Justificação de negócio:** sem billing self-service é impossível cobrar — bloqueia a receita do produto.
- **Dependências:** P0 fechada (superfície de rotas segura); confirmação de provider/entidade europeia.

### P4.5 — Enriquecimento da carreira do treinador (crescimento)
- **Descrição:** evoluir o perfil do treinador (P2.4) com conquistas, partilha pública e métricas de carreira agregadas — reforço do diferenciador comercial ao longo do tempo.
- **Ficheiros:** `app/(app)/perfil/`, `components/perfil/`, `lib/actions/perfis.ts`.
- **Complexidade:** M
- **Justificação de negócio:** ativo de retenção e de marketing boca-a-boca entre treinadores.
- **Dependências:** P2.4.

**Critério de "pronto":** fricções diárias eliminadas (validadas com utilizadores-piloto Rui/Carlos) · billing a processar um pagamento real end-to-end em ambiente de teste · build + testes verdes.

---

## Resumo por Fase

| Fase | Tasks | Complexidade (S/M/L/XL) | Peso estimado* | Critério de saída |
|---|---|---|---|---|
| **0 — Segurança & Desbloqueio** | 3 | S×3 | ~1,5 dias | Seed removido/protegido · `npm audit` = 0 · regra `planeamentoId` testada · build+testes verdes |
| **1 — Bloqueadores Comerciais** | 5 | S×1, M×2, L×1, +S(P1.4) → S×2, M×2, L×1 | ~1,5–2 semanas | Relatório imprime legível · landing legível anónima · hard-delete RGPD com teste · migrações índice/FK aplicadas · bíblia atualizada |
| **2 — Completude do Produto** | 4 | M×1, L×3 | ~3–4 semanas | Lembretes persistidos · calendário DT · carreira atleta + perfil treinador · testes de action · bíblia atualizada |
| **3 — Qualidade & Testes** | 2 | L×1, XL×1 | contínuo (~2–3 semanas de esforço) | ≥90% actions testadas · fluxo crítico com integração real · CI verde |
| **4 — UX & Crescimento** | 5 | S×2, M×2, XL×1 | pós-launch (~3–4 semanas) | Fricções diárias eliminadas · billing end-to-end em teste · build+testes verdes |

\* Estimativas de esforço para uma equipa pequena; Phase 3 corre em paralelo com 1–2.

### Contagem global
- **Total de tasks:** 19 (P0: 3 · P1: 5 · P2: 4 · P3: 2 · P4: 5).
- **Distribuição de complexidade:** S×7 · M×5 · L×5 · XL×2.
- **Caminho crítico de release (bloqueia venda):** P0 completa → P1 completa. Só depois se abre a captação comercial séria; Phase 2 aprofunda o valor do tier Clube; Phase 4 desbloqueia a cobrança.

### Regras transversais a todas as fases (não negociáveis)
1. **Bíblia primeiro:** cada task fecha com o `docs/FutsalManager_Spec_v6.md` (secção relevante + changelog §19) atualizado no mesmo passo.
2. **Auth intocável:** qualquer item que roce login/middleware/SDK de identidade (nomeadamente exposição pública de `/r/[token]`) **pára e pede autorização explícita** ao supervisor.
3. **Gate de conclusão:** nada é declarado "pronto" sem `typecheck` + `lint` + `test` verdes e zero stubs/TODOs (Regra Sagrada Nº 1).
4. **Delegação:** cada task é executada pelo especialista adequado (`database-specialist` para migrações/índices/FK, `backend-specialist` para actions/CQRS, `frontend-specialist`/`bff-backend-specialist` para UI e Server Actions, `qa-specialist` para Phase 3, `functional-analyst` para atualização da bíblia).
