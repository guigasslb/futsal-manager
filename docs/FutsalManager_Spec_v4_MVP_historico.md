# Mister — Especificação Técnica

**Versão:** 4.0 — Especificação do Produto Completo (MVP + Fase 2)
**Data:** Julho 2026
**Autor:** Gonçalo Pereira
**Objetivo:** Especificação completa e autossuficiente do Mister — um Training Management System (TMS) dedicado ao futsal. Cobre o **produto final por inteiro**: a Parte I especifica o MVP (primeira fase de implementação) e a Parte II o produto completo (fase 2), ambos ao mesmo nível de detalhe. Este é o documento único e definitivo do projeto — escrito para ser implementado sem decisões implícitas e sem depender de contexto externo. Cada comportamento, validação e estado está especificado.

---

## Como usar este documento

Este documento é a **fonte única de verdade** (a "bíblia") do projeto — cobre todo o produto, não apenas a primeira fase. Estrutura:

- **Parte I (secções 1–24):** o MVP. Implementa-se primeiro.
- **Parte II (secções 25–35):** o produto completo (fase 2). Especificado ao mesmo detalhe, para construir depois do MVP validado.

As adições da Parte II são **retrocompatíveis** com o MVP (novas tabelas e campos nullable, nunca alterações destrutivas). Regras de leitura:

- Onde diz **DEVE**, é um requisito obrigatório.
- Onde diz **DEVERIA**, é recomendado mas com margem de decisão.
- Onde diz **NÃO FAZ PARTE DO MVP**, não implementar agora.
- Blocos de código são especificação, não sugestão — os nomes de campos, tipos e assinaturas devem ser seguidos tal como estão.
- A terminologia de domínio (futsal) está no Anexo A e DEVE ser respeitada na interface.

---

## Índice

