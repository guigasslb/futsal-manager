# Mister — Especificação do Produto Final (v5)

> **Estatuto:** Bíblia do produto. Fonte única de verdade. Substitui o `Mister_Spec_v4_MVP_historico.md` (arquivado).
> **Regra de ouro:** nenhuma alteração de código sem a atualização correspondente neste documento, no mesmo passo. Toda a modificação é registada no **changelog (secção 19)** com data e descrição. Se o código se perder, este documento tem de permitir recriar tudo do zero a 100%.
> **Convenções:** **DEVE** = obrigatório · **DEVERIA** = recomendado · **FUTURO** = fora do âmbito da v1 do produto final.
> **Marcas de propriedade de dados:** 🏛️ = dado do **clube** (fica no clube) · 🎒 = **portátil** (pertence ao treinador e viaja com ele) — ver secção 4.

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
O **Mister** é uma aplicação **web (PWA)** de gestão de treino e de clube dedicada ao **futsal de formação**, em português de Portugal. Permite a um treinador planear e conduzir a época — plantel, periodização, treinos, exercícios com diagramas de campo, presenças, jogos com estatísticas, convocatórias, caderneta de desenvolvimento do atleta, scouting e reuniões — e permite a um **clube** organizar vários escalões e treinadores num único ecossistema com permissões.

### 1.2 O modelo "2 em 1" (posicionamento central)
O produto funciona a dois níveis, com o mesmo código:
- **Individual:** um treinador usa-o sozinho, com a sua conta e o seu portfólio de trabalho.
- **Clube (ecossistema):** um clube tem vários escalões e treinadores, dados partilhados e permissões por papel.

Esta dualidade é a vantagem competitiva. O concorrente de referência (**Dossier do Treinador**) é **apenas individual** (uma equipa por conta, sem partilha editável entre contas — confirmado no FAQ oficial). O Mister é individual **e** plataforma de clube.

### 1.3 Estratégia de venda
- Venda **individual** (licença de treinador).
- Venda **por clube:** X licenças de treinador + **licença de ecossistema** (o espaço do clube com escalões, permissões e branding).
- Percurso típico do dono do produto: usar na prática com a sua equipa técnica → demonstrar ao clube → o clube adere. Se o clube não aderir, o treinador continua a usar individualmente.

### 1.4 Princípios de design (inquebráveis)
1. **Útil primeiro, mas visualmente e experiencialmente interessante.** Cada esforço pedido ao treinador devolve algo visual e satisfatório (marcar presenças → ver a taxa subir; registar um golo → ver o gráfico crescer; desbloquear uma habilidade → celebração).
2. **O mais barato possível de operar.** Sem custos recorrentes de IA no núcleo. Só alojamento + base de dados. **A IA fica fora do núcleo** (quando muito, plugin pago futuro).
3. **Futsal a sério**, não futebol adaptado: campo com dimensões corretas, terminologia FPF, estatísticas específicas (faltas acumuladas por parte, rotações/quintetos, power play/GR-jogador).
4. **Beira-campo real:** o "modo jornada" tem de funcionar com rede fraca (PWA + offline) e poucos toques.
5. **Desenvolvimento do atleta como alma:** a caderneta e o tracking de evolução por jogador são o coração emocional e o argumento de venda aos pais.
6. **Português de Portugal**, terminologia do Anexo (secção 2).
7. **Documentação sempre atualizada** (regra de ouro no topo).

### 1.5 Âmbito da v1 do produto final
**Incluído (núcleo — uso prático do treinador + equipa técnica):**
- Esqueleto: utilizador independente + adesão a clube + propriedade de dados + RGPD + permissões configuráveis + branding do clube.
- Plantel/atletas · Escalões · Épocas.
- Exercícios: editor de campo + **animação básica (A→B)** + biblioteca (curada de arranque + criada pelo treinador).
- Treinos: sessões + **notas de treino** + presenças.
- **Periodização:** planos semanais e mensais (microciclos/mesociclos).
- **Modelo de jogo + quadro tático por jogo** (reutiliza o editor de campo).
- Jogos (amigável/competição): convocatória + estatísticas de futsal + **registo ao vivo ou pós-jogo** + relatório + **vídeo por link YouTube**.
- **Calendário + competições + scouting do adversário.**
- **Reuniões (escalão/clube) com ata exposta.**
- **Caderneta de habilidades.**
- **Tracking e relatório de fim de época** (equipa e por jogador, a partir dos dados — **sem IA**).
- **Relatórios PDF** profissionais e simples.
- Dashboard.

**FUTURO (fora da v1):**
- Portal de pais (leve, comunicação de convocatória/comunicados via WhatsApp, gratuito).
- Camada de gestão de clube (quotas/pagamentos, material, espaços, documentos) — só quando um clube adotar.
- IA (geração de exercícios/planos/relatórios) como plugin pago.
- Biblioteca partilhada/comunidade de exercícios (provavelmente não — "o treino é o segredo").

### 1.6 Anti-âmbito (decisões conscientes)
- **Sem IA no núcleo** (custo).
- **Sem armazenamento de vídeo** (só links YouTube — pesado/caro).
- **Sem app nativa/APK** na v1 — a PWA cobre Android e iOS numa só base de código; APK só como embrulho fino (TWA/Capacitor) no futuro, se necessário.
- Sem competir pela "largura" do concorrente em módulos que fujam ao treino, até haver um clube pagante que os peça.

---

## 2. Glossário e terminologia

Interface 100% em **português de Portugal**, terminologia FPF/futsal. Usar sempre estes termos (não sinónimos).

**Organização**
- **Clube** — a organização (ecossistema). Tem escalões, membros, épocas, branding.
- **Ecossistema** — o espaço partilhado do clube (vários escalões e treinadores com permissões).
- **Escalão** — grupo etário/nível (Traquinas, Benjamins, Infantis, Iniciados, Juvenis, Juniores, Séniores). É a "equipa" na prática.
- **Época** — ano desportivo (ex: "2026/27"). Uma ativa de cada vez por clube.
- **Membro** — utilizador ligado a um clube com um perfil.
- **Perfil** — pacote configurável de permissões (capacidades + âmbito).

**Pessoas**
- **Atleta** — jogador do plantel de um escalão numa época.
- **Plantel** — conjunto de atletas de um escalão numa época.
- **Treinador Principal / Adjunto / Diretor Técnico / Administrador** — papéis de arranque (perfis).
- **Encarregado de educação** — responsável legal do atleta menor (RGPD).

**Treino**
- **Sessão** — uma sessão de treino (data, objetivo, exercícios, presenças).
- **Exercício** — unidade de treino, com diagrama de campo opcional.
- **Microciclo** — semana de treino. **Mesociclo** — bloco de semanas. **Período** — Preparatório / Competitivo / Transição.
- **Periodização** — planeamento por ciclos (semanal/mensal).
- **Presença** — estado do atleta numa sessão (Presente, Falta, Falta justificada, Lesionado, Atrasado).

**Jogo**
- **Jogo** — encontro (Oficial ou Amigável), Casa/Fora.
- **Convocatória** — atletas convocados para um jogo.
- **Utilização** — Titular / Utilizado / Não utilizado.
- **Quinteto** — os 5 jogadores em campo (futsal). **Rotação** — trocas constantes características do futsal.
- **Faltas acumuladas** — faltas da equipa por parte; à 5ª, livre sem barreira (10 m).
- **Power play / GR-jogador** — guarda-redes a jogar como 5.º jogador de campo.
- **Modelo de jogo** — a forma de jogar (princípios por momento). **Quadro tático** — esquema tático de um jogo específico.
- **Scouting / Observação do adversário** — recolha de informação sobre o adversário.

**Desenvolvimento**
- **Caderneta** — sistema de habilidades que o atleta desbloqueia ao longo da época.
- **Habilidade** — "move" técnico (vírgula, flip-flap, elástico, chapéu…), por nível (Básico/Intermédio/Avançado).
- **Relatório de fim de época** — síntese por equipa e por atleta, a partir dos dados.

**Dados**
- **Portátil (🎒)** — dado que pertence ao treinador e viaja com ele.
- **Do clube (🏛️)** — dado que fica no clube quando o treinador sai.
- **Snapshot** — cópia só-de-leitura que o clube retém de conteúdo do treinador usado em sessões.

---

## 3. Modelo de dados completo

Stack de persistência: **Prisma + PostgreSQL (Supabase)**. Todos os `id` são `cuid`. Todas as datas são `DateTime`. Convenção de propriedade: 🏛️ clube · 🎒 portátil (treinador).

> **Nota:** este é o modelo-alvo do produto final. O schema do MVP (histórico v4) é um subconjunto; a migração para este modelo faz parte da Fase 1 (esqueleto). Decisões ainda **a validar** estão marcadas com ⚠️.

### 3.1 Contas, clube e permissões (o esqueleto)

```prisma
// 🎒 Existe independentemente de qualquer clube (suporta o modo individual e a portabilidade).
model Utilizador {
  id           String   @id @default(cuid())
  nome         String
  email        String   @unique
  passwordHash String
  telefone     String?
  criadoEm     DateTime @default(now())
  atualizadoEm DateTime @updatedAt

  membros        MembroClube[]       // adesões a clubes
  exercicios     Exercicio[]         // 🎒 biblioteca pessoal (autor)
  modelosJogo    ModeloJogo[]        // 🎒 modelos de jogo (autor)
  registoCarreira RegistoCarreira[]  // 🎒 histórico de carreira portátil
}

// 🏛️ O ecossistema.
model Clube {
  id            String   @id @default(cuid())
  nome          String
  corPrimaria   String   @default("#1A2FD4")
  corSecundaria String   @default("#FFD700")
  logoUrl       String?  // ficheiro no Supabase Storage
  morada        String?
  email         String?
  telefone      String?
  criadoEm      DateTime @default(now())

  membros     MembroClube[]
  perfis      Perfil[]
  epocas      Epoca[]
  escaloes    Escalao[]
  habilidades Habilidade[]
  metricas    MetricaConfig[]
  competicoes Competicao[]
  reunioes    Reuniao[]
}

// Adesão utilizador↔clube. REGRA: no máximo UMA adesão ATIVA por utilizador (um clube de
// cada vez). Adesões anteriores ficam como histórico (estado INATIVO) — suporta a portabilidade
// ao mudar de clube. Dentro do clube ativo, o membro pode gerir vários escalões (AtribuicaoEscalao).
model MembroClube {
  id            String       @id @default(cuid())
  utilizadorId  String
  utilizador    Utilizador   @relation(fields: [utilizadorId], references: [id])
  clubeId       String
  clube         Clube        @relation(fields: [clubeId], references: [id])
  perfilId      String
  perfil        Perfil       @relation(fields: [perfilId], references: [id])
  estado        EstadoMembro @default(ATIVO) // ATIVO | INATIVO | CONVIDADO
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
  clube       Clube        @relation(fields: [clubeId], references: [id])
  nome        String       // ex: "Administrador", "Diretor Técnico", "Treinador Principal", "Adjunto"
  descricao   String?
  ambito      AmbitoPerfil @default(PROPRIOS_ESCALOES) // TODO_CLUBE | PROPRIOS_ESCALOES
  capacidades String[]     // chaves de capacidade (ver secção 6)
  sistema     Boolean      @default(false) // modelo de arranque (editável, mas assinalado)
  criadoEm    DateTime     @default(now())

  membros MembroClube[]
}

enum AmbitoPerfil { TODO_CLUBE PROPRIOS_ESCALOES }

// Quais escalões um membro gere (quando o perfil tem âmbito PROPRIOS_ESCALOES).
model AtribuicaoEscalao {
  id            String      @id @default(cuid())
  membroClubeId String
  membroClube   MembroClube @relation(fields: [membroClubeId], references: [id], onDelete: Cascade)
  escalaoId     String
  escalao       Escalao     @relation(fields: [escalaoId], references: [id])

  @@unique([membroClubeId, escalaoId])
}
```

### 3.2 Época, escalão e atleta (🏛️ clube)

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
}

model Escalao {
  id                      String   @id @default(cuid())
  clubeId                 String
  clube                   Clube    @relation(fields: [clubeId], references: [id])
  nome                    String   // "Benjamins"
  idadeMin                Int?
  idadeMax                Int?
  ordem                   Int      @default(0)
  visivelOutrosTreinadores Boolean @default(true) // leitura por treinadores de outros escalões (config. pelo admin)
  criadoEm                DateTime @default(now())

  atribuicoes AtribuicaoEscalao[]
}

