# Mister — Plano de Execução

> **Fonte de verdade do produto:** `docs/Mister_Spec_v7.md` (secção 16 = ordem de desenvolvimento).
> **Regra inquebrável:** nenhuma alteração de código sem atualizar a bíblia no mesmo passo (changelog na secção 19).
> **Definição de pronto (por task):** conforme a bíblia · validação Zod + `Resultado<T>` · permissões verificadas no servidor · estados loading/vazio/erro · responsivo · `npm run typecheck` + `npm run lint` + `npm run test` limpos · secção da bíblia atualizada.

Este plano consolida os *findings* da auditoria (**22 agentes**: 8 técnicos iniciais + 14 de produto/personas/mercado/UX) e da voz das personas numa sequência priorizada por **risco de segurança → bloqueio comercial → completude → qualidade → crescimento**.

**Legenda de complexidade:** S (≤0,5 dia) · M (~1–2 dias) · L (~3–5 dias) · XL (>1 semana).
**Legenda de estado:** ✅ concluída · 🔒 requer autorização explícita do supervisor (toca em auth — Regra Sagrada Nº 3).

---

## Changelog do Plano

### 2026-08-11 — Consolidação dos 22 agentes de auditoria
O plano anterior foi construído com dados parciais (11 dos 22 agentes). Esta revisão integra os restantes 11 relatórios (`docs/audit/`: product-owner, 3 personas de treinador, competitive-analyst, growth-specialist, copywriter-pt, social-media-manager, ux-specialist, ui-design-reviewer, marketing-strategist). Principais mudanças:

- **Concluídas marcadas ✅:** P0.1 (remoção das rotas de seed HTTP com tokens estáticos — commit `3ca0a35`) e o erro gramatical da landing ("Tudo o do plano Individual" → corrigido em `app/page.tsx:95`).
- **Finding corrigido:** `AtletaEscalao` **já tem** o índice `@@index([escalaoId, epocaId, estado])` — P1.4 é **validar a ordem de colunas com `EXPLAIN`**, não criar índice (já estava correto no plano; reconfirmado por 2 relatórios).
- **Tasks de auth isoladas com 🔒:** auto-login pós-registo e exposição anónima de `/r/[token]` — **não executar sem confirmação do supervisor**.
- **Novas tasks P0 (segurança):** anonimizar/isolar seed real do Sport Lisboa e Évora (RGPD — possíveis dados de menores); corrigir "Registar grátis" mentiroso na landing (não há free tier — spec §17.6).
- **Novas tasks P1 (bloqueadores comerciais):** semear época+escalão em `criarClube()`; acionar wizard de onboarding; adicionar `COMUNICACOES_GERIR` ao perfil Treinador Principal; agregar métricas configuráveis (hoje write-only) nos analíticos.
- **Novas tasks P2 (completude):** análise por competição; hover do botão primário invertido; contraste AA laranja/branco; decidir `visivelOutrosTreinadores` (UI ou remover); **touch targets dos selects (40→44px) promovido de P3 para P2** (identificado por 2 agentes independentes — ux-specialist + ui-design-reviewer).
- **Nova task P3 (qualidade):** ausência de audit log / escrita concorrente last-write-wins — avaliar aceitação para MVP ou optimistic locking.
- **Novas tasks P4 (crescimento):** trial de 14–30 dias; cards sociais nativos para Instagram; análise de carga de treino (RPE/ACWR).
- **Prioridade rebaixada:** "Botão todos presentes" — o comportamento **já existe** (default `PRESENTE` no `MarcadorPresencas`); falta apenas um botão explícito para clareza UX, não uma feature em falta.

---

**Nota de rigor factual (verificada no código):**
- `AtletaEscalao` **já tem** `@@index([escalaoId, epocaId, estado])` (`prisma/schema.prisma:438`). Task real = **validar a ordem das colunas** com `EXPLAIN` face à query mais frequente (P1.4).
- `EventoJogo.atletaId` é **scalar-only** sem `@relation` (`prisma/schema.prisma:854`) → confirmado sem constraint de FK (P1.5).
- As rotas de seed HTTP `app/api/seed-sle-*` **já não existem** (P0.1 ✅). O risco que **sobra** é o **script de seed de dados reais** (Sport Lisboa e Évora) em `prisma/data-migrations/` — dados de um clube real, possivelmente com menores → RGPD (P0.4).
- Métricas configuráveis (`ValorMetrica`) são **write-only**: gravadas por jogo mas `lib/actions/analise.ts` **nunca as lê** (confirmado por 3 personas — P1.9).
- `COMUNICACOES_GERIR` **ausente** do perfil Treinador Principal (`lib/permissoes-catalogo.ts:160-169`) apesar de o perfil ter `CONVOCATORIA_GERIR` — incoerência que bloqueia o caso de uso nº1 do treinador (P1.8).
- `criarClube()` (`lib/actions/onboarding.ts`) **não cria** época nem escalão → `obterEpocaAtiva()` devolve `null` → dashboard bloqueado; wizard `/onboarding` existe mas **nunca é acionado** (nenhum `redirect("/onboarding")` no código) — P1.6, P1.7.