1. [Visão Geral](#1-visão-geral)
2. [Glossário de Domínio](#2-glossário-de-domínio)
3. [Stack Tecnológico](#3-stack-tecnológico)
4. [Arquitetura do Projeto](#4-arquitetura-do-projeto)
5. [Modelo de Dados](#5-modelo-de-dados)
6. [Autenticação e Utilizadores](#6-autenticação-e-utilizadores)
7. [Estrutura de Ecrãs](#7-estrutura-de-ecrãs)
8. [Fluxos Principais](#8-fluxos-principais)
9. [Server Actions](#9-server-actions)
10. [Validação e Tratamento de Erros](#10-validação-e-tratamento-de-erros)
11. [Estados de UI](#11-estados-de-ui-loading-vazio-erro)
12. [Regras de Negócio](#12-regras-de-negócio)
13. [Componente de Campo de Futsal](#13-componente-de-campo-de-futsal)
14. [Caderneta de Habilidades](#14-caderneta-de-habilidades)
15. [Estatísticas e Agregações](#15-estatísticas-e-agregações)
16. [MVP vs Fase 2](#16-mvp-vs-fase-2)
17. [Setup e Deployment](#17-setup-e-deployment)
18. [Ordem de Desenvolvimento](#18-ordem-de-desenvolvimento)
19. [Sistema de Design](#19-sistema-de-design)
20. [Wireframes dos Ecrãs Principais](#20-wireframes-dos-ecrãs-principais)
21. [Editor de Campo — Especificação de Interação](#21-editor-de-campo--especificação-de-interação-completa)
22. [Casos-Limite e Comportamentos Especiais](#22-casos-limite-e-comportamentos-especiais)
23. [Requisitos Não-Funcionais](#23-requisitos-não-funcionais)
24. [Definição de Pronto](#24-definição-de-pronto)

**Parte II — Produto Completo (Fase 2)**

25. [Visão do Produto Completo](#25-visão-do-produto-completo)
26. [Planeamento de Época (Periodização)](#26-planeamento-de-época-periodização)
27. [Relatórios e Exportação PDF](#27-relatórios-e-exportação-pdf)
28. [Dashboard Analítico](#28-dashboard-analítico)
29. [Caderneta Avançada](#29-caderneta-avançada)
30. [Portal de Pais/Atletas](#30-portal-de-paisatletas)
31. [Multi-clube (Opcional)](#31-multi-clube-opcional)
32. [Transição de Plantel entre Épocas](#32-transição-de-plantel-entre-épocas)
33. [Biblioteca Partilhada e Animação](#33-biblioteca-partilhada-e-animação-de-exercícios)
34. [Roadmap de Implementação](#34-roadmap-de-implementação-produto-completo)
35. [Modelo de Dados Consolidado](#35-modelo-de-dados-consolidado-produto-completo)

---

# PARTE I — MVP (PRIMEIRA FASE)

> As secções 1–24 especificam o MVP: o produto mínimo utilizável, a implementar primeiro. A Parte II (secções 25+) especifica a evolução para o produto completo.

## 1. Visão Geral

### 1.1 O que é

O **Mister** é uma aplicação web de gestão de treino e equipas dedicada ao futsal. Permite planear sessões de treino, gerir o plantel, construir uma biblioteca de exercícios com diagramas de campo, controlar presenças e convocatórias, registar jogos com estatísticas por atleta, e acompanhar o desenvolvimento técnico individual através de uma caderneta de habilidades.

### 1.2 Porquê existe

As ferramentas de gestão de treino existentes são pensadas para futebol e tratam o futsal como subproduto — dimensões de campo erradas, terminologia incorreta, ausência de lógica pedagógica adaptada, e sem noção das rotações constantes que caracterizam o futsal. O Mister é construído de raiz para futsal.

### 1.3 Âmbito do MVP

Uso interno por dois treinadores (principal e adjunto) num clube, com expansão prevista aos restantes escalões do mesmo clube. **Não** é uma solução comercial multi-clube nesta fase, mas a arquitetura não impede essa evolução.

### 1.4 Princípios de design

- **Tablet-first, totalmente responsivo.** Padrão de uso: tablet à beira do campo. DEVE funcionar bem em telemóvel e PC.
- **Rapidez de uso.** Ações frequentes (marcar presenças, convocatória) DEVEM ser rápidas e com poucos toques.
- **Offline-tolerante onde importa.** Marcar presenças e estatísticas à beira do campo pode acontecer com rede fraca. Ver secção 11.4.
- **Língua:** Português de Portugal em toda a interface. Sem exceções.

### 1.5 Contexto de uso real (importante para decisões de UX)

Estas realidades do futsal moldam o produto e DEVEM ser tidas em conta:

- **Rotações constantes.** Um atleta entra e sai várias vezes num jogo. Registar minutos exatos é impraticável — o sistema usa estado de utilização + minutos aproximados opcionais.
- **Jogo em duas partes.** O futsal joga-se em 2 partes (tipicamente 20-25 min cada nos escalões de formação, ou 2×20 tempo corrido). O modelo reflete isto.
- **Plantéis pequenos.** Futsal joga 5 (GR + 4). Um plantel de formação tem tipicamente 10-14 atletas.
- **O guarda-redes é especial.** Tem métricas próprias (defesas, golos sofridos) que não se aplicam aos de campo.
- **Época desportiva.** Todo o trabalho organiza-se por época (ex: 2025/26). As estatísticas nunca devem misturar épocas.

---

## 2. Glossário de Domínio

Termos de futsal usados no modelo e na interface. Implementação DEVE usar exatamente estes termos em português.

| Termo | Significado | Onde aparece |
|---|---|---|
| **Escalão** | Grupo etário (Traquinas, Benjamins, Infantis…) | Modelo, navegação |
| **Época** | Temporada desportiva (ex: 2025/26) | Filtro global, estatísticas |
| **Plantel** | Conjunto de atletas de um escalão numa época | Navegação |
| **Guarda-redes (GR)** | Guardião | Posição |
| **Fixo** | Defensor / último jogador de campo | Posição |
| **Ala** | Jogador de corredor lateral | Posição |
| **Pivô** | Jogador mais avançado, referência ofensiva | Posição |
| **Universal** | Joga em várias posições | Posição |
| **Sessão / Unidade de Treino** | Um treino | Navegação |
| **Convocatória** | Lista de atletas selecionados para um jogo | Jogos |
| **Habilidade** | Move técnico da caderneta (vírgula, flip-flap…) | Caderneta |
| **Parte** | Metade de um jogo (1ª/2ª parte) | Estatísticas |

---

## 3. Stack Tecnológico

| Camada | Tecnologia | Versão-alvo | Justificação |
|---|---|---|---|
| Framework | **Next.js** (App Router) | 15.x | Web responsiva, server actions |
| Runtime React | **React** | 19.x | — |
| Linguagem | **TypeScript** | 5.x (strict) | Type safety obrigatório |
| Styling | **Tailwind CSS** | 3.x | Responsivo, tablet-first |
| Componentes UI | **shadcn/ui** | atual | Acessíveis, customizáveis |
| Base de dados | **PostgreSQL** | 15+ | Relacional |
| ORM | **Prisma** | 5.x | Type-safe, migrations |
| Autenticação | **Auth.js (NextAuth)** | 5.x (beta) | Login credenciais |
| Validação | **Zod** | 3.x | Validação server+client partilhada |
| Hashing password | **bcryptjs** | atual | — |
| Datas | **date-fns** | 3.x | Manipulação de datas, locale PT |
| Desenho de campo | **SVG nativo** (custom) | — | Ver secção 13 |
| Hosting app | **Vercel** | — | Zero-config Next.js |
| Hosting BD | **Supabase** (PostgreSQL) | — | Gerido, backups automáticos |

### 3.1 Decisões técnicas fixas (não ambíguas)

- **TypeScript em modo `strict`.** `tsconfig.json` DEVE ter `"strict": true`.
- **Zod para toda a validação.** Cada Server Action valida o input com um schema Zod antes de tocar na base de dados. Os schemas Zod são a fonte de verdade da validação e são partilhados entre cliente e servidor.
- **Server Actions, não REST.** Não existe camada de API REST exceto o handler obrigatório do Auth.js.
- **date-fns com locale `pt`.** Todas as datas formatadas em português (ex: "22 de julho de 2026").
- **Timezone:** todas as datas guardadas em UTC na base de dados; apresentadas em `Europe/Lisbon`.
- **IDs:** `cuid()` para todas as entidades (via Prisma default).
- **Moeda/números:** não aplicável ao MVP.

---

## 4. Arquitetura do Projeto

### 4.1 Estrutura de pastas

```
mister/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── layout.tsx
│   ├── (app)/
│   │   ├── layout.tsx                 # Navegação + guarda de auth + seletor de época
│   │   ├── dashboard/page.tsx
│   │   ├── plantel/
│   │   │   ├── page.tsx               # Lista de atletas
│   │   │   ├── novo/page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx           # Perfil + estatísticas + caderneta
│   │   │       └── editar/page.tsx
│   │   ├── treinos/
│   │   │   ├── page.tsx               # Lista/calendário
│   │   │   ├── novo/page.tsx
│   │   │   └── [id]/page.tsx          # Detalhe: exercícios + presenças
│   │   ├── exercicios/
│   │   │   ├── page.tsx               # Biblioteca
│   │   │   ├── novo/page.tsx          # Editor de campo
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       └── editar/page.tsx
│   │   ├── jogos/
│   │   │   ├── page.tsx
│   │   │   ├── novo/page.tsx
│   │   │   └── [id]/page.tsx          # Convocatória + estatísticas + relatório
│   │   └── definicoes/
│   │       ├── page.tsx               # Índice de definições
│   │       ├── escaloes/page.tsx
│   │       ├── epocas/page.tsx
│   │       ├── metricas/page.tsx
│   │       ├── habilidades/page.tsx   # Catálogo de habilidades da caderneta
│   │       └── utilizadores/page.tsx
│   ├── api/auth/[...nextauth]/route.ts
│   ├── layout.tsx                     # Root + providers
│   └── globals.css
├── components/
│   ├── ui/                            # shadcn
│   ├── campo/
│   │   ├── CampoFutsal.tsx            # Render read-only do campo
│   │   ├── EditorCampo.tsx            # Editor interativo
│   │   ├── MiniaturaCampo.tsx         # Render reduzido para listagens
│   │   └── ferramentas/               # Barra de ferramentas do editor
│   ├── plantel/
│   ├── treinos/
│   ├── exercicios/
│   ├── jogos/
│   ├── caderneta/
│   └── layout/
│       ├── Navegacao.tsx
│       ├── SeletorEpoca.tsx           # Dropdown global de época
│       └── EstadosUI.tsx              # Loading, vazio, erro reutilizáveis
├── lib/
│   ├── actions/                       # Server Actions
│   │   ├── atletas.ts
│   │   ├── treinos.ts
│   │   ├── exercicios.ts
│   │   ├── jogos.ts
│   │   ├── caderneta.ts
│   │   ├── escaloes.ts
│   │   ├── epocas.ts
│   │   └── utilizadores.ts
│   ├── schemas/                       # Schemas Zod (validação partilhada)
│   │   ├── atleta.ts
│   │   ├── treino.ts
│   │   ├── exercicio.ts
│   │   ├── jogo.ts
│   │   └── ...
│   ├── db.ts                          # Prisma client singleton
│   ├── auth.ts                        # Auth.js config
│   ├── epoca-context.ts               # Helper para época ativa
│   └── utils.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── public/
├── .env.local
├── .env.example                       # Template das variáveis (sem valores)
├── middleware.ts                      # Proteção de rotas
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### 4.2 Época ativa (conceito transversal)

A **época ativa** é um estado global da aplicação. Funciona assim:

- Existe um seletor de época no topo da navegação (`SeletorEpoca.tsx`).
- A época selecionada é guardada num cookie (`epoca_ativa`).
- **Todas as queries de dados (atletas, sessões, jogos) são filtradas pela época ativa.**
- Se não houver cookie, usa a época marcada como `ativa: true` na base de dados.
- Um helper `obterEpocaAtiva()` em `lib/epoca-context.ts` lê o cookie/default e é usado por todas as Server Actions.

Isto garante que as estatísticas e listagens nunca misturam épocas.

### 4.3 Convenções

- Rotas em português.
- Server Actions agrupadas por entidade em `lib/actions/`.
- Schemas Zod em `lib/schemas/`, importados tanto pelas actions como pelos formulários.
- Componentes organizados por domínio.

---

## 5. Modelo de Dados

### 5.1 Visão geral das entidades

```
Clube ─┬─ Utilizador
       ├─ Epoca ──────────┐
       ├─ Escalao         │
       ├─ Exercicio       │ (Época filtra Atleta, Sessao, Jogo)
       ├─ MetricaConfig   │
       └─ Habilidade      │
                          │
Epoca + Escalao ──── Atleta ─┬─ Presenca
                             ├─ Convocatoria
                             ├─ EstatisticaAtleta ─── ValorMetrica
                             └─ ProgressoHabilidade

Epoca + Escalao ──── Sessao ─┬─ SessaoExercicio ─── Exercicio
                             └─ Presenca

Epoca + Escalao ──── Jogo ─┬─ Convocatoria
                           └─ EstatisticaAtleta
```

### 5.2 Schema Prisma completo

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─────────────────────────────────────────────
// CLUBE E UTILIZADORES
// ─────────────────────────────────────────────

model Clube {
  id            String   @id @default(cuid())
  nome          String
  corPrimaria   String   @default("#1A2FD4")
  corSecundaria String   @default("#FFD700")
  logoUrl       String?
  criadoEm      DateTime @default(now())

  utilizadores  Utilizador[]
  epocas        Epoca[]
  escaloes      Escalao[]
  exercicios    Exercicio[]
  metricas      MetricaConfig[]
  habilidades   Habilidade[]
}

model Utilizador {
  id            String   @id @default(cuid())
  nome          String
  email         String   @unique
  passwordHash  String
  clubeId       String
  clube         Clube    @relation(fields: [clubeId], references: [id])
  criadoEm      DateTime @default(now())
  atualizadoEm  DateTime @updatedAt

  sessoesCriadas    Sessao[]     @relation("SessaoCriador")
  jogosCriados      Jogo[]       @relation("JogoCriador")
  exerciciosCriados Exercicio[]  @relation("ExercicioCriador")

  @@index([clubeId])
}

// ─────────────────────────────────────────────
// ÉPOCA
// ─────────────────────────────────────────────

model Epoca {
  id          String   @id @default(cuid())
  nome        String   // ex: "2025/26"
  dataInicio  DateTime
  dataFim     DateTime
  ativa       Boolean  @default(false)  // época default ao entrar
  clubeId     String
  clube       Clube    @relation(fields: [clubeId], references: [id])
  criadoEm    DateTime @default(now())

  atletas     Atleta[]
  sessoes     Sessao[]
  jogos       Jogo[]
  progressos  ProgressoHabilidade[]

  @@index([clubeId])
}

// ─────────────────────────────────────────────
// ESCALÕES E ATLETAS
// ─────────────────────────────────────────────

model Escalao {
  id          String   @id @default(cuid())
  nome        String
  idadeMin    Int?
  idadeMax    Int?
  ordem       Int      @default(0)
  clubeId     String
  clube       Clube    @relation(fields: [clubeId], references: [id])
  criadoEm    DateTime @default(now())

  atletas     Atleta[]
  sessoes     Sessao[]
  jogos       Jogo[]

  @@index([clubeId])
}

model Atleta {
  id             String    @id @default(cuid())
  nome           String
  dataNascimento DateTime?
  posicao        Posicao?
  numero         Int?
  observacoes    String?   @db.Text
  ativo          Boolean   @default(true)

  // Um atleta pertence a um escalão NUMA época.
  // Se transitar de escalão/época, cria-se novo registo (histórico preservado).
  escalaoId      String
  escalao        Escalao   @relation(fields: [escalaoId], references: [id])
  epocaId        String
  epoca          Epoca     @relation(fields: [epocaId], references: [id])

  criadoEm       DateTime  @default(now())
  atualizadoEm   DateTime  @updatedAt

  presencas       Presenca[]
  convocatorias   Convocatoria[]
  estatisticas    EstatisticaAtleta[]
  progressos      ProgressoHabilidade[]

  @@index([escalaoId])
  @@index([epocaId])
  @@index([epocaId, escalaoId, ativo])
}

enum Posicao {
  GUARDA_REDES
  FIXO
  ALA
  PIVO
  UNIVERSAL
}

// ─────────────────────────────────────────────
// EXERCÍCIOS
// ─────────────────────────────────────────────

model Exercicio {
  id            String   @id @default(cuid())
  nome          String
  descricao     String?  @db.Text
  objetivo      String?  @db.Text
  duracaoMin    Int?
  categoria     CategoriaExercicio?
  diagrama      Json?    // DiagramaCampo (ver secção 13)
  clubeId       String
  clube         Clube    @relation(fields: [clubeId], references: [id])
  criadorId     String
  criador       Utilizador @relation("ExercicioCriador", fields: [criadorId], references: [id])
  criadoEm      DateTime @default(now())
  atualizadoEm  DateTime @updatedAt

  sessoes       SessaoExercicio[]

  // Exercícios não são filtrados por época — a biblioteca é reutilizável entre épocas.
  @@index([clubeId])
  @@index([clubeId, categoria])
}

enum CategoriaExercicio {
  ATIVACAO
  TECNICA_INDIVIDUAL
  FINALIZACAO
  POSSE_BOLA
  TRANSICOES
  SITUACOES_JOGO
  JOGO_REDUZIDO
  BOLAS_PARADAS
  FISICO
  OUTRO
}

// ─────────────────────────────────────────────
// SESSÕES DE TREINO
// ─────────────────────────────────────────────

model Sessao {
  id            String   @id @default(cuid())
  data          DateTime
  duracaoMin    Int?
  objetivo      String?  @db.Text
  local         String?
  notas         String?  @db.Text
  escalaoId     String
  escalao       Escalao  @relation(fields: [escalaoId], references: [id])
  epocaId       String
  epoca         Epoca    @relation(fields: [epocaId], references: [id])
  criadorId     String
  criador       Utilizador @relation("SessaoCriador", fields: [criadorId], references: [id])
  criadoEm      DateTime @default(now())
  atualizadoEm  DateTime @updatedAt

  exercicios    SessaoExercicio[]
  presencas     Presenca[]

  @@index([epocaId, escalaoId, data])
}

model SessaoExercicio {
  id            String    @id @default(cuid())
  sessaoId      String
  sessao        Sessao    @relation(fields: [sessaoId], references: [id], onDelete: Cascade)
  exercicioId   String
  exercicio     Exercicio @relation(fields: [exercicioId], references: [id])
  ordem         Int       @default(0)
  duracaoMin    Int?
  notas         String?   @db.Text

  @@unique([sessaoId, ordem])
  @@index([sessaoId])
}

model Presenca {
  id            String   @id @default(cuid())
  sessaoId      String
  sessao        Sessao   @relation(fields: [sessaoId], references: [id], onDelete: Cascade)
  atletaId      String
  atleta        Atleta   @relation(fields: [atletaId], references: [id])
  estado        EstadoPresenca @default(PRESENTE)
  justificacao  String?

  @@unique([sessaoId, atletaId])
  @@index([atletaId])
}

enum EstadoPresenca {
  PRESENTE
  FALTA
  FALTA_JUSTIFICADA
  LESIONADO
  ATRASADO
}

// ─────────────────────────────────────────────
// JOGOS E ESTATÍSTICAS
// ─────────────────────────────────────────────

model Jogo {
  id            String   @id @default(cuid())
  data          DateTime
  adversario    String
  casaFora      CasaFora @default(CASA)
  competicao    String?
  golosMarcados Int?     // total da equipa (preenchido pós-jogo)
  golosSofridos Int?
  local         String?
  relatorio     String?  @db.Text
  escalaoId     String
  escalao       Escalao  @relation(fields: [escalaoId], references: [id])
  epocaId       String
  epoca         Epoca    @relation(fields: [epocaId], references: [id])
  criadorId     String
  criador       Utilizador @relation("JogoCriador", fields: [criadorId], references: [id])
  criadoEm      DateTime @default(now())
  atualizadoEm  DateTime @updatedAt

  convocatorias Convocatoria[]
  estatisticas  EstatisticaAtleta[]

  @@index([epocaId, escalaoId, data])
}

enum CasaFora {
  CASA
  FORA
}

model Convocatoria {
  id            String   @id @default(cuid())
  jogoId        String
  jogo          Jogo     @relation(fields: [jogoId], references: [id], onDelete: Cascade)
  atletaId      String
  atleta        Atleta   @relation(fields: [atletaId], references: [id])
  convocado     Boolean  @default(true)

  @@unique([jogoId, atletaId])
  @@index([atletaId])
}

model EstatisticaAtleta {
  id            String   @id @default(cuid())
  jogoId        String
  jogo          Jogo     @relation(fields: [jogoId], references: [id], onDelete: Cascade)
  atletaId      String
  atleta        Atleta   @relation(fields: [atletaId], references: [id])

  // Utilização (adaptado às rotações do futsal)
  utilizacao    Utilizacao @default(NAO_UTILIZADO)
  minutos       Int?       // aproximado, opcional (null = não registado)

  // Métricas de jogador de campo
  golos         Int      @default(0)
  assistencias  Int      @default(0)

  // Métricas de guarda-redes (só relevantes se posição = GR; null caso contrário)
  defesas       Int?
  golosSofridosGR Int?   // golos sofridos com este GR em campo
  faltasCometidas Int?   // opcional, útil em futsal (acumulação de faltas)

  // Métricas configuráveis
  valoresMetricas ValorMetrica[]

  @@unique([jogoId, atletaId])
  @@index([atletaId])
}

enum Utilizacao {
  TITULAR
  UTILIZADO       // entrou durante o jogo
  NAO_UTILIZADO   // convocado mas não jogou
}

// ─────────────────────────────────────────────
// MÉTRICAS CONFIGURÁVEIS
// ─────────────────────────────────────────────

model MetricaConfig {
  id            String   @id @default(cuid())
  nome          String
  tipo          TipoMetrica @default(NUMERO)
  ativa         Boolean  @default(true)
  ordem         Int      @default(0)
  clubeId       String
  clube         Clube    @relation(fields: [clubeId], references: [id])

  valores       ValorMetrica[]

  @@index([clubeId])
}

enum TipoMetrica {
  NUMERO
  BOOLEANO
  ESCALA      // 1 a 5
}

model ValorMetrica {
  id              String   @id @default(cuid())
  metricaId       String
  metrica         MetricaConfig @relation(fields: [metricaId], references: [id], onDelete: Cascade)
  estatisticaId   String
  estatistica     EstatisticaAtleta @relation(fields: [estatisticaId], references: [id], onDelete: Cascade)
  valor           Int

  @@unique([metricaId, estatisticaId])
}

// ─────────────────────────────────────────────
// CADERNETA DE HABILIDADES
// ─────────────────────────────────────────────

model Habilidade {
  id          String   @id @default(cuid())
  nome        String   // ex: "Vírgula", "Flip-flap", "Elástico"
  descricao   String?  @db.Text
  nivel       NivelHabilidade @default(BASICO)
  ordem       Int      @default(0)
  clubeId     String
  clube       Clube    @relation(fields: [clubeId], references: [id])
  criadoEm    DateTime @default(now())

  progressos  ProgressoHabilidade[]

  @@index([clubeId])
}

enum NivelHabilidade {
  BASICO
  INTERMEDIO
  AVANCADO
}

model ProgressoHabilidade {
  id            String   @id @default(cuid())
  atletaId      String
  atleta        Atleta   @relation(fields: [atletaId], references: [id], onDelete: Cascade)
  habilidadeId  String
  habilidade    Habilidade @relation(fields: [habilidadeId], references: [id])
  epocaId       String
  epoca         Epoca    @relation(fields: [epocaId], references: [id])
  estado        EstadoHabilidade @default(NAO_INICIADO)
  dataDesbloqueio DateTime?
  notas         String?

  @@unique([atletaId, habilidadeId, epocaId])
  @@index([atletaId, epocaId])
}

enum EstadoHabilidade {
  NAO_INICIADO
  EM_PROGRESSO
  DESBLOQUEADO
}
```

### 5.3 Notas e decisões sobre o modelo

- **Época como filtro transversal.** `Atleta`, `Sessao` e `Jogo` têm `epocaId`. Todas as queries filtram pela época ativa (secção 4.2). Isto resolve a mistura de estatísticas entre épocas.
- **Atleta ligado a época + escalão.** Quando um atleta transita de escalão ou muda de época, cria-se um **novo registo** de `Atleta` para essa época/escalão. O histórico da época anterior fica intacto. (Trade-off aceite: o mesmo miúdo tem vários registos ao longo dos anos. No MVP não há "pessoa" unificada acima do atleta — fica para fase 2 se necessário.)
- **Utilização + minutos.** `utilizacao` (TITULAR/UTILIZADO/NAO_UTILIZADO) é obrigatória e rápida de marcar. `minutos` é opcional para quem quiser precisão. Resolve a realidade das rotações.
- **Estatísticas de GR.** `defesas`, `golosSofridosGR`, `faltasCometidas` são nullable — só se preenchem para guarda-redes. A UI mostra estes campos apenas quando o atleta tem posição GR.
- **Exercícios não têm época.** A biblioteca é um ativo reutilizável entre épocas — faz sentido que persista.
- **Índices.** Adicionados nas foreign keys e nas combinações usadas em queries frequentes (ex: `[epocaId, escalaoId, ativo]` para listar plantel; `[epocaId, escalaoId, data]` para listar sessões/jogos por ordem cronológica).
- **Cascades.** Apagar Sessão apaga os seus SessaoExercicio e Presenças. Apagar Jogo apaga Convocatórias e Estatísticas. Apagar Atleta apaga os seus Progressos (mas o atleta é soft-deleted, não apagado — ver regras).

### 5.4 Diferenças face à versão 1.0 (para referência)

Alterações estruturais introduzidas nesta revisão:
- Adicionada entidade `Epoca` e `epocaId` em Atleta/Sessao/Jogo.
- `EstatisticaAtleta`: substituído `titular Boolean` por `utilizacao` enum; `minutos` passou a opcional; adicionados campos de GR.
- Adicionadas entidades `Habilidade` e `ProgressoHabilidade` (caderneta no MVP).
- Adicionados índices em todo o modelo.

---

## 6. Autenticação e Utilizadores

### 6.1 Modelo de acesso

- Login com **email + password**. Sem registo público.
- **Perfil individual, permissões iguais.** Cada utilizador tem conta própria (nome, email, password), mas todos têm acesso total às mesmas funcionalidades. Sem papéis/hierarquia no MVP.
- **Sessão persistente** (JWT em cookie) para evitar login constante à beira do campo.
- **Criação de contas:** feita na página `definicoes/utilizadores` por qualquer utilizador autenticado (permissões iguais), ou no seed inicial.

### 6.2 Gestão de password (especificado — não deixar implícito)

- Ao criar um utilizador em `definicoes/utilizadores`, define-se uma password inicial. É guardada como hash bcrypt (custo 10).
- Existe uma ação "Alterar a minha password" no perfil do utilizador autenticado: pede password atual + nova password.
- **Não há** recuperação de password por email no MVP (sem infraestrutura de email). Se um utilizador esquecer a password, outro utilizador redefine-a na página de utilizadores. Isto DEVE estar visível na UI como nota.
- Requisitos mínimos de password: **mínimo 8 caracteres**. Validado por Zod.

### 6.3 Config Auth.js v5

```typescript
// lib/auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const utilizador = await prisma.utilizador.findUnique({
          where: { email: parsed.data.email },
        });
        if (!utilizador) return null;

        const valido = await bcrypt.compare(parsed.data.password, utilizador.passwordHash);
        if (!valido) return null;

        return { id: utilizador.id, name: utilizador.nome, email: utilizador.email };
      },
    }),
  ],
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.id = token.id as string;
      return session;
    },
  },
});
```

### 6.4 Proteção de rotas (middleware)

```typescript
// middleware.ts
export { auth as middleware } from "@/lib/auth";

export const config = {
  // Protege tudo exceto login, api de auth, e assets estáticos
  matcher: ["/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)"],
};
```

O layout `(app)/layout.tsx` faz também a verificação server-side e redireciona para `/login` se não houver sessão.

---

## 7. Estrutura de Ecrãs

### 7.1 Mapa de navegação

```
Login
└── (autenticado — com SeletorEpoca sempre visível no topo)
      ├── Dashboard
      ├── Plantel
      │     ├── Lista (filtro por escalão)
      │     ├── Novo atleta
      │     └── Perfil do atleta
      │           ├── Dados + estatísticas da época
      │           ├── Caderneta de habilidades do atleta
      │           └── Editar
      ├── Treinos
      │     ├── Lista/calendário (filtro por escalão)
      │     ├── Nova sessão
      │     └── Detalhe: exercícios + presenças
      ├── Exercícios
      │     ├── Biblioteca (filtro por categoria)
      │     ├── Novo (editor de campo)
      │     └── Detalhe / Editar
      ├── Jogos
      │     ├── Lista (filtro por escalão)
      │     ├── Novo jogo
      │     └── Detalhe: convocatória + estatísticas + relatório
      └── Definições
            ├── Escalões
            ├── Épocas
            ├── Métricas configuráveis
            ├── Habilidades (catálogo)
            └── Utilizadores
```

### 7.2 Descrição dos ecrãs

Cada ecrã abaixo especifica: **conteúdo**, **ações disponíveis**, e **estado vazio** (o que mostrar quando não há dados).

#### Dashboard
- **Conteúdo:** próxima sessão agendada, próximo jogo, atalhos rápidos (nova sessão, novo jogo, marcar presenças da sessão de hoje se existir), resumo do escalão (nº atletas, próximos eventos).
- **Ações:** navegar para atalhos.
- **Estado vazio:** se não há sessões/jogos, mostrar mensagem "Ainda não há treinos ou jogos agendados nesta época" + botões para criar.

#### Plantel — Lista
- **Conteúdo:** filtro por escalão (tabs), cartões/tabela de atletas (foto, nome, número, posição). Contador de atletas.
- **Ações:** novo atleta, tocar para abrir perfil, pesquisar por nome.
- **Estado vazio:** "Ainda não há atletas neste escalão. Adiciona o primeiro."

#### Plantel — Perfil do atleta
- **Conteúdo:** dados pessoais; estatísticas **da época ativa** (golos, assistências, jogos jogados, taxa de presença; se GR: defesas, golos sofridos); caderneta de habilidades do atleta (lista com estado); histórico de jogos da época.
- **Ações:** editar, gerir caderneta, marcar habilidade como desbloqueada.
- **Estado vazio (estatísticas):** "Sem jogos registados nesta época."

#### Plantel — Novo/Editar atleta
- **Conteúdo:** formulário — nome (obrigatório), data nascimento, posição, número, foto (opcional), observações. Escalão (obrigatório). A época é a ativa (implícita, mostrada mas não editável).
- **Validação:** ver secção 10.

#### Treinos — Lista/Calendário
- **Conteúdo:** vista lista cronológica (default) com toggle para calendário mensal; filtro por escalão; cada sessão mostra data, objetivo, nº exercícios, taxa de presença.
- **Ações:** nova sessão, abrir detalhe.
- **Estado vazio:** "Sem sessões nesta época. Cria a primeira sessão de treino."

#### Treinos — Detalhe da sessão
- **Conteúdo:**
  - Cabeçalho: data, escalão, objetivo, duração, local.
  - **Exercícios** (lista ordenada, reordenável por drag): nome, duração, miniatura do diagrama. Total de tempo somado.
  - **Presenças:** lista de atletas do escalão, cada um com seletor de estado. Default PRESENTE.
- **Ações:** adicionar exercício (da biblioteca ou criar novo), remover/reordenar exercício, marcar presenças, editar cabeçalho, apagar sessão.
- **Estado vazio (exercícios):** "Sem exercícios. Adiciona exercícios da biblioteca."

#### Exercícios — Biblioteca
- **Conteúdo:** filtro por categoria, grelha de cartões (nome, categoria, duração, miniatura), pesquisa.
- **Ações:** novo exercício, abrir detalhe/editar.
- **Estado vazio:** "A biblioteca está vazia. Cria o primeiro exercício."

#### Exercícios — Novo/Editor
- **Conteúdo:** formulário (nome obrigatório, descrição, objetivo, duração, categoria) + **editor de campo de futsal** (secção 13).
- **Ações:** desenhar no campo, guardar, cancelar.

#### Jogos — Lista
- **Conteúdo:** filtro por escalão, lista cronológica (data, adversário, casa/fora, resultado, competição).
- **Ações:** novo jogo, abrir detalhe.
- **Estado vazio:** "Sem jogos nesta época."

#### Jogos — Detalhe
- **Conteúdo:**
  - Cabeçalho: data, adversário, casa/fora, competição, resultado (golos marcados/sofridos).
  - **Convocatória:** lista de atletas do escalão com toggle convocado.
  - **Estatísticas:** por atleta convocado — utilização (titular/utilizado/não utilizado), minutos (opcional), golos, assistências; se GR: defesas, golos sofridos, faltas; + métricas configuráveis ativas.
  - **Relatório:** campo de texto para reflexão pós-jogo.
- **Ações:** definir convocatória, preencher resultado, preencher estatísticas, escrever relatório, editar, apagar.
- **Estado vazio (estatísticas):** aparece só depois de definida a convocatória.

#### Definições
- **Escalões:** criar/editar/reordenar/apagar (apagar bloqueado se tiver atletas — ver regras).
- **Épocas:** criar (nome, datas), marcar como ativa, listar.
- **Métricas:** criar (nome, tipo), ativar/desativar, reordenar.
- **Habilidades:** catálogo — criar/editar/reordenar habilidades por nível.
- **Utilizadores:** criar, editar nome/email, redefinir password, listar.

### 7.3 Navegação responsiva

- **Tablet/PC:** sidebar lateral fixa (ícone + texto). SeletorEpoca no topo.
- **Telemóvel:** bottom navigation bar (ícones). SeletorEpoca acessível no topo ou menu.
- Ações principais sempre a um toque.

---

## 8. Fluxos Principais

### 8.1 Planear uma sessão de treino
1. Treinos → Nova sessão.
2. Preenche data, escalão, objetivo, duração, local. Época = ativa (implícita).
3. Guarda → sessão criada sem exercícios.
4. No detalhe, "Adicionar exercício" → escolhe da biblioteca ou cria novo.
5. Define ordem e duração de cada exercício.
6. Sessão pronta.

### 8.2 Marcar presenças (tablet, à beira do campo — otimizado)
1. Abre a sessão do dia (Dashboard ou Treinos).
2. Secção de presenças: todos os atletas do escalão aparecem com estado default **PRESENTE**.
3. Toca só nos ausentes para mudar o estado.
4. Guarda (auto-save com debounce ou botão explícito — ver 11.4).

### 8.3 Criar exercício com diagrama
1. Exercícios → Novo.
2. Preenche metadados.
3. Editor de campo: arrasta jogadores, bolas, cones; desenha setas.
4. Guarda diagrama (JSON) + metadados.

### 8.4 Registar um jogo com estatísticas
1. Jogos → Novo jogo. Preenche data, adversário, casa/fora, competição. Época/escalão definidos.
2. Define convocatória (toggle por atleta).
3. Pós-jogo: preenche resultado (golos marcados/sofridos).
4. Por atleta convocado: utilização, minutos (opcional), golos, assistências; GR mostra campos próprios.
5. Preenche métricas configuráveis ativas.
6. Escreve relatório.
7. Guarda → reflete-se nas estatísticas do atleta.

### 8.5 Gerir a caderneta de um atleta
1. Plantel → atleta → secção Caderneta.
2. Lista de habilidades do catálogo do clube, agrupadas por nível.
3. Cada habilidade tem estado: Não iniciado / Em progresso / Desbloqueado.
4. Marca uma habilidade como desbloqueada → regista data automaticamente.

### 8.6 Mudar de época
1. SeletorEpoca no topo → escolhe outra época.
2. Toda a app passa a mostrar dados dessa época (atletas, sessões, jogos, estatísticas, caderneta).
3. A escolha persiste em cookie.

### 8.7 Transição de atletas para nova época (início de época)
1. Cria-se a nova época em Definições → Épocas.
2. NÃO FAZ PARTE DO MVP a cópia automática de atletas entre épocas. No MVP, os atletas da nova época são criados manualmente (ou re-selecionados). *(Fase 2: assistente de transição de plantel.)*

---

## 9. Server Actions

Todas as actions:
- Começam com `"use server"`.
- Validam input com Zod (secção 10) antes de qualquer operação de BD.
- Obtêm a época ativa via `obterEpocaAtiva()` quando aplicável.
- Verificam autenticação via `auth()`; se não autenticado, lançam erro.
- Retornam um tipo de resultado consistente (secção 10.3).
- Chamam `revalidatePath()` nas rotas afetadas após mutações.

### 9.1 Atletas (`lib/actions/atletas.ts`)
```typescript
criarAtleta(dados: AtletaInput): Promise<Resultado<Atleta>>
atualizarAtleta(id: string, dados: Partial<AtletaInput>): Promise<Resultado<Atleta>>
apagarAtleta(id: string): Promise<Resultado<void>>            // soft delete (ativo=false)
obterAtleta(id: string): Promise<Resultado<AtletaComEstatisticas>>
listarAtletas(escalaoId?: string): Promise<Resultado<Atleta[]>>  // filtra pela época ativa
obterEstatisticasAtleta(id: string): Promise<Resultado<EstatisticasAgregadas>>  // ver secção 15
```

### 9.2 Treinos (`lib/actions/treinos.ts`)
```typescript
criarSessao(dados: SessaoInput): Promise<Resultado<Sessao>>
atualizarSessao(id: string, dados: Partial<SessaoInput>): Promise<Resultado<Sessao>>
apagarSessao(id: string): Promise<Resultado<void>>
listarSessoes(escalaoId?: string): Promise<Resultado<Sessao[]>>
obterSessao(id: string): Promise<Resultado<SessaoCompleta>>
adicionarExercicioSessao(sessaoId, exercicioId, ordem, duracaoMin?): Promise<Resultado<SessaoExercicio>>
removerExercicioSessao(sessaoExercicioId: string): Promise<Resultado<void>>
reordenarExercicios(sessaoId: string, ordens: {id: string; ordem: number}[]): Promise<Resultado<void>>
marcarPresencas(sessaoId, presencas: PresencaInput[]): Promise<Resultado<void>>  // upsert
```

### 9.3 Exercícios (`lib/actions/exercicios.ts`)
```typescript
criarExercicio(dados: ExercicioInput): Promise<Resultado<Exercicio>>
atualizarExercicio(id: string, dados: Partial<ExercicioInput>): Promise<Resultado<Exercicio>>
apagarExercicio(id: string): Promise<Resultado<void>>   // bloqueado se em uso — ver regras
listarExercicios(categoria?: CategoriaExercicio): Promise<Resultado<Exercicio[]>>
obterExercicio(id: string): Promise<Resultado<Exercicio>>
```

### 9.4 Jogos (`lib/actions/jogos.ts`)
```typescript
criarJogo(dados: JogoInput): Promise<Resultado<Jogo>>
atualizarJogo(id: string, dados: Partial<JogoInput>): Promise<Resultado<Jogo>>
apagarJogo(id: string): Promise<Resultado<void>>
listarJogos(escalaoId?: string): Promise<Resultado<Jogo[]>>
obterJogo(id: string): Promise<Resultado<JogoCompleto>>
definirConvocatoria(jogoId: string, atletaIds: string[]): Promise<Resultado<void>>
guardarEstatisticas(jogoId: string, estatisticas: EstatisticaInput[]): Promise<Resultado<void>>  // upsert
guardarRelatorio(jogoId: string, relatorio: string): Promise<Resultado<void>>
```

### 9.5 Caderneta (`lib/actions/caderneta.ts`)
```typescript
listarHabilidades(): Promise<Resultado<Habilidade[]>>              // catálogo do clube
criarHabilidade(dados: HabilidadeInput): Promise<Resultado<Habilidade>>
atualizarHabilidade(id, dados): Promise<Resultado<Habilidade>>
obterProgressoAtleta(atletaId: string): Promise<Resultado<ProgressoHabilidade[]>>  // época ativa
atualizarProgresso(atletaId, habilidadeId, estado, notas?): Promise<Resultado<void>>  // upsert; regista data se DESBLOQUEADO
```

### 9.6 Escalões / Épocas / Métricas / Utilizadores
```typescript
// escaloes.ts
criarEscalao(dados): Promise<Resultado<Escalao>>
atualizarEscalao(id, dados): Promise<Resultado<Escalao>>
apagarEscalao(id): Promise<Resultado<void>>       // bloqueado se tiver atletas
listarEscaloes(): Promise<Resultado<Escalao[]>>

// epocas.ts
criarEpoca(dados): Promise<Resultado<Epoca>>
listarEpocas(): Promise<Resultado<Epoca[]>>
definirEpocaAtiva(id): Promise<Resultado<void>>   // marca ativa=true, desmarca as outras

// metricas.ts
criarMetrica(dados): Promise<Resultado<MetricaConfig>>
listarMetricas(apenasAtivas?: boolean): Promise<Resultado<MetricaConfig[]>>
alternarMetrica(id, ativa): Promise<Resultado<void>>

// utilizadores.ts
criarUtilizador(nome, email, passwordInicial): Promise<Resultado<Utilizador>>
atualizarUtilizador(id, {nome, email}): Promise<Resultado<Utilizador>>
redefinirPassword(id, novaPassword): Promise<Resultado<void>>
alterarMinhaPassword(passwordAtual, novaPassword): Promise<Resultado<void>>
listarUtilizadores(): Promise<Resultado<Utilizador[]>>
```

---

## 10. Validação e Tratamento de Erros

### 10.1 Tipo de resultado consistente

Todas as Server Actions retornam este tipo (definido em `lib/utils.ts`):

```typescript
type Resultado<T> =
  | { sucesso: true; dados: T }
  | { sucesso: false; erro: string; camposInvalidos?: Record<string, string> };
```

- `sucesso: true` → operação concluída, `dados` contém o resultado.
- `sucesso: false` → `erro` é uma mensagem em português para mostrar ao utilizador; `camposInvalidos` mapeia campo→mensagem para erros de validação em formulários.

### 10.2 Schemas Zod (exemplos representativos)

Em `lib/schemas/`. Cada entidade tem o seu. Exemplos que fixam as regras:

```typescript
// lib/schemas/atleta.ts
import { z } from "zod";

export const atletaSchema = z.object({
  nome: z.string().min(2, "O nome deve ter pelo menos 2 caracteres").max(100),
  escalaoId: z.string().cuid("Escalão inválido"),
  dataNascimento: z.coerce.date().optional(),
  posicao: z.enum(["GUARDA_REDES","FIXO","ALA","PIVO","UNIVERSAL"]).optional(),
  numero: z.number().int().min(1).max(99).optional(),
  observacoes: z.string().max(1000).optional(),
});
export type AtletaInput = z.infer<typeof atletaSchema>;
```

```typescript
// lib/schemas/jogo.ts
export const jogoSchema = z.object({
  data: z.coerce.date(),
  adversario: z.string().min(1, "Indica o adversário").max(100),
  casaFora: z.enum(["CASA","FORA"]),
  escalaoId: z.string().cuid(),
  competicao: z.string().max(100).optional(),
});

export const estatisticaSchema = z.object({
  atletaId: z.string().cuid(),
  utilizacao: z.enum(["TITULAR","UTILIZADO","NAO_UTILIZADO"]),
  minutos: z.number().int().min(0).max(60).nullable().optional(),
  golos: z.number().int().min(0).default(0),
  assistencias: z.number().int().min(0).default(0),
  defesas: z.number().int().min(0).nullable().optional(),
  golosSofridosGR: z.number().int().min(0).nullable().optional(),
  faltasCometidas: z.number().int().min(0).nullable().optional(),
  valoresMetricas: z.array(z.object({
    metricaId: z.string().cuid(),
    valor: z.number().int(),
  })).optional(),
});
```

```typescript
// password
export const passwordSchema = z.string().min(8, "A password deve ter pelo menos 8 caracteres");
```

### 10.3 Padrão de tratamento numa Server Action

```typescript
"use server";
import { auth } from "@/lib/auth";
import { atletaSchema } from "@/lib/schemas/atleta";
import { prisma } from "@/lib/db";
import { obterEpocaAtiva } from "@/lib/epoca-context";
import { revalidatePath } from "next/cache";

export async function criarAtleta(dados: unknown): Promise<Resultado<Atleta>> {
  // 1. Auth
  const session = await auth();
  if (!session?.user) return { sucesso: false, erro: "Não autenticado" };

  // 2. Validação
  const parsed = atletaSchema.safeParse(dados);
  if (!parsed.success) {
    const camposInvalidos = Object.fromEntries(
      parsed.error.issues.map(i => [i.path.join("."), i.message])
    );
    return { sucesso: false, erro: "Dados inválidos", camposInvalidos };
  }

  // 3. Contexto de época
  const epoca = await obterEpocaAtiva();
  if (!epoca) return { sucesso: false, erro: "Não há época ativa definida" };

  // 4. Operação
  try {
    const atleta = await prisma.atleta.create({
      data: { ...parsed.data, epocaId: epoca.id },
    });
    revalidatePath("/plantel");
    return { sucesso: true, dados: atleta };
  } catch (e) {
    console.error("criarAtleta:", e);
    return { sucesso: false, erro: "Não foi possível criar o atleta" };
  }
}
```

### 10.4 Erros de base de dados a tratar explicitamente
- **Violação de unique** (ex: email de utilizador já existe) → mensagem específica ("Já existe um utilizador com este email").
- **Foreign key inexistente** (ex: escalão apagado) → "O escalão selecionado já não existe".
- **Registo não encontrado** em obter/atualizar → resultado `sucesso: false` com "Registo não encontrado".

---

## 11. Estados de UI (loading, vazio, erro)

Componentes reutilizáveis em `components/layout/EstadosUI.tsx`.

### 11.1 Loading
- Cada rota tem `loading.tsx` (Next.js) com skeleton apropriado.
- Ações (guardar, apagar) mostram estado de "a processar" no botão (desativado + spinner) enquanto a Server Action corre.

### 11.2 Estados vazios
- Cada listagem DEVE ter um estado vazio explícito (textos especificados na secção 7.2), com ilustração/ícone e ação primária (ex: "Criar o primeiro atleta").

### 11.3 Erros
- Erros de formulário: mostrados inline por campo (a partir de `camposInvalidos`).
- Erros de operação: toast/notificação com a mensagem de `erro`.
- Erro de página (não encontrado): `not-found.tsx`. Erro inesperado: `error.tsx` com opção de tentar novamente.

### 11.4 Resiliência à beira do campo (presenças e estatísticas)
- **Marcar presenças** e **preencher estatísticas** DEVEM funcionar bem com rede fraca:
  - Guardar em lote (um só pedido), não pedido por atleta.
  - Otimistic UI: a alteração aparece imediatamente; se falhar, reverte e avisa.
  - Botão "Guardar" explícito nestas duas telas (em vez de auto-save) para dar controlo e evitar perdas — com indicação clara de "guardado" / "por guardar".
- NÃO FAZ PARTE DO MVP suporte offline completo (service worker / sync). Apenas o comportamento otimista acima.

---

## 12. Regras de Negócio

### 12.1 Época
- Existe sempre **uma** época ativa (`ativa: true`). Definir outra como ativa desmarca a anterior (transação).
- Não é possível apagar uma época que tenha atletas/sessões/jogos associados. (No MVP, apagar época NÃO FAZ PARTE — só criar e alternar.)
- As datas de época servem de orientação; não bloqueiam a criação de sessões/jogos fora do intervalo (mas a UI DEVERIA avisar se a data cair fora).

### 12.2 Atletas
- Um atleta pertence a **um** escalão e **uma** época.
- Transição de época/escalão = novo registo (histórico preservado). Sem cópia automática no MVP.
- Apagar atleta é **soft delete** (`ativo=false`); preserva estatísticas. Atletas inativos não aparecem nas listas por default (filtro opcional para os ver).
- `numero` não é único (pode repetir entre escalões/épocas). A UI DEVERIA avisar se dois atletas ativos do mesmo escalão têm o mesmo número, mas não bloqueia.

### 12.3 Sessões e presenças
- Sessão pertence a um escalão+época. Presenças só de atletas desse escalão+época.
- Ao abrir presenças de uma sessão sem registos, todos os atletas ativos do escalão surgem com default **PRESENTE**.
- `marcarPresencas` faz **upsert** (cria ou atualiza) — chamar várias vezes é seguro.
- Exercícios numa sessão têm `ordem` única. Reordenar recalcula as ordens.

### 12.4 Exercícios
- Apagar exercício é **bloqueado** se estiver associado a alguma sessão (retorna erro explicando). Alternativa: o utilizador remove-o das sessões primeiro. *(Evita diagramas órfãos em sessões passadas.)*
- Exercícios são partilhados por todo o clube e reutilizáveis entre épocas.

### 12.5 Jogos e estatísticas
- Jogo pertence a escalão+época.
- Só atletas **convocados** podem ter estatísticas. Definir convocatória primeiro; a grelha de estatísticas gera-se a partir dela.
- `guardarEstatisticas` faz **upsert** por (jogo, atleta).
- **Campos de GR** (`defesas`, `golosSofridosGR`, `faltasCometidas`): a UI só os mostra/edita se o atleta tiver `posicao === GUARDA_REDES`. Para os restantes, ficam null.
- `minutos` é opcional; `utilizacao` é obrigatória.
- Soma de minutos NÃO é validada contra o tempo de jogo (rotações).
- Golos individuais somados NÃO têm de bater certo com `golosMarcados` da equipa (autogolos, erros de registo) — a UI DEVERIA mostrar um aviso suave se divergirem, mas não bloqueia.

### 12.6 Métricas configuráveis
- Definidas ao nível do clube, aplicam-se a todos os escalões.
- Desativar não apaga valores históricos.
- Tipos: NÚMERO (inteiro ≥0), BOOLEANO (0/1), ESCALA (1-5). A UI adapta o input ao tipo.

### 12.7 Caderneta de habilidades
- Catálogo de habilidades definido ao nível do clube (partilhado).
- O progresso é por **atleta + habilidade + época**.
- Marcar como DESBLOQUEADO regista `dataDesbloqueio = now()`. Voltar atrás limpa a data.
- Habilidades agrupam-se por nível (Básico/Intermédio/Avançado) na UI.

### 12.8 Escalões
- Livres (Traquinas, Benjamins, etc.).
- Apagar escalão é **bloqueado** se tiver atletas em qualquer época.
- Idade min/max é orientativa.

### 12.9 Utilizadores
- Email único.
- Permissões iguais — qualquer utilizador pode gerir tudo, incluindo criar/editar outros utilizadores e redefinir passwords.
- Um utilizador não se pode apagar a si próprio se for o único (evitar ficar sem acesso). No MVP, apagar utilizadores NÃO FAZ PARTE — só criar/editar/redefinir password.

---

## 13. Componente de Campo de Futsal

A peça técnica mais específica. Construir de raiz com SVG nativo (não forkar `tactics-board` — sem licença).

### 13.1 Especificação do campo (dimensões FIFA)

- Comprimento: **40 m**. Largura: **20 m**. Proporção 2:1.
- Sistema de coordenadas interno: **1 unidade = 10 cm**. Campo = **400 × 200 unidades**.
- Linhas de referência a desenhar:
  - Linha de meio-campo + círculo central (raio 3 m = 30 unidades).
  - Áreas de baliza: quarto de círculo de 6 m em cada poste (área de futsal característica).
  - Marca de grande penalidade a 6 m; segunda penalidade a 10 m.
  - Balizas: 3 m de largura (30 unidades).

### 13.2 Três componentes

1. **`CampoFutsal.tsx`** — render read-only de um diagrama (recebe `DiagramaCampo`, desenha SVG). Usado no detalhe do exercício.
2. **`EditorCampo.tsx`** — editor interativo (drag-and-drop, ferramentas). Usado em criar/editar exercício.
3. **`MiniaturaCampo.tsx`** — render reduzido, sem interação, para cartões de listagem. Recebe o mesmo `DiagramaCampo` e desenha em tamanho pequeno.

> A miniatura é o **mesmo SVG** renderizado num viewBox menor — **não** se gera imagem rasterizada nem se guarda ficheiro. Decisão fixa (elimina a ambiguidade da v1).

### 13.3 Formato de dados (`DiagramaCampo`)

Guardado no campo `diagrama Json?` de `Exercicio`. Tipo em `lib/schemas/exercicio.ts`:

```typescript
interface DiagramaCampo {
  versao: 1;                     // versão do formato (para migrações)
  elementos: ElementoCampo[];
}

type ElementoCampo = Jogador | Bola | Cone | Baliza | Seta | Linha | Texto;

interface Base { id: string; }

interface Jogador extends Base {
  tipo: "jogador";
  x: number; y: number;          // 0-400, 0-200
  numero?: number;
  cor: "azul" | "vermelho" | "amarelo" | "verde";  // equipas/grupos
  posicao?: "GR" | "fixo" | "ala" | "pivo";
}
interface Bola extends Base { tipo: "bola"; x: number; y: number; }
interface Cone extends Base { tipo: "cone"; x: number; y: number; }
interface Baliza extends Base { tipo: "baliza"; x: number; y: number; orientacao: "horizontal" | "vertical"; }
interface Seta extends Base {
  tipo: "seta";
  estilo: "movimento" | "passe" | "conducao";   // sólida | tracejada | ondulada
  cor: string;
  pontos: { x: number; y: number }[];           // ≥2 pontos; permite curvas
}
interface Linha extends Base { tipo: "linha"; cor: string; pontos: { x: number; y: number }[]; }
interface Texto extends Base { tipo: "texto"; x: number; y: number; conteudo: string; }
```

Validação Zod correspondente DEVE existir (`diagramaSchema`) para garantir que o JSON guardado é válido.

### 13.4 Ferramentas do editor
Barra com: selecionar/mover · adicionar jogador (escolhe cor + número) · bola · cone · baliza · desenhar seta (escolhe estilo) · linha livre · texto · apagar elemento · limpar tudo · anular (undo) última ação.

### 13.5 Convenções visuais (standard tático futsal)
- Equipa própria: azul. Adversário: vermelho. (Outras cores para grupos/variantes.)
- Seta **sólida** = deslocamento do jogador.
- Seta **tracejada** = passe.
- Seta **ondulada** = condução de bola.
- Cones = obstáculos/marcações.

### 13.6 Interação (tablet-first)
- Drag-and-drop com suporte a **toque** e rato (pointer events).
- Alvos de toque com área mínima confortável (≥32px equivalente).
- Zoom/pan NÃO FAZ PARTE do MVP (campo cabe no ecrã em tablet/PC; em telemóvel o campo escala para caber).

---

## 14. Caderneta de Habilidades

Incluída no MVP em versão funcional (não só estrutura).

### 14.1 O que é
Sistema que torna o desenvolvimento técnico tangível: cada atleta desbloqueia "moves" (vírgula, flip-flap, elástico, chapéu…) ao longo da época. Materializa a filosofia do projeto.

### 14.2 Âmbito no MVP
- **Catálogo de habilidades** editável em Definições → Habilidades (nome, descrição, nível, ordem).
- **Progresso por atleta** na secção Caderneta do perfil: estado (Não iniciado / Em progresso / Desbloqueado) + data de desbloqueio + notas.
- Agrupamento visual por nível (Básico / Intermédio / Avançado).
- Indicador de progresso do atleta (ex: "7 de 20 habilidades desbloqueadas").

### 14.3 Fora do âmbito (fase 2)
- Ligação da habilidade da semana às redes sociais.
- Impressão de caderneta física.
- Ligação a exercícios específicos.

---

## 15. Estatísticas e Agregações

Especificação exata do cálculo das estatísticas do atleta (evita interpretações divergentes).

### 15.1 Estatísticas agregadas do atleta (época ativa)

`obterEstatisticasAtleta(id)` retorna:

```typescript
interface EstatisticasAgregadas {
  jogosConvocado: number;      // count de Convocatoria (convocado=true) na época
  jogosUtilizados: number;     // count de EstatisticaAtleta com utilizacao != NAO_UTILIZADO
  titularidades: number;       // count utilizacao == TITULAR
  totalGolos: number;          // soma golos
  totalAssistencias: number;   // soma assistencias
  totalMinutos: number | null; // soma minutos (null se nenhum registado)
  // Guarda-redes (só se posicao == GR):
  totalDefesas: number | null;
  totalGolosSofridos: number | null;
  // Presenças (treinos da época):
  sessoesTotais: number;       // sessões do escalão na época
  presencas: number;           // count Presenca estado PRESENTE ou ATRASADO
  taxaPresenca: number;        // presencas / sessoesTotais (0 se sessoesTotais=0)
}
```

### 15.2 Regras de cálculo
- Tudo filtrado pela **época ativa**.
- `taxaPresenca`: ATRASADO conta como presença; FALTA, FALTA_JUSTIFICADA, LESIONADO não contam como presença. Divisor = sessões do escalão na época em que o atleta esteve ativo.
- `totalMinutos`: se nenhum jogo tiver minutos registados, retorna `null` (não `0`) — distingue "não registado" de "zero minutos".
- Estatísticas de GR só calculadas se o atleta for GR; caso contrário `null`.

### 15.3 Onde aparecem
- Perfil do atleta (secção estatísticas).
- Dashboard NÃO agrega estatísticas no MVP (só próximos eventos). Agregações de equipa/gráficos são fase 2.

---

## 16. MVP vs Fase 2

### 16.1 MVP (esta época)
- ✅ Épocas (criar, alternar, filtro global)
- ✅ Gestão de plantel por escalão
- ✅ Planeamento de sessões de treino
- ✅ Biblioteca de exercícios com editor de campo de futsal
- ✅ Presenças (com resiliência à beira do campo)
- ✅ Convocatórias
- ✅ Gestão de jogos com estatísticas (utilização+minutos, campo, GR, configuráveis)
- ✅ Caderneta de habilidades (catálogo + progresso por atleta)
- ✅ Perfil de atleta com estatísticas agregadas da época
- ✅ Autenticação (email/password, permissões iguais, gestão de password)
- ✅ Definições (escalões, épocas, métricas, habilidades, utilizadores)

### 16.2 Fase 2 (produto completo)
A fase 2 está **totalmente especificada na Parte II** deste documento (secções 25–35), ao mesmo nível de detalhe do MVP. Resumo dos módulos:
- **Planeamento de época / periodização** (secção 26)
- **Relatórios e exportação PDF** (secção 27)
- **Dashboard analítico** (secção 28)
- **Caderneta avançada** — habilidade da semana, ligação a exercícios, caderneta imprimível (secção 29)
- **Portal de pais/atletas** (secção 30)
- **Multi-clube opcional** (secção 31)
- **Transição de plantel entre épocas** (secção 32)
- **Biblioteca partilhada e animação de exercícios** (secção 33)

Decisões de âmbito já fixadas: permissões entre treinadores são **sempre iguais** (nunca hierarquia); o multi-clube é **opcional** (arquitetura preparada, ativação por decisão); o portal de pais/atletas **faz parte** do produto final; o planeamento de época é **completo** (macro/meso/microciclos).

### 16.3 Explicitamente fora do MVP
App nativa; billing; notificações push; chat; recuperação de password por email; suporte offline completo (service worker); zoom/pan no editor de campo; importação de dados externos.

---

## 17. Setup e Deployment

### 17.1 Setup do projeto
```bash
npx create-next-app@latest mister --typescript --tailwind --app --no-src-dir --import-alias "@/*"
cd mister

npm install @prisma/client next-auth@beta bcryptjs zod date-fns
npm install -D prisma @types/bcryptjs

npx shadcn@latest init
npx prisma init
```

### 17.2 Variáveis de ambiente

`.env.example` (versionado, sem valores) e `.env.local` (real, não versionado):
```
DATABASE_URL="postgresql://user:pass@host:5432/mister"   # Supabase
AUTH_SECRET="..."      # gerar: npx auth secret
```

### 17.3 Base de dados
```bash
npx prisma migrate dev --name init
npx prisma generate
npx prisma db seed
```

### 17.4 Seed (`prisma/seed.ts`) — DEVE criar:
1. **Clube** "Juventude Sport Clube" (cor primária `#1A2FD4`, secundária `#FFD700`).
2. **Época** "2025/26" (datas plausíveis, `ativa: true`).
3. **Dois utilizadores** (Gonçalo + adjunto) com password inicial hasheada (bcrypt custo 10). Passwords iniciais definidas em variáveis do seed, documentadas para primeiro login.
4. **Escalões** "Traquinas" e "Benjamins" (com idades orientativas e ordem).
5. **Métricas configuráveis** exemplo: "Dribles completados" (NÚMERO), "1x1 ganhos" (NÚMERO), "Atitude" (ESCALA).
6. **Habilidades** exemplo por nível: Básico (Rolo, Corta), Intermédio (Vírgula, Flip-flap), Avançado (Elástico, Chapéu).

Configurar em `package.json`:
```json
"prisma": { "seed": "tsx prisma/seed.ts" }
```
(instalar `tsx` como devDependency)

### 17.5 Deployment
- **App:** Vercel (integração GitHub, deploy automático). Configurar `DATABASE_URL` e `AUTH_SECRET` no dashboard.
- **BD:** Supabase (PostgreSQL gerido, backups automáticos).
- Correr `prisma migrate deploy` no build de produção.

---

## 18. Ordem de Desenvolvimento

Sequência incremental para ter algo funcional cedo e reduzir risco. Cada passo produz algo testável.

1. **Fundações** — projeto, Tailwind, shadcn, Prisma, schema completo, migração, Auth.js, middleware, seed. Login a funcionar.
2. **Layout + Época** — navegação responsiva, SeletorEpoca, helper de época ativa, guarda de rotas.
3. **Definições base** — escalões, épocas, utilizadores, métricas, habilidades (CRUD simples). É a base de dados de tudo.
4. **Plantel** — CRUD de atletas, lista com filtro por escalão, perfil (sem estatísticas ainda).
5. **Exercícios (sem campo)** — CRUD, biblioteca, categorias. Diagrama fica placeholder.
6. **Editor de campo** — a peça isolada mais complexa: `CampoFutsal`, `EditorCampo`, `MiniaturaCampo`, formato JSON, ferramentas. Integrar nos exercícios.
7. **Treinos** — sessões, associação de exercícios (ordenar/duração).
8. **Presenças** — dentro da sessão, com padrão otimista e guardar em lote.
9. **Jogos** — CRUD + convocatória.
10. **Estatísticas** — grelha por atleta convocado (utilização, minutos, campo, GR, configuráveis), relatório.
11. **Agregações** — cálculo e apresentação das estatísticas no perfil do atleta (secção 15).
12. **Caderneta** — progresso por atleta, agrupado por nível, no perfil.
13. **Dashboard** — juntar próximos eventos e atalhos.
14. **Estados e polish** — loading/vazio/erro em todas as telas, revisão responsiva tablet/telemóvel/PC, resiliência à beira do campo.

Cada passo DEVE ficar funcional e testado antes de avançar.

---

---

## 19. Sistema de Design

Esta secção define a aparência da aplicação de forma prescritiva. Uma equipa DEVE seguir estes tokens e padrões — não há margem para reinterpretar "cartão" ou "cor primária".

### 19.1 Direção visual

- **Base azul**, limpa e profissional. O azul é a cor estrutural (navegação, ações primárias, destaques).
- Estética funcional e legível — o produto usa-se num tablet à beira do campo, com luz variável. Prioridade a contraste e alvos de toque generosos sobre densidade de informação.
- Sem dark mode no MVP (fica fase 2).

### 19.2 Tokens de cor

Definir em `tailwind.config.ts` e/ou variáveis CSS em `globals.css`.

```
--azul-900:  #0F1E8A   /* texto sobre claro, cabeçalhos fortes */
--azul-700:  #1A2FD4   /* PRIMÁRIA — ações, navegação ativa, links */
--azul-500:  #3A50E0   /* hover de primária */
--azul-100:  #E4E8FF   /* fundos de destaque suave, seleção */
--azul-50:   #F4F6FF   /* fundo de página alternativo */

--cinza-900: #1A1D29   /* texto principal */
--cinza-600: #4A4F63   /* texto secundário */
--cinza-400: #8A90A6   /* texto terciário, placeholders */
--cinza-200: #E2E5EF   /* bordas, separadores */
--cinza-50:  #F8F9FC   /* fundo de página base */
--branco:    #FFFFFF   /* superfícies (cartões, painéis) */

--verde-600: #1E9E5A   /* sucesso, presença, desbloqueado */
--ambar-500: #E0900A   /* aviso */
--vermelho-600: #D33A3A /* erro, falta, apagar */

--amarelo-jsc: #FFD700 /* uso pontual — só onde o clube é representado (ex: logo, cabeçalho de época). NÃO usar como cor de ação. */
```

**Regra:** o amarelo do clube é decorativo/identitário, nunca funcional (nunca um botão amarelo). As ações são sempre azul.

### 19.3 Tipografia

- **Fonte:** Inter (ou system-ui como fallback). Uma única família.
- Escala:
```
Título de página (h1):   24px / 700 / cinza-900
Título de secção (h2):    18px / 600 / cinza-900
Subtítulo (h3):           15px / 600 / cinza-900
Corpo:                    14px / 400 / cinza-900
Corpo secundário:         13px / 400 / cinza-600
Legenda/meta:             12px / 400 / cinza-400
```
- Line-height base 1.5. Números de estatísticas podem usar variante tabular.

### 19.4 Espaçamento e layout

- Escala de espaçamento base 4px (Tailwind default: 1=4px, 2=8px, 4=16px, 6=24px…).
- **Raio de canto:** 8px (cartões, inputs, botões). 12px para modais/painéis grandes.
- **Sombra de cartão:** subtil — `0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)`.
- **Largura máxima de conteúdo:** 1200px centrado em PC. Full-width em tablet/telemóvel.
- **Grelha de listagens (cartões):** auto-fill, mínimo 260px por cartão, gap 16px.

### 19.5 Alvos de toque (tablet-first)

- Altura mínima de elementos interativos: **44px** (botões, linhas de lista tocáveis, toggles).
- Espaçamento mínimo entre alvos de toque: 8px.
- Inputs com altura 44px.

### 19.6 Componentes-chave (mapear a shadcn/ui)

| Componente | Base shadcn | Uso |
|---|---|---|
| Botão primário | Button (variant default, azul-700) | Ações principais |
| Botão secundário | Button (variant outline) | Ações secundárias |
| Botão destrutivo | Button (variant destructive, vermelho) | Apagar |
| Cartão | Card | Atletas, exercícios, sessões, jogos |
| Campo de texto | Input | Formulários |
| Seletor | Select | Escalão, posição, categoria |
| Abas | Tabs | Filtro por escalão |
| Diálogo | Dialog | Confirmações, formulários rápidos |
| Notificação | Sonner (toast) | Sucesso/erro de operações |
| Avatar | Avatar | Iniciais do atleta (ver 19.7) |
| Badge | Badge | Estado (presença, habilidade, utilização) |
| Interruptor | Switch | Convocado sim/não |

### 19.7 Avatar de atleta (substitui fotos no MVP)

Não há upload de fotos no MVP. Cada atleta é representado por um **avatar de iniciais**:
- Círculo com as iniciais do nome (primeiro + último nome, ex: "Gonçalo Pereira" → "GP").
- Cor de fundo derivada de forma determinística do nome (hash do nome → uma de ~8 cores da paleta azul/cinza), para que o mesmo atleta tenha sempre a mesma cor.
- Texto branco, centrado.
- O campo `fotoUrl` no modelo é **removido do MVP** (ver alteração no 19.8). Fica para fase 2 quando houver upload.

### 19.8 Alteração ao modelo de dados

Remover `fotoUrl` de `Atleta` no MVP (o avatar é gerado das iniciais, não persiste imagem). Manter `fotoUrl` fora do schema até à fase 2. Igualmente, `logoUrl` em `Clube` fica opcional e não usado no MVP (o nome/iniciais do clube bastam).

### 19.9 Cor de estado (badges)

| Estado | Cor |
|---|---|
| Presente / Desbloqueado / Titular | verde-600 |
| Atrasado / Em progresso / Utilizado | ambar-500 |
| Falta / Lesionado / Não utilizado | vermelho-600 (falta) · cinza-400 (não utilizado) |
| Não iniciado | cinza-400 |

---

## 20. Wireframes dos Ecrãs Principais

Layout prescritivo dos ecrãs. Cada wireframe mostra a estrutura em tablet (referência). A descrição por zonas acompanha cada um. Telemóvel colapsa para uma coluna; PC centra a 1200px.

### 20.1 Estrutura global (shell)

```
┌────────────────────────────────────────────────────────────┐
│ [≡] Mister        [Época: 2025/26 ▾]      [GP ▾]      │  ← barra topo (56px)
├──────────┬─────────────────────────────────────────────────┤
│          │                                                   │
│ ▣ Início │              ÁREA DE CONTEÚDO                     │
│ ◇ Plantel│                                                   │
│ ◇ Treinos│                                                   │
│ ◇ Exerc. │                                                   │
│ ◇ Jogos  │                                                   │
│ ⚙ Defin. │                                                   │
│          │                                                   │
│ (sidebar │                                                   │
│  220px)  │                                                   │
└──────────┴─────────────────────────────────────────────────┘
```
- **Barra de topo:** logo/nome à esquerda; seletor de época ao centro-direita (sempre visível); menu do utilizador à direita (nome/iniciais → alterar password, sair).
- **Sidebar (tablet/PC):** navegação principal, item ativo a azul-700. Em telemóvel, vira bottom-nav de 5 ícones (Início, Plantel, Treinos, Jogos, Mais).

### 20.2 Dashboard

```
┌─ ÁREA DE CONTEÚDO ─────────────────────────────────────────┐
│ Início                                                      │
│                                                             │
│ ┌───────────────────────┐ ┌───────────────────────┐        │
│ │ PRÓXIMO TREINO        │ │ PRÓXIMO JOGO          │        │
│ │ Qua, 24 jul · 18:30   │ │ Sáb, 27 jul           │        │
│ │ Benjamins · Pavilhão  │ │ vs Adversário (Casa)  │        │
│ │ [Ver] [Marcar presen.]│ │ [Ver] [Convocatória]  │        │
│ └───────────────────────┘ └───────────────────────┘        │
│                                                             │
│ AÇÕES RÁPIDAS                                               │
│ [+ Nova sessão] [+ Novo jogo] [+ Novo atleta]               │
│                                                             │
│ RESUMO — Benjamins ▾                                        │
│ 12 atletas · 8 sessões · 3 jogos nesta época                │
└─────────────────────────────────────────────────────────────┘
```
Zonas: (1) dois cartões de próximos eventos lado a lado (empilham em telemóvel); (2) faixa de ações rápidas; (3) resumo do escalão selecionado.

### 20.3 Plantel — Lista

```
┌────────────────────────────────────────────────────────────┐
│ Plantel                                    [+ Novo atleta]  │
│ [ Traquinas | ●Benjamins ]        [🔍 Pesquisar...]         │
│                                                             │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│ │  (GP)    │ │  (JS)    │ │  (MR)    │ │  (AL)    │        │
│ │ G.Pereira│ │ J.Silva  │ │ M.Rocha  │ │ A.Lopes  │        │
│ │ #7 · Ala │ │ #1 · GR  │ │ #9 · Pivô│ │ #4 · Fixo│        │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
│ ...                                                         │
│ 12 atletas                                                  │
└─────────────────────────────────────────────────────────────┘
```
Zonas: (1) cabeçalho com ação primária; (2) abas de escalão + pesquisa; (3) grelha de cartões (avatar iniciais, nome, número, posição); (4) contador. Tocar num cartão → perfil.

### 20.4 Plantel — Perfil do atleta

```
┌────────────────────────────────────────────────────────────┐
│ ‹ Plantel                                        [Editar]   │
│                                                             │
│ ┌────┐  Gonçalo Pereira                                     │
│ │ GP │  #7 · Ala · Benjamins · 9 anos                       │
│ └────┘                                                      │
│                                                             │
│ [ Estatísticas | Caderneta | Histórico ]  ← abas           │
│ ─────────────────────────────────────────────              │
│ ESTATÍSTICAS (2025/26)                                      │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                    │
│ │  3  │ │  5  │ │  8  │ │  6  │ │ 75% │                    │
│ │golos│ │assis│ │jogos│ │titul│ │pres.│                    │
│ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘                    │
│                                                             │
│ (aba Caderneta: lista de habilidades por nível c/ estado)   │
│ (aba Histórico: lista de jogos com stats por jogo)          │
└─────────────────────────────────────────────────────────────┘
```
Zonas: (1) voltar + editar; (2) cabeçalho de identidade (avatar, nome, meta); (3) abas Estatísticas/Caderneta/Histórico; (4) conteúdo da aba. Se GR, os cartões de estatística trocam golos/assistências por defesas/golos sofridos.

### 20.5 Treinos — Detalhe da sessão

```
┌────────────────────────────────────────────────────────────┐
│ ‹ Treinos                                [Editar] [Apagar]  │
│ Qua, 24 jul · 18:30–19:50 · Benjamins · Pavilhão            │
│ Objetivo: 1x1 ofensivo e finalização                        │
│                                                             │
│ ┌─ EXERCÍCIOS ────────────────┐ ┌─ PRESENÇAS ─────────────┐ │
│ │ ⠿ 1. Ativação — semáforo    │ │ G.Pereira    [Presente▾]│ │
│ │    [mini] 10 min            │ │ J.Silva      [Presente▾]│ │
│ │ ⠿ 2. 1x1 com apoio          │ │ M.Rocha      [Falta   ▾]│ │
│ │    [mini] 20 min            │ │ A.Lopes      [Presente▾]│ │
│ │ ⠿ 3. Jogo reduzido 3x3      │ │ ...                     │ │
│ │    [mini] 15 min            │ │                         │ │
│ │ [+ Adicionar exercício]     │ │ [Guardar presenças] ✓   │ │
│ │ Total: 45 min               │ │ 10 presentes · 2 faltas │ │
│ └─────────────────────────────┘ └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```
Zonas: (1) navegação + ações; (2) cabeçalho da sessão; (3) coluna exercícios (reordenáveis por drag — ícone ⠿ — com miniatura e duração, total somado); (4) coluna presenças (seletor por atleta, botão guardar explícito, contadores). Em telemóvel as duas colunas empilham.

### 20.6 Exercícios — Editor de campo

```
┌────────────────────────────────────────────────────────────┐
│ ‹ Exercícios                              [Cancelar][Guardar]│
│ Nome: [___________________]  Categoria: [Situações jogo ▾]  │
│ Objetivo: [_________________________]  Duração: [20] min    │
│                                                             │
│ ┌─ FERRAMENTAS ─┐ ┌─ CAMPO (40×20m) ──────────────────────┐ │
│ │ ▸ Selecionar  │ │  ┌─────────────┬─────────────┐        │ │
│ │ ● Jogador     │ │  │      ◯      │      ◯      │        │ │
│ │ • Bola        │ │  │   ①    →    │       ②     │        │ │
│ │ ▲ Cone        │ │  │  ●          ·····▶  ⚫      │        │ │
│ │ ⊓ Baliza      │ │  │      ◯      │      ◯      │        │ │
│ │ → Seta ▾      │ │  └─────────────┴─────────────┘        │ │
│ │ ✎ Linha       │ │                                        │ │
│ │ T Texto       │ │  Cor: [●azul ●verm] Estilo seta:[—▾]   │ │
│ │ ⌫ Apagar      │ │                                        │ │
│ │ ↶ Anular      │ │                                        │ │
│ │ ✕ Limpar      │ │                                        │ │
│ └───────────────┘ └────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```
Zonas: (1) navegação + guardar/cancelar; (2) metadados do exercício; (3) barra de ferramentas vertical; (4) campo SVG interativo com controlos contextuais (cor/estilo) por baixo. Detalhe completo da interação na secção 21.

### 20.7 Jogos — Detalhe (estatísticas)

```
┌────────────────────────────────────────────────────────────┐
│ ‹ Jogos                                  [Editar] [Apagar]  │
│ Sáb, 27 jul · vs Adversário · Casa · Liga                   │
│ Resultado: [ 4 ] – [ 2 ]                                    │
│                                                             │
│ [ Convocatória | ●Estatísticas | Relatório ]  ← abas        │
│ ─────────────────────────────────────────────              │
│ Atleta      Utiliz.    Min  Golos Assist  (métricas...)     │
│ G.Pereira   [Titular▾] [18] [ 2 ] [ 1 ]   [Dribles: 4]      │
│ J.Silva(GR) [Titular▾] [40] Defesas:[7] Sofridos:[2]        │
│ M.Rocha     [Utiliz.▾] [12] [ 1 ] [ 0 ]                     │
│ A.Lopes     [N/util.▾] [ 0] — — —                           │
│ ...                                                         │
│ [Guardar estatísticas] ✓                                    │
└─────────────────────────────────────────────────────────────┘
```
Zonas: (1) nav + ações; (2) cabeçalho + resultado editável; (3) abas Convocatória/Estatísticas/Relatório; (4) tabela de estatísticas — uma linha por atleta convocado. Linha de GR mostra defesas/sofridos em vez de golos/assistências. Botão guardar explícito. Em telemóvel, cada atleta vira um cartão empilhado em vez de linha de tabela.

---

## 21. Editor de Campo — Especificação de Interação Completa

O componente mais complexo. Esta secção especifica cada interação para não deixar decisões ao critério de quem implementa.

### 21.1 Modelo de interação geral

- O editor tem sempre uma **ferramenta ativa** (default: Selecionar).
- O campo reage a **pointer events** (funciona com rato e toque de forma unificada).
- Coordenadas: o ponto tocado no ecrã é convertido para coordenadas do campo (0–400 × 0–200) tendo em conta a escala de render. Todos os elementos são guardados nessas coordenadas, independentes do tamanho do ecrã.

### 21.2 Comportamento por ferramenta

**Selecionar (default)**
- Toque num elemento → seleciona-o (contorno de seleção visível).
- Arrastar um elemento selecionado → move-o. Ao largar, atualiza x,y.
- Toque em zona vazia → limpa seleção.
- Elemento selecionado pode ser apagado (tecla Delete em PC, ou botão Apagar).

**Jogador**
- Antes de colocar: escolher cor (azul/vermelho/amarelo/verde) e, opcionalmente, número, nos controlos contextuais.
- Toque no campo → cria um jogador nessa posição com a cor/número escolhidos.
- Número auto-incrementa por cor (primeiro azul = 1, segundo azul = 2…) mas é editável.

**Bola / Cone**
- Toque no campo → coloca o elemento nessa posição. Sem configuração.

**Baliza**
- Toque no campo → coloca baliza. Orientação default vertical (baliza nas linhas de fundo); alternável nos controlos contextuais.

**Seta** (movimento / passe / condução)
- Escolher o estilo nos controlos contextuais antes de desenhar.
- **Desenho por pontos:** toque para pousar o primeiro ponto; cada toque seguinte adiciona um ponto ao caminho; **duplo-toque** (ou botão "concluir") termina a seta. Isto permite setas curvas/quebradas.
- Mínimo 2 pontos. Se o utilizador terminar com 1 ponto, a seta é descartada.
- A seta renderiza com a convenção visual do estilo (sólida/tracejada/ondulada) e uma ponta de seta no último ponto.

**Linha**
- Igual à seta mas sem ponta e sem estilo de movimento (linha simples). Para demarcar zonas.

**Texto**
- Toque no campo → abre input inline; escrever → confirma com Enter/toque fora. Cria elemento de texto nessa posição.

**Apagar**
- Ativa modo apagar: o próximo elemento tocado é removido. (Alternativa sempre disponível: selecionar + Delete.)

**Anular (undo)**
- Remove a última ação do histórico. Mantém uma pilha de ações da sessão de edição (não persiste entre edições). Mínimo 20 níveis de undo.
- NÃO é necessário redo no MVP.

**Limpar tudo**
- Pede confirmação (diálogo). Remove todos os elementos.

### 21.3 Rotação de ecrã / redimensionamento

- O campo mantém sempre a proporção 2:1 e escala para caber na largura disponível.
- Ao rodar o tablet ou redimensionar, os elementos mantêm as coordenadas do campo (0–400 × 0–200) e são re-renderizados na nova escala. **Nenhum dado se perde.**
- A edição em curso (ex: seta a meio) DEVE sobreviver ao redimensionamento; se for tecnicamente difícil, é aceitável cancelar apenas a seta em curso (não o diagrama).

### 21.4 Guardar

- Guardar o exercício serializa o `DiagramaCampo` (secção 13.3) para o campo `diagrama` (Json). Validado com `diagramaSchema` (Zod) antes de gravar.
- Se o campo estiver vazio (sem elementos), o diagrama guarda-se como `{ versao: 1, elementos: [] }` — é válido (um exercício pode não ter diagrama).

### 21.5 Render read-only e miniatura

- `CampoFutsal` (read-only): mesmo render sem handlers de edição.
- `MiniaturaCampo`: mesmo SVG, viewBox completo, largura pequena (ex: 240px), sem interação. Usado em cartões de exercício e na lista de exercícios da sessão.
- Nenhuma rasterização/ficheiro de imagem é gerado — é sempre SVG a partir do JSON.

---

## 22. Casos-Limite e Comportamentos Especiais

Situações que surgem na prática e cujo comportamento DEVE ser o especificado aqui.

### 22.1 Métricas configuráveis
- **Desativar uma métrica com valores históricos:** os valores mantêm-se na base de dados. Na UI, jogos passados continuam a mostrar o valor (com a métrica marcada como "inativa"); novos jogos já não pedem essa métrica. Nunca apagar `ValorMetrica` ao desativar.
- **Reativar uma métrica:** volta a aparecer no registo de novos jogos; os valores antigos continuam associados.

### 22.2 Mudança de posição do atleta
- **Atleta muda de jogador de campo para GR (ou vice-versa) a meio da época:** os jogos passados mantêm os dados que tinham. Um jogo antigo de quando era jogador de campo não passa a exibir campos de GR retroativamente. A UI decide que campos mostrar **com base no valor registado no próprio `EstatisticaAtleta`** (se tem `defesas`/`golosSofridosGR` preenchidos, mostra-os), e não apenas com base na posição atual do atleta.
- Regra de captura: no formulário de estatísticas, os campos de GR aparecem se a posição **atual** do atleta for GR. Uma vez guardados, persistem no registo.

### 22.3 Atleta que entra a meio da época
- **Taxa de presença:** o divisor são as sessões do escalão que ocorreram **a partir da data de criação do atleta** (não desde o início da época). Um atleta criado à 5ª sessão não é penalizado pelas 4 anteriores.
- Implementação: contar sessões do escalão na época com `data >= atleta.criadoEm` (ou uma data de ingresso explícita, se preferires — ver nota).
- *Nota de decisão:* o MVP usa `criadoEm` como proxy da data de ingresso. Se no futuro for preciso rigor, adiciona-se um campo `dataIngresso` ao atleta (fase 2).

### 22.4 Convocatória alterada depois de estatísticas registadas
- **Remover da convocatória um atleta que já tem estatísticas:** pede confirmação e, se confirmado, apaga as estatísticas desse atleta nesse jogo (a estatística não faz sentido sem convocatória). O aviso DEVE ser explícito ("Este atleta tem estatísticas registadas que serão apagadas").

### 22.5 Sessão/jogo com data fora da época
- Permitido, mas a UI mostra um aviso suave ("A data está fora do intervalo da época ativa"). Não bloqueia.

### 22.6 Escalão/época sem atletas
- Listas mostram estado vazio (secção 7.2). Criar sessão/jogo é possível, mas presenças/convocatória ficam vazias com nota "Não há atletas neste escalão nesta época".

### 22.7 Exercício em uso
- Apagar exercício associado a sessões → bloqueado com mensagem indicando em quantas sessões está a ser usado. Editar é sempre permitido (a edição reflete-se onde está referenciado, incluindo sessões passadas — comportamento aceite e documentado).

### 22.8 Dois atletas com o mesmo número
- Permitido no modelo. A UI mostra aviso não-bloqueante na lista de plantel se dois atletas **ativos do mesmo escalão** partilharem número.

### 22.9 Época sem época ativa definida
- Não deve acontecer (o seed cria uma ativa). Se acontecer (ex: dados manipulados), as Server Actions retornam erro "Não há época ativa definida" e a UI direciona para Definições → Épocas para definir uma.

### 22.10 Guardar estatísticas parciais
- É permitido guardar estatísticas incompletas (ex: só utilização, sem golos). Nada é obrigatório exceto `utilizacao`. Voltar mais tarde e completar faz upsert.

### 22.11 Concorrência (dois treinadores em simultâneo)
- Improvável mas possível. Estratégia: **last-write-wins** (o último a guardar prevalece). Sem locking otimista no MVP. Aceite dado o contexto (dois utilizadores, raramente no mesmo registo ao mesmo tempo).

---

## 23. Requisitos Não-Funcionais

### 23.1 Performance
- Objetivos (escala real: 1 clube, ~6 escalões, ~100 atletas, ~300 sessões/época, ~100 jogos/época — pequeno):
  - Carregamento inicial de uma listagem: < 1s em rede normal.
  - Ações (guardar presenças/estatísticas): resposta percetível < 500ms com UI otimista.
- As queries de listagem DEVEM usar os índices definidos no schema (secção 5.2).
- Paginação NÃO é necessária no MVP dado o volume; listar tudo da época é aceitável. (Se um escalão exceder ~200 atletas, reconsiderar — improvável.)
- O editor de campo DEVE manter 60fps ao arrastar em tablet de gama média.

### 23.2 Acessibilidade
- Contraste mínimo AA (texto normal 4.5:1). Os tokens de cor definidos cumprem-no sobre branco.
- Todos os elementos interativos acessíveis por teclado (foco visível) em PC.
- Inputs com `label` associado. Ícones-só-de-ação com `aria-label`.
- Alvos de toque ≥44px (já em 19.5).
- Não depender só de cor para transmitir estado (badges têm texto além de cor).

### 23.3 Testes (nível: essencial)

Exigência: cobrir **lógica de negócio e Server Actions**. Não é exigida cobertura E2E completa no MVP.

- **Framework:** Vitest (unit/integração) + Testing Library para componentes críticos.
- **Obrigatório testar:**
  - Todas as Server Actions: caminho de sucesso, falha de validação (Zod), falha de auth, e casos-limite relevantes da secção 22.
  - Cálculo de estatísticas agregadas (secção 15) — incluindo taxa de presença de atleta que entra a meio (22.3), e GR vs campo.
  - Validação dos schemas Zod (inputs válidos e inválidos).
  - Serialização/validação do `DiagramaCampo`.
- **Recomendado (não obrigatório):** testes de componente para o editor de campo (colocar, mover, apagar, undo) e um smoke E2E do fluxo "criar sessão → marcar presenças".
- Base de dados de teste isolada (schema separado ou BD em memória/container). Cada teste limpa o seu estado.

### 23.4 Qualidade de código
- ESLint + Prettier configurados. `tsc --noEmit` sem erros (strict).
- Sem `any` exceto justificado. Tipos derivados dos schemas Zod e do Prisma Client.
- Commits pequenos e por funcionalidade seguindo a ordem da secção 18.

### 23.5 Segurança
- Passwords só como hash bcrypt (custo 10). Nunca em logs.
- Todas as Server Actions verificam autenticação antes de operar (secção 10.3).
- Validação server-side obrigatória (nunca confiar só no cliente).
- Variáveis sensíveis só em `.env` (nunca no repositório). `.env.example` sem valores.
- Como todos os utilizadores pertencem ao mesmo clube e têm permissões iguais, não há verificação de autorização por-recurso no MVP além de "está autenticado" — mas as queries DEVEM sempre filtrar pelo clube do utilizador autenticado (preparação para multi-clube e defesa em profundidade).

### 23.6 Internacionalização
- Interface 100% em português de Portugal, hardcoded (sem sistema i18n no MVP).
- Datas via date-fns com locale `pt`. Formato: "24 de julho de 2026", horas "18:30".

### 23.7 Navegadores-alvo
- Últimas 2 versões de Chrome, Safari, Firefox, Edge. Safari iOS (tablet). Chrome Android.
- Sem suporte a Internet Explorer.

---

## 24. Definição de Pronto (Definition of Done)

Uma funcionalidade só está concluída quando:
1. Implementada conforme a especificação (modelo, action, UI, regras).
2. Validação Zod no input; retorna `Resultado<T>`.
3. Estados de loading, vazio e erro tratados.
4. Responsiva em tablet, telemóvel e PC.
5. Interface em português de Portugal.
6. Testes essenciais escritos e a passar (secção 23.3).
7. Sem erros de `tsc` nem de ESLint.
8. Casos-limite aplicáveis da secção 22 cobertos.

O MVP está concluído quando todos os itens da secção 18 estão feitos e a checklist do Anexo B está toda validada.

---

---

# PARTE II — PRODUTO COMPLETO (FASE 2)

> A Parte I (secções 1–24) especifica o MVP, a implementar primeiro. A Parte II especifica o produto completo ao mesmo nível de detalhe. **Implementação faseada, especificação única.** Tudo aqui é para construir depois do MVP validado, mas está totalmente definido para não depender de contexto perdido.

## 25. Visão do Produto Completo

### 25.1 O que o Mister é, no fim

Uma plataforma de gestão de futsal que cobre o ciclo completo do treinador e do clube: planeamento de época estruturado (macrociclo→sessão), gestão de treino e jogo, desenvolvimento individual do atleta (caderneta), e um portal onde pais e atletas acompanham a evolução. Preparada para operar num clube ou, opcionalmente, em várias organizações.

### 25.2 Módulos da fase 2

| Módulo | Secção | Depende de |
|---|---|---|
| Planeamento de época (periodização) | 26 | MVP: sessões, escalões, épocas |
| Relatórios e exportação PDF | 27 | MVP: sessões, jogos, estatísticas |
| Dashboard analítico (gráficos) | 28 | MVP: estatísticas, agregações |
| Caderneta avançada | 29 | MVP: caderneta base |
| Portal de pais/atletas | 30 | MVP: atletas, estatísticas, caderneta |
| Multi-clube (opcional) | 31 | MVP: modelo Clube |
| Transição de plantel entre épocas | 32 | MVP: atletas, épocas |
| Biblioteca partilhada e animação de exercícios | 33 | MVP: exercícios, editor de campo |

### 25.3 Princípios que se mantêm
- Permissões **sempre iguais** entre utilizadores treinadores (nunca hierarquia). O portal de pais/atletas é a única exceção — é um tipo de acesso distinto, read-only, ver secção 30.
- Tablet-first, responsivo, português de Portugal.
- Cada módulo respeita a época ativa e o clube do utilizador.

---

## 26. Planeamento de Época (Periodização)

Sistema de planeamento hierárquico que dá estrutura anual acima das sessões. É o módulo central da fase 2.

### 26.1 Hierarquia de planeamento

```
Época (já existe no MVP)
  └── Macrociclo         (ex: "1ª Volta", "2ª Volta", ou toda a época)
        └── Mesociclo    (bloco de semanas com foco — ex: "Bloco técnico set-out")
              └── Microciclo   (uma semana)
                    └── Sessão (já existe no MVP — passa a poder ligar-se a um microciclo)
```

Cada nível tem objetivos próprios. Uma sessão pode existir sem microciclo (compatibilidade com o MVP) ou estar ligada a um.

### 26.2 Modelo de dados (adições)

```prisma
model Macrociclo {
  id          String   @id @default(cuid())
  nome        String
  objetivo    String?  @db.Text
  dataInicio  DateTime
  dataFim     DateTime
  ordem       Int      @default(0)
  epocaId     String
  epoca       Epoca    @relation(fields: [epocaId], references: [id])
  escalaoId   String
  escalao     Escalao  @relation(fields: [escalaoId], references: [id])
  criadoEm    DateTime @default(now())

  mesociclos  Mesociclo[]

  @@index([epocaId, escalaoId])
}

model Mesociclo {
  id            String   @id @default(cuid())
  nome          String
  objetivo      String?  @db.Text
  focoPrincipal String?  // ex: "Técnica individual", "Transições"
  dataInicio    DateTime
  dataFim       DateTime
  ordem         Int      @default(0)
  macrocicloId  String
  macrociclo    Macrociclo @relation(fields: [macrocicloId], references: [id], onDelete: Cascade)

  microciclos   Microciclo[]

  @@index([macrocicloId])
}

model Microciclo {
  id            String   @id @default(cuid())
  nome          String   // ex: "Semana 5"
  objetivo      String?  @db.Text
  dataInicio    DateTime // início da semana
  dataFim       DateTime
  cargaPrevista CargaTreino? // volume/intensidade planeados
  ordem         Int      @default(0)
  mesocicloId   String
  mesociclo     Mesociclo @relation(fields: [mesocicloId], references: [id], onDelete: Cascade)

  sessoes       Sessao[]  // sessões ligadas a este microciclo

  @@index([mesocicloId])
}

enum CargaTreino {
  BAIXA
  MEDIA
  ALTA
}
```

Adição ao modelo `Sessao` (MVP) — campo opcional para ligação:
```prisma
// em Sessao, adicionar:
  microcicloId  String?
  microciclo    Microciclo? @relation(fields: [microcicloId], references: [id])
```
(É nullable — sessões do MVP continuam válidas sem microciclo.)

### 26.3 Server Actions (`lib/actions/planeamento.ts`)
```typescript
criarMacrociclo(dados): Promise<Resultado<Macrociclo>>
atualizarMacrociclo(id, dados): Promise<Resultado<Macrociclo>>
apagarMacrociclo(id): Promise<Resultado<void>>          // cascade meso/micro
listarMacrociclos(escalaoId): Promise<Resultado<Macrociclo[]>>  // época ativa

criarMesociclo(macrocicloId, dados): Promise<Resultado<Mesociclo>>
atualizarMesociclo / apagarMesociclo / listarMesociclos(macrocicloId)

criarMicrociclo(mesocicloId, dados): Promise<Resultado<Microciclo>>
atualizarMicrociclo / apagarMicrociclo / listarMicrociclos(mesocicloId)

ligarSessaoMicrociclo(sessaoId, microcicloId): Promise<Resultado<void>>
desligarSessaoMicrociclo(sessaoId): Promise<Resultado<void>>
```

### 26.4 Ecrãs
- **Nova entrada de navegação: "Planeamento"** (entre Treinos e Exercícios).
- **Vista de linha temporal (timeline)** da época: macrociclos como faixas horizontais, mesociclos aninhados, microciclos como semanas. Escala temporal.
- **Vista de árvore** alternativa: expandir macro→meso→micro→sessões.
- Detalhe de cada nível: objetivos, datas, e os filhos.
- No detalhe do microciclo: lista das sessões da semana e atalho para criar sessão já ligada.
- No detalhe da sessão (MVP): passa a mostrar a que microciclo pertence e o objetivo herdado.

### 26.5 Regras
- Datas dos filhos DEVEM estar dentro das do pai (aviso não-bloqueante se não estiverem).
- Apagar um nível apaga os descendentes (cascade), mas as **sessões** ligadas a um microciclo apagado NÃO são apagadas — apenas ficam desligadas (`microcicloId = null`). As sessões são dados de treino reais, o planeamento é uma camada por cima.
- Tudo filtrado por época ativa + escalão.

---

## 27. Relatórios e Exportação PDF

Geração de documentos profissionais a partir dos dados do sistema.

### 27.1 Relatórios disponíveis
1. **Ficha de sessão de treino** — cabeçalho (data, escalão, objetivo), lista de exercícios com diagramas de campo renderizados, duração, presenças. Formato imprimível para levar para o campo.
2. **Relatório de jogo** — resultado, convocatória, estatísticas por atleta, relatório escrito.
3. **Evolução do atleta** — estatísticas da época, progresso da caderneta, gráfico de evolução, taxa de presença. Para partilhar com pais ou arquivo.
4. **Resumo de época (escalão)** — visão global: jogos, resultados, estatísticas coletivas, top marcadores.

### 27.2 Abordagem técnica
- Geração server-side de PDF a partir de HTML/React (ex: `@react-pdf/renderer` ou render de template HTML + Puppeteer no servidor).
- Os diagramas de campo (SVG) são incorporados diretamente no PDF (o SVG do exercício reutiliza-se).
- Identidade visual: cores do clube no cabeçalho, logo se existir.
- Idioma: português.

### 27.3 Server Actions (`lib/actions/relatorios.ts`)
```typescript
gerarFichaSessao(sessaoId): Promise<Resultado<{ url: string }>>       // devolve PDF
gerarRelatorioJogo(jogoId): Promise<Resultado<{ url: string }>>
gerarEvolucaoAtleta(atletaId): Promise<Resultado<{ url: string }>>
gerarResumoEpoca(escalaoId): Promise<Resultado<{ url: string }>>
```
Os PDFs são gerados on-demand; opcionalmente guardados em Supabase Storage com URL assinado (caso contrário, stream direto para download).

### 27.4 Ecrãs
- Botão "Exportar PDF" no detalhe de sessão, jogo e perfil de atleta.
- Página "Relatórios" em Definições ou secção própria para o resumo de época.

---

## 28. Dashboard Analítico

Evolução do dashboard do MVP (que só mostra próximos eventos) para incluir análise visual.

### 28.1 Conteúdo
- **Widgets de equipa (por escalão, época ativa):**
  - Golos marcados vs sofridos ao longo dos jogos (gráfico de linha).
  - Distribuição de resultados (vitórias/empates/derrotas).
  - Top marcadores e assistentes (tabela/barras).
  - Taxa de presença média da equipa por microciclo/mês (gráfico de barras).
- **Widgets de desenvolvimento:**
  - Progresso agregado da caderneta (quantas habilidades desbloqueadas pela equipa).
  - Atletas com mais evolução na época.

### 28.2 Técnico
- Biblioteca de gráficos: `recharts` (compatível com o stack, leve).
- Cálculos server-side (agregações), gráficos client-side.
- Respeita época ativa + escalão selecionado.

### 28.3 Server Actions (`lib/actions/analytics.ts`)
```typescript
obterEvolucaoResultados(escalaoId): Promise<Resultado<PontoGrafico[]>>
obterTopMarcadores(escalaoId, limite): Promise<Resultado<AtletaEstatistica[]>>
obterPresencaPorPeriodo(escalaoId): Promise<Resultado<PontoGrafico[]>>
obterProgressoCadernetaEquipa(escalaoId): Promise<Resultado<ResumoCaderneta>>
```

---

## 29. Caderneta Avançada

Evolução da caderneta do MVP.

### 29.1 Novas capacidades
- **Habilidade da semana** — destacar uma habilidade do catálogo por microciclo/semana; aparece no dashboard e (fase portal) para os atletas.
- **Ligação habilidade ↔ exercício** — associar exercícios da biblioteca a uma habilidade, sugerindo como treiná-la.
- **Caderneta imprimível** — PDF individual (via módulo de relatórios) com o estado das habilidades, estilo "passaporte" que o miúdo leva para casa.
- **Marcos/medalhas** — quando um atleta desbloqueia todas as habilidades de um nível, regista-se um marco.

### 29.2 Modelo de dados (adições)
```prisma
// Ligação habilidade <-> exercício
model HabilidadeExercicio {
  id            String   @id @default(cuid())
  habilidadeId  String
  habilidade    Habilidade @relation(fields: [habilidadeId], references: [id], onDelete: Cascade)
  exercicioId   String
  exercicio     Exercicio  @relation(fields: [exercicioId], references: [id], onDelete: Cascade)
  @@unique([habilidadeId, exercicioId])
}

// Habilidade da semana
model HabilidadeSemana {
  id            String   @id @default(cuid())
  habilidadeId  String
  habilidade    Habilidade @relation(fields: [habilidadeId], references: [id])
  microcicloId  String?
  microciclo    Microciclo? @relation(fields: [microcicloId], references: [id])
  epocaId       String
  epoca         Epoca    @relation(fields: [epocaId], references: [id])
  dataInicio    DateTime
  dataFim       DateTime
}
```
(Adicionar as relações inversas em `Habilidade`, `Exercicio`, `Microciclo`, `Epoca`.)

### 29.3 Server Actions (adições a `lib/actions/caderneta.ts`)
```typescript
ligarExercicioHabilidade(habilidadeId, exercicioId): Promise<Resultado<void>>
desligarExercicioHabilidade(id): Promise<Resultado<void>>
definirHabilidadeSemana(habilidadeId, microcicloId?, datas): Promise<Resultado<void>>
obterHabilidadeSemanaAtual(): Promise<Resultado<Habilidade | null>>
```

---

## 30. Portal de Pais/Atletas

Acesso read-only para pais e atletas acompanharem a evolução. É o único tipo de acesso fora dos treinadores.

### 30.1 Conceito
- Um tipo de utilizador distinto (**Encarregado/Atleta**) com acesso **apenas de leitura** e **apenas ao seu atleta** (ou aos seus educandos).
- Não vê o plantel completo, nem planeamento, nem outros atletas. Vê só o que lhe diz respeito.
- Os treinadores mantêm permissões iguais entre si; este portal não introduz hierarquia entre treinadores — introduz um público novo.

### 30.2 O que o portal mostra (por atleta)
- Estatísticas da época (jogos, golos, assistências, minutos, presença).
- Progresso da caderneta de habilidades (motivador para o miúdo).
- Habilidade da semana.
- Próximos eventos (treinos e jogos do escalão).
- Convocatórias (se o atleta foi convocado).

### 30.3 Modelo de dados (adições)
```prisma
model Encarregado {
  id            String   @id @default(cuid())
  nome          String
  email         String   @unique
  passwordHash  String
  clubeId       String
  clube         Clube    @relation(fields: [clubeId], references: [id])
  criadoEm      DateTime @default(now())

  vinculos      VinculoEncarregado[]
}

// Liga um encarregado a um ou mais atletas
model VinculoEncarregado {
  id             String   @id @default(cuid())
  encarregadoId  String
  encarregado    Encarregado @relation(fields: [encarregadoId], references: [id], onDelete: Cascade)
  atletaId       String
  atleta         Atleta   @relation(fields: [atletaId], references: [id], onDelete: Cascade)
  relacao        String?  // "Pai", "Mãe", "O próprio atleta", etc.
  @@unique([encarregadoId, atletaId])
}
```

### 30.4 Autenticação
- O Auth.js passa a ter dois "tipos" de conta: `Utilizador` (treinador) e `Encarregado`.
- No login, verifica-se em ambas as tabelas. O tipo determina o que a sessão pode aceder.
- Middleware: rotas `/portal/*` só para Encarregados; rotas de gestão só para Utilizadores.
- Criação de contas de encarregado: feita por um treinador (em Plantel → atleta → "Convidar encarregado"), gerando credenciais ou convite.

### 30.5 Ecrãs (novo espaço `/portal`)
```
/portal
  ├── (login partilhado ou separado)
  ├── /portal/inicio         # se tiver 1 atleta, vai direto; se vários, escolhe
  └── /portal/atleta/[id]
        ├── Estatísticas
        ├── Caderneta
        └── Agenda (próximos eventos)
```
- Visual coerente com a app, mas simplificado e read-only.
- Sem qualquer ação de escrita.

### 30.6 Regras
- Encarregado só acede a atletas a que está vinculado. Verificação em todas as queries do portal.
- Read-only absoluto: nenhuma Server Action de escrita acessível a Encarregados.
- Um atleta pode ter vários encarregados; um encarregado pode ter vários educandos.
- Privacidade: o portal nunca expõe dados de outros atletas (nem em listas, nem em rankings — os gráficos de equipa não aparecem no portal).

---

## 31. Multi-clube (Opcional)

Especificado para estar pronto se o produto escalar para várias organizações. **Opcional** — o produto funciona perfeitamente com um só clube.

### 31.1 Estado atual (já preparado no MVP)
O modelo já tem `Clube` como raiz e todas as entidades relevantes têm `clubeId`. As queries do MVP já DEVEM filtrar pelo clube do utilizador autenticado (secção 23.5). Isto significa que o multi-clube é sobretudo uma questão de **ativar** e **isolar**, não de refazer.

### 31.2 O que a fase multi-clube acrescenta
- **Registo/onboarding de novos clubes** (criar clube + primeiro utilizador).
- **Isolamento estrito de dados por clube** — nenhum utilizador vê dados de outro clube. Reforço da verificação em todas as actions.
- **Configuração por clube** — cores, logo, escalões, métricas, catálogo de habilidades independentes.
- Opcional: **billing/subscrição** se se tornar produto comercial (fora do âmbito técnico deste documento; requer decisão de negócio própria).

### 31.3 Modelo de dados
Nenhuma alteração estrutural grande — o `clubeId` já existe em todo o lado. Acrescenta-se apenas:
```prisma
// em Clube, campos de gestão:
  ativo         Boolean  @default(true)
  plano         String?  // "gratuito", "pago" — só se houver billing
```

### 31.4 Regra crítica de segurança
- **Toda e qualquer query DEVE ser filtrada pelo `clubeId` do utilizador autenticado.** Sem exceção. É a fronteira de isolamento entre organizações. Testes DEVEM verificar que um utilizador do clube A nunca acede a dados do clube B.

### 31.5 Decisão de ativação
Este módulo só se implementa se/quando houver intenção real de servir múltiplos clubes. Até lá, a app corre em modo clube-único (um clube no seed, todos os utilizadores nesse clube). A arquitetura não precisa de mudar para essa decisão ser tomada mais tarde.

---

## 32. Transição de Plantel entre Épocas

Resolve a criação manual de atletas em cada nova época (limitação assumida no MVP, secção 8.7).

### 32.1 Funcionalidade
Assistente que, ao iniciar uma nova época, permite copiar atletas da época anterior:
- Selecionar a época de origem e a de destino.
- Ver a lista de atletas da origem.
- Escolher quais transitam e para que escalão vão (subida de escalão por idade).
- Confirmar → cria novos registos de `Atleta` na época de destino, preservando nome, data de nascimento, posição, número (editáveis).

### 32.2 Regras
- Cria **novos registos** (não move) — o histórico da época anterior mantém-se intacto (coerente com a decisão do modelo, secção 5.3).
- A caderneta **não** transita automaticamente por default (cada época tem o seu progresso), mas o assistente DEVE oferecer a opção "manter progresso da caderneta" que copia o estado das habilidades para a nova época.
- Atletas não selecionados simplesmente não são criados na nova época.

### 32.3 Server Actions (`lib/actions/transicao.ts`)
```typescript
listarAtletasParaTransicao(epocaOrigemId): Promise<Resultado<Atleta[]>>
executarTransicao(dados: {
  epocaOrigemId: string;
  epocaDestinoId: string;
  atletas: { atletaId: string; escalaoDestinoId: string; manterCaderneta: boolean }[];
}): Promise<Resultado<{ criados: number }>>
```

---

## 33. Biblioteca Partilhada e Animação de Exercícios

### 33.1 Animação de exercícios
- Estender o editor de campo (secção 21) com **keyframes**: definir posições dos elementos em momentos sucessivos e reproduzir o movimento.
- Formato de dados: o `DiagramaCampo` passa a suportar opcionalmente `frames: ElementoCampo[][]` (cada frame é um estado). Retrocompatível — um diagrama sem frames é estático (o do MVP).
- UI: linha de tempo simples (adicionar frame, reproduzir, velocidade). Útil para explicar dinâmicas de jogo.

### 33.2 Partilha de exercícios entre clubes (só com multi-clube)
- Um exercício pode ser marcado como **público**; fica visível a outros clubes numa biblioteca comunitária, em modo leitura/cópia.
- Copiar um exercício público cria uma cópia no clube do utilizador (que pode então editar).
- Modelo: adicionar `publico Boolean @default(false)` a `Exercicio`.
- Só relevante se o multi-clube (secção 31) estiver ativo.

### 33.3 Regras
- A animação é opcional por exercício — não obriga a mudar exercícios existentes.
- Exercícios públicos nunca expõem dados de atletas (são só diagramas + metadados).

---

## 34. Roadmap de Implementação (Produto Completo)

Ordem recomendada. A Parte I (MVP) é sempre primeiro. A Parte II implementa-se por módulos, cada um independente e entregável.

### 34.1 Fase 1 — MVP (Parte I, secções 1–24)
Conforme secção 18. Resultado: produto utilizável por dois treinadores numa época.

### 34.2 Fase 2 — Produto completo (Parte II), ordem sugerida
1. **Transição de plantel (secção 32)** — pequena, alto valor no início de cada época. Bom primeiro passo pós-MVP.
2. **Relatórios PDF (secção 27)** — valor imediato, reutiliza dados e diagramas existentes.
3. **Planeamento de época (secção 26)** — módulo central, estrutura o trabalho.
4. **Dashboard analítico (secção 28)** — depende de haver dados acumulados; faz sentido após uma época de uso.
5. **Caderneta avançada (secção 29)** — habilidade da semana, ligação a exercícios, caderneta imprimível.
6. **Portal de pais/atletas (secção 30)** — abre o produto a um novo público; requer os dados dos anteriores para ter conteúdo.
7. **Animação de exercícios (secção 33.1)** — melhoria do editor.
8. **Multi-clube (secção 31)** — só se houver decisão de escalar. Ativa isolamento e onboarding.
9. **Partilha de exercícios (secção 33.2)** — só faz sentido com multi-clube.

### 34.3 Princípio de faseamento
Cada módulo é **independente e não quebra o anterior**. Todos respeitam o modelo de dados já definido (as adições são retrocompatíveis: campos nullable, novas tabelas, nunca alterações destrutivas ao MVP). Uma equipa pode parar após qualquer módulo e ter um produto coerente.

### 34.4 Compatibilidade do modelo de dados
Todas as adições da Parte II são aditivas:
- Novas tabelas: Macrociclo, Mesociclo, Microciclo, HabilidadeExercicio, HabilidadeSemana, Encarregado, VinculoEncarregado.
- Novos campos nullable em tabelas existentes: `Sessao.microcicloId`, `Clube.ativo`, `Clube.plano`, `Exercicio.publico`, `DiagramaCampo.frames` (no JSON).
- **Nenhuma alteração destrutiva** ao schema do MVP. Uma migração da Parte II nunca perde dados da Parte I.

---

## 35. Modelo de Dados Consolidado (Produto Completo)

Referência única de todas as entidades do produto final. As da Parte I (MVP) estão na secção 5.2; as da Parte II são as adições acima. Contagem total:

**Entidades MVP (16):** Clube, Utilizador, Epoca, Escalao, Atleta, Exercicio, Sessao, SessaoExercicio, Presenca, Jogo, Convocatoria, EstatisticaAtleta, MetricaConfig, ValorMetrica, Habilidade, ProgressoHabilidade.

**Entidades Fase 2 (7):** Macrociclo, Mesociclo, Microciclo, HabilidadeExercicio, HabilidadeSemana, Encarregado, VinculoEncarregado.

**Total produto completo: 23 entidades.**

**Enums MVP (8):** Posicao, CategoriaExercicio, EstadoPresenca, CasaFora, Utilizacao, TipoMetrica, NivelHabilidade, EstadoHabilidade.
**Enums Fase 2 (1):** CargaTreino.
**Total: 9 enums.**

### 35.1 Regra de ouro do modelo
Toda entidade com dados de um clube tem (direta ou indiretamente) um caminho até `Clube`. Toda entidade com dados de uma época tem (direta ou indiretamente) um caminho até `Epoca`. As queries filtram sempre por clube (isolamento) e, quando aplicável, por época (contexto). Esta regra vale para MVP e Fase 2 sem exceção.

---

## Anexo A — Terminologia (interface)

| Termo interface | Nunca usar |
|---|---|
| Escalão | Categoria |
| Época | Temporada (evitar; usar Época) |
| Guarda-redes / GR | Guarda-redes de futebol / goleiro |
| Fixo | Defesa central |
| Ala | Extremo / lateral |
| Pivô | Avançado / ponta de lança |
| Sessão / Unidade de Treino | Sessão de treino de futebol |
| Convocatória | Lista de chamados |
| Habilidade | Truque (informal — usar Habilidade) |

## Anexo B — Checklist de prontidão (antes de dar por concluído o MVP)

- [ ] Login e proteção de rotas funcionam.
- [ ] Seletor de época filtra todos os dados corretamente.
- [ ] Não há forma de misturar dados entre épocas.
- [ ] Presenças marcáveis em poucos toques, com guardar em lote.
- [ ] Estatísticas de GR só aparecem para guarda-redes.
- [ ] Editor de campo funciona com toque em tablet.
- [ ] Miniaturas de exercício renderizam nas listagens.
- [ ] Caderneta atualizável e com contagem de progresso.
- [ ] Todos os estados vazios têm texto e ação.
- [ ] Todas as Server Actions validam com Zod e retornam `Resultado<T>`.
- [ ] Interface 100% em português de Portugal.
- [ ] Responsivo verificado em tablet, telemóvel e PC.
- [ ] Avatares de iniciais gerados (sem upload de fotos).
- [ ] Sistema de design aplicado (tokens de cor, tipografia, alvos de toque ≥44px).
- [ ] Wireframes seguidos nos ecrãs principais.
- [ ] Editor de campo: colocar, mover, apagar, setas por pontos, undo — todos funcionais.
- [ ] Diagrama sobrevive a rotação/redimensionamento do ecrã.
- [ ] Casos-limite da secção 22 cobertos (métrica desativada, mudança de posição, atleta a meio da época, convocatória alterada).
- [ ] Testes essenciais (Server Actions + agregações + schemas + diagrama) a passar.
- [ ] `tsc --noEmit` e ESLint sem erros.
- [ ] Contraste AA e navegação por teclado verificados.

---

*Fim do documento. Versão 4.0 — Especificação do Produto Completo. A Parte I define o MVP (primeira fase); a Parte II define o produto completo (fase 2), ambos ao mesmo nível de detalhe. Documento único e definitivo do projeto Mister: modelo de dados consolidado (23 entidades, 9 enums), contratos de API, validação, tratamento de erros, sistema de design, wireframes, interação do editor de campo, casos-limite, requisitos não-funcionais, e roadmap de implementação faseada. Concebido para ser implementado na íntegra sem depender de contexto externo.*