model Atleta {
  id                  String    @id @default(cuid())
  nome                String
  dataNascimento      DateTime?
  posicoes            Posicao[] // um atleta pode ter VÁRIAS posições
  numero              Int?
  observacoes         String?
  fotoUrl             String?   // por URL (sem upload por agora)
  ativo               Boolean   @default(true) // soft delete
  dataIngresso        DateTime? // para taxa de presença (secção 10); default = criadoEm
  // Encarregado de educação (RGPD — minimização)
  encarregadoNome     String?
  encarregadoContacto String?
  encarregadoEmail    String?
  // Escalão principal + secundário opcional (um atleta joga em 1 ou 2 escalões)
  escalaoId           String
  escalaoSecundarioId String?
  epocaId             String
  criadoEm            DateTime  @default(now())
  atualizadoEm        DateTime  @updatedAt

  consentimentos Consentimento[] // RGPD (secção 5)
}

enum Posicao { GUARDA_REDES FIXO ALA PIVO UNIVERSAL }
```

### 3.3 Exercícios, diagramas e biblioteca (propriedade determinada pela licença — ver secção 4)

A propriedade de conteúdo criado por um treinador **segue quem paga a licença** sob a qual foi criado:
licença de **clube** → conteúdo do clube (fica); licença de **treinador** → conteúdo do treinador (viaja).
O campo `proprietario` fixa isso no momento da criação.

```prisma
model Exercicio {
  id             String              @id @default(cuid())
  autorId        String              // quem o criou (sempre registado)
  autor          Utilizador          @relation(fields: [autorId], references: [id])
  proprietario   PropriedadeConteudo @default(TREINADOR) // CLUBE | TREINADOR (definido pela licença)
  clubeProprietarioId String?        // preenchido quando proprietario = CLUBE
  nome           String
  descricao      String?
  objetivo       String?
  duracaoMin     Int?
  // Classificação em dois níveis (Grupo D): categoria principal (enum fixo) +
  // subcategoria customizável por clube.
  categoriaPrincipal CategoriaExercicioPrincipal?
  subcategoriaId String?
  subcategoria   SubcategoriaExercicio? @relation(fields: [subcategoriaId], references: [id])
  diagrama       Json?               // DiagramaCampo v2 (com passos/animação) — secção 11
  origemSeed     Boolean @default(false) // exercício da biblioteca curada de arranque
  criadoEm       DateTime @default(now())
  atualizadoEm   DateTime @updatedAt

  partilhas PartilhaExercicioClube[]
  sessoes   SessaoExercicio[]
}

// Determina de quem é o conteúdo criado (exercícios, modelos de jogo). Ver secção 4.
enum PropriedadeConteudo { CLUBE TREINADOR }

// Categoria principal do exercício (enum fixo). Grupo D — substitui o antigo CategoriaExercicio.
enum CategoriaExercicioPrincipal {
  ATAQUE DEFESA TRANSICAO BOLAS_PARADAS FISICO GUARDA_REDES OUTRO
}

// Subcategoria customizável por clube (à semelhança de métricas/habilidades).
// Seed instala ~22 predefinidas (sistema=true, não editáveis/apagáveis).
model SubcategoriaExercicio {
  id        String                      @id @default(cuid())
  clubeId   String
  clube     Clube                       @relation(fields: [clubeId], references: [id])
  nome      String
  categoria CategoriaExercicioPrincipal
  ordem     Int                         @default(0)
  sistema   Boolean                     @default(false)
  criadoEm  DateTime                    @default(now())

  exercicios Exercicio[]

  @@index([clubeId, categoria])
}

// Exercício partilhado na biblioteca de um clube (o autor mantém sempre o seu).
model PartilhaExercicioClube {
  id          String    @id @default(cuid())
  exercicioId String
  exercicio   Exercicio @relation(fields: [exercicioId], references: [id], onDelete: Cascade)
  clubeId     String
  criadoEm    DateTime  @default(now())

  @@unique([exercicioId, clubeId])
}
```
**Preservação de histórico:** quando um exercício **do treinador** (`proprietario = TREINADOR`) é usado numa sessão do clube, o clube retém um **snapshot só-de-leitura** desse exercício (para os planos de treino passados não partirem quando o treinador sair e levar a sua biblioteca-mestra). O original editável viaja com o treinador; o snapshot fica no clube, desligado do autor. *(Detalhe de implementação na secção 8, gestão de membros.)*

### 3.4 Periodização e treinos (🏛️ clube)

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
  // Grupo B: tipo de sessão. NORMAL liga-se a periodização (planeamento); os tipos
  // "soltos" (ABERTO/CAPTACAO/EVENTO) dispensam planeamento.
  tipoSessao    TipoSessao @default(NORMAL)
  planeamentoId String?    // liga ao microciclo (recomendado p/ tipo NORMAL)
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
  criadorId     String
  criadoEm      DateTime @default(now())
  atualizadoEm  DateTime @updatedAt

  exercicios SessaoExercicio[]
  presencas  Presenca[]
}

// Grupo B — tipo de sessão de treino.
enum TipoSessao { NORMAL ABERTO CAPTACAO EVENTO }

model SessaoExercicio {
  id          String @id @default(cuid())
  sessaoId    String
  exercicioId String
  ordem       Int    @default(0)
  duracaoMin  Int?
  notas       String?

  @@unique([sessaoId, ordem])
}

model Presenca {
  id           String         @id @default(cuid())
  sessaoId     String
  atletaId     String
  estado       EstadoPresenca @default(PRESENTE)
  justificacao String?

  @@unique([sessaoId, atletaId])
}

enum EstadoPresenca { PRESENTE FALTA FALTA_JUSTIFICADA LESIONADO ATRASADO }
```

### 3.5 Modelo de jogo e quadro tático

```prisma
// Metodologia (reutiliza o editor de campo). Propriedade determinada pela licença (ver secção 4).
model ModeloJogo {
  id           String              @id @default(cuid())
  autorId      String
  autor        Utilizador          @relation(fields: [autorId], references: [id])
  proprietario PropriedadeConteudo @default(TREINADOR) // CLUBE | TREINADOR
  clubeProprietarioId String?
  nome         String
  momento      MomentoJogo         // ORG_OFENSIVA | ORG_DEFENSIVA | TRANS_OFENSIVA | TRANS_DEFENSIVA | BOLAS_PARADAS
  principios   String?             // princípios/subprincípios
  diagrama     Json?
  criadoEm     DateTime            @default(now())
}

enum MomentoJogo { ORG_OFENSIVA ORG_DEFENSIVA TRANS_OFENSIVA TRANS_DEFENSIVA BOLAS_PARADAS }

// 🏛️ Quadro tático específico de um jogo (do clube).
model QuadroTatico {
  id      String  @id @default(cuid())
  jogoId  String
  nome    String
  diagrama Json?
  notas   String?
}
```

### 3.6 Competições, jogos, estatísticas e scouting (🏛️ clube)

```prisma
model Competicao {
  id        String       @id @default(cuid())
  clubeId   String
  clube     Clube        @relation(fields: [clubeId], references: [id])
  escalaoId String
  epocaId   String
  nome      String
  tipo      TipoJogo     @default(OFICIAL) // OFICIAL | AMIGAVEL
  criadoEm  DateTime     @default(now())

  jogos Jogo[]
}

enum TipoJogo { OFICIAL AMIGAVEL }
enum CasaFora { CASA FORA }

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
  videoUrl              String?   // link YouTube (sem armazenamento)
  criadorId             String
  criadoEm              DateTime  @default(now())
  atualizadoEm          DateTime  @updatedAt

  convocatorias Convocatoria[]
  estatisticas  EstatisticaAtleta[]
  eventos       EventoJogo[]        // registo ao vivo
  quadros       QuadroTatico[]
}

model Convocatoria {
  id        String  @id @default(cuid())
  jogoId    String
  atletaId  String
  convocado Boolean @default(true)

  @@unique([jogoId, atletaId])
}

model EstatisticaAtleta {
  id              String     @id @default(cuid())
  jogoId          String
  atletaId        String
  utilizacao      Utilizacao @default(NAO_UTILIZADO) // TITULAR | UTILIZADO | NAO_UTILIZADO
  minutos         Int?
  golos           Int        @default(0)
  assistencias    Int        @default(0)
  defesas         Int?       // GR
  golosSofridosGR Int?       // GR
  faltasCometidas Int?
  valoresMetricas ValorMetrica[]

  @@unique([jogoId, atletaId])
}

enum Utilizacao { TITULAR UTILIZADO NAO_UTILIZADO }

// Registo ao vivo (beira-campo). Agrega para EstatisticaAtleta.
model EventoJogo {
  id                 String        @id @default(cuid())
  jogoId             String
  parte              Int           // 1 | 2
  minuto             Int?
  tipo               TipoEventoJogo
  atletaId           String?       // protagonista
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

// Scouting do adversário (🏛️ clube).
model ObservacaoAdversario {
  id            String   @id @default(cuid())
  clubeId       String
  escalaoId     String?
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
  id          String @id @default(cuid())
  observacaoId String
  numero      Int?
  nome        String?
  posicao     String?
  descricao   String?
}
```

### 3.7 Caderneta de habilidades (🏛️ clube)

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

### 3.8 Reuniões (🏛️ clube)

```prisma
model Reuniao {
  id         String       @id @default(cuid())
  clubeId    String
  clube      Clube        @relation(fields: [clubeId], references: [id])
  ambito     AmbitoReuniao // CLUBE | ESCALAO
  escalaoId  String?      // obrigatório se ambito=ESCALAO
  titulo     String
  data       DateTime
  participantes String?
  ordemTrabalhos String?
  ata        String?      // ata exposta aos membros do âmbito
  criadorId  String
  criadoEm   DateTime     @default(now())
}

enum AmbitoReuniao { CLUBE ESCALAO }
```

### 3.9 Portfólio e histórico de carreira do treinador (🎒 portátil)

```prisma
// Snapshot portátil do percurso do treinador. Pertence ao utilizador e viaja com ele.
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
**Preenchimento (confirmado):** o `RegistoCarreira` é preenchido **automaticamente** a partir dos jogos do treinador no clube **e** é **editável manualmente** para registar percursos anteriores à app. Pertence ao utilizador e viaja com ele.

### 3.10 RGPD — consentimento de menores

```prisma
model Consentimento {
  id                  String            @id @default(cuid())
  atletaId            String
  atleta              Atleta            @relation(fields: [atletaId], references: [id], onDelete: Cascade)
  tipo                TipoConsentimento // DADOS | IMAGEM
  concedido           Boolean           @default(false)
  encarregadoEducacao String?
  dataConsentimento   DateTime?
}

