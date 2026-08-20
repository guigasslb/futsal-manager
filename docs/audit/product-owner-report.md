# Avaliação de Produto — Ricardo Faria (Product Owner)

> Data: 2026-08-11 · Base: `docs/Mister_Spec_v6.md` (bíblia), `CLAUDE.md`, `docs/EXECUTION_PLAN.md` e verificação directa no código (rotas `app/(app)`, `lib/actions`, `prisma/schema.prisma`).
> Método: cruzei cada módulo funcional da spec (§8) com a rota real + Server Action real. Não avaliei "está no changelog"; avaliei "existe rota + action + modelo".

---

## Spec vs Implementação

| Secção da Spec | Feature | Implementada? | Qualidade | Notas |
|---|---|---|---|---|
| §8.1 | Onboarding + Vitória Rápida | ✅ Sim | Boa | `onboarding/` + `vitoria-rapida/`; conclusão marcada em `localStorage` (flag `Clube.onboardingConcluido` deferida). `criarAtletasEmMassa` da spec não existe — massa é `criarAtleta` em loop no cliente. Aceitável. |
| §8.2 | Membros, perfis, overrides | ✅ Sim | Boa | `definicoes/utilizadores` + `definicoes/perfis`; overrides (extra/revogadas) + delegação no servidor. |
| §8.3 | Branding do clube | ✅ Sim | Boa | `definicoes/clube`; logótipo por URL. |
| §8.4 | Definições base (escalões/épocas/métricas/habilidades/subcategorias) | ✅ Sim | Boa | Todas as rotas presentes. |
| §8.5 | Plantel + participações N-N (`AtletaEscalao`) | ✅ Sim | Boa | Refactor de nível-de-clube feito; número por escalão; associar/transferir/terminar. |
| §8.6 | Exercícios + 2 bibliotecas + editor de campo | ✅ Sim | Boa | Editor SVG interativo (diferenciador central). Toggle pessoal/clube + partilha. |
| §8.7 | Templates de sessão | ✅ Sim | Boa | `treinos/templates` + `criarSessaoDeTemplate`. |
| §8.8 | Treinos + presenças | ✅ Sim | Boa | Lista/calendário; motivo de falta; upsert em lote. |
| §8.9 | Periodização | ✅ Sim | Média | `treinos/periodizacao`; regra "só NORMAL liga a planeamento" ainda **não imposta no servidor** (P0.3). |
| §8.10 | Modelo de jogo + quadro tático + bolas paradas | ✅ Sim | Boa | `modelo-jogo/` + `QuadroTatico`. |
| §8.11 | Jogos + competições + stats + classificação + scouting | ✅ Sim | Boa | Classificação por inserção manual (`obterClassificacao`); `ResultadoCompeticao`; live/blocos; scouting no jogo. Módulo mais rico. |
| §8.12 | Comunicação (gerador WhatsApp) | ✅ Sim | Boa | `comunicacoes/` completo. **Pendente ops:** seed global de templates em produção. |
| §8.13 | Reuniões + Google Calendar | ⚠️ Parcial | Média | Reuniões ✅. Google Calendar: `integracao/` + `api/google/callback` existem, mas OAuth **por validar** (⚠️ da própria spec). Risco de não estar operacional end-to-end. |
| §8.14 | Caderneta | ✅ Sim | Boa | Progresso + celebração. |
| §8.15 | Analytics 3 níveis + relatório partilhável + PDF | ✅ Sim | Boa | `obterAnaliticoAtleta/Escalao/ClubeEpoca`; `gerarRelatorioPartilhado` + `/r/[token]`. **Mas** o link partilhável está intercetado por auth (ver Decisão 2). |
| §8.16 | Dashboard contextual | ✅ Sim | Boa | Herói temporal + "atenção necessária" + cascata. |
| §8.17 | **Perfil do treinador + carreira (`RegistoCarreira`)** | ❌ **Não** | — | **Não existe rota `perfil/`, não existe action, não existe o modelo `RegistoCarreira` no schema.** É o âncora do argumento de venda ao treinador ("o que crias é teu para a carreira"). Gap real, não cosmético. |
| §8.18 | Conformidade FPF (Modelo 2) | ❌ Não (esperado) | — | Depende de levantamento. Não bloqueia uso, mas ver Decisão 5. |
| §8.19 | **Lembretes/tarefas (`Lembrete`)** | ⚠️ Só derivado | Baixa | Existe `lib/dashboard-lembretes.ts` (camada **não persistida**, derivada de dados). O modelo `Lembrete`/`LembreteDestinatario` e `LEMBRETES_EQUIPA_GERIR` **não existem**. Funcionalidade de equipa (DT atribui tarefas) **ausente**. |
| §3.11 / §17 | **Licenciamento + billing** | ⚠️ Só dados | Baixa | Modelos `Licenca`/`Carteira`/`MovimentoCarteira` ✅. Actions: `obterLicenca`, `listarMovimentosCarteira`, `criarLicencaDemostracao`. **Sem checkout, sem Paddle, sem absorção (`simularAbsorcao`/`aplicarCreditoAbsorcao` não existem).** Não é possível cobrar. |