---

## Phase 0 — Segurança & Desbloqueio (Semana 1)

Objetivo: eliminar vulnerabilidades e riscos legais **antes** de qualquer trabalho de produto. Nenhuma feature nova entra enquanto esta fase não fechar.

### ✅ P0.1 — Remover rotas de seed com tokens estáticos commitados (B3) — CONCLUÍDA
- **Estado:** ✅ **DONE** (commit `3ca0a35`, 2026-08-11). As rotas `app/api/seed-sle-extra/route.ts` e `app/api/seed-sle-fix/route.ts` foram removidas; os seeds migraram para scripts fora do runtime HTTP. A superfície de escrita-em-massa via HTTP já não existe (confirmado pelo product-owner).
- **Nota:** o risco residual (dados reais no script de seed) passa para P0.4.

### P0.2 — Corrigir vulnerabilidade `nanoid` (high severity)
- **Descrição:** `npm audit fix` para elevar `nanoid` acima da versão vulnerável; confirmar `npm audit --omit=dev` = 0 e re-correr `typecheck`/`lint`/`test`.
- **Ficheiros:** `package.json`, `package-lock.json`.
- **Complexidade:** S · **Dependências:** nenhuma.
- **Justificação:** dependência com CVE high — bloqueia *sign-off* de segurança para produção.

### P0.3 — Impor no servidor "só `TipoSessao.NORMAL` pode ter `planeamentoId`"
- **Descrição:** validação de servidor (Zod `superRefine` + guarda na action) a rejeitar `planeamentoId` quando `tipo !== NORMAL`. Regra de integridade barata que evita dados inconsistentes.
- **Ficheiros:** `lib/actions/treinos.ts`, `lib/schemas/` (schema da sessão).
- **Complexidade:** S · **Dependências:** nenhuma.
- **Justificação:** dados de periodização inconsistentes contaminam analytics do DT (argumento de venda do tier Clube).

### P0.4 — Anonimizar/isolar o seed de dados reais do Sport Lisboa e Évora (RGPD) — **NOVA**
- **Descrição:** o seed `prisma/data-migrations/seed_sport_lisboa_evora*.ts` (commit `d8f85c9`, "Seed temporário") contém **dados de um clube real** (Sport Lisboa e Évora 2025/26). Verificar se inclui **atletas menores reais**; se sim, anonimizar (nomes fictícios, remover contactos/encarregados) ou remover o script do repositório. Garantir que não corre por engano em produção nem contamina ambientes.
- **Ficheiros:** `prisma/data-migrations/seed_sport_lisboa_evora*.ts` (e quaisquer `*_core.ts` associados).
- **Complexidade:** S · **Dependências:** nenhuma.
- **Justificação:** dados pessoais de menores num repositório sem consentimento = risco RGPD direto e bloqueador legal de venda a clubes com formação. (Levantado por product-owner e social-media-manager.)

### P0.5 — Corrigir "Registar grátis" mentiroso na landing (não há free tier) — **NOVA (urgente)**
- **Descrição:** a spec §17.6 é explícita — **"sem trial, sem freemium — compra directa"**. A landing repete "Registar grátis" (×5) e promete algo que não existe; pedir €4,99 + cartão logo a seguir destrói confiança na primeira interação. **Decisão de negócio necessária:** (a) alterar o copy para honesto ("Criar conta", "Ver planos", "Criar conta — €4,99/mês"); **ou** (b) criar um **trial real de 14 dias** e então usar "Experimentar grátis 14 dias" (ver P4.6). Enquanto a decisão não é tomada, aplicar (a) — a página **não pode mentir**.
- **Ficheiros:** `app/page.tsx` (CTAs hero + pricing).
- **Complexidade:** S · **Dependências:** decisão de negócio sobre trial (P4.6).
- **Justificação:** afeta conversão **e** honestidade; marketing-strategist classifica-o como "pecado mortal da página". Urgente.
- **Nota:** o erro gramatical relacionado ("Tudo o do plano Individual" → "Tudo o que tens no plano Individual") **já foi corrigido** ✅ (`app/page.tsx:95`, 2026-08-11).

**Critério de saída Phase 0:** `npm audit --omit=dev` = 0 · regra `planeamentoId` com teste · seed real anonimizado/isolado · landing sem "grátis" mentiroso · build + testes verdes.

---

## Phase 1 — Bloqueadores Comerciais (Semanas 2–3)

Objetivo: tornar o produto **ativável e vendável** — desbloquear o funil de onboarding, corrigir a incoerência de permissões que trava o caso de uso nº1, dar vida às métricas custom, e fechar a dívida de integridade/RGPD.