enum TipoConsentimento { DADOS IMAGEM }
```
Ver secção 5 para as regras (soft-delete, direito ao esquecimento, minimização).

---

## 4. Propriedade e portabilidade de dados

### 4.1 Princípio

Há dois tipos de dados:
- **Operacionais/competitivos** → sempre do **clube** (ficam quando o treinador sai): atletas, jogos, estatísticas, eventos, presenças, convocatórias, caderneta, escalões, épocas, competições, reuniões, scouting, consentimentos.
- **Conteúdo metodológico** (exercícios, modelos de jogo) → a propriedade **segue quem paga a licença** sob a qual o conteúdo foi criado (ver 4.2).
- **Histórico de carreira** (`RegistoCarreira`) → sempre do **treinador** (viaja com ele).

### 4.2 Propriedade do conteúdo metodológico segue a licença (decisão 2026-07-31)

No momento da criação de um exercício ou modelo de jogo, o campo `proprietario` é fixado a partir do contexto de licença ativo:

| Contexto de criação | `proprietario` | Ao sair do clube |
|---|---|---|
| Treinador **dentro de um clube com licença de clube** | `CLUBE` | Fica no clube |
| Treinador com **licença individual** (paga por ele) | `TREINADOR` | Viaja com ele |

- `autorId` regista **sempre** quem criou (para crédito/rastreio), independentemente da propriedade.
- Conteúdo `CLUBE`: ligado a `clubeProprietarioId`, permanece na biblioteca do clube.
- Conteúdo `TREINADOR`: viaja com o autor; se foi usado em sessões do clube, o clube mantém um **snapshot só-de-leitura** para preservar os planos de treino passados (o master editável vai com o treinador).

### 4.3 Uma adesão ativa de cada vez

Um utilizador tem **no máximo uma adesão de clube ativa** (um clube de cada vez). Ao mudar de clube, a adesão anterior passa a `INATIVO` (histórico) e o conteúdo `TREINADOR` acompanha-o para o novo clube. Dentro do clube ativo, pode gerir **vários escalões**.

*(Detalhe de implementação do snapshot e da transição de clube a fixar na secção 8, gestão de membros.)*

---

## 5. Contas, autenticação, adesão a clube e RGPD

### 5.1 Autenticação
- **Auth.js v5** com provider **Credentials** (email + password). Sem OAuth no núcleo.
- Password: mínimo 8 caracteres; guardada só como **hash bcrypt (custo 10)**; nunca em logs.
- Sessão **JWT**. **Uma sessão ativa por conta** — iniciar sessão noutro dispositivo termina a anterior (paridade com o padrão do mercado; simplifica e protege).
- Gestão de password: alteração pelo próprio (exige password atual); reposição por um membro com capacidade `CLUBE_UTILIZADORES` (não exige a atual). Sem recuperação por email no núcleo (pede-se a um admin do clube) — recuperação por email é **FUTURO**.

### 5.2 Contas e modos (o "2 em 1")
- O **`Utilizador` existe por si**, independentemente de qualquer clube (modo individual). Tem sempre o seu portfólio 🎒 (exercícios/modelos com `proprietario = TREINADOR`, `RegistoCarreira`).
- **Criar clube:** qualquer utilizador pode criar um `Clube` e torna-se automaticamente **membro com o perfil Administrador**. A criação do clube gera os **perfis de arranque** editáveis (secção 6).
- **Aderir a clube (convite):** um membro com `CLUBE_UTILIZADORES` convida por email. Se o email já tem conta, adere; se não, cria conta no processo.
- **Uma adesão ATIVA de cada vez** (secção 4.3).

### 5.3 Transição de clube
- **Sair do clube:** a `MembroClube` passa a `INATIVO` (fica como histórico). O conteúdo `proprietario = TREINADOR` continua a pertencer ao utilizador e acompanha-o; o conteúdo `proprietario = CLUBE` e os **snapshots só-de-leitura** ficam no clube. O `RegistoCarreira` do período é consolidado.
- **Aderir a novo clube:** nova `MembroClube` ativa; o portfólio 🎒 do utilizador fica disponível para partilhar no novo clube.
- **Proteção:** um clube **nunca pode ficar sem Administrador** — o último admin não pode sair nem ser despromovido sem promover outro (secção 6.7).

### 5.4 Contexto de sessão
Toda a operação corre num contexto resolvido no servidor:
- **Utilizador atual** — `obterUtilizadorAtual()`.
- **Membro/clube ativo** — `obterMembroAtual()` devolve `{ clube, perfil, capacidades, escalõesAtribuidos, ambito }` da adesão ativa (ou `null` no modo individual sem clube).
- **Época ativa** — `obterEpocaAtiva()` (cookie `epoca_ativa` validado contra o clube, com fallback à época `ativa=true`).
- **Escalão selecionado** — parâmetro de UI (tabs), nunca fonte de autorização por si só.

### 5.5 RGPD (dados de menores) — fundação, não opção
Tratamos dados de **crianças**; o desenho tem de o refletir desde o schema.

> **Estado atual (decisão 2026-08-02):** o **consentimento parental é recolhido pelo clube no ato de inscrição, fora da aplicação** (formulário/papel). A app assume que o consentimento existe para os atletas registados. O modelo `Consentimento` e o hard-delete descritos abaixo são o **alvo futuro** (não implementados; não bloqueadores). Ver `docs/DEPLOY.md` §6.

- **Minimização:** recolher apenas o necessário (nome, data de nascimento, posição, número, observações). Contactos dos pais só quando o portal de pais existir (FUTURO).
- **Consentimento parental** (`Consentimento`, tipos `DADOS` e `IMAGEM`): registado por atleta, com encarregado de educação e data. **Fotografias de menores** (`fotoUrl`, FUTURO) só com consentimento `IMAGEM` ativo.
- **Direito ao esquecimento:** por defeito **soft-delete** (`ativo = false`, preserva histórico competitivo agregado). A pedido do titular/encarregado, **hard-delete** dos dados pessoais (apaga o `Atleta` e dados diretamente identificáveis; estatísticas podem ser anonimizadas para não partir agregados de equipa).
- **Portabilidade:** exportação dos dados do educando em PDF/estruturado, a pedido.
- **Retenção:** dados mantidos enquanto o atleta pertence ao clube; política de retenção pós-saída a definir por clube (FUTURO configurável).

### 5.6 Segurança geral
- Todas as Server Actions verificam **autenticação** e **capacidade/âmbito** antes de operar (secção 6/7).
- **Validação server-side obrigatória** (Zod) — nunca confiar só no cliente.
- Todas as queries filtram por **clube** + (quando aplicável) **época** + **âmbito de permissões**.
- Segredos só em `.env` (nunca no repositório); `.env.example` sem valores. HTTPS. Logótipos servidos do Supabase Storage com URLs não-adivinháveis.

---

## 6. Papéis e permissões configuráveis

### 6.1 Modelo
Um **`Perfil`** = `nome` + `ambito` (`TODO_CLUBE` | `PROPRIOS_ESCALOES`) + **lista de capacidades**. Perfis são **por clube** e **totalmente configuráveis** — nenhum é fixo. Ao criar o clube geram-se **modelos de arranque editáveis** (Administrador, Diretor Técnico, Treinador Principal, Adjunto), que o admin pode alterar, duplicar, apagar ou complementar com perfis novos.

### 6.2 Catálogo de capacidades
Chaves usadas em `Perfil.capacidades`. Agrupadas por domínio:

**Estrutura do clube (aplicam-se sempre a todo o clube):**
- `CLUBE_BRANDING` — editar cores e logótipo.
- `CLUBE_ESCALOES` — criar/editar/apagar escalões e a sua visibilidade.
- `CLUBE_EPOCAS` — criar épocas e definir a ativa.
- `CLUBE_UTILIZADORES` — convidar/gerir membros, repor passwords.
- `CLUBE_PERFIS` — criar/editar perfis e atribuir a membros.
- `CATALOGO_METRICAS` — gerir métricas configuráveis.
- `CATALOGO_HABILIDADES` — gerir o catálogo de habilidades.

**Dados de equipa (aplicam-se conforme o `ambito`: todos os escalões ou só os atribuídos):**
- `PLANTEL_GERIR` — criar/editar/arquivar atletas.
- `TREINOS_GERIR` — criar/editar/apagar sessões e exercícios da sessão.
- `PRESENCAS_MARCAR` — marcar presenças.
- `PERIODIZACAO_GERIR` — planos semanais/mensais.
- `MODELO_JOGO_GERIR` — modelos de jogo e quadros táticos.
- `JOGOS_GERIR` — criar/editar/apagar jogos.
- `CONVOCATORIA_GERIR` — definir convocatórias.
- `ESTATISTICAS_GERIR` — registar estatísticas e eventos ao vivo.
- `COMPETICOES_GERIR` — competições e calendário.
- `SCOUTING_GERIR` — observação de adversários.
- `CADERNETA_GERIR` — progresso de habilidades dos atletas.
- `REUNIOES_GERIR` — criar reuniões e atas (âmbito de escalão; ver `CLUBE`).
- `EXERCICIOS_GERIR` — criar/editar exercícios na biblioteca.
- `RELATORIOS_VER` — ver/exportar relatórios e tracking.

### 6.3 Âmbito
- `TODO_CLUBE`: as capacidades de dados de equipa aplicam-se a **todos os escalões**.
- `PROPRIOS_ESCALOES`: aplicam-se **apenas aos escalões atribuídos** (`AtribuicaoEscalao`).
- As capacidades de estrutura (`CLUBE_*`, `CATALOGO_*`) são sempre de nível clube (o âmbito não as restringe).

### 6.4 Leitura de escalões alheios
Independentemente da escrita, um membro pode **ler** os dados de um escalão que não é seu **se** `Escalao.visivelOutrosTreinadores = true`. A escrita nesse escalão continua a exigir capacidade + âmbito. Assim o admin controla, por escalão, a transparência interna.

### 6.5 Modelos de arranque (defaults editáveis)
- **Administrador** — `TODO_CLUBE`, **todas** as capacidades.
- **Diretor Técnico** — `TODO_CLUBE`, todas as capacidades de **dados de equipa** + `CATALOGO_*` + `RELATORIOS_VER`; as capacidades de **estrutura** (`CLUBE_BRANDING/ESCALOES/EPOCAS/UTILIZADORES/PERFIS`) vêm **desligadas** e são ligadas pelo admin conforme quiser.
- **Treinador Principal** — `PROPRIOS_ESCALOES`, todas as capacidades de dados de equipa dos seus escalões + `EXERCICIOS_GERIR` + `RELATORIOS_VER`.
- **Adjunto** — `PROPRIOS_ESCALOES`, capacidades operacionais (`TREINOS_GERIR`, `PRESENCAS_MARCAR`, `ESTATISTICAS_GERIR`, `CADERNETA_GERIR`, `EXERCICIOS_GERIR`); `PLANTEL_GERIR`, `JOGOS_GERIR`, `CONVOCATORIA_GERIR` **desligadas** por defeito.

### 6.6 Verificação (algoritmo de autorização)
Helper `exigirCapacidade(cap, escalaoId?)`, usado em cada action:
1. Há utilizador autenticado? senão → `erro("Não autenticado")`.
2. Há adesão ativa ao clube em contexto? senão → `erro("Sem acesso a este clube")`.
3. O perfil tem `cap`? senão → `erro("Sem permissão")`.
4. Se `cap` é de dados de equipa e o perfil é `PROPRIOS_ESCALOES`: o `escalaoId`-alvo está nos `escalõesAtribuidos`? senão → `erro("Sem permissão neste escalão")`.
5. Para **leitura** de escalão alheio: permitido se `Escalao.visivelOutrosTreinadores` (mesmo sem a capacidade de escrita).

### 6.7 Regras de proteção
- O **Administrador** tem sempre todas as capacidades (não pode ser bloqueado a si próprio).
- Um clube **nunca fica sem Administrador**: não se pode remover/despromover/expulsar o último membro com perfil de âmbito `TODO_CLUBE` que tenha `CLUBE_UTILIZADORES` + `CLUBE_PERFIS` sem promover outro primeiro.
- Um perfil **em uso** não pode ser apagado sem reatribuir os seus membros.

---

## 7. Server Actions

Sem REST (exceto o handler do Auth.js). Todas as actions começam com `"use server"`, vivem em `lib/actions/`, e devolvem `Resultado<T>` (`{ sucesso: true; dados } | { sucesso: false; erro; camposInvalidos? }`).

### 7.1 Padrão obrigatório de cada action
1. Validar input com **Zod** (`lib/schemas/`).
2. Resolver contexto: `obterMembroAtual()` (auth + clube ativo).
3. **`exigirCapacidade(cap, escalaoId?)`** (secção 6.6).
4. Quando aplicável, `obterEpocaAtiva()`.
5. Operar (Prisma), **filtrando sempre por clube + época + âmbito**.
6. `revalidatePath()` das rotas afetadas.
7. Devolver `Resultado<T>`.

### 7.2 Helpers de contexto (`lib/`)
- `obterUtilizadorAtual(): Promise<Utilizador | null>`
- `obterMembroAtual(): Promise<{ clube; perfil; capacidades; escalõesAtribuidos; ambito } | null>`
- `obterEpocaAtiva(): Promise<Epoca | null>`
- `exigirCapacidade(cap, escalaoId?): Promise<{ ok } | { erro }>` (usado no início de cada action de escrita)
- `podeLerEscalao(escalaoId): Promise<boolean>` (capacidade/âmbito **ou** `visivelOutrosTreinadores`)

### 7.3 Assinaturas por módulo
*(Assinaturas de referência; parâmetros `dados: unknown` são validados por Zod. Todas devolvem `Resultado<T>`.)*

**Contas e clube** (`contas.ts`, `clubes.ts`)
```
registar(dados), iniciarSessao(dados), terminarSessao()
alterarMinhaPassword(dados)
criarClube(dados) // torna o criador Administrador + cria perfis de arranque
atualizarBrandingClube(dados) // CLUBE_BRANDING
obterClubeAtivo()
```

**Membros e perfis** (`membros.ts`, `perfis.ts`) — `CLUBE_UTILIZADORES` / `CLUBE_PERFIS`
```
convidarMembro(email, perfilId), removerMembro(id), sairDoClube()
atribuirPerfil(membroId, perfilId), atribuirEscaloes(membroId, escalaoIds[])
redefinirPasswordMembro(membroId, novaPassword)
listarMembros()
criarPerfil(dados), atualizarPerfil(id, dados), apagarPerfil(id), listarPerfis()
```

**Escalões / Épocas / Catálogos** — `CLUBE_ESCALOES` / `CLUBE_EPOCAS` / `CATALOGO_*`
```
criarEscalao/atualizarEscalao/apagarEscalao/moverEscalao/listarEscaloes
definirVisibilidadeEscalao(id, visivel)
criarEpoca/listarEpocas/definirEpocaAtiva/selecionarEpoca
criarMetrica/listarMetricas/alternarMetrica/moverMetrica
criarHabilidade/atualizarHabilidade/apagarHabilidade/moverHabilidade/listarHabilidades
```

**Plantel** (`atletas.ts`) — `PLANTEL_GERIR` (+ leitura por âmbito/visibilidade)
```
criarAtleta/atualizarAtleta/apagarAtleta(soft)/obterAtleta/listarAtletas(escalaoId?)
obterEstatisticasAtleta(id) // secção 10
registarConsentimento(atletaId, tipo, dados) // RGPD
```

**Exercícios** (`exercicios.ts`) — `EXERCICIOS_GERIR`
```
criarExercicio(dados)/atualizarExercicio/apagarExercicio(bloqueado se em uso)/obterExercicio
listarExercicios(categoria?, q?) // biblioteca do clube (partilhados) + os do autor
partilharExercicioNoClube(id)/removerPartilha(id)
// proprietario definido pela licença ativa (secção 4.2)
```

**Treinos e periodização** (`treinos.ts`, `periodizacao.ts`) — `TREINOS_GERIR` / `PERIODIZACAO_GERIR` / `PRESENCAS_MARCAR`
```
criarSessao/atualizarSessao/apagarSessao/obterSessao/listarSessoes(escalaoId?)
adicionarExercicioSessao/removerExercicioSessao/reordenarExercicios
marcarPresencas(sessaoId, presencas[]) // upsert em lote
criarPlaneamento/atualizarPlaneamento/apagarPlaneamento/listarPlaneamentos(escalaoId?, tipo?)
```

**Modelo de jogo / quadro tático** (`modeloJogo.ts`) — `MODELO_JOGO_GERIR`
```
criarModeloJogo/atualizarModeloJogo/apagarModeloJogo/listarModelosJogo(momento?)
criarQuadroTatico(jogoId, dados)/atualizarQuadroTatico/apagarQuadroTatico
```

**Jogos, competições, estatísticas, scouting** (`jogos.ts`, `competicoes.ts`, `scouting.ts`)
```
criarJogo/atualizarJogo/apagarJogo/obterJogo/listarJogos(escalaoId?)   // JOGOS_GERIR
definirConvocatoria(jogoId, atletaIds[])                                // CONVOCATORIA_GERIR
guardarEstatisticas(jogoId, estatisticas[])                             // ESTATISTICAS_GERIR (upsert)
registarEventoJogo(jogoId, evento) / listarEventos(jogoId) / apagarEvento(id) // live; agrega p/ estatísticas
guardarRelatorio(jogoId, texto) / definirVideo(jogoId, youtubeUrl)
criarCompeticao/atualizarCompeticao/apagarCompeticao/listarCompeticoes  // COMPETICOES_GERIR
criarObservacaoAdversario/... / listarObservacoes                       // SCOUTING_GERIR
```

**Caderneta** (`caderneta.ts`) — `CADERNETA_GERIR`
```
obterCadernetaAtleta(atletaId)
atualizarProgresso(atletaId, habilidadeId, estado, notas?) // upsert; regista data se DESBLOQUEADO
```

**Reuniões** (`reunioes.ts`) — `REUNIOES_GERIR`
```
criarReuniao(dados)/atualizarReuniao/apagarReuniao/listarReunioes(ambito?, escalaoId?)
```

**Relatórios e carreira** (`relatorios.ts`, `carreira.ts`) — `RELATORIOS_VER`
```
obterRelatorioFimEpocaEquipa(escalaoId, epocaId)
obterRelatorioFimEpocaAtleta(atletaId, epocaId)
gerarPDF(tipo, id) // ficha de jogo, convocatória, plano de treino, relatório do atleta
listarRegistoCarreira() / editarRegistoCarreira(id, dados) // 🎒 do utilizador
```

---

## 8. Módulos funcionais

Cada módulo define: **conteúdo**, **ações**, **estado vazio**, e **regras** próprias. Estados de loading/erro seguem a secção 13. Navegação: barra de topo (logótipo do clube + seletor de época + menu do utilizador) + sidebar (PC) / bottom-nav (móvel).

### 8.1 Onboarding e contas
- **Login** (`/login`): email + password. Erros inline; toast em falha.
- **Registo** (`/registar`): cria `Utilizador` em **modo individual** (sem clube). Ao entrar, pode criar um clube ou aceitar um convite pendente.
- **Criar clube:** nome + cores + (logo opcional). O criador fica Administrador; geram-se os perfis de arranque.
- **Aceitar convite:** por link/email; o utilizador adere ao clube com o perfil atribuído.
- **Seletor de contexto:** se o utilizador tem clube ativo, a app abre no clube; caso contrário, no espaço individual (portfólio pessoal).
- **Estado vazio:** sem clube → cartão "Cria o teu clube ou aceita um convite".

### 8.2 Gestão de membros e perfis (`CLUBE_UTILIZADORES`, `CLUBE_PERFIS`)
- **Membros:** lista de membros (avatar, nome, perfil, escalões atribuídos, estado). Ações: convidar (email + perfil), editar perfil, atribuir escalões, repor password, remover.
- **Perfis:** lista de perfis do clube. Ações: criar/duplicar/editar/apagar. Editor de perfil = nome + âmbito (`TODO_CLUBE`/`PROPRIOS_ESCALOES`) + **grelha de capacidades** (interruptores agrupados por domínio — secção 6.2).
- **Regras:** nunca deixar o clube sem admin (6.7); perfil em uso não se apaga sem reatribuir.
- **Estado vazio:** só o admin fundador → sugerir convidar a equipa técnica.

### 8.3 Branding do clube (`CLUBE_BRANDING`)
- Editar **cor primária**, **cor secundária** e **logótipo** (upload → Supabase Storage).
- As cores aplicam-se ao tema por **variáveis CSS** em tempo real; o logótipo aparece na barra de topo e nos PDF.
- Pré-visualização antes de guardar.

### 8.4 Definições base
- **Escalões** (`CLUBE_ESCALOES`): CRUD + reordenar + **interruptor de visibilidade** a outros treinadores. Apagar bloqueado se tiver atletas.
- **Épocas** (`CLUBE_EPOCAS`): criar (nome, datas), listar, **definir ativa**.
- **Métricas** (`CATALOGO_METRICAS`): CRUD + tipo (Número/Booleano/Escala) + ativar/desativar + reordenar.
- **Habilidades** (`CATALOGO_HABILIDADES`): CRUD agrupado por nível + reordenar.

### 8.5 Plantel (`PLANTEL_GERIR`; leitura por âmbito/visibilidade)
- **Lista:** tabs por escalão + pesquisa por nome; grelha de cartões (avatar de iniciais, nome, número, posição). Contador. **Aviso de número duplicado** entre atletas ativos do mesmo escalão.
- **Perfil do atleta:** cabeçalho de identidade + abas **Estatísticas** (secção 10) / **Caderneta** (8.11) / **Dados** (+ consentimentos RGPD).
- **Novo/Editar:** nome (obrigatório), escalão (obrigatório), data de nascimento, posição, número, observações, consentimentos.
- **Apagar:** soft-delete (`ativo=false`); hard-delete só via pedido RGPD (secção 5.5).
- **Estado vazio:** "Ainda não há atletas neste escalão."

### 8.6 Exercícios (`EXERCICIOS_GERIR`)
- **Biblioteca:** filtro por categoria + pesquisa; grelha de cartões com **miniatura do diagrama**. Mostra exercícios partilhados no clube + os do autor. Marca visual dos de **seed** (curados de arranque).
- **Detalhe:** nome, categoria, duração, objetivo, descrição, **diagrama** (render read-only, com play se tiver animação).
- **Novo/Editar:** formulário + **editor de campo** (secção 11), com **passos/animação** opcional.
- **Propriedade:** definida pela licença (secção 4.2). Partilhar/retirar da biblioteca do clube.
- **Apagar:** bloqueado se em uso em sessões (indica em quantas).
- **Estado vazio:** biblioteca curada de arranque garante que **nunca começa vazia**; se filtrada sem resultados, mensagem específica.

### 8.7 Treinos (`TREINOS_GERIR`, `PRESENCAS_MARCAR`)
- **Lista/Calendário:** tabs por escalão; alternância **lista ⇄ calendário mensal**; cada sessão mostra data, objetivo, nº exercícios, taxa de presença.
- **Detalhe da sessão:** cabeçalho (data, escalão, objetivo, duração, local) + duas colunas: **Exercícios** (adicionar da biblioteca, reordenar, total de tempo) e **Presenças** (seletor por atleta, guardar em lote, contadores). **Notas de treino** (campo que alimenta o tracking).
- **Novo/Editar:** data/hora, escalão, duração, objetivo, local, notas, ligação a planeamento/microciclo.
- **Estado vazio:** "Sem sessões nesta época."

### 8.8 Periodização (`PERIODIZACAO_GERIR`)
- **Planos semanais e mensais** por escalão/época, organizados em **microciclos** e **mesociclos**, com **período** (Preparatório/Competitivo/Transição) e objetivos.
- Vista de **grelha anual** (inspirada no "registo anual" do concorrente): linhas por conteúdo/momento, colunas por semana/mês, com cor por foco — dá a visão macro da época.
- Ligação das sessões ao microciclo respetivo.
- **Estado vazio:** "Ainda não planeaste esta época — cria o primeiro microciclo."

### 8.9 Modelo de jogo e quadro tático (`MODELO_JOGO_GERIR`)
- **Modelo de jogo (🎒/🏛️ por licença):** representações por **momento** (org. ofensiva/defensiva, transições, bolas paradas) com princípios/subprincípios + diagrama. Reutiliza o editor de campo.
- **Quadro tático por jogo (🏛️):** esquemas específicos ligados a um jogo.
- **Estado vazio:** "Define o teu modelo de jogo."

### 8.10 Jogos, competições, estatísticas e scouting
- **Calendário/Lista** (`JOGOS_GERIR`): tabs por escalão; cronológico; data, adversário, Casa/Fora, resultado, competição, tipo (Oficial/Amigável).
- **Competições** (`COMPETICOES_GERIR`): criar competição; calendário e (futuro) classificação.
- **Detalhe do jogo:** cabeçalho + resultado + **faltas acumuladas por parte** + abas:
  - **Convocatória** (`CONVOCATORIA_GERIR`): toggle por atleta. Remover convocado com estatísticas → confirmação explícita (apaga estatísticas desse atleta).
  - **Estatísticas** (`ESTATISTICAS_GERIR`): por atleta convocado — utilização, minutos, golos, assistências; se GR: defesas/sofridos/faltas; + **métricas configuráveis** (input adapta ao tipo). Aviso suave se soma de golos ≠ resultado da equipa.
  - **Modo ao vivo:** registo de **eventos** (golo, assistência, falta, cartão, substituição, defesa, timeout) por parte/minuto, pelo treinador **ou adjunto**; agrega automaticamente para as estatísticas. Otimizado para telemóvel + offline (PWA).
  - **Relatório:** texto pós-jogo. **Vídeo:** link YouTube.
  - **Quadro tático:** diagramas do jogo.
- **Scouting** (`SCOUTING_GERIR`): observação do adversário (equipa, sistema, pontos fortes/fracos, diagrama) e por jogador adversário.
- **Estado vazio:** "Sem jogos nesta época."

### 8.11 Caderneta (`CADERNETA_GERIR`)
- No perfil do atleta: habilidades agrupadas por nível, com estado (Não iniciado / Em progresso / Desbloqueado), data de desbloqueio e notas.
- Indicador de progresso ("7 de 20 desbloqueadas") + **celebração** ao desbloquear (princípio 1).
- **Estado vazio:** se o catálogo estiver vazio, encaminha para Definições → Habilidades.

### 8.12 Relatórios, tracking e PDF (`RELATORIOS_VER`)
- **Tracking de época:** evolução por dados a partir de notas de treino, presenças, estatísticas e caderneta.
- **Relatório de fim de época:** por **equipa** e por **atleta** (secção 10) — sem IA.
- **PDF profissional** (templates simples e bonitos): ficha de jogo, convocatória, plano de treino, **relatório de desenvolvimento do atleta** (para partilhar com pais). Logótipo e cores do clube aplicados.

### 8.13 Dashboard
- Próxima sessão + próximo jogo (com atalhos "Ver"/"Presenças"/"Convocatória").
- Ações rápidas (nova sessão, novo jogo, novo atleta).
- Resumo do escalão selecionado (nº atletas, sessões, jogos na época).
- Respeita permissões: mostra só o que o membro pode ver.

### 8.14 Perfil do treinador e carreira
- Espaço pessoal do utilizador (🎒): a sua **biblioteca** (exercícios/modelos `TREINADOR`) e o **histórico de carreira** (`RegistoCarreira`) — automático a partir dos jogos + editável para percursos anteriores.
- Disponível também no modo individual (sem clube).

---

## 9. Regras de negócio transversais e casos-limite

**Herdados do MVP (mantêm-se):**
- **Métrica desativada com valores históricos:** os valores mantêm-se; jogos passados continuam a mostrá-los (marcada "inativa"); novos jogos já não a pedem. Nunca apagar `ValorMetrica` ao desativar.
- **Mudança de posição do atleta:** jogos passados mantêm os dados que tinham. A UI decide que campos mostrar com base no **valor registado** no próprio `EstatisticaAtleta` (se tem defesas/sofridos, mostra-os), não só na posição atual.
- **Atleta que entra a meio da época:** a taxa de presença usa como divisor as sessões do escalão **a partir da `dataIngresso`** (ou `criadoEm`) do atleta.
- **Convocatória alterada com estatísticas:** remover um convocado com estatísticas pede **confirmação explícita** e apaga as estatísticas desse atleta nesse jogo.
- **Sessão/jogo com data fora da época:** permitido, com **aviso suave** ("A data está fora do intervalo da época ativa"). Não bloqueia.
- **Escalão/época sem atletas:** listas mostram estado vazio; criar sessão/jogo é possível, presenças/convocatória ficam vazias com nota.
- **Dois atletas com o mesmo número:** permitido; **aviso não-bloqueante** na lista de plantel se dois ativos do mesmo escalão partilharem número.
- **Sem época ativa:** as actions devolvem "Nenhuma época ativa" e a UI encaminha para Definições → Épocas.
- **Golos individuais ≠ resultado da equipa:** aviso suave (autogolos, erros), não bloqueia.
- **Exercício em uso:** apagar bloqueado (indica em quantas sessões); editar é sempre permitido (reflete-se onde referenciado).
- **Concorrência:** **last-write-wins** (sem locking otimista).

**Novos (ecossistema e produto final):**
- **Permissão negada:** qualquer action sem capacidade/âmbito devolve `erro("Sem permissão")`; a UI esconde/desativa as ações não permitidas (não confia só no servidor).
- **Leitura de escalão alheio:** só se `visivelOutrosTreinadores`; caso contrário o escalão nem aparece a esse membro.
- **Saída de treinador:** conteúdo `TREINADOR` viaja; conteúdo `CLUBE` e **snapshots** ficam; a adesão passa a `INATIVO`; `RegistoCarreira` consolidado. Nunca deixar o clube sem admin.
- **Propriedade por licença:** se o contexto de licença mudar (ex: clube deixa de ter licença), o conteúdo já criado mantém o `proprietario` que tinha (não se reescreve retroativamente).
- **Uma sessão por conta:** iniciar sessão noutro dispositivo invalida a anterior.
- **RGPD:** hard-delete a pedido remove dados pessoais mas preserva agregados anonimizados quando necessário para não partir estatísticas de equipa.
- **Época ativa é por clube:** ao trocar de clube, resolve-se a época ativa do novo clube.

---

## 10. Estatísticas e agregações

Tudo filtrado pela **época ativa** e pelo **clube**. Lógica de cálculo em função pura testável (`lib/estatisticas.ts`).

### 10.1 Agregado do atleta (`obterEstatisticasAtleta`)
```
jogosConvocado      = nº Convocatoria (convocado=true) na época
jogosUtilizados     = nº EstatisticaAtleta com utilizacao != NAO_UTILIZADO
titularidades       = nº utilizacao == TITULAR
totalGolos          = Σ golos
totalAssistencias   = Σ assistencias
totalMinutos        = Σ minutos  (null se NENHUM jogo tiver minutos registados)
totalDefesas        = Σ defesas          (só se posição == GUARDA_REDES; senão null)
totalGolosSofridos  = Σ golosSofridosGR  (só GR; senão null)
sessoesTotais       = nº sessões do escalão na época com data >= dataIngresso do atleta
presencas           = nº Presenca com estado ∈ {PRESENTE, ATRASADO}
taxaPresenca        = presencas / sessoesTotais   (0 se sessoesTotais == 0)
```
Regras: ATRASADO conta como presença; FALTA/FALTA_JUSTIFICADA/LESIONADO não contam. `totalMinutos = null` distingue "não registado" de "zero".

### 10.2 Agregado da equipa (escalão + época)
```
jogos, vitorias, empates, derrotas   (a partir de golosMarcados vs golosSofridos)
golosMarcados / golosSofridos totais e médias
taxaPresençaMédia do escalão
melhores marcadores / assistentes (ranking a partir dos EstatisticaAtleta)
faltas acumuladas médias por parte (futsal)
```

### 10.3 Registo ao vivo → agregação
Os `EventoJogo` (GOLO, ASSISTENCIA, FALTA, CARTAO_*, SUBSTITUICAO, DEFESA, GOLO_SOFRIDO) registados no modo ao vivo **agregam** para os campos de `EstatisticaAtleta` (golos, assistências, defesas, faltas…) e para as **faltas por parte** do jogo. O treinador pode ajustar manualmente depois (o registo manual e o live convergem no mesmo `EstatisticaAtleta`, last-write-wins).

### 10.4 Específicas de futsal
- **Faltas acumuladas por parte** (`faltas1aParte`, `faltas2aParte`) — a UI destaca a 5.ª (livre sem barreira).
- **Minutos por atleta** — soma não validada contra o tempo de jogo (rotações).
- **Quintetos/rotações e power play** — derivados dos eventos de substituição e da utilização; visualização de tempo por atleta.

### 10.5 Relatório de fim de época (sem IA)
- **Por atleta:** identidade, agregados (10.1), evolução de presenças e golos ao longo das jornadas, progresso da caderneta, notas de treino relevantes, minutos. Exportável em PDF para os pais.
- **Por equipa:** agregados (10.2), rankings, evolução coletiva.
- Gerado on-demand a partir dos dados; opção de guardar snapshot (FUTURO).

### 10.6 Onde aparecem
Perfil do atleta (aba Estatísticas), Dashboard (resumo), módulo de Relatórios. Gráficos (barras/linhas) seguindo o sistema de design (secção 12).

---

## 11. Formato do diagrama de campo e animação

### 11.1 Campo
Campo de futsal FIFA **40×20 m**, proporção 2:1. Coordenadas internas: 1 unidade = 10 cm → **400×200 unidades**. Linhas: meio-campo + círculo central (raio 30), áreas de baliza (quarto de círculo 6 m em cada poste), marca de grande penalidade (6 m) e segunda penalidade (10 m), balizas 3 m. Render SVG nativo (sem bibliotecas de licença duvidosa). Três componentes: `CampoFutsal` (read-only), `MiniaturaCampo` (listagens), `EditorCampo` (interativo).

### 11.2 `DiagramaCampo` v2 (com passos)
Guardado em `Json`. Estende o formato v1 do MVP com **passos** para animação, mantendo retrocompatibilidade (um diagrama sem `passos` é estático).

```typescript
interface DiagramaCampo {
  versao: 2;
  elementos: ElementoCampo[];      // estado base (passo 0)
  passos?: PassoAnimacao[];        // opcional; se ausente, é estático
}