**Leitura global:** o núcleo operacional do treinador está sólido e completo (18 dos 19 módulos com rota+action). Os buracos concentram-se em três sítios que, por acaso, são exactamente os que sustentam a **narrativa comercial**: monetização (billing), retenção (lembretes de equipa) e diferenciação individual (carreira do treinador).

---

## Desvios não documentados

1. **`criarLicencaDemostracao` / botão "Ativar demo"** — action e UI de ativação de licença de demonstração que não constam das assinaturas da spec (§7.3). Útil para demos, mas é superfície que cria `Licenca` sem pagamento — confirmar que não fica acessível como forma de "licença grátis" em produção.
2. **Seed de dados reais de clube no repositório** — `prisma/data-migrations/seed_sport_lisboa_evora_*` (commit `d8f85c9`, "Seed temporário"). São **dados de um clube real** (Sport Lisboa e Évora 2025/26). Não está na spec, e levanta duas bandeiras: (a) contamina qualquer ambiente onde corra; (b) se inclui atletas menores reais, é uma questão de RGPD/consentimento. Deve ser isolado/removido antes de produção. **Boa notícia:** já **não** são rotas HTTP (foram movidos de `app/api/seed-sle-*` para scripts) — o risco de escrita-em-massa via HTTP referido no plano (P0.1) já não existe.
3. **Landing page pública + `criar-clube`** (`app/page.tsx`, `app/criar-clube`) — alinhado com o go-to-market (§17.6) mas sem detalhe na spec. Correto tê-lo; falta a bíblia descrever a landing como artefacto de produto.
4. **Alternador claro/escuro** — a spec §12.0 dizia "sem alternância"; a implementação adicionou toggle. **Está documentado no changelog** como ajuste consciente — não é violação, apenas registo aqui para rastreio.

---

## Top 5 Decisões de Produto Pendentes

1. **Billing: como e quando cobrar.**
   *Impacto:* sem checkout não há receita — o produto está pronto para usar mas não para **vender self-service**. *Recomendação:* para o go-live com **parceiros fundadores** (§17.6), faturação manual é aceitável e desbloqueia já. Mas assumir isto **explicitamente** e não vender a treinadores solo (€4,99) até o Paddle estar ligado — o público individual é self-service por natureza; sem checkout, o funil de aquisição individual está morto. Decidir: "founders manuais agora, Paddle antes de abrir o individual".

