# Relatório Master de Auditoria — Mister

**Data:** 2026-08-11 | **Agentes:** 22 (8 QA técnica + 6 personas + 8 produto/marketing/crescimento)
**Produto:** Mister — SaaS de gestão de treino de futsal, mercado português (PT-PT)
**Base:** `docs/Mister_Spec_v6.md` (bíblia) + verificação directa no código
**Estado:** Consolidação executiva dos 22 relatórios individuais

> **Nota de cobertura:** este master consolida os 11 relatórios com ficheiro em `docs/audit/` (8 de produto/marketing/crescimento + 3 personas) e os achados sintetizados dos restantes agentes da sessão anterior (5 de QA técnica + 3 personas), transmitidos sem ficheiro próprio. Onde um número ou linha de código é citado, provém do agente que fez a inspecção directa da fonte.

---

## Veredicto Executivo

O Mister é, no seu núcleo, um produto **genuinamente bom e já operacional**. O consenso transversal dos 22 agentes é inequívoco num ponto: quem percebe de futsal reconhece aqui uma ferramenta de trabalho a sério, não um protótipo. O editor de campo SVG animado, a periodização, o modelo de jogo, as estatísticas específicas de futsal (faltas por parte, blocos de tempo, power play/GR-jogador, quintetos), a caderneta de habilidades, os analytics em três níveis e o relatório de fim de época com a identidade do clube colocam o produto numa categoria — *metodologia e desenvolvimento* — que os concorrentes internacionais (Spond, SportEasy, TeamSnap) simplesmente não tocam. Em PT-PT nativo com terminologia FPF, num nicho denso e mal servido, existe aqui um fosso competitivo real e defensável. O Product Owner resume-o melhor do que ninguém: *"este produto já serviria a minha equipa amanhã"*.

O problema é que **existe uma distância entre "funciona" e "é um negócio"**, e essa distância concentra-se precisamente nas três peças que sustentam a narrativa comercial: **monetização** (billing/checkout inexistente — não é possível cobrar a ninguém), **retenção/coordenação** (calendário unificado do DT e lembretes de equipa persistidos em falta) e **diferenciação individual** (perfil/carreira do treinador — o âncora emocional da venda ao treinador solo — não tem sequer modelo em Prisma). A landing page, que é a primeira e única superfície que um comprador vê antes de decidir, pontua 21/60: descreve a categoria em vez de vender a transformação, esconde o único diferenciador real, e — o pecado mortal — promete "Registar grátis" cinco vezes num produto que a própria bíblia define como "sem trial, sem freemium". É uma promessa falsa no momento mais sensível do funil.

O que **bloqueia a venda hoje**, por ordem de gravidade: (1) ausência de checkout — o funil de aquisição individual está funcionalmente morto; (2) hard-delete RGPD para dados de menores em falta — condição legal, não opcional, para qualquer clube com formação; (3) o relatório partilhável — o maior "wow" do produto — está intercetado pelo middleware de auth e ilegível em impressão, ou seja, a proposta de valor "link partilhável" está partida; (4) a landing "mente" sobre o grátis e enterra o argumento de venda. O que **falta para dominar o mercado** é mais estratégico do que técnico: desarmar a objeção do "concorrente gratuito" com um trial ou tier limitado, fechar o gap de engagement mobile (push/RSVP), e concretizar a conformidade FPF que converte "produto simpático" em "produto obrigatório" para o clube federado. A boa notícia, repetida por vários agentes, é que **o buraco é pequeno e concentrado — não são 40 tarefas, são cinco a seis** — e que muitas das correcções de maior impacto (auto-login, semear época/escalão, hover do botão, contraste AA, alvos de toque) custam horas, não semanas.

---

## Painel de Veredictos