type ElementoCampo = Jogador | Bola | Cone | Baliza | Seta | Linha | Texto;
// Jogador{ id, tipo:"jogador", x, y, numero?, cor:"azul|vermelho|amarelo|verde", posicao? }
// Bola/Cone{ id, tipo, x, y }  Baliza{ id, tipo, x, y, orientacao }
// Seta{ id, tipo:"seta", estilo:"movimento|passe|conducao", cor, pontos[≥2] }
// Linha{ id, tipo:"linha", cor, pontos[≥2] }  Texto{ id, tipo:"texto", x, y, conteudo }

interface PassoAnimacao {
  id: string;
  ordem: number;
  // posições dos elementos (por id) neste passo; interpola-se do passo anterior
  posicoes: { elementoId: string; x: number; y: number }[];
  duracaoMs?: number;   // default por passo (ex: 800ms)
}
```
Validação **Zod** (`diagramaSchema`) obrigatória antes de gravar. Diagrama vazio válido: `{ versao: 2, elementos: [] }`.

### 11.3 Animação (básica, A→B)
- **Playback (barato):** interpolar (tween) as posições dos elementos entre passos consecutivos, com SVG + `requestAnimationFrame`/Framer Motion. Botão play/pause; repetir.
- **Autoria (o investimento de UX):** o treinador define passos — no passo N, arrasta os elementos para as novas posições; a app guarda o `PassoAnimacao`. Mínimo viável: mover jogador/bola de A→B entre 2–3 passos.
- **Convenções visuais** (herdadas): seta sólida = deslocamento, tracejada = passe, ondulada = condução; equipa própria azul, adversário vermelho.
- **Interação:** pointer events (rato + toque), alvos ≥32px, sem zoom/pan (o campo escala para caber).

### 11.4 Reutilização
O mesmo editor e formato servem **exercícios**, **modelos de jogo** e **quadros táticos**. A miniatura é o mesmo SVG num viewBox menor — nunca se rasteriza nem se guarda imagem.

---

## 12. Sistema de design

Prescritivo — sem reinterpretar "cartão" ou "cor primária". Base Tailwind + shadcn/ui. **Marca do produto: Mister** (guia completo em `docs/BRAND.md`). Princípio: **a marca é fixa; a cor do clube é dinâmica**.

### 12.1 Tokens de cor (marca Mister — neutros quentes + laranja)
- **ink** `#141210` (texto/ícone/preto quente) · **laranja** 500 `#F0531E` (acento da marca / default) · 600 `#C7430F` · 100 `#FBE4DA` · 50 `#FDF1EB`
- **cinza (neutros quentes):** 900 `#141210` (ink) · 700 `#2E2A25` · 600 `#57514A` · 500 `#6C665F` · 400 `#98938D` · 300 `#C7C1B8` · 200 `#E4E1DB` (bordas) · 100 `#EEEBE6` · 50 `#F7F5F2` (superfície). Fundo da página = papel `#EDEBE7`.
- **verde** 600 `#1E9E5A` (sucesso) · **âmbar** 600 `#8A5A06` (texto de aviso, AA) · 500 `#E0900A` (ícone/borda) · **vermelho** 600 `#D33A3A` (erro)
- **azul** (legado, = cor default do clube demo JSC): 900/700/500/300/100/50.
- **Tipografia:** display **Bricolage Grotesque** (`font-display`) nos títulos/wordmark; **Inter** (`font-sans`) no corpo — ambas via `next/font`.
- **Regra:** todos os tons usados no código têm de existir em `tailwind.config.ts`.