2. **Exposição pública do relatório partilhável (`/r/[token]`).**
   *Impacto:* o relatório de fim de época é o "wow" do produto — a peça que o clube mostra a pais/direção. Hoje o link está **intercetado pelo middleware de auth**, logo um visitante anónimo não o abre. A proposta de valor "link partilhável" está funcionalmente **partida**. *Recomendação:* prioridade alta, **mas toca em auth** (matcher do middleware) → exige autorização explícita do supervisor (Regra Sagrada Nº 3). Trazer a decisão à mesa já; a legibilidade em impressão (P1.1) resolve-se em paralelo sem tocar em auth.

3. **Perfil/carreira do treinador (§8.17) — construir ou cortar da v1?**
   *Impacto:* é o âncora emocional e comercial da licença Individual e do percurso "individual → mostra ao clube → clube adere" (§1.3, §17.3). Hoje **não existe nada** (nem modelo). *Recomendação:* construir antes de abrir a venda individual — sem ele, o pitch ao treinador solo perde o seu melhor argumento e fica "mais uma app de gestão". É L real (schema+migração+action+UI). Se houver que cortar por tempo, cortar FPF (Decisão 5), não isto.

4. **Lembretes: a camada derivada chega para a v1?**
   *Impacto:* os lembretes **pessoais** já emergem no dashboard (derivados). Mas os **de equipa** (DT atribui "todos lançarem convocatória até sexta") — que são precisamente o valor do tier Clube/DT — não existem. *Recomendação:* a entidade persistida `Lembrete`/`LembreteDestinatario` é sticky feature de retenção e diferenciador de DT; recomendo entrar na completude do tier Clube, não deixar para pós-launch.

5. **Conformidade FPF (Modelo 2) — argumento de venda ou nice-to-have?**
   *Impacto:* para clubes federados portugueses, exportar documentos federativos é um **atalho de dor real**. *Recomendação:* fazer o **levantamento** agora (barato, é papel) para dimensionar; decidir depois se é diferenciador de venda a clubes ou pós-v1. Não é bloqueador técnico, mas pode ser bloqueador **comercial** para o segmento federado.

---

## Prontidão por Segmento

| Segmento | Pronto? | Condições |
|---|---|---|
| **Treinador solo (€4,99)** | **COM CONDIÇÕES** | O núcleo diário está lá e é bom (plantel, treinos, editor de campo, jogos, stats, caderneta, analytics, relatórios). **Bloqueadores para vender:** (1) billing self-service — sem isto não há como o solo pagar; (2) relatório partilhável anónimo (Decisão 2); (3) atrito diário (presenças 1-a-1, `JogoForm` pesado). **Enfraquecedor de pitch:** ausência do perfil/carreira do treinador. Uso: pronto. Venda self-service: não. |
| **Clube (€15+)** | **COM CONDIÇÕES** | Camada de clube existe e é séria (membros, perfis, overrides com delegação, branding, analytics transversais). **Bloqueadores:** (1) billing; (2) **calendário unificado do DT ausente** — é o maior gap para justificar o preço de clube ("os dados existem, ninguém os juntou"); (3) **hard-delete RGPD de menores** — condição legal para clubes com menores; (4) constraints de FK/integridade que sustentam analytics multi-escalão. Com founders manuais + RGPD + calendário DT, é vendável. |
| **Diretor Técnico** | **COM CONDIÇÕES** | Há valor diferenciado real vs treinador solo: analytics de clube transversais, overrides, visibilidade configurável por escalão. **Falta o que mais interessa ao DT:** (1) **calendário unificado** de todos os escalões; (2) **lembretes de equipa persistidos** (atribuir tarefas a treinadores). Sem estes dois, o DT vê relatórios bonitos mas não tem a ferramenta de **coordenação** que justifica o seu papel na plataforma. |

**Veredicto de segmento:** o produto está mais pronto para **operar** do que para **ser vendido**. A distância entre "funciona" e "cobra dinheiro e retém" são 4-5 tarefas concentradas (billing, calendário DT, lembretes de equipa, RGPD, carreira do treinador).

---

## Revisão do Plano de Execução