### P1.1 — Relatórios PDF/impressão legíveis (B1)
- **Descrição:** garantir que a vista pública de relatório imprime a preto sobre branco. `@media print` (forçar tema claro, texto de alto contraste, remover fundos escuros do `.dark`). **Não** alterar o tema *default* — apenas o contexto de impressão.
- **Ficheiros:** `app/r/[token]/page.tsx`, `app/globals.css` (bloco `@media print`), `components/relatorios/`, `components/analiticos/PainelRelatorio.tsx`.
- **Complexidade:** M · **Dependências:** nenhuma.
- **Justificação:** o relatório de época é a peça que o clube mostra a pais/direção; ilegível = produto parece amador.

### P1.2 — Landing page pública legível para visitantes (B2)
- **Descrição:** garantir que `app/page.tsx` apresenta preços e CTAs visíveis a um visitante novo — forçar contexto de tema claro ou tokens explícitos independentes do `.dark`, sem depender da preferência persistida. Migrar as cores hardcoded (`const LARANJA`, `const INK`, `style={{}}` inline) para os tokens do design system.
- **Ficheiros:** `app/page.tsx`, `app/globals.css` (escopo da landing).
- **Complexidade:** M · **Dependências:** nenhuma.
- **Justificação:** primeira impressão do funil; preços invisíveis = zero conversão. (ui-design-reviewer: a landing contorna o design system.)

### P1.3 — Hard-delete RGPD de atletas menores (B4)
- **Descrição:** apagamento definitivo (hard-delete/anonimização irreversível) do atleta e dados pessoais associados, respeitando FKs (eventos, estatísticas, presenças, participações), distinto do soft-delete atual. Restrito por permissão, com confirmação forte e registo de auditoria.
- **Ficheiros:** `lib/actions/atletas.ts`, `components/plantel/ApagarAtletaButton.tsx`, `lib/schemas/`, `prisma/schema.prisma` (rever `onDelete`), migração Prisma.
- **Complexidade:** L · **Dependências:** P1.5 (constraints de FK devem existir antes de garantir cascata consistente).
- **Justificação:** exigência do Presidente (Dr. António) antes de assinar; RGPD é condição de venda a clubes com menores.

### P1.4 — Validar/alinhar índice de `AtletaEscalao` com `EXPLAIN`
- **Descrição:** confirmar que a query dominante (plantel por escalão/época/estado) usa o índice existente `@@index([escalaoId, epocaId, estado])`; se o padrão real for por `{epocaId, estado}` primeiro, **ajustar a ordem das colunas** ou adicionar índice complementar. Medir com `EXPLAIN` antes/depois. **Não criar índice de raiz** — já existe.
- **Ficheiros:** `prisma/schema.prisma` (~linha 438), nova migração se necessário.
- **Complexidade:** S · **Dependências:** nenhuma.
- **Justificação:** query mais frequente do produto; latência do plantel afeta a navegação diária.

### P1.5 — Adicionar constraints de FK em falta na BD
- **Descrição:** converter campos scalar-only em relações Prisma com `@relation` + `onDelete` apropriado: `EventoJogo.atletaId`, `Planeamento.clubeId`, `Competicao.clubeId`, `ObservacaoAdversario.clubeId`, `ModeloJogo.clubeProprietarioId`. Rever semântica de `onDelete` (Restrict/Cascade/SetNull) caso a caso.
- **Ficheiros:** `prisma/schema.prisma` (~159, ~617, ~795, ~874, ~845), migração; rever `lib/actions/jogos.ts`, `periodizacao.ts`, `competicoes.ts`, `scouting.ts`, `modeloJogo.ts`.
- **Complexidade:** M · **Dependências:** nenhuma (habilita P1.3).
- **Justificação:** dados órfãos corrompem analytics e relatórios que sustentam a subscrição de clube.

### P1.6 — `criarClube()` deve semear época ativa + escalão por defeito — **NOVA**
- **Descrição:** `criarClube()` só cria `Clube` + `Perfil`(s) + `MembroClube`, deixando o ambiente **sem época e sem escalão** → `obterEpocaAtiva()` devolve `null` → dashboard bloqueado em "Nenhuma época ativa" e a `/vitoria-rapida` arranca partida. Dentro da transação, criar uma `Epoca` corrente (ex. "2026/2027", `ativa: true`) e 1–2 escalões-semente editáveis (ex. "Seniores").
- **Ficheiros:** `lib/actions/onboarding.ts` (`criarClube`).
- **Complexidade:** M · **Dependências:** nenhuma.
- **Justificação:** **correção de maior ROI** do relatório de growth — desbloqueia sozinha o dashboard e o percurso de vitória rápida. Sem isto o novo clube vai direto para um beco.

### P1.7 — Acionar o wizard de onboarding no primeiro acesso — **NOVA**
- **Descrição:** o wizard `app/(onboarding)/` (identidade → escalões → época) existe e está bem feito, mas **nunca é acionado** — não há `redirect("/onboarding")` em lado nenhum. Acionar após `criarClube()` com sucesso (ou no `(app)/layout.tsx` quando `!clube.onboardingConcluido`). A página já protege contra reentrada.
- **Ficheiros:** `lib/actions/onboarding.ts` e/ou `app/(app)/layout.tsx`.
- **Complexidade:** S · **Dependências:** P1.6 (semear reduz o trabalho do wizard, mas são independentes).
- **Justificação:** o caminho feliz de 5 minutos existe no código mas está desligado da porta de entrada.