### 12.2 Branding dinâmico do clube
- A cor **primária** do `Clube` (escolhida no criar clube) alimenta **todos os acentos**: aplicada como `--cor-primaria` e convertida para HSL em `--primary`/`--ring` (shadcn) para os **botões** seguirem o clube. Usada no herói, navegação ativa, botões, chips, avatar, links/tabs (`text-primary`/`bg-primary`), focus e cor da marca de água. **Default** (sem clube) = laranja da marca.
- **Logótipo do produto** (`components/layout/Logo.tsx`) na barra de topo/login — **só a marca Mister** (o clube não fica ao lado).
- **Logótipo do clube** (`Clube.logoUrl`) como **marca de água centrada a preencher a página** (`.club-watermark`), visível em desktop e mobile; o nome do clube fica no contexto da página. Ver `docs/BRAND.md`.
- Garantir contraste AA independentemente da cor escolhida (validar/escurecer texto quando necessário).

### 12.3 Tipografia (Inter)
`titulo-pagina` 24/700 · `titulo-seccao` 18/600 · `subtitulo` 15/600 · `corpo` 14 · `corpo-sec` 13 · `legenda` 12. Linha 1.5.

### 12.4 Componentes e layout
- **shadcn/ui** como base (button, card, dialog, alert-dialog, select, tabs, switch, etc.).
- Cantos: `lg` 12px (modais), `md` 8px (cartões/inputs/botões), `sm` 6px. Sombra `card`.
- **Alvos de toque ≥44px.** Sem dark mode na v1.
- Datas via `date-fns` locale `pt`: "24 de julho de 2026", horas "18:30".