**O que está correcto:**
- A ordenação macro (segurança → bloqueio comercial → completude → qualidade → crescimento) é a certa.
- P1.1 (relatório imprime legível) e P1.3 (hard-delete RGPD) estão bem posicionadas — são condição de venda.
- P2.2 (calendário unificado DT) está bem identificada como "maior gap para justificar a subscrição de clube". Concordo 100%.
- Phase 3 (testes) em paralelo — correcto.
- A disciplina de "não tocar em auth sem autorização" nas notas de B1 é rigorosa e certa.

**Erros factuais / tarefas desatualizadas:**
- **P0.1 (remover rotas de seed HTTP) — já resolvida na prática.** As rotas `app/api/seed-sle-*` **já não existem**; os seeds vivem em `prisma/data-migrations/*_core.ts` (scripts, não HTTP). A superfície de escrita-em-massa via HTTP que a task descreve **não está lá**. *Acção:* fechar/reescrever P0.1 como "remover/isolar os **scripts de seed de dados reais** (Sport Lisboa e Évora) antes de produção" — que é o risco que **sobra** (dados reais + possível RGPD), e que o plano **não** cobre hoje.

**Tarefas em falta:**
- **Isolamento do seed de dados reais de clube** (ver Desvio #2). Não está no plano. Risco RGPD se contiver menores reais. Adicionar a Phase 0/1.
- **Nenhuma tarefa cobre o billing como bloqueador do segmento individual.** P4.4 (Paddle) está em pós-launch — correcto **se** o go-live é founders manuais. Mas falta uma **decisão explícita no plano**: "individual self-service não abre antes de P4.4". Sem isso, arrisca-se prometer venda individual que não se pode faturar.

**Prioridades erradas:**
- **P4.1 ("todos presentes") e P4.2 (guardar sticky) estão tarde de mais.** São `S` (baratas) e atacam directamente a dor #1 do treinador solo — o público que se vende **primeiro**. Marcar 16 miúdos com 16 toques é o tipo de atrito que faz um treinador desinstalar na primeira semana. *Recomendação:* subir para Phase 1/2. O custo é meio-dia; o retorno é retenção do segmento de arranque.
- **P4.3 (`JogoForm` básico)** pela mesma lógica poderia subir — 12+ campos obrigatórios no dia de jogo é atrito real. Menos urgente que presenças, mas antes de "crescimento".

---

## Veredicto de Produto

"Como ex-treinador de futsal e PO: este produto **já serviria a minha equipa amanhã**. O núcleo do dia-a-dia — plantel, sessões com o editor de campo (que é genuinamente o diferenciador), presenças, jogos com estatísticas de futsal a sério, caderneta, analytics — está lá e está bem feito. Isto não é um protótipo; é uma ferramenta de trabalho.

Mas há uma diferença entre 'funciona' e 'é um negócio'. Neste momento **não consigo cobrar a ninguém** (billing deferido), o **relatório que era o meu melhor cartão de visita** não abre para quem não tem conta, e as duas coisas que fariam um Diretor Técnico assinar — **juntar o calendário de todos os escalões** e **distribuir tarefas à equipa** — ou não existem ou existem só pela metade. E o argumento com que eu venderia isto a um treinador solo — 'o teu trabalho é teu para a carreira toda' — não tem UI nenhuma por trás.

A boa notícia é que o buraco é pequeno e concentrado: não são 40 tarefas, são cinco. Billing (mesmo que manual para founders), calendário do DT, lembretes de equipa, hard-delete RGPD e o perfil de carreira do treinador. Feito isto, tenho um produto que **opera e vende**. Antes disto, tenho um produto que **impressiona numa demo e depois não fecha**.

Recomendação de PO: não abrir venda self-service individual até o billing estar ligado; começar com **parceiros fundadores faturados à mão** (que a spec já prevê), e usar essas semanas para fechar calendário DT + RGPD + carreira. E, por favor, tirem o seed do Sport Lisboa e Évora do caminho antes que ele apareche num ambiente onde não devia."

— Ricardo Faria