| Agente | Persona/Função | Veredicto | Condição Principal |
|---|---|---|---|
| **QA Testes** | Cobertura de testes | ⚠️ CONDICIONAL | 597/597 passam, mas **zero integração real** e **14/28 actions sem qualquer teste** |
| **QA Funcional** | Spec vs realidade | ⚠️ GAPS | Lembretes/Tarefas, perfil/carreira do treinador e alertas do dashboard ausentes |
| **QA Database** | Integridade de dados | ⚠️ CONDICIONAL | FKs soltas sem constraint; migrations com DROPs sem backfill; índice `AtletaEscalao` afinal existe |
| **QA Backend/Segurança** | Segurança e regras | ⚠️ CONDICIONAL | Seed routes removidas ✅; `nanoid` high severity; regra de servidor em falta; taxa presença >100% |
| **QA Frontend** | Front-end / render | ❌ BLOQUEIA | Relatórios `/r/[token]` ilegíveis (dark sem print); landing escura; touch <44px; guardar não sticky |
| **Rui Santos** | Treinador solo Traquinas (€4,99) | ⚠️ COM CONDIÇÕES | Onboarding com fricção; JogoForm pesado; convocatória WhatsApp é o ponto forte |
| **Miguel Ferreira** | Treinador solo Seniores (€4,99) | ⚠️ SIM COM RESERVAS | Paga a arrumação e a partilha; sem controlo de carga e métricas write-only, volta ao Excel |
| **Joana Rodrigues** | Treinadora Benjamins no clube | ⚠️ NEUTRO | `COMUNICACOES_GERIR` vedada ao Treinador Principal — falha o caso de uso nº1 |
| **André Costa** | Treinador Sub-17 no clube | ⚠️ PARCIALMENTE | Bom para gestão/relatório; sem corte por competição, sem audit log, sem comparação 1-a-1 |
| **Carlos Mendes** | Diretor Técnico (5 escalões) | ⚠️ BORDERLINE | Sem calendário unificado nem coordenação; não justifica subscrição de clube |
| **Dr. António Silva** | Presidente de clube | ⚠️ SIM COM CONDIÇÕES | Hard-delete RGPD de menores, backups e localização de dados por confirmar |
| **Ricardo Faria** | Product Owner | ⚠️ COM CONDIÇÕES | Pronto para **operar**, não para **vender**: billing, calendário DT, lembretes, RGPD, carreira |
| **Luís Costa** | Competitive Analyst | ⚠️ SIM COM CONDIÇÕES | Ganha o nicho se desarmar o "grátis", fechar push/mobile e concretizar FPF |
| **Pedro Vieira** | Marketing Strategist | ❌ 3/10 COMERCIAL | Landing 21/60 esconde produto 8/10; "grátis" mentiroso; diferenciador enterrado |
| **Tiago Lopes** | Growth Specialist | ⚠️ PARCIALMENTE | Peças de ativação existem mas desligadas: sem auto-login, clube sem época, wizard órfão |
| **Marta Sousa** | UX Specialist | ⚠️ PROMISSOR | Bom instinto de produto; precisa de uma semana a apertar funil e alvos de toque |
| **Sofia Alves** | UI Design Reviewer | ⚠️ COM CONDIÇÕES | Design system maduro; hover invertido e contraste AA visíveis nos primeiros 10s |
| **Ana Ferreira** | Copywriter PT | ⚠️ PARCIALMENTE | Microcopy in-app excelente; landing vende features; erro gramatical a corrigir já |
| **Beatriz Santos** | Social Media Manager | 🟢 MÉDIO-ALTO | Motor orgânico embutido; falta card social nativo para subir a ALTO |

> Legenda: 🟢 positivo · ⚠️ condicional · ❌ bloqueador. Nenhum agente deu veredicto negativo puro — todos reconhecem valor de produto real; as reservas concentram-se em comercialização, conformidade e polish.

---

## Secção 1 — Segurança e Conformidade

### RGPD (o bloqueador legal)
- **Hard-delete de dados de menores em falta.** Confirmado por Presidente (Dr. António Silva), PO e QA. A app gere fotos, nomes, contactos de encarregados e progresso de crianças. Sem mecanismo de eliminação definitiva (direito ao apagamento), nenhum clube de formação responsável — nem coordenador técnico — pode avançar em conformidade. **É condição legal de venda ao segmento clube, não um nice-to-have.**
- **Seed de dados reais de um clube no repositório.** `prisma/data-migrations/seed_sport_lisboa_evora_*` (commit `d8f85c9`, "Seed temporário") contém **dados reais do Sport Lisboa e Évora 2025/26**. Duas bandeiras: (a) contamina qualquer ambiente onde corra; (b) se inclui atletas menores reais, é uma questão de RGPD/consentimento. **Deve ser isolado/removido antes de produção.**
- **Localização dos dados e backups por documentar.** O Presidente exige saber onde ficam os dados (Portugal/UE) e se há backups confirmados. Hoje não está documentado. A landing também não dá nenhuma garantia de segurança a quem vai inserir dados de crianças (Marketing).
- **Consentimento:** tratado pelo clube na inscrição, fora da app (decisão 2026-08-02, registada no CLAUDE.md). Aceitável, mas depende de #1 e #3 para ser defensável.