### 12.5 Dados visuais (gráficos)
Estatísticas apresentadas com gráficos (barras/linhas) sóbrios, usando a paleta azul + cinzas; nunca depender só de cor (rótulos + texto). Diagramas de campo como âncoras visuais nos cartões de exercício/sessão.

---

## 13. Estados de UI, i18n, acessibilidade e requisitos não-funcionais

### 13.1 Estados de UI
- **Loading:** cada rota com `loading.tsx` (skeletons); ações mostram estado "a processar" (botão desativado + texto).
- **Vazio:** cada listagem com estado vazio explícito (texto da secção 8) + ação primária.
- **Erro:** validação inline por campo (`camposInvalidos`); operação → toast; página → `error.tsx` com "tentar novamente"; não encontrado → `not-found.tsx`.

### 13.2 PWA e offline (modo jornada)
- App instalável (manifest + service worker) em Android e iOS; ícone e ecrã cheio.
- **Offline tolerante** onde importa (beira-campo): marcar presenças, registar estatísticas/eventos ao vivo — guardar localmente e sincronizar quando a rede volta. Guardar em **lote** (um pedido), não por atleta.

### 13.3 i18n e acessibilidade
- pt-PT **hardcoded** (sem sistema i18n na v1).
- Contraste **AA** (≥4.5:1); foco visível; navegação por teclado; `label`/`aria-label`; não depender só de cor.

### 13.4 Requisitos não-funcionais
- **Desempenho:** listagens < 1s em rede normal; ações com UI otimista < 500ms; editor de campo fluido em tablet. Sem paginação na v1 (volume pequeno); usar índices do schema.
- **Segurança:** ver 5.6. Todas as queries filtram por **clube + época + âmbito**.
- **Navegadores:** últimas 2 versões de Chrome/Safari/Firefox/Edge; Safari iOS; Chrome Android. Sem IE.
- **Custo operacional mínimo:** sem IA no núcleo; só alojamento + BD + Storage.

---

## 14. Estratégia de testes

Nível: essencial mas obrigatório sobre **lógica de negócio e Server Actions**. **Vitest** (`npm run test`).

**Obrigatório testar:**
- **Schemas Zod** (inputs válidos e inválidos) — todos os módulos.
- **`DiagramaCampo`** v2 (validação, incluindo passos).
- **Agregações** (`lib/estatisticas.ts`): GR vs campo, `totalMinutos` null, taxa de presença com atleta a meio da época, agregação de eventos ao vivo.
- **Server Actions**: sucesso, falha de validação, falha de auth, **falha de capacidade/âmbito** (novo — permissões), e casos-limite da secção 9 (ex: remover convocado com estatísticas, apagar exercício em uso, nunca ficar sem admin).
- **Autorização** (`exigirCapacidade`): matriz perfil × capacidade × âmbito.

**Método:** Prisma/auth/época mockados para actions; funções puras testadas diretamente. Manter e alargar os testes do MVP. BD de teste isolada para eventuais testes de integração.

---

## 15. Stack, setup e deployment

### 15.1 Stack
Next.js 15 (App Router) · React 19 · TypeScript strict · Prisma + PostgreSQL (Supabase) · Auth.js v5 · Zod · Tailwind + shadcn/ui · Vitest · PWA (service worker). **Supabase Storage** para logótipos. Sem IA no núcleo.

### 15.2 Estrutura de pastas
`app/` (rotas App Router) · `components/` (ui, campo, layout, e por módulo) · `lib/actions/` (Server Actions) · `lib/schemas/` (Zod) · `lib/` (db, auth, contexto, estatísticas, permissões) · `prisma/` (schema, migrations, seed) · `tests/` · `docs/` (esta bíblia).

### 15.3 Convenções fixas
- Server Actions (não REST, exceto handler Auth.js); todas `"use server"`.
- Validação Zod em `lib/schemas/` (fonte única cliente/servidor).
- Padrão de action: validar → auth/membro → capacidade/âmbito → época → `Resultado<T>` → `revalidatePath`.
- Queries filtram sempre por clube (+ época + âmbito).

### 15.4 Supabase / ligações
- **Pooler obrigatório** em redes IPv4: Transaction pooler (6543, `?pgbouncer=true`) para a app (`DATABASE_URL`); Session pooler (5432) para migrações (`DIRECT_URL`).
- `prisma.directUrl` configurado. Segredos em `.env` (ver `.env.example`).

### 15.5 Comandos
`npm run dev` · `typecheck` · `lint` · `test` · `db:migrate` · `db:seed` · `db:studio`.

### 15.6 Deployment
A definir (candidato: Vercel + Supabase). PWA servida via HTTPS. Backups da BD e política de retenção a definir na fase de produção.

---

## 16. Ordem de desenvolvimento (fases)

Cada fase fica **funcional, testada e documentada** antes da seguinte. A doc (esta bíblia) atualiza-se no mesmo passo do código (regra de ouro). "Definição de pronto" por fase: implementado conforme a bíblia · validação Zod + `Resultado<T>` · **permissões verificadas** · estados loading/vazio/erro · responsivo · `typecheck`+`lint`+`test` limpos · secção da bíblia atualizada.

**Fase 1 — Esqueleto (fundação, bloqueia tudo).** ✅ CONCLUÍDA (2026-07-31)
Migração do schema MVP → modelo v5: `Utilizador` independente, `Clube`, `MembroClube` (uma adesão ativa), `Perfil` + capacidades, `AtribuicaoEscalao`, propriedade de conteúdo (`proprietario`), `Consentimento`. Auth (registo, criar clube, convites, uma sessão). Contexto de sessão (`obterMembroAtual`, `exigirCapacidade`). Branding dinâmico (cores + logo). RGPD base. UI de membros e perfis.
Notas transitórias (a completar na Fase 2): `Exercicio` mantém `clubeId` + `criadorId` e `proprietario` default `CLUBE` (portabilidade completa na Fase 2); logótipo por URL (upload Supabase Storage é follow-up); os módulos existentes ainda usam `obterClubeIdAtual` (resolve via adesão ativa) — a verificação de capacidade/âmbito entra na Fase 2.

**Fase 2 — Reconversão dos módulos do MVP** para o novo modelo de contas/permissões/propriedade. ✅ Backend concluído (2026-08-01): todas as Server Actions de escrita (escalões, épocas, métricas, habilidades, plantel, treinos, presenças, exercícios, jogos, convocatória, estatísticas, caderneta) verificam `exigirCapacidade(cap, escalaoId?)`; as listagens (plantel, treinos, jogos) filtram por âmbito (`escaloesLegiveis`/`podeLerEscalao`). Falta (polish, Fase 10): **gating de UI** — esconder/desativar ações que o membro não pode executar (segurança já garantida no servidor).

**Fase 3 — Periodização** (planos semanais/mensais, microciclos/mesociclos, grelha anual, ligação a sessões). ✅ CRUD implementado (2026-08-01): modelo `Planeamento` (+ enums `TipoPlaneamento`, `PeriodoEpoca`), `Sessao.planeamentoId`/`microciclo`/`mesociclo`. Actions `periodizacao.ts` (listar/criar/atualizar/apagar com `PERIODIZACAO_GERIR`+âmbito). UI `/treinos/periodizacao`. Falta (enhancement): grelha anual visual e seleção de planeamento no formulário de sessão.

**Fase 4 — Modelo de jogo e quadro tático** (reutiliza o editor de campo). ✅ Modelo de jogo implementado (2026-08-01): modelos `ModeloJogo` (autor + proprietario + momento + princípios + diagrama) e `QuadroTatico` + enum `MomentoJogo`. Actions `modeloJogo.ts` (CRUD com MODELO_JOGO_GERIR), UI `/modelo-jogo` (biblioteca por momento, editor de campo reutilizado, detalhe/editar), ligada a partir de Jogos. Falta (Fase 5): UI de `QuadroTatico` no detalhe do jogo (modelo + schema já existem).

**Fase 5 — Jogos avançado:** competições/calendário, **modo ao vivo** (eventos → agregação), scouting do adversário, vídeo (YouTube). ✅ Núcleo implementado (2026-08-01): `Jogo` ganha tipo (OFICIAL/AMIGAVEL), faltas por parte, vídeo (link YouTube), `competicaoId`; modelos `Competicao`, `EventoJogo` (+ enums `TipoJogo`, `TipoEventoJogo`), `ObservacaoAdversario`/`ObservacaoJogadorAdversario`. UI: campos no formulário de jogo, vídeo/faltas no detalhe, e **`RegistoAoVivo`** (registo de eventos por parte/atleta/minuto). ✅ Completa: CRUD de **Competições** (`/jogos/competicoes`) e **Scouting** (`/jogos/scouting`), ligados a partir de Jogos. Enhancement futuro: seletor de competição no formulário de jogo e agregação automática eventos→estatísticas.

**Fase 6 — Animação de diagramas** (`DiagramaCampo` v2 com passos: playback + editor de passos). ✅ Implementada (2026-08-01): `diagramaSchema` estendido (versão 1|2 + `passos`), `CampoAnimado` (playback com interpolação por `requestAnimationFrame`), captura de passos no `EditorCampo` ("Capturar passo"/"Limpar passos"). Usado nos detalhes de exercício e modelo de jogo. Anima elementos-ponto (jogador/bola/cone) A→B; setas/linhas ficam estáticas.

**Fase 7 — Reuniões** (escalão/clube, ata exposta). ✅ Implementada (2026-08-01): modelo `Reuniao` + enum `AmbitoReuniao`, actions `reunioes.ts` (CRUD, REUNIOES_GERIR; reuniões de clube visíveis a todos, de escalão a quem lê o escalão), UI `ReunioesLista` + `/reunioes` (na navegação). Ata exposta na lista.

**Fase 8 — Relatórios e tracking de fim de época + PDF** (equipa e por atleta; templates com branding). ✅ Implementada (2026-08-01): action `relatorios.ts` (`obterRelatorioEquipa`: jogos/V-E-D, golos, sessões, melhores marcadores/assistentes). Páginas `/relatorios` (por escalão, com links para relatórios individuais) e `/plantel/[id]/relatorio` (relatório de desenvolvimento do atleta: stats + caderneta + observações). **PDF via impressão do browser** (`BotaoImprimir` → `window.print()`, sem dependências; barra/nav com `print:hidden`). Sem IA.

**Fase 9 — Biblioteca curada de arranque** (exercícios reais com diagramas, como seed). ✅ Implementada (2026-08-01): `lib/biblioteca-arranque.ts` com 10 exercícios reais de futsal (ativação, técnica, finalização, posse, transições, situações, jogo reduzido, bolas paradas, físico) com diagramas. Action `instalarBibliotecaArranque` (idempotente, EXERCICIOS_GERIR, marca `origemSeed`) + botão na biblioteca; também incluída no seed do clube demo. Custo zero em runtime (conteúdo autorado, sem IA).

**Fase 10 — PWA/offline (modo jornada) + polish visual + caderneta gamificada.** ✅ Implementada (2026-08-01): **PWA** — `app/manifest.ts` (`/manifest.webmanifest`), ícone SVG, service worker (`public/sw.js`, network-first + cache de estáticos), registo via `RegistarSW` (só em produção), theme-color. **Caderneta gamificada** — barra de progresso + percentagem + celebração ao desbloquear. `print:hidden` na navegação (relatórios limpos). Build de produção verde. Nota: offline **robusto** (sync de escrita beira-campo) e ícones PNG dedicados ficam como afinação futura; a base PWA (instalável) está pronta. **Gating de UI de permissões continua parcial** (segurança garantida no servidor) — afinação futura.