### P1.8 — Adicionar `COMUNICACOES_GERIR` ao perfil Treinador Principal — **NOVA**
- **Descrição:** o perfil Treinador Principal tem `CONVOCATORIA_GERIR` (decide quem é convocado) mas **não** tem `COMUNICACOES_GERIR` → o botão "Gerar convocatória" para WhatsApp **nunca aparece** ao treinador de escalão, que é o **caso de uso nº1** (tarefa mais repetida da semana). Incoerência confirmada pela persona Joana (Benjamins). Adicionar a capacidade ao catálogo do perfil por defeito.
- **Ficheiros:** `lib/permissoes-catalogo.ts` (linhas ~160-169, perfil Treinador Principal).
- **Complexidade:** S · **Dependências:** nenhuma.
- **Justificação:** sem isto a app falha o caso de uso nº1 do treinador de clube; o componente `ConvocatoriaWhatsApp` já existe, está apenas escondido por permissão.

### P1.9 — Agregar métricas configuráveis nos analíticos (hoje write-only) — **NOVA**
- **Descrição:** as métricas custom (`ValorMetrica`) são gravadas por jogo (`JogoDetalhe.tsx`) mas `lib/actions/analise.ts` **nunca as lê** — são write-only. Os três treinadores (André, Miguel, Joana) apontam isto como o gap mais crítico: "registo 'recuperações'/'remates' e a app engole e nunca me devolve". Ler e agregar as métricas custom nos painéis de atleta/escalão/época (evolução + ranking), a par dos campos nativos.
- **Ficheiros:** `lib/actions/analise.ts`, `components/analiticos/` (painéis atleta/escalão), `components/graficos/`.
- **Complexidade:** L · **Dependências:** nenhuma.
- **Justificação:** transforma dados enterrados em valor analítico; é o argumento que separa "arquivador com bom design" de "ferramenta de análise a sério" para o treinador Nível 2.

### P1.10 🔒 — Auto-login após registo — **REQUER AUTORIZAÇÃO EXPLÍCITA**
- **Descrição:** após criar conta, `registar()` faz `toast("Inicia sessão")` + `router.push("/login")`, obrigando o utilizador a reintroduzir email+password. Desejável autenticar a sessão logo após criar o utilizador e ir direto para `/criar-clube`/wizard. **Isto altera o fluxo de sessão/autenticação** → **PARA e pede autorização explícita ao supervisor (Regra Sagrada Nº 3). NÃO EXECUTAR SEM CONFIRMAÇÃO.**
- **Ficheiros (a confirmar após autorização):** `components/auth/RegistarForm.tsx`, `lib/actions/onboarding.ts` (`registar`).
- **Complexidade:** S · **Dependências:** autorização do supervisor.
- **Justificação:** identificado como fricção CRÍTICA por ux-specialist e growth-specialist (ponto de abandono no momento mais frágil do funil).

### P1.11 🔒 — Expor `/r/[token]` a visitantes anónimos — **REQUER AUTORIZAÇÃO EXPLÍCITA**
- **Descrição:** o relatório partilhável (`/r/[token]`) está **intercetado pelo middleware de auth** → um visitante anónimo não o abre, partindo funcionalmente a proposta de valor "link partilhável" (o "wow" do produto). Tornar a rota pública exige alterar o matcher do middleware. **Isto toca em auth** → **PARA e pede autorização explícita ao supervisor. NÃO EXECUTAR SEM CONFIRMAÇÃO.** A legibilidade em impressão (P1.1) resolve-se em paralelo **sem** tocar em auth.
- **Ficheiros (a confirmar após autorização):** `middleware.ts` / `lib/auth.ts` (matcher).
- **Complexidade:** S · **Dependências:** autorização do supervisor.
- **Justificação:** o relatório de fim de época é o cartão de visita e o motor de UGC orgânico (social-media-manager); hoje está partido para quem não tem conta.

**Critério de saída Phase 1:** relatório imprime legível (PDF real) · landing legível para visitante · hard-delete RGPD com teste · migrações índice/FK aplicadas · clube novo desbloqueado (época+escalão+wizard) · treinador vê "Gerar convocatória" · métricas custom nos analíticos · build + testes verdes · bíblia atualizada · tasks 🔒 só avançam com autorização.

---

## Phase 2 — Completude do Produto (Semanas 4–8)

Objetivo: fechar os *gaps* que justificam a subscrição (sobretudo o tier Clube e o diferenciador do treinador) e resolver os defeitos visuais que um comprador nota nos primeiros 10 segundos.

