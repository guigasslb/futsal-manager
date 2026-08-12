# FutsalManager — Especificação do Produto Final (v6)

> **Estatuto:** Bíblia do produto. Fonte única de verdade. **v6 (2026-08-05)** — sucede à `FutsalManager_Spec_v5.md` (mantida intacta como histórico) e ao `FutsalManager_Spec_v4_MVP_historico.md` (arquivado).
> **Marca comercial:** o produto é distribuído sob a marca **FutsalCoach** (guia visual em `docs/BRAND.md`); "FutsalManager" mantém-se como nome técnico/histórico do projeto.
> **Regra de ouro:** nenhuma alteração de código sem a atualização correspondente neste documento, no mesmo passo. Toda a modificação é registada no **changelog (secção 19)** com data e descrição. Se o código se perder, este documento tem de permitir recriar tudo do zero a 100%.
> **Convenções:** **DEVE** = obrigatório · **DEVERIA** = recomendado · **FUTURO** = fora do âmbito da v1 do produto final.
> **Marcas de propriedade de dados:** 🏛️ = dado do **clube** (fica no clube) · 🎒 = **portátil** (pertence ao treinador e viaja com ele) — ver secção 4.
> **⚠️ = decisão de modelação a validar tecnicamente antes de implementar.**

---

## Índice