*(FUTURO, fora destas fases: portal de pais/WhatsApp, camada de clube (quotas/material/espaços), IA como plugin pago, APK.)*

---

## 17. Modelo de negócio e licenciamento

### 17.1 Duas formas de venda ("2 em 1")
- **Licença individual (treinador):** o treinador usa sozinho; o conteúdo que cria é **dele** (`proprietario = TREINADOR`, portátil).
- **Licença de clube (ecossistema):** o clube adquire **X licenças de treinador + a licença de ecossistema** (o espaço do clube com escalões, permissões e branding). O conteúdo criado sob esta licença é **do clube** (`proprietario = CLUBE`).

### 17.2 Propriedade ligada à licença
A propriedade do conteúdo metodológico segue **quem paga** (secção 4.2). É o que permite o percurso: o treinador usa individualmente → mostra ao clube → o clube adere; e, se sair, leva o que é seu.

### 17.3 Princípios comerciais
- **Custo operacional mínimo** (sem IA no núcleo) → margens saudáveis mesmo com preço acessível ao mercado de formação.
- Vantagem competitiva vs concorrente individual (Dossier do Treinador): **ecossistema de clube + mobile/offline + desenvolvimento do atleta + animação**.

### 17.4 A definir (fase de produção)
Valores/tiers, trial gratuito, limites (nº de escalões/atletas), faturação e renovação, revendedores. *(O modelo de licença técnico — enforcement, expiração, estado pós-expiração — será especificado quando avançarmos para produção; a arquitetura de contas/adesão já o suporta.)*

---

## 18. Roadmap futuro (fora da v1)

- Portal de pais (comunicação de convocatória/comunicados, WhatsApp, gratuito).
- Camada de gestão de clube (quotas/pagamentos, material, espaços, documentos).
- IA como plugin pago (geração de exercícios/planos, redação de relatórios).
- Biblioteca partilhada/comunidade (em avaliação — "o treino é o segredo").
- App via APK (embrulho TWA/Capacitor da PWA), se necessário.

---

## 19. Changelog da documentação

Toda a alteração a este documento é registada aqui, com data e descrição. Do mais recente para o mais antigo.

- **2026-08-02** — **Preparação para deploy (Vercel).** `generator client` do Prisma ganha `binaryTargets = ["native", "rhel-openssl-3.0.x"]` (runtime serverless). `docs/DEPLOY.md` com secção "Deploy rápido no Vercel" (importar repo, env vars, redeploy automático por push).

- **2026-08-02** — **Gráficos com a cor do clube + fluxo de entrada.** (1) Gráficos (`GraficoBarrasH/V`, `GraficoLinhas`) passam a usar `var(--cor-primaria)` na série principal (herda do layout) + neutros quentes no grid/texto; 2.ª série das linhas fica em âmbar (contraste). (2) **Entrada:** sessão inválida/obsoleta → **`/login`** (deixa de ser forçada para `/criar-clube`); guarda no `/login` (só redireciona para dashboard se o utilizador existir) evita loop. `(app)`/layout e `/criar-clube` validam a existência do utilizador da sessão.

- **2026-08-02** — **Rebranding: Mister → Mister + nova identidade visual.** Projeto renomeado para **Mister** (package, manifest, títulos, favicon `public/icon.svg`, login/registar). Nova marca (guia em `docs/BRAND.md`): logótipo do quadro tático (`components/layout/Logo.tsx`) — preto + laranja `#F0531E`; tipografia **Bricolage Grotesque** (display) + Inter, via `next/font`; **neutros quentes** (papel `#EDEBE7`, superfície `#F7F5F2`, tinta `#141210`) — retunados nos tokens `cinza-*`; laranja como primária default. **Arquitetura de cor:** marca fixa + **cor do clube dinâmica** — `Clube.corPrimaria` convertida hex→HSL para `--primary`/`--ring` (botões seguem o clube) e usada em todos os acentos (herói, nav, chips, avatar, tabs/links via `text-primary`). Barra de topo mostra **só a marca Mister**; o clube identifica-se por **marca de água centrada a preencher a página** (`.club-watermark`, logótipo do clube) visível em todos os tamanhos + nome no cabeçalho de identidade da página (treinador · papel / clube · escalões · época). Migração de acentos `azul-*`→`primary` em 35 ficheiros. Bíblia §12 atualizada. typecheck+build+51 testes verdes.

- **2026-08-02** — **Fix: sessão obsoleta em `criarClube`.** Um JWT que referencie um utilizador inexistente (BD reseeded / conta apagada) fazia o insert de `MembroClube` rebentar com erro de FK (500). `criarClube` passa a validar que o utilizador da sessão existe e devolve erro limpo ("sessão inválida, volta a entrar") em vez de crashar.

- **2026-08-02** — **Sincronização da bíblia com o código (corpo, não só changelog).** Corrigido drift no modelo de dados (§3) e no sistema de design (§12) que tinham ficado para trás dos Grupos B/D e da auditoria: (§3) `Exercicio.categoria CategoriaExercicio` → `categoriaPrincipal CategoriaExercicioPrincipal` + `subcategoriaId`; enum `CategoriaExercicio` → `CategoriaExercicioPrincipal`; adicionado modelo `SubcategoriaExercicio`; `Sessao` ganha `tipoSessao TipoSessao` + enum `TipoSessao`. (§12.1) tokens de cor completos (cinza-100/300/500/700, azul-300, ambar-600) + regra de tokens definidos. (§5.5) nota do estado atual do RGPD (consentimento pelo clube). Objetivo: cumprir a regra "recriar do zero a 100%".

- **2026-08-02** — **Decisão RGPD — consentimento tratado pelo clube.** O consentimento parental (dados + imagem de menores) é recolhido pelo clube no ato de inscrição, **fora da aplicação**. A app assume que o consentimento existe para os atletas registados. O modelo `Consentimento` fica intencionalmente por ligar; `apagarAtleta` mantém-se soft-delete. Registo de consentimento in-app e hard-delete (direito ao esquecimento) passam a **melhorias futuras não-bloqueadoras**. Ver `docs/DEPLOY.md` §6.

- **2026-08-02** — **Auditoria de produção — Fase 6 (testes).** Novo `tests/actions-producao.test.ts` (7 testes) a cobrir as correções críticas da auditoria: `definirConvocatoria` (rejeita atletas alheios / aceita válidos), `guardarEstatisticas` (ignora não-convocados / rejeita input inválido), `reordenarExercicios` (rejeita ids de outra sessão), `apagarEscalao` (guard de sessões), `apagarHabilidade` (guard de progressos). Total: **51 testes** (era 44). Padrão de mock de Prisma/auth/permissões reutilizado.

- **2026-08-02** — **Auditoria de produção — Fase 5 (polish visual/a11y).** (1) **Tokens de cor em falta** adicionados ao `tailwind.config.ts` — `cinza-100/300/500/700` (95 usos) e `azul-300` (5 usos) não geravam CSS: texto "muted" caía para `cinza-900` (escuro) e bordas `cinza-100/300` ficavam invisíveis. Interpolados na rampa existente. (2) **`ambar-600`** (contraste AA ≥4.5:1) para **texto** de aviso — trocado em `treinos/[id]`, `plantel` (número duplicado), `JogoDetalhe`, `SessaoForm`; `ambar-500` mantém-se para ícones/bordas. (3) **Botões de reordenar** (escalões/métricas/habilidades/exercícios de sessão) com área de toque maior (h-8 w-8) + `focus-visible:ring`. *Follow-up de a11y (não bloqueador): aviso de alterações não guardadas em JogoDetalhe, `loading.tsx` por-rota, teclado no EditorCampo, ícones PNG para PWA.* typecheck+build+44 testes verdes.

- **2026-08-02** — **Auditoria de produção — Fase 4 (robustez/ops).** (1) `app/global-error.tsx` — error boundary raiz (cobre root layout e rotas fora de `(app)`), com ponto de integração de monitorização. (2) **10 índices Prisma** adicionados (`ValorMetrica.estatisticaId`, `Competicao.clubeId/escalaoId`, `Sessao.escalaoId/planeamentoId`, `Jogo.escalaoId`, `Planeamento.escalaoId`, `SessaoExercicio.exercicioId`, `ProgressoHabilidade.habilidadeId`, `MembroClube.perfilId`) — migração `20260802151958_add_indexes_producao` (aplicada via `migrate deploy`). (3) `.env.example` atualizado (`AUTH_TRUST_HOST`, nota de seed obrigatório em produção). (4) Novo `docs/DEPLOY.md` — guia operacional (env, migrações, build, seed, headers, pendências). typecheck+build+44 testes verdes.

- **2026-08-02** — **Auditoria de produção — Fase 3 (integridade de dados).** (1) **`dataIngresso`** passa a ser lido: `obterEstatisticasAtleta` e `obterPresencasMensal` usam `dataIngresso ?? criadoEm` como divisor da taxa de presença (secção 22.3); campo adicionado ao `atletaSchema`, persistido em criar/atualizar, e exposto no `AtletaForm`. (2) **Ranking de equipa** agrega por `atletaId` (não por nome — evita fundir homónimos). (3) **Guards de FK** em `apagarEscalao` (sessões/jogos/planeamentos/competições) e `apagarHabilidade` (progressos) — evitam P2003/500. (4) **`definirConvocatoria`** valida que os atletas pertencem ao clube/época/escalão do jogo. (5) **`reordenarExercicios`** valida que os ids pertencem à sessão. (6) `erroDeValidacao` (erros por campo) em `guardarEstatisticas`/`registarEventoJogo`/`marcarPresencas`; `atualizarProgresso` ganha schema Zod (`lib/schemas/caderneta.ts`). (7) **`convidarMembro`** cria utilizador+adesão em `$transaction` (sem conta órfã). typecheck+lint+build+44 testes verdes.

- **2026-08-02** — **Auditoria de produção — Fase 0 (build) + Fase 1 (segurança).** Corrigido o bloqueador de build (`SessaoForm` usava `<a>` para rota interna → `<Link>`). Segurança: (1) **dependências** — Next.js 15.1.0→15.5.22 (resolve CVE de disclosure de Server Functions), next-auth beta.25→beta.32 + @auth/core patched, `overrides` de `postcss`/`sharp`; resta só vitest/vite/esbuild (dev-only, não vai para produção). (2) **middleware** ganha callback `authorized` (bloqueia rotas sem sessão — defesa em profundidade). (3) **sessão** JWT com `maxAge` 7 dias. (4) **videoUrl** com allowlist YouTube+https (`isVideoUrlValido`) — bloqueia `javascript:`/`data:` que `z.string().url()` aceitava. (5) **rate-limiting** de login (janela deslizante em memória, 5 falhas/15 min). (6) **headers de segurança** em `next.config.js` (CSP, HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy). (7) **hardening do seed** (falha em produção sem `SEED_PASS_*`) + bcrypt cost 10→12. **Pendente do lado do utilizador (ops):** rodar password da BD Supabase e `AUTH_SECRET`. typecheck+lint+build+44 testes verdes.

- **2026-08-02** — **Grupo E — Estatística, visualização e análise de dados (gráficos).** Novos gráficos SVG puros (sem biblioteca externa) seguindo o sistema de design (paleta azul-700 + ambar-500, validada com `validate_palette.js`; barras finas ≤24px, linhas 2px, dots ≥8px com surface ring, grid hairline, sem eixo duplo). Componentes: `GraficoBarrasH` (barras horizontais para rankings), `GraficoLinhas` (linha com hover crosshair + tooltip, 1–2 séries, legenda se ≥2 séries), `GraficoBarrasV` (barras verticais para taxa de presença mensal). Ação `lib/actions/analise.ts` (`obterEvolucaoAtleta`, `obterPresencasMensal`). Perfil do atleta (aba Estatísticas): gráfico de golos+assistências por jogo + gráfico de presença mensal (exibidos se ≥2 pontos de dados). Relatórios: rankings de marcadores e assistentes visualizados como `GraficoBarrasH`. Todos os gráficos têm vista de tabela acessível (`<table class="sr-only">`). 44 testes verdes.