### P2.1 — Sistema de Lembretes / Tarefas (§3.15, §8.19)
- **Descrição:** modelo `Lembrete` + `LembreteDestinatario`; capacidade `LEMBRETES_EQUIPA_GERIR`; actions CRUD; schemas Zod; integração no dashboard ("atenção necessária"). Existe já uma camada leve derivada (`lib/dashboard-lembretes.ts`, sem persistência) — esta task introduz a **entidade persistida** e os lembretes **de equipa** (DT atribui tarefas), que são o valor do tier Clube/DT.
- **Ficheiros (novos):** `prisma/schema.prisma` (`Lembrete`/`LembreteDestinatario` + enum), migração, `lib/actions/lembretes.ts`, `lib/schemas/lembretes.ts`, `components/lembretes/`, integração em `app/(app)/dashboard/page.tsx`.
- **Complexidade:** L · **Dependências:** nenhuma.
- **Justificação:** ausente vs. spec; sticky feature de retenção e ferramenta de coordenação do DT.

### P2.2 — Calendário unificado para Diretor Técnico (§8.16)
- **Descrição:** vista agregada de todos os treinos, jogos e reuniões de **todos os escalões** do clube numa única linha temporal, filtrável por escalão. Novo Server Component de leitura agregada respeitando permissões de DT/Admin.
- **Ficheiros (novos/alterados):** `app/(app)/calendario/page.tsx`, `components/calendario/`, action agregada em `lib/actions/agenda.ts`, item de nav em `components/layout/Navegacao.tsx`.
- **Complexidade:** L · **Dependências:** nenhuma.
- **Justificação:** **maior gap para justificar a subscrição de clube** (product-owner + persona DT: "os dados existem — ninguém os juntou"). Também resolve a dor da Joana de não saber se o pavilhão está ocupado.

### P2.3 — UI de carreira do atleta (dados já existem em `AtletaEscalao`)
- **Descrição:** vista de percurso do atleta ao longo de épocas/escalões (transferências, promoções, número por escalão, datas). Nova aba no perfil do atleta.
- **Ficheiros:** `app/(app)/plantel/[id]/page.tsx` (aba "Carreira"), `components/plantel/`, leitura em `lib/actions/participacoes.ts` ou `atletas.ts`.
- **Complexidade:** M · **Dependências:** nenhuma.
- **Justificação:** dados existentes sem exposição = valor por libertar.

### P2.4 — Perfil do treinador / Histórico de carreira (§8.17)
- **Descrição:** perfil profissional do treinador com histórico de carreira (clubes, escalões, épocas, conquistas) — âncora do argumento "o que crias é teu para toda a carreira" (§17.3). Não existe hoje (nem modelo `RegistoCarreira`).
- **Ficheiros (novos):** `prisma/schema.prisma` (`RegistoCarreira` / extensão do perfil) + migração, `lib/actions/perfis.ts`, `lib/schemas/`, `app/(app)/perfil/`, `components/perfil/`.
- **Complexidade:** L · **Dependências:** nenhuma.
- **Justificação:** diferenciador comercial chave da licença Individual; melhor argumento de venda ao treinador solo, hoje sem UI (marketing-strategist + product-owner).

### P2.5 — Análise por competição — **NOVA**
- **Descrição:** `Jogo.competicaoId` e o modelo `Competicao` existem, mas `lib/actions/analise.ts` **nunca filtra nem agrupa por competição** — mistura campeonato, taça e particulares no mesmo saco. Adicionar filtro/agrupamento por competição nos analíticos de escalão (V/E/D, golos, rankings por competição).
- **Ficheiros:** `lib/actions/analise.ts`, `components/analiticos/PainelEscalao.tsx`, filtros de UI.
- **Complexidade:** M · **Dependências:** compõe bem com P1.9 (mesma superfície analítica).
- **Justificação:** apontado como "básico" e em falta pelas 3 personas de treinador; mantém-nos no Excel para separar contextos.

### P2.6 — Corrigir hover invertido do botão primário — **NOVA**
- **Descrição:** `components/ui/button.tsx:12` usa `hover:bg-primary/50` que **clareia** o botão no hover (parece desativado). Mudar para `hover:bg-primary/90` (escurece), como já faz o `destructive`.
- **Ficheiros:** `components/ui/button.tsx` (linha 12).
- **Complexidade:** S · **Dependências:** nenhuma.
- **Justificação:** gesto de interação mais repetido da app, invertido; defeito que um comprador nota nos primeiros 10 segundos (ui-design-reviewer).

### P2.7 — Corrigir contraste AA (branco sobre laranja) — **NOVA**
- **Descrição:** texto branco sobre `#F0531E` = **3.51:1** (AA exige 4.5:1). Adotar `laranja-600 #C7430F` (4.95:1, já existe em `tailwind.config.ts:22`) para superfícies com texto branco (botões primários, badge "Recomendado", CTAs da landing), mantendo `#F0531E` para acentos/ícones/bordas.
- **Ficheiros:** `components/ui/button.tsx:12`, `app/page.tsx` (CTAs + badge), tokens.
- **Complexidade:** S · **Dependências:** nenhuma.
- **Justificação:** acessibilidade WCAG AA — condição de qualidade para venda; correção localizada e barata.