1. [Visão, âmbito e princípios](#1-visão-âmbito-e-princípios)
2. [Glossário e terminologia](#2-glossário-e-terminologia)
3. [Modelo de dados completo](#3-modelo-de-dados-completo)
4. [Propriedade e portabilidade de dados](#4-propriedade-e-portabilidade-de-dados)
5. [Contas, autenticação, adesão a clube e RGPD](#5-contas-autenticação-adesão-a-clube-e-rgpd)
6. [Papéis e permissões configuráveis](#6-papéis-e-permissões-configuráveis)
7. [Server Actions](#7-server-actions)
8. [Módulos funcionais](#8-módulos-funcionais)
9. [Regras de negócio transversais e casos-limite](#9-regras-de-negócio-transversais-e-casos-limite)
10. [Estatísticas e agregações](#10-estatísticas-e-agregações)
11. [Formato do diagrama de campo e animação](#11-formato-do-diagrama-de-campo-e-animação)
12. [Sistema de design](#12-sistema-de-design)
13. [Estados de UI, i18n, acessibilidade e requisitos não-funcionais](#13-estados-de-ui-i18n-acessibilidade-e-requisitos-não-funcionais)
14. [Estratégia de testes](#14-estratégia-de-testes)
15. [Stack, setup e deployment](#15-stack-setup-e-deployment)
16. [Ordem de desenvolvimento (fases)](#16-ordem-de-desenvolvimento-fases)
17. [Modelo de negócio e licenciamento](#17-modelo-de-negócio-e-licenciamento)
18. [Roadmap futuro](#18-roadmap-futuro)
19. [Changelog da documentação](#19-changelog-da-documentação)

---

## 1. Visão, âmbito e princípios

### 1.1 O que é
O **FutsalManager** (marca **FutsalCoach**) é uma aplicação **web (PWA)** de gestão de treino e de clube dedicada ao **futsal de formação**, em português de Portugal. Permite a um treinador planear e conduzir a época — plantel, periodização, treinos, exercícios com diagramas de campo animados, presenças, jogos com estatísticas, convocatórias, caderneta de desenvolvimento do atleta, modelo de jogo, scouting, comunicação com pais/staff e reuniões — e permite a um **clube** organizar vários escalões e treinadores num único ecossistema com permissões, analytics transversais e relatórios profissionais.

### 1.2 O modelo "2 em 1" (posicionamento central)
O produto funciona a dois níveis, com o mesmo código e o **mesmo modelo de dados multi-tenant**:
- **Individual (licença de treinador):** um treinador usa-o sozinho, com a sua conta e o seu portfólio de trabalho. **Sem qualquer UI ou funcionalidade de gestão de clube.** Tecnicamente, um treinador individual é o único membro de um **clube técnico invisível** (ver 1.2.1 e secção 5).
- **Clube (ecossistema, licença de clube):** um clube tem vários escalões e treinadores, dados partilhados, permissões por papel, branding, analytics de clube e relatórios.

Esta dualidade é a vantagem competitiva. O concorrente de referência (**Dossier do Treinador**) é **apenas individual** (uma equipa por conta, sem partilha editável entre contas). O FutsalCoach é individual **e** plataforma de clube.

#### 1.2.1 Multi-tenant único (decisão 2026-08-05)
O **`Clube` é sempre o tenant de topo**, mesmo na licença Individual. Consequências:
- **DEVE:** ao registar-se ou comprar licença Individual, é criado automaticamente um **clube técnico** (`Clube.clubeTecnico = true`) com o treinador como único membro (perfil Administrador). Este clube é **invisível ao utilizador**: não há UI de gestão de clube, branding, membros, perfis, nem escalões partilhados no modo Individual.
- **DEVE:** toda a operação corre sempre num contexto de clube resolvido no servidor (elimina o caso "sem clube"), simplificando queries e permissões.
- **DEVE:** a conta é **única por email pessoal**. Ao longo do tempo pode estar em modo Individual (clube técnico) ou vinculada a um clube real (membro com papel). A transição entre modos é suportada (secção 5.3).

### 1.3 Estratégia de venda
- Venda **individual** (licença de treinador): **€4,99/mês** ou **€49/ano**. Sem trial, sem freemium — compra directa.
- Venda **por clube** (licença de ecossistema, tiers por nº de escalões — ver secção 17): o espaço do clube com escalões, permissões, branding, analytics e relatórios.
- Percurso típico: o treinador usa individualmente → demonstra ao clube → o clube adere (o treinador é **absorvido**, com crédito proporcional para carteira — secção 17.4). Se o clube não aderir, o treinador continua a usar individualmente. Se sair do clube, reativa a licença Individual por conta própria.
- **Go-to-market:** vídeo demonstrativo público; reunião de demonstração a pedido para clubes; primeiros clubes como **parceiros fundadores** (patrocínio mútuo, visibilidade cruzada, referência comercial); suporte via **WhatsApp** para utilizadores individuais.

### 1.4 Princípios de design (inquebráveis)
1. **Útil primeiro, mas visualmente e experiencialmente interessante.** Cada esforço pedido ao treinador devolve algo visual e satisfatório (marcar presenças → ver a taxa subir; registar um golo → ver o gráfico crescer; desbloquear uma habilidade → celebração).
2. **Valor acumulado sem trabalho extra.** Os dados entram naturalmente pelo uso quotidiano (presenças, sessões, jogos, stats); a app transforma-os em analytics e relatórios automaticamente. **Analytics é um pilar** (secção 10).
3. **O mais barato possível de operar.** Sem custos recorrentes de IA no núcleo. Só alojamento + base de dados + storage. A IA fica fora do núcleo (quando muito, plugin pago futuro).
4. **Futsal a sério**, não futebol adaptado: campo com dimensões corretas, terminologia FPF, estatísticas específicas (faltas acumuladas por parte, rotações/quintetos, power play/GR-jogador, tempos de jogo por blocos).
5. **Beira-campo real:** o "modo jornada" tem de funcionar com rede fraca (PWA + offline) e poucos toques.
6. **Desenvolvimento do atleta como alma:** a caderneta e o tracking de evolução por jogador são o coração emocional e o argumento de venda aos pais.
7. **O editor de campo é um diferenciador central** (interativo, com animações) — a sua qualidade e validação são prioritárias antes de escalar a biblioteca.
8. **Português de Portugal**, terminologia do glossário (secção 2).
9. **Documentação sempre atualizada** (regra de ouro no topo).

### 1.5 Âmbito da v1 do produto final
**Incluído (núcleo — uso prático do treinador + equipa técnica + ecossistema de clube):**
- Esqueleto multi-tenant: utilizador independente (clube técnico) + adesão a clube + propriedade de dados + RGPD + permissões configuráveis com overrides + branding do clube.
- **Licenciamento:** licença Individual e de Clube (tiers por nº de escalões), carteira/crédito de absorção, arquitetura pronta para **billing Paddle** (implementação de billing deferida — secção 17).
- Plantel/atletas ao **nível do clube** com relação **N-N atleta↔escalão** (histórico, transições, número por escalão) · Escalões · Épocas.
- Exercícios: **editor de campo interativo + animação (A→B)** + **duas bibliotecas** (pessoal portátil + do clube) + biblioteca curada de exemplo (por parte do treino/objetivo/escalão).
- **Templates de sessão** (sessões completas pré-construídas, curadas e do treinador/clube).
- Treinos: sessões + notas de treino + presenças (**lesões como motivo de falta**).
- **Periodização:** planos semanais e mensais (microciclos/mesociclos).
- **Modelo de jogo** (documento vivo por clube/escalão/época) + **bolas paradas** + quadro tático por jogo (reutiliza o editor de campo).
- Jogos (amigável/competição): convocatória + estatísticas de futsal + **tempos de jogo por blocos** + **registo ao vivo ou pós-jogo** + relatório + vídeo por link YouTube + **vista de dia de jogo** + **scouting do adversário no próprio jogo**.
- **Calendário + competições + tabelas de classificação** (a partir de resultados inseridos manualmente).
- **Comunicação (gerador de conteúdo para WhatsApp)** + **reuniões** (escalão/clube, ata exposta) + **sincronização Google Calendar**.
- **Caderneta de habilidades.**
- **Analytics em 3 níveis (atleta/equipa/clube)** e **relatório de fim de época partilhável** (PDF + vista web com link, sem IA).
- **Relatórios PDF** profissionais.
- **Onboarding com vitória rápida** (criação em massa do plantel, primeira sessão de template, primeira convocatória).
- **Dashboard contextual** (centro de comando temporal — o que é hoje/iminente domina o ecrã) + secção "atenção necessária".
- **Lembretes / to-dos** (pessoais e de equipa, com deadline, integrados no dashboard).
- **Design direction** (secção 12): tema escuro como base, cor do clube como identidade, **motion como linguagem**, empty states desenhados.

**FUTURO (fora da v1):** ver secção 18. Nota importante: o **portal de pais/atletas** continua FUTURO; o que entra na v1 é apenas o **gerador de conteúdo para WhatsApp** (os pais não têm conta na app).

### 1.6 Anti-âmbito (decisões conscientes)
- **Sem IA no núcleo** (custo).
- **Sem armazenamento de vídeo** (só links YouTube).
- **Sem app nativa/APK** na v1 — a PWA cobre Android e iOS; APK só como embrulho fino (TWA/Capacitor) no futuro.
- **Sem quotas/mensalidades do clube** (o clube a cobrar aos pais) na v1.
- **Sem multi-idioma/multi-moeda** na v1 (mercado PT primeiro).
- **Conformidade FPF** (Modelo 2 e documentos federativos) está **no âmbito**, mas a implementação depende de **levantamento dos requisitos exatos da FPF** (secção 8/16).

---

## 2. Glossário e terminologia

Interface 100% em **português de Portugal**, terminologia FPF/futsal. Usar sempre estes termos (não sinónimos).

**Organização**
- **Clube** — a organização (ecossistema). Tem escalões, membros, épocas, branding. No modo Individual é um **clube técnico** invisível.
- **Clube técnico** — clube automático de 1 membro que suporta a licença Individual (invisível ao utilizador).
- **Ecossistema** — o espaço partilhado do clube (vários escalões e treinadores com permissões).
- **Escalão** — grupo etário/nível (Traquinas, Benjamins, Infantis, Iniciados, Juvenis, Juniores, Séniores). É a "equipa" na prática.
- **Época** — ano desportivo (ex: "2026/27"). Uma ativa de cada vez por clube.
- **Membro** — utilizador ligado a um clube com um perfil.
- **Perfil** — pacote configurável de permissões (capacidades + âmbito).
- **Override de capacidade** — capacidade concedida ou revogada a um membro específico, independentemente do seu perfil (secção 6).

**Licenciamento**
- **Licença** — direito de uso pago: **Individual** (treinador) ou **Clube** (ecossistema).
- **Tier** — escalão comercial da licença de clube por nº de escalões (Pequeno/Médio/Grande/Parceiro).
- **Carteira** — saldo de crédito da conta do treinador (resulta de absorção por clube; usado em compras futuras).
- **Absorção** — quando um treinador Individual passa a membro de um clube; o tempo restante da sua licença converte-se em crédito de carteira.
- **Parceiro fundador** — clube inicial com acordo de patrocínio mútuo e voz no roadmap.

**Pessoas**
- **Atleta** — jogador que pertence ao **clube** (não à época nem ao treinador). Participa em um ou mais escalões via **participação de escalão**.
- **Participação de escalão (`AtletaEscalao`)** — vínculo atleta↔escalão numa época, com **tipo** (Principal/Simultânea/Ocasional), **estado** (Ativo/Transição permanente/Inativo), **número de camisola** e datas.
- **Plantel** — conjunto de atletas com participação ativa num escalão numa época.
- **Administrador / Diretor Técnico / Treinador (Principal/Adjunto)** — papéis de arranque (perfis).
- **Encarregado de educação** — responsável legal do atleta menor (RGPD).

**Treino**
- **Sessão** — uma sessão de treino (data, objetivo, exercícios, presenças).
- **Template de sessão (`ModeloSessao`)** — sessão completa pré-construída e reutilizável (curada pela equipa FutsalCoach ou criada pelo treinador/clube).
- **Exercício** — unidade de treino, com diagrama de campo opcional (estático ou animado).
- **Biblioteca pessoal (🎒)** — exercícios/templates do treinador, portáteis.
- **Biblioteca do clube (🏛️)** — exercícios/templates partilhados no clube.
- **Parte do treino** — Aquecimento / Parte principal / Jogo reduzido / Retorno à calma.
- **Microciclo** — semana de treino. **Mesociclo** — bloco de semanas. **Período** — Preparatório / Competitivo / Transição.
- **Periodização** — planeamento por ciclos (semanal/mensal).
- **Presença** — estado do atleta numa sessão (Presente, Falta, Falta justificada, Lesionado, Atrasado), com **motivo de falta** (Lesão/Doença/Outro/Sem justificação).

**Jogo**
- **Jogo** — encontro (Oficial ou Amigável), Casa/Fora.
- **Convocatória** — atletas convocados para um jogo (com posição prevista para a vista de dia de jogo).
- **Vista de dia de jogo** — ecrã dedicado ao dia do jogo (convocados + posições, scouting, bolas paradas, hora e local).
- **Utilização** — Titular / Utilizado / Não utilizado.
- **Bloco de tempo** — unidade de tempo de jogo (Jogo completo / Meia-parte / 10 min / 5 min); alternativa ao minuto-a-minuto.
- **Quinteto** — os 5 jogadores em campo (futsal). **Rotação** — trocas constantes.
- **Faltas acumuladas** — faltas da equipa por parte; à 5.ª, livre sem barreira (10 m).
- **Power play / GR-jogador** — guarda-redes a jogar como 5.º jogador de campo.
- **Modelo de jogo** — documento vivo da identidade tática da equipa (princípios/subprincípios por momento, incluindo bolas paradas). **Quadro tático** — esquema tático de um jogo específico.
- **Bola parada** — esquema de canto/livre/lançamento, criado no editor (vive na biblioteca e no modelo de jogo).
- **Scouting / Observação do adversário** — informação sobre o adversário, criada no contexto do jogo.
- **Competição** — prova; gera **classificação** a partir dos resultados **inseridos manualmente** pelo treinador (todos os jogos de todas as equipas). Integração automática com competições oficiais = FUTURO.

**Comunicação**
- **Template de comunicação** — texto formatado gerado pela app para partilhar no WhatsApp (convocatória, cancelamento, mudança de horário/local, resultado, aviso geral, calendário).
- **Reunião** — encontro de escalão/clube com ata exposta; calendarizável (Google Calendar).
- **Lembrete / tarefa (`Lembrete`)** — item de to-do ligado ao contexto da equipa: **pessoal** (só o próprio vê) ou de **equipa** (DT/Admin atribui a treinadores específicos ou a toda a equipa técnica), com deadline opcional; aparece no dashboard dos destinatários.

**Desenvolvimento e análise**
- **Caderneta** — sistema de habilidades que o atleta desbloqueia ao longo da época.
- **Habilidade** — "move" técnico (vírgula, flip-flap, elástico, chapéu…), por nível (Básico/Intermédio/Avançado).
- **Analytics** — três níveis: **atleta**, **equipa**, **clube (transversal)**.
- **Relatório de fim de época** — síntese por equipa/atleta/clube, a partir dos dados; exportável em PDF e partilhável por link web.

**Dados**
- **Portátil (🎒)** — dado que pertence ao treinador e viaja com ele.
- **Do clube (🏛️)** — dado que fica no clube quando o treinador sai.
- **Snapshot** — cópia só-de-leitura que o clube retém de conteúdo do treinador usado em sessões.

---

## 3. Modelo de dados completo

Stack de persistência: **Prisma + PostgreSQL (Supabase)**. Todos os `id` são `cuid`. Todas as datas são `DateTime`. Convenção de propriedade: 🏛️ clube · 🎒 portátil (treinador).

> **Nota:** este é o modelo-alvo do produto final. Decisões ainda **a validar tecnicamente** estão marcadas com ⚠️. Alterações estruturais face ao MVP (Atleta ao nível do clube + `AtletaEscalao`, licenciamento, comunicação, templates de sessão, classificação, relatório partilhável) fazem parte das fases 11+ (secção 16).

### 3.1 Contas, clube e permissões (o esqueleto)

```prisma
// 🎒 Existe independentemente de qualquer clube real. Suporta o modo individual (via clube técnico) e a portabilidade.
model Utilizador {
  id           String   @id @default(cuid())
  nome         String
  email        String   @unique
  passwordHash String
  telefone     String?
  criadoEm     DateTime @default(now())
  atualizadoEm DateTime @updatedAt

  membros         MembroClube[]      // adesões a clubes (inclui o clube técnico)
  exercicios      Exercicio[]        // 🎒 biblioteca pessoal (autor)
  modelosSessao   ModeloSessao[]     // 🎒 templates de sessão (autor)
  modelosJogo     ModeloJogo[]       // 🎒 modelos de jogo (autor)
  registoCarreira RegistoCarreira[]  // 🎒 histórico de carreira portátil
  licencaIndividual Licenca?         @relation("LicencaIndividual") // licença Individual (se ativa)
  carteira        Carteira?          // 🎒 saldo de crédito
}

// 🏛️ O ecossistema. No modo Individual é um clube técnico invisível (clubeTecnico=true).
model Clube {
  id            String   @id @default(cuid())
  nome          String
  clubeTecnico  Boolean  @default(false) // true = clube invisível que suporta a licença Individual
  corPrimaria   String   @default("#F0531E")
  corSecundaria String   @default("#FFD700")
  logoUrl       String?  // ficheiro no Supabase Storage
  morada        String?
  email         String?
  telefone      String?
  criadoEm      DateTime @default(now())

  membros         MembroClube[]
  perfis          Perfil[]
  epocas          Epoca[]
  escaloes        Escalao[]
  atletas         Atleta[]              // atletas pertencem ao clube (não à época)
  habilidades     Habilidade[]
  metricas        MetricaConfig[]
  subcategorias   SubcategoriaExercicio[]
  competicoes     Competicao[]
  reunioes        Reuniao[]
  modelosComunicacao ModeloComunicacao[]
  licenca         Licenca?              @relation("LicencaClube") // licença de clube (se real)
}

// Adesão utilizador↔clube. REGRA: no máximo UMA adesão ATIVA por utilizador (um clube de cada vez).
// Adesões anteriores ficam como histórico (INATIVO) — suporta a portabilidade. Dentro do clube ativo,
// o membro pode gerir vários escalões (AtribuicaoEscalao).
model MembroClube {
  id            String       @id @default(cuid())
  utilizadorId  String
  utilizador    Utilizador   @relation(fields: [utilizadorId], references: [id], onDelete: Cascade)
  clubeId       String
  clube         Clube        @relation(fields: [clubeId], references: [id], onDelete: Cascade)
  perfilId      String
  perfil        Perfil       @relation(fields: [perfilId], references: [id])
  estado        EstadoMembro @default(ATIVO) // ATIVO | INATIVO | CONVIDADO
  // Overrides por membro (decisão 2026-08-05): capacidades concedidas/revogadas além do perfil base.
  capacidadesExtra     String[] @default([]) // concedidas além do perfil
  capacidadesRevogadas String[] @default([]) // removidas apesar do perfil
  dataEntrada   DateTime     @default(now())
  dataSaida     DateTime?

  atribuicoes AtribuicaoEscalao[]

  @@unique([utilizadorId, clubeId])
}

enum EstadoMembro { ATIVO INATIVO CONVIDADO }

// Perfil = pacote configurável de capacidades + âmbito. Cada clube tem os seus (com modelos de arranque editáveis).
model Perfil {
  id          String       @id @default(cuid())
  clubeId     String
  clube       Clube        @relation(fields: [clubeId], references: [id], onDelete: Cascade)
  nome        String       // ex: "Administrador", "Diretor Técnico", "Treinador Principal", "Adjunto"
  descricao   String?
  ambito      AmbitoPerfil @default(PROPRIOS_ESCALOES) // TODO_CLUBE | PROPRIOS_ESCALOES
  capacidades String[]     // chaves de capacidade (ver secção 6)
  sistema     Boolean      @default(false) // modelo de arranque (editável, mas assinalado)
  criadoEm    DateTime     @default(now())

  membros MembroClube[]
}

enum AmbitoPerfil { TODO_CLUBE PROPRIOS_ESCALOES }

// Quais escalões um membro gere/vê (âmbito PROPRIOS_ESCALOES, ou DT restringido pelo admin).
model AtribuicaoEscalao {
  id            String      @id @default(cuid())
  membroClubeId String
  membroClube   MembroClube @relation(fields: [membroClubeId], references: [id], onDelete: Cascade)
  escalaoId     String
  escalao       Escalao     @relation(fields: [escalaoId], references: [id], onDelete: Cascade)

  @@unique([membroClubeId, escalaoId])
}
```

### 3.2 Época, escalão e atleta (🏛️ clube)

> **Alteração estrutural 2026-08-05:** o `Atleta` deixa de estar ligado a uma época/escalão diretamente. Passa a pertencer ao **clube** e a participar em escalões via **`AtletaEscalao`** (relação N-N com histórico). O **número de camisola** passa para a participação (pode diferir entre escalões).

```prisma
model Epoca {
  id         String   @id @default(cuid())
  clubeId    String
  clube      Clube    @relation(fields: [clubeId], references: [id])
  nome       String   // "2026/27"
  dataInicio DateTime
  dataFim    DateTime
  ativa      Boolean  @default(false)
  criadoEm   DateTime @default(now())

  participacoes AtletaEscalao[]
  sessoes       Sessao[]
  jogos         Jogo[]
  progressos    ProgressoHabilidade[]
  planeamentos  Planeamento[]
  competicoes   Competicao[]
}

model Escalao {
  id                       String   @id @default(cuid())
  clubeId                  String
  clube                    Clube    @relation(fields: [clubeId], references: [id])
  nome                     String   // "Benjamins"
  idadeMin                 Int?
  idadeMax                 Int?
  ordem                    Int      @default(0)
  visivelOutrosTreinadores Boolean  @default(true) // leitura por treinadores de outros escalões
  criadoEm                 DateTime @default(now())

  participacoes AtletaEscalao[]
  sessoes       Sessao[]
  jogos         Jogo[]
  atribuicoes   AtribuicaoEscalao[]
  planeamentos  Planeamento[]
  competicoes   Competicao[]
}

// Atleta pertence ao CLUBE (nível de clube, transversal às épocas).
model Atleta {
  id                  String    @id @default(cuid())
  clubeId             String
  clube               Clube     @relation(fields: [clubeId], references: [id])
  nome                String
  dataNascimento      DateTime?
  posicoes            Posicao[] // um atleta pode ter VÁRIAS posições
  observacoes         String?
  fotoUrl             String?   // por URL (upload Supabase é follow-up)
  ativo               Boolean   @default(true) // soft delete
  dataIngresso        DateTime? // para taxa de presença (secção 10); default = criadoEm
  // Encarregado de educação (RGPD — minimização)
  encarregadoNome     String?
  encarregadoContacto String?
  encarregadoEmail    String?
  criadoEm            DateTime  @default(now())
  atualizadoEm        DateTime  @updatedAt

  escaloes       AtletaEscalao[]     // participações (N-N com histórico)
  presencas      Presenca[]
  convocatorias  Convocatoria[]
  estatisticas   EstatisticaAtleta[]
  progressos     ProgressoHabilidade[]
  consentimentos Consentimento[]

  @@index([clubeId])
  @@index([clubeId, ativo])
}

// Participação de um atleta num escalão numa época (N-N com histórico e transições).
model AtletaEscalao {
  id         String             @id @default(cuid())
  atletaId   String
  atleta     Atleta             @relation(fields: [atletaId], references: [id], onDelete: Cascade)
  escalaoId  String
  escalao    Escalao            @relation(fields: [escalaoId], references: [id])
  epocaId    String
  epoca      Epoca              @relation(fields: [epocaId], references: [id])
  tipo       TipoParticipacao   @default(PRINCIPAL)   // PRINCIPAL | SIMULTANEA | OCASIONAL
  estado     EstadoParticipacao @default(ATIVO)       // ATIVO | TRANSICAO_PERMANENTE | INATIVO
  numero     Int?               // número de camisola NESTE escalão
  dataInicio DateTime           @default(now())
  dataFim    DateTime?
  criadoEm   DateTime           @default(now())

  @@unique([atletaId, escalaoId, epocaId])
  @@index([escalaoId, epocaId, estado])
  @@index([epocaId])
}

// Um atleta tem SEMPRE uma participação PRINCIPAL (o escalão da sua idade/base) por época.
// Pode ter N participações adicionais (SIMULTANEA/OCASIONAL). A transição permanente muda o principal.
enum TipoParticipacao { PRINCIPAL SIMULTANEA OCASIONAL }
enum EstadoParticipacao { ATIVO TRANSICAO_PERMANENTE INATIVO }

enum Posicao { GUARDA_REDES FIXO ALA PIVO UNIVERSAL }
```

### 3.3 Exercícios, diagramas e bibliotecas (🎒 pessoal / 🏛️ clube)

Cada treinador tem uma **biblioteca pessoal** (portátil, sempre dele). Pode **contribuir deliberadamente** para a **biblioteca do clube** (gesto explícito — toggle na criação). A propriedade (`proprietario`) é **decidida pelo treinador no momento da criação** via toggle — **não** por quem paga a licença (ver secção 4.2, decisão definitiva): **pessoal** (default) → `TREINADOR`; **clube** → `CLUBE`. `autorId` regista sempre quem criou.

```prisma
model Exercicio {
  id             String              @id @default(cuid())
  autorId        String
  autor          Utilizador          @relation(fields: [autorId], references: [id])
  proprietario   PropriedadeConteudo @default(TREINADOR) // CLUBE | TREINADOR (definido pelo toggle na criação; default pessoal)
  clubeProprietarioId String?        // preenchido quando proprietario = CLUBE (biblioteca do clube)
  nome           String
  descricao      String?
  objetivo       String?
  duracaoMin     Int?
  parteTreino    ParteTreino?        // AQUECIMENTO | PRINCIPAL | JOGO_REDUZIDO | RETORNO_CALMA (organização)
  categoriaPrincipal CategoriaExercicioPrincipal?
  subcategoriaId String?
  subcategoria   SubcategoriaExercicio? @relation(fields: [subcategoriaId], references: [id])
  escalaoAlvo    String?             // faixa etária/escalão sugerido (texto: "sub-10")
  diagrama       Json?               // DiagramaCampo v2 (com passos/animação) — secção 11
  origemSeed     Boolean @default(false) // exercício da biblioteca curada de arranque
  criadoEm       DateTime @default(now())
  atualizadoEm   DateTime @updatedAt

  partilhas PartilhaExercicioClube[]
  sessoes   SessaoExercicio[]
  modelosSessao ModeloSessaoExercicio[]
}

// Parte do treino (organização da biblioteca de exemplo e dos templates de sessão).
enum ParteTreino { AQUECIMENTO PRINCIPAL JOGO_REDUZIDO RETORNO_CALMA }

// Determina de quem é o conteúdo criado (exercícios, templates, modelos de jogo). Ver secção 4.
enum PropriedadeConteudo { CLUBE TREINADOR }

enum CategoriaExercicioPrincipal {
  ATAQUE DEFESA TRANSICAO BOLAS_PARADAS FISICO GUARDA_REDES OUTRO
}

// Subcategoria customizável por clube. Seed instala ~22 predefinidas (sistema=true).
model SubcategoriaExercicio {
  id        String                      @id @default(cuid())
  clubeId   String
  clube     Clube                       @relation(fields: [clubeId], references: [id], onDelete: Cascade)
  nome      String
  categoria CategoriaExercicioPrincipal
  ordem     Int                         @default(0)
  sistema   Boolean                     @default(false)
  criadoEm  DateTime                    @default(now())

  exercicios Exercicio[]

  @@index([clubeId, categoria])
}

// Exercício partilhado na biblioteca de um clube (o autor mantém sempre o seu na biblioteca pessoal).
model PartilhaExercicioClube {
  id          String    @id @default(cuid())
  exercicioId String
  exercicio   Exercicio @relation(fields: [exercicioId], references: [id], onDelete: Cascade)
  clubeId     String
  criadoEm    DateTime  @default(now())

  @@unique([exercicioId, clubeId])
}
```
**Preservação de histórico:** quando um exercício **do treinador** (`proprietario = TREINADOR`) é usado numa sessão do clube, o clube retém um **snapshot só-de-leitura** desse exercício (para os planos de treino passados não partirem quando o treinador sair). O original editável viaja com o treinador; o snapshot fica no clube, desligado do autor.

**Editor (prioridade — decisão 2026-08-05):** o editor de exercícios interativo com animações é um **diferenciador central**. A sua revisão e validação de qualidade são **prioritárias** (fase 12, secção 16) antes de escalar a biblioteca curada.

### 3.4 Templates de sessão (🎒 pessoal / 🏛️ clube)

Sessões completas pré-construídas (aquecimento + parte principal + jogo reduzido + retorno à calma), com durações e objetivos. Curadas pela equipa FutsalCoach (seed) e criadas pelo treinador/clube. Organizadas por objetivo tático, fase da época, escalão/idade e parte do treino.

```prisma
model ModeloSessao {
  id                  String              @id @default(cuid())
  autorId             String
  autor               Utilizador          @relation(fields: [autorId], references: [id])
  proprietario        PropriedadeConteudo @default(TREINADOR)
  clubeProprietarioId String?
  origemSeed          Boolean             @default(false)
  nome                String              // ex: "Pressing defensivo, 60 min, sub-10"
  objetivoTatico      String?
  faseEpoca           PeriodoEpoca?       // PREPARATORIO | COMPETITIVO | TRANSICAO
  escalaoAlvo         String?             // "sub-10" / faixa etária
  duracaoMin          Int?
  descricao           String?
  criadoEm            DateTime            @default(now())
  atualizadoEm        DateTime            @updatedAt

  exercicios ModeloSessaoExercicio[]

  @@index([clubeProprietarioId])
  @@index([autorId])
}

model ModeloSessaoExercicio {
  id             String       @id @default(cuid())
  modeloSessaoId String
  modeloSessao   ModeloSessao @relation(fields: [modeloSessaoId], references: [id], onDelete: Cascade)
  exercicioId    String
  exercicio      Exercicio    @relation(fields: [exercicioId], references: [id])
  ordem          Int          @default(0)
  duracaoMin     Int?
  parteTreino    ParteTreino?
  notas          String?

  @@unique([modeloSessaoId, ordem])
  @@index([exercicioId])
}
```
Ao criar uma sessão a partir de um template, os exercícios e durações são copiados para a `Sessao` (o template não fica ligado — é um ponto de partida editável).

### 3.5 Periodização e treinos (🏛️ clube)

```prisma
model Planeamento {
  id         String        @id @default(cuid())
  clubeId    String
  escalaoId  String
  epocaId    String
  tipo       TipoPlaneamento // SEMANAL | MENSAL
  periodo    PeriodoEpoca?   // PREPARATORIO | COMPETITIVO | TRANSICAO
  mesociclo  Int?
  microciclo Int?
  dataInicio DateTime
  dataFim    DateTime
  objetivos  String?
  criadoEm   DateTime      @default(now())

  sessoes Sessao[]
}

enum TipoPlaneamento { SEMANAL MENSAL }
enum PeriodoEpoca { PREPARATORIO COMPETITIVO TRANSICAO }

model Sessao {
  id            String     @id @default(cuid())
  clubeId       String
  escalaoId     String
  epocaId       String
  tipoSessao    TipoSessao @default(NORMAL) // NORMAL liga a periodização; ABERTO/CAPTACAO/EVENTO dispensam
  planeamentoId String?
  data          DateTime
  duracaoMin    Int?
  objetivo      String?
  local         String?
  notas         String?  // notas de treino (input para o tracking)
  material      String?
  microciclo    Int?
  mesociclo     Int?
  periodo       PeriodoEpoca?
  volume        Int?
  googleEventId String?  // sincronização Google Calendar (secção 8.16)
  criadorId     String
  criadoEm      DateTime @default(now())
  atualizadoEm  DateTime @updatedAt

  exercicios SessaoExercicio[]
  presencas  Presenca[]
}

enum TipoSessao { NORMAL ABERTO CAPTACAO EVENTO }

model SessaoExercicio {
  id          String @id @default(cuid())
  sessaoId    String
  exercicioId String
  ordem       Int    @default(0)
  duracaoMin  Int?
  parteTreino ParteTreino?
  notas       String?

  @@unique([sessaoId, ordem])
}

model Presenca {
  id           String         @id @default(cuid())
  sessaoId     String
  atletaId     String
  escalaoId    String          // presenças calculadas POR escalão (atleta pode participar em vários)
  estado       EstadoPresenca  @default(PRESENTE)
  motivo       MotivoFalta?    // preenchido quando estado ∈ {FALTA, FALTA_JUSTIFICADA, LESIONADO}
  justificacao String?

  @@unique([sessaoId, atletaId])
}

enum EstadoPresenca { PRESENTE FALTA FALTA_JUSTIFICADA LESIONADO ATRASADO }
// Motivo de falta (lesões registadas aqui — sem módulo clínico dedicado, que é FUTURO).
enum MotivoFalta { LESAO DOENCA OUTRO SEM_JUSTIFICACAO }
```

### 3.6 Modelo de jogo e quadro tático (🏛️ clube; metodologia portátil 🎒)

> **Alteração 2026-08-05:** o **modelo de jogo** é um **documento vivo da identidade tática**. Como **documento da equipa** (por clube/escalão/época), pertence ao clube (`proprietario = CLUBE`, filosofia do clube). Como **metodologia genérica/portátil do treinador** (sem escalão/época), fica `proprietario = TREINADOR` (biblioteca pessoal) e viaja com ele. A escolha segue o mesmo princípio dos exercícios: **decidida pelo treinador na criação**, não pela licença (secção 4.2). Organiza-se por **momento** (org. ofensiva/defensiva, transições, bolas paradas), com princípios e subprincípios + diagrama (editor).

```prisma
model ModeloJogo {
  id           String              @id @default(cuid())
  autorId      String
  autor        Utilizador          @relation(fields: [autorId], references: [id])
  proprietario PropriedadeConteudo @default(CLUBE) // CLUBE (documento da equipa) | TREINADOR (metodologia portátil)
  clubeProprietarioId String?
  escalaoId    String?             // documento vivo por escalão (null = metodologia genérica portátil)
  escalao      Escalao?            @relation("ModeloJogoEscalao", fields: [escalaoId], references: [id], onDelete: SetNull)
  epocaId      String?             // documento vivo por época (null = portátil)
  epoca        Epoca?              @relation("ModeloJogoEpoca", fields: [epocaId], references: [id], onDelete: SetNull)
  nome         String
  momento      MomentoJogo         // ORG_OFENSIVA | ORG_DEFENSIVA | TRANS_OFENSIVA | TRANS_DEFENSIVA | BOLAS_PARADAS
  principios   String?  @db.Text   // princípios (texto livre)
  subprincipios Json?              // subprincípios: array JSON de strings ou {titulo, detalhe}
  diagrama     Json?
  criadoEm     DateTime            @default(now())
  atualizadoEm DateTime            @updatedAt

  @@index([clubeProprietarioId])
  @@index([autorId])
  @@index([clubeProprietarioId, escalaoId, epocaId])
  @@index([escalaoId])
  @@index([epocaId])
}

enum MomentoJogo { ORG_OFENSIVA ORG_DEFENSIVA TRANS_OFENSIVA TRANS_DEFENSIVA BOLAS_PARADAS }

// 🏛️ Quadro tático específico de um jogo (bolas paradas e esquemas do jogo).
model QuadroTatico {
  id       String  @id @default(cuid())
  jogoId   String
  jogo     Jogo    @relation(fields: [jogoId], references: [id], onDelete: Cascade)
  nome     String
  tipo     TipoQuadroTatico @default(GERAL) // GERAL | BOLA_PARADA
  diagrama Json?
  notas    String?

  @@index([jogoId])
}

enum TipoQuadroTatico { GERAL BOLA_PARADA }
```
**Bolas paradas:** os esquemas de canto/livre/lançamento são criados no **editor** e vivem tanto na **biblioteca** (como `ModeloJogo` de momento `BOLAS_PARADAS` ou exercício de categoria `BOLAS_PARADAS`) como no **modelo de jogo** e nos **quadros táticos** do jogo.

### 3.7 Competições, jogos, estatísticas, classificação e scouting (🏛️ clube)

```prisma
model Competicao {
  id        String       @id @default(cuid())
  clubeId   String
  escalaoId String
  epocaId   String
  nome      String
  tipo      TipoJogo     @default(OFICIAL) // OFICIAL | AMIGAVEL
  formato   FormatoCompeticao @default(LIGA) // LIGA | TORNEIO | TACA
  criadoEm  DateTime     @default(now())

  jogos      Jogo[]
  resultados ResultadoCompeticao[] // resultados de outras equipas (para a classificação)
}

enum TipoJogo { OFICIAL AMIGAVEL }
enum CasaFora { CASA FORA }
enum FormatoCompeticao { LIGA TORNEIO TACA }

// Resultados dos jogos da competição, INSERIDOS MANUALMENTE pelo treinador (decisão 2026-08-05).
// O treinador insere os resultados de TODAS as equipas da competição para construir a classificação.
// Os jogos da própria equipa também podem alimentar a partir de `Jogo`. Sem integração automática na v1
// (integração com APIs de competições oficiais = FUTURO, secção 18).
model ResultadoCompeticao {
  id           String     @id @default(cuid())
  competicaoId String
  competicao   Competicao @relation(fields: [competicaoId], references: [id], onDelete: Cascade)
  data         DateTime?
  equipaCasa   String
  equipaFora   String
  golosCasa    Int
  golosFora    Int
  criadoEm     DateTime   @default(now())

  @@index([competicaoId])
}

model Jogo {
  id                    String    @id @default(cuid())
  clubeId               String
  escalaoId             String
  epocaId               String
  competicaoId          String?
  data                  DateTime
  adversario            String
  casaFora              CasaFora  @default(CASA)
  tipo                  TipoJogo  @default(OFICIAL)
  local                 String?
  golosMarcados         Int?
  golosSofridos         Int?
  faltas1aParte         Int?      // faltas acumuladas da equipa na 1ª parte (futsal)
  faltas2aParte         Int?
  relatorio             String?
  videoUrl              String?   // link YouTube (allowlist)
  googleEventId         String?   // sincronização Google Calendar (secção 8.16)
  criadorId             String
  criadoEm              DateTime  @default(now())
  atualizadoEm          DateTime  @updatedAt

  convocatorias Convocatoria[]
  estatisticas  EstatisticaAtleta[]
  eventos       EventoJogo[]        // registo ao vivo
  quadros       QuadroTatico[]
  observacoes   ObservacaoAdversario[] // scouting no contexto do jogo
}

model Convocatoria {
  id              String   @id @default(cuid())
  jogoId          String
  atletaId        String
  convocado       Boolean  @default(true)
  posicaoPrevista Posicao? // para a vista de dia de jogo
  titularPrevisto Boolean  @default(false)

  @@unique([jogoId, atletaId])
}

model EstatisticaAtleta {
  id              String     @id @default(cuid())
  jogoId          String
  atletaId        String
  utilizacao      Utilizacao @default(NAO_UTILIZADO) // TITULAR | UTILIZADO | NAO_UTILIZADO
  blocoTempo      BlocoTempo? // tempo de jogo por bloco (alternativa/complemento aos minutos)
  minutos         Int?        // aproximado, opcional (derivável do bloco)
  golos           Int        @default(0)
  assistencias    Int        @default(0)
  defesas         Int?       // GR
  golosSofridosGR Int?       // GR
  faltasCometidas Int?
  valoresMetricas ValorMetrica[]

  @@unique([jogoId, atletaId])
}

enum Utilizacao { TITULAR UTILIZADO NAO_UTILIZADO }
// Tempo de jogo por blocos pré-definidos (decisão 2026-08-05). NAO_JOGOU = 0.
enum BlocoTempo { JOGO_COMPLETO MEIA_PARTE BLOCO_10MIN BLOCO_5MIN NAO_JOGOU }

// Registo ao vivo (beira-campo). Agrega para EstatisticaAtleta.
model EventoJogo {
  id                 String        @id @default(cuid())
  jogoId             String
  parte              Int           // 1 | 2
  minuto             Int?
  tipo               TipoEventoJogo
  bloco              BlocoTempo?   // p/ substituições: bloco de tempo associado
  atletaId           String?       // protagonista (entra / marca / etc.)
  atletaSecundarioId String?       // assistência / substituído
  criadoEm           DateTime      @default(now())
}

enum TipoEventoJogo {
  GOLO ASSISTENCIA FALTA CARTAO_AMARELO CARTAO_VERMELHO
  SUBSTITUICAO DEFESA GOLO_SOFRIDO TIMEOUT
}

model MetricaConfig {
  id      String      @id @default(cuid())
  clubeId String
  nome    String
  tipo    TipoMetrica @default(NUMERO) // NUMERO | BOOLEANO | ESCALA
  ativa   Boolean     @default(true)
  ordem   Int         @default(0)

  valores ValorMetrica[]
}

enum TipoMetrica { NUMERO BOOLEANO ESCALA }

model ValorMetrica {
  id            String @id @default(cuid())
  metricaId     String
  estatisticaId String
  valor         Int

  @@unique([metricaId, estatisticaId])
}

// Scouting do adversário — criado no contexto do jogo (jogoId) ou avulso (clube/escalão).
model ObservacaoAdversario {
  id            String   @id @default(cuid())
  clubeId       String
  escalaoId     String?
  jogoId        String?  // scouting contextualizado no jogo (decisão 2026-08-05)
  jogo          Jogo?    @relation(fields: [jogoId], references: [id], onDelete: SetNull)
  equipa        String
  jogoObservado String?
  competicao    String?
  sistemaTatico String?
  pontosFortes  String?
  pontosFracos  String?
  notas         String?
  diagrama      Json?
  criadoEm      DateTime @default(now())

  jogadores ObservacaoJogadorAdversario[]
}

model ObservacaoJogadorAdversario {
  id           String @id @default(cuid())
  observacaoId String
  numero       Int?
  nome         String?
  posicao      String?
  descricao    String?
}
```

### 3.8 Caderneta de habilidades (🏛️ clube)

```prisma
model Habilidade {
  id        String          @id @default(cuid())
  clubeId   String
  clube     Clube           @relation(fields: [clubeId], references: [id])
  nome      String
  descricao String?
  nivel     NivelHabilidade @default(BASICO) // BASICO | INTERMEDIO | AVANCADO
  ordem     Int             @default(0)
  criadoEm  DateTime        @default(now())

  progressos ProgressoHabilidade[]
}

enum NivelHabilidade { BASICO INTERMEDIO AVANCADO }

model ProgressoHabilidade {
  id              String           @id @default(cuid())
  atletaId        String
  habilidadeId    String
  epocaId         String
  estado          EstadoHabilidade @default(NAO_INICIADO) // NAO_INICIADO | EM_PROGRESSO | DESBLOQUEADO
  dataDesbloqueio DateTime?
  notas           String?

  @@unique([atletaId, habilidadeId, epocaId])
}

enum EstadoHabilidade { NAO_INICIADO EM_PROGRESSO DESBLOQUEADO }
```

### 3.9 Reuniões e comunicação (🏛️ clube)

```prisma
model Reuniao {
  id             String       @id @default(cuid())
  clubeId        String
  clube          Clube        @relation(fields: [clubeId], references: [id], onDelete: Cascade)
  ambito         AmbitoReuniao // CLUBE | ESCALAO
  escalaoId      String?      // obrigatório (lógico) se ambito=ESCALAO
  titulo         String
  data           DateTime
  participantes  String?
  ordemTrabalhos String?
  ata            String?      // ata exposta aos membros do âmbito
  googleEventId  String?      // sincronização Google Calendar
  criadorId      String
  criadoEm       DateTime     @default(now())

  @@index([clubeId])
}

enum AmbitoReuniao { CLUBE ESCALAO }

// Templates de comunicação (para gerar texto formatado a partilhar no WhatsApp).
// O seed instala um modelo GLOBAL por tipo (clubeId = null, origemSeed = true),
// disponível a todos os clubes; o clube pode criar a sua variante personalizada
// (clubeId preenchido), que prevalece sobre a global para esse tipo.
model ModeloComunicacao {
  id       String          @id @default(cuid())
  tipo     TipoComunicacao
  nome     String                    // ex: "Convocatória padrão"
  template String          @db.Text  // texto com placeholders {{nomeAtleta}}, {{data}}, {{local}}, ...

  // null = seed global (disponível a todos); preenchido = personalizado pelo clube
  clubeId String?
  clube   Clube?  @relation(fields: [clubeId], references: [id], onDelete: Cascade)

  origemSeed Boolean @default(false) // true = foi instalado pelo seed

  criadoEm     DateTime @default(now())
  atualizadoEm DateTime @updatedAt

  @@unique([clubeId, tipo])  // um modelo por tipo por clube
  @@index([tipo])
  @@index([clubeId])
}

enum TipoComunicacao {
  CONVOCATORIA CANCELAMENTO MUDANCA_HORARIO MUDANCA_LOCAL
  RESULTADO AVISO_GERAL CALENDARIO_MENSAL
}
```

**Placeholders.** Sintaxe `{{nomeDoCampo}}`. O gerador (`gerarTextoComunicacao`) substitui-os pelo
contexto do evento e remove os que não tiverem valor. Conjunto de arranque (por tipo):

| Tipo | Placeholders |
|---|---|
| `CONVOCATORIA` | `{{nomeEquipa}}` `{{diaSemana}}` `{{data}}` `{{hora}}` `{{local}}` `{{listaConvocados}}` `{{prazoConfirmacao}}` `{{nomeTreinador}}` |
| `CANCELAMENTO` | `{{nomeEquipa}}` `{{tipoCancelamento}}` `{{diaSemana}}` `{{data}}` `{{motivo}}` `{{nomeTreinador}}` |
| `MUDANCA_HORARIO` | `{{nomeEquipa}}` `{{tipoEvento}}` `{{diaSemana}}` `{{data}}` `{{horaAnterior}}` `{{horaNova}}` `{{local}}` `{{motivo}}` `{{nomeTreinador}}` |
| `MUDANCA_LOCAL` | `{{nomeEquipa}}` `{{tipoEvento}}` `{{diaSemana}}` `{{data}}` `{{hora}}` `{{localAnterior}}` `{{localNovo}}` `{{indicacoesAcesso}}` `{{motivo}}` `{{nomeTreinador}}` |
| `RESULTADO` | `{{nomeEquipa}}` `{{competicao}}` `{{diaSemana}}` `{{data}}` `{{equipaCasa}}` `{{golosCasa}}` `{{golosFora}}` `{{equipaFora}}` `{{marcadores}}` `{{assistencias}}` `{{comentarioTreinador}}` `{{nomeTreinador}}` |
| `AVISO_GERAL` | `{{nomeEquipa}}` `{{assunto}}` `{{mensagem}}` `{{prazoResposta}}` `{{nomeTreinador}}` |
| `CALENDARIO_MENSAL` | `{{nomeEquipa}}` `{{mesAno}}` `{{listaEventos}}` `{{dataActualizacao}}` |

Os textos de arranque vivem em `lib/comunicacao-modelos.ts` (`MODELOS_COMUNICACAO_SEED`,
módulo puro — fonte única). São instalados **globalmente** (`clubeId = null`) por
`npm run db:seed:comunicacao` (`prisma/data-migrations/f7_seed_comunicacao.ts`) e, como
**cópia editável do clube**, pela action `instalarSeedComunicacao()`.

**Resolução do template** (`gerarTextoComunicacao`): variante do clube para o tipo pedido →
*fallback* para o modelo global. Um `modeloId` explícito tem de ser do clube (ou global) e do
tipo pedido. **Normalização**: após a substituição, as linhas em branco deixadas por
placeholders removidos são colapsadas (máx. uma) e o texto é aparado.

### 3.10 Relatório de época partilhável (🏛️ clube)

```prisma
// Link partilhável (público via token) de um relatório de época. Inclui identidade do clube.
model RelatorioPartilhado {
  id         String         @id @default(cuid())
  clubeId    String
  token      String         @unique // segmento de URL não-adivinhável
  tipo       TipoRelatorio  // EPOCA_ATLETA | EPOCA_EQUIPA | EPOCA_CLUBE
  epocaId    String
  escalaoId  String?        // p/ EPOCA_EQUIPA
  atletaId   String?        // p/ EPOCA_ATLETA
  dadosSnapshot Json?       // snapshot dos dados no momento de gerar (imutável)
  expiraEm   DateTime?
  criadorId  String
  criadoEm   DateTime       @default(now())

  @@index([clubeId])
}

enum TipoRelatorio { EPOCA_ATLETA EPOCA_EQUIPA EPOCA_CLUBE }
```

### 3.11 Licenciamento, subscrição e carteira

> **Decisão 2026-08-05:** modelo desenhado para suportar a integração futura com **Paddle** (Merchant of Record). O **enforcement** de licença (bloqueio pós-expiração) e o billing são **deferidos**; a arquitetura de dados fica pronta.

```prisma
// Licença ativa de um utilizador (Individual) OU de um clube (Clube). Um titular tem no máximo uma ativa.
model Licenca {
  id            String        @id @default(cuid())
  tipo          TipoLicenca   // INDIVIDUAL | CLUBE
  tier          TierClube?    // só se tipo=CLUBE: PEQUENO | MEDIO | GRANDE | PARCEIRO
  estado        EstadoLicenca @default(ATIVA) // ATIVA | EXPIRADA | CANCELADA | SUSPENSA
  ciclo         CicloFaturacao // MENSAL | ANUAL
  precoCentimos Int?           // preço praticado (cêntimos)
  // Titular (exatamente um dos dois preenchido)
  utilizadorId  String?  @unique
  utilizador    Utilizador? @relation("LicencaIndividual", fields: [utilizadorId], references: [id])
  clubeId       String?  @unique
  clube         Clube?      @relation("LicencaClube", fields: [clubeId], references: [id])
  // Datas
  dataInicio    DateTime  @default(now())
  dataRenovacao DateTime?
  dataFim       DateTime?
  // Integração Paddle (futura)
  paddleSubscriptionId String?
  paddleCustomerId     String?
  criadoEm      DateTime  @default(now())
  atualizadoEm  DateTime  @updatedAt
}

enum TipoLicenca { INDIVIDUAL CLUBE }
enum TierClube { PEQUENO MEDIO GRANDE PARCEIRO }
enum EstadoLicenca { ATIVA EXPIRADA CANCELADA SUSPENSA }
enum CicloFaturacao { MENSAL ANUAL }

// Carteira (wallet) do treinador — crédito de absorção usado em compras futuras.
model Carteira {
  id           String   @id @default(cuid())
  utilizadorId String   @unique
  utilizador   Utilizador @relation(fields: [utilizadorId], references: [id], onDelete: Cascade)
  saldoCentimos Int     @default(0)
  atualizadoEm DateTime @updatedAt

  movimentos MovimentoCarteira[]
}

model MovimentoCarteira {
  id         String        @id @default(cuid())
  carteiraId String
  carteira   Carteira      @relation(fields: [carteiraId], references: [id], onDelete: Cascade)
  tipo       TipoMovimento // CREDITO_ABSORCAO | DEBITO_COMPRA | REEMBOLSO | AJUSTE
  valorCentimos Int        // positivo = crédito; negativo = débito
  descricao  String
  criadoEm   DateTime      @default(now())

  @@index([carteiraId])
}

enum TipoMovimento { CREDITO_ABSORCAO DEBITO_COMPRA REEMBOLSO AJUSTE }
```

### 3.12 Integração com calendário externo (Google Calendar)

> **Nota:** integração de **terceiros** (Google Calendar), **distinta** do login/autenticação da app. Sincroniza treinos, jogos e reuniões. Guarda tokens OAuth do Google por utilizador. ⚠️ implementação de OAuth Google a validar em fase própria (secção 16).

```prisma
model IntegracaoCalendario {
  id            String   @id @default(cuid())
  utilizadorId  String   @unique
  provedor      String   @default("google")
  refreshToken  String   // encriptado at-rest
  calendarioId  String?  // calendário destino
  ativa         Boolean  @default(true)
  criadoEm      DateTime @default(now())
  atualizadoEm  DateTime @updatedAt
}
```
Os `googleEventId` em `Sessao`, `Jogo` e `Reuniao` ligam cada registo ao evento correspondente no Google Calendar (idempotência da sincronização).

### 3.13 Portfólio e histórico de carreira do treinador (🎒 portátil)

```prisma
model RegistoCarreira {
  id            String    @id @default(cuid())
  utilizadorId  String
  utilizador    Utilizador @relation(fields: [utilizadorId], references: [id])
  clubeNome     String
  escalaoNome   String?
  epocaNome     String?
  dataInicio    DateTime
  dataFim       DateTime?
  jogos         Int       @default(0)
  vitorias      Int       @default(0)
  empates       Int       @default(0)
  derrotas      Int       @default(0)
  golosMarcados Int?
  golosSofridos Int?
  notas         String?
}
```
**Preenchimento:** automático a partir dos jogos do treinador no clube **e** editável manualmente para percursos anteriores à app. Pertence ao utilizador e viaja com ele.

### 3.14 RGPD — consentimento de menores

```prisma
model Consentimento {
  id                  String            @id @default(cuid())
  atletaId            String
  atleta              Atleta            @relation(fields: [atletaId], references: [id], onDelete: Cascade)
  tipo                TipoConsentimento // DADOS | IMAGEM
  concedido           Boolean           @default(false)
  encarregadoEducacao String?
  dataConsentimento   DateTime?

  @@unique([atletaId, tipo])
}

enum TipoConsentimento { DADOS IMAGEM }
```
Ver secção 5 para as regras (soft-delete, direito ao esquecimento, minimização).

### 3.15 Lembretes e tarefas (🏛️ contexto do clube)

Sistema simples de to-dos ligado ao contexto da equipa (sem gestão de projetos). **Pessoal** (só o criador) ou **Equipa** (atribuído a membros específicos ou a toda a equipa técnica).

```prisma
model Lembrete {
  id        String         @id @default(cuid())
  clubeId   String         // contexto (clube real ou técnico)
  criadorId String         // membro que criou
  ambito    AmbitoLembrete @default(PESSOAL) // PESSOAL | EQUIPA
  titulo    String
  descricao String?
  prazo     DateTime?      // deadline opcional (destaca-se à medida que se aproxima)
  criadoEm  DateTime       @default(now())

  destinatarios LembreteDestinatario[]

  @@index([clubeId, criadorId])
}

enum AmbitoLembrete { PESSOAL EQUIPA }

// Estado por destinatário (marcado como feito individualmente).
// PESSOAL: um único destinatário (o criador). EQUIPA: N destinatários.
model LembreteDestinatario {
  id            String    @id @default(cuid())
  lembreteId    String
  lembrete      Lembrete  @relation(fields: [lembreteId], references: [id], onDelete: Cascade)
  membroClubeId String    // destinatário (membro da equipa técnica)
  feito         Boolean   @default(false)
  feitoEm       DateTime?

  @@unique([lembreteId, membroClubeId])
  @@index([membroClubeId, feito])
}
```

---

## 4. Propriedade e portabilidade de dados

### 4.1 Princípio

Há três tipos de dados:
- **Operacionais/competitivos** → sempre do **clube** (ficam quando o treinador sai): atletas e participações, jogos, estatísticas, eventos, presenças, convocatórias, caderneta, escalões, épocas, competições, classificações, reuniões, comunicação, scouting, consentimentos.
- **Conteúdo metodológico** (exercícios, templates de sessão, modelos de jogo) → a propriedade é **decidida pelo treinador no momento da criação** (toggle pessoal vs clube), **não** por quem paga a licença (ver 4.2). Cada treinador tem sempre uma **biblioteca pessoal** (portátil); a **biblioteca do clube** representa a filosofia/identidade do clube e resulta de contribuição deliberada.
- **Histórico de carreira** (`RegistoCarreira`) e **carteira** (`Carteira`) → sempre do **treinador** (viajam com ele).

### 4.2 Propriedade do conteúdo metodológico — decidida pelo treinador (decisão definitiva 2026-08-05)

> **Esta decisão substitui qualquer decisão anterior em contrário.** A decisão anterior ("conteúdo criado sob licença de clube pertence ao CLUBE") estava **incorreta** e fica **revogada**. O pagamento da licença de clube **NÃO** transfere a propriedade do trabalho criativo do treinador.

- **Biblioteca pessoal = SEMPRE do treinador**, independentemente de quem paga a licença. O treinador cria exercícios/templates/modelos para a sua biblioteca pessoal e **leva-os consigo para qualquer clube ao longo de toda a carreira**. É a sua "casa" metodológica.
- **Biblioteca do clube = filosofia e identidade do clube.** O clube cria e mantém exercícios/templates que representam a sua filosofia de jogo/treino; **ficam no clube** quando um treinador sai.
- **Toggle na criação (mantém-se):** o treinador escolhe **pessoal** (default) ou **clube**. Contribuir para a biblioteca do clube é um **gesto explícito e deliberado**.

`proprietario` é fixado pela escolha do toggle no momento da criação:

| Escolha do treinador na criação | `proprietario` | Ao sair do clube |
|---|---|---|
| **Biblioteca pessoal** (default) | `TREINADOR` | Viaja com ele |
| **Biblioteca do clube** (toggle explícito) | `CLUBE` | Fica no clube |

- `autorId` regista **sempre** quem criou (crédito/rastreio), independentemente da propriedade.
- Conteúdo `CLUBE`: ligado a `clubeProprietarioId`, permanece na biblioteca do clube.
- Conteúdo `TREINADOR`: viaja com o autor (biblioteca pessoal); se foi usado em sessões do clube, o clube mantém um **snapshot só-de-leitura** para preservar os planos de treino passados (o master editável vai com o treinador).

### 4.3 Uma adesão ativa de cada vez

Um utilizador tem **no máximo uma adesão de clube ativa** (um clube de cada vez — que pode ser o clube técnico no modo Individual). Ao mudar de clube, a adesão anterior passa a `INATIVO` (histórico) e o conteúdo `TREINADOR` acompanha-o. Dentro do clube ativo, pode gerir **vários escalões**.

---

## 5. Contas, autenticação, adesão a clube e RGPD

### 5.1 Autenticação
- **Auth.js v5** com provider **Credentials** (email + password). Sem OAuth no núcleo. *(A integração Google Calendar (secção 3.12) usa OAuth Google, mas é uma integração de terceiros distinta do login da app.)*
- Password: mínimo 8 caracteres; guardada só como **hash bcrypt (custo 12)**; nunca em logs.
- Sessão **JWT** (`maxAge` 7 dias). **Uma sessão ativa por conta** — iniciar sessão noutro dispositivo termina a anterior.
- Gestão de password: alteração pelo próprio (exige password atual); reposição por um membro com `CLUBE_UTILIZADORES`. Recuperação por email é **FUTURO**.

### 5.2 Contas e modos (o "2 em 1" multi-tenant)
- O **`Utilizador` existe por si**. Ao registar-se/comprar licença Individual, é criado um **clube técnico** invisível (`clubeTecnico=true`) com o utilizador como Administrador único. O portfólio 🎒 (exercícios/templates/modelos com `proprietario = TREINADOR`, `RegistoCarreira`, `Carteira`) vive nesse contexto.
- **Modo Individual:** sem UI de gestão de clube, membros, perfis, branding ou escalões partilhados. O treinador usa plantel, treinos, exercícios, jogos, caderneta, analytics e relatórios normalmente.
- **Criar/aderir a clube real:** um utilizador pode criar um `Clube` (torna-se Administrador; geram-se os perfis de arranque) **ou** aceitar um convite (secção 5.3). Ao entrar num clube real, sai do contexto do clube técnico (adesão técnica passa a `INATIVO`).
- **Uma adesão ATIVA de cada vez** (secção 4.3).

> **⚠️ Impacto de modelação (2026-08-05):** o modo Individual passa a ter **sempre** um clube (técnico) em contexto — elimina o caso "sem clube". O helper `obterMembroAtual()` deixa de devolver `null` por ausência de clube; devolve o membro do clube técnico. Ver secção 7.2.

### 5.3 Transição de clube e absorção
- **Sair do clube real:** a `MembroClube` passa a `INATIVO`. Conteúdo `TREINADOR` viaja; conteúdo `CLUBE` e **snapshots** ficam. `RegistoCarreira` consolidado. O treinador **reativa a licença Individual por conta própria** (recria/reativa clube técnico).
- **Aderir a novo clube (absorção):** nova `MembroClube` ativa. Se o treinador tinha **licença Individual paga**, o **tempo restante converte-se em crédito** (`MovimentoCarteira` tipo `CREDITO_ABSORCAO`) na sua carteira, usável em compras futuras. **Reembolso real só por pedido manual via email** (exceção). O clube paga o **preço normal** da licença de clube (sem desconto).
- **Proteção:** um clube real **nunca pode ficar sem Administrador** (secção 6.7).

### 5.4 Contexto de sessão
Toda a operação corre num contexto resolvido no servidor:
- **Utilizador atual** — `obterUtilizadorAtual()`.
- **Membro/clube ativo** — `obterMembroAtual()` devolve `{ clube, perfil, capacidadesEfetivas, escalõesAtribuidos, ambito }` (sempre existe — clube real ou técnico).
- **Época ativa** — `obterEpocaAtiva()` (cookie `epoca_ativa` validado contra o clube).
- **Escalão selecionado** — parâmetro de UI (tabs), nunca fonte de autorização por si só.

### 5.5 RGPD (dados de menores)
> **Estado atual (2026-08-02):** o consentimento parental é recolhido pelo clube no ato de inscrição, **fora da aplicação**. A app assume que o consentimento existe para os atletas registados. O modelo `Consentimento` e o hard-delete são o **alvo futuro** (não bloqueadores).

- **Minimização:** recolher apenas o necessário (nome, data de nascimento, posições, número, observações, encarregado de educação).
- **Consentimento parental** (`Consentimento`, `DADOS`/`IMAGEM`): registado por atleta. Fotografias de menores só com consentimento `IMAGEM` ativo.
- **Direito ao esquecimento:** por defeito **soft-delete** (`ativo=false`); a pedido, **hard-delete** dos dados pessoais (estatísticas podem ser anonimizadas).
- **Portabilidade:** exportação dos dados do educando em PDF/estruturado, a pedido.
- **Retenção:** política pós-saída a definir por clube (FUTURO configurável).

### 5.6 Segurança geral
- Todas as Server Actions verificam **autenticação** e **capacidade/âmbito** antes de operar.
- **Validação server-side obrigatória** (Zod).
- Todas as queries filtram por **clube** + (quando aplicável) **época** + **âmbito**.
- Segredos só em `.env`. HTTPS. Logótipos e ficheiros servidos do Supabase Storage com URLs não-adivinháveis. Tokens de integração (Google) e `RelatorioPartilhado.token` não-adivinháveis.

---

## 6. Papéis e permissões configuráveis

### 6.1 Modelo
Um **`Perfil`** = `nome` + `ambito` (`TODO_CLUBE` | `PROPRIOS_ESCALOES`) + **lista de capacidades**. Perfis são **por clube** e **totalmente configuráveis**. Ao criar o clube geram-se **modelos de arranque editáveis** (Administrador, Diretor Técnico, Treinador Principal, Adjunto).

**Hierarquia base:** Admin → Diretor Técnico → Treinador (Principal/Adjunto).

### 6.2 Catálogo de capacidades
Chaves usadas em `Perfil.capacidades` e nos overrides de membro:

**Estrutura do clube (sempre a todo o clube):**
- `CLUBE_BRANDING` — editar cores e logótipo.
- `CLUBE_ESCALOES` — criar/editar/apagar escalões e visibilidade.
- `CLUBE_EPOCAS` — criar épocas e definir a ativa.
- `CLUBE_UTILIZADORES` — convidar/gerir membros, repor passwords, overrides.
- `CLUBE_PERFIS` — criar/editar perfis e atribuir.
- `CATALOGO_METRICAS` — gerir métricas configuráveis.
- `CATALOGO_HABILIDADES` — gerir o catálogo de habilidades.
- `FATURACAO_GERIR` — **FUTURO** (billing/subscrição; só o Admin).

**Dados de equipa (conforme o `ambito`):**
- `PLANTEL_GERIR` — criar/editar/arquivar atletas.
- `PROMOVER_ATLETAS` — mover/associar atletas entre escalões (participações, transições).
- `TREINOS_GERIR` — sessões e exercícios da sessão.
- `PRESENCAS_MARCAR` — marcar presenças.
- `PERIODIZACAO_GERIR` — planos semanais/mensais.
- `MODELO_JOGO_GERIR` — modelos de jogo e quadros táticos.
- `JOGOS_GERIR` — criar/editar/apagar jogos (âmbito) — variante `gerir_jogos_todos` = âmbito `TODO_CLUBE`.
- `CONVOCATORIA_GERIR` — convocatórias.
- `ESTATISTICAS_GERIR` — estatísticas e eventos ao vivo.
- `COMPETICOES_GERIR` — competições, calendário e classificações.
- `SCOUTING_GERIR` — observação de adversários.
- `CADERNETA_GERIR` — progresso de habilidades.
- `REUNIOES_GERIR` — reuniões e atas.
- `COMUNICACOES_GERIR` — gerar/gerir comunicações (WhatsApp) e templates.
- `LEMBRETES_EQUIPA_GERIR` — criar/atribuir lembretes **de equipa** (DT/Admin). *(Os lembretes **pessoais** não exigem capacidade — qualquer membro autenticado os cria para si.)*
- `EXERCICIOS_GERIR` — criar/editar exercícios e templates de sessão.
- `RELATORIOS_VER` — ver/exportar relatórios, analytics e criar links partilháveis.

### 6.3 Âmbito
- `TODO_CLUBE`: as capacidades de dados de equipa aplicam-se a **todos os escalões**.
- `PROPRIOS_ESCALOES`: aplicam-se **apenas aos escalões atribuídos** (`AtribuicaoEscalao`).
- As capacidades de estrutura (`CLUBE_*`, `CATALOGO_*`, `FATURACAO_GERIR`) são sempre de nível clube.

### 6.4 Overrides por membro (decisão 2026-08-05)
Além do perfil base, o Admin (com `CLUBE_UTILIZADORES`) pode **conceder** (`capacidadesExtra`) ou **revogar** (`capacidadesRevogadas`) capacidades a um membro específico.

**Capacidades efetivas** = `(perfil.capacidades ∪ capacidadesExtra) \ capacidadesRevogadas`.

- Exemplo: um treinador sem perfil de DT pode receber `PROMOVER_ATLETAS` isoladamente.
- **Regra de delegação (DEVE):** um membro só pode atribuir a outro capacidades **iguais ou inferiores às próprias**. Nunca pode conceder uma capacidade que ele próprio não tem.
- **Visibilidade do DT configurável (DEVE):** por defeito o DT vê todos os escalões (`TODO_CLUBE`); o Admin pode **restringi-lo a um subconjunto** de escalões (mudando o âmbito efetivo para `PROPRIOS_ESCALOES` + `AtribuicaoEscalao`, ou revogando `ver_todos_escaloes`). ⚠️ decidir na implementação se a restrição usa âmbito+atribuições ou uma capacidade `VER_TODOS_ESCALOES` dedicada.

### 6.5 Leitura de escalões alheios
Um membro pode **ler** um escalão que não é seu **se** `Escalao.visivelOutrosTreinadores = true`. A escrita continua a exigir capacidade + âmbito.

### 6.6 Modelos de arranque (defaults editáveis)
- **Administrador** — `TODO_CLUBE`, **todas** as capacidades (exceto `FATURACAO_GERIR` que é FUTURO). Quem paga a licença de clube. Vê e faz tudo, incluindo billing (futuro) e configuração.
- **Diretor Técnico** — `TODO_CLUBE`, todas as capacidades de **dados de equipa** (incl. `PROMOVER_ATLETAS`, `gerir_jogos_todos`, `COMUNICACOES_GERIR`, `REUNIOES_GERIR`) + `CATALOGO_*` + `RELATORIOS_VER`. **NÃO** gere billing nem estrutura da conta/plataforma (`CLUBE_*` desligadas por defeito; ligadas pelo admin).
- **Treinador Principal** — `PROPRIOS_ESCALOES`, todas as capacidades de dados de equipa dos seus escalões + `EXERCICIOS_GERIR` + `RELATORIOS_VER`. `PROMOVER_ATLETAS` desligada por defeito (concedível por override).
- **Adjunto** — `PROPRIOS_ESCALOES`, capacidades operacionais (`TREINOS_GERIR`, `PRESENCAS_MARCAR`, `ESTATISTICAS_GERIR`, `CADERNETA_GERIR`, `EXERCICIOS_GERIR`); restantes desligadas por defeito.

### 6.7 Verificação (algoritmo de autorização)
Helper `exigirCapacidade(cap, escalaoId?)`:
1. Há utilizador autenticado? senão → `erro("Não autenticado")`.
2. Há adesão ativa (clube real ou técnico)? senão → `erro("Sem acesso a este clube")`.
3. As **capacidades efetivas** (6.4) incluem `cap`? senão → `erro("Sem permissão")`.
4. Se `cap` é de dados de equipa e o âmbito efetivo é `PROPRIOS_ESCALOES`: o `escalaoId`-alvo está nos atribuídos? senão → `erro("Sem permissão neste escalão")`.
5. Para **leitura** de escalão alheio: permitido se `visivelOutrosTreinadores`.

### 6.8 Regras de proteção
- O **Administrador** tem sempre todas as capacidades (não bloqueável a si próprio); `capacidadesRevogadas` não se aplica ao último admin.
- Um clube real **nunca fica sem Administrador** (não remover/despromover/expulsar o último admin sem promover outro).
- Um perfil **em uso** não se apaga sem reatribuir os membros.
- **Delegação (6.4):** atribuir/conceder só capacidades ≤ às próprias.

---

## 7. Server Actions

Sem REST (exceto o handler do Auth.js e, futuramente, o webhook do Paddle e o callback OAuth do Google Calendar). Todas as actions começam com `"use server"`, vivem em `lib/actions/`, e devolvem `Resultado<T>`.

### 7.1 Padrão obrigatório de cada action
1. Validar input com **Zod** (`lib/schemas/`).
2. Resolver contexto: `obterMembroAtual()`.
3. **`exigirCapacidade(cap, escalaoId?)`** (secção 6.7).
4. Quando aplicável, `obterEpocaAtiva()`.
5. Operar (Prisma), **filtrando sempre por clube + época + âmbito**.
6. `revalidatePath()` das rotas afetadas.
7. Devolver `Resultado<T>`.

### 7.2 Helpers de contexto (`lib/`)
- `obterUtilizadorAtual(): Promise<Utilizador | null>`
- `obterMembroAtual(): Promise<{ clube; perfil; capacidadesEfetivas; escalõesAtribuidos; ambito }>` — **sempre não-nulo** para utilizador autenticado (clube real ou técnico).
- `capacidadesEfetivas(membro): string[]` — aplica overrides (6.4).
- `obterEpocaAtiva(): Promise<Epoca | null>`
- `exigirCapacidade(cap, escalaoId?)`
- `podeLerEscalao(escalaoId): Promise<boolean>`

### 7.3 Assinaturas por módulo (referência; validadas por Zod; devolvem `Resultado<T>`)

**Contas, clube e licença** (`contas.ts`, `clubes.ts`, `licenca.ts`)
```
registar(dados) // cria Utilizador + clube técnico + Carteira
iniciarSessao(dados), terminarSessao(), alterarMinhaPassword(dados)
criarClube(dados) // clube real: criador=Administrador + perfis de arranque
atualizarBrandingClube(dados) // CLUBE_BRANDING
obterClubeAtivo()
// Licenciamento (billing Paddle deferido; arquitetura pronta):
obterLicencaAtual(), simularAbsorcao(utilizadorId) // calcula crédito proporcional
aplicarCreditoAbsorcao(utilizadorId) // CREDITO_ABSORCAO na carteira
obterCarteira(), listarMovimentosCarteira()
```

**Membros e perfis** (`membros.ts`, `perfis.ts`) — `CLUBE_UTILIZADORES` / `CLUBE_PERFIS`
```
convidarMembro(email, perfilId), removerMembro(id), sairDoClube()
atribuirPerfil(membroId, perfilId), atribuirEscaloes(membroId, escalaoIds[])
definirOverrides(membroId, extra[], revogadas[]) // 6.4 (respeita delegação)
redefinirPasswordMembro(membroId, novaPassword), listarMembros()
criarPerfil/atualizarPerfil/apagarPerfil/listarPerfis
```

**Escalões / Épocas / Catálogos** — `CLUBE_ESCALOES` / `CLUBE_EPOCAS` / `CATALOGO_*`
```
criarEscalao/atualizarEscalao/apagarEscalao/moverEscalao/listarEscaloes/definirVisibilidadeEscalao
criarEpoca/listarEpocas/definirEpocaAtiva/selecionarEpoca
criarMetrica/listarMetricas/alternarMetrica/moverMetrica
criarHabilidade/atualizarHabilidade/apagarHabilidade/moverHabilidade/listarHabilidades
```

**Plantel e participações** (`atletas.ts`) — `PLANTEL_GERIR`, `PROMOVER_ATLETAS`
```
criarAtleta/atualizarAtleta/apagarAtleta(soft)/obterAtleta
listarAtletas(escalaoId?, epocaId?) // por participação ativa
criarAtletasEmMassa(lista[{nome, numero}]) // onboarding vitória rápida
associarEscalao(atletaId, escalaoId, tipo, numero) // PROMOVER_ATLETAS
transferirEscalao(atletaId, deEscalao, paraEscalao, permanente?) // transição
terminarParticipacao(atletaEscalaoId)
obterEstatisticasAtleta(id, escalaoId?) // secção 10
registarConsentimento(atletaId, tipo, dados)
```

**Exercícios e templates de sessão** (`exercicios.ts`, `templatesSessao.ts`) — `EXERCICIOS_GERIR`
```
criarExercicio/atualizarExercicio/apagarExercicio(bloqueado se em uso)/obterExercicio
listarExercicios(parteTreino?, categoria?, q?) // biblioteca pessoal + clube; anota origem + naBibliotecaDoClube
partilharExercicioNoClube({exercicioId})/removerPartilhaNoClube({exercicioId}) // toggle explícito
instalarBibliotecaArranque() // seed curado, idempotente
criarModeloSessao/atualizarModeloSessao/apagarModeloSessao/listarModelosSessao(escalaoAlvo?)/obterModeloSessao(id)
partilharModeloSessaoNoClube(id), criarSessaoDeTemplate({modeloSessaoId, escalaoId, data, epocaId?})
instalarTemplatesArranque() // idempotente; exige a biblioteca de exercícios instalada
```

**Treinos e periodização** (`treinos.ts`, `periodizacao.ts`) — `TREINOS_GERIR` / `PERIODIZACAO_GERIR` / `PRESENCAS_MARCAR`
```
criarSessao/atualizarSessao/apagarSessao/obterSessao/listarSessoes(escalaoId?)
adicionarExercicioSessao/removerExercicioSessao/reordenarExercicios
marcarPresencas(sessaoId, presencas[]) // upsert em lote; inclui motivo de falta
criarPlaneamento/atualizarPlaneamento/apagarPlaneamento/listarPlaneamentos/sugerirPlaneamento
```

**Modelo de jogo / quadro tático** (`modeloJogo.ts`) — `MODELO_JOGO_GERIR`
```
criarModeloJogo/atualizarModeloJogo/apagarModeloJogo/obterModeloJogo
listarModelosJogo(escalaoId?, momento?) // escalaoId=null (portátil) sempre incluído
criarQuadroTatico(jogoId, dados)/atualizarQuadroTatico/apagarQuadroTatico
listarQuadrosTaticos(jogoId, tipo?)     // tipo: GERAL | BOLA_PARADA
```

**Jogos, competições, estatísticas, scouting** (`jogos.ts`, `competicoes.ts`, `scouting.ts`)
```
criarJogo/atualizarJogo/apagarJogo/obterJogo/listarJogos(escalaoId?)   // JOGOS_GERIR
definirConvocatoria(jogoId, convocados[{atletaId, posicaoPrevista?, titular?}]) // CONVOCATORIA_GERIR
guardarEstatisticas(jogoId, estatisticas[]) // ESTATISTICAS_GERIR (upsert; blocoTempo)
registarEventoJogo/listarEventos/apagarEvento // live; agrega p/ estatísticas
guardarRelatorio/definirVideo
obterVistaDiaDeJogo(jogoId) // convocados+posições, scouting, bolas paradas, hora/local
criarCompeticao/atualizarCompeticao/apagarCompeticao/listarCompeticoes // COMPETICOES_GERIR
registarResultadoCompeticao(competicaoId, dados) // outras equipas
obterClassificacao(competicaoId) // calculada
criarObservacaoAdversario(jogoId?, dados)/listarObservacoes // SCOUTING_GERIR
```

**Comunicação** (`comunicacao.ts`) — `COMUNICACOES_GERIR`
```
gerarTextoComunicacao({ tipo, contexto, modeloId? })  // Resultado<string> formatado p/ WhatsApp
gerarCalendarioTexto(mes, ano)                        // Resultado<string> (treinos+jogos legíveis do mês)
listarModelosComunicacao()                            // modelos do clube + globais do seed
editarModeloComunicacao({ id, nome, template })       // só modelos do próprio clube
instalarSeedComunicacao()                             // cópia editável dos 7 modelos, idempotente
obterContextoConvocatoria(jogoId) / obterContextoResultado(jogoId) // Record<string,string>
```
O **deep link** é construído no **cliente** — o backend só gera texto. A UI usa o **link universal**
`https://api.whatsapp.com/send?text=…` (`linkWhatsApp`, em `lib/comunicacao-cliente.ts`), que funciona
em web, Android e iOS; o esquema `whatsapp://send?text=…` falha em desktop sem app instalada.

**Lembretes / tarefas** (`lembretes.ts`)
```
criarLembretePessoal(dados) // qualquer membro autenticado (só para si)
criarLembreteEquipa(dados, destinatarios[]) // LEMBRETES_EQUIPA_GERIR (membros específicos ou toda a equipa técnica)
marcarLembreteFeito(lembreteDestinatarioId, feito)
listarMeusLembretes() // pessoais + de equipa onde sou destinatário (ordenados por prazo)
atualizarLembrete(id, dados)/apagarLembrete(id) // criador (ou Admin)
```

**Reuniões e calendário** (`reunioes.ts`, `integracao.ts`) — `REUNIOES_GERIR`
```
criarReuniao/atualizarReuniao/apagarReuniao/listarReunioes(ambito?, escalaoId?)
// Integração Google Calendar (§3.12) — OAuth Google, distinta do login da app:
obterUrlAutorizacaoCalendario()   // URL de consentimento OAuth (state = utilizadorId)
obterIntegracaoCalendario()        // estado atual (null se não ligada)
desconectarGoogleCalendar()        // remove a integração do utilizador
sincronizarComCalendario(tipo, id) // "SESSAO"|"JOGO" → Google (fire-and-forget, idempotente via googleEventId)
// Callback OAuth (única exceção REST além do Auth.js): app/api/google/callback (GET)
// refreshToken guardado encriptado at-rest (AES-256-GCM, lib/crypto.ts)
```

**Relatórios, analytics e carreira** (`relatorios.ts`, `analise.ts`, `carreira.ts`) — `RELATORIOS_VER`
```
obterAnalyticsAtleta(atletaId, epocaId)
obterAnalyticsEquipa(escalaoId, epocaId)
obterAnalyticsClube(epocaId) // transversal (Admin/DT; treinadores se configurado)
gerarPDF(tipo, id) // ficha de jogo, convocatória, plano de treino, relatório de atleta/equipa/época
criarRelatorioPartilhado(tipo, ids, expiraEm?) // link web partilhável
obterRelatorioPartilhado(token) // público (sem auth)
listarRegistoCarreira/editarRegistoCarreira // 🎒
```

---

## 8. Módulos funcionais

Cada módulo define **conteúdo**, **ações**, **estado vazio** e **regras**. Estados loading/erro seguem a secção 13. Navegação: barra de topo (logótipo do clube + seletor de época + menu do utilizador) + sidebar (PC) / bottom-nav (móvel). **No modo Individual, os módulos de gestão de clube (membros, perfis, branding) não aparecem.**

### 8.1 Onboarding e contas
> **Princípio (decisão 2026-08-05):** o **formulário de registo recolhe apenas o essencial**. O **setup completo é feito no primeiro ecrã após o primeiro login**, como **onboarding guiado pós-registo** — nunca misturado com o formulário de pagamento.
- **Login** (`/login`): email + password. Erros inline; toast em falha.
- **Registo — só dados essenciais:**
  - **Individual:** nome, email, password. Cria `Utilizador` + **clube técnico** invisível + `Carteira`.
  - **Clube:** nome, email, password **+ nome do clube** (apenas). Cria `Utilizador` + `Clube` real (criador = Administrador; geram-se os perfis de arranque).
  - ❌ **Não** se recolhem no registo/pagamento: logótipo, cores, escalões.
- **Setup guiado pós-primeiro-login (onboarding):** no primeiro ecrã após o primeiro login, um fluxo guiado completa a configuração:
  - **Clube:** logótipo, **cores** (branding), **escalões**, época — cada passo pode ser saltado e retomado depois.
  - **Individual:** vai direto para o percurso de vitória rápida (abaixo).
- **Vitória rápida (decisão 2026-08-05):** entrega valor nos primeiros 10 minutos:
  1. **Criação em massa do plantel** — nome + número (dados básicos primeiro; detalhes preenchidos progressivamente).
  2. **Primeira sessão a partir de um template** (biblioteca curada).
  3. **Primeira convocatória** gerada e **partilhada no WhatsApp**.
- **Aceitar convite:** por link/email; adere ao clube com o perfil atribuído.
- **Estado vazio:** plantel/treinos vazios encaminham para os passos da vitória rápida.

### 8.2 Gestão de membros e perfis (`CLUBE_UTILIZADORES`, `CLUBE_PERFIS`) — só clube real
- **Membros:** lista (nome, perfil, escalões, estado, overrides). Ações: convidar, editar perfil, atribuir escalões, **definir overrides** (conceder/revogar capacidades, respeitando delegação), restringir visibilidade do DT, repor password, remover.
- **Editor de overrides:** diálogo por membro com a grelha do catálogo ativo de capacidades (6.2); cada linha indica a origem — `perfil`, `extra` (concedida além do perfil) ou `revogada`. Guarda-se o conjunto de capacidades **efetivas** desejado e derivam-se `extra`/`revogadas` face ao perfil base, para não persistir overrides redundantes. **Delegação (6.4):** o que o próprio não tem não é concedível (bloqueado na UI e recusado no servidor); revogar não tem essa restrição.
- **Gating de UI:** sem `CLUBE_UTILIZADORES` o ecrã da equipa técnica é **só de leitura** (sem convidar, mudar perfil, overrides, password, remover ou atribuir escalões).
- **Perfis:** criar/duplicar/editar/apagar; editor = nome + âmbito + **grelha de capacidades** (por domínio — secção 6.2).
- **Regras:** nunca deixar o clube sem admin (6.8); perfil em uso não se apaga sem reatribuir; delegação de capacidades (6.4).

### 8.3 Branding do clube (`CLUBE_BRANDING`) — só clube real
- Editar cor primária, secundária e logótipo (upload → Supabase Storage). Cores por variáveis CSS em tempo real; logótipo na barra de topo, marca de água e PDF. Pré-visualização.

### 8.4 Definições base
- **Escalões** (`CLUBE_ESCALOES`): CRUD + reordenar + visibilidade. Apagar bloqueado se tiver participações/atletas.
- **Épocas** (`CLUBE_EPOCAS`): criar, listar, definir ativa.
- **Métricas** (`CATALOGO_METRICAS`): CRUD + tipo + ativar/desativar + reordenar.
- **Habilidades** (`CATALOGO_HABILIDADES`): CRUD agrupado por nível + reordenar.
- **Subcategorias de exercício:** CRUD (seed instala predefinidas).
- **Templates de comunicação** (`COMUNICACOES_GERIR`): ver/editar variantes.

### 8.5 Plantel e participações (`PLANTEL_GERIR`, `PROMOVER_ATLETAS`)
- **Atleta ao nível do clube.** Lista: tabs por escalão (participações ativas na época) + pesquisa; cartões (avatar, nome, **número do escalão**, posições). **Aviso de número duplicado** entre participações ativas do mesmo escalão.
- **Participações (N-N):** um atleta tem uma **participação PRINCIPAL** e pode ter **simultâneas/ocasionais** noutros escalões. Ações: **associar** a escalão (tipo + número), **transferir** (transição permanente muda o principal), **terminar** participação (com data). Histórico preservado.
- **Gating de UI das ações (6.7):** **associar/transferir** só aparecem com `PLANTEL_GERIR`; **terminar** só com `PROMOVER_ATLETAS` (capacidade de clube, distinta). Os escalões oferecidos (destino de transferência e associação) limitam-se aos **geríveis** pelo membro — todos, se o âmbito for `TODO_CLUBE`; senão, só os atribuídos —, porque transferir exige capacidade na **origem e no destino**.
- **Perfil do atleta:** cabeçalho + abas **Estatísticas** (vista conjunta na época + vista por escalão), **Caderneta**, **Dados** (+ consentimentos), **Participações** (histórico de escalões).
- **Novo/Editar:** nome (obrigatório), posições, data de nascimento, foto (URL), encarregado de educação; **escalão + número** definem-se na participação.
- **Apagar:** soft-delete; hard-delete só por RGPD (5.5).
- **Estado vazio:** "Ainda não há atletas neste escalão." + atalho de criação em massa.

### 8.6 Exercícios e bibliotecas (`EXERCICIOS_GERIR`)
- **Duas bibliotecas em abas** (`/exercicios?bib=pessoal|clube`, default pessoal, com contagem por aba): **Pessoal** (🎒 do treinador — `origem = PESSOAL`) e **do Clube** (🏛️ partilhada — tudo o que está na biblioteca do clube, `naBibliotecaDoClube`). Um exercício pessoal **partilhado** aparece nas **duas** abas (é dele e está no clube), com o *badge* «No clube» na aba Pessoal. Filtro por **parte do treino** / categoria + pesquisa por nome, tudo resolvido no servidor e preservado ao trocar de aba; grelha de cartões com **miniatura do diagrama**, *badge* de parte do treino e marca dos de **seed** («Curado»).
- **Biblioteca de exemplo curada** (FutsalCoach): organizada por parte do treino (aquecimento/principal/retorno), objetivo tático e escalão/idade — garante que **nunca começa vazia**. O botão de instalação vive no **estado vazio da aba Clube**.
- **Detalhe:** nome, parte do treino, categoria, duração, objetivo, descrição, **diagrama** (render read-only, play se animado).
- **Novo/Editar:** formulário + **editor de campo** (secção 11) com passos/animação. Campos: nome, objetivo, **classificação** (categoria principal, subcategoria, **parte do treino** — opcional, opções `PARTES_TREINO` · **escalão alvo** — texto livre opcional, máx. 40, ex.: «Sub-15»), duração, descrição. Na edição estes campos vêm pré-preenchidos e são reenviados (não se apagam silenciosamente). **Toggle de biblioteca** (🎒 pessoal, default · 🏛️ clube) **só na criação** — a propriedade não se altera por edição (§4.2). **Toggle "partilhar no clube"** nos cartões (contribuição deliberada, reservada ao autor).
- **Apagar:** bloqueado se em uso (indica em quantas sessões/templates).

### 8.7 Templates de sessão (`EXERCICIOS_GERIR`)
- Rota **`/treinos/templates`**, alcançável a partir de **Treinos** («Usar template») e de **Exercícios** («Templates de sessão»).
- Sessões completas (aquecimento + principal + jogo reduzido + retorno), com durações e objetivos, organizadas por objetivo tático/fase da época/escalão. Curadas (seed) + criadas pelo treinador/clube (pessoais ou partilhadas). Cada template mostra origem (🎒/🏛️), nº de exercícios, duração e o resumo ordenado das linhas; **filtro por escalão alvo** (opções derivadas dos valores existentes, por o campo ser texto livre).
- **Novo/Editar:** diálogo com nome, escalão alvo, fase da época, objetivo tático, duração, descrição, toggle de biblioteca e **lista de exercícios reordenável** (picker da biblioteca visível; duração e parte do treino por linha). A ordem é reindexada 0..n-1 na gravação.
- **Criar sessão a partir de template:** pede data/hora + escalão e copia exercícios/durações para uma nova `Sessao` (ponto de partida editável, sem ligação ao template).
- **Partilhar no clube:** só para templates pessoais do autor; ao contrário dos exercícios, **transfere a propriedade** (§3.4) — a confirmação explicita-o.
- **Estado vazio:** templates curados garantem arranque com conteúdo.

### 8.8 Treinos (`TREINOS_GERIR`, `PRESENCAS_MARCAR`)
- **Lista/Calendário:** tabs por escalão; alternância lista ⇄ calendário mensal; data, objetivo, nº exercícios, taxa de presença.
- **Detalhe:** cabeçalho + **Exercícios** (adicionar da biblioteca, reordenar, total de tempo, parte do treino) e **Presenças** (seletor por atleta, **motivo de falta** quando aplicável — lesão/doença/outro, guardar em lote). Notas de treino.
- **Novo/Editar:** data/hora, escalão, duração, objetivo, local, notas, ligação a planeamento/microciclo, **criar a partir de template**.
- **Estado vazio:** "Sem sessões nesta época."

### 8.9 Periodização (`PERIODIZACAO_GERIR`)
- Planos semanais/mensais por escalão/época (micro/mesociclos, período, objetivos). **Grelha anual** (visão macro). Ligação das sessões ao microciclo.

### 8.10 Modelo de jogo e quadro tático (`MODELO_JOGO_GERIR`)
- **Modelo de jogo (documento vivo):** por clube/escalão/época, organizado por **momento** (org. ofensiva/defensiva, transições, **bolas paradas**), com **princípios e subprincípios** + diagrama (editor). Metodologia genérica portátil = sem escalão/época (`TREINADOR`).
- **Bolas paradas:** esquemas de canto/livre/lançamento criados no editor — vivem na biblioteca, no modelo de jogo e nos quadros táticos do jogo.
- **Quadro tático por jogo (🏛️):** esquemas específicos (gerais e de bola parada) ligados a um jogo.

### 8.11 Jogos, competições, estatísticas, classificação e scouting
- **Calendário/Lista** (`JOGOS_GERIR`): tabs por escalão; data, adversário, Casa/Fora, resultado, competição, tipo.
- **Vista de dia de jogo (decisão 2026-08-05):** ecrã dedicado — **convocados + posições previstas**, **notas do adversário (scouting)**, **esquemas de bola parada** do jogo, **hora e local**. Otimizado para consulta rápida à beira-campo.
- **Detalhe do jogo:** cabeçalho + resultado + **faltas acumuladas por parte** + abas:
  - **Convocatória** (`CONVOCATORIA_GERIR`): toggle por atleta + posição prevista + titular. Remover convocado com estatísticas → confirmação (apaga estatísticas).
  - **Estatísticas** (`ESTATISTICAS_GERIR`): por atleta — utilização, **tempo de jogo por blocos** (jogo completo/meia-parte/10min/5min), golos, assistências; se GR: defesas/sofridos/faltas; + métricas configuráveis. Aviso se soma de golos ≠ resultado.
  - **Modo ao vivo:** eventos (golo, assistência, falta, cartão, **substituição com bloco de tempo**, defesa, timeout) por parte/minuto, pelo treinador ou adjunto; agrega para as estatísticas. Otimizado telemóvel + offline.
  - **Relatório** (texto) · **Vídeo** (YouTube) · **Quadro tático** (diagramas do jogo).
  - **Scouting** (`SCOUTING_GERIR`): observação do adversário **criada no próprio jogo** (organização, pontos fortes/fracos, notas, diagrama, jogadores). Também disponível avulso.
- **Competições** (`COMPETICOES_GERIR`): criar competição (liga/torneio/taça); **tabela de classificação** construída a partir de resultados **inseridos manualmente** pelo treinador (todos os jogos de todas as equipas; os jogos da própria equipa podem alimentar via `Jogo`); calendário. **Sem integração automática na v1** — integração com APIs de competições oficiais = FUTURO (secção 18).
  - **`/jogos/competicoes`** (lista) — cartão por competição com **nome, formato** (Liga/Torneio/Taça, via `LABEL_FORMATO_COMPETICAO`), **tipo** (Oficial/Amigável), **escalão**, **época** e **nº de jogos**; **filtro por escalão** (cliente); botão **«Nova competição»**; cada cartão liga ao detalhe e tem ação de apagar (confirmação — os jogos mantêm-se, deixam de estar ligados). Estado vazio: «Sem competições nesta época.»
  - **`/jogos/competicoes/[id]`** (detalhe) — cabeçalho (nome + *badges* formato/tipo/escalão) + ações **Editar**/**Apagar**; abas: **Classificação** (`obterClassificacao` — colunas Pos, Equipa, J, V, E, D, GM, GS, DG e **Pts só em LIGA**; equipa própria — `escalao.nome` — destacada; TORNEIO/TACA sem pontos, ordenação por diferença de golos), **Resultados externos** (lista de `ResultadoCompeticao` «Casa golos — golos Fora», adicionar via `registarResultadoExternoSchema`, remover com confirmação) e **Jogos próprios** (jogos do clube nesta competição, com resultado e ligação ao detalhe do jogo).
  - **Formulário de competição** (diálogo, reutilizado em criar/editar): `nome`, `formato` (Select), `tipo` (Select), `escalaoId` (Select), `epocaId` (Select, *default* época ativa; **fixo em edição** — o servidor não altera a época).
  - **Associação no jogo:** `JogoForm` tem um Select **«Competição»** (opcional, filtrado pelas competições do **escalão selecionado**; muda de escalão limpa a seleção incompatível) que preenche `Jogo.competicaoId`, além do campo legado **«Competição (texto livre)»** (`Jogo.competicao`).
- **Estado vazio:** "Sem jogos nesta época."

### 8.12 Comunicação com pais e equipa técnica (`COMUNICACOES_GERIR`)
> **Filosofia:** a app **não é um canal** de comunicação — é um **gerador de conteúdo estruturado** para o WhatsApp. Os pais **não têm conta**.
- **Templates:** convocatória, cancelamento de treino, mudança de horário/local, resultado pós-jogo, aviso geral, calendário mensal/época.
- **Fluxo:** o treinador tem/gera o conteúdo na app → **"Partilhar no WhatsApp"** → o WhatsApp abre com o texto pré-formatado → envia para o grupo do escalão.
- **Calendário:** gerado pela app e partilhado como **template pinado** no grupo.
- **Estado vazio:** sugestão de gerar a primeira convocatória.

**Ecrãs** (entrada pela navegação lateral, «Comunicações»):
- **`/comunicacoes`** — um cartão por `TipoComunicacao` (7) com o template **em vigor** (variante do clube → *fallback* global), *badge* **«Do clube»/«Global»**, pré-visualização das primeiras linhas e ações **Gerar** / **Editar** (ou **Personalizar**, quando só existe o global). Botão **«Instalar templates base»** (`instalarSeedComunicacao`) enquanto o clube não tiver cópias próprias.
- **`/comunicacoes/gerar`** (aceita `?tipo=…&jogo=…`) — escolha do tipo, campos de contexto **derivados dos placeholders do template**, **pré-visualização ao vivo no cliente** (`substituirPlaceholders`) e **texto final gerado no servidor** ao submeter. Contexto pré-preenchido conforme o tipo: `CONVOCATORIA`/`RESULTADO` por *picker* de jogo (`obterContextoConvocatoria`/`obterContextoResultado`, valores **editáveis**); `CALENDARIO_MENSAL` por mês/ano (`gerarCalendarioTexto`, sem pré-visualização local porque a lista de eventos é montada no servidor); restantes tipos por preenchimento manual, com `nomeEquipa`/`nomeTreinador` pré-preenchidos.
- **`/comunicacoes/[tipo]/editar`** — edição do template **do clube** (nome + texto), com os **campos disponíveis** clicáveis (inserem `{{chave}}` na posição do cursor) e pré-visualização com valores de exemplo. Se o clube ainda não tiver cópia, mostra o global em **leitura** e propõe instalar os templates base (o servidor recusa editar globais).
- **Atalho no jogo** — em `/jogos/[id]`, botão **«Gerar convocatória»** (só com `COMUNICACOES_GERIR`) que abre o texto pronto com **Copiar** / **Partilhar no WhatsApp** e ligação para o gerador completo.

**Partilha (cliente).** `Copiar texto` usa a Clipboard API (com alternativa por `textarea` em contextos inseguros) e `Partilhar no WhatsApp` abre, em nova janela, `https://api.whatsapp.com/send?text=<texto codificado>` — o **link universal** oficial, preferido ao esquema `whatsapp://` por funcionar também em desktop sem app instalada. Helpers puros em `lib/comunicacao-cliente.ts` (rótulos pt-PT dos placeholders, `linkWhatsApp`, meses).

### 8.13 Reuniões e calendário (`REUNIOES_GERIR`)
- **Reuniões (escalão/clube):** criar, calendarizar, registar **ata/notas**, partilhar para grupo de staff via template WhatsApp. Ata exposta aos membros do âmbito.
- **Sincronização Google Calendar:** treinos, jogos e reuniões sincronizados com o Google Calendar do treinador (integração 3.12).

### 8.14 Caderneta (`CADERNETA_GERIR`)
- Habilidades por nível, com estado, data de desbloqueio e notas. Progresso ("7 de 20") + **celebração** ao desbloquear.

### 8.15 Analytics, relatórios e PDF (`RELATORIOS_VER`) — **pilar do produto**
> Os dados entram pelo uso quotidiano; a app gera valor acumulado automaticamente. **Três níveis:**
- **Atleta:** evolução de presenças, **minutos/tempo de jogo acumulado (por blocos)**, golos/estatísticas por jogo, progressão da caderneta, comparação com a média da equipa.
- **Equipa:** evolução de resultados, golos marcados/sofridos, assiduidade mensal, distribuição de tipos de treino, jogadores mais utilizados, top scorers.
- **Clube (transversal):** comparação entre escalões, assiduidade global, resultados por escalão, KPIs. Visível a **DT e Admin** por defeito; visibilidade para treinadores **configurável pelo Admin**.
- **Relatório de fim de época:** por atleta/equipa/clube — **exportável em PDF + vista web com link partilhável** (`RelatorioPartilhado`), com **identidade do clube** (cor, logótipo). É o "wow" do produto (apresentar ao clube, pais, direção). Sem IA.
- **PDF profissional:** ficha de jogo, convocatória, plano de treino, relatório de desenvolvimento do atleta.

### 8.16 Dashboard — centro de comando contextual
> **Decisão 2026-08-05:** o dashboard é **temporal e contextual** — sabe o que é **hoje** e organiza a hierarquia de informação em função do que é mais **iminente**. A hierarquia visual muda dinamicamente.
- **Destaque principal (adapta-se):**
  - **Se há treino hoje:** o treino **domina o ecrã** (hora, local, quem confirmou presença, sessão planeada ou aviso de "não planeada").
  - **Se não há treino mas há jogo iminente:** o **jogo** ocupa o destaque, com **countdown**.
  - Caso contrário: próximo evento (treino/jogo) com resumo.
- **Secção "Atenção necessária"** (abaixo do destaque):
  - Ata de reunião publicada **não lida**.
  - **Convocatória por enviar** (com deadline).
  - Sessão do **próximo treino não planeada**.
  - **Atletas abaixo da % de presença mínima**.
  - **Lembretes/to-dos pendentes** com deadline próximo (secção 8.19).
- **Ações rápidas** (nova sessão, novo jogo, novo atleta) + resumo do escalão selecionado.
- **Respeita permissões e contexto:** mostra só o que o membro pode ver; no modo Individual não mostra itens de gestão de clube.

### 8.17 Perfil do treinador e carreira
- Espaço pessoal (🎒): biblioteca pessoal, **histórico de carreira** (automático + editável) e **carteira** (saldo/movimentos). Disponível no modo Individual e no clube.

### 8.18 Conformidade FPF (levantamento pendente)
- **DEVE (após levantamento):** exportação do **Modelo 2 FPF** e outros documentos federativos exigidos. **Requer levantamento dos requisitos exatos da FPF** (campos, formatos) antes de implementar — fase própria (secção 16).

### 8.19 Lembretes e tarefas (to-dos)
> **Decisão 2026-08-05:** bloco de notas inteligente ligado ao contexto da equipa — **sem** complexidade de gestão de projetos.
- **Pessoal:** qualquer membro cria lembretes só para si (ex: "preparar sessão de terça", "imprimir convocatória"). Não exige capacidade.
- **Equipa** (`LEMBRETES_EQUIPA_GERIR`): DT ou Admin cria e **atribui/partilha** com treinadores específicos ou com toda a equipa técnica (ex: "todos os treinadores lançarem convocatórias até sexta 18h").
- **Deadline opcional:** com prazo, ficam **destacados** à medida que a data se aproxima (e alimentam a secção "Atenção necessária" do dashboard — 8.16).
- **Feitos individualmente:** cada destinatário marca o seu como feito (`LembreteDestinatario.feito`).
- **Onde aparecem:** no dashboard de cada destinatário e numa lista dedicada.
- **Estado vazio:** "Sem lembretes pendentes" + ação de criar.

---

## 9. Regras de negócio transversais e casos-limite

**Herdados do MVP (mantêm-se):**
- **Métrica desativada com valores históricos:** valores mantêm-se; jogos passados mostram-nos; novos não a pedem. Nunca apagar `ValorMetrica` ao desativar.
- **Mudança de posição do atleta:** jogos passados mantêm os dados; a UI decide que campos mostrar pelo valor registado no `EstatisticaAtleta`.
- **Atleta que entra a meio da época:** taxa de presença usa como divisor as sessões do escalão a partir da `dataIngresso` (ou `criadoEm`).
- **Convocatória alterada com estatísticas:** remover convocado com estatísticas pede confirmação e apaga as estatísticas desse atleta.
- **Sessão/jogo com data fora da época:** permitido, com aviso suave.
- **Dois atletas com o mesmo número:** permitido; aviso não-bloqueante por escalão.
- **Sem época ativa:** actions devolvem "Nenhuma época ativa"; UI encaminha.
- **Golos individuais ≠ resultado:** aviso suave, não bloqueia.
- **Exercício em uso:** apagar bloqueado; editar sempre permitido.
- **Concorrência:** last-write-wins.

**Novos (ecossistema, produto final e brainstorming 2026-08-05):**
- **Modo Individual = clube técnico:** contexto de clube existe sempre; UI de gestão de clube oculta. `obterMembroAtual()` nunca é null para autenticado.
- **Permissão negada:** action sem capacidade/âmbito devolve `erro("Sem permissão")`; a UI esconde/desativa as ações não permitidas.
- **Overrides e delegação:** capacidades efetivas = perfil ∪ extra \ revogadas; só se atribuem capacidades ≤ às próprias.
- **Atleta em múltiplos escalões:** presenças e estatísticas são **por escalão**; a vista conjunta agrega a época toda. Cada participação tem o seu **número**.
- **Participação principal obrigatória:** cada atleta tem sempre **exatamente uma** participação `PRINCIPAL` ativa por época; a transição permanente muda o principal (a anterior fica `TRANSICAO_PERMANENTE`/`INATIVO` com `dataFim`). O invariante é imposto **nas escritas**, dentro de uma transação `SERIALIZABLE`:
  - `associarAEscalao` nunca cria um principal (só `SIMULTANEA`/`OCASIONAL`);
  - `transferirEscalao` com destino `PRINCIPAL` **despromove para `SIMULTANEA`** qualquer outro principal que sobrasse ativo (garante o principal único), e **recusa** a transferência que deixasse o atleta sem principal;
  - `terminarParticipacao` **recusa** terminar a participação principal (é preciso transferir primeiro).
- **Transição a meio da época:** datas de início/fim das participações preservam o histórico; estatísticas anteriores ficam no escalão de origem.
- **Lesões:** registadas como **motivo de falta** (`LESAO`) na presença; sem módulo clínico (FUTURO).
- **Tempo de jogo por blocos:** o registo é por bloco (não minuto-a-minuto); acumula ao longo da época; `minutos` é derivável/aproximado.
- **Classificação de competição:** construída a partir de `ResultadoCompeticao` (resultados **inseridos manualmente** pelo treinador para todas as equipas) + jogos da própria equipa (`Jogo`). Se o treinador só inserir os jogos da própria equipa, a tabela fica incompleta — a completude depende do que ele registar. Sem integração automática na v1 (API oficial = FUTURO).
- **Scouting no jogo:** a observação do adversário liga-se ao `jogoId`; apagar o jogo faz `SetNull` (a observação sobrevive avulsa).
- **Comunicação:** a app **gera texto**, não envia; nenhuma dependência de API de WhatsApp; os pais não têm conta.
- **Relatório partilhável:** o link usa `token` não-adivinhável e um **snapshot** imutável dos dados; opcional `expiraEm`.
- **Google Calendar:** sincronização idempotente via `googleEventId`; desligar a integração não apaga eventos já criados.
- **Absorção:** ao aderir a um clube com licença Individual paga, gera-se crédito proporcional (`CREDITO_ABSORCAO`); reembolso real só manual. O clube paga preço normal.
- **Tier de clube (nº de escalões):** criar escalão além do limite do tier avisa/bloqueia conforme enforcement (enforcement deferido — ⚠️ na v1 apenas aviso suave; bloqueio efetivo com o billing).
- **Saída de treinador:** conteúdo `TREINADOR` viaja; `CLUBE` e snapshots ficam; adesão `INATIVO`; `RegistoCarreira` consolidado; nunca deixar clube sem admin.
- **Uma sessão por conta.** **Época ativa é por clube.**
- **RGPD:** hard-delete a pedido preserva agregados anonimizados.

---

## 10. Estatísticas e agregações

Tudo filtrado pela **época ativa** e pelo **clube**. Lógica em funções puras testáveis (`lib/estatisticas.ts`).

### 10.1 Agregado do atleta (`obterEstatisticasAtleta`) — por escalão e conjunto
```
Por escalão (participação) E vista conjunta (todas as participações na época):
jogosConvocado      = nº Convocatoria (convocado=true)
jogosUtilizados     = nº EstatisticaAtleta com utilizacao != NAO_UTILIZADO
titularidades       = nº utilizacao == TITULAR
totalGolos          = Σ golos
totalAssistencias   = Σ assistencias
tempoJogoAcumulado  = Σ blocoTempo convertido em minutos (JOGO_COMPLETO=40, MEIA_PARTE=20, 10, 5, 0)
totalMinutos        = Σ minutos (null se nenhum registado; complementa os blocos)
totalDefesas        = Σ defesas          (só GR; senão null)
totalGolosSofridos  = Σ golosSofridosGR  (só GR; senão null)
sessoesTotais       = nº sessões do escalão na época com data >= dataIngresso
presencas           = nº Presenca (escalão) com estado ∈ {PRESENTE, ATRASADO}
taxaPresenca        = presencas / sessoesTotais   (0 se sessoesTotais == 0)
```
Regras: ATRASADO conta; FALTA/FALTA_JUSTIFICADA/LESIONADO não contam. `totalMinutos = null` distingue "não registado" de "zero". A vista conjunta soma as participações do atleta.

**Métricas configuráveis (`obterAnaliticoAtleta` → `metricas`)** — os `ValorMetrica` registados por jogo (§8.14) são agregados por `MetricaConfig` e devolvidos em `metricas: Array<{ nome, tipo, total, media, jogos }>` (ordenadas por `MetricaConfig.ordem`):
```
jogos  = nº de EstatisticaAtleta (do contexto época/escalão) com valor registado para a métrica
total  = NUMERO/ESCALA → Σ valor ; BOOLEANO → nº de registos com valor ≠ 0
media  = total / jogos   (0 se jogos == 0)
```
Inclui métricas **desativadas** com valores históricos (nunca se apagam — §9). `[]` quando não há valores registados.

### 10.2 Agregado da equipa (escalão + época)
```
jogos, vitorias, empates, derrotas (de golosMarcados vs golosSofridos)
golos marcados/sofridos totais e médias · taxaPresençaMédia
melhores marcadores/assistentes (ranking por atletaId)
faltas acumuladas médias por parte · jogadores mais utilizados (tempo por blocos)
distribuição de tipos de treino (NORMAL/ABERTO/CAPTACAO/EVENTO)
rankings por métrica configurável (top 10 atletas por cada MetricaConfig)
```
**Rankings de métricas configuráveis (`obterAnaliticoEscalao` → `rankingsMetricas`)** — para cada `MetricaConfig` com valores na equipa, agrega por atleta (NUMERO → Σ; BOOLEANO → nº registos ≠ 0; ESCALA → média) e devolve `rankingsMetricas: Array<{ metrica, tipo, top: Array<{ atletaId, atletaNome, valor }> }>` — top 10 por valor decrescente, ordenado por `MetricaConfig.ordem`; omite métricas sem atletas com valor > 0. `[]` quando não há valores.

### 10.3 Agregado do clube (transversal — decisão 2026-08-05)
```
comparação entre escalões: assiduidade, resultados (V-E-D), golos, nº atletas
assiduidade global do clube · KPIs (nº sessões/jogos por escalão)
```
Visível a **Admin e DT** por defeito; para treinadores, **configurável pelo Admin** (capacidade/override `RELATORIOS_VER` de âmbito).

### 10.4 Registo ao vivo → agregação
Os `EventoJogo` agregam para `EstatisticaAtleta` (golos, assistências, defesas, faltas) e para as faltas por parte. Substituições com **bloco de tempo** alimentam o tempo de jogo. Manual e live convergem (last-write-wins).

### 10.5 Específicas de futsal
- Faltas acumuladas por parte (destaque à 5.ª).
- Tempo por atleta por **blocos** (rotações).
- Quintetos/rotações e power play derivados dos eventos de substituição.

### 10.6 Relatório de fim de época e partilha (sem IA)
- **Atleta/Equipa/Clube:** agregados (10.1–10.3), evoluções, rankings, caderneta.
- **Exportável em PDF** e **vista web com link partilhável** (`RelatorioPartilhado`, com identidade do clube). Snapshot imutável no momento de gerar.
- **Camada de servidor (F9):** `gerarRelatorioPartilhado(tipo, {epocaId?, escalaoId?, atletaId?, expiraEm?})` cria o `token` (não-adivinhável) e o **snapshot imutável** (analítico correspondente + identidade do clube); `obterRelatorioPorToken(token)` é **público (sem autenticação)** e respeita `expiraEm`; `listarRelatoriosPartilhados`/`revogarRelatorioPartilhado` gerem os links (capacidade `RELATORIOS_VER`).
- **PDF (v1):** obtido pela **vista web + impressão do browser** (`window.print()` + CSS de impressão), como em `/relatorios`. Sem dependência de renderização server-side (`@react-pdf/renderer`/`puppeteer`) — deferida para produção posterior se for exigido PDF sem browser.

### 10.7 Onde aparecem
Perfil do atleta, Dashboard, módulo de Analytics/Relatórios, vista de clube. Gráficos SVG próprios (`components/graficos/`) com a cor do clube (secção 12).

---

## 11. Formato do diagrama de campo e animação

### 11.1 Campo
Campo de futsal FIFA **40×20 m**, proporção 2:1. Coordenadas internas: 1 unidade = 10 cm → **400×200 unidades**. Linhas: meio-campo + círculo central (raio 30), áreas de baliza (quarto de círculo 6 m), marca de grande penalidade (6 m) e segunda penalidade (10 m), balizas 3 m. Render SVG nativo. Três componentes: `CampoFutsal` (read-only), `MiniaturaCampo` (listagens), `EditorCampo` (interativo).

### 11.2 `DiagramaCampo` v2 (com passos)
Guardado em `Json`. Estende o v1 com **passos** para animação, mantendo retrocompatibilidade.
```typescript
interface DiagramaCampo {
  versao: 2;
  elementos: ElementoCampo[];      // estado base (passo 0)
  passos?: PassoAnimacao[];        // opcional; se ausente, é estático
}
type ElementoCampo = Jogador | Bola | Cone | Baliza | Seta | Linha | Texto;
interface PassoAnimacao {
  id: string; ordem: number;
  posicoes: { elementoId: string; x: number; y: number }[];
  duracaoMs?: number;
}
```
Validação **Zod** (`diagramaSchema`) obrigatória. Diagrama vazio válido: `{ versao: 2, elementos: [] }` (constante `DIAGRAMA_VAZIO_V2`). A leitura aceita v1 (retrocompatível); **o editor grava sempre `versao: 2`**.

**Convenção base ⇄ passos (delta com herança):**
- `elementos` é o **frame inicial** (keyframe 0, base implícita).
- Cada `PassoAnimacao` é um **delta**: guarda apenas os elementos-ponto **que mudam** face ao keyframe anterior (posições absolutas dos elementos movidos). Elementos não movidos **não** entram no passo.
- Ao reconstruir a animação (`construirKeyframes`), cada keyframe **herda as posições do keyframe anterior** e sobrepõe o seu delta — nunca reparte da base. Resultado: `[base, base⊕passo0, (base⊕passo0)⊕passo1, …]`. Um passo com `posicoes: []` mantém integralmente as posições do momento anterior.
- Funções puras em `components/campo/animacao.ts` (`construirKeyframes`, `calcularDelta`, `ease`, `elementoEmPonto`, `ancoraElemento`, `posicoesBase`, `raioHitEfetivo`), testadas em `tests/campo.test.ts`.

**Autoria (modo animação do `EditorCampo`):** toggle "Animar (A→B)". O treinador seleciona o keyframe a editar — **Início** (base) ou um passo — na `TimelinePassos` e **arrasta os elementos**; "Adicionar passo" cria um novo keyframe (delta vazio, herda o anterior) que passa a activo. **Setas-fantasma** derivadas (não persistidas) mostram o movimento a partir do keyframe anterior. A `TimelinePassos` permite reordenar (↑/↓, reindexa `ordem`), eliminar e definir a `duracaoMs` de cada passo.

### 11.3 Animação (A→B) e qualidade (prioridade)
- **Playback:** interpolação (tween) entre keyframes com SVG + `requestAnimationFrame` e **easing** suave (`ease` ease-in-out). Controlos (`ControlosPlayback`): play/pause, reiniciar, **repetir (loop)** e **velocidade ×0.5/×1/×2**. Estado de playback mantido em `ref` (sem closures obsoletas).
- **`prefers-reduced-motion`:** quando activo, **não interpola** — avança keyframe-a-keyframe instantaneamente (~700ms entre passos).
- **Autoria:** o treinador define passos arrastando elementos (secção 11.2); a app guarda o `PassoAnimacao` (delta).
- **Convenções:** seta sólida = deslocamento, tracejada = passe, ondulada = condução; equipa própria azul, adversário vermelho. `Jogador` tem campo **`equipa` opcional** (`"propria" | "adversario" | "neutro"`).
- **Interação:** pointer events (rato + toque) com `setPointerCapture` (o drag não se perde ao sair do SVG em tablet). Alvo **≥32px garantido** por uma **hit area expandida** — cada elemento-ponto tem um círculo de toque invisível de raio `max(14, 16/escala)` unidades (`raioHitEfetivo`), maior em ecrãs pequenos. Sem zoom/pan.
- **Acessibilidade de teclado (DEVE):** `<svg role="application">` focável; cada elemento-ponto focável (`tabIndex`, `role="button"`, `aria-label`). Com elemento focado: setas movem 5 unidades (Shift = 1), Delete/Backspace apaga, Ctrl+Z anula, Esc cancela; cada movimento regista snapshot no histórico. Anel de foco (cor do clube) distinto do anel de selecção; região `aria-live` para anunciar acções.
- **DEVE (decisão 2026-08-05):** o editor é um **diferenciador central**; a sua revisão e validação de qualidade (UX, robustez, animação) são **prioritárias** (fase 12) antes de escalar a biblioteca curada.

### 11.4 Reutilização
O mesmo editor e formato servem **exercícios**, **modelos de jogo**, **bolas paradas** e **quadros táticos**. A miniatura é o mesmo SVG num viewBox menor.

---

## 12. Sistema de design

Prescritivo. Base Tailwind + shadcn/ui. **Marca do produto: FutsalCoach** (guia em `docs/BRAND.md`). Princípio: **a marca é fixa; a cor do clube é dinâmica**.

### 12.0 Design Direction (decisão 2026-08-05)
> A direção visual define o "carácter" do produto. É prescritiva — não reinterpretar.

**Base visual — tema escuro:** o **tema escuro é a base do produto** (é o *default*). Fundo principal **`#0F0E13`** (preto quente, não puro); superfícies em **`#1C1B22`** (cartões) e **`#2A2933`** (superfícies elevadas/hover). Laranja FutsalCoach **`#F0531E`** como acento primário. Tipografia **Bricolage Grotesque com presença** — números de estatísticas em tamanhos **grandes e bold** (o dado é protagonista). **Alternância claro/escuro (decisão 2026-08-06, F14):** existe um **alternador** (lua/sol na barra de topo) que permite ao utilizador escolher o tema claro; a preferência é persistida (`localStorage`, via `next-themes`, atributo `class`). O **escuro continua a ser o default** e o carácter do produto; o claro é uma cortesia de acessibilidade/preferência. *(Ajusta a nota anterior "sem alternância claro/escuro".)*

**Cor do clube como identidade:** no contexto de clube, a **sidebar** e os **acentos** adotam as **duas cores dominantes do clube** (`--cor-primaria` e `--cor-secundaria`); o **logótipo do clube** está presente. A interface "pertence" ao clube. Na versão **Individual sem clube (clube técnico)**, o **laranja FutsalCoach domina**.

**Motion como linguagem (não decoração) — DEVE:**
- **Transições de página:** fade + movimento vertical de **8px**; nunca instantâneo.
- **Listas:** itens entram em **cascata**, delay de **40ms** por item.
- **Gráficos:** animam ao entrar em viewport (**desenham-se**).
- **Números/estatísticas:** **contam** até ao valor final (ex: 0→127 em ~600ms).
- **Micro-interações:** presença marcada tem **animação de satisfação**; golo registado tem **momento de celebração breve**.
- **Loading:** **skeleton com shimmer**, nunca spinners genéricos.
- **Botões:** **5 estados desenhados** — default, hover, active, loading, disabled.

**Empty states — DEVE:** sempre **desenhados**, com **ilustração** e **convite a agir**; nunca uma tabela vazia.

**Editor de campo:** fundo de **pitch escuro** (campo à noite sob holofotes), coerente com o tema base.

**Acessibilidade em tema escuro (DEVE):** manter contraste **AA** (≥4.5:1) para texto sobre as superfícies escuras; respeitar `prefers-reduced-motion` (desligar/atenuar as animações de motion acima).

### 12.1 Tokens de cor
**Base escura (superfícies e texto):**
- **fundo** `#0F0E13` (página) · **superfície** `#1C1B22` (cartões) · **superfície-elevada** `#2A2933` (hover/modais) · **borda** derivada de `#2A2933`.
- **texto:** claro sobre escuro (branco quente/alto contraste no corpo; neutros quentes para secundário/legenda), sempre AA.

**Marca e acentos (FutsalCoach):**
- **laranja** 500 `#F0531E` (acento primário / default) · 600 `#C7430F` · 100 `#FBE4DA` · 50 `#FDF1EB`
- **ink** `#141210` · **neutros quentes (cinza):** 900 `#141210` · 700 `#2E2A25` · 600 `#57514A` · 500 `#6C665F` · 400 `#98938D` · 300 `#C7C1B8` · 200 `#E4E1DB` · 100 `#EEEBE6` · 50 `#F7F5F2` (mantidos como rampa da marca; no tema escuro servem sobretudo bordas/texto secundário).
- **verde** 600 `#1E9E5A` (sucesso) · **âmbar** 500/600 (aviso) · **vermelho** 600 `#D33A3A` (erro) — ajustar tom para contraste AA sobre fundo escuro.
- **azul** (legado / cor default demo): 900/700/500/300/100/50.
- **Tipografia:** display **Bricolage Grotesque** (títulos/wordmark/números de estatística); **Inter** (corpo) — via `next/font`.
- **Regra:** todos os tons usados no código existem em `tailwind.config.ts`.

> **⚠️ Migração visual:** a v5 anterior assumia tema claro (fundo papel `#EDEBE7`). A adoção do tema escuro como base implica retunar tokens de superfície/texto e rever o contraste dos componentes existentes — trabalho da fase 24 (secção 16).

### 12.2 Branding dinâmico do clube
- `Clube.corPrimaria` e `Clube.corSecundaria` alimentam a **sidebar** e todos os acentos (via `--cor-primaria`/`--cor-secundaria` e HSL em `--primary`/`--ring`). A interface **"pertence" ao clube** (secção 12.0). **Default** (clube técnico/individual) = laranja da marca a dominar.
- Logótipo do produto (barra de topo/login) — só FutsalCoach. Logótipo do clube **presente** (sidebar + marca de água centrada `.club-watermark`) + nome no cabeçalho de identidade.
- Contraste AA independentemente da cor escolhida, **sobre as superfícies escuras** (secção 12.1).

### 12.3 Tipografia (Inter)
`titulo-pagina` 24/700 · `titulo-seccao` 18/600 · `subtitulo` 15/600 · `corpo` 14 · `corpo-sec` 13 · `legenda` 12. Linha 1.5.

### 12.4 Componentes e layout
- shadcn/ui como base. Cantos `lg` 12px / `md` 8px / `sm` 6px. Sombra `card`.
- **Alvos de toque ≥44px.** **Tema escuro é a base do produto na v1** (*default*), com **alternador claro/escuro** opcional na barra de topo (secção 12.0, F14). Datas via `date-fns` locale `pt`.

### 12.5 Dados visuais (gráficos)
Gráficos SVG próprios (`GraficoBarrasH/V`, `GraficoLinhas`) com a cor do clube na série principal + neutros quentes; nunca depender só de cor (rótulos + tabela `sr-only`). Diagramas de campo como âncoras visuais.

---

## 13. Estados de UI, i18n, acessibilidade e requisitos não-funcionais

### 13.1 Estados de UI
- **Loading:** `loading.tsx` por rota com **skeleton + shimmer** (nunca spinners genéricos — secção 12.0); ações com estado "a processar" (5 estados de botão).
- **Vazio:** cada listagem com estado vazio **desenhado** (ilustração + convite a agir), nunca tabela vazia.
- **Erro:** validação inline (`camposInvalidos`); operação → toast; página → `error.tsx`; não encontrado → `not-found.tsx`.

### 13.2 PWA e offline (modo jornada)
- App instalável (manifest + service worker), Android/iOS.
- **Offline tolerante** onde importa (beira-campo): presenças, estatísticas/eventos ao vivo — guardar em **lote** e sincronizar quando a rede volta.

### 13.3 i18n e acessibilidade
- pt-PT hardcoded (sem i18n na v1). Contraste AA (sobre superfícies escuras — secção 12.1); foco visível; teclado; `label`/`aria-label`; não depender só de cor. **Respeitar `prefers-reduced-motion`** (atenuar/desligar o motion da secção 12.0).

### 13.4 Requisitos não-funcionais
- **Desempenho:** listagens < 1s; ações otimistas < 500ms; editor fluido em tablet. Índices do schema.
- **Segurança:** ver 5.6. Queries por clube + época + âmbito.
- **Integrações externas:** Google Calendar (OAuth Google, tokens encriptados) e, futuramente, Paddle (webhooks) — isoladas do login da app.
- **Custo operacional mínimo:** sem IA no núcleo; só alojamento + BD + Storage (secção 15).

---

## 14. Estratégia de testes

Nível: essencial mas obrigatório sobre **lógica de negócio e Server Actions**. **Vitest** (`npm run test`).

**Obrigatório testar:**
- **Schemas Zod** (válidos/inválidos) — todos os módulos (incl. novos: atleta/participação, template de sessão, comunicação, licença/carteira, classificação).
- **`DiagramaCampo`** v2 (incl. passos).
- **Agregações** (`lib/estatisticas.ts`): GR vs campo, `totalMinutos` null, **tempo por blocos**, taxa de presença com atleta a meio da época e **por escalão**, vista conjunta multi-escalão, agregação de eventos ao vivo, **analytics de clube**.
- **Server Actions:** sucesso, falha de validação, falha de auth, **falha de capacidade/âmbito**, **overrides e delegação** (conceder/revogar; não conceder acima das próprias), casos-limite da secção 9 (remover convocado com estatísticas, apagar exercício em uso, nunca ficar sem admin, transição de participação, absorção/crédito).
- **Autorização** (`exigirCapacidade` + `capacidadesEfetivas`): matriz perfil × capacidade × âmbito × overrides.
- **Regras de visibilidade das bibliotecas** (`lib/biblioteca.ts`, módulo puro): 🎒 pessoal só visível ao autor e **portátil** (acompanha-o para outro clube); 🏛️ do clube visível a **todos** os membros do clube proprietário e a mais nenhum; partilha delimitada **por clube** (o exercício pessoal partilhado aparece nas **duas abas** — 🎒 para o autor, 🏛️ para os colegas); templates **sem partilha pontual** (a contribuição transfere a propriedade). Testadas pela **semântica** e não pela forma: a cláusula Prisma gerada é interpretada contra linhas de exemplo (`tests/biblioteca-visibilidade.test.ts`), incluindo as linhas legadas da fase expand.
- **Classificação** (`obterClassificacao`): cálculo a partir de jogos + resultados.
- **Relatório partilhável:** token, snapshot, expiração.

**Método:** Prisma/auth/época/permissões mockados para actions; funções puras testadas diretamente. Manter e alargar os testes existentes (**412**). BD de teste isolada para integração.

---

## 15. Stack, setup e deployment

### 15.1 Stack
Next.js 15 (App Router) · React 19 · TypeScript strict · Prisma + PostgreSQL (Supabase) · Auth.js v5 · Zod · Tailwind + shadcn/ui · Vitest · PWA. **Supabase Storage** para logótipos/ficheiros. Integrações: **Google Calendar** (OAuth Google) e **Paddle** (billing, futuro). Sem IA no núcleo.

### 15.2 Estrutura de pastas
`app/` · `components/` (ui, campo, graficos, layout, por módulo) · `lib/actions/` · `lib/schemas/` · `lib/` (db, auth, contexto, estatísticas, permissões) · `prisma/` · `tests/` · `docs/`.

### 15.3 Convenções fixas
Server Actions (`"use server"`); Zod em `lib/schemas/`; padrão de action (validar → auth/membro → capacidade/âmbito → época → `Resultado<T>` → `revalidatePath`); queries por clube + época + âmbito.

### 15.4 Supabase / ligações
- **Pooler obrigatório:** Transaction pooler (6543, `?pgbouncer=true`) para a app; Session pooler (5432) para migrações (`DIRECT_URL`). Segredos em `.env`.

### 15.5 Comandos
`npm run dev` · `typecheck` · `lint` · `test` · `db:migrate` · `db:seed` · `db:studio`.

### 15.6 Deployment e custos (decisão 2026-08-05)
- **Arranque:** **Vercel Pro + Supabase Free** (com **keep-alive automático via GitHub Actions** para evitar suspensão da BD) ≈ **€19/mês**.
- **Escala por upgrades de plano**, sem migração de stack.
- **Billing provider:** **Paddle** (Merchant of Record) — implementação deferida (secção 17). PWA via HTTPS. Backups e retenção a definir na fase de produção.

---

## 16. Ordem de desenvolvimento (fases)

Cada fase fica **funcional, testada e documentada** antes da seguinte. "Definição de pronto": implementado conforme a bíblia · validação Zod + `Resultado<T>` · **permissões verificadas** · estados loading/vazio/erro · responsivo · `typecheck`+`lint`+`test` limpos · secção da bíblia atualizada.

### Fases 1–10 — Produto final v1 (base) ✅ CONCLUÍDAS
Ver changelog (secção 19) para o detalhe. Resumo:
- **1** Esqueleto (contas, clube, membros, perfis, propriedade, RGPD base). **2** Reconversão dos módulos para permissões/propriedade. **3** Periodização. **4** Modelo de jogo + quadro tático. **5** Jogos avançado (competições, live, scouting, vídeo). **6** Animação de diagramas. **7** Reuniões. **8** Relatórios/tracking + PDF. **9** Biblioteca curada de arranque. **10** PWA/offline + polish + caderneta gamificada.
> Nota: o **gating de UI de permissões** permanece parcial (segurança garantida no servidor) — a completar na fase 23.

### Fases 11+ — Evolução para o produto completo (brainstorming 2026-08-05)

**Fase 11 — Refactor do plantel (Atleta ao nível do clube + `AtletaEscalao`).**
Migrar `Atleta` para nível de clube; introduzir `AtletaEscalao` (tipo/estado/número por escalão/datas); mover `numero` para a participação; `Presenca.escalaoId` + `motivo` (lesões); estatísticas/presenças **por escalão** + vista conjunta. Actions de associar/transferir/terminar participação (`PROMOVER_ATLETAS`). Migração de dados do modelo antigo. *(Bloqueia analytics e relatórios multi-escalão.)*

**Fase 12 — Editor de exercícios: revisão e validação de qualidade (prioritária).**
Rever e validar o `EditorCampo` interativo com animações (UX, robustez, teclado, alvos de toque, playback). Diferenciador central — **antes** de escalar a biblioteca. Sem esta validação, não avança a fase 13.

**Fase 13 — Bibliotecas (pessoal + clube) + biblioteca de exemplo + templates de sessão.**
Distinção clara biblioteca pessoal (🎒) vs clube (🏛️) com toggle de partilha; `parteTreino`/`escalaoAlvo`; biblioteca curada organizada por parte do treino/objetivo/escalão; `ModeloSessao` + `ModeloSessaoExercicio` (templates); `criarSessaoDeTemplate`; seed de templates.

**Fase 14 — Modelo de jogo (documento vivo) + bolas paradas.**
`ModeloJogo` por clube/escalão/época + `subprincipios`; momento `BOLAS_PARADAS` integrado no editor e nos quadros táticos; UI de documento vivo.

**Fase 15 — Jogos: vista de dia de jogo + scouting no jogo + tempos por blocos.**
`ObservacaoAdversario.jogoId`; `Convocatoria.posicaoPrevista/titularPrevisto`; `EstatisticaAtleta.blocoTempo` + `EventoJogo.bloco`; `obterVistaDiaDeJogo`; ecrã de dia de jogo.

**Fase 16 — Competições e tabelas de classificação (inserção manual).**
`Competicao.formato`; `ResultadoCompeticao`; UI de **inserção manual** de resultados de todas as equipas; `obterClassificacao` (cálculo a partir dos resultados inseridos + jogos próprios). Sem integração automática (API oficial = FUTURO).

**Fase 17 — Comunicação (gerador WhatsApp) + calendário partilhável.**
`ModeloComunicacao` (seed por tipo); `gerarTextoComunicacao`/`gerarCalendarioTexto`; botão "Partilhar no WhatsApp" (deep link); templates de calendário mensal/época.
**Estado:** modelo, actions e UI (`/comunicacoes`, gerador, editor de templates, atalho no jogo) **implementados** (§8.12). Falta executar o seed global em produção (`npm run db:seed:comunicacao`).

**Fase 18 — Sincronização Google Calendar.**
`IntegracaoCalendario` (OAuth Google, token encriptado); `googleEventId` em Sessao/Jogo/Reuniao; `ligar/desligar/sincronizarCalendario`. ⚠️ validar OAuth Google (distinto do login da app).

**Fase 19 — Analytics em 3 níveis + relatório de época partilhável.**
`obterAnalyticsAtleta/Equipa/Clube`; nível de clube com visibilidade configurável; `RelatorioPartilhado` (link web público + snapshot + identidade do clube); PDF profissional.

**Fase 20 — Onboarding com vitória rápida.**
`criarAtletasEmMassa`; fluxo guiado (plantel em massa → sessão de template → primeira convocatória partilhada). Valor nos primeiros 10 minutos.

**Fase 21 — Licenciamento e multi-tenant.**
`Clube.clubeTecnico`; criação automática de clube técnico no registo; `Licenca`, `Carteira`, `MovimentoCarteira`; tiers por nº de escalões (aviso suave na v1); absorção (crédito proporcional). **Billing Paddle deferido** (arquitetura pronta; webhook/checkout numa fase de produção posterior).

**Fase 22 — Conformidade FPF.**
**Levantamento** dos requisitos exatos (Modelo 2 e documentos federativos) → exportação. Só arranca após levantamento.

**Fase 23 — Polish transversal.**
Gating de UI de permissões completo; offline de escrita robusto; ícones PNG PWA; acessibilidade de teclado no editor; afinações.

**Fase 24 — Design direction (tema escuro + motion) + Dashboard contextual + Lembretes.**
- **Design direction (secção 12.0):** migração para **tema escuro como base** (fundo `#0F0E13`, superfícies `#1C1B22`/`#2A2933`); retunar tokens e rever contraste dos componentes; **motion como linguagem** (transições de página, cascata de listas, gráficos que se desenham, números que contam, micro-celebrações, skeleton com shimmer, 5 estados de botão); **empty states desenhados**; editor de campo com pitch escuro; sidebar/acentos com as cores do clube; `prefers-reduced-motion`.
- **Dashboard contextual (8.16):** destaque temporal (treino de hoje / countdown de jogo iminente) + secção "atenção necessária".
- **Lembretes/to-dos (3.15, 8.19):** `Lembrete` + `LembreteDestinatario`; actions `lembretes.ts`; capacidade `LEMBRETES_EQUIPA_GERIR`; integração no dashboard.
> *Esta fase pode ser faseada/antecipada em parte: a direção visual (tema escuro + motion) atravessa toda a UI e pode ser aplicada incrementalmente à medida que cada módulo é tocado.*

*(FUTURO, fora destas fases: ver secção 18.)*

---

## 17. Modelo de negócio e licenciamento

### 17.1 Duas licenças
- **Individual (Treinador):** acesso completo ao produto de treinador. **Sem** UI/funcionalidade de gestão de clube. Sem trial, sem freemium — paga e usa. **€4,99/mês** ou **€49/ano**.
- **Clube:** produto de treinador completo + **camada de gestão de clube** (escalões, membros, perfis, branding, analytics de clube, relatórios). **Tiers por número de escalões:**

| Tier | Limite de escalões | Mensal | Anual |
|---|---|---|---|
| **Pequeno** | ≤ 2 | €15 | €149 |
| **Médio** | ≤ 4 | €19 | €190 |
| **Grande** | ≤ 8 | €34 | €340 |
| **Parceiro** | negociado | negociado | negociado |

O tier **Parceiro** inclui features custom, **voz no roadmap** e reuniões periódicas com a equipa.

### 17.2 Modelo de dados único (multi-tenant)
- O **`Clube` é sempre o tenant de topo**, mesmo na licença Individual (clube técnico invisível — secções 1.2.1 e 5.2).
- **Conta única por email pessoal.** Pode estar sem clube real (Individual) ou vinculada a um clube (membro com papel); muda ao longo do tempo.
- A licença técnica (enforcement, expiração, estado pós-expiração) fica modelada em `Licenca` (secção 3.11); o **enforcement efetivo** entra com o billing.

### 17.3 Propriedade do conteúdo NÃO está ligada à licença
A propriedade do conteúdo metodológico é **decidida pelo treinador na criação** (toggle pessoal vs clube), **não** por quem paga (secção 4.2, decisão definitiva 2026-08-05). O pagamento da licença de clube **não transfere** o trabalho criativo do treinador: a **biblioteca pessoal é sempre dele** e viaja com ele; a **biblioteca do clube** é a filosofia do clube e fica. Isto reforça o argumento de venda ao treinador — o que ele cria é dele para toda a carreira — e o percurso "individual → mostra ao clube → clube adere".

### 17.4 Subscrições e absorção
- **Absorção:** quando um treinador Individual é absorvido por um clube, o **crédito proporcional** do tempo restante vai para a **carteira** (`Carteira`) na conta do treinador, usável em compras futuras (`CREDITO_ABSORCAO`).
- **Reembolso real:** só por **pedido manual via email** (exceção, não regra).
- **Clube paga preço normal** da licença de clube (sem desconto pela absorção).
- **Sair do clube:** o treinador **reativa a licença Individual por conta própria**.

### 17.5 Billing
- **Provider:** **Paddle** (Merchant of Record) — trata IVA/faturação. **Implementação deferida** para fase posterior; a entidade `Licenca`/`Carteira` está desenhada para suportar a integração (webhooks, `paddleSubscriptionId`, `paddleCustomerId`).

### 17.6 Go-to-market
- **Sem trial.** Compra directa.
- **Vídeo demonstrativo público** das capacidades.
- **Reunião de demonstração a pedido** para clubes.
- **Parceiros fundadores:** primeiros clubes com acordo de **patrocínio mútuo**, visibilidade cruzada e referência comercial.
- **Suporte:** via **WhatsApp** para utilizadores individuais.

---

## 18. Roadmap futuro (fora da v1)

- **Quotas/mensalidades do clube** (o clube a cobrar aos pais).
- **App móvel nativa** (iOS/Android) — o browser responsivo/PWA é suficiente na v1.
- **App/portal de pais e atletas.**
- **IA generativa** de exercícios/sessões/relatórios (plugin pago).
- **Análise de vídeo.**
- **GPS/wearables, wellness, RPE.**
- **Gestão clínica/lesões avançada** (a v1 regista lesões só como motivo de falta).
- **Multi-idioma / multi-moeda** (decidir quando o mercado PT estiver validado).
- **Integração automática com APIs de competições oficiais** (classificações/calendários) — na v1 a classificação é por **inserção manual** (secção 8.11).
- **Portal de futsal** (projeto separado, potencial parceria futura).
- **Biblioteca partilhada/comunidade** de exercícios (em avaliação — "o treino é o segredo").
- **App via APK** (embrulho TWA/Capacitor da PWA), se necessário.

---

## 19. Changelog da documentação

Do mais recente para o mais antigo.

- **2026-08-11** — **Agregação de métricas configuráveis nos analíticos (§10.1, §10.2).** Os `ValorMetrica` registados por jogo (§8.14) eram *write-only*: gravavam-se mas nunca eram lidos em `lib/actions/analise.ts`. Passam a ser agregados e devolvidos:
  - **Nível 1 — `obterAnaliticoAtleta` → `metricas: MetricaAgregadaAtleta[]`:** agregação por `MetricaConfig` no contexto época/escalão — `total` (NUMERO/ESCALA = Σ valor; BOOLEANO = nº registos ≠ 0), `media` (total/jogos) e `jogos` (nº de jogos com valor). Ordenado por `MetricaConfig.ordem`; inclui métricas desativadas com histórico (nunca se apagam — §9); `[]` quando não há valores.
  - **Nível 2 — `obterAnaliticoEscalao` → `rankingsMetricas: RankingMetrica[]`:** por métrica, agrega por atleta (NUMERO = Σ; BOOLEANO = nº registos ≠ 0; ESCALA = média) e produz o **top 10** (`{ atletaId, atletaNome, valor }`) por valor decrescente; omite métricas sem atletas com valor > 0.
  - **Compatibilidade:** campos **aditivos**; os painéis presentacionais (`PainelAtleta`/`PainelEscalao`) acedem por `dados.X` e não quebram (a UI de visualização das novas coleções fica para o `frontend-specialist`). O snapshot imutável do relatório partilhável (§10.6) passa a incluir estes campos automaticamente.
  - **Verificação:** `npm run typecheck` **0 erros**; `npm run test` **600/600** (3 novos testes em `tests/analise-f9.test.ts` a cobrir a agregação por atleta e os rankings de equipa).

- **2026-08-06** — **F10 (Fase 20) — Frontend do onboarding com vitória rápida (§8.1, §16 fase 20).** Camada de apresentação (Server Components para leitura + Client Components para escrita via Server Actions existentes) do fluxo guiado pós-primeiro-login e do percurso de valor rápido. Sem alterações a `prisma/schema.prisma`, schemas ou actions; **não toca em auth** (`middleware.ts`/`lib/auth.ts` intactos — as rotas novas já ficam protegidas pelo matcher existente).
  - **Wizard de setup do clube — `app/(app)/onboarding/page.tsx` (novo) + `components/onboarding/WizardOnboarding.tsx` (novo):** fluxo de 3 passos, cada um **saltável** — (1) **Identidade** (nome, cor primária e logótipo por URL → `atualizarBrandingClube`), (2) **Escalões** (criar/remover inline, ≥1 recomendado → `criarEscalao`/`apagarEscalao`), (3) **Época** (confirmar a ativa, tornar ativa outra ou criar a primeira → `criarEpoca` + `definirEpocaAtiva`). Indicador de progresso e botões "Saltar"/"Continuar"; "Começar a usar" encaminha para `/dashboard`. A conclusão é marcada como **flag local por browser** (`localStorage: fc:onboarding:concluido`) — o campo `Clube.onboardingConcluido` fica deferido para a fase de base de dados (a rota mantém-se acessível por URL). O passo Individual (clube técnico) reutiliza diretamente a vitória rápida.
  - **Vitória rápida — `app/(app)/vitoria-rapida/page.tsx` (novo) + `components/onboarding/VitoriaRapida.tsx` (novo):** checklist de 3 passos com estado persistido em `localStorage` (`fc:vitoria-rapida:passos`) e barra de progresso — (1) **Plantel em massa** (tabela editável nome/número/escalão, "+ Linha", cria em sequência via `criarAtleta` com progresso "X de Y criados"), (2) **Treino de template** (escolhe template/escalão/data → `criarSessaoDeTemplate`; sem templates, botão `instalarTemplatesArranque`), (3) **Convocatória** (escolhe jogo próximo ou cria jogo rápido via `criarJogo`; botão "Gerar convocatória" liga a `/comunicacoes/gerar?tipo=CONVOCATORIA&jogo=[id]`).
  - **Integração — `app/(app)/dashboard/page.tsx`:** banner **"Começa em 10 minutos"** (`BannerVitoriaRapida`) quando o plantel está vazio (`nAtletas === 0`), com ligação a `/vitoria-rapida`. **Navegação — `components/layout/Navegacao.tsx` + `app/(app)/layout.tsx`:** atalho **"Começar"** (ícone `Rocket`) na sidebar/bottom-nav, condicional ao plantel vazio (prop `mostrarComecar`, calculada no layout por contagem de participações `ATIVO` na época ativa).
  - **Verificação:** `npm run typecheck` **0 erros**; `npm run lint` **0 erros/0 avisos**; `npm run test` **todos passam** (sem novos testes — camada de UI sobre actions já testadas).

- **2026-08-06** — **F14 (Fase 24) — Tema escuro + motion subtil + dashboard melhorado + lembretes in-app (§12.0/§12.1, §12.4, §8.16, §13.1/§13.3).** Direção visual escura como base do produto, com camada de motion por CSS, dashboard contextual mais rico e lembretes leves de "hoje". Sem alterações a `prisma/schema.prisma`, actions ou base de dados; **não toca em auth** (`middleware.ts`/`lib/auth.ts` intactos).
  - **Tema escuro (base) + alternância — `next-themes`:** novo **`components/theme-provider.tsx`** (`attribute="class"`, `defaultTheme="dark"`, `enableSystem={false}`, `storageKey="futsalcoach-tema"`) envolve a app em `app/layout.tsx` (com `suppressHydrationWarning` no `<html>`). Novo **`components/layout/AlternadorTema.tsx`** (botão lua/sol na `BarraTopo`, com guarda de hidratação). **Decisão 2026-08-06:** o escuro é o *default* e o carácter do produto, mas passa a existir um alternador claro/escuro persistido — ajusta a nota anterior "sem alternância claro/escuro" (§12.0/§12.4).
  - **Tokens e migração visual — `app/globals.css`:** bloco **`.dark`** com os tokens shadcn/ui em escuro (fundo `#0F0E13`, superfície `#1C1B22`, elevada `#2A2933`, texto claro quente, contraste AA). Para cobrir toda a UI sem editar cada ficheiro, **remapeamento das utilidades hardcoded** sob `.dark` (`text-cinza-*`, `bg-white`, `bg-cinza-50/100/200`, `border-cinza-*`, `divide-cinza-*`, `hover:bg-cinza-*`, `placeholder:text-cinza-400`) e *overrides* das classes de componente definidas via `@apply` (`body`, `h1–h3`, `.card-base`/`.card-hover`, `.app-surface`, `.topbar-glass`, `.nav-item`/`.nav-item-active`, `.chip-clube`). A cor do clube (`--cor-primaria`) mantém-se independente do tema.
  - **Motion como linguagem (só CSS) — `app/globals.css`:** keyframes `fc-fade-in` (fade + 8px) e `fc-shimmer`; utilidades `.animar-entrada` (transição de página/bloco, aplicada ao conteúdo em `app/(app)/layout.tsx`), `.animar-cascata > *` (entrada em cascata, delay 40ms/item até 8) e `.skeleton-shimmer` (shimmer nos skeletons). Skeletons migrados para shimmer em `components/ui/skeleton.tsx`, `components/layout/EstadosUI.tsx` e `app/(app)/loading.tsx`. **`prefers-reduced-motion: reduce`** desliga/atenua todas as animações e transições (§13.3).
  - **Toaster consciente do tema — `components/ui/sonner.tsx`:** passa `theme={resolvedTheme}` (via `useTheme`); as classes de toast adaptam-se pelo remapeamento `.dark`.
  - **Dashboard melhorado — `app/(app)/dashboard/page.tsx`:** herói do jogo enriquecido (data/hora, escalão, casa/fora e **local/campo**); nova secção **"Atletas por escalão"** (contagem de participações `ATIVO` por escalão, via `_count`, com ligação ao plantel); **empty state motivacional** desenhado quando a época não tem qualquer dado (`EstadoVazioEpoca`, com CTAs); quarta ação rápida **"Ver plantel"**; grelhas com entrada em cascata.
  - **Lembretes in-app (leves) — `lib/dashboard-lembretes.ts` (novo, módulo PURO):** `mesmoDia`, `horaCurta`, `construirLembretesHoje(sessoes, jogos, agora)` e `temEventoHoje(...)` derivam avisos de "treino/jogo hoje" a partir dos dados existentes (sem entidade `Lembrete`, sem push/service worker — essa é a fase própria §3.15/§8.19). O dashboard mostra um **banner de "eventos hoje"** (`LembretesBanner`, distingue eventos já decorridos) e o `app/(app)/layout.tsx` calcula `eventoHoje` (contagem de sessões/jogos do dia) para o **indicador (ponto pulsante)** no cabeçalho (`BarraTopo`, novo `<Bell>` com badge, ligado ao dashboard).
  - **Verificação:** `npm run typecheck` **0 erros**; `npm run lint` **0 erros/0 avisos**; `npm run test` **584/584 passam** (20 ficheiros; novo `tests/dashboard-lembretes.test.ts`, 11 testes). Dependência adicionada: `next-themes`.
- **2026-08-06** — **F13 — Polish transversal de experiência (§13.1, §12.0, §16 fase 23 — subconjunto).** Refinamento da UI existente, sem funcionalidade nova. Sem alterações a schemas, actions ou base de dados.
  - **Meta titles em todas as páginas:** `app/layout.tsx` passa a usar `title` com *template* `{ default: "FutsalCoach", template: "FutsalCoach – %s" }`; as **43 páginas** de `app/(app)/**` ganham `export const metadata: Metadata = { title: "…" }` (ex.: `FutsalCoach – Plantel`, `FutsalCoach – Detalhe do jogo`, `FutsalCoach – Definições · Épocas`). Títulos em pt-PT alinhados com a navegação.
  - **`components/layout/Breadcrumbs.tsx` (novo):** migalhas de navegação acessíveis (`<nav aria-label>` + `<ol>`; último item `aria-current="page"`) — recebe `items: { label; href? }[]`. Aplicado às páginas de detalhe substituindo o link de «voltar»: `/plantel/[id]` (Plantel → nome do atleta), `/treinos/[id]` (Treinos → escalão), `/jogos/[id]` (Jogos → vs adversário), `/escaloes/[id]/analiticos` (Analíticos → escalão).
  - **`components/layout/ScrollTopo.tsx` (novo, Client Component):** faz *scroll to top* do contentor de conteúdo (`main.app-surface`, que é o contentor de scroll — não a janela) a cada mudança de rota (`usePathname`), com salto instantâneo. Integrado no `app/(app)/layout.tsx`.
  - **`loading.tsx` por rota pesada (novos):** `plantel/`, `treinos/`, `jogos/`, `analiticos/` — *skeletons* dedicados ao layout real de cada página (título, filtros/tabs, lista/grelha/gráficos), reutilizando `Skeleton` (shadcn) e `SkeletonLista`/`SkeletonCartao` de `EstadosUI`. Complementam o `loading.tsx` genérico já existente na raiz de `(app)`.
  - **Auditoria (sem alterações necessárias):** confirmações de ação destrutiva das entidades principais (atleta, treino, jogo, exercício, convocado, escalão, competição, modelo de jogo, template) já usam `AlertDialog`; Server Actions de escrita já dão *feedback* por `toast` (sonner); listas principais já têm `EstadoVazio` desenhado. Sem uso de `window.confirm`.
  - **Verificação:** `npm run typecheck` **0 erros**; `npm run lint` **0 erros/0 avisos**; `npm run test` **573/573 passam** (19 ficheiros).
- **2026-08-06** — **F9 (Fase 19) — Frontend de analytics em 3 níveis + relatório de época partilhável (§8.15, §10.1–10.7).** Interface (Server Components para leitura; Client Components para geração/cópia/revogação e impressão) sobre a camada de servidor F9 já documentada. Sem alterações a schemas, actions ou base de dados.
  - **Painéis de apresentação partilhados `components/analiticos/` (novos, Server Components):** **`Cartao.tsx`** (tile de estatística + helpers `pct`/`n1`); **`PainelAtleta.tsx`** (Nível 1 — tiles, tempo de jogo acumulado, comparação com a média da equipa, caderneta, `GraficoLinhas` de golos/assist. ou defesas por jogo e `GraficoBarrasV` de presença mensal); **`PainelEscalao.tsx`** (Nível 2 — V/E/D, golos e médias, tipos de treino, `GraficoBarrasH` de marcadores/assistentes/mais utilizados, assiduidade mensal e resultados jogo-a-jogo com *badge* V/E/D); **`PainelClube.tsx`** (Nível 3 — KPIs globais + tabela comparativa de escalões, com ligação opcional ao analítico de cada escalão); **`PainelRelatorio.tsx`** (discrimina o snapshot por `tipo` e desenha o painel correspondente). Reutilizam os gráficos SVG de `components/graficos/` (cor do clube via `--cor-primaria`).
  - **Relatórios partilháveis `components/relatorios/` (novos, Client Components):** **`GerarRelatorioBotao.tsx`** (chama `gerarRelatorioPartilhado`, mostra o link público `/r/{token}` com cópia e **revogação** imediatas); **`GerirRelatorios.tsx`** (lista os relatórios do clube — tipo, criação, expiração — com cópia de link e revogação). Cópia resiliente via novo utilitário **`lib/clipboard.ts`** (`copiarTexto`).
  - **`app/(app)/plantel/[id]/page.tsx` (alterado):** nova aba **«Analíticos»** — `obterAnaliticoAtleta(id, escalaoDeContexto?)` + `PainelAtleta` + botão de gerar relatório (`EPOCA_ATLETA`, só com `RELATORIOS_VER`); estado vazio dedicado quando falta a permissão.
  - **`app/(app)/escaloes/[id]/analiticos/page.tsx` (novo):** analítico da equipa — `obterAnaliticoEscalao(id)` + `PainelEscalao` + gerar relatório `EPOCA_EQUIPA`.
  - **`app/(app)/analiticos/page.tsx` (novo):** analítico do clube (Admin/DT por defeito — estado vazio explicativo quando `Sem permissão`) — `obterAnaliticoClubeEpoca()` + `PainelClube` (com ligações por escalão) + gerar relatório `EPOCA_CLUBE` + secção de **gestão de relatórios partilhados** (`listarRelatoriosPartilhados`). Novo item **«Analíticos»** na `components/layout/Navegacao.tsx`.
  - **`app/r/[token]/page.tsx` (novo — vista PÚBLICA, fora do grupo `(app)`):** `obterRelatorioPorToken(token)` (público, respeita `expiraEm`); cabeçalho com **identidade do clube** (logótipo/inicial + cor via `--cor-primaria`/`--primary`), `PainelRelatorio` e **`BotaoImprimir`** (`window.print()`); página de erro simples quando o token expirou/não existe; `robots: noindex`. CSS de impressão via `print:hidden` nas ações.
  - **⚠️ Bloqueio conhecido (auth — não resolvido nesta entrega):** a rota pública `/r/[token]` **é atualmente interceptada pelo middleware** (`middleware.ts` matcher + callback `authorized` em `lib/auth.ts`), que redireciona qualquer rota não isenta para `/login`. Tornar `/r/**` verdadeiramente pública exige uma alteração ao **matcher do middleware** (adicionar `r/` à *negative lookahead*, à semelhança de `login|registar|...`) **ou** ao callback `authorized` (permitir `pathname.startsWith("/r/")`). Essa alteração **toca em autenticação** e **não foi aplicada**, aguardando autorização explícita (Regra de auth). Até lá, a página existe e compila, mas só é acessível autenticado.
  - **Verificação:** `npm run typecheck` **0 erros**; `npm run lint` **0 erros/0 avisos**; `npm run test` **573/573 passam** (19 ficheiros).
- **2026-08-06** — **F9 (Fase 19) — Camada de servidor de analytics em 3 níveis + relatório de época partilhável (§3.10, §8.15, §10.1–10.6, §16 fase 19).** Server Actions, schemas Zod, funções puras e modelo de base de dados que suportam o **pilar de analytics** do produto. O **frontend** (páginas de analytics, gráficos e vista pública) fica a cargo do `frontend-specialist`.
  - **`prisma/schema.prisma` + migração `20260806100000_f9_relatorio_partilhado`:** novo modelo **`RelatorioPartilhado`** (§3.10) — `id`, `clubeId`, `token @unique` (segmento de URL não-adivinhável), `tipo TipoRelatorio`, `epocaId`, `escalaoId?`, `atletaId?`, `dadosSnapshot Json?` (snapshot **imutável** dos dados no momento de gerar), `expiraEm?`, `criadorId`, `criadoEm`, `@@index([clubeId])`. Novo enum **`TipoRelatorio`** (`EPOCA_ATLETA | EPOCA_EQUIPA | EPOCA_CLUBE`). Campos scalar-only (sem FK) conforme o modelo da bíblia — o snapshot é auto-suficiente.
  - **`lib/estatisticas.ts` (funções puras):** nova tabela **`MINUTOS_POR_BLOCO`** e helper **`blocoParaMinutos(bloco)`** (§10.1 — `JOGO_COMPLETO`=40, `MEIA_PARTE`=20, `BLOCO_10MIN`=10, `BLOCO_5MIN`=5, `NAO_JOGOU`/null=0). `EstatisticasAgregadas` ganha **`tempoJogoAcumulado`** (Σ blocos em minutos, sempre numérico — distinto de `totalMinutos`, que continua a distinguir «não registado» de zero); `LinhaEstatistica` ganha `blocoTempo?`. `agregarEstatisticas` passa a calcular o tempo acumulado.
  - **`lib/schemas/analise.ts` (novo):** schemas de parâmetros — `analiticoAtletaSchema`, `analiticoEscalaoSchema`, `analiticoClubeSchema` e **`gerarRelatorioSchema`** (com `superRefine`: `EPOCA_ATLETA`⇒`atletaId`, `EPOCA_EQUIPA`⇒`escalaoId`, `expiraEm` no futuro). Rótulos `LABEL_TIPO_RELATORIO`.
  - **`lib/actions/analise.ts`:** expandido de 2 para o conjunto completo de leituras F9. Mantém `obterEvolucaoAtleta`/`obterPresencasMensal` (perfil, sem exigir `RELATORIOS_VER`). Novos, **todos com capacidade `RELATORIOS_VER`** e âmbito por escalão:
    - **Nível 1 — `obterAnaliticoAtleta(atletaId, escalaoId?, epocaId?)`:** por escalão **ou vista conjunta**; agregado (10.1) incl. `tempoJogoAcumulado`, presenças mensais, evolução por jogo, progresso da caderneta (total/desbloqueadas/em progresso) e **comparação com a média da equipa** (só na vista de um escalão).
    - **Nível 2 — `obterAnaliticoEscalao(escalaoId, epocaId?)`:** V/E/D, golos marcados/sofridos (totais e médias), sessões, nº atletas, taxa de presença média, rankings de marcadores/assistentes (por `atletaId`), jogadores mais utilizados (tempo por blocos), eventos por tipo, assiduidade mensal da equipa, distribuição de tipos de treino e evolução de resultados.
    - **Nível 3 — `obterAnaliticoClubeEpoca(epocaId?)`:** comparação entre escalões (assiduidade, V-E-D, golos, nº atletas, sessões) + totais do clube. Respeita `escaloesLegiveis()` — Admin/DT (âmbito `TODO_CLUBE`) veem todos; treinadores veem os seus + visíveis (§10.3).
    - **Relatório partilhável (§3.10/10.6):** `gerarRelatorioPartilhado(dados)` (gera `token` via `crypto.randomBytes`, constrói o **snapshot imutável** chamando o analítico correspondente + identidade do clube, guarda em `RelatorioPartilhado`); **`obterRelatorioPorToken(token)` — leitura PÚBLICA sem autenticação** (só token; respeita `expiraEm`); `listarRelatoriosPartilhados()` e `revogarRelatorioPartilhado(id)` (ambos `RELATORIOS_VER`, âmbito do clube).
  - **Estratégia de PDF (§8.15/10.6):** na v1 o «exportável em PDF» é obtido pela **vista web partilhável + impressão do browser** (`window.print()` com CSS de impressão), mesma abordagem já usada em `/relatorios` (`components/relatorios/BotaoImprimir`). **Não** foi adicionada dependência de renderização server-side (`@react-pdf/renderer`/`puppeteer`) — deferida para uma fase de produção posterior se for exigido PDF sem browser. A camada de servidor fornece o snapshot; a vista de impressão é do `frontend-specialist`.
  - **`tests/analise-f9.test.ts` (novo, 19 testes):** conversão de blocos e `tempoJogoAcumulado` (puros); permissões (`RELATORIOS_VER`), vista conjunta do atleta, agregação de escalão (V/E/D, rankings, blocos, eventos, distribuição de treino, taxa de presença), comparação do clube e totais, e o ciclo completo do relatório partilhável (gerar → ler por token → expirar → listar/revogar).
  - **Verificação:** `npm run typecheck` **0 erros**; `npm run lint` **0 erros/0 avisos**; `npm run test` **573/573 passam** (19 ficheiros). `prisma generate` executado.
- **2026-08-06** — **F6 (Fase 16) — Frontend de competições e classificação (§8.11, §16 fase 16).** Interface (Server Components para leitura + Client Components para escrita via Server Actions) sobre a camada F6 já documentada. Sem alterações a schemas, actions ou base de dados.
  - **`components/competicoes/CompeticaoForm.tsx` (novo):** diálogo reutilizável de **criar/editar** competição — `nome`, `formato` (Select `LABEL_FORMATO_COMPETICAO`), `tipo` (Select `LABEL_TIPO_JOGO`), `escalaoId` (Select), `epocaId` (Select, *default* época ativa e **desativado em edição** porque `atualizarCompeticao` não altera a época). Chama `criarCompeticao`/`atualizarCompeticao`, `toast` + `router.refresh()`.
  - **`components/competicoes/ResultadoExternoForm.tsx` (novo):** diálogo de **adicionar resultado externo** (`equipaCasa`, `equipaFora`, `golosCasa`/`golosFora` 0–99, `data` opcional) via `registarResultadoExterno`.
  - **`components/competicoes/TabelaClassificacao.tsx` (novo):** tabela apresentacional (Pos, Equipa, J, V, E, D, GM, GS, DG e **Pts só em LIGA**); equipa própria destacada; estado vazio próprio.
  - **`components/competicoes/CompeticaoDetalhe.tsx` (novo, cliente):** cabeçalho com *badges* + ações **Editar** (reusa `CompeticaoForm`) / **Apagar** (`apagarCompeticao` → volta à lista); abas **Classificação**, **Resultados externos** (adicionar/remover) e **Jogos próprios** (ligação a `/jogos/[id]`). Datas via `formatarDataCurta`.
  - **`app/(app)/jogos/competicoes/[id]/page.tsx` (novo, Server Component):** `obterCompeticao` + `obterClassificacao` + `listarEscaloes` + `listarEpocas` (em paralelo); `notFound()` se a competição não existir.
  - **`components/jogos/CompeticoesLista.tsx` (alterado):** passa a mostrar **formato**, **época** e a **ligar ao detalhe**; **filtro por escalão** (cliente); a criação usa o novo `CompeticaoForm`. Recebe `epocas` além de `competicoes`/`escaloes`.
  - **`app/(app)/jogos/competicoes/page.tsx` (alterado):** passa `listarEpocas()` à lista.
  - **`components/jogos/JogoForm.tsx` (alterado):** novo Select **«Competição»** (opcional, filtrado pelas competições do escalão selecionado; mudar de escalão limpa a seleção incompatível) que preenche `competicaoId`; mantém o campo legado **«Competição (texto livre)»** (`competicao`). `JogoParaEdicao` passa a incluir `competicaoId`.
  - **`app/(app)/jogos/novo/page.tsx`** e **`app/(app)/jogos/[id]/editar/page.tsx` (alterados):** carregam `listarCompeticoes()` e passam `competicoes` ao `JogoForm`.
  - **Verificação:** `npm run typecheck` **0 erros**; `npm run lint` **0 erros/0 avisos**; `npm run test` **529/529 passam** (17 ficheiros).
- **2026-08-06** — **F6 (Fase 16) — Camada de servidor de competições e classificação (§3.7, §8.11, §16 fase 16).** Server Actions e schemas Zod que operam sobre a base de dados F6 (entrada anterior). Sem alterações ao `prisma/schema.prisma` nesta entrada.
  - **`lib/schemas/competicao.ts`:** novos schemas **`criarCompeticaoSchema`** (`nome`, `tipo TipoJogo` default OFICIAL, `formato FormatoCompeticao` default LIGA, `escalaoId` cuid, `epocaId` cuid opcional = época ativa), **`atualizarCompeticaoSchema`** (= criar `.partial()` + `id`) e **`registarResultadoExternoSchema`** (`competicaoId`, `equipaCasa`, `equipaFora`, `golosCasa`/`golosFora` 0–99, `data` opcional). Novo mapa de rótulos **`LABEL_FORMATO_COMPETICAO`** (LIGA→«Liga», TORNEIO→«Torneio», TACA→«Taça»). `competicaoSchema`/`CompeticaoInput` mantidos como aliases retrocompatíveis (apontam para o schema de criação). `observacaoAdversarioSchema` inalterado.
  - **`lib/classificacao.ts` (novo, módulo PURO):** **`calcularClassificacao({ nomeEquipaPropria, formato, jogosProprios, resultados })`** → `LinhaClassificacao[]`. Combina jogos próprios (própria equipa + espelho do adversário) com resultados externos (casa + fora), agrupando por nome de equipa (após `trim`, ignora nomes vazios). Pontuação: **LIGA** 3/1/0; **TORNEIO/TACA** sem pontos. Ordenação: pontos desc → diferença de golos desc → golos marcados desc → nome asc. Sem dependências de Prisma/servidor (testável e reutilizável no cliente).
  - **`lib/actions/competicoes.ts`:** conjunto completo de Server Actions — `listarCompeticoes(escalaoId?)`, `obterCompeticao(id)` (detalhe com jogos + resultados), `criarCompeticao`, `atualizarCompeticao(id, dados)`, `apagarCompeticao` (desliga jogos, cascata apaga resultados), `registarResultadoExterno`, `apagarResultadoExterno`, e **`obterClassificacao(competicaoId)`** (calcula via `calcularClassificacao`, usando `escalao.nome` como equipa própria e apenas jogos com resultado final). Todas: `auth()`/clube + época ativa, validação Zod, permissão `COMPETICOES_GERIR` por escalão (leitura via `podeLerEscalao`/`escaloesLegiveis`), `revalidatePath`. Tipos `CompeticaoResumo`/`CompeticaoDetalhe` (e alias retrocompatível `CompeticaoComRelacoes` para a UI existente).
  - **`lib/actions/jogos.ts`:** `criarJogo`/`atualizarJogo` passam a validar que o `competicaoId` (quando indicado) pertence ao clube **e** ao escalão do jogo (impede ligar um jogo a competição alheia). A persistência de `competicaoId` já existia.
  - **`tests/classificacao.test.ts` (novo):** 6 testes de `calcularClassificacao` (pontuação LIGA, combinação jogos+resultados, ordenação por diferença de golos, TORNEIO sem pontos, `trim`/nomes vazios, tabela vazia).
  - **Verificação:** `npm run typecheck` **0 erros**; `npm run lint` **0 erros/0 avisos**; `npm run test` **529/529 passam** (17 ficheiros).

- **2026-08-06** — **F6 (Fase 16) — Base de dados de competições e classificação por inserção manual (§3.7, §16 fase 16).** Camada de dados/migração Prisma que suporta as tabelas de classificação construídas a partir de resultados inseridos manualmente. Sem alterações a actions ou frontend nesta entrada.
  - **`prisma/schema.prisma`:** `Competicao` ganha `formato FormatoCompeticao @default(LIGA)` (LIGA | TORNEIO | TACA) e a relação `resultados ResultadoCompeticao[]`. Novo enum **`FormatoCompeticao { LIGA TORNEIO TACA }`**. Novo modelo **`ResultadoCompeticao`** (`id`, `competicaoId` → `Competicao` `onDelete: Cascade`, `data DateTime?`, `equipaCasa`, `equipaFora`, `golosCasa Int`, `golosFora Int`, `criadoEm`, `@@index([competicaoId])`) — resultados de **todas as equipas**, inseridos manualmente pelo treinador, para o cálculo da classificação. A ligação `Jogo.competicaoId`/`competicaoRef` já existia (fases anteriores) e mantém-se: os jogos da própria equipa também podem alimentar a classificação.
  - **Nota de conformidade:** a tabela de classificação é **calculada** (`obterClassificacao`), **não** armazenada — por isso **não** há modelo `ClassificacaoManual`. O tipo/formato da prova usa `tipo TipoJogo` (OFICIAL | AMIGAVEL) + `formato FormatoCompeticao` (LIGA | TORNEIO | TACA), conforme a bíblia; **não** foi adicionado `Jogo.jornada` (não previsto no modelo-alvo §3.7). Sem integração automática na v1 (APIs oficiais = FUTURO, §18).
  - **`prisma/migrations/20260806093000_f6_competicoes/migration.sql`:** `CREATE TYPE "FormatoCompeticao"`; `ALTER TABLE "Competicao" ADD COLUMN "formato" ... DEFAULT 'LIGA'`; `CREATE TABLE "ResultadoCompeticao"` + índice + FK `ON DELETE CASCADE`. Todos os campos com default/nullable — compatível com dados existentes.
  - **Verificação:** `npx prisma validate` **schema válido**; `npx prisma generate` **cliente gerado (v5.22.0)**.

- **2026-08-06** — **F5 (Fase 15) — Frontend de "dia de jogo": abas Plano, Ao Vivo, Scouting, tempos por blocos e cronologia (§3.7, §8.11, §10.4, §16 fase 15).** Interface (Server Component + Client Components) sobre a camada de actions/dados F5 já documentada. Sem alterações a schemas, actions ou base de dados.
  - **`app/(app)/jogos/[id]/page.tsx`:** passa a alimentar o `JogoDetalhe` com `planoInicial` (posição/titular previstos por convocado), `eventos` (com `bloco` e `atletaSecundarioId`), `observacoes` do jogo, `casaFora` e `adversario`; `estatisticasIniciais` passa a incluir `blocoTempo`; atletas passam a incluir `posicoes`. O `RegistoAoVivo` deixa de ser renderizado à parte — está agora dentro da aba "Ao Vivo".
  - **`components/jogos/JogoDetalhe.tsx`:** container único de abas — **Convocatória · Plano · Ao Vivo · Estatísticas · Scouting · Relatório**. A aba **Estatísticas** ganha o seletor de **tempo de jogo por bloco** (`LABEL_BLOCO_TEMPO`) por atleta; o **Relatório** passa a mostrar a **cronologia do jogo** (`TimelineEventos`).
  - **`components/jogos/PlanoTatico.tsx` (novo):** por convocado, `Select` de posição prevista (`LABEL_POSICAO`) + alternância titular/suplente; **formação visual** com chips agrupados por linha (Guarda-redes · Defesa · Meio · Avançado). Grava via `definirPlanoTatico(jogoId, plano)`.
  - **`components/jogos/RegistoAoVivo.tsx` (expandido):** botões de registo rápido (⚽ Golo · 🟨 Amarelo · 🟥 Vermelho · 🔄 Substituição · ⏱ Timeout), campos de atleta, minuto (0–120), bloco (`LABEL_BLOCO_TEMPO`) e atleta secundário (substituições); **marcador ao vivo** derivado dos eventos `GOLO`/`GOLO_SOFRIDO` respeitando `casaFora` (§10.4); atualização sem reload (`useTransition` + `router.refresh()`).
  - **`components/jogos/TimelineEventos.tsx` (novo):** cronologia presentacional dos eventos (emoji por tipo, minuto/parte, bloco, atleta e substituído); exporta `EMOJI_EVENTO` reutilizado no registo ao vivo.
  - **`components/jogos/ScoutingJogo.tsx` (novo):** observações de adversário filtradas por este jogo — criar ("Nova observação neste jogo", `jogoId` pré-preenchido), editar e apagar, com `router.refresh()`.
  - **Acessibilidade/UI:** alvos de toque ≥44px (botões rápidos, toggles, seletores), 100% pt-PT, Tailwind + shadcn/ui e tokens do sistema de design (secção 12).
  - **Verificação:** `npm run typecheck` **0 erros**; `npm run lint` **0 erros**; `npm run test` **484/484**.

- **2026-08-06** — **F5 (Fase 15) — Camada de actions de "dia de jogo", eventos ao vivo com bloco de tempo e scouting no jogo (§3.7, §16 fase 15).** Server Actions + schemas Zod, sobre a camada de dados F5 já documentada (não executada contra a BD). Sem alterações ao schema Prisma.
  - **`lib/schemas/jogo.ts`:** `eventoJogoSchema` ganha `bloco: BlocoTempo?` e passa a validar `tipo` via `z.nativeEnum(TipoEventoJogo)`; novo `registarEventoJogoSchema` (= evento + `jogoId` embutido no payload); `estatisticaSchema` ganha `blocoTempo: BlocoTempo?`; novos `convocatoriaPrevistaSchema`/`planoTaticoSchema` (plano de dia de jogo por convocado — `convocadoId`, `posicaoPrevista?`, `titularPrevisto?`); labels `LABEL_BLOCO_TEMPO` e `LABEL_TIPO_EVENTO` (com alias retrocompatível `LABEL_EVENTO`).
  - **`lib/schemas/competicao.ts`:** `observacaoAdversarioSchema` ganha `jogoId: cuid?` (scouting contextualizado num jogo).
  - **`lib/actions/jogos.ts`:** nova `definirPlanoTatico(jogoId, plano)` — upsert em lote de `posicaoPrevista`/`titularPrevisto` na `Convocatoria`, validando participação ATIVA no escalão/época (guardada por `CONVOCATORIA_GERIR`, a mesma capacidade que gere as linhas de convocatória que altera). `registarEventoJogo` passa a receber um único payload (`jogoId` incluído) e a devolver `Resultado<EventoJogo>`, persistindo `bloco`. `apagarEventoJogo` renomeada para `removerEventoJogo`. Nova `listarEventosJogo(jogoId)` (ordenados por `minuto`, depois `criadoEm`). `guardarEstatisticas` passa a persistir `blocoTempo`. `obterJogo`/`INCLUDE_DETALHE` passa a incluir `eventos` ordenados por `minuto`+`criadoEm` e `observacoes` (com jogadores) ligadas ao jogo; `convocatorias` já traz `posicaoPrevista`/`titularPrevisto`.
  - **`lib/actions/scouting.ts`:** `listarObservacoes(jogoId?)` (filtra pelo jogo quando indicado); `criarObservacao`/`atualizarObservacao` aceitam `jogoId` e validam que o jogo pertence ao clube.
  - **`components/jogos/RegistoAoVivo.tsx`:** ajustado às novas assinaturas (`registarEventoJogo({ jogoId, … })`, `removerEventoJogo`).
  - **Fidelidade à bíblia:** o rascunho da tarefa referia `TipoEvento`/`descricao` e um schema de evento sem `parte`; seguiu-se o modelo real de §3.7 (`EventoJogo` com `parte` obrigatório, `tipo: TipoEventoJogo`, `atletaSecundarioId`, **sem** `descricao`). O plano de convocatória é feito por `definirPlanoTatico`, mantendo `definirConvocatoria(jogoId, atletaIds[])` inalterada.
  - **Verificação:** `npm run typecheck` **0 erros**; `npm run test` **484/484** (novo `tests/jogos-f5.test.ts`, 20 testes); `npm run lint` **0 erros**.

- **2026-08-06** — **F5 (Fase 15) — Camada de dados de "dia de jogo", scouting no jogo e tempos por blocos (§3.7, §16 fase 15).** Migração Prisma `20260806090000_f5_jogos_dia` (só o ficheiro de migração — **não** executada contra a BD) que alinha o schema implementado com o modelo-alvo já documentado em §3.7. Todos os campos são opcionais/com default, compatíveis com dados existentes.
  - **Novo enum `BlocoTempo` (`JOGO_COMPLETO | MEIA_PARTE | BLOCO_10MIN | BLOCO_5MIN | NAO_JOGOU`).** Tempo de jogo por **blocos pré-definidos** (decisão 2026-08-05), não por minutos exatos nem por marcações de entrada/saída — reflete a realidade do futsal (rotações rápidas). `NAO_JOGOU = 0`.
  - **`Convocatoria`** ganha **`posicaoPrevista Posicao?`** e **`titularPrevisto Boolean @default(false)`** — plano de dia de jogo (quem começa e em que posição), base para o ecrã de dia de jogo e para `obterVistaDiaDeJogo`.
  - **`EstatisticaAtleta`** ganha **`blocoTempo BlocoTempo?`** — tempo de jogo por bloco, alternativa/complemento ao `minutos` (que passa a ser derivável do bloco).
  - **`EventoJogo`** ganha **`bloco BlocoTempo?`** — bloco de tempo associado ao evento ao vivo (útil em substituições / registo de tempos por blocos).
  - **`ObservacaoAdversario`** ganha **`jogoId String?`** + relação para `Jogo` (`onDelete: SetNull`) + índice `@@index([jogoId])`, e `Jogo` ganha a relação inversa `observacoes ObservacaoAdversario[]` — o scouting passa a poder ser **contextualizado num jogo** (dia de jogo) ou mantido avulso (clube/escalão), como já previa §3.7.
  - **Fora de âmbito (fidelidade à bíblia):** **não** foram adicionados `Jogo.arbitro/publico/localizacaoGps`, nem os modelos `RelatorioJogo`/`ScoutingRelatorio`/`ScoutingAdversario`, nem um modelo `BlocoTempo` com início/fim/substituições — nenhum consta de §3.7 e a regra de projeto proíbe desvios sem instrução explícita. O modelo de scouting da spec é `ObservacaoAdversario` + `ObservacaoJogadorAdversario` (já existentes); os tempos por blocos são um **enum**, não um modelo de substituições.
  - **Verificação:** `npx prisma validate` **schema válido**; migração escrita à mão no mesmo estilo do gerador (enum + `ALTER TABLE ADD COLUMN` + índice + FK), a cobrir exatamente o delta do schema. **Não** foi executado `migrate deploy`/`db push` (sem BD real nesta tarefa). §3.7 já documentava o modelo-alvo — sem alterações ao seu conteúdo.

- **2026-08-06** — **F3 — Correções de code review (6 issues *major*) sobre as bibliotecas de exercícios e os templates de sessão.** Camada de actions (`lib/actions/exercicios.ts`, `lib/actions/templatesSessao.ts`) + testes; sem alterações ao schema de base de dados (§3.3, §3.4, §4.2).
  - **M1 — `partilharExercicioNoClube` só contribui conteúdo 🎒 pessoal (§4.2).** O exercício passa a ser buscado com `filtroExerciciosVisiveis` (garante que o membro o vê no clube ativo, com `findFirst` em vez de `findUnique`) e a partilha é recusada se `proprietario !== "TREINADOR"` («Só pode partilhar exercícios da sua biblioteca pessoal.»). A guarda anterior (`proprietario === "CLUBE" && clubeProprietarioId === clubeId`), que só apanhava o caso do exercício já pertencer ao próprio clube, era insuficiente — um exercício 🏛️ de outro clube nunca deveria poder ser "partilhado".
  - **M2 — `partilharModeloSessaoNoClube` só contribui conteúdo 🎒 pessoal (§4.2, §3.4).** Recusa quando `proprietario !== "TREINADOR"` («Só pode partilhar templates da sua biblioteca pessoal.»), substituindo a guarda anterior de «já pertence ao clube». Só templates pessoais transferem a propriedade para o clube; um template 🏛️ (do próprio clube ou de outro) deixa de ser recontribuível.
  - **M3 — `atualizarModeloSessao` deixa de reescrever a propriedade.** À semelhança de `atualizarExercicio`, a edição ignora `proprietario` **e** `clubeProprietarioId`: a passagem de pessoal a clube faz-se pelo toggle de partilha, nunca por edição. Antes, como `criarModeloSessaoSchema.proprietario` tem default `TREINADOR`, editar um template 🏛️ do clube esvaziava a sua propriedade (`clubeProprietarioId → null`, `proprietario → TREINADOR`), convertendo-o indevidamente em pessoal. Removida também a verificação de permissão que dependia do `proprietario` do input (agora inócuo na edição).
  - **M4 — `atualizarExercicio` não apaga `parteTreino`/`escalaoAlvo` em atualizações parciais.** Os dois campos deixam de ser gravados como `?? null` e passam a ser reescritos **apenas quando vêm explicitamente no payload** (`...(campo !== undefined && { campo })`). Como o schema Zod já os tem como `optional()` (não `nullable()`), `undefined` significa «não fornecido» e o valor existente é preservado.
  - **M5 — `revalidatePath` dos templates aponta para as rotas certas.** `PATH_TEMPLATES` passa de `/exercicios` para **`/treinos/templates`** (onde a listagem vive de facto). Removido o `revalidatePath("/exercicios/templates/${id}")` (rota inexistente). `instalarTemplatesArranque` continua a revalidar também `/exercicios` (o picker da biblioteca pode refletir os seeds instalados).
  - **M6 — Instaladores de arranque verdadeiramente idempotentes.** Não existindo constraint única de nome+clube (não se acrescentam migrations), `skipDuplicates` não bastaria: a contagem de idempotência e a inserção passam a correr na **mesma transação com isolamento `Serializable`** — dois cliques concorrentes não conseguem ambos observar «vazio» e inserir (o PostgreSQL aborta um deles). Aplica-se a `instalarBibliotecaArranque` (contagem dentro da transação) e a `instalarTemplatesArranque` (fast-path externo + re-verificação dentro da transação, mais `skipDuplicates: true` nas linhas de `ModeloSessaoExercicio`, que respeita o unique `[modeloSessaoId, ordem]`).
  - **Ficheiros:** `lib/actions/exercicios.ts`, `lib/actions/templatesSessao.ts`, `tests/templates-sessao.test.ts` (mock de `prisma.exercicio.findFirst` para M1; novos testes de rejeição de conteúdo não-pessoal em M1/M2; o cenário «recontribuir template de outro clube», que antes era permitido, passa a afirmar a recusa).
  - **Verificação (âmbito F3):** `tests/templates-sessao.test.ts` (68), `tests/biblioteca-visibilidade.test.ts` (20) e `tests/exercicios-biblioteca-ui.test.ts` (12) — **100/100 a passar**; `npm run typecheck` **0 erros**; `next lint` dos ficheiros alterados **0 erros/avisos**.

- **2026-08-06** — **F3 — Correção M4 da revisão de código: `parteTreino`/`escalaoAlvo` no formulário de exercício (§8.6).** `components/exercicios/ExercicioForm.tsx` nunca enviava `parteTreino` nem `escalaoAlvo`, pelo que (1) os filtros da biblioteca por parte do treino só funcionavam nos exercícios de seed e (2) editar um exercício curado apagava silenciosamente ambos os campos (`atualizarExercicio` fazia `?? null`). O formulário passa a ter, na secção **Classificação**: um `Select` **«Parte do treino»** (opcional, «— Não definida —» + opções `PARTES_TREINO`/`LABEL_PARTE_TREINO`) e um `Input` **«Escalão alvo»** (texto livre opcional, `maxLength` 40, placeholder «ex: Sub-15», reflete `escalaoAlvo` máx. 40 do `exercicioSchema`). O tipo `ExercicioParaEdicao` passa a incluir `parteTreino`/`escalaoAlvo` (pré-preenchimento em edição) e o *payload* enviado às actions passa a incluí-los (`parteTreino` só quando definido; `escalaoAlvo` normalizado — vazio → `undefined`). Sem alterações a `lib/actions/exercicios.ts` (corrigido em paralelo). §8.6 §Novo/Editar atualizada.
  - **Verificação:** `npm run typecheck` **0 erros**; `npm run lint` **0 erros/avisos**; `npm run test` **412/412** (14 ficheiros).

- **2026-08-06** — **F1/F0 — Correções minor da revisão de código: UI de overrides, gating de UI do plantel, revalidação e acessibilidade dos formulários de participação.** Fecha os pontos m1–m6 da revisão à UI de participações N-N (§6.4, §8.2, §8.5).
  - **m1 — Editor de overrides por membro (§6.4, §8.2).** A action `definirOverrides` (F0) existia sem qualquer forma de a invocar. Novo **`components/definicoes/OverridesMembroDialog.tsx`**: diálogo por membro (botão "Gerir permissões", ícone `SlidersHorizontal`) com a grelha de **todas as capacidades do catálogo ativo** (`CAPACIDADES` — as FUTURO, como `FATURACAO_GERIR`, estão fora do catálogo e portanto não aparecem). Cada linha mostra a **origem** da capacidade por etiqueta: `perfil` (vem do perfil base e está ativa), `extra` (concedida além do perfil) ou `revogada` (do perfil, retirada ao membro). O **estado local é o conjunto de capacidades efetivas desejadas**; `extra`/`revogadas` são **derivados na submissão** pela diferença face ao perfil base, o que impede persistir overrides redundantes (capacidade em `extra` que o perfil já dá, ou em `revogadas` que o perfil não tem). **Delegação (6.4):** as capacidades que o próprio utilizador não possui aparecem bloqueadas quando estão desligadas (não se concede o que não se tem); revogar nunca é bloqueado. O servidor revalida tudo — isto é apenas gating de UI.
  - **`capacidadesEfetivas` movida para o módulo PURO `lib/permissoes-catalogo.ts`** (reexportada por `lib/permissoes.ts`, que continua a ser o ponto de entrada no servidor). Sem esta mudança o editor teria de duplicar a regra `(base ∪ extra) \ revogadas` no cliente: `lib/permissoes.ts` importa `prisma`/`auth` ao nível do módulo e não pode ser importado por um Client Component. Os testes existentes continuam a importar de `@/lib/permissoes`.
  - **`listarMembros` (`lib/actions/utilizadores.ts`)** passa a devolver `perfilCapacidades`, `capacidadesExtra` e `capacidadesRevogadas` em `MembroLista` — o editor precisa da base e dos overrides atuais para calcular o estado inicial.
  - **Gating de UI da equipa técnica (§8.2).** `UtilizadoresLista` recebe `podeGerirMembros` (capacidade `CLUBE_UTILIZADORES`) e `capacidadesProprias`. Sem `CLUBE_UTILIZADORES`, o ecrã fica **só de leitura**: sem "Adicionar membro", sem seletor de perfil (mostra o nome do perfil em texto), sem overrides/password/remover, e os escalões atribuídos passam de botões a etiquetas. Os botões de escalão ganham `aria-pressed`.
  - **m2/m3 — Gating de UI das ações de participação (§6.7, §8.5).** `ParticipacoesAtleta` renderizava Associar/Transferir/Terminar incondicionalmente. Passa a receber `podeGerir` (`PLANTEL_GERIR` → associar/transferir), `podeTerminar` (**`PROMOVER_ATLETAS`** → terminar; é uma capacidade de clube distinta, e não `PLANTEL_GERIR`) e `escaloesGeriveis`. A page `app/(app)/plantel/[id]/page.tsx` chama `obterMembroAtual()` (em paralelo com as restantes leituras) e calcula `escaloesGeriveis` = todos os escalões se o âmbito for `TODO_CLUBE`, senão só os atribuídos. `TransferirEscalaoForm` renomeia a prop `escaloes` → **`escaloesPossiveis`** e a lista de origens é filtrada pelos escalões geríveis, porque a action exige `PLANTEL_GERIR` na **origem e no destino** — oferecer escalões fora do âmbito só produzia erros "Sem permissão neste escalão". O estado vazio deixa de convidar a associar quem não o pode fazer.
  - **m4 — Revalidação (`revalidatePath`).** As mutações de participação invalidavam `/plantel` e `/plantel/{id}` mas não `/dashboard`, que **conta atletas por participações ativas** (§8.16) e ficava desatualizado. Novo helper `revalidarParticipacao(atletaId)` em `lib/actions/participacoes.ts`, usado por `associarAEscalao`/`transferirEscalao`/`terminarParticipacao`. Em `lib/actions/atletas.ts`, `criarAtleta` e `apagarAtleta` passam a invalidar também `/dashboard` (e `apagarAtleta` invalida ainda `/plantel/{id}`).
  - **m5 — Acessibilidade dos formulários (§12).** `AssociarEscalaoForm` e `TransferirEscalaoForm`: todos os controlos ganham `aria-invalid` e `aria-describedby` a apontar para a mensagem de erro correspondente (que ganha `id`), e o parágrafo de erro geral ganha `role="alert"` para ser anunciado por leitores de ecrã.
  - **m6 — Estado obsoleto em `TransferirEscalaoForm`.** `deEscalaoId` era inicializado de `participacoesAtivas[0]` e **nunca ressincronizava** quando as props mudavam após `router.refresh()` — depois de uma transferência, o formulário ficava a apontar para uma participação que já não estava ativa. Dois `useEffect` de ressincronização: um repõe a origem quando a atual deixa de constar nas participações ativas, outro limpa o destino quando deixa de constar nos destinos possíveis. O `alternar(false)` passa a correr **depois** do `router.refresh()`, dentro do mesmo `startTransition`.
  - **Verificação:** `npm run typecheck` **0 erros**; `npm run lint` **0 erros/avisos**; `npm run test` **331/331** (12 ficheiros); `npm run build` **compilação limpa**, 36/36 páginas (confirma que o módulo puro não arrasta `prisma` para o bundle do cliente).

- **2026-08-06** — **F3 — Cobertura de testes das bibliotecas e dos templates de sessão (QA).** Sem alterações a código de produção: só testes (§14 atualizada). **350 → 412 testes** (13 → 14 ficheiros).
  - **`tests/biblioteca-visibilidade.test.ts` (novo, 20 testes)** — semântica das regras de visibilidade de `lib/biblioteca.ts` (§3.3, §3.4, §4.2). Os testes existentes comparavam a **forma** da cláusula Prisma (igualdade estrutural do `OR`); estes interpretam a cláusula gerada contra linhas de exemplo e afirmam **quem vê o quê**: (a) exercício 🎒 **pessoal** visível ao autor e a mais ninguém, **portátil** (o autor continua a vê-lo noutro clube, §4.2) e invisível a terceiros noutro clube; (b) exercício 🏛️ **do clube** visível a **todos** os membros do clube proprietário, independentemente do autor, e invisível a partir de outro clube — **nem ao próprio autor**; (c) linha **legada da fase expand** (`clubeProprietarioId = null`, só `clubeId`) ainda visível, delimitada pelo `clubeId`; (d) exercício pessoal **partilhado** presente nas **duas abas** (🎒 para o autor, 🏛️ para os colegas, com `origemDoItem` a confirmar a etiqueta de cada um), partilha **por clube** (não vaza para os outros clubes do autor, e uma partilha noutro clube não o torna visível no ativo) e reversível sem afetar a aba pessoal; (e) **templates** — pessoal só ao autor, portátil, do clube a todos, e **sem partilha pontual** (uma linha com `partilhasClube` é ignorada pelo filtro de modelos: só a transferência de propriedade os torna visíveis à equipa, §3.4); (f) `origemDoItem` com `autorId` nulo → 🏛️ clube. O intérprete falha de propósito se `lib/biblioteca.ts` passar a gerar operadores que não igualdades simples + `partilhasClube.some` — qualquer mudança de semântica de visibilidade tem de ser revista à mão.
  - **`tests/templates-sessao.test.ts` (25 → 67 testes).**
    - **`criarModeloSessaoSchema`** — **título obrigatório** (ausente, vazio com a mensagem «O nome é obrigatório», não-texto, fronteira 120/121); **ordem obrigatória em cada exercício** (ausente com `path` `["exercicios", 0, "ordem"]`, fracionada, negativa, não numérica, fronteiras 0/99/100), `exercicioId` não-cuid («Exercício inválido»), limite de 30 exercícios (30 ok / 31 recusado); **duração positiva em minutos inteiros** — do template (0, negativa, fracionada, não numérica, fronteiras 1/300/301 com as mensagens próprias, omissão permitida) e **de cada linha de exercício** (0, negativa, fracionada, 181; fronteiras 1/180); `faseEpoca` fora do enum.
    - **`criarSessaoDeTemplateSchema`** — **data válida** (ausente, texto não-data, data impossível, string vazia; ISO curto `2026-09-10` normalizado para `Date` à meia-noite UTC; objeto `Date` aceite sem perda) e **`escalaoId` obrigatório** (ausente, vazio, sem formato de cuid, `null`, com a mensagem «Escalão inválido»); `epocaId` inválido recusado e omissão aceite.
    - **`criarSessaoDeTemplate` — cópia, não ligação (§3.4).** Além da reindexação de ordem já coberta: o **template de origem fica intacto** (sem `update`/`create` de `ModeloSessao` nem escrita em `ModeloSessaoExercicio`); as linhas copiadas **não guardam qualquer referência** ao template (`modeloSessaoId`/`modeloSessaoExercicioId` ausentes) — o que persiste é o `exercicioId` da biblioteca, que é o que mantém o histórico legível (FK `Restrict`, §3.3); a sessão nasce **`NORMAL`** e herda duração, objetivo tático e descrição; template **sem exercícios** cria na mesma a sessão, sem linhas; `epocaId` explícito prevalece sobre a época ativa; template não visível e escalão fora do clube são recusados; **entrada inválida é rejeitada antes de verificar permissões**.
    - **`partilharModeloSessaoNoClube` — transfere propriedade, não duplica (§3.4).** Cenário novo, antes sem cobertura: sem `EXERCICIOS_GERIR`, template inexistente, **só o autor** contribui, e recusa quando já pertence ao clube ativo. No caminho feliz, a **mesma linha** muda de dono (`update` com `{ proprietario: "CLUBE", clubeProprietarioId }` no `id` correto) e **não há duplicação** — nem `ModeloSessao.create`, nem `ModeloSessaoExercicio.createMany`, nem `PartilhaExercicioClube.upsert` (é este o contraste com os exercícios, que partilham por linha de junção e mantêm a propriedade no autor). Um template de outro clube pode ser recontribuído para o clube ativo.
    - **`instalarTemplatesArranque` — idempotência ponta a ponta.** Duas invocações em sequência: a primeira instala os `TEMPLATES_ARRANQUE`, a segunda (com a contagem já a refletir o estado instalado) devolve **`criados: 0`** e **não produz qualquer escrita adicional**. Cobertos também o âmbito da contagem (`{ clubeProprietarioId, origemSeed: true }` — por clube e só linhas de seed) e a marcação das linhas criadas (🏛️ `CLUBE`, `origemSeed: true`, autoria de quem instalou).
  - **Validação da própria suite (mutation check):** removida temporariamente a cláusula `partilhasClube` de `filtroExerciciosVisiveis` e trocado o `update` de `partilharModeloSessaoNoClube` por um `create` — **5 testes falharam** nos pontos esperados, confirmando que as asserções não são vácuas. Código restaurado.
  - **Verificação:** `npm run test` **412/412** (14 ficheiros); `npm run typecheck` **0 erros**; `npm run lint` **0 erros/avisos**.

- **2026-08-06** — **F7 — UI do gerador de comunicações (WhatsApp).** Camada de apresentação sobre `lib/actions/comunicacao.ts` (§3.9, §8.12, §13, §16 fase 17). Server Components para leitura, Server Actions para escrita — sem `fetch` no cliente. A app **continua a não ser canal**: gera texto, o utilizador copia ou partilha.
  - **`lib/comunicacao-cliente.ts` (novo, módulo puro e seguro no browser):** `linkWhatsApp(texto)` + `BASE_LINK_WHATSAPP`; `LABEL_PLACEHOLDER`/`rotuloPlaceholder` (rótulos pt-PT de todos os placeholders da §3.9, com *fallback* para a própria chave em templates personalizados); `DICA_PLACEHOLDER`; `placeholderMultilinha` (listas e textos longos em `textarea`); `tipoUsaJogo`/`tipoUsaCalendario` (predicados de tipo); `MESES_PT`; `primeirasLinhas`. Fica separado de `lib/comunicacao-utils.ts` para manter esse módulo focado no que é partilhado com o servidor.
  - **Decisão — link universal:** a partilha usa `https://api.whatsapp.com/send?text=…` em vez de `whatsapp://send?text=…`. O esquema privado falha em desktop sem app instalada; o link universal resolve em web, Android e iOS. §3.9/§13 atualizadas em conformidade.
  - **Nota (2026-08-06, alinhamento de comentários):** a decisão em `:1953` (link universal) reforça-se aqui — o código usa `https://api.whatsapp.com/send?text=` (link universal) e **não** `whatsapp://send?text=` (esquema privado, que falha em desktop sem a app instalada). Comentários de `lib/actions/comunicacao.ts` e `lib/comunicacao-utils.ts` corrigidos para refletir a implementação real.
  - **`app/(app)/comunicacoes/page.tsx` (nova rota):** um cartão por `TipoComunicacao` (os 7, mesmo sem modelo), com o template **em vigor** resolvido como no servidor (variante do clube → *fallback* global), *badge* «Do clube»/«Global», pré-visualização das primeiras linhas e ações **Gerar** / **Editar** (ou **Personalizar**). «Instalar templates base» só enquanto o clube não tiver cópias próprias.
  - **`app/(app)/comunicacoes/gerar/page.tsx` (nova rota, aceita `?tipo=&jogo=`):** carrega modelos + jogos da época + nome do clube/treinador e delega no `GeradorComunicacao`.
  - **`components/comunicacoes/GeradorComunicacao.tsx` (novo, cliente):** `Select` de tipo → campos **derivados de `placeholdersDoTemplate`** (nunca uma lista fixa: um template personalizado com campos novos gera automaticamente os respetivos inputs) → **pré-visualização ao vivo** com `substituirPlaceholders` → **texto final do servidor** ao submeter (`gerarTextoComunicacao` com `modeloId` explícito, ou `gerarCalendarioTexto` para o calendário). `CONVOCATORIA`/`RESULTADO` pré-preenchem o contexto por *picker* de jogo (os helpers **lançam** em acesso inválido, logo são chamados dentro de `try/catch`); os valores ficam **editáveis** (incl. `prazoConfirmacao`, que é sugestão). `CALENDARIO_MENSAL` não tem pré-visualização local — `listaEventos` só existe no servidor.
  - **`app/(app)/comunicacoes/[tipo]/editar/page.tsx` (nova rota):** aceita o tipo em minúsculas na URL (`/comunicacoes/convocatoria/editar`), `notFound()` se não for um `TipoComunicacao`. Sem cópia do clube mostra o global em **leitura** + «Instalar templates base» (o servidor recusa editar globais).
  - **`components/comunicacoes/EditorModelo.tsx` (novo, cliente):** nome + texto do template, **campos disponíveis** clicáveis que inserem `{{chave}}` na posição do cursor, e pré-visualização com valores de exemplo. Os campos sugeridos são a **união** dos placeholders do template atual com os do modelo de arranque, para que um campo apagado do texto continue a poder ser reinserido.
  - **`components/comunicacoes/AccoesTexto.tsx` (novo, cliente):** `AccoesTexto` (Copiar via Clipboard API com alternativa por `textarea` para contextos inseguros; Partilhar no WhatsApp em nova janela) e `TextoGerado` (bloco `pre` que preserva as quebras de linha da formatação WhatsApp). Reutilizados no gerador, no editor e no jogo.
  - **`components/comunicacoes/InstalarModelosButton.tsx` (novo, cliente):** `instalarSeedComunicacao` + `router.refresh()`.
  - **`components/jogos/ConvocatoriaWhatsApp.tsx` (novo, cliente) + `app/(app)/jogos/[id]/page.tsx`:** botão **«Gerar convocatória»** no cabeçalho do jogo, só renderizado com `COMUNICACOES_GERIR` (verificado no servidor com `obterMembroAtual`). Abre diálogo com o texto pronto, Copiar/WhatsApp e ligação «Editar no gerador».
  - **`components/layout/Navegacao.tsx`:** novo item **Comunicações** (`MessageSquare`) entre Jogos e Reuniões — entra no menu «Mais» do móvel, sem alterar a bottom-nav.
  - **Permissões na UI:** as três rotas verificam `COMUNICACOES_GERIR` via `obterMembroAtual()` e mostram `EstadoErro` a quem não a tem (defesa em profundidade — as actions já a exigem).
  - **`tests/comunicacao-cliente.test.ts` (novo, 19 testes):** codificação e ida-e-volta do deep link; **cobertura de rótulos** (falha se um placeholder dos modelos de arranque ficar sem rótulo pt-PT); campos multilinha; predicados de tipo (grupos disjuntos e completos face a `TIPOS_COMUNICACAO`); coerência de `MESES_PT` com `formatarMesAno` do servidor; `primeirasLinhas`.

- **2026-08-06** — **F3 — UI das bibliotecas (🎒 pessoal / 🏛️ clube) e dos templates de sessão.** Camada de apresentação sobre `lib/actions/exercicios.ts` e `lib/actions/templatesSessao.ts` (§3.3, §3.4, §4.2, §8.6, §8.7, §16 fase 13). Server Components para leitura, Server Actions para escrita — sem `fetch` no cliente.
  - **`lib/actions/exercicios.ts` (anotação de leitura):** `ExercicioBiblioteca` ganha **`naBibliotecaDoClube: boolean`**, calculado em `listarExercicios`/`obterExercicio` a partir de `proprietario = CLUBE` no clube ativo (**incluindo as linhas legadas da fase expand**, com `clubeProprietarioId = null` e só o `clubeId` preenchido) **ou** da existência de `PartilhaExercicioClube` para esse clube. As partilhas são carregadas com `include` restrito ao clube ativo e a relação é retirada do objeto devolvido (detalhe de leitura, fora do contrato público). Sem esta anotação a UI não distingue «partilhar» de «remover a partilha» — o toggle da §3.3 seria cego ao estado atual.
  - **`app/(app)/exercicios/page.tsx` (reescrita):** duas **abas por URL** (`?bib=pessoal|clube`, default pessoal) com contagem por aba — **🎒 Pessoal** = exercícios do próprio (`origem = PESSOAL`); **🏛️ Clube** = tudo o que está na biblioteca do clube (`naBibliotecaDoClube`), incluindo os pessoais que o próprio lá partilhou (um exercício partilhado aparece, corretamente, nas duas abas, distinguido pelo *badge* «No clube»). Filtros de **parte do treino** e **categoria** (novos), combináveis com a pesquisa por nome, resolvidos no servidor e preservados ao mudar de aba. Os cartões mostram agora *badges* de parte do treino e de conteúdo **curado** (`origemSeed`) e deixam de ser um `Link` envolvente (os botões de ação ficariam aninhados em elemento interativo). «Instalar biblioteca de arranque» passa do cabeçalho para o **estado vazio da aba Clube** (só a quem tem `EXERCICIOS_GERIR`).
  - **`components/exercicios/FiltrosBiblioteca.tsx` (novo, cliente):** `Select` de parte do treino + categoria que reescrevem a query string com `router.replace`, preservando os restantes parâmetros.
  - **`components/exercicios/PartilhaExercicioButton.tsx` (novo, cliente):** toggle 🎒→🏛️ (`partilharExercicioNoClube` / `removerPartilhaNoClube`). Só é renderizado para exercícios **do próprio** (`proprietario = TREINADOR` + `autorId`) e com `EXERCICIOS_GERIR` — as duas actions são reservadas ao autor no servidor, pelo que o botão nunca aparece onde falharia.
  - **`components/exercicios/ToggleBiblioteca.tsx` (novo, cliente):** toggle de propriedade do conteúdo (§4.2) em `radiogroup` acessível, partilhado pelo formulário de exercício e pelo de template. Legenda fixa: «Pessoal: leva contigo se mudares de clube. Do clube: partilhada com toda a equipa técnica.»
  - **`components/exercicios/ExercicioForm.tsx`:** passa a enviar `proprietario` (default `TREINADOR`). O toggle **só aparece na criação** — na edição a propriedade não muda (`atualizarExercicio` ignora-a de propósito); a passagem a 🏛️ faz-se pelo toggle de partilha.
  - **`app/(app)/treinos/templates/page.tsx` (nova rota):** listagem de templates com nome, objetivo tático, nº de exercícios, duração (a do template ou a soma das linhas), escalão alvo, fase da época, *badge* de **origem** (🎒 Pessoal / 🏛️ Clube) e de **curado**, mais o resumo ordenado dos exercícios (nome · parte do treino · duração). Filtro por **escalão alvo** com opções derivadas dos valores presentes (o campo é texto livre, logo as opções não podem vir só dos escalões do clube). Ações por template: **Criar sessão**, **Editar**, **Partilhar no clube** (só templates pessoais do autor, com `EXERCICIOS_GERIR`) e **Apagar**. «Instalar templates de arranque» no cabeçalho e no estado vazio.
  - **`components/treinos/TemplateSessaoForm.tsx` (novo, cliente):** diálogo de criação/edição cobrindo `criarModeloSessaoSchema` — nome, escalão alvo (`Select` dos escalões do clube, gravado como texto), fase da época, objetivo tático, duração, descrição, toggle de biblioteca (só com `EXERCICIOS_GERIR`) e **lista de exercícios reordenável** (adicionar pelo picker da biblioteca visível, subir/descer, duração e parte do treino por linha, remover). A **ordem é sempre reindexada 0..n-1** na submissão, respeitando o unique `[modeloSessaoId, ordem]`. Total de minutos calculado ao vivo.
  - **`components/treinos/AcoesTemplate.tsx` (novo, cliente):** `CriarSessaoDeTemplateButton` (diálogo com data/hora — pré-preenchida na próxima hora certa — e escalão, pré-selecionado quando o nome coincide com o escalão alvo; navega para a sessão criada), `PartilharTemplateButton` (confirmação que explicita que, ao contrário dos exercícios, **a contribuição transfere a propriedade**, §3.4) e `ApagarTemplateButton` (confirmação que esclarece que as sessões já criadas não são afetadas, por serem cópias).
  - **`components/treinos/InstalarTemplatesButton.tsx` e `FiltroEscalaoAlvo.tsx` (novos, cliente):** instalação idempotente dos templates curados e filtro por escalão alvo via query string.
  - **Navegação:** `/treinos` ganha **«Usar template»** (cabeçalho e estado vazio) e `/exercicios` ganha **«Templates de sessão»**. A barra lateral não tem sub-níveis, pelo que os templates são alcançados a partir de Treinos e Exercícios (sem novo item de topo).
  - **Acessibilidade e convenções:** alvos de toque ≥ 44px nas ações e nas abas, `role="tablist"`/`aria-selected` nas abas, `aria-label` nos botões de reordenar/remover e nos campos por linha, interface em pt-PT.
  - **Testes:** `tests/exercicios-biblioteca-ui.test.ts` (12 — anotação `origem`/`naBibliotecaDoClube` nos cenários de propriedade e partilha, incluindo o legado da fase expand e o exercício de outro clube; remoção da relação `partilhasClube`; `include` restrito ao clube ativo; propagação dos filtros; exigência de autenticação).
  - **Verificação:** `npm run typecheck` **0 erros**; `npm run lint` **0 erros/avisos**; `npm run test` **331/331** (12 ficheiros); `npm run build` **verde** (nova rota `/treinos/templates`).

- **2026-08-06** — **F1 — Correções de code review (6 issues *major*) sobre `AtletaEscalao` e overrides de membro.** Camada de actions/schemas; sem alterações de schema de base de dados.
  - **M1 — `associarAEscalao` não aceita `PRINCIPAL`** *(já em vigor desde o switch M3; confirmado e coberto por teste)*. `associarAEscalaoSchema` usa `TIPOS_PARTICIPACAO_ADICIONAL` (`SIMULTANEA | OCASIONAL`, default `SIMULTANEA`) com mensagem de domínio; `criarAtletaSchema.participacaoInicial` continua a aceitar `PRINCIPAL` (default), por ser aí que o principal nasce.
  - **M2 — `listarParticipacoes` passa a validar o âmbito de escalão (§6.4).** O histórico só é devolvido se `podeLerAlgumEscalao(escalaoIds)` — antes bastava o atleta pertencer ao clube, o que expunha o histórico completo a treinadores com âmbito `PROPRIOS_ESCALOES`. Atleta sem participações continua a devolver lista vazia (sem erro).
  - **M3 — Invariante «participação principal obrigatória» imposto nas escritas (§9).** `terminarParticipacao` recusa terminar uma participação `PRINCIPAL` («Não é possível terminar a participação principal. Transfira o atleta para outro escalão principal primeiro.»). `transferirEscalao` deixa de **bloquear** quando já existe outro principal ativo e passa a **despromovê-lo para `SIMULTANEA`** na mesma transação (o destino torna-se o principal único), e recusa a transferência que deixasse o atleta sem principal. Ambas as actions correm agora numa transação **interativa com isolamento `SERIALIZABLE`**: a leitura das participações ativas e a escrita são atómicas (antes a verificação era feita fora da transação — TOCTOU). Novos utilitários puros em `lib/schemas/participacao.ts`: `principaisADespromover(ativas, destino, encerrados)` (devolve as participações a despromover; `conflitoPrincipalAtivo` passa a ser um invólucro dele) e `ficariaSemPrincipal(ativas, destino, encerrados)`.
  - **M4 — Número de camisola duplicado: §9 (aviso não-bloqueante) prevalece sobre §18 (unicidade histórica).** Removida a validação de unicidade de `(escalaoId, epocaId, numero)` de `associarAEscalao`, `transferirEscalao` e `criarAtleta` — o número é gravado tal como indicado. O **aviso não-bloqueante** por escalão continua a ser calculado na lista do plantel (`app/(app)/plantel/page.tsx`), que é o comportamento especificado em §9 («dois atletas com o mesmo número: permitido; aviso não-bloqueante por escalão»). A nota de §19 de 2026-08-06 (F1 M3) que anunciava «unicidade de número validada por `(escalaoId, epocaId, numero)`» fica assim **superada**.
  - **M5 — Proteção do último administrador com isolamento `SERIALIZABLE`.** `definirOverrides` (`lib/actions/membros.ts`) já corria o *last-admin check* e o `update` na mesma transação, mas em `READ COMMITTED` (default do PostgreSQL) duas transações concorrentes leriam ambas o snapshot anterior e ambas veriam «ainda há outro admin», deixando o clube sem administrador. Passa a `Prisma.TransactionIsolationLevel.Serializable`; em caso de conflito o PostgreSQL aborta uma das transações (`P2034`) e a operação falha — o utilizador repete, que é o comportamento correto.
  - **M6 — `transferirEscalao` reinicia `dataInicio` ao reativar o destino.** O ramo `update` do `upsert` não escrevia `dataInicio`: reentrar num escalão onde já tinha havido participação mantinha a data de início antiga, corrompendo o histórico e o divisor da taxa de presença. Passa a gravar `dataInicio: agora` (o mesmo instante do ramo `create` e do `dataFim` da origem).
  - **Ficheiros:** `lib/schemas/participacao.ts`, `lib/actions/participacoes.ts`, `lib/actions/atletas.ts`, `lib/actions/membros.ts`, `components/plantel/AssociarEscalaoForm.tsx` (passa a consumir `TIPOS_PARTICIPACAO_ADICIONAL` do contrato, em vez de uma lista local duplicada), `tests/participacoes.test.ts`, `tests/permissoes-overrides.test.ts`, `tests/schemas.test.ts` (bloco de participação movido para o ficheiro dedicado), `tests/actions.test.ts`. Documentação: §9 (invariante do principal explicitado e ligado às três actions).
  - **Cobertura de testes (QA).** Novo `tests/participacoes.test.ts` (**84 testes**) com três camadas: **schemas** (`associarAEscalaoSchema` — número ausente/`null`/limites 1-999/fora de intervalo/não inteiro/texto, recusa de `PRINCIPAL`, tipos adicionais, `epocaId` opcional; `transferirEscalaoSchema` — origem ≠ destino com `path` em `paraEscalaoId`, número em branco → `undefined`; `terminarParticipacaoSchema`); **invariantes puros** (`principaisADespromover`, `conflitoPrincipalAtivo`, `ficariaSemPrincipal`, incl. coerência entre os dois primeiros); e **Server Actions** (isolamento por clube, capacidade exigida na origem **e** no destino, despromoção do principal, recusa de terminar o principal, `Serializable`, `dataInicio` reiniciada, número duplicado permitido, tradução de `P2002`, propagação de erros inesperados, rotas revalidadas). `tests/permissoes-overrides.test.ts` sobe de 16 para **31 testes**: além da função pura `capacidadesEfetivas`, cobre agora a action `definirOverrides` — **delegação** (não se concede o que não se tem, incluindo quando só uma das capacidades excede; revogar não está sujeito à regra) e **proteção do último administrador** (bloqueio ao revogar `CLUBE_UTILIZADORES`/`CLUBE_PERFIS` ao último admin, admin por override extra conta, o próprio alvo pode tornar-se admin no mesmo pedido, check e escrita na mesma transação). Os testes de action usam mocks de `auth()`/`prisma` apenas para isolar dependências externas; `capacidadesEfetivas` corre **real** dentro de `definirOverrides`.
  - **Verificação:** `npm run typecheck` **0 erros**; `npm run lint` **0 erros/avisos**; `npm run test` **331/331 passam** (12 ficheiros).

- **2026-08-06** — **F4 — UI do modelo de jogo (documento vivo) + editor de campo integrado.** Camada de apresentação sobre as actions de `lib/actions/modeloJogo.ts` (§3.6, §8.10, §11, §16 fase 14). Server Components para leitura, Server Actions para escrita — sem `fetch` no cliente.
  - **`app/(app)/modelo-jogo/page.tsx` (listagem):** passa a chamar `listarModelosJogo(escalaoId, momento)` com **os dois filtros**. Momento continua em tabs (os 5 valores de `MomentoJogo`, incl. `BOLAS_PARADAS`); o escalão passa a `Select`. Os filtros são **combináveis** (as tabs preservam o `escalaoId` e vice-versa). Quando há escalão selecionado, a página avisa que a listagem **inclui também a metodologia genérica** (`escalaoId = null`), coerente com a regra da action. Cada cartão mostra miniatura do diagrama, nome, excerto dos princípios e *badges* de momento, escalão (ou «Metodologia» quando portátil), época e **contagem de subprincípios** (via `lerSubprincipios`).
  - **`components/modelo-jogo/FiltroEscalaoModelo.tsx` (novo, cliente):** `Select` de escalão que reconstrói a query string e navega com `router.push`. Recebe os valores atuais **por props** (não usa `useSearchParams`), evitando a necessidade de `Suspense` no App Router.
  - **`app/(app)/modelo-jogo/[id]/page.tsx` (detalhe / documento vivo):** cabeçalho com **Editar** e **Apagar** (o `AlertDialog` de confirmação deixa de estar só na página de edição); *badges* de momento/escalão/época/portabilidade; secções **Princípios** (texto) e **Subprincípios** (lista a partir de `subprincipiosLista`); diagrama editável no local; e secção **Quadros táticos** que explicita a regra do modelo de dados — os quadros pertencem a um **`Jogo`**, não ao `ModeloJogo` — listando os jogos do escalão (via `listarJogos(escalaoId)`) com ligação ao respetivo detalhe. Quando o documento é portátil (sem escalão), a secção liga a `/jogos`.
  - **`components/modelo-jogo/DiagramaModeloJogo.tsx` (novo, cliente):** edição **in-place** do `ModeloJogo.diagrama` no detalhe. Em leitura usa `CampoAnimado` (se houver passos) ou `CampoFutsal`; em edição usa o `EditorCampo` (o mesmo de exercícios e quadros táticos, §11). Como `modeloJogoSchema` valida o documento completo, a gravação **reenvia todos os campos** do modelo (nome, momento, princípios, subprincípios, propriedade, escalão e época) — gravar só o diagrama limparia os restantes. Cancelar restaura o último diagrama gravado.
  - **`components/modelo-jogo/ModeloJogoForm.tsx` (reescrito):** cobre agora todo o `modeloJogoSchema`. Novos campos: **propriedade** (`CLUBE` = documento da equipa · `TREINADOR` = metodologia portátil, em toggle de dois cartões), **escalão** e **época** (`Select`, ocultos quando portátil, por a metodologia não ter âmbito — §3.6), e **subprincípios**. A época pré-preenche com a **época ativa** na criação. O diagrama inicial passa a `DIAGRAMA_VAZIO_V2`. Validação **Zod no cliente** com o mesmo `modeloJogoSchema` do servidor (fonte única) antes de invocar a action; os erros por campo são mapeados com `erroDeValidacao`.
  - **`components/modelo-jogo/EditorSubprincipios.tsx` (novo, cliente):** editor de *chips* para `ModeloJogo.subprincipios` — adicionar por Enter ou botão (sem submeter o formulário), remover por *chip*, deduplicação sem distinção de maiúsculas, contador e limites alinhados com `subprincipiosSchema` (50 subprincípios, 300 caracteres cada).
  - **`app/(app)/modelo-jogo/novo/page.tsx` e `[id]/editar/page.tsx`:** passam a carregar `listarEscaloes()`, `listarEpocas()` e (na criação) `obterEpocaAtiva()` para alimentar os novos `Select` do formulário.
  - **Acessibilidade e convenções:** alvos de toque ≥ 44px (`SelectTrigger` com `h-11`, *chips* com `min-h-11`), `aria-pressed` no toggle de propriedade, `aria-label` nos botões de remoção, interface em pt-PT.
  - **Verificação:** `npm run typecheck` **0 erros**; `npm run lint` **0 erros/avisos**; `npm run test` **278/278** (11 ficheiros); `npm run build` **verde** (4 rotas `/modelo-jogo`).
  - **Pendente (fase seguinte de F4):** UI dos **quadros táticos** dentro do detalhe do jogo (§8.11 — aba «Quadro tático»), consumindo `listarQuadrosTaticos`/`criarQuadroTatico`/`atualizarQuadroTatico`/`apagarQuadroTatico`.

- **2026-08-06** — **F7 — Backend do gerador de comunicações (WhatsApp).** Camada de schemas Zod + Server Actions sobre a migração M11 `f7_modelocomunicacao` (§3.9, §8.12, §13, §16 fase 17). A app **continua a não ser canal**: gera texto, não envia.
  - **`lib/comunicacao-modelos.ts` (novo, módulo puro):** `MODELOS_COMUNICACAO_SEED` — os 7 textos de arranque (um por `TipoComunicacao`) passam a viver aqui, como **fonte única** partilhada pelo seed (`prisma/data-migrations/f7_seed_comunicacao.ts`, que agora os importa e reexporta) e pela action `instalarSeedComunicacao()`. Sem isto, importar o seed a partir do servidor executaria o script (instancia `PrismaClient` e corre `main()` no import).
  - **`lib/comunicacao-utils.ts` (novo, módulo puro):** `substituirPlaceholders(template, contexto)` — `replace(/\{\{(\w+)\}\}/g, …)` com guarda contra chaves herdadas do *prototype*, colapso de linhas em branco e *trim*; `placeholdersDoTemplate`; formatação pt-PT/`Europe/Lisbon` (`formatarData`, `formatarDataCurta`, `formatarHora` em h23, `formatarDiaSemana`, `formatarMesAno`); listas (`formatarListaConvocados` numerada, `formatarContagemPorAtleta` ordenada por total, `formatarListaEventos` — `📅 DD/MM — Treino (HH:mm, Local)` / `⚽ DD/MM — Jogo vs Adversário (HH:mm)`). Constantes `FUSO_HORARIO`, `HORA_LIMITE_CONFIRMACAO` (20:00), `LOCAL_POR_DEFINIR`, `SEM_REGISTOS`.
  - **`lib/schemas/comunicacao.ts` (novo):** `gerarTextoComunicacaoSchema` (`tipo`, `contexto: z.record(z.string())`, `modeloId?` cuid), `editarModeloComunicacaoSchema` (`id`, `nome` 1–100, `template` 1–5000), `calendarioTextoSchema` (`mes` 1–12, `ano` 2000–2100), `TIPOS_COMUNICACAO`/`LABEL_TIPO_COMUNICACAO`/`tipoComunicacaoSchema`.
  - **`lib/actions/comunicacao.ts` (novo):** `gerarTextoComunicacao` (resolução variante do clube → *fallback* global; `Resultado<string>`), `gerarCalendarioTexto(mes, ano)` (treinos + jogos do mês nos **escalões legíveis**, via `escaloesLegiveis()`, aplicados ao template `CALENDARIO_MENSAL`), `listarModelosComunicacao()` (clube + globais, `orderBy [tipo, clubeId]` — em Postgres os NULL vão para o fim, logo a variante do clube vem primeiro), `editarModeloComunicacao` (**só** modelos do próprio clube; os globais do seed não são editáveis), `instalarSeedComunicacao()` (upsert por `clubeId_tipo`, `update: {}` — idempotente, nunca sobrepõe personalizações). Todas exigem `COMUNICACOES_GERIR`.
  - **Helpers de contexto:** `obterContextoConvocatoria(jogoId)` e `obterContextoResultado(jogoId)` devolvem `Record<string,string>` com os placeholders documentados (incl. `listaConvocados`, `marcadores`, `assistencias`, `equipaCasa`/`equipaFora` invertidos conforme `casaFora`, `resultado`, `prazoConfirmacao` = véspera às 20:00, sugestão editável). Validam clube + `COMUNICACOES_GERIR` + `podeLerEscalao` e **lançam** em caso de acesso inválido (quem devolve `Resultado<T>` à UI é `gerarTextoComunicacao`). Golos por registar aparecem como `?`.
  - **Fora de âmbito (cliente):** o **deep link** `whatsapp://send?text=…` (texto *encoded*) é construído no cliente; o backend nunca contacta o WhatsApp.
  - **Testes:** `tests/comunicacao.test.ts` (47 — substituição de placeholders, formatação de datas/listas, coerência dos 7 modelos de seed, schemas, e as actions com Prisma/permissões mockados: *fallback* de template, filtro por escalões legíveis, recusa de edição de global/outro clube, idempotência do seed, contextos de convocatória e resultado).
  - **Verificação:** `npm run typecheck` **0 erros**; `npm run lint` **0 erros/avisos**; `npm run test` **220/220** (10 ficheiros).
  - **Pendente (fase seguinte de F7):** ~~UI `/comunicacoes` (§8.12) com pré-visualização, edição de templates e botão "Partilhar no WhatsApp"~~ (feito — ver entrada «F7 — UI do gerador de comunicações»); execução do seed global em produção (`npm run db:seed:comunicacao`).

- **2026-08-06** — **F3 — Backend das bibliotecas (🎒 pessoal / 🏛️ clube) e dos templates de sessão.** Camada de schemas Zod + Server Actions sobre a migração M5 `f3a_exercicio_expand` (§3.3, §3.4, §4.2, §8.6, §8.7, §10, §16 fase 13).
  - **`lib/schemas/exercicio.ts`:** `exercicioSchema` ganha `parteTreino` (`AQUECIMENTO | PRINCIPAL | JOGO_REDUZIDO | RETORNO_CALMA`), `escalaoAlvo` (texto, máx. 40) e `proprietario` (`TREINADOR | CLUBE`, **default `TREINADOR`** — a propriedade é decidida pelo toggle na criação, §4.2, e não pela licença). Novos: `partilharExercicioSchema` (`{ exercicioId }`), `modeloSessaoExercicioSchema`, `criarModeloSessaoSchema` (nome, descrição, objetivo tático, fase da época, escalão-alvo, duração, propriedade e lista de exercícios — mín. 1, máx. 30, ordens únicas) e `criarSessaoDeTemplateSchema` (`modeloSessaoId`, `escalaoId`, `data`, `epocaId?`). Constantes/labels: `PARTES_TREINO`/`LABEL_PARTE_TREINO`, `PROPRIEDADES_CONTEUDO`/`LABEL_PROPRIEDADE_CONTEUDO`, `FASES_EPOCA`/`LABEL_FASE_EPOCA`.
  - **`lib/biblioteca.ts` (novo, módulo puro):** regras de visibilidade partilhadas pelas actions (que, sendo `"use server"`, não podem exportar funções síncronas). `filtroExerciciosVisiveis(clubeId, utilizadorId)` = 🎒 pessoais do próprio (`proprietario = TREINADOR` + `autorId`) ∪ 🏛️ do clube (`clubeProprietarioId`, **incluindo o legado `clubeId` enquanto o backfill M6 não corre**) ∪ partilhados no clube (`PartilhaExercicioClube`). `filtroModelosSessaoVisiveis(...)` = 🎒 pessoais + 🏛️ do clube. `origemDoItem(...)` classifica cada item como `PESSOAL`/`CLUBE` para a UI.
  - **`lib/actions/exercicios.ts`:** `listarExercicios(parteTreino?, categoria?, q?)` (nova assinatura, §10) devolve `ExercicioBiblioteca[]` (exercício + `origem`) já filtrado no servidor; `obterExercicio` passa a usar a mesma visibilidade. `criarExercicio` regista `autorId`, aplica o toggle `proprietario` (com `clubeProprietarioId` quando `CLUBE`) e mantém o **dual-write** dos campos legados `clubeId`/`criadorId` (fase expand). `atualizarExercicio` grava `parteTreino`/`escalaoAlvo` e **nunca** altera a propriedade; edição e remoção de exercícios 🎒 pessoais são reservadas ao autor (a partilha dá leitura, não escrita). `apagarExercicio` passa a bloquear também quando o exercício está em **templates de sessão** (além das sessões). Novas actions: `partilharExercicioNoClube(dados)` / `removerPartilhaNoClube(dados)` — toggle explícito, idempotente, **sem transferir a propriedade** (§3.3). `instalarBibliotecaArranque()` passa a ser **idempotente** (devolve `criados: 0` em vez de erro) e cria os exercícios com `proprietario = CLUBE` + `clubeProprietarioId` + `autorId`.
  - **`lib/actions/templatesSessao.ts` (novo):** `criarModeloSessao`, `atualizarModeloSessao` (substitui a lista de exercícios por inteiro, evitando colisões no unique `[modeloSessaoId, ordem]`), `listarModelosSessao(escalaoAlvo?)`, `obterModeloSessao(id)`, `apagarModeloSessao(id)`, `partilharModeloSessaoNoClube(id)` (contribuição transfere a propriedade para o clube), `criarSessaoDeTemplate(dados)` e `instalarTemplatesArranque()` (idempotente; exige a biblioteca de exercícios de arranque instalada). Permissão: `EXERCICIOS_GERIR` ou, em alternativa, `TREINOS_GERIR`; contribuir/gerir na biblioteca do clube exige sempre `EXERCICIOS_GERIR`. Todos os exercícios referenciados são validados contra a biblioteca visível.
  - **Criação de sessão a partir de template:** cópia completa (ordem reindexada 0..n-1, duração do template com fallback para a do exercício, notas) para `Sessao` + `SessaoExercicio`, **sem qualquer ligação persistente** ao template (§3.4). **Preservação de histórico (§3.3):** o registo da sessão é o snapshot do que foi feito — `SessaoExercicio.exercicioId` tem FK `onDelete: Restrict` e `apagarExercicio` bloqueia exercícios em uso, pelo que os planos de treino passados do clube continuam legíveis mesmo que o treinador autor saia.
  - **Conteúdo curado:** `lib/biblioteca-arranque.ts` ganha `parteTreino`/`escalaoAlvo?` em cada exercício e um 11.º exercício de **retorno à calma**; `lib/templates-arranque.ts` (novo) traz **3 templates** completos (aquecimento → parte principal → jogo reduzido → retorno à calma) para os períodos preparatório/competitivo.
  - **Nota de comportamento:** com o default `TREINADOR`, exercícios criados sem toggle passam a nascer na **biblioteca pessoal**; a contribuição para o clube é um gesto explícito (§4.2).
  - **Testes:** `tests/templates-sessao.test.ts` (25 — schemas F3, filtros de visibilidade, partilha idempotente, permissões de propriedade, cópia template→sessão e coerência do conteúdo curado) + 2 testes novos em `tests/actions.test.ts` (bloqueio por templates e por não-autor).
  - **Verificação:** `npm run typecheck` **0 erros**; `npm run lint` **0 erros/avisos**; `npm run test` **180/180** (9 ficheiros).

- **2026-08-06** — **F4 — Backend do modelo de jogo (documento vivo) e dos quadros táticos.** Camada de schemas Zod + Server Actions sobre a migração M8 (§3.6, §8.10, §13, §16 fase 14).
  - **`lib/schemas/modeloJogo.ts`:** `modeloJogoSchema` ganha `escalaoId`/`epocaId` (cuid opcional; `""` normaliza para `null` = limpar → portátil; `undefined` = não alterar), `subprincipios` (array de textos, máx. 50 × 300 caracteres) e `proprietario` (`CLUBE | TREINADOR`, default `CLUBE` — a escolha é do treinador na criação, §3.6). `quadroTaticoSchema` ganha `tipo` (`GERAL | BOLA_PARADA`, default `GERAL`); novo `criarQuadroTaticoSchema` (= `quadroTaticoSchema` + `jogoId`). Novos utilitários: `subprincipiosSchema`, `lerSubprincipios(raw)` (normaliza o `Json?` aceitando o formato simples `["…"]` e o estruturado `[{titulo, detalhe}]`), `LABEL_TIPO_QUADRO`, `TIPOS_QUADRO`.
  - **`lib/actions/modeloJogo.ts` — modelo de jogo:** `listarModelosJogo(escalaoId?, momento?)` (nova assinatura) devolve `ModeloJogoResumo[]`; ao filtrar por escalão inclui **sempre** os modelos com `escalaoId = null` (metodologia genérica portátil, transversal) e valida `podeLerEscalao`; sem escalão, restringe a `escaloesLegiveis()` quando o âmbito é `PROPRIOS_ESCALOES`. `obterModeloJogo` devolve `ModeloJogoDetalhe` (modelo + `escalao`/`epoca` + `subprincipiosLista` normalizada) e recusa se o escalão do modelo não for legível. `criarModeloJogo`/`atualizarModeloJogo` aceitam `escalaoId`/`epocaId`/`subprincipios`: com `proprietario = TREINADOR` o registo fica **portátil** (`clubeProprietarioId`, `escalaoId` e `epocaId` a `null`); com `CLUBE` valida que escalão e época **pertencem ao clube ativo** (bloqueia FK cross-club). Na atualização, `subprincipios`/`diagrama` omitidos **não são alterados** (array vazio limpa) e a mudança de escalão exige capacidade na **origem e no destino**.
  - **Âmbito de leitura:** `clubeProprietarioId = clube ativo` **OU** (`proprietario = TREINADOR` **e** `autorId = utilizador`) — a biblioteca pessoal viaja com o treinador (§3.6).
  - **`lib/actions/modeloJogo.ts` — quadros táticos (novos):** `listarQuadrosTaticos(jogoId, tipo?)`, `criarQuadroTatico(dados)`, `atualizarQuadroTatico(id, dados)`, `apagarQuadroTatico(id)`. Todos resolvem o jogo dentro do clube ativo (`jogo.escalao.clubeId`) antes de qualquer operação; leitura exige `podeLerEscalao(jogo.escalaoId)`, escrita exige `MODELO_JOGO_GERIR` **no escalão do jogo**. `revalidatePath("/jogos/{jogoId}")` + `"/modelo-jogo"` após mutações.
  - **Nota de âmbito:** `QuadroTatico` liga-se a **`jogoId`** (não a `modeloJogoId`) e usa os campos `nome`/`notas`, conforme §3.6 e o schema da migração M8.
  - **Testes:** `tests/modelo-jogo.test.ts` (23 — schemas, defaults, normalização de subprincípios) e `tests/modelo-jogo-actions.test.ts` (30 — âmbito de propriedade, filtros de escalão/momento/tipo, validação cross-club, permissões e semântica de omissão nos updates). Total **53 testes novos**.
  - **Verificação:** `npm run typecheck` **0 erros**; `npm run lint` **0 erros/avisos**; `npm run test` **suite completa verde**, incluindo os **53 testes novos** desta alteração.

- **2026-08-06** — **F1 — UI do plantel alinhada com as participações (`AtletaEscalao`).** Camada de apresentação do switch de código M3 (§8.5).
  - **Lista do plantel (`app/(app)/plantel/page.tsx`):** o número do cartão vem de `participacaoContexto?.numero` (número **do escalão em contexto**, não do atleta). Atletas com **mais do que uma participação** passam a mostrar um chip por escalão com **etiqueta de tipo** (Principal / Simult. / Ocas.); com uma só participação mantém-se a linha simples do escalão na tab «Todos». O aviso de número duplicado continua a ser calculado por `(escalaoId, numero)` entre participações ativas.
  - **Perfil do atleta (`app/(app)/plantel/[id]/page.tsx`):** nova aba **Participações** com o histórico completo (`listarParticipacoes`) agrupado por época — escalão, número, **tipo**, **estado** (Ativa / Transição permanente / Terminada) e período (início–fim). A aba Estatísticas passa a indicar o contexto (época · escalão · número da participação).
  - **Novos componentes (`components/plantel/`):** `AssociarEscalaoForm` (diálogo; escalão + tipo simultânea/ocasional + número opcional → `associarAEscalao`), `TransferirEscalaoForm` (diálogo; origem entre as participações **ativas** + destino + tipo + número, em branco mantém o número de origem → `transferirEscalao`), `TerminarParticipacaoButton` (confirmação → `terminarParticipacao`, só para participações ativas da época em curso), `ParticipacoesAtleta` (composição do histórico + ações) e `BadgesParticipacao` (etiquetas de tipo/estado, com variante compacta).
  - **Formulário de atleta (`AtletaForm`):** a participação inicial (escalão obrigatório + número opcional + tipo) é validada no cliente antes da submissão, com mensagem inline em vez de botão inerte; sem campos legados de escalão/número no atleta.
  - **Presenças (`MarcadorPresencas`):** ao marcar **Falta / Falta justificada / Lesionado** abre-se o seletor de **motivo** (Lesão · Doença · Outro · Sem justificação, ou «Não indicado»); o motivo é limpo automaticamente quando o atleta volta a Presente/Atrasado e segue no payload de `marcarPresencas`. Novo `ABREV_TIPO_PARTICIPACAO` em `lib/schemas/participacao.ts`.
  - **Verificação:** `npm run typecheck` **0 erros**, `npm run lint` **0 erros/avisos**, `npm run test` **155/155 passam** (novos testes: número em branco no formulário de participação e cobertura de rótulos de tipo/estado usados pelos badges).

- **2026-08-06** — **F7 M11 — Migração aditiva `f7_modelocomunicacao`.** Cria o modelo de dados dos templates de comunicação (§3.9, §8.12, §16 fase 17). **100% aditiva, risco zero.**
  - **Novo enum `TipoComunicacao`:** `CONVOCATORIA | CANCELAMENTO | MUDANCA_HORARIO | MUDANCA_LOCAL | RESULTADO | AVISO_GERAL | CALENDARIO_MENSAL` (7 valores).
  - **Novo modelo `ModeloComunicacao`:** `tipo`, `nome`, `template @db.Text` (placeholders `{{campo}}`), `clubeId String?` (+FK `Clube`, `onDelete: Cascade`), `origemSeed Boolean @default(false)`, `criadoEm`, `atualizadoEm`. `@@unique([clubeId, tipo])`, `@@index([tipo])`, `@@index([clubeId])`. Relação inversa `Clube.modelosComunicacao ModeloComunicacao[]`.
  - **`clubeId` nullable = modelos globais.** `null` → modelo instalado pelo seed, disponível a **todos** os clubes (evita replicar 7 linhas por cada clube criado); preenchido → variante personalizada do clube, que prevalece sobre a global para esse tipo. **Nota operacional:** em PostgreSQL os `NULL` são distintos num índice único, pelo que `@@unique([clubeId, tipo])` **não** impede globais duplicados — a unicidade dos globais é garantida pela idempotência do seed (`findFirst` por `clubeId: null, tipo` + `update`/`create`).
  - **Desvios face à redacção anterior de §3.9** (instrução explícita de F7, documentação alinhada neste passo): `conteudo` → `template`; `sistema` → `origemSeed` (nomenclatura já usada em `Exercicio` e `ModeloSessao`); `clubeId` passa de obrigatório a nullable; enum passa de 6 para 7 valores, separando `CANCELAMENTO_TREINO`→`CANCELAMENTO`, `MUDANCA_HORARIO_LOCAL`→`MUDANCA_HORARIO`+`MUDANCA_LOCAL` e `RESULTADO_JOGO`→`RESULTADO`. Sem impacto em dados existentes (o modelo não existia em base de dados).
  - **Seed:** `prisma/data-migrations/f7_seed_comunicacao.ts` (`MODELOS_COMUNICACAO_SEED`) com os 7 templates de arranque em pt-PT, formatados para WhatsApp (negrito `*…*`, itálico `_…_`, emojis). Script `npm run db:seed:comunicacao`. Idempotente e com validação final (falha se o número de globais divergir de 7). **Ainda não executado** — execução manual após o deploy.
  - **Risco zero:** o SQL gerado contém apenas `CREATE TYPE`, `CREATE TABLE`, `CREATE INDEX` e `ADD CONSTRAINT` — nenhum `DROP`, `RENAME`, `ALTER COLUMN`, `SET NOT NULL` ou alteração de dados existentes. Sem backfill necessário.
  - **Pendente (fase seguinte de F7):** actions `gerarTextoComunicacao`/`gerarCalendarioTexto` e CRUD `listarModelosComunicacao`/`criarModeloComunicacao`/`atualizarModeloComunicacao`/`apagarModeloComunicacao` (§13, capacidade `COMUNICACOES_GERIR`), schemas Zod e UI com botão "Partilhar no WhatsApp" (§8.12).

- **2026-08-06** — **F4 M8 — Migração aditiva `f4_modelojogo_quadro`.** Alinha o schema com §3.6 (modelo de jogo como documento vivo + bolas paradas nos quadros táticos). **100% aditiva, risco zero.**
  - **`ModeloJogo` (colunas novas, todas nullable):** `escalaoId` (+FK `Escalao`, relação `"ModeloJogoEscalao"`, `onDelete: SetNull`) e `epocaId` (+FK `Epoca`, relação `"ModeloJogoEpoca"`, `onDelete: SetNull`) — ambos `null` = **metodologia genérica portátil** do treinador (🎒); preenchidos = **documento da equipa** por escalão/época (🏛️). `subprincipios Json?` — array JSON de strings ou objectos `{titulo, detalhe}`; escolhido `Json` em vez de `String` para permitir subprincípios estruturados e ordenáveis sem migração futura de dados.
  - **`QuadroTatico`:** novo campo `tipo TipoQuadroTatico @default(GERAL)`, com o novo enum **`TipoQuadroTatico { GERAL, BOLA_PARADA }`** — permite distinguir esquemas de bola parada (canto/livre/lançamento) dos quadros gerais do jogo. O default garante que as linhas existentes ficam `GERAL` sem backfill.
  - **Relações inversas:** `Escalao.modelosJogo ModeloJogo[] @relation("ModeloJogoEscalao")` e `Epoca.modelosJogo ModeloJogo[] @relation("ModeloJogoEpoca")` (nomes distintos de `Utilizador.modelosJogo @relation("ModeloJogoAutor")`).
  - **Índices novos:** `ModeloJogo(clubeProprietarioId, escalaoId, epocaId)` (consulta principal do documento vivo), `ModeloJogo(escalaoId)` e `ModeloJogo(epocaId)`. O índice legado `ModeloJogo(clubeProprietarioId)` é **mantido** para que a migração não contenha nenhum `DROP`.
  - **Risco zero:** o SQL gerado contém apenas `CREATE TYPE`, `ADD COLUMN` (nullable ou com default), `CREATE INDEX` e `ADD CONSTRAINT` — nenhum `DROP`, `RENAME`, `ALTER COLUMN`, `SET NOT NULL` ou alteração de dados existentes. Sem backfill necessário.
  - **Pendente (fase seguinte de F4):** actions `criarModeloJogo`/`atualizarModeloJogo`/`apagarModeloJogo`/`listarModelosJogo(escalaoId?, momento?)` e `criarQuadroTatico`/`atualizarQuadroTatico`/`apagarQuadroTatico` (§13), schemas Zod e UI de documento vivo (§8.10, §16 fase 14).

- **2026-08-06** — **F1 M3 — Switch de código para `AtletaEscalao`.** Toda a lógica de leitura passa a usar as **participações** (§3.2, §8.5); os campos legados do `Atleta` (`escalaoId`, `escalaoSecundarioId`, `epocaId`, `numero`) deixam de ser lidos e só continuam a ser **escritos** (dual-write) até **M4** os remover, permitindo rollback de código sem migração.
  - **Permissões (`lib/permissoes.ts`):** novos helpers `podeLerAlgumEscalao(escalaoIds)` e `exigirCapacidadeEmAlgumEscalao(cap, escalaoIds)` — um atleta com participações em vários escalões é legível/editável por quem tiver âmbito sobre **pelo menos um** deles. `exigirCapacidadeEmAlgumEscalao` devolve `ResultadoPermissao` (não lança), mantendo a convenção `Resultado<T>` das Server Actions.
  - **Schemas:** `atletaSchema` dividido em `atletaPessoalSchema` (só dados pessoais; sai `escalaoId`/`escalaoSecundarioId`/`numero`) + `criarAtletaSchema` (com `participacaoInicial: { escalaoId, numero?, tipo }`). Novo `lib/schemas/participacao.ts` (`associarAEscalaoSchema`, `transferirEscalaoSchema`, `terminarParticipacaoSchema`, rótulos de tipo/estado). `presencaSchema` ganha `motivo` (`MotivoFalta` nullable). **Número de camisola: 1–999** (era 1–99), por escalão.
  - **Nova action `lib/actions/participacoes.ts`:** `associarAEscalao` (`PLANTEL_GERIR` no escalão), `transferirEscalao` (`PLANTEL_GERIR` na **origem e no destino**; transacção que fecha a origem como `TRANSICAO_PERMANENTE` + upsert do destino `ATIVO`), `terminarParticipacao` (`PROMOVER_ATLETAS`, capacidade de clube; passa a `INATIVO` com `dataFim`) e `listarParticipacoes` (histórico). Unicidade de número validada por `(escalaoId, epocaId, numero)` entre participações ativas.
  - **`atletas.ts` reescrito:** `listarAtletas(escalaoId?, epocaId?)` conduzida por `AtletaEscalao` quando há escalão, por `Atleta` + `participacoes.some` caso contrário; devolve `AtletaComParticipacao` (`participacoes[]` + `participacaoContexto`). `criarAtleta` cria atleta (com `clubeId`) **e** participação inicial numa transacção. `atualizarAtleta` só toca em dados pessoais. `apagarAtleta` filtra por `clubeId`. `obterEstatisticasAtleta(id, escalaoId?)` calcula por escalão de contexto (presenças via `Presenca.escalaoId`, sessões desde o ingresso).
  - **Restantes actions:** `jogos.definirConvocatoria` valida convocáveis por participação **ATIVA** no escalão/época do jogo; `jogos.obterJogo` e `treinos.obterSessao` resolvem o número via `numeroPorAtleta` (query adicional a `AtletaEscalao`); `treinos.marcarPresencas` grava `escalaoId` da sessão + `motivo`; `escaloes.apagarEscalao` conta participações; `caderneta`/`analise` autorizam por participações activas; `relatorios.nAtletas` e o contador do dashboard contam participações activas.
  - **Verificação:** `npm run typecheck` **0 erros**, `npm run lint` **0 erros/avisos**, `npm run test` **98/98 passam** (novos testes de `criarAtletaSchema`, schemas de participação, motivo de falta, dual-write de `criarAtleta` e convocatória por participação).

- **2026-08-06** — **F3 M5 — Migração expand `f3a_exercicio_expand`.** Primeira fase (expand, **aditiva**) da formalização das duas bibliotecas de exercícios (🎒 pessoal / 🏛️ clube) e dos templates de sessão (§3.3, §3.4).
  - **Novo enum `ParteTreino`:** `AQUECIMENTO | PRINCIPAL | JOGO_REDUZIDO | RETORNO_CALMA` (conforme §3.3).
  - **`Exercicio` (colunas novas, todas nullable):** `autorId` (+FK `Utilizador`, relação `"ExercicioAutor"`) — autor humano, substitui semanticamente `criadorId`; `clubeProprietarioId` (+FK `Clube`, relação `"ExercicioClube"`) — preenchido quando `proprietario = CLUBE`; `parteTreino`; `escalaoAlvo`. O campo `objetivo` já existia. **Legado mantido nesta fase:** `clubeId`, `criadorId` e `proprietario @default(CLUBE)` coexistem até ao switch de código; o default passará a `TREINADOR` e os legados serão removidos na fase **contract**, após validação.
  - **Novo modelo `PartilhaExercicioClube`:** toggle explícito de contribuição de um exercício para a biblioteca de um clube (`@@unique([exercicioId, clubeId])`), com FKs `onDelete: Cascade` para `Exercicio` e `Clube`.
  - **Novos modelos `ModeloSessao` e `ModeloSessaoExercicio`:** templates de sessão completos (autor, `proprietario` default `TREINADOR`, `clubeProprietarioId`, `origemSeed`, `objetivoTatico`, `faseEpoca`, `escalaoAlvo`, `duracaoMin`) e respectivas linhas ordenadas (`@@unique([modeloSessaoId, ordem])`, `parteTreino` por linha, `onDelete: Restrict` no exercício para impedir apagar exercícios em uso).
  - **Índices novos:** `Exercicio(autorId)`, `Exercicio(clubeProprietarioId)`, `Exercicio(parteTreino)`, `PartilhaExercicioClube(clubeId)`, `ModeloSessao(autorId)`, `ModeloSessao(clubeProprietarioId)`, `ModeloSessaoExercicio(modeloSessaoId)`, `ModeloSessaoExercicio(exercicioId)`.
  - **Risco zero:** o SQL gerado contém apenas `CREATE TYPE`, `ADD COLUMN` nullable, `CREATE TABLE`, `CREATE INDEX` e `ADD CONSTRAINT` — nenhum `DROP`, `ALTER COLUMN` ou alteração de dados existentes.
  - **Backfill (M6):** ainda **não** criado nem executado — preencherá `autorId` a partir de `criadorId` e `clubeProprietarioId` a partir de `clubeId` (execução manual após o deploy do código switch, como em F1 M3).

- **2026-08-06** — **F1 M2 — Migração expand `f1a_atletaescalao_expand`.** Primeira fase (expand) da reconversão do plantel para participação N-N atleta↔escalão (§3.2, §8.5).
  - **Novos enums:** `TipoParticipacao` (PRINCIPAL/SIMULTANEA/OCASIONAL), `EstadoParticipacao` (ATIVO/TRANSICAO_PERMANENTE/INATIVO), `MotivoFalta` (LESAO/DOENCA/OUTRO/SEM_JUSTIFICACAO).
  - **Novo modelo `AtletaEscalao`:** participação N-N entre `Atleta` e `Escalao` por época, com tipo, estado, número por escalão e datas de início/fim. Substitui as FKs directas `Atleta.escalaoId`/`escalaoSecundarioId`/`epocaId`/`numero` — estas **ainda existem na fase expand** e serão removidas em **M4**, após validação do switch de código.
  - **`Atleta`:** adicionado `clubeId String?` (o atleta passa a pertencer ao **clube** directamente, não ao escalão); adicionada relação `participacoes AtletaEscalao[]`.
  - **`Presenca`:** adicionados `escalaoId String?` (escalão da sessão, necessário para taxa de presença por escalão) e `motivo MotivoFalta?` (motivo estruturado de falta).
  - **Backfill:** script `prisma/data-migrations/f1b_backfill_participacoes.ts` criado (execução **manual** após deploy do código switch); preenche `Atleta.clubeId`, cria participações PRINCIPAL/SIMULTANEA e preenche `Presenca.escalaoId`.
  - **Testes:** **86/86 passam** após a migração.

- **2026-08-05** — **F2 — Editor de campo (gate de qualidade).** Revisão e robustez do diferenciador central (secção 11).
  - **Bugs corrigidos:** B1 `setPointerCapture`/`releasePointerCapture` (drag deixa de se perder fora do SVG em tablet); B2 snapshot pré-drag capturado no `pointerDown` e gravado no histórico no `pointerUp` (undo reverte o drag); B3 anel de selecção de setas/linhas usa o **primeiro ponto do trajecto** (`ancoraElemento`) em vez de (0,0); B4 editor grava **sempre `versao: 2`**; B5 hit area em px→unidades via escala (alvo ≥32px real); B6 playback em `ref` (sem closures obsoletas no RAF).
  - **Novos hooks:** `components/campo/useEscalaCampo.ts` (px/unidade via `ResizeObserver`) e `components/campo/usePointerDrag.ts` (captura de ponteiro, conversão cliente→viewBox, snapshot pré-drag, `raioHitEfetivo`).
  - **Módulo puro:** `components/campo/animacao.ts` — `construirKeyframes` (herança de keyframe anterior; delta), `calcularDelta`, `ease`, `elementoEmPonto`, `ancoraElemento`, `posicoesBase`, `raioHitEfetivo`, `rotuloElemento`.
  - **Autoria de animação:** modo animação no `EditorCampo` com `TimelinePassos` (chips Início/1..N, reordenar ↑/↓, eliminar, `duracaoMs`), "Adicionar passo" (delta) e **setas-fantasma** de trajecto (derivadas). Convenção **base ⇄ passos** (secção 11.2).
  - **Playback:** `CampoAnimado` refactorizado com `ControlosPlayback` (play/pause, reiniciar, loop, velocidade ×0.5/×1/×2), easing suave e respeito por `prefers-reduced-motion` (avanço passo-a-passo sem tween).
  - **Acessibilidade de teclado** no editor (setas/Shift, Delete, Ctrl+Z, Esc; foco visível; `aria-live`).
  - **Schema (`lib/schemas/exercicio.ts`):** `DIAGRAMA_VAZIO_V2`; campo `equipa` opcional em `Jogador`. Secções 11.2/11.3 reescritas.
  - **Testes:** 19 novos em `tests/campo.test.ts` (`construirKeyframes`/herança, delta, `ease`, hit-test expandido, âncora de seta). **86/86 total.** typecheck e lint limpos.

- **2026-08-05** — **F0 — Fundação de permissões (concluído).**
  - **Migração M1 (`f0_overrides_membro`):** `MembroClube.capacidadesExtra String[] @default([])` + `capacidadesRevogadas String[] @default([])`.
  - **`lib/permissoes-catalogo.ts`:** adicionadas capacidades `PROMOVER_ATLETAS`, `COMUNICACOES_GERIR`, `LEMBRETES_EQUIPA_GERIR` (activas); `FATURACAO_GERIR` marcada FUTURO (constante `CAPACIDADE_FUTURA_FATURACAO`, fora do catálogo activo). Templates `PERFIS_ARRANQUE` atualizados: Admin e DT ganham as 3 novas; Treinador não tem `LEMBRETES_EQUIPA_GERIR` por defeito (concedível via override).
  - **`lib/permissoes.ts`:** nova função pura `capacidadesEfetivas(base, extra, revogadas)` = `(base ∪ extra) \ revogadas`, filtra capacidades FUTURO; `obterMembroAtual` passa a devolver capacidades efetivas.
  - **`lib/schemas/membro.ts`:** schema Zod `definirOverridesSchema`.
  - **`lib/actions/membros.ts`:** nova Server Action `definirOverrides` (valida delegação — só concede o que o próprio tem; protege último admin efectivo; transação para evitar race condition).
  - **`lib/actions/utilizadores.ts` (fix):** `ficariaSemAdmin` atualizado para usar `capacidadesEfetivas` em vez de capacidades base — fecha dois furos: admin só via `capacidadesExtra` era ignorado; admin revogado via `capacidadesRevogadas` continuava a contar.
  - **Testes:** 16 novos em `tests/permissoes-overrides.test.ts` (67/67 total).

- **2026-08-05** — **Criação da bíblia v6** (`FutsalManager_Spec_v6.md`). Novo ficheiro que sucede à v5 (mantida intacta como histórico) e incorpora todas as decisões do brainstorming descritas na entrada seguinte (licenciamento/ecossistema, refactor do plantel, bibliotecas + templates, modelo de jogo + bolas paradas, jogos/scouting/blocos, competições/classificação manual, comunicação WhatsApp, Google Calendar, analytics 3 níveis + relatório partilhável, onboarding, conformidade FPF, design direction/tema escuro/motion, dashboard contextual, lembretes/to-dos). A partir da v6, esta é a bíblia ativa do produto.

- **2026-08-05** — **Atualização maior: modelo de negócio, ecossistema e novas funcionalidades (pós-brainstorming).**
  - **Licenciamento (§17, §3.11, §16 fase 21):** duas licenças (Individual €4,99/mês·€49/ano; Clube por tiers de escalões: Pequeno ≤2 €15/€149, Médio ≤4 €19/€190, Grande ≤8 €34/€340, Parceiro negociado). Multi-tenant único com **clube técnico invisível** para o modo Individual (§1.2.1, §5.2). Entidades `Licenca`, `Carteira`, `MovimentoCarteira`. **Absorção** com crédito proporcional para carteira; reembolso só manual; clube paga preço normal. **Billing Paddle deferido** (arquitetura pronta). Go-to-market (sem trial, vídeo público, demo a pedido, parceiros fundadores, suporte WhatsApp).
  - **Papéis e permissões (§6):** hierarquia Admin→DT→Treinador; **overrides por membro** (`capacidadesExtra`/`capacidadesRevogadas`) com **regra de delegação** (só atribuir ≤ às próprias); **visibilidade do DT configurável**; novas capacidades `PROMOVER_ATLETAS`, `COMUNICACOES_GERIR`, `FATURACAO_GERIR` (FUTURO). `capacidadesEfetivas`.
  - **Plantel (§3.2, §8.5, §16 fase 11):** `Atleta` passa a pertencer ao **clube**; relação **N-N** via `AtletaEscalao` (tipo PRINCIPAL/SIMULTANEA/OCASIONAL, estado ATIVO/TRANSICAO_PERMANENTE/INATIVO, número por escalão, datas). **Número por escalão.** Presenças/estatísticas **por escalão** + vista conjunta. **Lesões como motivo de falta** (`Presenca.motivo`). **Tempo de jogo por blocos** (`BlocoTempo`).
  - **Exercícios e bibliotecas (§3.3, §4.1–4.2, §8.6, §17.3, §16 fases 12–13):** **duas bibliotecas** (pessoal 🎒 + clube 🏛️) com toggle de partilha; `parteTreino`/`escalaoAlvo`; biblioteca de exemplo curada por parte do treino/objetivo/escalão; **editor** marcado como diferenciador prioritário (fase 12). **Templates de sessão** (`ModeloSessao`). **DECISÃO DEFINITIVA de propriedade (substitui a anterior):** a propriedade é **decidida pelo treinador no toggle na criação** (pessoal=`TREINADOR` default / clube=`CLUBE`), **NÃO pela licença**. A **biblioteca pessoal é sempre do treinador** e viaja com ele por toda a carreira; a **biblioteca do clube** é a filosofia/identidade do clube e fica. Revoga a decisão anterior ("conteúdo criado sob licença de clube → CLUBE").
  - **Modelo de jogo (§3.6, §8.10, §16 fase 14):** documento vivo por clube/escalão/época + `subprincipios`; **bolas paradas** integradas (editor + quadros táticos).
  - **Jogos (§3.7, §8.11, §16 fase 15):** **vista de dia de jogo** (convocados+posições, scouting, bolas paradas, hora/local); **scouting no próprio jogo** (`ObservacaoAdversario.jogoId`); posição prevista/titular na convocatória; substituições com bloco de tempo.
  - **Competições (§3.7, §8.11, §16 fase 16):** **tabelas de classificação por inserção manual** de resultados de todas as equipas (`ResultadoCompeticao`, `FormatoCompeticao`, `obterClassificacao`). **Sem integração automática na v1**; integração com APIs de competições oficiais = FUTURO (§18).
  - **Comunicação (§3.9, §8.12, §16 fase 17):** **gerador de conteúdo para WhatsApp** (`ModeloComunicacao`, `gerarTextoComunicacao`); a app gera texto, não é canal; pais sem conta.
  - **Reuniões/Calendário (§3.12, §8.13, §16 fase 18):** **sincronização Google Calendar** (`IntegracaoCalendario`, `googleEventId`).
  - **Analytics/Relatórios (§10, §8.15, §16 fase 19):** **3 níveis (atleta/equipa/clube)**; **relatório de época partilhável** (`RelatorioPartilhado`: PDF + link web com identidade do clube + snapshot).
  - **Onboarding (§8.1, §16 fase 20):** registo recolhe **só o essencial** (Individual: nome/email/password; Clube: + nome do clube); **setup completo do clube (logo, cores, escalões) no primeiro ecrã pós-primeiro-login** (onboarding guiado, fora do formulário de pagamento). **Vitória rápida** (criação em massa, sessão de template, primeira convocatória).
  - **Conformidade FPF (§8.18, §16 fase 22):** exportação Modelo 2 e documentos federativos — **requer levantamento**.
  - **Infra/custos (§15.6):** Vercel Pro + Supabase Free (keep-alive via GitHub Actions) ≈ €19/mês; escala por upgrades; Paddle deferido.
  - **Design direction (§12.0, §12.1–12.4, §13, §16 fase 24):** **tema escuro como base** (fundo `#0F0E13`, superfícies `#1C1B22`/`#2A2933`, acento laranja `#F0531E`; Bricolage Grotesque com presença, números de estatística grandes/bold); **cor do clube como identidade** (sidebar + acentos com as duas cores dominantes; logótipo presente; Individual = laranja domina); **motion como linguagem** (transições de página fade+8px, cascata de listas 40ms, gráficos que se desenham, números que contam 0→valor, micro-celebrações de presença/golo, skeleton com shimmer, 5 estados de botão); **empty states desenhados** com ilustração; editor de campo com pitch escuro; `prefers-reduced-motion`. *(Supersede o "sem dark mode na v1" e o fundo papel claro anteriores.)*
  - **Dashboard contextual (§8.16):** centro de comando **temporal** — treino de hoje domina; senão, countdown de jogo iminente; secção "atenção necessária" (ata não lida, convocatória por enviar, treino não planeado, atletas abaixo da presença mínima, lembretes com deadline).
  - **Lembretes / to-dos (§3.15, §6.2, §7.3, §8.19, §16 fase 24):** `Lembrete` + `LembreteDestinatario`; âmbito **PESSOAL** (qualquer membro) / **EQUIPA** (`LEMBRETES_EQUIPA_GERIR`); deadline opcional; feito individualmente; integrados no dashboard.
  - **Roadmap (§18):** atualizado (quotas, app nativa, portal de pais, IA, vídeo, wearables, clínica, multi-idioma, portal de futsal).

- **2026-08-06** — **F8 — Integração Google Calendar (§3.12, §8.13, §16 fase 18) implementada** (camada server-side; integração de terceiros, distinta do login/autenticação da app).
  - **`lib/google-calendar.ts`:** módulo puro. `criarClienteGoogle`, `obterUrlConsentimento`, `trocarCodePorTokens`, CRUD de eventos (`criar/actualizar/apagarEventoCalendario`), mapeadores `eventoParaSessao`/`eventoParaJogo`, helpers `googleCalendarConfigurado`/`obterRedirectUri`. Usa `googleapis` (OAuth Google + Calendar v3); scope `calendar.events`, `access_type=offline`. Se `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` ausentes → erro claro (sem crash).
  - **`lib/crypto.ts`:** encriptação at-rest do refresh token — AES-256-GCM com `ENCRYPTION_KEY` (hex 64 chars); fallback Base64 com aviso em dev (graceful degradation).
  - **`app/api/google/callback/route.ts`:** callback OAuth GET (fora do grupo `(app)`, sem middleware de auth) — troca `code` por tokens, faz upsert de `IntegracaoCalendario` (refreshToken encriptado), redireciona para `/definicoes/integracao?sucesso|erro=calendar`.
  - **`lib/actions/integracao.ts`:** Server Actions `obterUrlAutorizacaoCalendario`, `obterIntegracaoCalendario`, `desconectarGoogleCalendar`, `sincronizarComCalendario("SESSAO"|"JOGO", id)` (fire-and-forget, idempotente via `googleEventId`, com scoping por clube).
  - **`lib/schemas/integracao.ts`:** `googleCallbackSchema`, `tipoSincronizacaoSchema`.
  - **Dependência:** `googleapis` (`npm audit --omit=dev` = 0 vulnerabilidades). **Env:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `ENCRYPTION_KEY`, `NEXTAUTH_URL` adicionadas ao `.env.example`.
  - **Testes:** 13 novos em `tests/integracao-calendario.test.ts` (crypto round-trip GCM/Base64, mapeamento de eventos, configuração). **Total: 597.** Não toca em `middleware.ts` nem `lib/auth.ts`.
- **2026-08-06** — **F8 FE — UI de integração Google Calendar (§3.12, §8.13)** (camada frontend; consome as Server Actions server-side já existentes; não toca em auth/middleware).
  - **`app/(app)/definicoes/integracao/page.tsx`:** Server Component. Lê estado via `obterIntegracaoCalendario()` e configuração via `googleCalendarConfigurado()` (import directo, função pura). Card "Google Calendar" com três estados — **não configurado** (banner "requer configuração do servidor"), **configurado + não ligado** (botão "Ligar Google Calendar"), **configurado + ligado** (badge verde "Ligado" + data de ligação + botão "Desligar"). Lê `searchParams` `sucesso`/`erro` do callback OAuth.
  - **`components/integracoes/LigarCalendarioButton.tsx`:** Client Component (`useTransition`) — obtém URL de consentimento via `obterUrlAutorizacaoCalendario()` e redirecciona (`window.location.href`); toast de erro em falha.
  - **`components/integracoes/DesligarCalendarioButton.tsx`:** Client Component (`useTransition` + `AlertDialog` de confirmação) — `desconectarGoogleCalendar()` + toast + `router.refresh()`. Confirma que eventos já criados não são apagados (§8.13).
  - **`components/integracoes/NotificacaoCalendario.tsx`:** Client Component que dispara toast de sucesso/erro a partir dos `searchParams` do callback e limpa o URL (`router.replace`) para evitar repetição.
  - **`app/(app)/definicoes/page.tsx`:** nova secção "Integrações" (ícone `Plug`).
  - **Verificação:** `typecheck` 0 erros, `lint` 0 erros, **597 testes** a passar. TypeScript strict, sem `any`, PT-PT. Não toca em `middleware.ts` nem `lib/auth.ts`.

> **Nota:** as entradas abaixo (até 2026-07-31) foram herdadas da `FutsalManager_Spec_v5.md` e mantêm-se como histórico do MVP e do produto final v1.

- **2026-08-02** — **Preparação para deploy (Vercel).** `binaryTargets` do Prisma; `docs/DEPLOY.md`.
- **2026-08-02** — **Gráficos com a cor do clube + fluxo de entrada.** Séries com `--cor-primaria`; sessão inválida → `/login`.
- **2026-08-02** — **Rebranding: FutsalManager → FutsalCoach + nova identidade visual.** Marca fixa + cor do clube dinâmica; Bricolage Grotesque + Inter; neutros quentes; §12 atualizada.
- **2026-08-02** — **Fix: sessão obsoleta em `criarClube`.**
- **2026-08-02** — **Sincronização da bíblia com o código** (§3 exercícios/subcategorias/tipoSessao; §12 tokens; §5.5 RGPD).
- **2026-08-02** — **Decisão RGPD — consentimento tratado pelo clube.**
- **2026-08-02** — **Auditoria de produção — Fases 0–6** (build, segurança, dados, ops, visual/a11y, testes). 51 testes.
- **2026-08-02** — **Grupos D e E** (categoria+subcategorias de exercício; gráficos SVG).
- **2026-08-02** — **Grupo B** (periodização smart + tipo de sessão).
- **2026-08-01** — **Grupos A e C** (modelo do atleta: posições múltiplas/escalão secundário/foto/encarregado; "Equipa técnica"); melhorias pós-review.
- **2026-08-01** — **Fases 3–10 implementadas** (periodização, modelo de jogo, jogos avançado, animação, reuniões, relatórios+PDF, biblioteca curada, PWA/polish).
- **2026-07-31** — **Fases 1–2 + bíblia completa** (esqueleto, reconversão de módulos; todas as secções redigidas).
- **2026-07-31** — Validação do modelo de dados e decisões de propriedade (uma adesão ativa; propriedade segue a licença; carreira). *(A decisão de propriedade "segue a licença" foi revogada em 2026-08-05 — ver §4.2.)*
- **2026-07-31** — Criação da bíblia v5.