- **2026-08-02** — **Grupo D — Exercícios: categoria principal + subcategorias customizáveis + UX.** Enum `CategoriaExercicioPrincipal` (ATAQUE/DEFESA/TRANSICAO/BOLAS_PARADAS/FISICO/GUARDA_REDES/OUTRO) substitui `CategoriaExercicio`. Modelo `SubcategoriaExercicio` (por clube, `sistema: Boolean`). `Exercicio.categoriaPrincipal + subcategoriaId`. Migração `20260802112335_grupo_d_subcategorias_exercicio`. `ExercicioForm` redesenhado (2 níveis de classificação). Página Definições > Subcategorias com CRUD completo. `lib/subcategorias-arranque.ts` (22 subcategorias seed, sistema=true). Action `instalarSubcategoriasArranque` idempotente. 44 testes verdes.

- **2026-08-02** — **Grupo B — Periodização smart + sessão ligada a periodização.** Enum `TipoSessao` (NORMAL/ABERTO/CAPTACAO/EVENTO) + campo em `Sessao`. Migração `20260802111351_grupo_b_tipo_sessao`. Action `sugerirPlaneamento(escalaoId, tipo)` infere datas/microciclo/período a partir do último planeamento. `PlaneamentoForm` usa `useEffect` para pré-preencher com a sugestão (chip "Datas preenchidas automaticamente"). `SessaoForm` mostra seletor de tipo; apenas tipo NORMAL mostra seletor de planeamento (aviso suave se sem planeamento quando existem planeamentos). 44 testes verdes.

- **2026-08-01** — **Grupo C — Equipa técnica.** Secção "Membros" em Definições renomeada para "Equipa técnica" (label na UI e navegação). Sem alteração de schema.

- **2026-08-01** — **Melhorias pós-review (dono do produto).** (1) Layout: dashboard redesenhado (fundo com profundidade, `card-base`/`card-hover`/`chip-clube` em globals.css). (2) Fix: `EditorCampo.anular()` fazia setState do pai dentro de updater. (3) **Grupo A — modelo do Atleta:** `posicao` (única) → `posicoes Posicao[]` (posições múltiplas); `escalaoSecundarioId?` (atleta em 1–2 escalões; listagens incluem principal OU secundário); `fotoUrl` (por URL) + avatar com foto; campos do **encarregado de educação** (nome/contacto/email). Migração `20260801153513_grupo_a_atleta`. GR passa a `posicoes.includes(GUARDA_REDES)` em todo o lado. AtletaForm com posições em chips + escalão secundário + encarregado. 44 testes verdes. *(Backlog do review em memória: grupos B periodização/sessão, C equipa técnica, D exercícios, E estatística/visualização.)*

- **2026-08-01** — **Fase 10 (PWA + polish) implementada.** PWA: `app/manifest.ts`, `public/icon.svg`, `public/sw.js` (SW seguro), `RegistarSW` no layout raiz, theme-color/appleWebApp. Caderneta: barra de progresso + celebração ao desbloquear. `print:hidden` na navegação. Build de produção verde. **Todas as 10 fases do produto final implementadas.** Afinações futuras: offline de escrita robusto, ícones PNG, gating de UI de permissões completo.
- **2026-08-01** — **Fase 9 (Biblioteca curada) implementada.** `lib/biblioteca-arranque.ts` (10 exercícios reais com diagramas). Action `instalarBibliotecaArranque` (idempotente) + `InstalarBibliotecaButton` na biblioteca; incluída no seed do clube demo. Sem IA em runtime. 43 testes verdes.
- **2026-08-01** — **Fase 8 (Relatórios + PDF) implementada.** Action `relatorios.ts` (relatório de equipa por escalão). Páginas `/relatorios` e `/plantel/[id]/relatorio` (relatório individual). PDF por impressão do browser (`BotaoImprimir`); `print:hidden` na barra/navegação. Links a partir do plantel e do perfil do atleta. Sem dependências novas, sem IA. typecheck+lint+testes verdes.
- **2026-08-01** — **Fase 7 (Reuniões) implementada.** Modelo `Reuniao` + enum `AmbitoReuniao` (CLUBE/ESCALAO); migração `20260801115157_fase7_reunioes`. Schema `reuniao.ts`, actions `reunioes.ts` (CRUD com REUNIOES_GERIR + visibilidade por âmbito), UI `ReunioesLista` + `/reunioes`, item "Reuniões" na navegação. typecheck+lint+testes verdes.
- **2026-08-01** — **Fase 6 (Animação de diagramas) implementada.** `diagramaSchema` v2 (versão 1|2 + `passos` com posições por elemento). `CampoAnimado` faz playback interpolado (requestAnimationFrame); `EditorCampo` ganha "Capturar passo"/"Limpar passos" (cada passo = snapshot completo das posições). Integrado nos detalhes de exercício e modelo de jogo. Teste de schema atualizado. 43 testes verdes.
- **2026-08-01** — **Fase 5 (cauda) implementada.** Actions `competicoes.ts` (CRUD, COMPETICOES_GERIR+âmbito) e `scouting.ts` (CRUD ObservacaoAdversario, SCOUTING_GERIR); schema `competicao.ts`. UI `CompeticoesLista` (`/jogos/competicoes`) e `ScoutingLista` (`/jogos/scouting`), ligadas a partir da página de Jogos. Fase 5 concluída (exceto enhancements: seletor de competição no jogo, agregação eventos→estatísticas).
- **2026-08-01** — **Fase 5 (núcleo) implementada.** `Jogo`: tipo, faltas1aParte/2aParte, videoUrl, competicaoId. Modelos `Competicao`, `EventoJogo`, `ObservacaoAdversario`, `ObservacaoJogadorAdversario` + enums `TipoJogo`/`TipoEventoJogo`. Migração `20260801113000_fase5_jogos_avancado`. Actions de jogo: campos novos em criar/atualizar, `definirVideo`, `registarEventoJogo`, `apagarEventoJogo` (ESTATISTICAS_GERIR + âmbito). UI: `JogoForm` (tipo/faltas/vídeo), detalhe mostra vídeo/faltas, componente `RegistoAoVivo`. Falta na Fase 5: CRUD de Competições e Scouting + seletor de competição no jogo. typecheck+lint+testes verdes.
- **2026-08-01** — **Fase 4 (Modelo de jogo) implementada.** Modelos `ModeloJogo` e `QuadroTatico` + enum `MomentoJogo`; `Utilizador.modelosJogo`, `Jogo.quadros`. Migração `20260801112333_fase4_modelo_jogo`. Schema `modeloJogo.ts`, actions `modeloJogo.ts` (CRUD, MODELO_JOGO_GERIR), UI biblioteca `/modelo-jogo` com editor de campo reutilizado. QuadroTatico (por jogo): modelo+schema prontos, UI no detalhe do jogo fica para a Fase 5.
- **2026-08-01** — **Fase 3 (Periodização) implementada.** Modelo `Planeamento` (clube/escalão/época, tipo SEMANAL/MENSAL, período, meso/microciclo, datas, objetivos) + enums; `Sessao` ganha `planeamentoId`, `microciclo`, `mesociclo`. Migração `20260801075604_fase3_periodizacao`. Schema Zod `planeamento.ts`, actions `periodizacao.ts` (CRUD com PERIODIZACAO_GERIR + âmbito), UI `PlaneamentoLista` + `/treinos/periodizacao` (ligada a partir de Treinos). typecheck+lint+testes verdes.
- **2026-08-01** — **Fase 2 (backend) implementada.** Todas as Server Actions de escrita passam a verificar capacidade/âmbito via `exigirCapacidade` (escalões→CLUBE_ESCALOES, épocas→CLUBE_EPOCAS, métricas→CATALOGO_METRICAS, habilidades→CATALOGO_HABILIDADES, plantel→PLANTEL_GERIR+escalão, treinos/exercícios-de-sessão→TREINOS_GERIR+escalão, presenças→PRESENCAS_MARCAR+escalão, exercícios→EXERCICIOS_GERIR, jogos→JOGOS_GERIR+escalão, convocatória→CONVOCATORIA_GERIR+escalão, estatísticas→ESTATISTICAS_GERIR+escalão, caderneta→CADERNETA_GERIR+escalão). Listagens de plantel/treinos/jogos e leituras (obter*) filtram por âmbito (`escaloesLegiveis`, `podeLerEscalao`); adicionado `definirVisibilidadeEscalao`. Testes de actions atualizados ao novo modelo (mock de `permissoes`); 42 testes verdes. Gating de UI fica para o polish (Fase 10).
- **2026-07-31** — **Fase 1 (Esqueleto) implementada.** Schema migrado para o modelo v5 (`Utilizador` independente de clube; `MembroClube`, `Perfil`, `AtribuicaoEscalao`, `Consentimento`; `Escalao.visivelOutrosTreinadores`; `Atleta.dataIngresso`; `Exercicio.proprietario`/`origemSeed`; enums `EstadoMembro`, `AmbitoPerfil`, `TipoConsentimento`, `PropriedadeConteudo`). Migração `20260731191357_fase1_ecossistema` aplicada; seed reescrito (clube + 4 perfis de arranque + membros). Novos helpers `lib/permissoes.ts` (`obterUtilizadorAtual`, `obterMembroAtual`, `obterClubeAtivo`, `exigirCapacidade`, `podeLerEscalao`) e `lib/permissoes-catalogo.ts` (catálogo + perfis de arranque). Novas actions: `membros` (em utilizadores.ts), `perfis`, `onboarding` (registar/criarClube), `clubes` (branding). UI: Membros, Perfis, Clube (branding), /registar, /criar-clube; layout aplica cores do clube via CSS vars e redireciona sem-clube para onboarding. Notas transitórias registadas na secção 16 (Fase 1). typecheck+lint+41 testes verdes; smoke test autenticado OK.
- **2026-07-31** — **Bíblia completa.** Redigidas todas as secções restantes: 2 (glossário/terminologia pt-PT), 8 (módulos funcionais — onboarding, membros/perfis, branding, definições, plantel, exercícios, treinos, periodização, modelo de jogo, jogos/live/scouting, caderneta, relatórios/PDF, dashboard, carreira), 9 (regras e casos-limite — herdados do MVP + novos do ecossistema), 10 (estatísticas e agregações com fórmulas), 11 (DiagramaCampo v2 com passos/animação), 12 (design + branding dinâmico), 13 (UI/PWA/offline/i18n/NFR), 14 (testes), 15 (stack/setup/deployment), 16 (10 fases com definição de pronto), 17 (modelo de negócio/licenciamento). Documentação pronta para arrancar a Fase 1 (esqueleto).
- **2026-07-31** — Redigidas as secções fundadoras 5, 6 e 7: **5 (Contas, autenticação, adesão a clube, RGPD)** — Auth.js/credenciais, uma sessão por conta, modos individual/clube, transição de clube, contexto de sessão, RGPD de menores (consentimento, soft/hard-delete, minimização); **6 (Permissões)** — modelo Perfil=âmbito+capacidades, catálogo completo de capacidades, âmbito, leitura de escalões alheios, defaults editáveis, algoritmo de autorização, regras de proteção (nunca sem admin); **7 (Server Actions)** — padrão obrigatório, helpers de contexto e assinaturas por módulo. Fundação documental completa (1,3,4,5,6,7) para arrancar o esqueleto.
- **2026-07-31** — Validação do modelo de dados (secção 3) e decisões de propriedade:
  - **Uma adesão de clube ativa de cada vez** por utilizador (não multi-clube simultâneo); dentro do clube, vários escalões. `MembroClube` passa a ter a regra de "máximo uma adesão ATIVA" (secção 3.1, 4.3).
  - **Propriedade do conteúdo metodológico segue a licença:** adicionado `proprietario: PropriedadeConteudo (CLUBE|TREINADOR)` + `clubeProprietarioId` a `Exercicio` e `ModeloJogo`; conteúdo `TREINADOR` usado em sessões do clube fica como **snapshot só-de-leitura** no clube (secção 3.3, 3.5, 4.2).
  - **Histórico de carreira** confirmado: `RegistoCarreira` preenchido automaticamente + editável manualmente (secção 3.9).
- **2026-07-31** — Criação da bíblia v5. Índice completo; secção 1 (Visão, âmbito, princípios, modelo 2-em-1) e secção 3 (modelo de dados completo do produto final) redigidas; restantes secções com âmbito definido e conteúdo por redigir. `Spec_v4` renomeado para `Mister_Spec_v4_MVP_historico.md` (arquivado). Regra de documentação adicionada ao CLAUDE.md.