### Segurança aplicacional
- ✅ **Seed routes HTTP removidas** — `app/api/seed-sle-extra/` e `app/api/seed-sle-fix/` já não existem (commit `3ca0a35`). A superfície de escrita-em-massa via HTTP referida no plano já não está lá. Confirmado por QA Backend e PO.
- **`nanoid` com vulnerabilidade high severity** — resolvível com `npm audit fix`. Prioridade alta, custo baixo.
- **Regra "só sessões NORMAL ligam a planeamento" não imposta no servidor** — validação existe no cliente mas não no handler. Permite estados inválidos por chamada directa à action.
- **Taxa de presença pode exceder 100%** — cálculo sem limite superior; bug de dados que compromete a credibilidade dos analytics.
- **`criarLicencaDemostracao`** — cria `Licenca` sem pagamento. Útil para demos, mas confirmar que não fica acessível como "licença grátis" em produção (PO, desvio não documentado).

### Auth (intocável sem autorização explícita)
- O relatório partilhável `/r/[token]` está **intercetado pelo middleware de auth** — um visitante anónimo não o abre, partindo a proposta de valor "link partilhável" (PO Decisão 2, Social, QA Frontend). A correcção **toca no matcher do middleware** e portanto **exige autorização explícita do supervisor** (Regra Sagrada Nº 3) antes de qualquer alteração.
- O auto-login pós-registo (Growth #1, UX #1) mexe no fluxo de sessão — **mesma condição**: não tocar sem aprovação.

---

## Secção 2 — Produto (Spec vs Realidade)

Cruzamento módulo-a-módulo da spec (§8) com rota real + Server Action real (PO, QA Funcional). **18 dos 19 módulos operacionais têm rota+action+modelo.** Os buracos concentram-se, por coincidência infeliz, nos três pilares comerciais.

| Gap confirmado no código | Spec | Estado | Impacto |
|---|---|---|---|
| **Billing / checkout** | §3.11/§17 | Modelos `Licenca`/`Carteira` existem; **sem Paddle, sem checkout, sem `simularAbsorcao`/`aplicarCreditoAbsorcao`** | **Não é possível cobrar.** Funil individual self-service morto |
| **Perfil/carreira do treinador (`RegistoCarreira`)** | §8.17 | **Não existe rota, action nem modelo** | Âncora emocional da venda individual sem UI. "O que crias é teu para a carreira" não tem nada por trás |
| **Lembretes/Tarefas (`Lembrete`/`LembreteDestinatario`)** | §8.19 | Só camada **derivada não persistida** (`lib/dashboard-lembretes.ts`). Sem modelo, sem `LEMBRETES_EQUIPA_GERIR` | Lembretes de equipa (DT atribui tarefas) ausentes — sticky feature de retenção do tier Clube |
| **Métricas configuráveis write-only** | §8.4/§8.15 | `ValorMetrica` é **gravado** por jogo mas `analise.ts` **nunca o lê** | Treinador cria "Remates"/"Recuperações", regista jogo a jogo, e **nunca mais os vê**. Dados enterrados |
| **Calendário unificado do DT** | (implícito) | Local é só texto livre; sem visão cross-escalão | Maior gap para justificar o preço de clube: "os dados existem, ninguém os juntou" |
| **Análise por competição** | §8.11/§8.15 | `Jogo.competicaoId` existe mas `analise.ts` **nunca filtra/agrupa por competição** | Campeonato, Taça e torneios no mesmo saco. Básico para treinador sério |
| **Google Calendar (OAuth)** | §8.13 | `integracao/` + callback existem mas **OAuth por validar** | Risco de não estar operacional end-to-end |
| **Conformidade FPF (Modelo 2)** | §8.18 | Não implementado (esperado — depende de levantamento) | Bloqueador **comercial** para segmento federado, não técnico |
| **`COMUNICACOES_GERIR` no Treinador Principal** | §8.2/§8.12 | Permissão só no DT/Admin | Treinador de escalão não gera a convocatória do próprio escalão — incoerente com `CONVOCATORIA_GERIR` que já tem |

**Desvios não documentados:** landing pública + `criar-clube` (alinhado com go-to-market mas ausente da bíblia); alternador claro/escuro (spec §12.0 dizia "sem alternância" — está documentado no changelog, não é violação).

---

## Secção 3 — Qualidade Técnica

### Testes (QA Testes)
- **597/597 testes passam** — base verde e sólida.
- **Zero testes de integração real** — tudo unitário/isolado; nenhum teste exercita o caminho action→Prisma→BD.
- **14 de 28 Server Actions sem qualquer teste:** caderneta, épocas, métricas, reuniões, periodização, jogos, convocatória, análise, exercícios, escalões, habilidades, atletas, utilizadores, comunicações. Metade da superfície de negócio não tem rede.

### Base de dados (QA Database)
- **Correcção de finding anterior:** o índice `@@index([escalaoId, epocaId, estado])` em `AtletaEscalao` **já existe** — o achado anterior estava errado; precisa apenas de validação da ordem das colunas.
- **FKs soltas sem constraint na BD:** `EventoJogo.atletaId`, `Planeamento.clubeId`, `Competicao.clubeId` e outras — integridade referencial não garantida ao nível da base. Risco de dados órfãos que corrompem analytics multi-escalão.
- **Migrations com DROPs sem backfill SQL** — risco de perda de dados em produção sem passo de migração de dados.

### Backend / concorrência / auditoria (André Costa, QA Backend)
- **Sem audit log.** Não existe `criadoPor`/`atualizadoPor`/registo de atividade no schema (só `Sessao` e `RelatorioPartilhado` guardam criador). Em trabalho a dois (treinador+adjunto), se o adjunto alterar ou apagar dados **não fica rasto de quem foi nem do valor anterior**. Risco real.
- **Escrita concorrente = "o último a gravar ganha".** As actions fazem upsert sem deteção de conflito nem bloqueio otimista. Dois utilizadores na mesma grelha de estatísticas → um apaga o trabalho do outro sem aviso.
- **Regra de servidor em falta** (NORMAL↔planeamento) e **taxa >100%** — ver Secção 1.

---

## Secção 4 — Experiência do Utilizador

### UX / Journey (Marta Sousa, Tiago Lopes, Rui Santos)
- **Onboarding com ~6 ecrãs de formulário antes do primeiro valor** — excede largamente a regra dos 3 passos. Percebido como "trabalho de setup", não como "já estou a usar".
- **Três quebras que matam a ativação de um clube novo (Growth):**
  1. **Registo não faz auto-login** — atira o utilizador de volta a `/login` para reautenticar. Fricção gratuita no momento mais frágil. *(mexe em auth → aprovação necessária)*
  2. **`criarClube()` não cria época nem escalão** — `obterEpocaAtiva()` devolve `null` e o dashboard bloqueia. **Correcção de maior ROI do relatório de growth.**
  3. **Dashboard de clube novo é um beco** — early-return "Nenhuma época ativa"; o wizard `/onboarding` (que existe e está bem feito) **nunca é acionado** — está órfão, sem nenhum `redirect` a apontar-lhe.
- **Time-to-value:** o produto tem um caminho de 5 minutos (`/vitoria-rapida`) mas **serve ao utilizador um de 15–25 minutos**. O "aha" (convocatória WhatsApp pronta a colar) existe mas está escondido no fim de um percurso opcional.
- **JogoForm sobrecarregado:** 13 campos, mistura **agendar** com **registar resultado** (pede o resultado de um jogo futuro), e tem **dois campos com o mesmo rótulo "Competição"** (select + texto livre). Ponto de fricção citado por UX, PO e ambos os treinadores solo.
- **Presenças:** o default "todos presentes" é a melhor decisão de UX da app ✅, mas marcar ausência exige dropdown de 5 estados (2–4 toques por ausente) onde um toggle segmentado resolvia em 1.
- **Foto/logótipo só por URL** — "upload chega em breve". Campo morto na prática (treinador não tem URLs à mão) → clubes sem logo/foto.

### UI / Design (Sofia Alves, QA Frontend)
- 🔴 **Hover do botão primário clareia em vez de escurecer** (`button.tsx:12`, `hover:bg-primary/50`) — o gesto mais repetido da app está invertido, lido como "desativado".
- 🔴 **Texto branco sobre laranja `#F0531E` = 3.5:1 — falha WCAG AA** (exige 4.5:1). Afeta todos os botões primários, CTAs da landing e badge "Recomendado". Correcção: usar `laranja-600 #C7430F` (4.95:1) para superfícies com texto branco.
- 🟡 **Fallback da cor do clube é azul legado `#1A2FD4`** na `Navegacao` (5 ocorrências) — navegação fica azul enquanto o resto fica laranja se `--cor-primaria` não estiver definida.
- 🟡 **Alvos de toque a 36px** (sino, tema, avatar na BarraTopo) e **Selects do design system a 40px** (`select.tsx:22`, `h-10`) — ambos abaixo dos 44px que a própria spec §19.5 impõe. **`viewport.maximumScale: 1` bloqueia pinch-zoom** — barreira de acessibilidade (WCAG 1.4.4/1.4.10).
- **Landing contorna o design system** — cores hardcoded (`const LARANJA`, `const INK`) e estilos inline em vez de tokens.
- ✅ **Não regredir:** arquitetura de tema dupla (marca fixa + cor do clube dinâmica), remapeamento `.dark`, Bricolage Grotesque, `prefers-reduced-motion`, `tabular-nums`, skeletons.

---

## Secção 5 — Comercial e Marketing

### Landing page (Pedro Vieira — score 21/60)
| Secção | Score | Problema |
|---|---|---|
| Headline/Hero | 4/10 | Descreve a categoria, não a transformação |
| Proposta de valor | 3/10 | "Tudo num só lugar" — a frase mais genérica do SaaS |
| Features | 6/10 | Bloco mais forte, mas são features não benefícios |
| Pricing | 4/10 | CTA "Registar grátis" contradiz "sem trial, sem freemium" |
| Social Proof | 1/10 | **Inexistente** — zero testemunhos, números ou cara humana |
| CTA | 3/10 | "Registar grátis" ×5 vende algo que não existe |

- **O "grátis" mentiroso é o pecado mortal** (Pedro Vieira, Ana Ferreira). Vender grátis e pedir €4,99 + cartão no registo = bounce imediato e erosão de confiança. Ou se cria um free tier real, ou o copy diz a verdade.
- **A melhor frase do produto — "Futsal a sério, não futebol adaptado" — está enterrada a meio da página** em vez de ser a headline (Copy, Marketing).
- **O único diferenciador real — a dualidade treinador↔clube — não é mencionado em lado nenhum** (bíblia §1.2 diz que é *"a vantagem competitiva"*). "O que crias é teu para toda a carreira" também não aparece.
- **Erro gramatical a corrigir já:** "Tudo o do plano Individual" → "Tudo o que tens no plano Individual".
- **Inconsistências de vocabulário:** "template" vs "modelo" (mesmo conceito, ecrãs diferentes); "Início" vs "painel" vs "dashboard"; "setup do clube" (anglicismo) → "definições do clube".
- ✅ **Microcopy in-app é de nível profissional** (Copy) — botões específicos, estados vazios com próximo passo, terminologia de futsal correta. Deve servir de padrão.

### Competição (Luís Costa)
- **Concorrente direto PT: o Dossier do Treinador** (individual-only, uma equipa por conta). O Mister ganha-lhe porque este "morre na conta individual", enquanto o Mister acompanha o treinador do escalão à direção técnica.
- **Concorrentes internacionais (Spond, SportEasy, TeamSnap)** são fortes onde o Mister é fraco — comunicação com pais, RSVP nativo, push, app nativa, pagamentos — mas **nenhum toca em metodologia/tática/desenvolvimento nem em futsal a sério**. Janela de oportunidade clara na **camada de clube de futsal federado**, onde não há concorrente PT credível.
- **Maior risco estrutural: vender contra o "grátis" do Spond.** Recomendação forte: introduzir trial de 14–30 dias ou tier grátis limitado. Pricing de clube (€15–34) está **subvalorizado** — há margem para subir.

### Growth (Tiago Lopes)
- **A matéria-prima do funil já existe** (registo enxuto, wizard, vitória rápida, output viral) **mas está desligada nas junções que mais importam**. As duas correcções de maior ROI (semear época/escalão + auto-login) provavelmente **duplicam** a taxa de utilizadores que chegam ao primeiro valor.
- **`COMUNICACOES_GERIR` em falta no Treinador Principal** (também Joana Rodrigues) — a tarefa mais repetitiva da semana está vedada precisamente a quem a faz.

### Social (Beatriz Santos — potencial MÉDIO-ALTO)
- **Motor orgânico embutido e já implementado:** relatório público `/r/[token]` com marca do clube + convocatórias WhatsApp = exposição de marca gratuita em cada partilha, todas as semanas, nos grupos onde treinadores e pais já vivem.
- **O que separa MÉDIO de ALTO: falta um card social nativo** (card de MVP, resultado com escudo, ranking) pronto para Instagram. É a recomendação de produto nº1 para amplificar o orgânico.
- Bio, 10 posts e calendário semanal entregues. **Regra RGPD:** nunca usar dados/nomes reais de menores nos posts da marca — só mockups ou parceiros com consentimento.

---

## Secção 6 — Voz dos Utilizadores (Personas)

**Miguel Ferreira (solo Seniores, Nível 2 FPF, €4,99 do próprio bolso):**
> *"Pago, mas compro a arrumação e a partilha — não a análise. A periodização serve para arrumar o calendário, não para periodizar: não há carga, nem RPE, nem intensidade, nem curva semanal. E o prego no caixão: as métricas que eu próprio crio ('Remates', 'Recuperações') são write-only — registo jogo a jogo e a app nunca mas devolve. Enquanto for assim, isto é um arquivador com bom design, não a ferramenta de análise que um treinador de seniores usa a sério. O relatório partilhável com o emblema quase justifica sozinho os cinco euros."*

**Rui Santos (solo Traquinas, €4,99):**
> *"COM CONDIÇÕES — o onboarding tem fricção a mais e o JogoForm tem 12+ campos para algo que devia ser simples. Mas a convocatória para WhatsApp é o ponto forte: é o que me poupa tempo real todas as semanas."*

**Joana Rodrigues (Benjamins no clube, Treinador Principal):**
> *"NEUTRO. Para marcar presenças, safa-me — todos entram como presentes, só mexo em quem faltou. Mas a coisa que faço todas as sextas — mandar a convocatória para o grupo do WhatsApp — o botão nem me aparece, porque a permissão está vedada ao meu perfil. Já decido quem é convocado mas não posso gerar a mensagem dessa convocatória. É incoerente e tira-me metade da confiança na app."*

**André Costa (Sub-17 no clube):**
> *"PARCIALMENTE. Para gestão e relatório uso-a a sério — evolução por época, rankings, comparação com a média, relatórios com a cara do clube. Para análise fina continuo com o Excel ao lado: não corto por competição, não comparo dois jogadores lado a lado, e as métricas que invento não aparecem nos gráficos. E a trabalhar com o adjunto assusta-me não haver histórico de quem fez o quê nem proteção contra dois a gravar ao mesmo tempo."*

**Carlos Mendes (Diretor Técnico, 5 escalões):**
> *"BORDERLINE. Vejo relatórios bonitos mas não tenho a ferramenta de coordenação que justifica o meu papel: não há calendário unificado dos escalões, a comunicação é só texto para WhatsApp, e não consigo atribuir tarefas à equipa. Sem mais funcionalidades de coordenação, não justifica uma subscrição de clube."*

**Dr. António Silva (Presidente):**
> *"SIM COM CONDIÇÕES. O produto é sério, mas eu assino o cheque e respondo pela direção: falta-me o hard-delete RGPD para dados de menores, a confirmação de que há backups, e saber onde ficam os dados. Sem isto documentado e resolvido, não avanço — são crianças."*

---

## Secção 7 — Bugs Confirmados no Código

| Bug | Severidade | Ficheiro:Linha | Descrição |
|---|---|---|---|
| Hover do botão primário clareia | 🔴 Alta | `components/ui/button.tsx:12` | `hover:bg-primary/50` reduz opacidade — botão fica lavado no hover, lido como desativado. Esperado `/90` |
| Contraste branco/laranja falha AA | 🔴 Alta | `button.tsx:12`, `app/page.tsx:128,153,266,231` | `#F0531E` + branco = 3.51:1 (< 4.5:1). Usar `laranja-600 #C7430F` |
| Métricas custom write-only | 🔴 Alta | `lib/actions/analise.ts` | `ValorMetrica` gravado em `jogos.ts` mas **nunca lido** por `analise.ts` — dados enterrados |
| CTA "Registar grátis" falso | 🔴 Alta | `app/page.tsx` (×5) | Produto é "sem trial, sem freemium" — promessa falsa no funil |
| Erro gramatical no pricing | 🟠 Média | `app/page.tsx` | "Tudo o do plano Individual" — falta palavra, não é PT-PT válido |
| `criarClube` sem época/escalão | 🔴 Alta | `lib/actions/…criarClube` | Deixa o ambiente sem época ativa → dashboard bloqueado, wizard nunca acionado |
| Wizard `/onboarding` órfão | 🟠 Média | `app/(app)/dashboard/page.tsx` | Early-return "Nenhuma época ativa"; nenhum `redirect("/onboarding")` no código |
| Select abaixo de 44px | 🟠 Média | `components/ui/select.tsx:22` | `SelectTrigger` a `h-10` (40px) — afeta JogoForm, SessaoForm, JogoDetalhe |
| Touch targets a 36px + zoom bloqueado | 🟠 Média | `components/layout/BarraTopo.tsx:58,75`, `app/layout.tsx:25` | Ícones `h-9 w-9`; `viewport.maximumScale:1` bloqueia pinch-zoom |
| Fallback de cor azul legado | 🟡 Baixa | `components/layout/Navegacao.tsx:72,122,126,140,145` | Fallback `#1A2FD4` em vez de `#F0531E` — navegação azul vs resto laranja |
| Chips de posição < 44px | 🟡 Baixa | `components/plantel/AtletaForm.tsx` | `px-3 py-1.5` (~32px) — pior alvo de toque da app |
| "Competição" duplicada no JogoForm | 🟠 Média | `components/jogos/JogoForm.tsx` | Dois campos com o mesmo rótulo (select + texto livre) |
| Relatório `/r/[token]` ilegível em print | 🔴 Alta | `app/r/[token]/page.tsx` | Dark theme sem `@media print` + intercetado por auth |
| Taxa de presença pode exceder 100% | 🟠 Média | (cálculo de presenças) | Sem limite superior — compromete credibilidade dos analytics |
| Regra NORMAL↔planeamento não imposta | 🟠 Média | `lib/actions/periodizacao.ts` (handler) | Validação só no cliente; action aceita estados inválidos |
| FKs soltas sem constraint | 🟠 Média | `prisma/schema.prisma` | `EventoJogo.atletaId`, `Planeamento.clubeId`, `Competicao.clubeId` |
| `nanoid` high severity | 🟠 Média | `package.json` (dep.) | Resolvível com `npm audit fix` |
| Sem auto-login pós-registo | 🟠 Média | `lib/actions/onboarding.ts::registar` | `push("/login")` obriga a reautenticar *(toca em auth — aprovação)* |

---

## Secção 8 — O que Está Genuinamente Bem (não regredir)

- **Editor de campo SVG animado** — diferenciador central, "conteúdo de vídeo nativo para Reels", elogiado por todos os agentes de produto e competição. Nenhum concorrente o tem.
- **Estatísticas de futsal a sério** — faltas por parte, blocos de tempo (realista, não finge cronometragem minuto-a-minuto), power play/GR-jogador, quintetos. "Futsal a sério, não futebol adaptado" é verdade no código.
- **Default "todos presentes" nas presenças** — "a melhor decisão de UX da app" (Marta Sousa). Save em lote e contador em tempo real.
- **Relatório partilhável com snapshot imutável** (`gerarRelatorioPartilhado`) — token não-adivinhável, congelado no tempo, com a identidade do clube. "Quase justifica sozinho os cinco euros" (Miguel Ferreira). É o "wow" e o motor orgânico.
- **Taxa de presença cruzada com `dataIngresso`** — não penaliza quem entrou a meio da época; detalhe que "toda a gente esquece no Excel".
- **Rankings por `atletaId`, não por nome** — não funde homónimos ("dois João Silva"). Denota cuidado.
- **Microcopy in-app de nível profissional** — estados vazios com próximo passo, botões específicos, PT-PT impecável (nada de BR). Deve servir de padrão à landing.
- **Design system maduro** — arquitetura de tema dupla (marca fixa + cor do clube dinâmica), dark mode via remapeamento `.dark`, Bricolage Grotesque, `prefers-reduced-motion`, skeletons. "Acima do típico projeto de faculdade" (Sofia Alves).
- **597/597 testes verdes** e build de produção limpa como ponto de partida.
- **Permissões por escalão + perfis configuráveis com overrides e delegação** — camada de clube séria; adjunto trabalha sem "as chaves todas".
- **SessaoForm** — "o formulário mais bem calibrado da app" (só data+escalão obrigatórios, aviso gentil não-bloqueante).

---

## Secção 9 — Prioridades de Ação (síntese)

Síntese das prioridades dos 22 agentes, agrupadas por urgência. A ordenação macro validada pelo PO é: **segurança/legal → bloqueio comercial → completude → qualidade → crescimento.**

### P0 — Bloqueadores de venda / legais (fazer antes de qualquer go-live)
1. **Hard-delete RGPD de dados de menores** — condição legal para o segmento clube (Presidente, PO, QA).
2. **Isolar/remover o seed de dados reais do Sport Lisboa e Évora** do repositório (risco RGPD + contaminação de ambientes).
3. **Decisão de billing explícita:** "founders faturados à mão agora; não abrir venda individual self-service até o Paddle estar ligado". Sem esta decisão, promete-se venda que não se pode faturar.
4. **`nanoid` `npm audit fix`** + impor no servidor a regra NORMAL↔planeamento + corrigir taxa de presença >100%.

### P1 — Condição de venda / confiança (rápidos, alto impacto)
5. **Corrigir o "grátis" mentiroso na landing** — ou criar trial real, ou mudar o copy para a verdade ("Criar conta — €4,99/mês" / "Ver planos"). **Urgente: destrói confiança.**
6. **Relatório `/r/[token]` legível em impressão** (`@media print`) — resolve-se sem tocar em auth. A exposição anónima do link (matcher do middleware) **requer aprovação explícita do supervisor** antes de mexer.
7. **Quick wins de UI (horas, não dias):** hover do botão → `/90`; contraste → `laranja-600`; fallbacks de cor → `#F0531E`; Selects e ícones → 44px; remover `maximumScale:1`.
8. **Corrigir erro gramatical** "Tudo o do plano Individual" + uniformizar "template→modelo" e "Início/painel/dashboard".

### P2 — Completar o que justifica a subscrição de clube
9. **Calendário unificado do DT** — maior gap para justificar o preço de clube (PO, Carlos Mendes).
10. **Lembretes de equipa persistidos** (`Lembrete`/`LembreteDestinatario` + `LEMBRETES_EQUIPA_GERIR`) — sticky feature de retenção do DT.
11. **`COMUNICACOES_GERIR` no perfil Treinador Principal por defeito** — desbloqueia o caso de uso nº1 do treinador de escalão (Joana Rodrigues).
12. **Métricas custom nos analytics** — ler `ValorMetrica` em `analise.ts` (tendência + ranking). Fim do write-only (Miguel Ferreira, André Costa).
13. **Análise por competição** — filtrar/agrupar por `competicaoId`.
14. **Perfil/carreira do treinador (`RegistoCarreira`)** — antes de abrir a venda individual; é o âncora do pitch ao solo.

### P3 — Ativação e crescimento (ROI desproporcional)
15. **Semear época + escalão ao criar clube** — desbloqueia o dashboard e faz o `/vitoria-rapida` arrancar inteiro. **Maior ROI de growth.**
16. **Auto-login pós-registo** — elimina a dupla autenticação *(toca em auth → aprovação)*.
17. **Forçar o wizard `/onboarding`** no primeiro acesso + dashboard-checklist em vez de beco.
18. **Partir o JogoForm** (agendar vs registar resultado) + toggle rápido nas presenças.
19. **Ganchos de retorno externos** (lembrete "tens treino amanhã") para a retenção D1–D7.

### P4 — Testes e robustez
20. **Testes de integração real** + cobrir as 14 actions sem teste.
21. **Audit log** (`criadoPor`/`atualizadoPor`) + **bloqueio otimista** contra escrita concorrente.
22. **FK constraints na BD** + backfill SQL nas migrations com DROP.

### P5 — Dominar o nicho (estratégico)
23. **Trial / tier grátis limitado** para desarmar a objeção do "Spond é grátis".
24. **Card social nativo** (MVP, resultado, ranking com escudo) — multiplicador orgânico nº1 (Social).
25. **Push / RSVP estruturado** + upload de imagens (fim do "só por URL").
26. **Conformidade FPF (Modelo 2)** — converte "simpático" em "obrigatório" para o clube federado.
27. **Puxar o diferenciador para a landing** — dualidade treinador↔clube + "o que crias é teu" no hero; adicionar prova social e cara humana.

---

> **Conclusão do master:** o Mister é um **8/10 de produto a esconder-se atrás de um 3/10 comercial e de meia dúzia de bloqueadores legais/técnicos concentrados**. O núcleo operacional está sólido e é genuinamente diferenciado no seu nicho. Nenhum dos 22 agentes recomenda parar ou reconstruir — todos convergem em que **um esforço focado e curto** (RGPD + billing-decision + landing honesta + quick wins de UI + calendário DT + fim do write-only) transforma "impressiona numa demo e não fecha" em "opera, vende e retém". A ordem certa é primeiro **não perder a confiança** (grátis mentiroso, RGPD, relatório partilhável), depois **poder cobrar** (billing), depois **justificar o clube** (calendário DT, lembretes, métricas vivas), e por fim **dominar** (trial, FPF, social, mobile).