### P2.8 — Decidir `visivelOutrosTreinadores` (implementar UI ou remover do schema) — **NOVA**
- **Descrição:** o campo existe no schema mas **nunca é renderizado** — sem ecrã para o Admin marcar escalões como "visíveis a outros treinadores" (dead field). Avaliar: (a) implementar a UI (habilita a Joana ver o calendário de outros escalões / ocupação do pavilhão, complementando P2.2); ou (b) remover do schema para não deixar dívida morta.
- **Ficheiros:** `prisma/schema.prisma`, `app/(app)/definicoes/escaloes/` (se implementar) ou migração de remoção.
- **Complexidade:** S · **Dependências:** relaciona com P2.2.
- **Justificação:** dead code / campo morto (Regra de auto-revisão Nº 6); decisão explícita evita dívida silenciosa.

### P2.9 — Touch targets dos selects a 44px (promovido de P3) — **NOVA**
- **Descrição:** `SelectTrigger` (`components/ui/select.tsx`, ~linha 22) renderiza `h-10` (40px), abaixo do mínimo de 44px que a própria spec §19.5 exige; afeta `JogoForm`, `SessaoForm`, `JogoDetalhe`. Mudar o default para `h-11`. Rever também chips de posição (`AtletaForm`, ~32px), botões de remover do wizard (`WizardOnboarding`, 36px) e ícones da barra de topo (`BarraTopo`, 36px); avaliar remover `maximumScale: 1` do viewport (`app/layout.tsx:25`) que bloqueia pinch-zoom.
- **Ficheiros:** `components/ui/select.tsx`, `components/plantel/AtletaForm.tsx`, `components/onboarding/WizardOnboarding.tsx`, `components/layout/BarraTopo.tsx`, `app/layout.tsx`.
- **Complexidade:** S · **Dependências:** nenhuma.
- **Justificação:** **identificado por 2 agentes independentes** (ux-specialist + ui-design-reviewer) → promovido de P3 para P2. Regressão silenciosa dos 44px em ecrãs-chave.

**Critério de saída Phase 2:** Lembretes persistidos + no dashboard · calendário unificado do DT · carreira do atleta e perfil do treinador visíveis · análise por competição · hover/contraste/touch-targets corrigidos · `visivelOutrosTreinadores` decidido · testes de action · build + testes verdes · bíblia atualizada.

---

## Phase 3 — Qualidade & Testes (contínuo)

Objetivo: fechar a dívida de testes e de rastreabilidade. **Corre em paralelo** com Phases 1–2. Estado atual: 21 ficheiros de teste, 584 testes; 14 de 28 ficheiros de actions sem teste.

### P3.1 — Testes de unidade das actions sem cobertura
- **Descrição:** cobrir com testes (Zod, guardas de `auth()`, filtro por clube/época, erros `Resultado<T>`) as 14 actions sem teste: caderneta, épocas, métricas, reuniões, periodização, jogos, participações (convocatória), analise, exercícios, escalões, habilidades, atletas, utilizadores, comunicação.
- **Ficheiros (novos):** `tests/*.test.ts` sobre `lib/actions/*.ts` correspondentes.
- **Complexidade:** L · **Dependências:** atualizar quando P1/P2 alteram estas actions.
- **Justificação:** metade das actions sem rede de segurança = regressões silenciosas em go-live.

### P3.2 — Testes de integração real (não mockados)
- **Descrição:** camada de integração contra BD real (Postgres de teste/`testcontainers` ou Supabase branch) para fluxos críticos: atleta → participação → convocatória → estatística → agregação; e hard-delete RGPD. Complementa os testes mockados.
- **Ficheiros (novos):** `tests/integration/` + config Vitest de integração, script `test:integration`.
- **Complexidade:** XL · **Dependências:** P1.3 e P1.5 (validar constraints/cascade reais).
- **Justificação:** todos os testes atuais usam Prisma mock — não validam migrações, constraints nem cascatas reais.

### P3.3 — Audit log / escrita concorrente (last-write-wins) — **NOVA**
- **Descrição:** não existe `criadoPor`/`atualizadoPor` no schema (só `Sessao` e `RelatorioPartilhado` guardam o criador). Trabalho a dois (treinador + adjunto) fica sem rasto de quem alterou o quê, e as server actions fazem upsert sem deteção de conflito — **last-write-wins** silencioso (dois a editar a grelha do mesmo jogo → o último apaga o do outro). **No code review, decidir:** é aceitável para o MVP, ou precisa de audit log + optimistic locking (ex. coluna `version`/`updatedAt` com verificação)?
- **Ficheiros (se avançar):** `prisma/schema.prisma` (campos de auditoria/versão) + migração, actions de escrita relevantes (`jogos.ts`, `participacoes.ts`, etc.).
- **Complexidade:** L · **Dependências:** decisão de âmbito (code-reviewer/supervisor).
- **Justificação:** risco de perda de trabalho e ausência de rasto em cenário multi-utilizador (persona André, treinador de clube com adjunto).

**Critério de saída (por release):** ≥ 90% dos ficheiros de actions com teste · fluxo crítico com integração real · decisão de audit log registada · `npm run test` verde em CI.

---

## Phase 4 — Melhorias de UX & Crescimento (pós-launch)

Objetivo: reduzir fricção diária, desbloquear monetização self-service e fechar o loop de crescimento orgânico. Entra depois de o launch estar seguro e vendável.

### P4.1 — Botão explícito "Marcar todos presentes / limpar" (rebaixada)
- **Descrição:** **o comportamento já existe** — o `MarcadorPresencas` já entra com todos default `PRESENTE` (a melhor decisão de UX da app, confirmada por ux-specialist e persona Joana). Falta apenas um **botão explícito** "Marcar todos presentes / limpar" para os dias em que o treinador quer repor tudo rápido — clareza UX, não feature nova.
- **Ficheiros:** `components/treinos/MarcadorPresencas.tsx`.
- **Complexidade:** S · **Dependências:** nenhuma.
- **Justificação:** micro-melhoria de clareza; **rebaixada** face ao plano anterior porque o valor central já está entregue pelo default.

### P4.2 — Botão "Guardar presenças" sticky/floating
- **Descrição:** tornar a ação de guardar sempre visível (barra fixa/flutuante), alvo ≥44px. Considerar também toggle segmentado Presente/Falta (1 toque) em vez do dropdown de 5 estados por ausente.
- **Ficheiros:** `components/treinos/MarcadorPresencas.tsx`, `app/(app)/treinos/[id]/page.tsx` (ordem presenças↔exercícios em mobile).
- **Complexidade:** S · **Dependências:** P4.1 (mesma superfície).
- **Justificação:** reduz erros de "esqueci de guardar" e micro-fricção por ausente em listas longas no telemóvel.

### P4.3 — Simplificar `JogoForm` (agendar vs registar resultado)
- **Descrição:** separar "Agendar jogo" (data, adversário, casa/fora, escalão, competição, recinto) de "Registar resultado" (golos, faltas por parte, `videoUrl`), movendo o resultado para o detalhe pós-jogo (`JogoDetalhe`). Remover a **duplicação "Competição"** (select vs texto livre com o mesmo rótulo). Manter validação Zod.
- **Ficheiros:** `components/jogos/JogoForm.tsx`, `lib/schemas/`, `lib/actions/jogos.ts`.
- **Complexidade:** M · **Dependências:** nenhuma.
- **Justificação:** 13 campos a pedir o resultado de um jogo futuro = carga cognitiva e confusão (ux-specialist).

### P4.4 — Billing funcional self-service (Paddle)
- **Descrição:** substituir o placeholder "Upgrade em breve" por checkout real + webhook, sobre a arquitetura `Licenca`/`Carteira` (§17.5). Tiers por nº de escalões; absorção/crédito (`simularAbsorcao`/`aplicarCreditoAbsorcao` não existem). **Não toca em auth.** Confirmar servidores/faturação europeus. Confirmar que `criarLicencaDemostracao` não fica acessível como "licença grátis" em produção.
- **Ficheiros:** `lib/actions/licenciamento.ts`, `app/(app)/definicoes/licenca/page.tsx`, `app/api/paddle/webhook/route.ts`, `prisma/schema.prisma` (campos `paddle*`) + migração, `lib/schemas/`.
- **Complexidade:** XL · **Dependências:** P0 fechada; confirmação de provider europeu.
- **Justificação:** sem billing self-service não há receita do segmento individual; product-owner recomenda **founders faturados à mão** primeiro e **não abrir venda individual antes desta task**.

### P4.5 — Enriquecimento da carreira do treinador (crescimento)
- **Descrição:** evoluir o perfil do treinador (P2.4) com conquistas, partilha pública e métricas de carreira agregadas.
- **Ficheiros:** `app/(app)/perfil/`, `components/perfil/`, `lib/actions/perfis.ts`.
- **Complexidade:** M · **Dependências:** P2.4.
- **Justificação:** ativo de retenção e de marketing boca-a-boca entre treinadores.

### P4.6 — Trial de 14–30 dias — **NOVA**
- **Descrição:** introduzir um trial (14–30 dias) ou tier grátis limitado (ex. 1 escalão, 1 época, sem analytics de clube) para o treinador individual, para **desarmar a objeção do "grátis"** contra Spond (gratuito) e SportEasy (freemium). Decisão de negócio que alimenta o copy da landing (P0.5): se houver trial, "Experimentar grátis 14 dias" passa a ser honesto.
- **Ficheiros:** `lib/actions/licenciamento.ts`, `prisma/schema.prisma` (estado de trial) + migração, `app/page.tsx` (copy), fluxo de registo.
- **Complexidade:** L · **Dependências:** P4.4 (billing) para conversão pós-trial; P0.5 (alinhamento de copy).
- **Justificação:** competitive-analyst classifica a ausência de trial/freemium como **fraqueza estrutural do pricing**; "compra directa sem experimentar" é atrito máximo num mercado com baixa disposição para pagar.

### P4.7 — Geração de cards sociais nativos para Instagram — **NOVA**
- **Descrição:** a app gera web/PDF e texto de WhatsApp mas **não gera um card quadrado pronto para Instagram** (card de resultado, MVP do jogo, ranking/"Pichichi"), com escudo do clube + marca discreta. Hoje o utilizador tem de fazer print e cortar. Fechar o loop de UGC orgânico.
- **Ficheiros (novos):** gerador de imagem (server-side, ex. `@vercel/og` ou canvas), `lib/actions/` + rota de imagem, botões de partilha nos ecrãs de jogo/ranking.
- **Complexidade:** L · **Dependências:** nenhuma.
- **Justificação:** social-media-manager identifica-o como **o multiplicador orgânico nº1** — o que separa potencial social "médio" de "alto". Respeitar RGPD (nunca dados reais de menores em assets da marca).

### P4.8 — Análise de carga de treino (RPE/ACWR) — **NOVA**
- **Descrição:** a periodização atual é só um **container de datas** (mesociclo/microciclo como inteiros soltos, sem hierarquia); não existe `carga`, `intensidade`, `RPE`, `volume` nem `ACWR` — a sessão só tem `duracaoMin`. Introduzir carga percebida por sessão/atleta e uma curva semanal (MD-1/MD-2…), com deteção de risco (ACWR). Feature avançada para o treinador Nível 2 de seniores.
- **Ficheiros (novos):** `prisma/schema.prisma` (carga por sessão/atleta) + migração, `lib/actions/periodizacao.ts` (extensão), `components/graficos/` (curva de carga), `lib/schemas/`.
- **Complexidade:** L · **Dependências:** nenhuma.
- **Justificação:** persona Miguel (solo seniores, Nível 2): "periodização sem gestão de carga é um calendário bonito"; é precisamente o pedaço que falta e que interessa a quem periodiza a sério.

**Critério de saída:** fricções diárias eliminadas (validadas com pilotos) · billing a processar pagamento real em teste · trial e cards sociais operacionais · build + testes verdes.

---

## Resumo por Fase

| Fase | Tasks | Notas |
|---|---|---|
| **0 — Segurança & Desbloqueio** | 5 (1 ✅) | P0.1 concluída · nanoid · planeamentoId · seed RGPD · landing "grátis" honesta |
| **1 — Bloqueadores Comerciais** | 11 (2 🔒) | relatório/landing legíveis · RGPD hard-delete · índice/FK · onboarding desbloqueado · permissão convocatória · métricas nos analíticos · auth 🔒 (auto-login, `/r/[token]`) |
| **2 — Completude do Produto** | 9 | Lembretes · calendário DT · carreira atleta+treinador · análise por competição · hover/contraste/touch-targets · `visivelOutrosTreinadores` |
| **3 — Qualidade & Testes** | 3 | actions sem teste · integração real · audit log/optimistic locking |
| **4 — UX & Crescimento** | 8 | presenças polish · JogoForm · billing Paddle · carreira+ · trial · cards sociais · carga de treino |

### Contagem global
- **Total de tasks:** 36 (P0: 5 · P1: 11 · P2: 9 · P3: 3 · P4: 8).
- **Concluídas ✅:** P0.1 (+ erro gramatical da landing corrigido em `app/page.tsx:95`).
- **Requerem autorização 🔒 (auth):** P1.10 (auto-login), P1.11 (`/r/[token]` anónimo).
- **Caminho crítico de release (bloqueia venda):** P0 completa → P1 completa (exceto 🔒, que dependem do supervisor). Só depois se abre a captação comercial séria; Phase 2 aprofunda o valor do tier Clube; Phase 4 desbloqueia cobrança e crescimento orgânico.

### Regras transversais (não negociáveis)
1. **Bíblia primeiro:** cada task fecha com `docs/Mister_Spec_v7.md` (secção + changelog §19) atualizado no mesmo passo.
2. **Auth intocável:** qualquer item que roce login/middleware/sessão/SDK de identidade (P1.10, P1.11) **pára e pede autorização explícita** ao supervisor (Regra Sagrada Nº 3). Marcado 🔒.
3. **Gate de conclusão:** nada é "pronto" sem `typecheck` + `lint` + `test` verdes e zero stubs/TODOs (Regra Sagrada Nº 1).
4. **Auto-revisão à primeira:** sem scope creep, sem dead code, diff mínimo (Regra Sagrada Nº 6). P2.8 (`visivelOutrosTreinadores`) existe precisamente para não deixar campo morto.
5. **Delegação:** cada task é executada pelo especialista adequado — `database-specialist` (migrações/índices/FK), `backend-specialist` (actions/permissões/CQRS), `frontend-specialist`/`bff-backend-specialist` (UI e Server Actions), `preline-specialist`/`design-reviewer` (UI/tokens), `qa-specialist` (Phase 3), `functional-analyst` (bíblia).
