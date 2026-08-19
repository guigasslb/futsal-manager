# Mister — Especificação do Produto Final (v7)

> **Estatuto:** Bíblia do produto. Fonte única de verdade. **v7 (2026-08-19)** — sucede à `FutsalManager_Spec_v6.md` (mantida **intacta como histórico**, à semelhança do que a v6 fez à v5) e ao `FutsalManager_Spec_v4_MVP_historico.md` (arquivado).
> **Marca comercial:** o produto é distribuído sob a marca **Mister** (guia visual em `docs/BRAND.md`); "Mister" mantém-se como nome técnico/histórico do projeto.
> **Regra de ouro:** nenhuma alteração de código sem a atualização correspondente neste documento, no mesmo passo. Toda a modificação é registada no **changelog (secção 19)** com data e descrição. Se o código se perder, este documento tem de permitir recriar tudo do zero a 100%.
> **Convenções:** **DEVE** = obrigatório · **DEVERIA** = recomendado · **FUTURO** = fora do âmbito da versão atual do produto final.
> **Marcas de propriedade de dados:** 🏛️ = dado do **clube** (fica no clube) · 🎒 = **portátil** (pertence ao treinador e viaja com ele) — ver secção 4.
> **Marcas de modalidade:** ⚽futsal = específico de futsal · 🥅futebol = específico de futebol · 🔁comum = transversal às duas modalidades. Quando não há marca, o conteúdo é **comum** por omissão.
> **⚠️ = decisão de modelação a validar tecnicamente antes de implementar.**

---

## 0. Nota de versão v7 — Mister passa a plataforma multi-desporto

A **v7** expande o Mister de plataforma dedicada ao **futsal** para plataforma **multi-desporto (futsal + futebol)**, mantendo **um único código, um único modelo de dados multi-tenant e a mesma filosofia de produto**. Esta é uma **feature de produção final**, não um MVP — sem atalhos, todos os formatos e taxonomias do futebol entram completos.

**O que muda (resumo executivo):**

1. **Nova entidade `Secção`** (secção 3.1.1 e 20.2) — camada entre `Clube` e `Escalão`, âncora da **modalidade**. Cada `Secção` tem `clubeId` + `modalidade` (FUTSAL | FUTEBOL). Um clube pode ter secções de futsal **e** de futebol em simultâneo. `@@unique([clubeId, modalidade])` garante **uma secção por modalidade por clube**.
2. **`Escalão` ganha `seccaoId`** (secção 3.2) — cada escalão pertence a uma secção; deriva dela a sua modalidade. Migração **aditiva com backfill** (Apêndice C).
3. **Novo papel: Coordenador de Secção** (secção 6.9) — vê todos os escalões da **sua** secção, não os das outras.
4. **Onboarding transparente** (secção 8.1): a secção é **criada automaticamente** ao criar o primeiro escalão de uma modalidade — invisível para quem só usa uma modalidade.
5. **Formatos de futebol completos** (Apêndice B): `FUTSAL_5`, `FUTEBOL_3_3`, `FUTEBOL_5_5`, `FUTEBOL_7`, `FUTEBOL_9`, `FUTEBOL_11`.
6. **Taxonomia de posições de futebol** (secção 3.2): defesa central, laterais, médios (defensivo/centro/ofensivo), extremos e avançado, acrescentados ao enum `Posicao` (partilhando `GUARDA_REDES` e `UNIVERSAL`).
7. **Estatísticas de futebol** (secção 10.8): mesmo princípio do futsal — **núcleo fixo** (golos, assistências, defesas GR, remates, cantos, foras-de-jogo, desarmes) + **customizável** por cima via `MetricaConfig`. `faltas1aParte`/`faltas2aParte` só visíveis em FUTSAL.
8. **Campo de futebol SVG** (secção 11.5) — todos os formatos, no mesmo editor/formato de diagrama do futsal.
9. **Atleta multi-desporto** (secção 3.2, 9): um único `Atleta` por pessoa no clube, com participações (`AtletaEscalao`) em escalões de secções diferentes; estatísticas/caderneta segmentadas por modalidade/secção na UI.
10. **Licenciamento multi-secção** (secção 17): Individual = **uma modalidade ou a outra** (nunca as duas), preço mantém-se; Clube = **uma ou várias secções**, preço escala por secção/modalidade.
11. **Nova secção 20** — Arquitetura multi-desporto e extensibilidade (camadas agnóstica/parametrizável/específica; registry `ConfigModalidade`; como adicionar um novo desporto no futuro).
12. **Apêndices A, B, C** — Configuração de Futsal, Configuração de Futebol (todos os formatos), Matriz de migração v6→v7 (aditiva, backfill).

**O que NÃO muda:** a filosofia (secção 1.4), a propriedade/portabilidade de dados (secção 4), o esqueleto de contas/permissões (secções 5–6, exceto o novo papel), o editor de campo como diferenciador (secção 11), o sistema de design (secção 12) e o modelo de negócio "2 em 1" (secção 1.2). O **logótipo mantém-se** (decisão de produto). A terminologia FPF de futsal mantém-se **intacta**; a terminologia de futebol é **acrescentada**, não substitui.

**Princípio de compatibilidade:** todas as alterações de schema são **aditivas** (colunas/tabelas novas, nullable ou com default, mais backfill) — dados existentes (100% futsal) migram sem perda. Ver Apêndice C.

> **Pré-requisito de migração:** o schema da v6 tem fases *expand* pendentes não concluídas: `Atleta.escalaoId` (NOT NULL legado), `Atleta.clubeId` (nullable legado), `Exercicio.proprietario @default(CLUBE)` (deve ser `TREINADOR`), `Clube.clubeTecnico` (campo não existe no schema). Antes de aplicar as migrações v7, DEVE concluir-se o *contract* v6: criar `Clube.clubeTecnico Boolean @default(false)`, fixar `Atleta.clubeId` como NOT NULL, remover `Atleta.escalaoId`/`escalaoSecundarioId`/`epocaId` legados, e corrigir `Exercicio.proprietario @default(TREINADOR)`. O Apêndice C pressupõe o modelo *contracted* como ponto de partida.

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
20. [Arquitetura multi-desporto e extensibilidade](#20-arquitetura-multi-desporto-e-extensibilidade)
- [Apêndice A — Configuração de Futsal](#apêndice-a--configuração-de-futsal)
- [Apêndice B — Configuração de Futebol (todos os formatos)](#apêndice-b--configuração-de-futebol-todos-os-formatos)
- [Apêndice C — Matriz de migração v6→v7](#apêndice-c--matriz-de-migração-v6v7)

---

## 1. Visão, âmbito e princípios

### 1.1 O que é
O **Mister** (marca **Mister**) é uma aplicação **web (PWA)** de gestão de treino e de clube dedicada ao **desporto de formação** — **futsal e futebol** —, em português de Portugal. Permite a um treinador planear e conduzir a época — plantel, periodização, treinos, exercícios com diagramas de campo animados, presenças, jogos com estatísticas, convocatórias, caderneta de desenvolvimento do atleta, modelo de jogo, scouting, comunicação com pais/staff e reuniões — e permite a um **clube** organizar várias **secções (modalidades)**, vários escalões e treinadores num único ecossistema com permissões, analytics transversais e relatórios profissionais.

> **🔁 Nota de modalidade (v7):** onde a v6 dizia "dedicada ao futsal", a v7 mantém o rigor específico do futsal **e** acrescenta o futebol com a mesma seriedade (dimensões de campo corretas, formatos 3×3 a 11×11, posições e estatísticas próprias). A modalidade é ancorada pela **Secção** (secção 3.1.1). Um treinador ou clube que só use futsal **não vê nenhuma complexidade nova** — a modalidade futsal é o comportamento por omissão.

### 1.2 O modelo "2 em 1" (posicionamento central)
O produto funciona a dois níveis, com o mesmo código e o **mesmo modelo de dados multi-tenant**:
- **Individual (licença de treinador):** um treinador usa-o sozinho, com a sua conta e o seu portfólio de trabalho. **Sem qualquer UI ou funcionalidade de gestão de clube.** Tecnicamente, um treinador individual é o único membro de um **clube técnico invisível** (ver 1.2.1 e secção 5). **🔁 v7:** a licença Individual dá acesso a **uma** modalidade (futsal **ou** futebol), à escolha — nunca às duas em simultâneo (secção 17.1).
- **Clube (ecossistema, licença de clube):** um clube tem uma ou várias **secções** (futsal e/ou futebol), com vários escalões e treinadores, dados partilhados, permissões por papel, branding, analytics de clube e relatórios.

Esta dualidade é a vantagem competitiva. O concorrente de referência (**Dossier do Treinador**) é **apenas individual** (uma equipa por conta, sem partilha editável entre contas). O Mister é individual **e** plataforma de clube — **e agora multi-desporto**.

#### 1.2.1 Multi-tenant único (decisão 2026-08-05)
O **`Clube` é sempre o tenant de topo**, mesmo na licença Individual. Consequências:
- **DEVE:** ao registar-se ou comprar licença Individual, é criado automaticamente um **clube técnico** (`Clube.clubeTecnico = true`) com o treinador como único membro (perfil Administrador). Este clube é **invisível ao utilizador**: não há UI de gestão de clube, branding, membros, perfis, nem escalões partilhados no modo Individual.
- **DEVE:** toda a operação corre sempre num contexto de clube resolvido no servidor (elimina o caso "sem clube"), simplificando queries e permissões.
- **DEVE:** a conta é **única por email pessoal**. Ao longo do tempo pode estar em modo Individual (clube técnico) ou vinculada a um clube real (membro com papel). A transição entre modos é suportada (secção 5.3).
- **🔁 DEVE (v7):** a **modalidade** é sempre resolvida a partir da **Secção** do escalão em contexto (secção 3.1.1, 20.2). No clube técnico Individual existe **uma única secção**, da modalidade escolhida na compra.

### 1.3 Estratégia de venda
- Venda **individual** (licença de treinador): **€4,99/mês** ou **€49/ano**, para **uma** modalidade. Sem trial, sem freemium — compra directa.
- Venda **por clube** (licença de ecossistema, tiers por nº de escalões — ver secção 17): o espaço do clube com secções, escalões, permissões, branding, analytics e relatórios. **🔁 v7:** o preço **escala por secção/modalidade** (secção 17.1).
- Percurso típico: o treinador usa individualmente → demonstra ao clube → o clube adere (o treinador é **absorvido**, com crédito proporcional para carteira — secção 17.4). Se o clube não aderir, o treinador continua a usar individualmente. Se sair do clube, reativa a licença Individual por conta própria.
- **Go-to-market:** vídeo demonstrativo público; reunião de demonstração a pedido para clubes; primeiros clubes como **parceiros fundadores** (patrocínio mútuo, visibilidade cruzada, referência comercial); suporte via **WhatsApp** para utilizadores individuais.

### 1.4 Princípios de design (inquebráveis)
1. **Útil primeiro, mas visualmente e experiencialmente interessante.** Cada esforço pedido ao treinador devolve algo visual e satisfatório (marcar presenças → ver a taxa subir; registar um golo → ver o gráfico crescer; desbloquear uma habilidade → celebração).
2. **Valor acumulado sem trabalho extra.** Os dados entram naturalmente pelo uso quotidiano (presenças, sessões, jogos, stats); a app transforma-os em analytics e relatórios automaticamente. **Analytics é um pilar** (secção 10).
3. **O mais barato possível de operar.** Sem custos recorrentes de IA no núcleo. Só alojamento + base de dados + storage. A IA fica fora do núcleo (quando muito, plugin pago futuro).
4. **Desporto a sério, não adaptações.** ⚽ **Futsal a sério** (não futebol adaptado): campo com dimensões corretas, terminologia FPF, estatísticas específicas (faltas acumuladas por parte, rotações/quintetos, power play/GR-jogador, tempos de jogo por blocos). 🥅 **Futebol a sério** (não futsal esticado): campo e formatos corretos (3×3 a 11×11), posições próprias, estatísticas próprias (remates, cantos, foras-de-jogo, desarmes), **sem** as regras específicas de futsal (faltas acumuladas por parte não se aplicam).
5. **Beira-campo real:** o "modo jornada" tem de funcionar com rede fraca (PWA + offline) e poucos toques.
6. **Desenvolvimento do atleta como alma:** a caderneta e o tracking de evolução por jogador são o coração emocional e o argumento de venda aos pais.
7. **O editor de campo é um diferenciador central** (interativo, com animações) — a sua qualidade e validação são prioritárias antes de escalar a biblioteca. Serve **futsal e futebol** (secção 11.5).
8. **Português de Portugal**, terminologia do glossário (secção 2).
9. **Documentação sempre atualizada** (regra de ouro no topo).

### 1.5 Âmbito da versão atual do produto final
**Incluído (núcleo — uso prático do treinador + equipa técnica + ecossistema de clube):**
- Esqueleto multi-tenant: utilizador independente (clube técnico) + adesão a clube + propriedade de dados + RGPD + permissões configuráveis com overrides + branding do clube.
- **🔁 Multi-desporto:** **Secções** por modalidade (futsal/futebol); escalões dentro de secções; papel de **Coordenador de Secção**; onboarding transparente (secção criada ao criar o primeiro escalão da modalidade).
- **Licenciamento:** licença Individual (uma modalidade) e de Clube (uma ou várias secções; tiers por nº de escalões), carteira/crédito de absorção, arquitetura pronta para **billing Paddle** (implementação de billing deferida — secção 17).
- Plantel/atletas ao **nível do clube** com relação **N-N atleta↔escalão** (histórico, transições, número por escalão) — **agora multi-desporto** (um atleta pode participar em escalões de secções diferentes) · Escalões (ligados a secções) · Épocas.
- Exercícios: **editor de campo interativo + animação (A→B)** — **futsal e futebol** — + **duas bibliotecas** (pessoal portátil + do clube) + biblioteca curada de exemplo (por parte do treino/objetivo/escalão/**modalidade**).
- **Templates de sessão** (sessões completas pré-construídas, curadas e do treinador/clube).
- Treinos: sessões + notas de treino + presenças (**lesões como motivo de falta**).
- **Periodização:** planos semanais e mensais (microciclos/mesociclos).
- **Modelo de jogo** (documento vivo por clube/escalão/época) + **bolas paradas** + quadro tático por jogo (reutiliza o editor de campo).
- Jogos (amigável/competição): convocatória + estatísticas (**futsal e futebol**) + **tempos de jogo por blocos** + **registo ao vivo ou pós-jogo** + relatório + vídeo por link YouTube + **vista de dia de jogo** + **scouting do adversário no próprio jogo**.
- **Calendário + competições + tabelas de classificação** (a partir de resultados inseridos manualmente).
- **Comunicação (gerador de conteúdo para WhatsApp)** + **reuniões** (escalão/clube, ata exposta) + **sincronização Google Calendar**.
- **Caderneta de habilidades.**
- **Analytics em 3 níveis (atleta/equipa/clube)** — com **filtro por secção/modalidade** — e **relatório de fim de época partilhável** (PDF + vista web com link, sem IA).
- **Relatórios PDF** profissionais.
- **Onboarding com vitória rápida** (criação em massa do plantel, primeira sessão de template, primeira convocatória).
- **Dashboard contextual** (centro de comando temporal) + secção "atenção necessária".
- **Lembretes / to-dos** (pessoais e de equipa, com deadline, integrados no dashboard).
- **Design direction** (secção 12): tema escuro como base, cor do clube como identidade, **motion como linguagem**, empty states desenhados.

**FUTURO (fora da versão atual):** ver secção 18. Nota importante: o **portal de pais/atletas** continua FUTURO; o que entra é apenas o **gerador de conteúdo para WhatsApp** (os pais não têm conta na app).

### 1.6 Anti-âmbito (decisões conscientes)
- **Sem IA no núcleo** (custo).
- **Sem armazenamento de vídeo** (só links YouTube).
- **Sem app nativa/APK** — a PWA cobre Android e iOS; APK só como embrulho fino (TWA/Capacitor) no futuro.
- **Sem quotas/mensalidades do clube** (o clube a cobrar aos pais).
- **Sem multi-idioma/multi-moeda** (mercado PT primeiro).
- **Conformidade FPF** (Modelo 2 e documentos federativos) está **no âmbito**, mas a implementação depende de **levantamento dos requisitos exatos da FPF** (secção 8/16). **🔁 v7:** o levantamento deve cobrir os documentos federativos de **futsal e de futebol**.
- **🔁 v7 — Anti-âmbito multi-desporto:** **não** há desportos além de futsal e futebol nesta versão (a arquitetura fica preparada para os acrescentar — secção 20.4, mas nenhum outro entra agora); **não** há regras de arbitragem automáticas nem bloqueio de substituições (o registo é informativo — amigáveis de formação não têm regras fixas de substituições).

### 1.7 Multi-desporto (posicionamento e princípios — decisão 2026-08-19)
> Esta secção fixa os princípios que governam toda a expansão multi-desporto. É **prescritiva**.

**1.7.1 A modalidade vive na Secção.** A `Secção` (secção 3.1.1) é a **âncora da modalidade** — tudo o que precisa de saber "isto é futsal ou futebol?" resolve-o subindo do escalão para a secção. Não há campo `modalidade` disperso por atletas, jogos ou exercícios: deriva-se **sempre** da secção do escalão em contexto. Isto evita inconsistências e mantém o modelo limpo (secção 20.1).

**1.7.2 Um clube, várias modalidades.** Um clube pode ter **secções de FUTSAL e de FUTEBOL em simultâneo** (`@@unique([clubeId, modalidade])` — no máximo uma por modalidade). Cada secção é um universo visual e organizacional próprio: "Benjamins Futsal" e "Benjamins Futebol" nunca se confundem porque vivem em secções separadas (secção 8.1.1).

**1.7.3 Uma pessoa, um atleta.** Há **um único `Atleta` por pessoa** no clube, independentemente de quantas modalidades pratica. O mesmo miúdo pode ter participações (`AtletaEscalao`) em "Benjamins Futsal" e "Benjamins Futebol" — dados pessoais partilhados, estatísticas e caderneta **segmentadas por modalidade/secção** na UI (secção 9, 10.8).

**1.7.4 Individual = uma modalidade.** A licença Individual dá acesso a **uma** modalidade (a escolhida na compra). Não é possível gerir futsal e futebol na mesma licença Individual — para isso existe a licença de Clube com múltiplas secções (secção 17.1).

> **Treinador individual e duas modalidades:** a licença Individual suporta uma única modalidade. Um treinador que dirija escalões de futsal e de futebol em simultâneo DEVE usar uma licença de Clube (ou Clube Técnico). Esta decisão é intencional: a gestão de duas secções implica funcionalidades de coordenação (permissões, analytics cruzados) que a licença Individual não comporta. A persona do treinador dual-sport individual é reconhecida e o seu caminho natural é o Clube Técnico (sem atletas, só escalões do próprio treinador).

**1.7.5 Transparência para quem não precisa.** Um treinador ou clube que só faça uma modalidade **não vê complexidade nova**: a secção é criada automaticamente ao criar o primeiro escalão (secção 8.1.1) e a UI não mostra seletor de secção quando só existe uma. A camada multi-desporto é **invisível por omissão** e **explícita só quando há mais do que uma secção**.

**1.7.6 Três camadas de conhecimento de modalidade** (detalhe em 20.1):
- **Agnóstica** — não sabe nada de modalidade (contas, permissões, épocas, presenças, comunicação, caderneta, lembretes, reuniões).
- **Parametrizável** — comporta-se conforme a modalidade via configuração (estatísticas, posições, formato de jogo, campo do editor, biblioteca curada).
- **Específica** — regras que só existem numa modalidade (faltas acumuladas por parte e power play só em futsal; foras-de-jogo e cantos como núcleo em futebol).

---

## 2. Glossário e terminologia

Interface 100% em **português de Portugal**, terminologia FPF (futsal e futebol). Usar sempre estes termos (não sinónimos).

### 2.1 Termos comuns (transversais às modalidades) 🔁

**Organização**
- **Clube** — a organização (ecossistema). Tem **secções**, escalões, membros, épocas, branding. No modo Individual é um **clube técnico** invisível.
- **Clube técnico** — clube automático de 1 membro que suporta a licença Individual (invisível ao utilizador).
- **Ecossistema** — o espaço partilhado do clube (várias secções/escalões/treinadores com permissões).
- **Secção** — 🔁 **(novo v7)** subdivisão do clube por **modalidade** (Futsal ou Futebol). É a **âncora da modalidade**; contém escalões e coordenadores. Um clube tem no máximo **uma secção por modalidade**. Criada automaticamente ao criar o primeiro escalão da modalidade.
- **Modalidade** — 🔁 **(novo v7)** o desporto de uma secção: **FUTSAL** ou **FUTEBOL**.
- **Escalão** — grupo etário/nível (Petizes, Traquinas, Benjamins, Infantis, Iniciados, Juvenis, Juniores, Séniores). Pertence a uma **secção** (logo, a uma modalidade). É a "equipa" na prática.
- **Época** — ano desportivo (ex: "2026/27"). Uma ativa de cada vez por clube.
- **Membro** — utilizador ligado a um clube com um perfil.
- **Perfil** — pacote configurável de permissões (capacidades + âmbito).
- **Override de capacidade** — capacidade concedida ou revogada a um membro específico, independentemente do seu perfil (secção 6).
- **Coordenador de Secção** — 🔁 **(novo v7)** membro que coordena **uma secção**: vê e gere todos os escalões dessa secção, não os das outras secções (secção 6.9).

**Licenciamento**
- **Licença** — direito de uso pago: **Individual** (treinador, **uma modalidade**) ou **Clube** (ecossistema, **uma ou várias secções**).
- **Tier** — escalão comercial da licença de clube por nº de escalões (Pequeno/Médio/Grande/Parceiro).
- **Carteira** — saldo de crédito da conta do treinador (resulta de absorção por clube; usado em compras futuras).
- **Absorção** — quando um treinador Individual passa a membro de um clube; o tempo restante da sua licença converte-se em crédito de carteira.
- **Parceiro fundador** — clube inicial com acordo de patrocínio mútuo e voz no roadmap.

**Pessoas**
- **Atleta** — jogador que pertence ao **clube** (não à época, nem ao treinador, nem à modalidade). Participa em um ou mais escalões — **de secções/modalidades potencialmente diferentes** — via **participação de escalão**.
- **Participação de escalão (`AtletaEscalao`)** — vínculo atleta↔escalão numa época, com **tipo** (Principal/Simultânea/Ocasional), **estado** (Ativo/Transição permanente/Inativo), **número de camisola** e datas. A modalidade da participação deriva da secção do escalão.
- **Plantel** — conjunto de atletas com participação ativa num escalão numa época.
- **Administrador / Diretor Técnico / Coordenador de Secção / Treinador (Principal/Adjunto)** — papéis de arranque (perfis).
- **Encarregado de educação** — responsável legal do atleta menor (RGPD).

**Treino**
- **Sessão** — uma sessão de treino (data, objetivo, exercícios, presenças). Pertence a um escalão (logo, a uma modalidade).
- **Template de sessão (`ModeloSessao`)** — sessão completa pré-construída e reutilizável (curada pela equipa Mister ou criada pelo treinador/clube).
- **Exercício** — unidade de treino, com diagrama de campo opcional (estático ou animado). O campo do diagrama adapta-se à modalidade (secção 11.5).
- **Biblioteca pessoal (🎒)** — exercícios/templates do treinador, portáteis.
- **Biblioteca do clube (🏛️)** — exercícios/templates partilhados no clube.
- **Parte do treino** — Aquecimento / Parte principal / Jogo reduzido / Retorno à calma.
- **Semana (de trabalho)** — unidade de planeamento semanal **exposta ao utilizador** (o termo técnico **Microciclo** é interno e não aparece na UI). O agrupamento de sessões por semana é **automático pela data**; formalizar uma semana (nome, modo) é **opcional**. Ver 8.9.
- **Modo de semana** — forma de detalhar uma semana formalizada: **Estruturado** (dias marcados por relação com o jogo — MD-X) ou **Texto livre** (campo aberto). Ver 8.9.
- **Semana-tipo** — estrutura/metodologia de uma semana reutilizável como **template** (🎒 portátil quando criada pelo treinador). Ver 3.5 / 8.9.
- **Microciclo** — termo técnico **interno** para semana de treino (não exposto na UI; ver «Semana»). **Mesociclo** — bloco de semanas; campo **interno/avançado**, escondido por defeito na UI (só perfil avançado). **Período** — Preparatório / Competitivo / Transição.
- **Periodização** — planeamento por ciclos (semanal/mensal).
- **Presença** — estado do atleta numa sessão (Presente, Falta, Falta justificada, Lesionado, Atrasado), com **motivo de falta** (Lesão/Doença/Outro/Sem justificação).

**Jogo (comum)**
- **Jogo** — encontro (Oficial ou Amigável), Casa/Fora, com um **formato** (ver "Formato de jogo").
- **Formato de jogo (`FormatoJogo`)** — 🔁 **(novo v7)** número de jogadores por equipa: **FUTSAL_5** (futsal); **FUTEBOL_3_3**, **FUTEBOL_5_5**, **FUTEBOL_7**, **FUTEBOL_9**, **FUTEBOL_11** (futebol). Determina o campo do editor e a interpretação de algumas estatísticas.
- **Convocatória** — atletas convocados para um jogo (com posição prevista para a vista de dia de jogo).
- **Vista de dia de jogo** — ecrã dedicado ao dia do jogo (convocados + posições, scouting, bolas paradas, hora e local).
- **Utilização** — Titular / Utilizado / Não utilizado.
- **Bloco de tempo** — unidade de tempo de jogo (Jogo completo / Meia-parte / 10 min / 5 min); alternativa ao minuto-a-minuto.
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
- **Habilidade** — "move" técnico, por nível (Básico/Intermédio/Avançado).
- **Analytics** — três níveis: **atleta**, **equipa**, **clube (transversal)** — com filtro por **secção/modalidade** e por escalão.
- **Relatório de fim de época** — síntese por equipa/atleta/clube, a partir dos dados; exportável em PDF e partilhável por link web.

**Dados**
- **Portátil (🎒)** — dado que pertence ao treinador e viaja com ele.
- **Do clube (🏛️)** — dado que fica no clube quando o treinador sai.
- **Snapshot** — cópia só-de-leitura que o clube retém de conteúdo do treinador usado em sessões.

### 2.2 Bloco Futsal ⚽ (terminologia específica)
- **Futsal** — modalidade de 5×5 em pavilhão, campo 40×20 m (`FormatoJogo = FUTSAL_5`).
- **Quinteto** — os 5 jogadores em campo. **Rotação** — trocas constantes.
- **Faltas acumuladas** — faltas da equipa **por parte**; à 5.ª, livre sem barreira (10 m). **Só existe em futsal** (`Jogo.faltas1aParte`/`faltas2aParte`).
- **Power play / GR-jogador** — guarda-redes a jogar como 5.º jogador de campo. Conceito específico de futsal.
- **Posições de futsal** — **Guarda-redes**, **Fixo**, **Ala**, **Pivô**, **Universal**.
- **Segunda penalidade** — marca dos 10 m (característica do futsal). **Marca de grande penalidade** — 6 m.

### 2.3 Bloco Futebol 🥅 (terminologia específica)
- **Futebol** — modalidade de campo, em vários **formatos** por escalão etário: **3×3** (petizes), **5×5** (traquinas / petizes mais velhos), **7** (Benjamins, Sub-10/11), **9** (Infantis/Iniciados, Sub-12/13), **11** (Juvenis, Sub-15/17; Juniores, Sub-19; Seniores).
- **Formatos** — `FUTEBOL_3_3`, `FUTEBOL_5_5`, `FUTEBOL_7`, `FUTEBOL_9`, `FUTEBOL_11` (ver Apêndice B para dimensões).
- **Posições de futebol** — **Guarda-redes**, **Defesa central**, **Lateral direito**, **Lateral esquerdo**, **Médio defensivo**, **Médio centro**, **Médio ofensivo**, **Extremo direito**, **Extremo esquerdo**, **Avançado** (mais **Universal**, partilhado). Ver secção 3.2.
- **Estatísticas de futebol (núcleo fixo)** — golos, assistências, defesas (GR), **remates**, **cantos**, **foras-de-jogo**, **desarmes** (secção 10.8).
- **Fora-de-jogo** — situação regulamentar do futebol (não existe em futsal); registada como estatística de núcleo.
- **Canto (pontapé de canto)** — reposição de bola pela linha de fundo; núcleo estatístico de futebol.
- **Desarme** — recuperação defensiva de bola; núcleo estatístico de futebol.
- **Sem faltas acumuladas por parte** — as regras de faltas acumuladas do futsal **não se aplicam** em futebol (campos `faltas1aParte`/`faltas2aParte` ocultos na UI de futebol — secção 8.11, 10.8).

## 3. Modelo de dados completo

Stack de persistência: **Prisma + PostgreSQL (Supabase)**. Todos os `id` são `cuid`. Todas as datas são `DateTime`. Convenção de propriedade: 🏛️ clube · 🎒 portátil (treinador). Marcas de modalidade: ⚽ futsal · 🥅 futebol · 🔁 comum.

> **Nota:** este é o modelo-alvo do produto final. Decisões ainda **a validar tecnicamente** estão marcadas com ⚠️. As alterações da v7 (Secção, `seccaoId` no escalão, formatos e posições de futebol, estatísticas de futebol) são **aditivas** (Apêndice C) e correspondem às fases 25–30 (secção 16).

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
  seccoes         Seccao[]              // 🔁 v7: secções (modalidades) do clube
  escaloes        Escalao[]
  atletas         Atleta[]              // atletas pertencem ao clube (não à época nem à modalidade)
  habilidades     Habilidade[]
  metricas        MetricaConfig[]
  subcategorias   SubcategoriaExercicio[]
  competicoes     Competicao[]
  reunioes        Reuniao[]
  modelosComunicacao ModeloComunicacao[]
  licenca         Licenca?              @relation("LicencaClube") // licença de clube (se real)
}

// Adesão utilizador↔clube. REGRA: no máximo UMA adesão ATIVA por utilizador (um clube de cada vez).
model MembroClube {
  id            String       @id @default(cuid())
  utilizadorId  String
  utilizador    Utilizador   @relation(fields: [utilizadorId], references: [id], onDelete: Cascade)
  clubeId       String
  clube         Clube        @relation(fields: [clubeId], references: [id], onDelete: Cascade)
  perfilId      String
  perfil        Perfil       @relation(fields: [perfilId], references: [id])
  estado        EstadoMembro @default(ATIVO) // ATIVO | INATIVO | CONVIDADO
  capacidadesExtra     String[] @default([]) // concedidas além do perfil
  capacidadesRevogadas String[] @default([]) // removidas apesar do perfil
  dataEntrada   DateTime     @default(now())
  dataSaida     DateTime?

  atribuicoes AtribuicaoEscalao[]
  seccoes     MembroSeccao[]      // 🔁 v7: secções que este membro coordena (scope de secção)

  @@unique([utilizadorId, clubeId])
}

enum EstadoMembro { ATIVO INATIVO CONVIDADO }

// Perfil = pacote configurável de capacidades + âmbito. Cada clube tem os seus (com modelos de arranque editáveis).
model Perfil {
  id          String       @id @default(cuid())
  clubeId     String
  clube       Clube        @relation(fields: [clubeId], references: [id], onDelete: Cascade)
  nome        String       // ex: "Administrador", "Diretor Técnico", "Coordenador de Secção", "Treinador Principal", "Adjunto"
  descricao   String?
  ambito      AmbitoPerfil @default(PROPRIOS_ESCALOES) // TODO_CLUBE | SECCAO | PROPRIOS_ESCALOES
  capacidades String[]     // chaves de capacidade (ver secção 6)
  sistema     Boolean      @default(false) // modelo de arranque (editável, mas assinalado)
  criadoEm    DateTime     @default(now())

  membros MembroClube[]
}

// 🔁 v7: âmbito ganha o valor SECCAO (todos os escalões de uma secção).
enum AmbitoPerfil { TODO_CLUBE SECCAO PROPRIOS_ESCALOES }

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

#### 3.1.1 Secção (modalidade) e coordenação de secção — 🔁 novo v7

> A `Secção` é a **âncora da modalidade** (secções 1.7.1, 20.2). Cada escalão pertence a uma secção; a modalidade de tudo o resto deriva daí. Um clube tem **no máximo uma secção por modalidade** (`@@unique([clubeId, modalidade])`). Criada **automaticamente** ao criar o primeiro escalão da modalidade (secção 8.1.1) — transparente para quem não precisa.

```prisma
// 🔁 v7: subdivisão do clube por modalidade. Contém escalões e coordenadores.
model Seccao {
  id         String     @id @default(cuid())
  clubeId    String
  clube      Clube      @relation(fields: [clubeId], references: [id], onDelete: Cascade)
  modalidade Modalidade                 // FUTSAL | FUTEBOL
  nome       String?                    // "Futsal" | "Futebol" | nome custom do clube
  escaloes   Escalao[]
  membros    MembroSeccao[]             // coordenadores e outros com scope de secção
  criadoEm   DateTime   @default(now())

  @@unique([clubeId, modalidade])       // um clube tem no máximo UMA secção por modalidade
  @@index([clubeId])
}

// 🔁 v7: a modalidade de uma secção.
enum Modalidade { FUTSAL FUTEBOL }

// 🔁 v7: vínculo membro↔secção com scope de coordenação (papel de Coordenador de Secção — §6.9).
model MembroSeccao {
  id            String      @id @default(cuid())
  seccaoId      String
  seccao        Seccao      @relation(fields: [seccaoId], references: [id], onDelete: Cascade)
  membroClubeId String
  membroClube   MembroClube @relation(fields: [membroClubeId], references: [id], onDelete: Cascade)
  papel         PapelSeccao @default(COORDENADOR)
  criadoEm      DateTime    @default(now())

  @@unique([seccaoId, membroClubeId])
  @@index([membroClubeId])
}

// 🔁 v7: papel de um membro numa secção (extensível no futuro).
enum PapelSeccao { COORDENADOR }
```

- **Regra (DEVE):** ao criar um `Escalao` numa modalidade que o clube ainda não tem, o sistema cria a `Secção` correspondente na **mesma transação** (idempotente por `@@unique([clubeId, modalidade])`).
- **Regra (DEVE):** apagar uma secção só é permitido se **não tiver escalões** (à semelhança de apagar escalão com participações — secção 8.4). A secção do clube técnico (Individual) não é apagável pela UI.
- **Nome (DEVERIA):** `nome` é opcional; *fallback* de apresentação = rótulo da modalidade ("Futsal"/"Futebol").
- **Backfill (Apêndice C):** para cada clube existente, cria-se **uma secção FUTSAL** e ligam-se-lhe todos os escalões existentes (`Escalao.seccaoId`).

### 3.2 Época, secção, escalão e atleta (🏛️ clube)

> **Alteração estrutural 2026-08-05:** o `Atleta` deixa de estar ligado a uma época/escalão diretamente. Passa a pertencer ao **clube** e a participar em escalões via **`AtletaEscalao`** (relação N-N com histórico). O **número de camisola** passa para a participação.
> **🔁 Alteração v7:** o `Escalão` ganha **`seccaoId`** (pertence a uma secção → a uma modalidade). O `Atleta` é **multi-desporto**: um único atleta pode participar em escalões de secções diferentes (ex.: Benjamins Futsal e Benjamins Futebol).

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
  // 🔁 v7: cada escalão pertence a uma secção (modalidade). Backfill aditivo (Apêndice C).
  seccaoId                 String
  seccao                   Seccao   @relation(fields: [seccaoId], references: [id])
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

  @@index([clubeId])
  @@index([seccaoId])
}

// Atleta pertence ao CLUBE (nível de clube, transversal às épocas E às modalidades — §1.7.3).
model Atleta {
  id                  String    @id @default(cuid())
  clubeId             String
  clube               Clube     @relation(fields: [clubeId], references: [id])
  nome                String
  dataNascimento      DateTime?
  posicoes            Posicao[] // um atleta pode ter VÁRIAS posições (futsal e/ou futebol)
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

  escaloes       AtletaEscalao[]     // participações (N-N com histórico), possivelmente em modalidades diferentes
  presencas      Presenca[]
  convocatorias  Convocatoria[]
  estatisticas   EstatisticaAtleta[]
  progressos     ProgressoHabilidade[]
  consentimentos Consentimento[]

  @@index([clubeId])
  @@index([clubeId, ativo])
}

// Participação de um atleta num escalão numa época (N-N com histórico e transições).
// A MODALIDADE da participação deriva de escalao.seccao.modalidade (não é campo próprio — §1.7.1).
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

// Um atleta tem SEMPRE uma participação PRINCIPAL por época POR MODALIDADE em que atua.
// 🔁 v7: o invariante "principal único" é POR (atleta, época, modalidade) — um atleta pode ter
//   um principal em futsal E um principal em futebol na mesma época (§9). Pode ter N
//   participações adicionais (SIMULTANEA/OCASIONAL). A transição permanente muda o principal.
enum TipoParticipacao { PRINCIPAL SIMULTANEA OCASIONAL }
enum EstadoParticipacao { ATIVO TRANSICAO_PERMANENTE INATIVO }

// 🔁 v7: posições de FUTSAL + FUTEBOL num único enum. GUARDA_REDES e UNIVERSAL são partilhados.
enum Posicao {
  // Partilhados (futsal + futebol)
  GUARDA_REDES
  UNIVERSAL
  // Futsal ⚽
  FIXO
  ALA
  PIVO
  // Futebol 🥅
  DEFESA_CENTRAL
  LATERAL_DIREITO
  LATERAL_ESQUERDO
  MEDIO_DEFENSIVO
  MEDIO_CENTRO
  MEDIO_OFENSIVO
  EXTREMO_DIREITO
  EXTREMO_ESQUERDO
  AVANCADO
}
```

> **🔁 UI de posições (DEVE):** o seletor de posições filtra as opções pela **modalidade da secção** em contexto — futsal mostra {GR, Fixo, Ala, Pivô, Universal}; futebol mostra {GR, Defesa central, Laterais, Médios, Extremos, Avançado, Universal}. Como um atleta multi-desporto pode ter posições de ambas as modalidades, o perfil do atleta guarda todas em `Atleta.posicoes`; cada contexto (jogo/plantel) mostra as relevantes à sua modalidade. Rótulos pt-PT em `LABEL_POSICAO` (secção 12/UI), agrupados por modalidade.

### 3.3 Exercícios, diagramas e bibliotecas (🎒 pessoal / 🏛️ clube)

Cada treinador tem uma **biblioteca pessoal** (portátil, sempre dele). Pode **contribuir deliberadamente** para a **biblioteca do clube** (gesto explícito — toggle na criação). A propriedade (`proprietario`) é **decidida pelo treinador no momento da criação** via toggle — **não** por quem paga a licença (ver secção 4.2): **pessoal** (default) → `TREINADOR`; **clube** → `CLUBE`. `autorId` regista sempre quem criou.

> **🔁 Modalidade do exercício (v7 — DEVE):** um exercício ganha o campo opcional **`modalidade Modalidade?`** para filtragem da biblioteca (futsal vs futebol). Nullable = **genérico** (aplicável a ambas as modalidades — ex.: exercícios físicos, de finalização genérica). O campo do diagrama adapta-se à modalidade do exercício (ou mostra campo neutro se genérico) — secção 11.5. Este campo é **de organização/filtro** (não substitui a derivação por secção quando o exercício é usado numa sessão de um escalão concreto).

```prisma
model Exercicio {
  id             String              @id @default(cuid())
  autorId        String
  autor          Utilizador          @relation(fields: [autorId], references: [id])
  proprietario   PropriedadeConteudo @default(TREINADOR) // CLUBE | TREINADOR (toggle na criação; default pessoal)
  clubeProprietarioId String?        // preenchido quando proprietario = CLUBE (biblioteca do clube)
  modalidade     Modalidade?         // 🔁 v7: FUTSAL | FUTEBOL | null = genérico (ambas)
  nome           String
  descricao      String?
  objetivo       String?
  duracaoMin     Int?
  parteTreino    ParteTreino?        // AQUECIMENTO | PRINCIPAL | JOGO_REDUZIDO | RETORNO_CALMA
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

enum ParteTreino { AQUECIMENTO PRINCIPAL JOGO_REDUZIDO RETORNO_CALMA }
enum PropriedadeConteudo { CLUBE TREINADOR }
enum CategoriaExercicioPrincipal {
  ATAQUE DEFESA TRANSICAO BOLAS_PARADAS FISICO GUARDA_REDES OUTRO
}

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

model PartilhaExercicioClube {
  id          String    @id @default(cuid())
  exercicioId String
  exercicio   Exercicio @relation(fields: [exercicioId], references: [id], onDelete: Cascade)
  clubeId     String
  criadoEm    DateTime  @default(now())

  @@unique([exercicioId, clubeId])
}
```
**Preservação de histórico:** quando um exercício **do treinador** (`proprietario = TREINADOR`) é usado numa sessão do clube, o clube retém um **snapshot só-de-leitura** desse exercício (mecanismo em **4.2.1**; campos `snap*` do `SessaoExercicio`, secção 3.5).

### 3.4 Templates de sessão (🎒 pessoal / 🏛️ clube)

Sessões completas pré-construídas (aquecimento + parte principal + jogo reduzido + retorno à calma), com durações e objetivos. Curadas pela equipa Mister (seed) e criadas pelo treinador/clube. **🔁 v7:** ganham `modalidade Modalidade?` (para separar templates de futsal e de futebol na biblioteca; null = genérico).

```prisma
model ModeloSessao {
  id                  String              @id @default(cuid())
  autorId             String
  autor               Utilizador          @relation(fields: [autorId], references: [id])
  proprietario        PropriedadeConteudo @default(TREINADOR)
  clubeProprietarioId String?
  modalidade          Modalidade?         // 🔁 v7: FUTSAL | FUTEBOL | null = genérico
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

### 3.5 Periodização e treinos (🏛️ clube; metodologia/semana-tipo portátil 🎒)

```prisma
model Planeamento {
  id         String        @id @default(cuid())
  clubeId    String
  escalaoId  String
  epocaId    String
  tipo       TipoPlaneamento // SEMANAL | MENSAL
  periodo    PeriodoEpoca?   // PREPARATORIO | COMPETITIVO | TRANSICAO
  mesociclo  Int?            // ⚠️ campo INTERNO/avançado: escondido por defeito na UI (só perfil avançado)
  microciclo Int?            // ⚠️ numeração INTERNA da semana; a UI mostra sempre "Semana"
  nome       String?         // nome livre da semana formalizada; opcional
  modoSemana ModoSemana?     // ESTRUTURADO (dias MD-X) | TEXTO_LIVRE; só quando formaliza (tipo=SEMANAL)
  notaSemana String?         // campo aberto do modo TEXTO_LIVRE
  dataInicio DateTime
  dataFim    DateTime
  objetivos  String?
  criadoEm   DateTime      @default(now())

  sessoes Sessao[]
}

enum TipoPlaneamento { SEMANAL MENSAL }
enum PeriodoEpoca { PREPARATORIO COMPETITIVO TRANSICAO }
enum ModoSemana { ESTRUTURADO TEXTO_LIVRE }

model Sessao {
  id            String     @id @default(cuid())
  clubeId       String
  escalaoId     String
  epocaId       String
  tipoSessao    TipoSessao @default(NORMAL) // NORMAL liga a periodização; ABERTO/CAPTACAO/EVENTO dispensam
  planeamentoId String?     // Só válido quando tipoSessao == NORMAL (imposto no servidor)
  rpeSessao     Int?        // 1-10: carga percebida da sessão (RPE do treinador) — §8.20
  data          DateTime
  duracaoMin    Int?
  objetivo      String?
  local         String?
  notas         String?  // notas de treino (input para o tracking)
  material      String?
  microciclo    Int?          // ⚠️ INTERNO; a UI mostra "Semana"
  mesociclo     Int?          // ⚠️ INTERNO/avançado (escondido por defeito)
  momentoSemana MomentoSemana? // posição do dia na semana (MD-X); opcional
  periodo       PeriodoEpoca?
  volume        Int?
  googleEventId String?  // sincronização Google Calendar (secção 8.16)
  modalidadeAtividade  Modalidade?  // 🔁 v7: null = herda da secção do escalão; preenchido = actividade pontual noutra modalidade
  criadorId     String
  criadoEm      DateTime @default(now())
  atualizadoEm  DateTime @updatedAt

  exercicios SessaoExercicio[]
  presencas  Presenca[]
  rpesAtletas RpeAtleta[]  // §8.20
}

enum TipoSessao { NORMAL ABERTO CAPTACAO EVENTO }
enum MomentoSemana { MD_MENOS_3 MD_MENOS_2 MD_MENOS_1 MD_MAIS_1 ATIVACAO TAPER LIVRE }

// RPE individual do atleta para uma sessão (1-10) — §8.20.
model RpeAtleta {
  id        String   @id @default(cuid())
  sessaoId  String
  sessao    Sessao   @relation(fields: [sessaoId], references: [id], onDelete: Cascade)
  atletaId  String
  atleta    Atleta   @relation(fields: [atletaId], references: [id], onDelete: Cascade)
  rpe       Int      // 1-10
  createdAt DateTime @default(now())

  @@unique([sessaoId, atletaId])
}

model SessaoExercicio {
  id          String @id @default(cuid())
  sessaoId    String
  exercicioId String
  ordem       Int    @default(0)
  duracaoMin  Int?
  parteTreino ParteTreino?
  notas       String?
  // Snapshot só-de-leitura (mecanismo em 4.2.1). Congela dados de exercícios TREINADOR usados em sessões do clube.
  snapNome      String?
  snapDescricao String?
  snapObjetivo  String?
  snapDiagrama  Json?     // cópia congelada do DiagramaCampo (secção 11)
  snapCriadoEm  DateTime?

  @@unique([sessaoId, ordem])
}

model Presenca {
  id           String         @id @default(cuid())
  sessaoId     String
  atletaId     String
  escalaoId    String          // presenças calculadas POR escalão (atleta pode participar em vários)
  estado       EstadoPresenca  @default(PRESENTE)
  motivo       MotivoFalta?
  justificacao String?

  @@unique([sessaoId, atletaId])
}

enum EstadoPresenca { PRESENTE FALTA FALTA_JUSTIFICADA LESIONADO ATRASADO }
enum MotivoFalta { LESAO DOENCA OUTRO SEM_JUSTIFICACAO }
```

**Semana de trabalho, snapshot e propriedade da periodização:** conforme v6 (decisões 2026-08-16) — a UI usa sempre «Semana» (nunca «Microciclo»); a instância concreta do `Planeamento` é 🏛️ do clube; a **estrutura/metodologia** (semana-tipo) é 🎒 portátil como template. Ver 8.9 e 4.4. (Sem alteração na v7.)

### 3.6 Modelo de jogo e quadro tático (🏛️ clube; metodologia portátil 🎒)

Documento vivo da identidade tática. Por clube/escalão/época = do clube; metodologia genérica portátil (sem escalão/época) = do treinador. Organiza-se por **momento** (org. ofensiva/defensiva, transições, bolas paradas), com princípios/subprincípios + diagrama (editor). **🔁 v7:** como o `ModeloJogo` pode ligar-se a um `escalaoId`, a modalidade deriva do escalão; para modelos portáteis (sem escalão) ganha `modalidade Modalidade?` (null = genérico).

```prisma
model ModeloJogo {
  id           String              @id @default(cuid())
  autorId      String
  autor        Utilizador          @relation(fields: [autorId], references: [id])
  proprietario PropriedadeConteudo @default(CLUBE) // CLUBE (documento da equipa) | TREINADOR (portátil)
  clubeProprietarioId String?
  modalidade   Modalidade?         // 🔁 v7: para modelos portáteis (escalaoId null); senão deriva do escalão
  escalaoId    String?             // null = metodologia genérica portátil
  escalao      Escalao?            @relation("ModeloJogoEscalao", fields: [escalaoId], references: [id], onDelete: SetNull)
  epocaId      String?             // null = portátil
  epoca        Epoca?              @relation("ModeloJogoEpoca", fields: [epocaId], references: [id], onDelete: SetNull)
  nome         String
  momento      MomentoJogo         // ORG_OFENSIVA | ORG_DEFENSIVA | TRANS_OFENSIVA | TRANS_DEFENSIVA | BOLAS_PARADAS
  principios   String?  @db.Text
  subprincipios Json?
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

### 3.7 Competições, jogos, estatísticas, classificação e scouting (🏛️ clube)

> **🔁 Alteração v7:** `Jogo` ganha **`formato FormatoJogo`** e `Competicao` ganha **`formatoJogo FormatoJogo?`** (ver enum). ⚠️ Em `Competicao` o campo chama-se **`formatoJogo`** (não `formato`) para não colidir com o campo já existente `formato FormatoCompeticao` (LIGA/TORNEIO/TACA). `EstatisticaAtleta` ganha o **núcleo estatístico de futebol** (remates, cantos, foras-de-jogo, desarmes). Os campos `Jogo.faltas1aParte`/`faltas2aParte` **só se aplicam a futsal** (ocultos na UI de futebol). O núcleo estatístico é sempre acompanhado das **métricas configuráveis** (`MetricaConfig`) — mesmo princípio nas duas modalidades (secção 10.8).

```prisma
model Competicao {
  id        String       @id @default(cuid())
  clubeId   String
  escalaoId String
  epocaId   String
  nome      String
  tipo      TipoJogo     @default(OFICIAL) // OFICIAL | AMIGAVEL
  formato   FormatoCompeticao @default(LIGA) // LIGA | TORNEIO | TACA
  formatoJogo FormatoJogo?  // 🔁 v7: formato de jogo por defeito da competição (FUTSAL_5 | FUTEBOL_*); NÃO confundir com `formato` (LIGA/TORNEIO/TACA)
  criadoEm  DateTime     @default(now())

  jogos      Jogo[]
  resultados ResultadoCompeticao[] // resultados de outras equipas (para a classificação)
}

enum TipoJogo { OFICIAL AMIGAVEL }
enum CasaFora { CASA FORA }
enum FormatoCompeticao { LIGA TORNEIO TACA }

// 🔁 v7: formato de jogo (nº de jogadores por equipa). Deriva por defeito da modalidade da secção
//   do escalão; guardado no jogo para o editor de campo e a interpretação das estatísticas.
enum FormatoJogo {
  FUTSAL_5      // futsal standard (5×5)
  FUTEBOL_3_3   // petizes
  FUTEBOL_5_5   // traquinas (ou petizes mais velhos)
  FUTEBOL_7     // benjamins/infantis
  FUTEBOL_9     // iniciados/transição
  FUTEBOL_11    // juniores/séniores
}

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
  formato               FormatoJogo? // 🔁 v7: FUTSAL_5 | FUTEBOL_* ; default derivado da secção do escalão
  data                  DateTime
  adversario            String
  casaFora              CasaFora  @default(CASA)
  tipo                  TipoJogo  @default(OFICIAL)
  local                 String?
  golosMarcados         Int?
  golosSofridos         Int?
  faltas1aParte         Int?      // ⚽ futsal: faltas acumuladas na 1ª parte (oculto em futebol)
  faltas2aParte         Int?      // ⚽ futsal: faltas acumuladas na 2ª parte (oculto em futebol)
  relatorio             String?
  videoUrl              String?   // link YouTube (allowlist)
  googleEventId         String?   // sincronização Google Calendar (secção 8.16)
  modalidadeAtividade   Modalidade? // 🔁 v7: null = herda da secção; preenchido = jogo/torneio pontual noutra modalidade
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
  posicaoPrevista Posicao? // para a vista de dia de jogo (posição da modalidade do jogo)
  titularPrevisto Boolean  @default(false)

  @@unique([jogoId, atletaId])
}

model EstatisticaAtleta {
  id              String     @id @default(cuid())
  jogoId          String
  atletaId        String
  utilizacao      Utilizacao @default(NAO_UTILIZADO) // TITULAR | UTILIZADO | NAO_UTILIZADO
  blocoTempo      BlocoTempo? // tempo de jogo por bloco
  minutos         Int?        // aproximado, opcional (derivável do bloco)
  // Núcleo comum (futsal + futebol)
  golos           Int        @default(0)
  assistencias    Int        @default(0)
  defesas         Int?       // GR (ambas as modalidades)
  golosSofridosGR Int?       // GR
  faltasCometidas Int?
  // 🔁 v7 — Núcleo de FUTEBOL 🥅 (nullable; só relevante/preenchido em jogos de futebol)
  remates         Int?
  cantos          Int?
  forasDeJogo     Int?
  desarmes        Int?
  // Métricas configuráveis (ambas as modalidades)
  valoresMetricas ValorMetrica[]

  @@unique([jogoId, atletaId])
}

enum Utilizacao { TITULAR UTILIZADO NAO_UTILIZADO }
enum BlocoTempo { JOGO_COMPLETO MEIA_PARTE BLOCO_10MIN BLOCO_5MIN NAO_JOGOU }

model EventoJogo {
  id                 String        @id @default(cuid())
  jogoId             String
  parte              Int           // 1 | 2
  minuto             Int?
  tipo               TipoEventoJogo
  bloco              BlocoTempo?
  atletaId           String?       // protagonista
  atletaSecundarioId String?       // assistência / substituído
  criadoEm           DateTime      @default(now())
}

// 🔁 v7: tipos de evento comuns + de futebol. Os tipos futsal-específicos e futebol-específicos
//   coexistem; a UI de registo ao vivo mostra o subconjunto relevante à modalidade do jogo.
enum TipoEventoJogo {
  GOLO ASSISTENCIA FALTA CARTAO_AMARELO CARTAO_VERMELHO
  SUBSTITUICAO DEFESA GOLO_SOFRIDO TIMEOUT
  // Futebol 🥅
  REMATE CANTO FORA_DE_JOGO DESARME
}

model MetricaConfig {
  id      String      @id @default(cuid())
  clubeId String
  nome    String
  tipo    TipoMetrica @default(NUMERO) // NUMERO | BOOLEANO | ESCALA
  ativa   Boolean     @default(true)
  ordem   Int         @default(0)
  // 🔁 v7 (DEVERIA): métrica pode ser específica de uma modalidade (só aparece nessa) ou geral.
  modalidade Modalidade? // null = aplica-se às duas modalidades

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

model ObservacaoAdversario {
  id            String   @id @default(cuid())
  clubeId       String
  escalaoId     String?
  jogoId        String?
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

> **🔁 Derivação do formato (DEVE):** ao criar um `Jogo`, o `formato` é **pré-preenchido** a partir da modalidade da secção do escalão (`FUTSAL_5` para futsal; para futebol, o formato por defeito do escalão — configurável, ver Apêndice B) e permanece **editável** (um escalão pode disputar amigáveis noutro formato). O `formato` determina o campo do editor (secção 11.5) e que estatísticas de núcleo são exibidas (secção 10.8).

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
  // 🔁 v7 (DEVERIA): uma habilidade pode ser específica de uma modalidade ou transversal.
  modalidade Modalidade?    // null = transversal (aplica-se às duas)
  criadoEm  DateTime        @default(now())

  progressos ProgressoHabilidade[]
}

enum NivelHabilidade { BASICO INTERMEDIO AVANCADO }

model ProgressoHabilidade {
  id              String           @id @default(cuid())
  atletaId        String
  habilidadeId    String
  epocaId         String
  estado          EstadoHabilidade @default(NAO_INICIADO)
  dataDesbloqueio DateTime?
  notas           String?

  @@unique([atletaId, habilidadeId, epocaId])
}

enum EstadoHabilidade { NAO_INICIADO EM_PROGRESSO DESBLOQUEADO }
```

### 3.9 Reuniões e comunicação (🏛️ clube)
Sem alteração de modelo na v7. `Reuniao` (com `ambito CLUBE | ESCALAO`, `googleEventId`, criador `SetNull`), `ModeloComunicacao` (7 tipos, globais via `clubeId = null` + variante do clube), placeholders `{{campo}}` e `gerarTextoComunicacao` — conforme v6 §3.9. (Os placeholders de `RESULTADO`/`CONVOCATORIA` são agnósticos à modalidade; ver 8.12.)

### 3.10 Relatório de época partilhável (🏛️ clube)
Sem alteração de modelo na v7. `RelatorioPartilhado` (`token @unique`, `tipo TipoRelatorio`, `dadosSnapshot Json?` imutável, `expiraEm?`) — conforme v6 §3.10. O snapshot passa a poder conter dados segmentados por modalidade (secção 10.8), mas o modelo é o mesmo.

### 3.11 Licenciamento, subscrição e carteira
Modelo desenhado para suportar Paddle (billing deferido). O enforcement de licença (bloqueio pós-expiração) e o billing são **deferidos**; a arquitetura de dados fica pronta. **🔁 v7:** `Licenca` ganha os campos multi-secção necessários ao pricing por secção (secção 17.1) e o registo da modalidade Individual.

```prisma
// Licença ativa de um utilizador (Individual) OU de um clube (Clube).
// Um titular tem no máximo uma ativa (utilizadorId @unique OU clubeId @unique).
model Licenca {
  id            String         @id @default(cuid())
  tipo          TipoLicenca    // INDIVIDUAL | CLUBE
  tier          TierClube?     // só se tipo=CLUBE: PEQUENO | MEDIO | GRANDE | PARCEIRO
  estado        EstadoLicenca  @default(ATIVA) // ATIVA | EXPIRADA | CANCELADA | SUSPENSA
  ciclo         CicloFaturacao // MENSAL | ANUAL
  precoCentimos Int?           // preço praticado (cêntimos) — já com acréscimo multi-secção

  // 🔁 v7 — Individual: modalidade contratada (futsal ou futebol). null em licenças de Clube.
  modalidade    Modalidade?    // registo explícito do produto Individual vendido (§17.1)
  // 🔁 v7 — Clube: nº de secções faturadas (pricing por secção — §17.1: tier mais caro + 50%/secção adicional).
  numSeccoes    Int            @default(1) // 1 = comportamento v6; >1 aplica acréscimo por secção adicional

  // Titular (exatamente um dos dois preenchido)
  utilizadorId String?     @unique
  utilizador   Utilizador? @relation("LicencaIndividual", fields: [utilizadorId], references: [id])
  clubeId      String?     @unique
  clube        Clube?      @relation("LicencaClube", fields: [clubeId], references: [id])

  // Datas
  dataInicio    DateTime  @default(now())
  dataRenovacao DateTime?
  dataFim       DateTime?

  // Integração Paddle (futura)
  paddleSubscriptionId String?
  paddleCustomerId     String?

  criadoEm     DateTime @default(now())
  atualizadoEm DateTime @updatedAt
}

enum TipoLicenca { INDIVIDUAL CLUBE }
enum TierClube { PEQUENO MEDIO GRANDE PARCEIRO }
enum EstadoLicenca { ATIVA EXPIRADA CANCELADA SUSPENSA }
enum CicloFaturacao { MENSAL ANUAL }

// Carteira (wallet) do treinador — crédito de absorção usado em compras futuras.
model Carteira {
  id            String     @id @default(cuid())
  utilizadorId  String     @unique
  utilizador    Utilizador @relation(fields: [utilizadorId], references: [id], onDelete: Cascade)
  saldoCentimos Int        @default(0)
  atualizadoEm  DateTime   @updatedAt

  movimentos MovimentoCarteira[]
}

model MovimentoCarteira {
  id            String        @id @default(cuid())
  carteiraId    String
  carteira      Carteira      @relation(fields: [carteiraId], references: [id], onDelete: Cascade)
  tipo          TipoMovimento // CREDITO_ABSORCAO | DEBITO_COMPRA | REEMBOLSO | AJUSTE
  valorCentimos Int           // positivo = crédito; negativo = débito
  descricao     String
  criadoEm      DateTime      @default(now())

  @@index([carteiraId])
}

enum TipoMovimento { CREDITO_ABSORCAO DEBITO_COMPRA REEMBOLSO AJUSTE }
```

> **🔁 v7 — modalidade na licença Individual (DEVERIA):** a licença Individual regista a **modalidade contratada** em `Licenca.modalidade` (a secção única do clube técnico determina-a; o campo torna explícito o produto vendido). A licença de Clube **não** fixa modalidade (o clube tem as secções que tiver); o pricing escala por secção via `numSeccoes` (secção 17.1). ⚠️ decidir na implementação se `Licenca.modalidade` é a fonte de verdade ou derivado da secção do clube técnico.

### 3.12 Integração com calendário externo (Google Calendar)
Sem alteração na v7. `IntegracaoCalendario` (OAuth Google, `refreshToken` encriptado at-rest), `googleEventId` em `Sessao`/`Jogo`/`Reuniao` — conforme v6 §3.12.

### 3.13 Portfólio e histórico de carreira do treinador (🎒 portátil)
Sem alteração de estrutura na v7. `RegistoCarreira` — conforme v6 §3.13. **🔁 (DEVERIA):** o campo textual `escalao`/notas pode indicar a modalidade (ex.: "Sub-15 Futebol"); nenhum campo novo é obrigatório.

### 3.14 RGPD — consentimento de menores
Sem alteração na v7. `Consentimento` (`DADOS`/`IMAGEM`, `@@unique([atletaId, tipo])`) — conforme v6 §3.14. Como o atleta é único por pessoa, o consentimento é **por atleta** (cobre todas as modalidades em que participa).

### 3.15 Lembretes e tarefas (🏛️ contexto do clube)
Sem alteração de modelo na v7. `Lembrete` + `LembreteDestinatario` (âmbito PESSOAL/EQUIPA) — conforme v6 §3.15.

### 3.16 Cards sociais para Instagram (🏛️ clube)
Sem alteração de arquitetura na v7. Geração server-side (`next/og`, rota `GET /api/social/card`, token HMAC) dos cards `resultado`/`mvp`/`ranking` com RGPD (bloqueio de formação jovem ≤ sub-14) — conforme v6 §3.16. **🔁 (DEVERIA):** os cards refletem a modalidade do jogo/escalão (ex.: card de resultado de um jogo de futebol usa o formato correto); a lógica de RGPD (bloqueio de menores) é **idêntica** nas duas modalidades.

## 4. Propriedade e portabilidade de dados

### 4.1 Princípio
Há três tipos de dados:
- **Operacionais/competitivos** → sempre do **clube** (ficam quando o treinador sai): atletas e participações, jogos, estatísticas, eventos, presenças, convocatórias, caderneta, **secções**, escalões, épocas, competições, classificações, reuniões, comunicação, scouting, consentimentos.
- **Conteúdo metodológico** (exercícios, templates de sessão, modelos de jogo) → a propriedade é **decidida pelo treinador no momento da criação** (toggle pessoal vs clube), **não** por quem paga a licença (ver 4.2). Cada treinador tem sempre uma **biblioteca pessoal** (portátil); a **biblioteca do clube** representa a filosofia/identidade do clube.
- **Histórico de carreira** (`RegistoCarreira`) e **carteira** (`Carteira`) → sempre do **treinador** (viajam com ele).

> **🔁 v7:** a **Secção** é um dado **operacional do clube** (🏛️): fica no clube quando o treinador sai. O conteúdo metodológico portátil (🎒) do treinador **atravessa modalidades** — se ele criou exercícios de futebol, leva-os consigo tal como os de futsal; a marca `Exercicio.modalidade` viaja com o conteúdo.

### 4.2 Propriedade do conteúdo metodológico — decidida pelo treinador (decisão definitiva 2026-08-05)
> **Esta decisão substitui qualquer decisão anterior em contrário.** O pagamento da licença de clube **NÃO** transfere a propriedade do trabalho criativo do treinador.

- **Biblioteca pessoal = SEMPRE do treinador**, independentemente de quem paga a licença. Leva-a consigo para qualquer clube ao longo de toda a carreira (**futsal e futebol**).
- **Biblioteca do clube = filosofia e identidade do clube.** Fica no clube quando um treinador sai.
- **Toggle na criação (mantém-se):** o treinador escolhe **pessoal** (default) ou **clube**.

| Escolha do treinador na criação | `proprietario` | Ao sair do clube |
|---|---|---|
| **Biblioteca pessoal** (default) | `TREINADOR` | Viaja com ele |
| **Biblioteca do clube** (toggle explícito) | `CLUBE` | Fica no clube |

- `autorId` regista **sempre** quem criou.
- Conteúdo `CLUBE`: ligado a `clubeProprietarioId`.
- Conteúdo `TREINADOR`: viaja com o autor; se foi usado em sessões do clube, o clube mantém um **snapshot só-de-leitura** (4.2.1).

#### 4.2.1 Mecanismo de snapshot (especificação — decisão 2026-08-16)
O snapshot é **obrigatório**. Ao **adicionar** um exercício portátil (`proprietario = TREINADOR`) a uma **sessão do clube**, o sistema cria **automaticamente** uma cópia congelada (nome, descrição, objetivo, diagrama) nos campos `snap*` do `SessaoExercicio` (secção 3.5). É **imutável** e **pertence ao clube**; o master editável fica com o treinador. Exercícios `proprietario = CLUBE` **não** geram snapshot. Aplica-se igualmente a exercícios de futsal e de futebol.

### 4.3 Uma adesão ativa de cada vez
Um utilizador tem **no máximo uma adesão de clube ativa** (que pode ser o clube técnico no modo Individual). Ao mudar de clube, a adesão anterior passa a `INATIVO` (histórico) e o conteúdo `TREINADOR` acompanha-o.

### 4.4 Tabela definitiva de propriedade e portabilidade (decisão 2026-08-16)
A coluna **«Porta com o treinador?»** indica se o treinador **retém uma cópia/registo** ao sair, **independentemente** de a propriedade ficar no clube.

| Dado | Proprietário | Porta com o treinador? |
|---|---|---|
| Nome dos atletas | 🏛️ CLUBE | ✅ Sim — nome é informação não-sensível |
| Foto do atleta | 🏛️ CLUBE | ❌ Não |
| Contacto/email do encarregado de educação | 🏛️ CLUBE | ❌ Não |
| Resultados de jogos (marcador, adversário) | 🏛️ CLUBE | ✅ Sim — o treinador dirigiu os jogos |
| Relatórios de sessões (estrutura, exercícios usados) | 🎒 TREINADOR | ✅ Sim |
| Estatísticas individuais de atletas (golos, cartões, RPE, remates, desarmes…) | 🏛️ CLUBE | ❌ Não |
| Caderneta de habilidades dos atletas | 🏛️ CLUBE | ❌ Não |
| Exercícios criados pelo treinador (futsal **e** futebol) | 🎒 TREINADOR (toggle) | ✅ Sim (se `proprietario = TREINADOR`) |
| Modelos táticos criados pelo treinador | 🎒 TREINADOR (toggle) | ✅ Sim (se `proprietario = TREINADOR`) |
| Planeamentos / semanas criadas pelo treinador | 🎒 TREINADOR | ✅ Sim — como templates (semana-tipo) |
| Planeamentos definidos pelo clube/DT | 🏛️ CLUBE | ❌ Não |
| **Secção** (modalidade) | 🏛️ CLUBE | ❌ Não |
| Menores (Sub-10, Sub-12, …) | — | ✅ Mesma regra que acima |

**Notas:** os dados operacionais das sessões (presenças, datas, RPE) permanecem 🏛️; o **snapshot** (4.2.1) é o mecanismo que permite ao clube manter o histórico completo depois de o treinador levar os seus exercícios portáteis.

---

## 5. Contas, autenticação, adesão a clube e RGPD

### 5.1 Autenticação
- **Auth.js v5** com provider **Credentials** (email + password). Sem OAuth no núcleo. *(A integração Google Calendar usa OAuth Google, distinta do login.)*
- Password: mínimo 8 caracteres; hash **bcrypt (custo 12)**; nunca em logs.
- Sessão **JWT** (`maxAge` 7 dias). **Uma sessão ativa por conta**.
- Gestão de password: alteração pelo próprio (exige atual); reposição por membro com `CLUBE_UTILIZADORES`. Recuperação por email é **FUTURO**.

> **🔒 Regra sagrada de auth:** nenhuma alteração multi-desporto toca em login/autenticação. A modalidade é resolvida **depois** da autenticação, no contexto de clube/secção. As fases 25–30 (secção 16) **não** alteram `middleware.ts`, `lib/auth.ts`, cookies de sessão ou o SDK de identidade.

### 5.2 Contas e modos (o "2 em 1" multi-tenant)
- O **`Utilizador` existe por si**. Ao registar-se/comprar licença Individual, é criado um **clube técnico** invisível (`clubeTecnico=true`) com o utilizador como Administrador único. O portfólio 🎒 vive nesse contexto.
- **🔁 v7:** a compra Individual escolhe a **modalidade** (futsal ou futebol); cria-se **uma secção** dessa modalidade no clube técnico (secção 8.1.1). O modo Individual tem sempre **exatamente uma secção**.
- **Modo Individual:** sem UI de gestão de clube, membros, perfis, branding, escalões partilhados **nem seletor de secção** (só há uma).
- **Criar/aderir a clube real:** um utilizador pode criar um `Clube` (torna-se Administrador; geram-se perfis de arranque) **ou** aceitar um convite (5.3).
- **Uma adesão ATIVA de cada vez** (4.3).

> **⚠️ Impacto de modelação (2026-08-05):** o modo Individual tem **sempre** um clube técnico em contexto — elimina o caso "sem clube". `obterMembroAtual()` nunca devolve `null` por ausência de clube.

### 5.3 Transição de clube e absorção
- **Sair do clube real:** `MembroClube` → `INATIVO`. Conteúdo `TREINADOR` viaja; conteúdo `CLUBE`, **secções** e **snapshots** ficam. `RegistoCarreira` consolidado. O treinador reativa a licença Individual por conta própria.
- **Aderir a novo clube (absorção):** nova `MembroClube` ativa. Se tinha licença Individual paga, o tempo restante converte-se em crédito (`CREDITO_ABSORCAO`). Reembolso real só por pedido manual. O clube paga o preço normal.
- **Proteção:** um clube real **nunca pode ficar sem Administrador** (6.8).

### 5.4 Contexto de sessão
Toda a operação corre num contexto resolvido no servidor:
- **Utilizador atual** — `obterUtilizadorAtual()`.
- **Membro/clube ativo** — `obterMembroAtual()` devolve `{ clube, perfil, capacidadesEfetivas, escalõesAtribuidos, seccoesCoordenadas, ambito }` (sempre existe). **🔁 v7:** inclui as secções coordenadas.
- **Época ativa** — `obterEpocaAtiva()` (cookie `epoca_ativa` validado contra o clube).
- **Secção selecionada** — 🔁 **(novo v7)** parâmetro de UI (quando o clube tem >1 secção), nunca fonte de autorização por si só.
- **Escalão selecionado** — parâmetro de UI (tabs).

### 5.5 RGPD (dados de menores)
> **Estado atual (2026-08-02):** consentimento parental recolhido pelo clube na inscrição, fora da app.
- **Minimização:** recolher apenas o necessário (nome, data de nascimento, posições, número, observações, encarregado de educação). Um atleta multi-desporto **não** duplica dados pessoais (secção 1.7.3) — minimização reforçada.
- **Consentimento parental** (`Consentimento`, `DADOS`/`IMAGEM`): por atleta (cobre todas as modalidades).
- **Direito ao esquecimento:** soft-delete por defeito; hard-delete a pedido (estatísticas anonimizáveis) — apaga participações em **todas** as secções.
- **Portabilidade:** exportação dos dados do educando em PDF/estruturado, a pedido.

### 5.6 Segurança geral
- Todas as Server Actions verificam **autenticação** e **capacidade/âmbito** antes de operar.
- **Validação server-side obrigatória** (Zod).
- Todas as queries filtram por **clube** + (quando aplicável) **época** + **âmbito** (+ **secção**, quando relevante).
- Segredos só em `.env`. HTTPS. Ficheiros do Supabase Storage com URLs não-adivinháveis. Tokens de integração e `RelatorioPartilhado.token` não-adivinháveis.

---

## 6. Papéis e permissões configuráveis

### 6.1 Modelo
Um **`Perfil`** = `nome` + `ambito` (`TODO_CLUBE` | **`SECCAO`** | `PROPRIOS_ESCALOES`) + **lista de capacidades**. Perfis são **por clube** e **totalmente configuráveis**. Ao criar o clube geram-se **modelos de arranque editáveis** (Administrador, Diretor Técnico, **Coordenador de Secção**, Treinador Principal, Adjunto).

**Hierarquia base:** Admin → Diretor Técnico → **Coordenador de Secção** → Treinador (Principal/Adjunto).

### 6.2 Catálogo de capacidades
Chaves usadas em `Perfil.capacidades` e nos overrides de membro:

**Estrutura do clube (sempre a todo o clube):**
- `CLUBE_BRANDING` — editar cores e logótipo.
- `CLUBE_SECCOES` — 🔁 **(novo v7)** criar/editar/apagar **secções** e atribuir coordenadores.
- `CLUBE_ESCALOES` — criar/editar/apagar escalões e visibilidade.
- `CLUBE_EPOCAS` — criar épocas e definir a ativa.
- `CLUBE_UTILIZADORES` — convidar/gerir membros, repor passwords, overrides.
- `CLUBE_PERFIS` — criar/editar perfis e atribuir.
- `CATALOGO_METRICAS` — gerir métricas configuráveis.
- `CATALOGO_HABILIDADES` — gerir o catálogo de habilidades.
- `FATURACAO_GERIR` — **FUTURO** (billing/subscrição; só o Admin).

**Secção (âmbito `SECCAO`) — 🔁 novo v7:**
- `SECCAO_ESCALOES_GERIR` — criar/editar/apagar escalões e definir visibilidade **dentro da(s) secção(ões) coordenada(s)** (`MembroSeccao`). É a capacidade dedicada do Coordenador de Secção para gerir os escalões da sua modalidade, sem conceder o `CLUBE_ESCALOES` (que é sempre de nível clube). Não permite gerir escalões de outras secções.

**Dados de equipa (conforme o `ambito`):**
- `PLANTEL_GERIR` · `PROMOVER_ATLETAS` · `TREINOS_GERIR` · `PRESENCAS_MARCAR` · `PERIODIZACAO_GERIR` · `MODELO_JOGO_GERIR` · `JOGOS_GERIR` (variante `gerir_jogos_todos` = âmbito `TODO_CLUBE`) · `CONVOCATORIA_GERIR` · `ESTATISTICAS_GERIR` · `COMPETICOES_GERIR` · `SCOUTING_GERIR` · `CADERNETA_GERIR` · `REUNIOES_GERIR` · `COMUNICACOES_GERIR` · `LEMBRETES_EQUIPA_GERIR` · `EXERCICIOS_GERIR` · `RELATORIOS_VER`.

*(Os lembretes **pessoais** não exigem capacidade — qualquer membro autenticado os cria para si.)*

### 6.3 Âmbito
- `TODO_CLUBE`: as capacidades de dados de equipa aplicam-se a **todos os escalões de todas as secções**.
- **`SECCAO`** — 🔁 **(novo v7):** aplicam-se a **todos os escalões da(s) secção(ões)** atribuídas ao membro (`MembroSeccao`).
- `PROPRIOS_ESCALOES`: aplicam-se **apenas aos escalões atribuídos** (`AtribuicaoEscalao`).
- As capacidades de estrutura (`CLUBE_*`, `CATALOGO_*`, `FATURACAO_GERIR`) são **sempre de nível clube** (não são restringíveis a uma secção — em particular, `CLUBE_ESCALOES` é sempre de nível clube).
- 🔁 **(novo v7):** a gestão de escalões **dentro de uma secção** faz-se pela capacidade dedicada **`SECCAO_ESCALOES_GERIR`** (âmbito `SECCAO`), **não** por um `CLUBE_ESCALOES` restringido. Isto elimina a ambiguidade: quem gere escalões de todo o clube tem `CLUBE_ESCALOES`; quem gere apenas os da sua secção tem `SECCAO_ESCALOES_GERIR`.

### 6.4 Overrides por membro (decisão 2026-08-05)
Além do perfil base, o Admin (com `CLUBE_UTILIZADORES`) pode **conceder** (`capacidadesExtra`) ou **revogar** (`capacidadesRevogadas`) capacidades a um membro.

**Capacidades efetivas** = `(perfil.capacidades ∪ capacidadesExtra) \ capacidadesRevogadas`.

- **Regra de delegação (DEVE):** um membro só concede capacidades **iguais ou inferiores às próprias**.
- **Visibilidade configurável (DEVE):** o Admin pode restringir DT/Coordenador a um subconjunto de escalões/secções. ⚠️ decidir na implementação se a restrição usa âmbito+atribuições ou capacidade dedicada.

### 6.5 Leitura de escalões alheios
Um membro pode **ler** um escalão que não é seu **se** `Escalao.visivelOutrosTreinadores = true`. A escrita continua a exigir capacidade + âmbito. **🔁 v7:** um Coordenador de Secção lê por defeito todos os escalões da sua secção; a leitura **fora da secção** continua a depender de `visivelOutrosTreinadores`.

### 6.6 Modelos de arranque (defaults editáveis)
- **Administrador** — `TODO_CLUBE`, **todas** as capacidades (exceto `FATURACAO_GERIR`, FUTURO), incluindo `CLUBE_SECCOES`.
- **Diretor Técnico** — `TODO_CLUBE`, todas as capacidades de **dados de equipa** + `CATALOGO_*` + `RELATORIOS_VER` + `CLUBE_SECCOES` (para organizar as secções). **NÃO** gere billing nem estrutura da conta (`CLUBE_*` de conta desligadas por defeito, exceto secções/escalões conforme configuração).
- **Coordenador de Secção** — 🔁 **(novo v7):** `SECCAO`, todas as capacidades de **dados de equipa** dos escalões da(s) sua(s) secção(ões) + `EXERCICIOS_GERIR` + `RELATORIOS_VER` + `COMUNICACOES_GERIR` + `PROMOVER_ATLETAS` (dentro da secção) + **`SECCAO_ESCALOES_GERIR`** (gestão de escalões da sua secção — ver 6.9). **NÃO** tem `CLUBE_ESCALOES` (nível clube) e **NÃO** gere billing, branding, perfis, épocas nem outras secções.
- **Treinador Principal** — `PROPRIOS_ESCALOES`, capacidades de dados de equipa dos seus escalões + `EXERCICIOS_GERIR` + `RELATORIOS_VER` + `COMUNICACOES_GERIR`. `PROMOVER_ATLETAS` desligada por defeito.
- **Adjunto** — `PROPRIOS_ESCALOES`, capacidades operacionais (`TREINOS_GERIR`, `PRESENCAS_MARCAR`, `ESTATISTICAS_GERIR`, `CADERNETA_GERIR`, `EXERCICIOS_GERIR`).

### 6.7 Verificação (algoritmo de autorização)
Helper `exigirCapacidade(cap, escalaoId?)`:
1. Há utilizador autenticado? senão → `erro("Não autenticado")`.
2. Há adesão ativa (clube real ou técnico)? senão → `erro("Sem acesso a este clube")`.
3. As **capacidades efetivas** (6.4) incluem `cap`? senão → `erro("Sem permissão")`.
4. Se `cap` é de dados de equipa:
   - âmbito `TODO_CLUBE` → permitido em qualquer escalão;
   - **âmbito `SECCAO`** → o escalão-alvo pertence a uma secção atribuída (`escalao.seccaoId ∈ seccoesCoordenadas`)? senão → `erro("Sem permissão nesta secção")`;
   - âmbito `PROPRIOS_ESCALOES` → o escalão-alvo está nos atribuídos? senão → `erro("Sem permissão neste escalão")`.
5. Para **leitura** de escalão alheio: permitido se `visivelOutrosTreinadores` (ou se pertence à secção coordenada).

### 6.8 Regras de proteção
- O **Administrador** tem sempre todas as capacidades; `capacidadesRevogadas` não se aplica ao último admin.
- Um clube real **nunca fica sem Administrador**.
- Um perfil **em uso** não se apaga sem reatribuir os membros.
- **Delegação (6.4):** atribuir/conceder só capacidades ≤ às próprias.
- **🔁 v7:** apagar uma **secção** exige que não tenha escalões; remover um coordenador de secção não afeta os dados da secção.

### 6.9 Coordenador de Secção — 🔁 novo v7
> Papel desenhado para clubes multi-desporto (ou com secções grandes) que querem delegar a gestão de **uma modalidade** sem dar acesso ao resto do clube.

- **Scope:** vê e gere **todos os escalões da(s) sua(s) secção(ões)** (`MembroSeccao`), como um "DT da secção". **Não** vê os escalões de outras secções (a menos que `visivelOutrosTreinadores`).
- **Âmbito `SECCAO`:** as capacidades de dados de equipa aplicam-se a todos os escalões cujo `escalao.seccaoId` esteja nas suas secções coordenadas.
- **Atribuição:** feita por quem tem `CLUBE_SECCOES` (Admin/DT) — cria-se um `MembroSeccao` ligando o membro à secção com `papel = COORDENADOR`.
- **Gestão de escalões dentro da secção (DEVE):** um Coordenador pode criar/editar/apagar escalões **da sua secção** (não de outras) através da capacidade dedicada **`SECCAO_ESCALOES_GERIR`** (âmbito `SECCAO`) — **não** através de `CLUBE_ESCALOES` (que é sempre de nível clube). Decisão fechada (fase 25): a gestão de escalões por secção usa `SECCAO_ESCALOES_GERIR`, resolvida por `exigirCapacidade` contra `escalao.seccaoId ∈ seccoesCoordenadas`.
- **Coordenação de múltiplas secções (DEVE):** uma pessoa pode ter `MembroSeccao` em **mais do que uma secção** (ex.: um coordenador que acumula futsal **e** futebol). É **raro, mas válido** — `seccoesCoordenadas` é uma lista e o âmbito `SECCAO` aplica-se a todos os escalões de **todas** as secções coordenadas por esse membro.
- **Analytics:** vê o analítico da **sua secção** (nível de secção — secção 10.3/10.8) e dos seus escalões; não vê o analítico transversal de todo o clube por defeito (configurável pelo Admin via override `RELATORIOS_VER` de âmbito).
- **Regra de delegação:** um Coordenador só concede a outros capacidades ≤ às próprias e **só dentro da sua secção**.

---

## 7. Server Actions

Sem REST (exceto o handler do Auth.js e, futuramente, o webhook do Paddle e o callback OAuth do Google Calendar). Todas as actions começam com `"use server"`, vivem em `lib/actions/`, e devolvem `Resultado<T>`.

### 7.1 Padrão obrigatório de cada action
1. Validar input com **Zod** (`lib/schemas/`).
2. Resolver contexto: `obterMembroAtual()`.
3. **`exigirCapacidade(cap, escalaoId?)`** (secção 6.7) — inclui âmbito `SECCAO`.
4. Quando aplicável, `obterEpocaAtiva()`.
5. **🔁 v7:** quando a operação depende da modalidade, **derivar a modalidade** da secção do escalão (`escalao.seccao.modalidade`) — nunca receber a modalidade do cliente como fonte de verdade.
6. Operar (Prisma), **filtrando sempre por clube + época + âmbito** (+ secção quando aplicável).
7. `revalidatePath()` das rotas afetadas.
8. Devolver `Resultado<T>`.

### 7.2 Helpers de contexto (`lib/`)
- `obterUtilizadorAtual(): Promise<Utilizador | null>`
- `obterMembroAtual()` — **sempre não-nulo** para autenticado; devolve também `seccoesCoordenadas: string[]` (🔁 v7).
- `capacidadesEfetivas(membro): string[]` — aplica overrides (6.4).
- `obterEpocaAtiva(): Promise<Epoca | null>`
- `exigirCapacidade(cap, escalaoId?)` — resolve âmbito `TODO_CLUBE`/`SECCAO`/`PROPRIOS_ESCALOES`.
- `podeLerEscalao(escalaoId): Promise<boolean>` — inclui a regra de secção coordenada.
- **🔁 v7:** `obterSeccaoAtual()` / `escaloesDaSeccao(seccaoId)` / `modalidadeDoEscalao(escalaoId): Promise<Modalidade>`.

### 7.3 Assinaturas por módulo (referência; validadas por Zod; devolvem `Resultado<T>`)

**Contas, clube e licença** (`contas.ts`, `clubes.ts`, `licenca.ts`)
```
registar(dados) // cria Utilizador + clube técnico + Secção (modalidade escolhida) + Carteira
iniciarSessao(dados), terminarSessao(), alterarMinhaPassword(dados)
criarClube(dados) // clube real: criador=Administrador + perfis de arranque
atualizarBrandingClube(dados) // CLUBE_BRANDING
obterClubeAtivo()
obterLicencaAtual(), simularAbsorcao(utilizadorId), aplicarCreditoAbsorcao(utilizadorId)
obterCarteira(), listarMovimentosCarteira()
```

**Secções** (`seccoes.ts`) — 🔁 novo v7 — `CLUBE_SECCOES`
```
listarSeccoes()                                   // secções do clube (com contagem de escalões)
criarSeccao({ modalidade, nome? })                // idempotente por (clubeId, modalidade)
atualizarSeccao(id, { nome })
apagarSeccao(id)                                  // bloqueado se tiver escalões
atribuirCoordenador(seccaoId, membroClubeId)      // cria MembroSeccao (papel COORDENADOR)
removerCoordenador(seccaoId, membroClubeId)
garantirSeccaoParaModalidade(modalidade)          // helper: cria a secção se não existir (usado ao criar escalão)
```

**Membros e perfis** (`membros.ts`, `perfis.ts`) — `CLUBE_UTILIZADORES` / `CLUBE_PERFIS`
```
convidarMembro(email, perfilId), removerMembro(id), sairDoClube()
atribuirPerfil(membroId, perfilId), atribuirEscaloes(membroId, escalaoIds[])
atribuirSeccoes(membroId, seccaoIds[])            // 🔁 v7: scope de secção (Coordenador)
definirOverrides(membroId, extra[], revogadas[])  // 6.4 (respeita delegação)
redefinirPasswordMembro(membroId, novaPassword), listarMembros()
criarPerfil/atualizarPerfil/apagarPerfil/listarPerfis
```

**Escalões / Épocas / Catálogos** — `CLUBE_ESCALOES` / `CLUBE_EPOCAS` / `CATALOGO_*`
```
criarEscalao({ nome, seccaoId?, modalidade?, ... }) // 🔁 v7: cria/garante a Secção da modalidade e liga o escalão
atualizarEscalao/apagarEscalao/moverEscalao/listarEscaloes(seccaoId?)/definirVisibilidadeEscalao
criarEpoca/listarEpocas/definirEpocaAtiva/selecionarEpoca
criarMetrica({ ..., modalidade? })/listarMetricas(modalidade?)/alternarMetrica/moverMetrica
criarHabilidade({ ..., modalidade? })/atualizarHabilidade/apagarHabilidade/moverHabilidade/listarHabilidades(modalidade?)
```
> **🔁 `criarEscalao` (DEVE):** recebe `seccaoId` **ou** `modalidade`. Com `modalidade`, chama `garantirSeccaoParaModalidade` (cria a secção se ainda não existir — onboarding transparente, secção 8.1.1) e liga o escalão. Com `seccaoId`, valida que a secção pertence ao clube.
> **🔁 Bloqueio Individual = uma modalidade (DEVE):** se o clube for técnico Individual (`Clube.clubeTecnico && Licenca.tipo == INDIVIDUAL`), rejeitar com erro de validação se já existe uma `Secção` de modalidade diferente. O helper `garantirSeccaoParaModalidade` verifica esta condição antes de criar (mensagem sugere a licença de Clube — §17.1).

**Plantel e participações** (`atletas.ts`, `participacoes.ts`) — `PLANTEL_GERIR`, `PROMOVER_ATLETAS`
```
criarAtleta/atualizarAtleta/apagarAtleta(soft)/apagarAtletaDefinitivamente/obterAtleta
listarAtletas(escalaoId?, epocaId?) // por participação ativa
criarAtletasEmMassa(lista[{nome, numero}]) // onboarding
associarAEscalao(atletaId, escalaoId, tipo, numero) // PLANTEL_GERIR no escalão (invariante principal por modalidade — §9)
transferirEscalao(atletaId, deEscalao, paraEscalao, permanente?)
terminarParticipacao(atletaEscalaoId)
obterEstatisticasAtleta(id, escalaoId?)  // por escalão/modalidade + vista conjunta segmentada
obterCarreiraAtleta(id)                   // percurso (inclui modalidade via secção)
registarConsentimento(atletaId, tipo, dados)
```

**Exercícios e templates de sessão** (`exercicios.ts`, `templatesSessao.ts`) — `EXERCICIOS_GERIR`
```
criarExercicio({ ..., modalidade? })/atualizarExercicio/apagarExercicio/obterExercicio
listarExercicios(parteTreino?, categoria?, modalidade?, q?) // biblioteca pessoal + clube
partilharExercicioNoClube/removerPartilhaNoClube/instalarBibliotecaArranque(modalidade?)
criarModeloSessao({ ..., modalidade? })/atualizarModeloSessao/apagarModeloSessao/listarModelosSessao(escalaoAlvo?, modalidade?)/obterModeloSessao(id)
partilharModeloSessaoNoClube(id), criarSessaoDeTemplate({modeloSessaoId, escalaoId, data, epocaId?})
instalarTemplatesArranque(modalidade?)
```

**Treinos e periodização** (`treinos.ts`, `periodizacao.ts`) — `TREINOS_GERIR` / `PERIODIZACAO_GERIR` / `PRESENCAS_MARCAR`
```
criarSessao/atualizarSessao/apagarSessao/obterSessao/listarSessoes(escalaoId?)
adicionarExercicioSessao/removerExercicioSessao/reordenarExercicios
marcarPresencas(sessaoId, presencas[]) // upsert em lote; inclui motivo de falta
criarPlaneamento/atualizarPlaneamento/apagarPlaneamento/listarPlaneamentos/sugerirPlaneamento
registarRpeSessao(sessaoId, rpe)/registarRpeAtleta(sessaoId, atletaId, rpe)/obterCargaSemanal(escalaoId)
```

**Modelo de jogo / quadro tático** (`modeloJogo.ts`) — `MODELO_JOGO_GERIR`
```
criarModeloJogo({ ..., modalidade? })/atualizarModeloJogo/apagarModeloJogo/obterModeloJogo
listarModelosJogo(escalaoId?, momento?, modalidade?) // portáteis (escalaoId=null) sempre incluídos
criarQuadroTatico(jogoId, dados)/atualizarQuadroTatico/apagarQuadroTatico/listarQuadrosTaticos(jogoId, tipo?)
```

**Jogos, competições, estatísticas, scouting** (`jogos.ts`, `competicoes.ts`, `scouting.ts`)
```
criarJogo({ ..., formato? })/atualizarJogo/apagarJogo/obterJogo/listarJogos(escalaoId?)   // formato derivado da secção; editável
definirConvocatoria(jogoId, convocados[...]) // CONVOCATORIA_GERIR
definirPlanoTatico(jogoId, plano)            // posição/titular previstos (posições da modalidade do jogo)
guardarEstatisticas(jogoId, estatisticas[])  // ESTATISTICAS_GERIR — núcleo por modalidade (§10.8) + métricas
registarEventoJogo/listarEventosJogo/removerEventoJogo // live; tipos por modalidade
guardarRelatorio/definirVideo
obterVistaDiaDeJogo(jogoId)
criarCompeticao/atualizarCompeticao/apagarCompeticao/listarCompeticoes // COMPETICOES_GERIR
registarResultadoExterno(competicaoId, dados)/obterClassificacao(competicaoId)
criarObservacaoAdversario(jogoId?, dados)/listarObservacoes // SCOUTING_GERIR
```

**Comunicação, lembretes, reuniões, calendário, relatórios/analytics/carreira** — conforme v6 §7.3 (sem alteração de assinatura na v7).
```
gerarTextoComunicacao / gerarCalendarioTexto / listarModelosComunicacao / editarModeloComunicacao / instalarSeedComunicacao
criarLembretePessoal / criarLembreteEquipa / marcarLembreteFeito / listarMeusLembretes / atualizarLembrete / apagarLembrete
criarReuniao / atualizarReuniao / apagarReuniao / listarReunioes
obterUrlAutorizacaoCalendario / obterIntegracaoCalendario / desconectarGoogleCalendar / sincronizarComCalendario
obterAnalyticsAtleta / obterAnalyticsEquipa / obterAnalyticsClube(epocaId, seccaoId?) // 🔁 v7: filtro por secção
gerarPDF / criarRelatorioPartilhado / obterRelatorioPartilhado / listarRegistoCarreira / editarRegistoCarreira
```

## 8. Módulos funcionais

Cada módulo define **conteúdo**, **ações**, **estado vazio** e **regras**. Estados loading/erro seguem a secção 13. Navegação: barra de topo (logótipo do clube + **seletor de secção quando >1** + seletor de época + menu do utilizador) + sidebar (PC) / bottom-nav (móvel). **No modo Individual, os módulos de gestão de clube (secções, membros, perfis, branding) não aparecem.**

### 8.1 Onboarding e contas
> **Princípio (decisão 2026-08-05):** o **formulário de registo recolhe apenas o essencial**. O **setup completo é feito no primeiro ecrã após o primeiro login** (onboarding guiado pós-registo) — nunca misturado com o pagamento.
- **Login** (`/login`): email + password. Erros inline; toast em falha.
- **Registo — só dados essenciais:**
  - **Individual:** nome, email, password **+ modalidade (futsal ou futebol)** 🔁. Cria `Utilizador` + **clube técnico** invisível + **Secção** da modalidade + `Carteira`.
  - **Clube:** nome, email, password **+ nome do clube**. Cria `Utilizador` + `Clube` real (criador = Administrador; perfis de arranque). A **primeira secção** cria-se ao criar o primeiro escalão (8.1.1).
  - ❌ **Não** se recolhem no registo/pagamento: logótipo, cores, escalões.
- **Setup guiado pós-primeiro-login (onboarding):**
  - **Clube:** logótipo, **cores** (branding), **modalidade(s)** + **escalões** (ao criar o primeiro escalão de uma modalidade, a respetiva secção é criada automaticamente), época — cada passo pode ser saltado.
  - **Individual:** vai direto para o percurso de vitória rápida.
- **Vitória rápida (decisão 2026-08-05):** valor nos primeiros 10 minutos — criação em massa do plantel → primeira sessão a partir de template → primeira convocatória partilhada no WhatsApp.
- **Aceitar convite:** por link/email; adere ao clube com o perfil (e, se for Coordenador, a(s) secção(ões)) atribuído.
- **Estado vazio:** plantel/treinos vazios encaminham para a vitória rápida.

#### 8.1.1 Secções e navegação multi-desporto — 🔁 novo v7
- **DEVE — criação transparente:** a **Secção** é criada **automaticamente** ao criar o **primeiro escalão** de uma modalidade que o clube ainda não tem (via `garantirSeccaoParaModalidade` na `criarEscalao`). Quem só faz uma modalidade **nunca vê** UI de secções.
- **DEVE — seletor de secção condicional:** o **seletor de secção** na barra de topo (ou no cabeçalho de plantel/treinos/jogos) **só aparece quando o clube tem mais do que uma secção**. Com uma só secção, tudo funciona como na v6 (sem passo extra).
- **DEVE — separação visual:** dentro de cada módulo (plantel, treinos, jogos, exercícios, analytics), quando há >1 secção, os escalões são **agrupados/filtrados por secção** — "Benjamins Futsal" e "Benjamins Futebol" nunca se confundem (secção 1.7.2). A tabs de escalão passa a ser **agrupada por secção** ou precedida pelo seletor de secção.
- **DEVERIA — memória de contexto:** a secção selecionada persiste (cookie/estado de UI) entre navegações, à semelhança da época ativa; nunca é fonte de autorização (5.4).

### 8.2 Gestão de membros e perfis (`CLUBE_UTILIZADORES`, `CLUBE_PERFIS`) — só clube real
- **Membros:** lista (nome, perfil, **secções coordenadas** 🔁, escalões, estado, overrides). Ações: convidar, editar perfil, atribuir escalões, **atribuir secções (Coordenador)** 🔁, definir overrides, restringir visibilidade, repor password, remover.
- **Editor de overrides:** diálogo por membro com a grelha do catálogo (6.2); origem por linha (`perfil`/`extra`/`revogada`); delegação (6.4).
- **Gating de UI:** sem `CLUBE_UTILIZADORES` o ecrã da equipa técnica é **só de leitura**.
- **Perfis:** criar/duplicar/editar/apagar; editor = nome + âmbito (`TODO_CLUBE`/**`SECCAO`**/`PROPRIOS_ESCALOES`) + grelha de capacidades.
- **Regras:** nunca deixar o clube sem admin; perfil em uso não se apaga sem reatribuir; delegação.

### 8.3 Branding do clube (`CLUBE_BRANDING`) — só clube real
- Editar cor primária, secundária e logótipo (upload → Supabase Storage). Cores por variáveis CSS em tempo real; logótipo na barra de topo, marca de água e PDF. Pré-visualização. **🔁 v7:** o branding é do **clube** (transversal às secções) — não há branding por secção.

### 8.4 Definições base
- **🔁 Secções** (`CLUBE_SECCOES`): listar, criar (por modalidade; idempotente por `@@unique[clubeId, modalidade]`), renomear, atribuir/remover coordenadores, apagar (bloqueado se tiver escalões). Ver 8.22.
- **Escalões** (`CLUBE_ESCALOES`): CRUD + reordenar + visibilidade; **cada escalão pertence a uma secção** (selecionada ou derivada da modalidade). Apagar bloqueado se tiver participações/atletas.
- **Épocas** (`CLUBE_EPOCAS`): criar, listar, definir ativa; **wizard «Nova Época»** (8.21).
- **Métricas** (`CATALOGO_METRICAS`): CRUD + tipo + ativar/desativar + reordenar; **🔁 opcionalmente por modalidade** (só aparecem nessa modalidade; null = ambas).
- **Habilidades** (`CATALOGO_HABILIDADES`): CRUD por nível + reordenar; **🔁 opcionalmente por modalidade**.
- **Subcategorias de exercício:** CRUD (seed instala predefinidas).
- **Templates de comunicação** (`COMUNICACOES_GERIR`): ver/editar variantes.

### 8.5 Plantel e participações (`PLANTEL_GERIR`, `PROMOVER_ATLETAS`)
- **Atleta ao nível do clube** (transversal às modalidades — 1.7.3). Lista: **agrupada por secção quando >1** 🔁, tabs por escalão (participações ativas na época) + pesquisa; cartões (avatar, nome, **número do escalão**, posições da modalidade). **Aviso de número duplicado** entre participações ativas do mesmo escalão.
- **Participações (N-N):** um atleta tem uma **participação PRINCIPAL por modalidade** 🔁 e pode ter simultâneas/ocasionais noutros escalões (mesma ou outra modalidade). Ações: **associar** (tipo + número), **transferir** (transição permanente muda o principal da modalidade), **terminar**. Histórico preservado.
- **Gating de UI (6.7):** associar/transferir só com `PLANTEL_GERIR`; terminar só com `PROMOVER_ATLETAS`. Os escalões oferecidos limitam-se aos **geríveis** (todos se `TODO_CLUBE`; da secção se `SECCAO`; os atribuídos se `PROPRIOS_ESCALOES`).
- **Perfil do atleta:** cabeçalho + abas **Estatísticas** (vista conjunta na época **segmentada por modalidade/secção** 🔁 + vista por escalão), **Caderneta**, **Carreira** (percurso, com modalidade), **Dados** (+ consentimentos), **Participações** (histórico de escalões, indicando modalidade).
- **Novo/Editar:** nome (obrigatório), posições (filtradas pela modalidade do contexto, mas o atleta pode acumular de ambas), data de nascimento, foto (URL), encarregado de educação; **escalão + número** na participação.
- **Apagar:** soft-delete; hard-delete só por RGPD (5.5) — remove participações em todas as secções.
- **Estado vazio:** "Ainda não há atletas neste escalão." + atalho de criação em massa.

### 8.6 Exercícios e bibliotecas (`EXERCICIOS_GERIR`)
- **Duas bibliotecas em abas** (`/exercicios?bib=pessoal|clube`, default pessoal): **Pessoal** (🎒) e **do Clube** (🏛️). Filtro por **parte do treino** / categoria / **modalidade** 🔁 (futsal/futebol/genérico) + pesquisa por nome; grelha de cartões com miniatura do diagrama, badges e marca de **seed** («Curado»).
- **Biblioteca de exemplo curada** (Mister): organizada por parte do treino/objetivo/escalão **e por modalidade** 🔁 — instalável por modalidade (`instalarBibliotecaArranque(modalidade?)`); garante que nunca começa vazia.
- **Detalhe:** nome, modalidade, parte do treino, categoria, duração, objetivo, descrição, **diagrama** (render read-only, play se animado; campo de futsal ou de futebol conforme a modalidade — 11.5).
- **Novo/Editar:** formulário + **editor de campo** (secção 11) com passos/animação. **🔁 Campo «Modalidade»** (futsal/futebol/genérico) — determina o campo do editor. **Toggle de biblioteca** (🎒/🏛️) só na criação. **Toggle "partilhar no clube"** nos cartões.
- **Apagar:** bloqueado se em uso (indica em quantas sessões/templates).

### 8.7 Templates de sessão (`EXERCICIOS_GERIR`)
- Rota **`/treinos/templates`**. Sessões completas, organizadas por objetivo/fase/escalão **e modalidade** 🔁. Curadas (seed) + do treinador/clube. Filtro por escalão alvo **e por modalidade**.
- **Novo/Editar:** diálogo com nome, **modalidade** 🔁, escalão alvo, fase da época, objetivo tático, duração, descrição, toggle de biblioteca e lista de exercícios reordenável (picker filtra pela modalidade do template).
- **Criar sessão a partir de template:** pede data/hora + escalão (da mesma modalidade do template) e copia exercícios/durações.
- **Partilhar no clube:** só templates pessoais do autor; **transfere a propriedade** (§3.4).

### 8.8 Treinos (`TREINOS_GERIR`, `PRESENCAS_MARCAR`)
- **Lista/Calendário:** **agrupamento por secção quando >1** 🔁, tabs por escalão; alternância lista ⇄ calendário mensal; agrupamento automático por **semana** (8.9).
- **Detalhe:** cabeçalho + **Exercícios** (picker filtra pela modalidade do escalão) e **Presenças** (motivo de falta quando aplicável). Notas de treino. **RPE da sessão** (§8.20).
- **Novo/Editar:** data/hora, escalão, duração, objetivo, local, notas, ligação a semana (opcional), criar a partir de template, **modalidade da actividade** (opcional) 🔁.
- **🔁 Modalidade da actividade (v7):** o campo "Modalidade da actividade" é **opcional** e por defeito herda da secção do escalão. O treinador pode alterá-lo para actividades pontuais (ex: escalão de futebol que participa num torneio de futsal). Quando diferente da modalidade mãe, a sessão é sinalizada com badge de modalidade nos painéis de treino.
- **Estado vazio:** "Sem sessões nesta época."

### 8.9 Periodização e semana de trabalho (`PERIODIZACAO_GERIR`)
Conforme v6 §8.9 (sem alteração funcional na v7): grelha anual + planos semanais/mensais; UI usa **«Semana»** (nunca «Microciclo»); agrupamento automático por data; formalizar é opcional (nome livre + modo Estruturado MD-X / Texto livre); **Mesociclo** interno/avançado. Propriedade: instância concreta 🏛️ do clube; metodologia (semana-tipo) 🎒 portátil.

### 8.10 Modelo de jogo e quadro tático (`MODELO_JOGO_GERIR`)
- **Modelo de jogo (documento vivo):** por clube/escalão/época, por **momento**, com princípios/subprincípios + diagrama. **🔁 v7:** o editor usa o campo da modalidade do escalão (ou da `modalidade` do modelo portátil). Metodologia genérica portátil = sem escalão/época.
- **Bolas paradas:** cantos/livres/lançamentos no editor — vivem na biblioteca, no modelo de jogo e nos quadros táticos.
- **Quadro tático por jogo (🏛️):** esquemas específicos ligados a um jogo (campo da modalidade do jogo).

### 8.11 Jogos, competições, estatísticas, classificação e scouting
- **Calendário/Lista** (`JOGOS_GERIR`): **agrupamento por secção quando >1** 🔁, tabs por escalão; data, adversário, Casa/Fora, resultado, competição, tipo, **formato** 🔁.
- **Vista de dia de jogo:** convocados + posições previstas (**posições da modalidade** 🔁), notas de scouting, esquemas de bola parada, hora e local.
- **🔁 Modalidade da actividade (v7):** ao criar/editar um jogo, o campo "Modalidade da actividade" é **opcional** e por defeito herda da secção do escalão. O treinador pode alterá-lo para actividades pontuais (ex: escalão de futebol que participa num torneio de futsal). Quando diferente da modalidade mãe, o jogo é sinalizado com badge de modalidade nos painéis de jogo.
- **Detalhe do jogo:** cabeçalho + resultado + **campo «Formato»** 🔁 (pré-preenchido pela secção, editável); **faltas acumuladas por parte só em FUTSAL** 🔁 (ocultas em futebol) + abas:
  - **Convocatória** (`CONVOCATORIA_GERIR`): toggle por atleta + posição prevista (da modalidade) + titular.
  - **Estatísticas** (`ESTATISTICAS_GERIR`): por atleta — utilização, tempo de jogo por blocos, **núcleo por modalidade** 🔁 (futsal: golos, assistências, e se GR defesas/sofridos/faltas; futebol: golos, assistências, **remates, cantos, foras-de-jogo, desarmes**, e se GR defesas/sofridos) + **métricas configuráveis**. Aviso se soma de golos ≠ resultado. Ver 10.8.
  - **Modo ao vivo:** eventos (golo, assistência, falta, cartão, substituição com bloco, defesa, timeout — **futsal**; + **remate, canto, fora-de-jogo, desarme** — **futebol** 🔁) por parte/minuto; agrega para estatísticas. Otimizado telemóvel + offline. **Sem bloqueio de substituições** (informativo — 1.6).
  - **Relatório** (texto) · **Vídeo** (YouTube) · **Quadro tático** (diagramas do jogo, campo da modalidade).
  - **Scouting** (`SCOUTING_GERIR`): observação do adversário criada no próprio jogo. Também avulso.
- **Competições** (`COMPETICOES_GERIR`): criar (liga/torneio/taça); classificação por resultados **inseridos manualmente**; calendário. Uma competição pertence a um escalão (logo, a uma modalidade). **Sem integração automática** (API oficial = FUTURO).
- **Estado vazio:** "Sem jogos nesta época."

### 8.12 Comunicação com pais e equipa técnica (`COMUNICACOES_GERIR`)
Conforme v6 §8.12: a app **não é canal**, é gerador de conteúdo para WhatsApp; 7 templates (convocatória, cancelamento, mudança de horário/local, resultado, aviso geral, calendário). Fluxo: gerar → "Partilhar no WhatsApp". **🔁 v7:** os placeholders são agnósticos à modalidade; o `nomeEquipa` já traz o escalão (que identifica a modalidade pela secção). Sem placeholders novos.

### 8.13 Reuniões e calendário (`REUNIOES_GERIR`)
Conforme v6 §8.13: reuniões escalão/clube com ata exposta; sincronização Google Calendar (treinos/jogos/reuniões). Sem alteração na v7.

### 8.14 Caderneta (`CADERNETA_GERIR`)
Habilidades por nível, com estado/data/notas. Progresso + celebração ao desbloquear. **🔁 v7:** as habilidades podem ser específicas de modalidade (`Habilidade.modalidade`); a caderneta de um atleta multi-desporto mostra as habilidades da modalidade em contexto (secção/escalão) e agrega por modalidade na vista conjunta.

### 8.15 Analytics, relatórios e PDF (`RELATORIOS_VER`) — **pilar do produto**
> Três níveis, agora com **filtro por secção/modalidade** 🔁:
- **Atleta:** evolução de presenças, tempo de jogo acumulado (blocos), golos/estatísticas por jogo, caderneta, comparação com a média da equipa — **segmentado por modalidade** quando o atleta é multi-desporto (10.8).
- **Equipa:** evolução de resultados, golos, assiduidade, mais utilizados, top scorers, **núcleo estatístico da modalidade** (10.8).
- **Clube (transversal):** comparação entre escalões e **entre secções/modalidades** 🔁; assiduidade global; KPIs. Visível a Admin/DT; Coordenador vê a **sua secção** (6.9); configurável para treinadores.
- **Relatório de fim de época:** por atleta/equipa/clube — PDF + vista web partilhável (`RelatorioPartilhado`) com identidade do clube. Snapshot imutável.
- **Export CSV** dos analíticos de escalão e de atleta (Excel PT-PT). **🔁** As colunas de núcleo refletem a modalidade do escalão.
- **PDF profissional:** ficha de jogo, convocatória, plano de treino, relatório de desenvolvimento do atleta.

### 8.16 Dashboard — centro de comando contextual
Conforme v6 §8.16: temporal (treino de hoje domina; senão countdown de jogo iminente; "atenção necessária") + ações rápidas + agenda agregada + aviso de conflito de pavilhão. **🔁 v7:** quando o clube tem >1 secção, o dashboard respeita o seletor de secção (ou mostra tudo agrupado por secção para Admin/DT); a agenda agregada e o conflito de pavilhão atravessam **todas as secções** (o pavilhão pode ser partilhado entre futsal e futebol).

### 8.17 Perfil do treinador e carreira
Conforme v6 §8.17: espaço pessoal 🎒 (biblioteca pessoal, histórico de carreira editável, carteira). Página `/perfil` + métricas de carreira + copiar link. **🔁 v7:** o histórico pode indicar a modalidade nos campos de texto; a biblioteca pessoal inclui exercícios de ambas as modalidades.

### 8.18 Conformidade FPF (levantamento pendente)
- **DEVE (após levantamento):** exportação do **Modelo 2 FPF** e documentos federativos, **de futsal e de futebol** 🔁. Requer levantamento dos requisitos exatos (campos, formatos) antes de implementar — fase própria (secção 16).

### 8.19 Lembretes e tarefas (to-dos)
Conforme v6 §8.19: pessoal (qualquer membro) / equipa (`LEMBRETES_EQUIPA_GERIR`); deadline opcional; feitos individualmente; no dashboard + lista dedicada. Sem alteração na v7.

### 8.20 Carga de treino — RPE / ACWR (`TREINOS_GERIR`, `RELATORIOS_VER`)
Conforme v6 §8.20: RPE da sessão (`Sessao.rpeSessao` 1-10) e individual (`RpeAtleta`); sRPE (`duracaoMin × rpeSessao`); carga semanal (ISO); **ACWR** (`<0.8` subcarga · `0.8–1.3` ideal · `>1.3` risco); gráfico `CurvaCargaSemanal` + tabela ACWR por atleta. Transversal às modalidades. Sem alteração na v7.

### 8.21 Wizard «Nova Época» (`CLUBE_EPOCAS`)
Conforme v6 §8.21 (cenários A/B/C/D), com uma extensão multi-desporto:
- **🔁 v7 (DEVE):** os passos de plantel/escalões/promoções respeitam a **secção**. Ao transitar escalões de várias secções, o wizard agrupa por secção; as promoções por idade são sugeridas **dentro da mesma modalidade** (um atleta de futsal transita para o escalão de futsal seguinte; se também joga futebol, essa participação é tratada na secção de futebol). O invariante "principal único" é aplicado **por modalidade** (§9).
- Herança automática (conteúdo portátil, métricas, caderneta, modo de semana) e reset (estatísticas/presenças/jogos/convocatórias/planeamentos) — inalterados.

### 8.22 Gestão de secções (`CLUBE_SECCOES`) — 🔁 novo v7
- **Rota `/definicoes/seccoes`** (só clube real): lista das secções (modalidade, nome, nº de escalões, coordenadores).
- **Criar secção:** escolher modalidade (só as que o clube ainda não tem — `@@unique`); nome opcional. Normalmente **não é preciso** criar manualmente (cria-se ao criar o primeiro escalão — 8.1.1); a UI existe para o caso de o Admin querer preparar a secção antes.
- **Renomear:** editar `nome`.
- **Atribuir coordenador:** escolher membro → cria `MembroSeccao` (papel `COORDENADOR`). Remover coordenador.
- **Apagar secção:** só se **não tiver escalões** (confirmação). A secção do clube técnico não é apagável.
- **Estado vazio:** "Este clube tem uma única modalidade." + explicação de que basta criar escalões de outra modalidade para surgir uma nova secção.

---

## 9. Regras de negócio transversais e casos-limite

**Herdados do MVP/v6 (mantêm-se):**
- **Métrica desativada com valores históricos:** valores mantêm-se; novos não a pedem. Nunca apagar `ValorMetrica`.
- **Mudança de posição do atleta:** jogos passados mantêm os dados registados.
- **Atleta que entra a meio da época:** taxa de presença usa como divisor as sessões do escalão desde a `dataIngresso`.
- **Convocatória alterada com estatísticas:** remover convocado com estatísticas pede confirmação e apaga-as.
- **Sessão/jogo com data fora da época:** permitido, com aviso suave.
- **Dois atletas com o mesmo número:** permitido; aviso não-bloqueante por escalão.
- **Sem época ativa:** actions devolvem "Nenhuma época ativa"; UI encaminha.
- **Golos individuais ≠ resultado:** aviso suave, não bloqueia.
- **Exercício em uso:** apagar bloqueado; editar sempre permitido.
- **Concorrência:** last-write-wins (§13.4).
- **Modo Individual = clube técnico:** contexto de clube existe sempre; `obterMembroAtual()` nunca null.
- **Permissão negada:** action sem capacidade/âmbito devolve `erro("Sem permissão")`.
- **Overrides e delegação:** capacidades efetivas = perfil ∪ extra \ revogadas; só se atribuem capacidades ≤ às próprias.
- **Transição a meio da época:** datas preservam o histórico; estatísticas anteriores ficam no escalão de origem.
- **Lesões:** registadas como motivo de falta (`LESAO`); sem módulo clínico.
- **Tempo de jogo por blocos:** registo por bloco; acumula ao longo da época.
- **Classificação de competição:** por `ResultadoCompeticao` (inseridos manualmente) + jogos próprios.
- **Scouting no jogo:** liga-se ao `jogoId`; apagar o jogo faz `SetNull`.
- **Comunicação:** a app gera texto, não envia; pais sem conta.
- **Relatório partilhável:** `token` não-adivinhável + snapshot imutável; opcional `expiraEm`.
- **Google Calendar:** sincronização idempotente via `googleEventId`.
- **Absorção:** crédito proporcional (`CREDITO_ABSORCAO`); reembolso só manual.
- **Saída de treinador:** conteúdo `TREINADOR` viaja; `CLUBE`/secções/snapshots ficam; adesão `INATIVO`; nunca deixar clube sem admin.
- **Uma sessão por conta. Época ativa é por clube.**
- **RGPD:** hard-delete a pedido preserva agregados anonimizados.

**Novos (multi-desporto — decisão 2026-08-19):** 🔁
- **Modalidade deriva da secção:** nenhuma operação recebe a modalidade do cliente como fonte de verdade — resolve-se sempre por `escalao.seccao.modalidade` (1.7.1, 7.1).
- **Secção única por modalidade:** `@@unique([clubeId, modalidade])` — tentar criar uma segunda secção da mesma modalidade devolve a existente (idempotente), não erro.
- **Criação transparente de secção:** criar o primeiro escalão de uma modalidade cria a secção na mesma transação (8.1.1).
- **Apagar secção:** bloqueado se tiver escalões; a secção do clube técnico não é apagável.
- **Atleta multi-desporto (participação principal por modalidade):** o invariante "exatamente uma participação `PRINCIPAL` ativa" é **por (atleta, época, modalidade)** — um atleta pode ter um principal em futsal **e** um principal em futebol na mesma época. As escritas (`associarAEscalao`/`transferirEscalao`/`terminarParticipacao`) aplicam o invariante **dentro da modalidade**:
  - `associarAEscalao` nunca cria um principal (só `SIMULTANEA`/`OCASIONAL`);
  - `transferirEscalao` com destino `PRINCIPAL` despromove para `SIMULTANEA` qualquer outro principal ativo **da mesma modalidade** e recusa a transferência que deixasse o atleta sem principal nessa modalidade;
  - `terminarParticipacao` recusa terminar a participação principal de uma modalidade (transferir primeiro).
- **Primeiro principal de uma modalidade nova:** quando `associarAEscalao` é chamado para um atleta que não tem nenhuma participação PRINCIPAL activa na modalidade da secção destino, o sistema DEVE criar a participação com `tipo = PRINCIPAL` automaticamente (não aplica a SIMULTANEA/OCASIONAL explícitas). Esta é a única excepção à regra "associar nunca força PRINCIPAL".
- **Estatísticas por modalidade:** o núcleo estatístico exibido/gravado depende do formato/modalidade do jogo (10.8); campos de futebol (remates, cantos, foras-de-jogo, desarmes) ficam a `null` em jogos de futsal e vice-versa (faltas por parte só em futsal).
- **Formato de jogo:** `Jogo.formato` é pré-preenchido pela secção do escalão e é **editável** (amigáveis podem ser noutro formato); determina o campo do editor e as estatísticas de núcleo.
- **Posições:** o seletor filtra pela modalidade do contexto; um atleta multi-desporto pode acumular posições de ambas as modalidades em `Atleta.posicoes`.
- **Licença Individual = uma modalidade:** não é possível criar escalões de duas modalidades num clube técnico Individual (17.1). Tentar fazê-lo é bloqueado com mensagem que sugere a licença de Clube.
- **Analytics de secção:** um Coordenador vê o analítico da sua secção e escalões; o analítico transversal do clube compara secções/modalidades (10.3, 10.8).
- **Sem bloqueio de substituições:** o registo ao vivo é informativo em ambas as modalidades (amigáveis não têm regras fixas — 1.6).

**Notas técnicas de invariantes (multi-desporto):** 🔁
- **Invariante do principal por modalidade (implementação):** o invariante "único PRINCIPAL por (atleta, época, modalidade)" **não é enforçável por índice BD** (modalidade não é coluna de `AtletaEscalao`; deriva de `escalao.seccao.modalidade`). É garantido exclusivamente por **lógica aplicacional dentro de transacção `Serializable`** que consulta todas as participações activas do atleta, atravessando `escalao → seccao`. O helper `modalidadeDoEscalao(escalaoId)` DEVE ser cacheável para evitar N+1 em listagens.
- **Invariantes cross-entidade (validadas na aplicação, não pela BD):** (1) `escalao.clubeId == escalao.seccao.clubeId`; (2) `membroSeccao.membroClube.clubeId == membroSeccao.seccao.clubeId`; (3) `Convocatoria.posicaoPrevista ∈ configModalidade(jogo.seccao.modalidade).posicoes`.

---

## 10. Estatísticas e agregações

Tudo filtrado pela **época ativa** e pelo **clube** (e, quando aplicável, pela **secção/modalidade**). Lógica em funções puras testáveis (`lib/estatisticas.ts`).

### 10.1 Agregado do atleta (`obterEstatisticasAtleta`) — por escalão e conjunto
Conforme v6 §10.1: por escalão (participação) **e** vista conjunta na época:
```
jogosConvocado, jogosUtilizados, titularidades, totalGolos, totalAssistencias
tempoJogoAcumulado (blocos → min: JOGO_COMPLETO=40, MEIA_PARTE=20, 10, 5, 0)
totalMinutos (null se nenhum registado), totalDefesas/totalGolosSofridos (só GR)
sessoesTotais (desde dataIngresso), presencas (PRESENTE|ATRASADO), taxaPresenca
```
> **🔁 v7:** a **vista conjunta é segmentada por modalidade** — um atleta que joga futsal e futebol vê dois blocos (um por modalidade), porque somar golos de futsal com golos de futebol seria enganador. `tempoJogoAcumulado` de futsal usa `JOGO_COMPLETO=40`; ⚠️ para futebol o valor de `JOGO_COMPLETO` em minutos depende do formato (Apêndice B) — ver 10.8.
- **Métricas configuráveis** (`metricas`) agregadas por `MetricaConfig` (total/média/jogos), incluindo desativadas com histórico; filtradas pela modalidade quando a métrica é específica.

### 10.2 Agregado da equipa (escalão + época)
Conforme v6 §10.2: jogos/V/E/D, golos, taxa de presença média, melhores marcadores/assistentes (por `atletaId`), mais utilizados (blocos), distribuição de tipos de treino, rankings por métrica configurável, ranking de assiduidade (TOP 5), filtro por competição. **🔁 v7:** o escalão tem uma modalidade fixa (a da sua secção), logo o agregado da equipa é naturalmente monomodalidade; o **núcleo estatístico apresentado** é o da modalidade (10.8).

> **🔁 Actividades cross-modalidade (v7):** `obterAnaliticosEscalao` expõe o breakdown de sessões e jogos por `modalidadeAtividade`. Inclui KPI "sessões de modalidade alternativa" e filtro por modalidade da actividade.

### 10.3 Agregado do clube (transversal)
Conforme v6 §10.3: comparação entre escalões (assiduidade, V-E-D, golos, nº atletas), assiduidade global, KPIs. **🔁 v7:** ganha **comparação entre secções/modalidades** e **filtro por secção**. Visível a Admin/DT; **Coordenador vê o agregado da sua secção** (6.9); configurável para treinadores.

### 10.4 Registo ao vivo → agregação
Os `EventoJogo` agregam para `EstatisticaAtleta`. **🔁 v7:** os tipos de evento de futebol (`REMATE`, `CANTO`, `FORA_DE_JOGO`, `DESARME`) agregam para os campos de núcleo de futebol; os de futsal para os seus. Manual e live convergem (last-write-wins).

### 10.5 Específicas de futsal ⚽
- Faltas acumuladas por parte (destaque à 5.ª).
- Tempo por atleta por **blocos** (rotações); quintetos/rotações e power play derivados dos eventos de substituição.

### 10.6 Relatório de fim de época e partilha (sem IA)
Conforme v6 §10.6: agregados (10.1–10.3, 10.8), evoluções, rankings, caderneta; PDF (via impressão do browser) + link web (`RelatorioPartilhado`, snapshot imutável). **🔁 v7:** o snapshot pode ser segmentado por secção/modalidade; o relatório de clube compara secções.

### 10.7 Onde aparecem
Perfil do atleta, Dashboard, Analytics/Relatórios, vista de clube (com filtro de secção). Gráficos SVG próprios (`components/graficos/`) com a cor do clube.

### 10.8 Estatísticas de futebol 🥅 — núcleo fixo + configurável (novo v7)
> **Princípio (decisão 2026-08-19):** **mesmo princípio do futsal** — um **núcleo fixo** sempre presente + **customização por cima** via `MetricaConfig`. O que muda é o *conjunto* do núcleo e a ocultação de campos específicos da outra modalidade.

**Núcleo fixo por modalidade (campos de `EstatisticaAtleta`):**

| Campo | Futsal ⚽ | Futebol 🥅 |
|---|---|---|
| `golos` | ✅ | ✅ |
| `assistencias` | ✅ | ✅ |
| `defesas` (GR) | ✅ (só GR) | ✅ (só GR) |
| `golosSofridosGR` (GR) | ✅ (só GR) | ✅ (só GR) |
| `faltasCometidas` | ✅ | ✅ (opcional) |
| `remates` | — (oculto) | ✅ |
| `cantos` | — (oculto) | ✅ |
| `forasDeJogo` | — (oculto) | ✅ |
| `desarmes` | — (oculto) | ✅ |
| `Jogo.faltas1aParte`/`faltas2aParte` (equipa) | ✅ | — (oculto) |
| power play / GR-jogador (derivado) | ✅ | — |

**Regras (DEVE):**
- A grelha de estatísticas do jogo **mostra apenas o núcleo da modalidade do jogo** (derivada de `Jogo.formato`/secção). Campos da outra modalidade **não aparecem** e ficam a `null`.
- Sobre o núcleo, o clube pode **acrescentar métricas configuráveis** (`MetricaConfig`, opcionalmente marcadas com `modalidade`) — ex.: "duelos ganhos", "passes-chave" em futebol; "recuperações no último terço" em futsal.
- **Agregações de equipa/atleta** somam/mediam o núcleo relevante à modalidade (golos, assistências, remates, cantos, foras-de-jogo, desarmes para futebol) mais as métricas configuráveis.
- **`tempoJogoAcumulado`:** os blocos (`BlocoTempo`) são a base do tempo de jogo nas duas modalidades. O valor de `JOGO_COMPLETO` em minutos é **parametrizável por formato** (Apêndice B: ex. FUTSAL_5=40; futebol varia por escalão/formato). ⚠️ a tabela `MINUTOS_POR_BLOCO` passa a poder depender do formato — decidir na implementação (fase 28) se `JOGO_COMPLETO` é constante por modalidade ou lido do formato.
- **RGPD:** cards sociais e relatórios respeitam as mesmas regras de menores em ambas as modalidades (3.16).

## 11. Formato do diagrama de campo e animação

### 11.1 Campo (futsal)
⚽ Campo de futsal FIFA **40×20 m**, proporção 2:1. Coordenadas internas: 1 unidade = 10 cm → **400×200 unidades**. Linhas: meio-campo + círculo central (raio 30), áreas de baliza (quarto de círculo 6 m), marca de grande penalidade (6 m) e segunda penalidade (10 m), balizas 3 m. Render SVG nativo. Três componentes: `CampoFutsal` (read-only), `MiniaturaCampo` (listagens), `EditorCampo` (interativo).

### 11.2 `DiagramaCampo` v2 (com passos)
Guardado em `Json`. Estende o v1 com **passos** para animação, mantendo retrocompatibilidade.
```typescript
interface DiagramaCampo {
  versao: 2;
  elementos: ElementoCampo[];      // estado base (passo 0)
  passos?: PassoAnimacao[];        // opcional; se ausente, é estático
  // 🔁 v7 (DEVERIA): campo do desenho — determina o SVG de fundo.
  campo?: TipoCampo;               // "FUTSAL_5" | "FUTEBOL_11" | ... (default FUTSAL_5, retrocompatível)
}
type ElementoCampo = Jogador | Bola | Cone | Baliza | Seta | Linha | Texto;
interface PassoAnimacao {
  id: string; ordem: number;
  posicoes: { elementoId: string; x: number; y: number }[];
  duracaoMs?: number;
}
```
Validação **Zod** (`diagramaSchema`) obrigatória. Diagrama vazio válido: `{ versao: 2, elementos: [] }` (`DIAGRAMA_VAZIO_V2`). A leitura aceita v1 (retrocompatível) e diagramas **sem `campo`** (assumem `FUTSAL_5`); **o editor grava sempre `versao: 2`**.

> **🔁 v7 — `campo` (DEVE):** o novo campo opcional `campo: TipoCampo` indica o **fundo de campo** a desenhar (futsal ou um dos formatos de futebol — 11.5). É preenchido a partir da modalidade/formato do contexto (exercício, modelo de jogo, quadro tático). Diagramas legados sem `campo` assumem `FUTSAL_5` (retrocompatibilidade total — Apêndice C). `TipoCampo` alinha com `FormatoJogo`.

> **🔁 v7 — `TipoCampo` (formalização):** `TipoCampo` partilha os mesmos literais que `FormatoJogo` (`FUTSAL_5`, `FUTEBOL_3_3`, etc.) e é representado como string no JSON `DiagramaCampo`. Um campo de diagrama sem `campo` assume `FUTSAL_5`. Exercícios de uso geral (sem modalidade específica) mostram campo neutro — renderizado como `FUTSAL_5` por defeito até existir um preset "neutro" explícito.

**Convenção base ⇄ passos (delta com herança):** conforme v6 §11.2 — `elementos` é o keyframe 0; cada `PassoAnimacao` é um delta que herda do keyframe anterior; `construirKeyframes` reconstrói `[base, base⊕passo0, …]`. Funções puras em `components/campo/animacao.ts`, testadas em `tests/campo.test.ts`.

### 11.3 Animação (A→B) e qualidade (prioridade)
Conforme v6 §11.3 (inalterado): playback com tween + `requestAnimationFrame` + easing; controlos play/pause/reiniciar/loop/velocidade; `prefers-reduced-motion` avança keyframe-a-keyframe; setas (sólida/tracejada/ondulada); equipa própria azul, adversário vermelho; pointer events com `setPointerCapture`; hit area ≥32px; acessibilidade de teclado. O editor é um **diferenciador central** — a sua validação é prioritária **e serve as duas modalidades**.

### 11.4 Reutilização
O mesmo editor e formato servem **exercícios**, **modelos de jogo**, **bolas paradas** e **quadros táticos**, em **futsal e futebol** (o fundo muda pelo `campo`). A miniatura é o mesmo SVG num viewBox menor.

### 11.5 Campos de futebol 🥅 (todos os formatos — novo v7)
> **Princípio:** mesmo motor SVG do futsal, mudando apenas o **fundo de campo** (dimensões, marcações) e o **viewBox**. Coordenadas internas mantêm a convenção **1 unidade = 10 cm** para coerência de escala e de hit area entre modalidades.

**Componentes:** generaliza-se `CampoFutsal` para um `CampoDesenho` (ou `CampoFutebol` irmão) que recebe o `campo`/formato e desenha o fundo correspondente; `MiniaturaCampo` e `EditorCampo` recebem o mesmo parâmetro. O código de elementos, passos, animação e interação é **partilhado e agnóstico ao fundo**.

**Fundos por formato (dimensões oficiais de referência; ver Apêndice B para detalhe):**

| `TipoCampo` / `FormatoJogo` | Dimensões de campo (referência) | viewBox interno (1u=10cm) | Marcações-chave |
|---|---|---|---|
| `FUTSAL_5` ⚽ | 40×20 m | 400×200 | meio-campo, círculo central (r=30), áreas 6 m (quarto de círculo), penálti 6 m, 2.ª penalidade 10 m, balizas 3 m |
| `FUTEBOL_3_3` 🥅 | ~25×15 m (mini) | 250×150 | meio-campo, balizas pequenas; **sem** grandes áreas (formação inicial) |
| `FUTEBOL_5_5` 🥅 | ~40×20 m | 400×200 | meio-campo, círculo central, pequenas áreas, balizas reduzidas |
| `FUTEBOL_7` 🥅 | ~60×40 m | 600×400 | meio-campo, círculo central, área ~12×24 m, marca de penálti, balizas 6 m |
| `FUTEBOL_9` 🥅 | ~75×50 m | 750×500 | meio-campo, círculo central, grande área, penálti, balizas |
| `FUTEBOL_11` 🥅 | 100×64 m (referência) | 1000×640 | meio-campo, círculo central (r=91,5 dm), grandes áreas (16,5 m), pequenas áreas (5,5 m), marca de penálti (11 m), arcos de área, balizas 7,32 m |

> **Notas de implementação (DEVE):**
> - As dimensões são **de referência** (a formação juvenil varia por associação); o objetivo é um fundo **funcionalmente correto e reconhecível**, não uma medição federativa exata. ⚠️ afinar por formato na fase 26.
> - O `viewBox` escala com as dimensões reais mantendo 1u=10cm, para que o `raioHitEfetivo` (11.3) e a escala de elementos sejam coerentes entre campos.
> - As **convenções de cor e setas** (equipa própria azul, adversário vermelho; seta sólida/tracejada/ondulada) são **idênticas** em futsal e futebol.
> - O **fundo de pitch escuro** (12.0) aplica-se a todos os campos (holofotes).
> - **`prefers-reduced-motion`** e a acessibilidade de teclado são independentes do fundo.

---

## 12. Sistema de design

Prescritivo. Base Tailwind + shadcn/ui. **Marca do produto: Mister** (guia em `docs/BRAND.md`). Princípio: **a marca é fixa; a cor do clube é dinâmica**. **🔁 v7:** o **logótipo mantém-se** (decisão de produto) — a expansão multi-desporto **não** altera a identidade visual da marca.

### 12.0 Design Direction (decisão 2026-08-05)
**Base visual — tema escuro:** o **tema escuro é a base** (default). Fundo `#0F0E13`; superfícies `#1C1B22` (cartões) e `#2A2933` (elevadas). Laranja Mister `#F0531E` como acento primário. Bricolage Grotesque com presença; números de estatística grandes/bold. **Alternador claro/escuro** (F14) persistido (`next-themes`), escuro como default.

**Cor do clube como identidade:** sidebar e acentos adotam as cores dominantes do clube (`--cor-primaria`/`--cor-secundaria`); logótipo do clube presente. Individual = laranja Mister domina.

**Motion como linguagem (DEVE):** transições de página (fade+8px); listas em cascata (40ms/item); gráficos que se desenham; números que contam; micro-celebrações (presença, golo); skeleton com shimmer; 5 estados de botão.

**Empty states (DEVE):** desenhados, com ilustração e convite a agir.

**Editor de campo:** pitch escuro (todos os campos, futsal e futebol).

**Acessibilidade em tema escuro (DEVE):** contraste AA (≥4.5:1); respeitar `prefers-reduced-motion`.

### 12.1 Tokens de cor
Conforme v6 §12.1: base escura (fundo `#0F0E13`, superfície `#1C1B22`, elevada `#2A2933`); marca laranja 500 `#F0531E`/600 `#C7430F`/100/50; neutros quentes (cinza 900→50); verde 600 (sucesso), âmbar (aviso), vermelho 600 (erro), azul (legado/demo). Display Bricolage Grotesque; corpo Inter. Todos os tons existem em `tailwind.config.ts`.

### 12.2 Branding dinâmico do clube
Conforme v6 §12.2: `Clube.corPrimaria`/`corSecundaria` alimentam sidebar e acentos; logótipo do produto (barra/login) só Mister; logótipo do clube presente (sidebar + marca de água); contraste AA sobre superfícies escuras.

### 12.3 Tipografia (Inter)
`titulo-pagina` 24/700 · `titulo-seccao` 18/600 · `subtitulo` 15/600 · `corpo` 14 · `corpo-sec` 13 · `legenda` 12. Linha 1.5.

### 12.4 Componentes e layout
shadcn/ui como base. Cantos `lg` 12px / `md` 8px / `sm` 6px. **Alvos de toque ≥44px.** Tema escuro base + alternador. Datas via `date-fns` locale `pt`. **🔁 v7:** o **seletor de secção** (quando >1) segue o mesmo padrão visual do seletor de época (barra de topo); os agrupamentos por secção nos módulos usam cabeçalhos claros com o rótulo da modalidade.

### 12.5 Dados visuais (gráficos)
Gráficos SVG próprios (`GraficoBarrasH/V`, `GraficoLinhas`) com a cor do clube + neutros quentes; nunca depender só de cor. Diagramas de campo (futsal e futebol) como âncoras visuais.

---

## 13. Estados de UI, i18n, acessibilidade e requisitos não-funcionais

### 13.1 Estados de UI
- **Loading:** `loading.tsx` por rota com **skeleton + shimmer**; ações com estado "a processar".
- **Vazio:** cada listagem com estado vazio **desenhado**; nunca tabela vazia.
- **Erro:** validação inline (`camposInvalidos`); operação → toast; página → `error.tsx`; não encontrado → `not-found.tsx`.

### 13.2 PWA e offline (modo jornada)
- App instalável (manifest + service worker), Android/iOS.
- **Offline tolerante** onde importa (beira-campo): presenças, estatísticas/eventos ao vivo (futsal **e** futebol) — guardar em lote e sincronizar quando a rede volta.

### 13.3 i18n e acessibilidade
- pt-PT hardcoded (sem i18n). Contraste AA (superfícies escuras); foco visível; teclado; `label`/`aria-label`; não depender só de cor. **Respeitar `prefers-reduced-motion`**.

### 13.4 Requisitos não-funcionais
- **Desempenho:** listagens < 1s; ações otimistas < 500ms; editor fluido em tablet (todos os campos). Índices do schema (incl. `Seccao(clubeId)`, `Escalao(seccaoId)`).
- **Segurança:** ver 5.6. Queries por clube + época + âmbito (+ secção).
- **Integrações externas:** Google Calendar (OAuth, tokens encriptados) e, futuramente, Paddle — isoladas do login.
- **Custo operacional mínimo:** sem IA no núcleo; só alojamento + BD + Storage.
- **Escrita concorrente (last-write-wins):** as server actions **não** implementam optimistic locking; a última escrita prevalece sem aviso. Aceite para o perfil de utilização; revisitável com dados de usage. **Futuro:** `version` + verificação de `updatedAt` nos modelos de alta escrita (`EstatisticaAtleta`, `Sessao`, `Jogo`).

---

## 14. Estratégia de testes

Nível: essencial mas obrigatório sobre **lógica de negócio e Server Actions**. **Vitest** (`npm run test`).

**Obrigatório testar:**
- **Schemas Zod** (válidos/inválidos) — todos os módulos, incl. **novos v7** (secção, formato de jogo, posições de futebol, estatísticas de futebol, modalidade no exercício/template/métrica/habilidade).
- **`DiagramaCampo`** v2 (incl. passos e o novo campo `campo`/`TipoCampo`; retrocompatibilidade com diagramas sem `campo` → FUTSAL_5).
- **Agregações** (`lib/estatisticas.ts`): GR vs campo, `totalMinutos` null, tempo por blocos, taxa de presença por escalão, vista conjunta multi-escalão, agregação de eventos ao vivo, analytics de clube, **e o núcleo de futebol (§10.8)** + segmentação por modalidade da vista conjunta.
- **Server Actions:** sucesso, falha de validação/auth/capacidade/âmbito (incl. **âmbito `SECCAO`**), overrides e delegação, casos-limite da secção 9 — **incl. multi-desporto**: criação transparente de secção, `@@unique` de secção (idempotência), invariante do principal **por modalidade**, apagar secção com escalões, licença Individual = uma modalidade, derivação de modalidade pela secção.
- **Autorização** (`exigirCapacidade` + `capacidadesEfetivas`): matriz perfil × capacidade × âmbito (TODO_CLUBE/SECCAO/PROPRIOS_ESCALOES) × overrides, **incl. Coordenador de Secção** (6.9).
- **Regras de visibilidade das bibliotecas** (módulo puro): 🎒 pessoal só ao autor e portátil; 🏛️ do clube a todos os membros; partilha por clube; filtro por modalidade.
- **Classificação** (`obterClassificacao`) e **relatório partilhável** (token, snapshot, expiração, segmentação por secção).

**Método:** Prisma/auth/época/permissões/**secção** mockados para actions; funções puras testadas diretamente. Manter e alargar os testes existentes (**1037** à data da v6). BD de teste isolada para integração.

---

## 15. Stack, setup e deployment

### 15.1 Stack
Next.js 15 (App Router) · React 19 · TypeScript strict · Prisma + PostgreSQL (Supabase) · Auth.js v5 · Zod · Tailwind + shadcn/ui · Vitest · PWA. **Supabase Storage** para logótipos/ficheiros. Integrações: **Google Calendar** (OAuth) e **Paddle** (billing, futuro). Sem IA no núcleo.

### 15.2 Estrutura de pastas
`app/` · `components/` (ui, campo, graficos, layout, por módulo — incl. `components/seccoes/`) · `lib/actions/` (incl. `seccoes.ts`) · `lib/schemas/` · `lib/` (db, auth, contexto, estatísticas, permissões, **config de modalidade — `lib/modalidade.ts`**) · `prisma/` · `tests/` · `docs/`.

### 15.3 Convenções fixas
Server Actions (`"use server"`); Zod em `lib/schemas/`; padrão de action (validar → auth/membro → capacidade/âmbito → época → **derivar modalidade pela secção** → `Resultado<T>` → `revalidatePath`); queries por clube + época + âmbito (+ secção).

### 15.4 Supabase / ligações
- **Pooler obrigatório:** Transaction pooler (6543, `?pgbouncer=true`) para a app; Session pooler (5432) para migrações (`DIRECT_URL`). Segredos em `.env`.

### 15.5 Comandos
`npm run dev` · `typecheck` · `lint` · `test` · `db:migrate` · `db:seed` · `db:studio`. **🔁 v7:** o seed passa a semear a **biblioteca curada por modalidade** (futsal e futebol) e a criar a secção correspondente.

### 15.6 Deployment e custos
- **Arranque:** Vercel Pro + Supabase Free (keep-alive via GitHub Actions) ≈ **€19/mês**. Escala por upgrades. Billing Paddle deferido.

## 16. Ordem de desenvolvimento (fases)

Cada fase fica **funcional, testada e documentada** antes da seguinte. **"Definição de pronto":** implementado conforme a bíblia · validação Zod + `Resultado<T>` · **permissões verificadas** · estados loading/vazio/erro · responsivo · `typecheck`+`lint`+`test` limpos · secção da bíblia atualizada.

### Fases 1–10 — Produto final (base) ✅ CONCLUÍDAS
Resumo: **1** Esqueleto · **2** Reconversão de módulos · **3** Periodização · **4** Modelo de jogo + quadro tático · **5** Jogos avançado · **6** Animação de diagramas · **7** Reuniões · **8** Relatórios/tracking + PDF · **9** Biblioteca curada · **10** PWA/offline + polish + caderneta.

### Fases 11–24 — Evolução para o produto completo (v6) ✅ CONCLUÍDAS
- **11** Refactor do plantel (Atleta ao nível do clube + `AtletaEscalao`). **12** Editor de exercícios (gate de qualidade). **13** Bibliotecas (pessoal+clube) + templates de sessão. **14** Modelo de jogo (documento vivo) + bolas paradas. **15** Jogos: dia de jogo + scouting + tempos por blocos. **16** Competições + classificação (inserção manual). **17** Comunicação (WhatsApp) + calendário. **18** Sincronização Google Calendar. **19** Analytics 3 níveis + relatório partilhável. **20** Onboarding com vitória rápida. **21** Licenciamento e multi-tenant. **22** Conformidade FPF (levantamento). **23** Polish transversal. **24** Design direction (tema escuro + motion) + Dashboard contextual + Lembretes.
> (Ver changelog §19 e a `FutsalManager_Spec_v6.md` para o detalhe verbatim de cada fase.)

### Fases 25–30 — Expansão multi-desporto (v7 — decisão 2026-08-19)

> **Princípio transversal:** todas as fases são **aditivas** (Apêndice C), **não tocam em auth** (Regra Sagrada), e cada uma fica **funcional/testada/documentada** antes da seguinte. Ordem obrigatória: a fase 25 é **pré-requisito** de todas as outras.

**Fase 25 — Fundação multi-desporto (Secção, enums, migração, helpers).**
- **Objetivo:** introduzir a camada de secção e a modalidade como âncora, sem alterar comportamento visível para clubes monomodalidade.
- **Entidades/ficheiros:** `prisma/schema.prisma` (novos: `Seccao`, `MembroSeccao`, enums `Modalidade`, `PapelSeccao`; `AmbitoPerfil` ganha `SECCAO`; `Escalao.seccaoId`; migração aditiva + **backfill** que cria uma secção FUTSAL por clube e liga os escalões — Apêndice C); `lib/modalidade.ts` (registry `ConfigModalidade` — secção 20.3; helper `modalidadeDoEscalao`); `lib/permissoes*.ts` (âmbito `SECCAO`, `seccoesCoordenadas`, `exigirCapacidade` com secção; capacidade `CLUBE_SECCOES`); `lib/actions/seccoes.ts` (`listarSeccoes`, `criarSeccao`, `atualizarSeccao`, `apagarSeccao`, `atribuirCoordenador`, `removerCoordenador`, `garantirSeccaoParaModalidade`); `lib/actions/escaloes.ts` (`criarEscalao` cria/garante a secção); `lib/actions/onboarding.ts`/`contas.ts` (registo Individual escolhe modalidade → cria secção); perfil de arranque **Coordenador de Secção** (`lib/permissoes-catalogo.ts`); UI mínima (`/definicoes/seccoes` — §8.22; seletor de secção condicional).
- **Critério de pronto:** migração aditiva aplicável; backfill idempotente; `@@unique([clubeId, modalidade])`; um clube 100% futsal continua a funcionar **sem qualquer UI nova**; testes de secção/permissões/backfill; **typecheck/lint/test limpos + bíblia atualizada (§3.1.1, §6.9, §8.22, Apêndice C)**; **não toca em auth**.

**Fase 26 — Campo de futebol SVG (todos os formatos).**
- **Depende de:** Fase 25.
- **Objetivo:** o editor de campo passa a desenhar os fundos de futebol (3×3 a 11×11), reutilizando todo o motor de elementos/passos/animação.
- **Entidades/ficheiros:** `components/campo/` (generalização `CampoFutsal`→`CampoDesenho`/`CampoFutebol`; parâmetro `campo`/`TipoCampo`; fundos por formato — Apêndice B); `DiagramaCampo.campo` (schema Zod + retrocompatibilidade FUTSAL_5); `MiniaturaCampo`/`EditorCampo` recebem o formato; `lib/schemas/exercicio.ts` (validação do `campo`).
- **Critério de pronto:** todos os fundos (Apêndice B) renderizam corretamente; diagramas legados sem `campo` assumem FUTSAL_5; hit area/escala coerentes (1u=10cm); animação e teclado funcionam em todos os campos; testes de `construirKeyframes`/`campo`; **typecheck/lint/test limpos + bíblia atualizada (§11.5)**; **não toca em auth**.

**Fase 27 — Posições e plantel multi-desporto.**
- **Depende de:** Fase 25.
- **Objetivo:** posições de futebol no enum e na UI; plantel e participações a respeitar a secção/modalidade.
- **Entidades/ficheiros:** `Posicao` (enum expandido — §3.2); `LABEL_POSICAO` agrupado por modalidade; seletor de posição filtrado pela modalidade; `lib/actions/atletas.ts`/`participacoes.ts` (invariante do principal **por modalidade** — §9); `lib/actions/atletas.ts` `listarAtletas` agrupado por secção; perfil do atleta com estatísticas/caderneta/percurso segmentados por modalidade (UI).
- **Critério de pronto:** um atleta pode ter participações em secções diferentes; invariante do principal por modalidade coberto por testes (transação Serializable); seletor de posições correto por modalidade; **typecheck/lint/test limpos + bíblia atualizada (§3.2, §8.5, §9)**; **não toca em auth**.

**Fase 28 — Jogos e estatísticas de futebol.**
- **Depende de:** Fases 25, 26 e 27.
- **Objetivo:** `Jogo.formato`, núcleo estatístico de futebol e registo ao vivo de futebol.
- **Entidades/ficheiros:** `Jogo.formato` (`FormatoJogo`) + derivação da secção + editável; `EstatisticaAtleta` (remates, cantos, foras-de-jogo, desarmes); `EventoJogo`/`TipoEventoJogo` (REMATE/CANTO/FORA_DE_JOGO/DESARME); grelha de estatísticas mostra o núcleo da modalidade (oculta faltas por parte em futebol); `MetricaConfig.modalidade`; agregações (`lib/estatisticas.ts`, `lib/actions/analise.ts`) com núcleo por modalidade e `MINUTOS_POR_BLOCO` parametrizável por formato (⚠️ §10.8); vista de dia de jogo com posições de futebol.
- **Critério de pronto:** jogos de futebol registam o núcleo correto; jogos de futsal inalterados; agregações e cards sociais corretos por modalidade; testes de agregação de futebol; **typecheck/lint/test limpos + bíblia atualizada (§3.7, §8.11, §10.4, §10.8)**; **não toca em auth**.

**Fase 29 — Conteúdo curado de futebol (exercícios, templates, caderneta).**
- **Depende de:** Fase 25.
- **Objetivo:** biblioteca curada e habilidades de futebol, para que uma secção de futebol nunca comece vazia.
- **Entidades/ficheiros:** `Exercicio.modalidade`/`ModeloSessao.modalidade`/`Habilidade.modalidade`; `lib/biblioteca-arranque.ts`/`lib/templates-arranque.ts` (conteúdo de futebol por formato/parte do treino); `instalarBibliotecaArranque(modalidade)`/`instalarTemplatesArranque(modalidade)`; seed por modalidade; filtros de biblioteca por modalidade (UI §8.6/§8.7); caderneta de futebol (§8.14).
- **Critério de pronto:** instalar a biblioteca de futebol é idempotente; filtros por modalidade funcionam; exercícios de futebol usam o campo correto; **typecheck/lint/test limpos + bíblia atualizada (§3.3, §3.4, §8.6, §8.7, §8.14, Apêndice B)**; **não toca em auth**.

**Fase 30 — Onboarding, navegação e billing multi-secção.**
- **Depende de:** Fases 25, 26, 27, 28 e 29.
- **Objetivo:** experiência de ponta a ponta multi-desporto e pricing por secção.
- **Entidades/ficheiros:** onboarding (registo Individual = modalidade; setup de clube com secções); seletor de secção condicional em toda a navegação (barra de topo, plantel, treinos, jogos, exercícios, analytics); agrupamento por secção; analytics de clube com filtro/comparação por secção (§10.3/§10.8); wizard «Nova Época» a respeitar secções (§8.21); licenciamento (§17.1 — Individual uma modalidade; Clube escala por secção; `Licenca.modalidade` ⚠️); Coordenador de Secção end-to-end (atribuição, gating de UI).
- **Critério de pronto:** clube com futsal **e** futebol totalmente utilizável; Individual bloqueia segunda modalidade com mensagem clara; pricing por secção documentado e refletido (aviso suave, enforcement de billing deferido); analytics transversal compara secções; **typecheck/lint/test limpos + bíblia atualizada (§8.1.1, §8.21, §10.3, §17)**; **não toca em auth**.

---

## 17. Modelo de negócio e licenciamento

### 17.1 Duas licenças (🔁 v7 — multi-secção)
- **Individual (Treinador):** acesso completo ao produto de treinador, **para uma modalidade** (futsal **ou** futebol, escolhida na compra). **Sem** gestão de clube. Sem trial. **€4,99/mês** ou **€49/ano** (preço **mantém-se**, independentemente da modalidade). **Não** permite gerir as duas modalidades — para isso, licença de Clube.

> **Treinador individual e duas modalidades:** a licença Individual suporta uma única modalidade. Um treinador que dirija escalões de futsal e de futebol em simultâneo DEVE usar uma licença de Clube (ou Clube Técnico). Esta decisão é intencional: a gestão de duas secções implica funcionalidades de coordenação (permissões, analytics cruzados) que a licença Individual não comporta. A persona do treinador dual-sport individual é reconhecida e o seu caminho natural é o Clube Técnico (sem atletas, só escalões do próprio treinador).
- **Clube:** produto de treinador completo + **camada de gestão de clube** (secções, escalões, membros, perfis, branding, analytics, relatórios), com **uma ou várias secções**. **Tiers por número de escalões** (transversal às secções):

| Tier | Limite de escalões (total, todas as secções) | Mensal | Anual |
|---|---|---|---|
| **Pequeno** | ≤ 2 | €15 | €149 |
| **Médio** | ≤ 4 | €19 | €190 |
| **Grande** | ≤ 8 | €34 | €340 |
| **Parceiro** | negociado | negociado | negociado |

**🔁 Escala por secção/modalidade (decisão 2026-08-19 — fechada):** **Clube multi-secção:** o preço da segunda secção (modalidade adicional) é **+50% do tier base do clube**. Exemplo: clube com 3 escalões (tier Base €15/mês) que adiciona secção de futebol paga €22,50/mês. O sistema calcula automaticamente com base no tier da secção mais cara + 50% por cada secção adicional. O enforcement de billing ocorre na Fase 30.
- **1 secção:** preço do tier conforme a tabela acima (comportamento atual da v6).
- **2+ secções:** tier da secção mais cara + **50% por cada secção adicional**. O tier de cada secção é determinado pelo **nº de escalões** dessa secção.
- **Parceiro:** pricing multi-secção negociado.
- **Enforcement:** deferido até à **Fase 30** (com o Paddle); na versão atual há **aviso suave** ao criar escalões/secções além do plano. O modelo de dados (`Licenca`, tiers) suporta o cálculo por secção.

O tier **Parceiro** inclui features custom, **voz no roadmap** e reuniões periódicas.

### 17.2 Modelo de dados único (multi-tenant)
- O **`Clube` é sempre o tenant de topo**, mesmo na licença Individual (clube técnico invisível). **🔁 v7:** o clube técnico Individual tem **uma única secção** (a modalidade contratada).
- **Conta única por email pessoal.**
- A licença técnica fica modelada em `Licenca` (3.11); o enforcement efetivo entra com o billing. **🔁** `Licenca.modalidade` (ou derivação da secção do clube técnico) regista a modalidade Individual contratada (⚠️ 3.11).

### 17.3 Propriedade do conteúdo NÃO está ligada à licença
Decidida pelo treinador na criação (toggle pessoal vs clube). O pagamento não transfere o trabalho criativo. A biblioteca pessoal é sempre do treinador e viaja com ele (**futsal e futebol**); a do clube é a filosofia do clube.

### 17.4 Subscrições e absorção
- **Absorção:** crédito proporcional para a **carteira** (`CREDITO_ABSORCAO`). **🔁** se a modalidade da licença Individual absorvida não coincidir com nenhuma secção do clube, o clube cria a secção correspondente ao absorver o treinador (ou o treinador escolhe a secção onde entra).
- **Reembolso real:** só por pedido manual via email.
- **Clube paga preço normal.** **Sair do clube:** reativa a Individual por conta própria.

### 17.5 Billing
- **Provider:** **Paddle** (Merchant of Record). **Implementação deferida.** `Licenca`/`Carteira` desenhadas para suportar webhooks, `paddleSubscriptionId`, `paddleCustomerId` — e o **cálculo multi-secção** (17.1).

### 17.6 Go-to-market
- Sem trial. Vídeo demonstrativo público. Reunião de demonstração a pedido. Parceiros fundadores (patrocínio mútuo). Suporte via WhatsApp. **🔁** a mensagem passa a incluir "futsal **e** futebol" — atrai clubes com as duas modalidades.

---

## 18. Roadmap futuro (fora da versão atual)

- **Quotas/mensalidades do clube** (o clube a cobrar aos pais).
- **App móvel nativa** (iOS/Android) — a PWA é suficiente por agora.
- **App/portal de pais e atletas.**
- **IA generativa** de exercícios/sessões/relatórios (plugin pago).
- **Análise de vídeo.**
- **GPS/wearables, wellness, RPE avançado.**
- **Gestão clínica/lesões avançada.**
- **Multi-idioma / multi-moeda.**
- **Integração automática com APIs de competições oficiais** (classificações/calendários) — de futsal **e** de futebol.
- **Portal de desporto** (projeto separado, potencial parceria).
- **Biblioteca partilhada/comunidade** de exercícios (em avaliação).
- **App via APK** (embrulho TWA/Capacitor da PWA).
- **🔁 Novos desportos** além de futsal e futebol (a arquitetura de secção/registry `ConfigModalidade` — secção 20 — está preparada; nenhum entra na versão atual).

## 19. Changelog da documentação

Do mais recente para o mais antigo.

- **2026-08-19** — **Fase 27 (código) — Posições e plantel multi-desporto (backend).** Lógica de negócio multi-desporto no plantel/participações; invariante do principal **por modalidade** (§9, Apêndice C B3) e validação posição↔modalidade (§2.3/§3.2/§9). **Não toca em auth.**
  - **`lib/actions/participacoes.ts` — invariante do principal POR MODALIDADE (§9).** `associarAEscalao` passa a correr numa transação **Serializable**: lê os `AtletaEscalao` PRINCIPAL ativos do atleta na época (com `escalao.seccao.modalidade`) e, se **não** existir principal na modalidade do escalão destino, cria a participação como **`PRINCIPAL`** — única exceção à regra «associar nunca força principal» (B3). Se já existir principal nessa modalidade, mantém o tipo pedido (`SIMULTANEA`/`OCASIONAL`). `transferirEscalao` passa a aplicar o invariante **dentro da modalidade de destino**: só as participações dessa modalidade entram em `ficariaSemPrincipal`/`principaisADespromover` — uma transferência dentro do futsal já **não despromove** o principal de futebol (e vice-versa). Escalões sem secção (fase expand, antes do backfill) formam o seu próprio balde de modalidade (`null`). `terminarParticipacao` inalterado (recusar terminar qualquer `PRINCIPAL` já é correto por modalidade).
  - **`lib/actions/atletas.ts` — `listarAtletas` por secção + modalidade (§8.5).** Novo 3.º parâmetro opcional `seccaoId?`: quando presente, restringe os atletas às participações ativas em escalões dessa secção (`participacoes.some.escalao.seccaoId`). `ParticipacaoResumo` ganha o campo **`modalidade: Modalidade | null`** (derivado de `escalao.seccao.modalidade`), incluído em todas as leituras que usam `paraResumo` (`listarAtletas`, `obterAtleta`) para a UI poder agrupar/segmentar por modalidade.
  - **`lib/actions/atletas.ts` — validação posição↔modalidade (§9).** `criarAtleta` valida que as `posicoes` declaradas pertencem à modalidade do escalão inicial; `atualizarAtleta` valida contra a **união** das modalidades das participações ativas do atleta (multi-desporto). Posição inválida → `erro("Posição inválida para esta modalidade")` com `camposInvalidos.posicoes`. Sem secção determinável, a validação é saltada. `GUARDA_REDES` e `UNIVERSAL` são partilhados (válidos em ambas).
  - **`lib/schemas/atleta.ts` — `posicoesPorModalidade(modalidade)`** (§2.3/§3.2): futsal `{GR, Fixo, Ala, Pivô, Universal}`; futebol `{GR, Defesa central, Laterais, Médios, Extremos, Avançado, Universal}`; sem modalidade devolve todas sem duplicar as partilhadas. Fonte única do seletor de posições e da validação.
  - **Testes:** invariante do principal por modalidade + B3 (`associar` força/mantém principal por modalidade; `transferir` não toca noutra modalidade), validação posição↔modalidade (`criarAtleta`), `posicoesPorModalidade`, e `listarAtletas` (filtro de secção + inclusão da modalidade). **typecheck/lint/test limpos — 1104 testes.**
- **2026-08-19** — **Fase 29 (código) — Conteúdo curado de futebol (exercícios, subcategorias, templates, caderneta).** Populado o conteúdo de arranque de **futebol**, equivalente ao de futsal, marcado com `modalidade: "FUTEBOL"` (§3.3/§3.4/§3.8) e `origemSeed`/`sistema` (sem migração — campos já existentes desde a Fase 25). **Não toca em auth.**
  - **Novo `lib/biblioteca-arranque-futebol.ts`**: dados curados + instaladores idempotentes por clube. **15 exercícios** (`EXERCICIOS_ARRANQUE_FUTEBOL`) distribuídos por parte do treino e categoria de núcleo (as áreas do plano — aquecimento/técnica/tática coletiva/bolas paradas/físico/guarda-redes — mapeiam para `CategoriaExercicioPrincipal` + `ParteTreino`, já que o enum não tem valores `AQUECIMENTO`/`TECNICA`/`TATICA_COLETIVA`): Rondos 4v2, Jogo de Posição 5v5 (AQUECIMENTO); Controlo orientado com condução, Passe e movimento (combinações), Finalização com cruzamento (TÉCNICA/ATAQUE); Pressing alto em bloco (DEFESA), Saída a jogar pelo GR (ATAQUE), Transição rápida ofensiva (TRANSICAO); Canto directo ao primeiro poste, Livre lateral em zona 3, Penálti: rotinas do executante (BOLAS_PARADAS); Sprints curtos com bola, Resistência com posse (FISICO); Saídas a cruzamentos, Jogo com os pés — construção (GUARDA_REDES). Exercícios sem diagrama (`diagrama: null` até ao editor de campo de futebol, Fase 26).
  - **13 subcategorias** (`SUBCATEGORIAS_ARRANQUE_FUTEBOL`, `sistema: true`): BOLAS_PARADAS (Canto, Livre directo, Livre indirecto, Lançamento de linha, Pontapé de baliza, Penálti); tática coletiva → DEFESA (Pressing) / ATAQUE (Saída a jogar) / TRANSICAO (Transição O→D, Transição D→O); GUARDA_REDES (Saídas, Jogo com os pés, Defesa de penálti).
  - **15 habilidades** (`HABILIDADES_ARRANQUE_FUTEBOL`, caderneta §8.14) em 3 níveis: BASICO (Passe curto, Controlo de bola, Condução com ambos os pés, Posição base, Posicionamento GR); INTERMEDIO (Passe longo, Recepção orientada, Drible 1v1, Cabeceamento básico, Saídas a cruzamentos); AVANCADO (Passe entre linhas, Jogo de costas, Finalização com ambos os pés, Bola parada executante, Jogo com os pés).
  - **`lib/templates-arranque.ts`**: novo `TEMPLATES_ARRANQUE_FUTEBOL` (3 templates, `modalidade: "FUTEBOL"` carimbada na instalação): "Treino de posse e pressão" (sub-15), "Treino de finalização" (sub-13), "Treino de bolas paradas" (sub-17). Cada template referencia por nome exato exercícios de `EXERCICIOS_ARRANQUE_FUTEBOL`.
  - **Instaladores idempotentes** (`instalarSubcategoriasFutebol`, `instalarBibliotecaArranqueFutebol`, `instalarTemplatesArranqueFutebol`, `instalarHabilidadesFutebol`, orquestração `instalarConteudoArranqueFutebol`): recebem `clubeId` e um cliente Prisma injetável (default = singleton `@/lib/db`; permite injeção nos seeds); idempotência por `(clubeId, nome[, categoria/modalidade])` — a 2.ª corrida cria 0. O criador/autor do conteúdo é o primeiro membro do clube.
  - **`prisma/seed.ts`**: o seed de demonstração passa a criar uma **secção FUTEBOL** ("Futebol") com um escalão "Sub-15 (Futebol)" e a instalar o conteúdo curado de futebol via `instalarConteudoArranqueFutebol`.
  - **`tests/biblioteca-futebol.test.ts`** (novo): integridade dos dados (categorias/níveis/partes válidos, sem duplicados, referências cruzadas exercícios↔templates↔subcategorias) e idempotência dos instaladores com um Prisma em memória. **1104 testes verdes; typecheck e lint limpos.**

- **2026-08-19** — **Fase 26 (frontend) — campo de futebol SVG, todos os formatos (§11.5, Apêndice B).** O editor/diagrama de campo passa a suportar todos os `FormatoJogo` (**não toca em auth**):
  - **`components/campo/desenho.tsx`**: `LinhasCampo` passa a receber `formato?: FormatoJogo` (ausente → `FUTSAL_5`, retrocompatível — Apêndice C) e despacha para o fundo correto. O fundo de futsal (quartos de círculo de 6 m + 2.ª penalidade) foi extraído para `FundoFutsal5`; adicionado `FundoFutebol` genérico configurado por formato (`CFG_FUTEBOL_3_3/5_5/7/9/11`) com helpers `Relvado`/`Baliza`/`AreaRect`/`MarcaPenalti`/`ArcoPenalti`. Marcações por formato conforme Apêndice B: 3×3 minimal (meio-campo + balizas pequenas, sem áreas nem círculo central); 5×5 (círculo central + pequenas áreas); 7 e 9 (círculo central + grande área + penálti); 11 (grandes + pequenas áreas + penáltis + arcos). Novo helper exportado `rotuloCampo(formato)` (aria-labels pt-PT: "campo de futsal"/"campo de futebol de 3…11").
  - **Decisão de escala (⚠️ desvio consciente):** o **espaço de coordenadas interno mantém-se 400×200 para todos os formatos** (não os `viewBox` por formato listados a título de referência em §11.5/Apêndice B). Fundamento: o schema do diagrama fixa (e testa) as coordenadas dos elementos em `0–400 / 0–200`, e a Fase 26 só toca no campo `campo` do schema; manter o espaço 400×200 garante retrocompatibilidade total e mantém a escala de *hit-area*, o teclado e a animação idênticos entre modalidades. As marcações de futebol são desenhadas em proporção reconhecível dentro dessa caixa (o `viewBox` real por formato — e o `1u=10cm` exato para campos grandes — fica para a Fase 28, quando `Jogo.formato` obrigar à colocação de elementos em toda a área).
  - **Novo `components/campo/CampoDesenho.tsx`**: render estático genérico (resolve `formato` por prop → `diagrama.campo` → `FUTSAL_5`). **`components/campo/CampoFutsal.tsx`** passa a ser alias fino de `CampoDesenho` (assinatura histórica preservada + `formato` opcional).
  - **`MiniaturaCampo`, `CampoAnimado`, `EditorCampo`**: aceitam `formato?: FormatoJogo` e passam-no a `LinhasCampo`/aria-label (derivação `prop → diagrama.campo → FUTSAL_5`). O `EditorCampo` **preserva o `campo`** em todas as gravações (`snapshotAtual`, `aplicarElementos`, `aplicarPassos`, `limparTudo`) e aceita um `formato` de contexto para carimbar novos diagramas de futebol.
  - **`lib/schemas/exercicio.ts`**: `diagramaSchema` ganha `campo: z.nativeEnum(FormatoJogo).optional()` (`TipoCampo` alinha com `FormatoJogo`; ausente/legado → `FUTSAL_5`). Nenhuma outra alteração ao schema (coordenadas dos elementos inalteradas).
  - **`vitest.config.ts`**: `esbuild.jsx = "automatic"` para os testes poderem renderizar componentes (React 19 usa o runtime automático). **Novo `tests/campo-fundos.test.ts`** (19 testes): cada formato renderiza sem erros; retrocompat (`sem formato === FUTSAL_5`); estrutura de marcações distinta por formato; `rotuloCampo`; resolução de `formato` em `CampoDesenho`/`MiniaturaCampo`/`CampoFutsal`; `diagramaSchema.campo` (aceita legado sem `campo`, aceita os 6 formatos, rejeita valor inválido). `typecheck` limpo; **suite completa verde (1104 testes)**.
  - **Nota (dependências de fase):** ligar o `formato` do contexto (exercício/modelo de jogo/jogo) ao `EditorCampo`/`CampoDesenho` nas páginas consumidoras pertence às fases de conteúdo/jogos (28/29); a Fase 26 entrega o motor de fundos e a retrocompatibilidade. Ficheiros de `lib/actions/` e `components/plantel/` são de agentes paralelos.
- **2026-08-19** — **Fase 27 (frontend) — plantel e posições multi-desporto (§3.2, §8.5, §9).** UI do plantel adaptada à secção/modalidade (**não toca em auth**):
  - **`lib/schemas/atleta.ts`**: `posicaoEnum` deixa de estar limitado ao futsal e passa a derivar de `z.nativeEnum(Posicao)` — o modelo do atleta aceita agora posições de futebol (§3.2; um atleta multi-desporto guarda todas em `Atleta.posicoes`). Novos `POSICOES_FUTSAL`, `POSICOES_FUTEBOL` (ambos incluem os partilhados GUARDA_REDES/UNIVERSAL) e helper `posicoesPorModalidade(modalidade)` (sem modalidade → todas). Teste `schemas.test.ts` atualizado (posição inválida passa de `AVANCADO`, agora válida, para `LIBERO`; novo caso a aceitar posições de futebol).
  - **`components/plantel/AtletaForm.tsx`**: o seletor de posições filtra as opções pela **modalidade do escalão selecionado** (na criação); na edição (sem escalão em contexto) mostra todas. Seleções ativas fora da modalidade em contexto permanecem visíveis (nunca se escondem). A prop `escaloes` passa a trazer `modalidade`.
  - **Novo `lib/modalidade-escalao.ts`** (helpers puros, sem Server Actions): `mapaModalidadePorEscalao` e `escaloesComModalidade`, para os Server Components enriquecerem escalões com a modalidade da secção sem tocar nas actions. Usado em `plantel/novo`, `plantel/[id]/editar`, `plantel` e `plantel/[id]`.
  - **`app/(app)/plantel/page.tsx`**: quando o clube tem escalões em **2+ secções**, a lista passa a ter **tabs de dois níveis** — 1.º nível por secção (com badge de modalidade), 2.º nível pelos escalões da secção ativa; com uma só secção mantém-se o comportamento atual. Filtragem de atletas por secção feita no Server Component (por cruzamento escalão→secção, sem alterar `listarAtletas`).
  - **Novo `components/plantel/BadgeModalidade.tsx`**: indicador de modalidade (emoji decorativo + rótulo pt-PT; `sr-only` no modo compacto). Mostrado nas tabs de secção/escalão e nos cartões de atleta quando o clube é multi-secção.
  - **`components/plantel/CadernetaAtleta.tsx` + `app/(app)/plantel/[id]/page.tsx`**: caderneta **segmentada por modalidade** — filtro Todas/Futsal/Futebol visível apenas para atletas com participações em 2+ modalidades; habilidades universais (`modalidade` null) aparecem em todas. As modalidades do atleta derivam das secções dos escalões das suas participações.
  - **Nota (dependências de fase):** a segmentação das **estatísticas** do perfil por modalidade depende de agregações por modalidade nas Server Actions (`obterEstatisticasAtleta`/analytics), que pertencem à **Fase 28** (Jogos e estatísticas de futebol) — não há ainda jogos de futebol no sistema; esta fase entrega a segmentação da **caderneta** (dados já disponíveis via `Habilidade.modalidade`). `typecheck` limpo; testes do domínio do plantel (`schemas`, `atletas`, `caderneta`, `habilidades`) verdes (79). Ficheiros de `lib/actions/` (invariante do principal por modalidade), `components/campo/` (Fase 26) e conteúdo curado (Fase 29) são de agentes paralelos.
- **2026-08-19** — **Fase 25 (código) — actions de secção e gestão de escalões por âmbito SECCAO.** Implementados os bloqueadores de QA da Fase 25 (§6.9, §8.1.1; **não toca em auth**):
  - **Novo `lib/actions/seccoes.ts`**: `garantirSeccaoParaModalidade(modalidade)` (upsert idempotente por `@@unique[clubeId, modalidade]`, usado no onboarding e em `criarEscalao`), `obterSeccoes()` (secções do clube com coordenadores), `atribuirCoordenadorSeccao({ seccaoId, membroClubeId, papel })` e `removerMembroSeccao({ seccaoId, membroClubeId })`. **Nota de terminologia:** a gestão de coordenadores exige **`CLUBE_UTILIZADORES`** (gestão de membros, §8.2) — a capacidade `CLUBE_SECCOES` referida em §6.9/§7.3/§8.4 **não existe** no catálogo `lib/permissoes-catalogo.ts`; as funções seguem os nomes pedidos na Fase 25 (`atribuirCoordenadorSeccao`/`removerMembroSeccao`/`garantirSeccaoParaModalidade`/`obterSeccoes`), que divergem dos rótulos de referência de §7.3 (`atribuirCoordenador`/`removerCoordenador`/`criarSeccao`/…).
  - **`lib/actions/escaloes.ts`**: as mutações (`atualizarEscalao`, `definirVisibilidadeEscalao`, `apagarEscalao`, `moverEscalao`) passam a aceitar **`SECCAO_ESCALOES_GERIR`** (resolvido por `exigirCapacidade` contra `escalao.seccaoId ∈ seccoesCoordenadas`) **ou** `CLUBE_ESCALOES` (nível clube), via helper `exigirGestaoEscalao`. `criarEscalao` passa a atribuir `seccaoId` (do payload ou derivado de `garantirSeccaoParaModalidade(FUTSAL)`) e valida o âmbito de secção do Coordenador na criação.
  - **`lib/schemas/escalao.ts`**: novo `criarEscalaoSchema` (= base + `seccaoId?` opcional); `escalaoSchema` (update) inalterado.
  - **`lib/permissoes-catalogo.ts`**: `PerfilArranque.ambito` alargado a `SECCAO`; adicionado o perfil de arranque **"Coordenador de Secção"** (âmbito `SECCAO`, capacidade `SECCAO_ESCALOES_GERIR`). Testes atualizados (`escaloes.test.ts`, `novaEpoca.test.ts`: 5 perfis de arranque). **1055 testes verdes.**
- **2026-08-19** — **Fase 25 (código) — labels/UI dos novos enums de futebol.** Adicionadas as entradas em falta nos `Record<Enum,…>` exaustivos para as 9 novas posições de futebol (`DEFESA_CENTRAL`, `LATERAL_DIREITO`, `LATERAL_ESQUERDO`, `MEDIO_DEFENSIVO`, `MEDIO_CENTRO`, `MEDIO_OFENSIVO`, `EXTREMO_DIREITO`, `EXTREMO_ESQUERDO`, `AVANCADO`) em `LABEL_POSICAO`/`ABREV_POSICAO` (`lib/schemas/atleta.ts`, rótulos pt-PT §2.3/§3.2; abreviaturas DC/LD/LE/MD/MC/MO/ED/EE/AV) e para os 4 novos eventos de futebol (`REMATE`, `CANTO`, `FORA_DE_JOGO`, `DESARME`) em `LABEL_TIPO_EVENTO` (`lib/schemas/jogo.ts`), `EMOJI_EVENTO` (`components/jogos/TimelineEventos.tsx`: 🎯/🚩/🚫/🛡️) e `EVENTO_TIPOS` (`lib/actions/analise.ts`) — §3.7. Teste `jogos-f5.test.ts` atualizado (posição inválida passa de `"AVANCADO"`, agora válida, para `"LIBERO"`). **Não toca em auth.**
- **2026-08-19** — **v7 — Revisão pós-auditoria.** Correções e decisões incorporadas na bíblia v7 (só documentação; **não toca em auth**):
  - **(B1)** Colisão de nome resolvida: o campo de formato de jogo em `Competicao` passa a **`formatoJogo FormatoJogo?`** (distinto do já existente `formato FormatoCompeticao` LIGA/TORNEIO/TACA) — §3.7, §19(D), Apêndice C.3.
  - **(B2)** Coordenador de Secção ganha **capacidade dedicada `SECCAO_ESCALOES_GERIR`** (âmbito `SECCAO`) em vez de `CLUBE_ESCALOES` restringido; `CLUBE_*` mantém-se sempre de nível clube — §6.2, §6.3, §6.6, §6.9. Uma pessoa pode ter `MembroSeccao` em múltiplas secções (raro, válido).
  - **(B3)** Regra do **primeiro principal de uma modalidade nova**: `associarAEscalao` cria `PRINCIPAL` automaticamente quando não há principal activo nessa modalidade (única excepção) — §9.
  - **(B4)** **Pré-requisito de migração**: concluir o *contract* v6 pendente (`Clube.clubeTecnico`, `Atleta.clubeId` NOT NULL, remover `Atleta.escalaoId` legado, `Exercicio.proprietario @default(TREINADOR)`) antes das migrações v7 — §0, Apêndice C.
  - **(D1)** **Pricing multi-secção fechado**: 2.ª secção = **+50% do tier base** (tier da secção mais cara + 50% por secção adicional); enforcement na Fase 30 — §17.1.
  - **(D2)** Persona do **treinador individual dual-sport**: Individual = uma modalidade; para duas, licença de Clube/Clube Técnico — §1.7.4, §17.1.
  - **(D3)** Nova funcionalidade **modalidade da actividade** em `Sessao` e `Jogo` (`modalidadeAtividade Modalidade?`, null = herda da secção; badge quando difere) + breakdown analítico — §3.5, §3.7, §8.8, §8.11, §10.2, Apêndice C.3.
  - **(M1)** Modelo `Licenca`/`Carteira`/`MovimentoCarteira` **transcrito integralmente** em §3.11 + campos multi-secção (`modalidade`, `numSeccoes`).
  - **(M2)** **Dependências explícitas** entre Fases 26–30 — §16.
  - **(M3)** `TipoCampo` formalizado (alinha com `FormatoJogo`; sem `campo` → `FUTSAL_5`; genérico → campo neutro) — §11.2.
  - **(M4)** Mapeamento escalão↔formato de futebol corrigido (inclui **Juvenis** → `FUTEBOL_11`) — §2.3, Apêndice B.
  - **(M5)** Invariante do principal por modalidade: garantido por lógica aplicacional em transacção `Serializable` (não por índice BD); `modalidadeDoEscalao` cacheável — §9.
  - **(M6)** Invariantes cross-entidade validadas na aplicação (clube↔secção↔escalão; posição↔modalidade da convocatória) — §9.
  - **(M7)** `criarEscalao` bloqueia segunda modalidade em clube técnico Individual — §7.3.
- **2026-08-19** — **Criação da bíblia v7 (`FutsalManager_Spec_v7.md`) — Mister passa a plataforma multi-desporto (futsal + futebol).** Novo ficheiro que sucede à `FutsalManager_Spec_v6.md` (**mantida intacta como histórico**, à semelhança do que a v6 fez à v5). Atualização **só de documentação** (nenhuma alteração de código; **não toca em auth**). A v7 expande o produto de dedicado ao futsal para **multi-desporto**, mantendo **um único código, um único modelo de dados multi-tenant e a mesma filosofia**. Todas as decisões de produto abaixo estão **fechadas**.
  - **(A) Nota de versão v7 (§0):** resumo executivo das 12 adições e do princípio de compatibilidade **aditiva** (colunas/tabelas novas, nullable/default + backfill; dados existentes 100% futsal migram sem perda).
  - **(B) Nova entidade `Secção` (§3.1.1, §20.2):** camada entre `Clube` e `Escalão`, **âncora da modalidade**. `Seccao` = `clubeId` + `modalidade` (`Modalidade { FUTSAL FUTEBOL }`) + `nome?` + escalões + membros (coordenadores). **`@@unique([clubeId, modalidade])`** — **uma secção por modalidade por clube**. Novo `MembroSeccao` (vínculo membro↔secção, `PapelSeccao { COORDENADOR }`). `Escalao` ganha **`seccaoId`** + relação. Criação **automática/transparente** ao criar o primeiro escalão de uma modalidade (§8.1.1). Backfill: uma secção FUTSAL por clube existente, com todos os escalões ligados (Apêndice C).
  - **(C) Coordenador de Secção (§6.9, §6.6):** novo papel de arranque + novo valor de âmbito **`AmbitoPerfil.SECCAO`** (todos os escalões de uma secção) + nova capacidade **`CLUBE_SECCOES`**. Vê/gere todos os escalões da sua secção, não os das outras. `exigirCapacidade` (§6.7) e `obterMembroAtual` (§7.2) passam a resolver o âmbito de secção (`seccoesCoordenadas`).
  - **(D) Formatos de futebol (§3.7, Apêndice B):** enum **`FormatoJogo { FUTSAL_5 FUTEBOL_3_3 FUTEBOL_5_5 FUTEBOL_7 FUTEBOL_9 FUTEBOL_11 }`**. `Jogo.formato` e `Competicao.formatoJogo` (`FormatoJogo`) — pré-preenchidos pela secção do escalão, editáveis; determinam o campo do editor e o núcleo estatístico. (Em `Competicao` o campo é `formatoJogo`, distinto do já existente `formato FormatoCompeticao` LIGA/TORNEIO/TACA.)
  - **(E) Posições de futebol (§3.2):** `Posicao` expandido com `DEFESA_CENTRAL`, `LATERAL_DIREITO`, `LATERAL_ESQUERDO`, `MEDIO_DEFENSIVO`, `MEDIO_CENTRO`, `MEDIO_OFENSIVO`, `EXTREMO_DIREITO`, `EXTREMO_ESQUERDO`, `AVANCADO` (mantendo `GUARDA_REDES` e `UNIVERSAL` partilhados; futsal `FIXO`/`ALA`/`PIVO` intactos). Seletor filtra por modalidade do contexto.
  - **(F) Estatísticas de futebol (§3.7, §10.8):** mesmo princípio do futsal — **núcleo fixo** (golos, assistências, defesas GR, **remates, cantos, foras-de-jogo, desarmes**) + **configurável** por cima (`MetricaConfig`, opcionalmente por `modalidade`). `EstatisticaAtleta` ganha `remates/cantos/forasDeJogo/desarmes` (nullable). `TipoEventoJogo` ganha `REMATE/CANTO/FORA_DE_JOGO/DESARME`. `faltas1aParte`/`faltas2aParte` **só visíveis em FUTSAL**. Sem bloqueio de substituições (informativo).
  - **(G) Campo de futebol SVG (§11.5):** todos os formatos (3×3 a 11×11) no mesmo motor de diagrama; `DiagramaCampo.campo?` (`TipoCampo`) determina o fundo (retrocompatível: legados sem `campo` → FUTSAL_5). Coordenadas mantêm 1u=10cm.
  - **(H) Atleta multi-desporto (§1.7.3, §3.2, §9):** um único `Atleta` por pessoa; participações (`AtletaEscalao`) em escalões de secções diferentes. Invariante "participação principal única" passa a ser **por (atleta, época, modalidade)**. Estatísticas/caderneta **segmentadas por modalidade/secção** na UI (§8.5, §10.1, §10.8).
  - **(I) Licenciamento multi-secção (§17):** Individual = **uma** modalidade (preço mantém-se €4,99/mês·€49/ano); Clube = **uma ou várias secções** (tier por total de escalões; **acréscimo por secção adicional** recomendado ≈ +50% do tier; enforcement de billing deferido). `Licenca.modalidade` (⚠️) regista a modalidade Individual.
  - **(J) Nova secção 20 — Arquitetura multi-desporto e extensibilidade:** camadas agnóstica/parametrizável/específica (20.1); Secção como âncora + Coordenador (20.2); registry `ConfigModalidade` (20.3); como adicionar um novo desporto no futuro (20.4).
  - **(K) Apêndices:** A (Configuração de Futsal), B (Configuração de Futebol, todos os formatos), C (Matriz de migração v6→v7, aditiva + backfill).
  - **(L) Fases 25–30 (§16):** roadmap de expansão com objetivo, entidades/ficheiros e **critério de pronto** por fase (25 Fundação · 26 Campo de futebol · 27 Posições/plantel · 28 Jogos/estatísticas · 29 Conteúdo curado · 30 Onboarding/navegação/billing). Fase 25 é pré-requisito das restantes; todas **aditivas** e **sem tocar em auth**.
  - **Compatibilidade:** nenhuma alteração é destrutiva; a modalidade deriva **sempre** da secção do escalão (nunca do cliente); um clube/treinador monomodalidade não vê complexidade nova. **A partir da v7, esta é a bíblia ativa do produto.**

> **📌 Nota de preservação do histórico (v7):** seguindo a mesma convenção que a v6 usou para a v5, o **detalhe verbatim completo** de todas as entradas de changelog anteriores a 2026-08-19 permanece **intacto** em [`FutsalManager_Spec_v6.md`](./FutsalManager_Spec_v6.md) (mantida como histórico). Abaixo preserva-se o **índice completo** (data + título) de **todas** as entradas até 2026-08-18, para que a v7 continue auto-navegável. Nenhuma entrada foi omitida.

### 19.1 Histórico herdado da v6 (índice — detalhe verbatim em `FutsalManager_Spec_v6.md`)

- **2026-08-18** — Contacto na landing: formulário substituído por email direto (`app/page.tsx`).
- **2026-08-17** — Implementação da UI «Semana de trabalho» (§8.9.1).
- **2026-08-17** — Implementação da camada de Server Actions «Semana de trabalho» (§8.9.1).
- **2026-08-17** — Implementação do schema «Semana de trabalho» (§3.5, §8.9.1).
- **2026-08-16** — Implementação da UI do wizard «Nova Época» (§8.21) — cenários A/B/C.
- **2026-08-16** — Implementação da camada de servidor do wizard «Nova Época» (§8.21) — cenários A/B/C.
- **2026-08-16** — Implementação do mecanismo de snapshot §4.2.1 (`SessaoExercicio.snap*`).
- **2026-08-16** — Decisões de produto: semana de trabalho, propriedade/portabilidade definitiva, mecanismo de snapshot, propriedade da periodização e wizard «Nova Época» (§2, §3.3, §3.5, §4.2.1, §4.4, §8.4, §8.8, §8.9, §8.21).
- **2026-08-16** — Rótulo «Analytics» + redesign visual dos painéis + secção de Contacto na landing (§8.15, §10.2, landing).
- **2026-08-13** — F1.3 + F1.4 + F2.2 — Botão de download CSV, melhorias de impressão/PDF e tabela de ACWR individual (§8.15, §8.20).
- **2026-08-13** — F3.3 — Aviso não-bloqueante de conflito de pavilhão em `SessaoForm`/`JogoForm` (§8.16).
- **2026-08-13** — F1.1 + F1.2 — Export CSV dos analíticos: utilitário puro + Server Actions (§8.15).
- **2026-08-13** — Dois fixes de integridade de dados (`Reuniao.criadorId` FK + `Atleta.escalaoId` legado).
- **2026-08-13** — Cinco fixes visuais/UX (`Button` sm 44px, logótipo landing, cor de marca no `global-error`, agenda a todos os treinadores, Jogos na bottom-nav).
- **2026-08-13** — Fix visual da landing pública: fundo branco forçado independentemente do tema.
- **2026-08-13** — Fix de build: funções puras de carga de treino extraídas para fora do módulo de Server Actions (§8.20).
- **2026-08-12** — Testes de unidade para actions sem cobertura (P3.1).
- **2026-08-12** — Cards sociais nativos para Instagram: resultado, MVP e ranking (P4.7) (§3.16).
- **2026-08-12** — Análise de carga de treino: RPE / ACWR (P4.8) (§8.20).
- **2026-08-12** — Decisão documentada: escrita concorrente / audit log — last-write-wins aceite para o MVP (P3.3) (§13.4).
- **2026-08-12** — Enriquecimento do perfil do treinador: métricas de carreira + copiar link (P4.5) (§8.17).
- **2026-08-12** — Arranque de clube utilizável: semear época ativa + escalão e acionar o wizard de onboarding (P1.6+P1.7) (§8.1, §16 fase 20).
- **2026-08-12** — Perfil do treinador / histórico de carreira (P2.4) (§8.17).
- **2026-08-12** — Simplificação do `JogoForm`: agendar vs registar resultado (P4.3).
- **2026-08-12** — UI das métricas configuráveis nos analíticos (P1.9) (§10.1, §10.2).
- **2026-08-12** — Polish das presenças: marcar todos + barra de guardar fixa (P4.1+P4.2) (§8.5).
- **2026-08-12** — Touch targets a 44px em elementos interativos (P2.9) (§19.5).
- **2026-08-12** — `COMUNICACOES_GERIR` no perfil Treinador Principal (P1.8) (§6.6).
- **2026-08-12** — Sistema de Lembretes/Tarefas persistido (P2.1) (§3.15/§8.19).
- **2026-08-12** — Agenda agregada de todos os escalões (P2.2).
- **2026-08-12** — UI da visibilidade de escalão para outros treinadores (P2.8) (§6.4).
- **2026-08-12** — Filtro por competição nos analíticos de escalão (P2.5) (§10.2).
- **2026-08-12** — Aba «Carreira» no perfil do atleta (P2.3, §8.5).
- **2026-08-12** — Apagamento definitivo de atleta (hard-delete RGPD) (P1.3).
- **2026-08-12** — Contraste WCAG AA de texto branco sobre o laranja primário da marca (P2.7) (§12, §12.4).
- **2026-08-12** — Integridade referencial da BD: validação do índice de `AtletaEscalao` (P1.4) e constraints de FK em falta (P1.5).
- **2026-08-12** — Legibilidade da landing pública e da impressão/PDF de relatórios (§12.0/§12.4, §10.6/§10.7).
- **2026-08-12** — Integridade sessão↔periodização: só treinos NORMAL podem ter `planeamentoId` (model `Sessao`).
- **2026-08-11** — Agregação de métricas configuráveis nos analíticos (§10.1, §10.2).
- **2026-08-06** — F10 (Fase 20) — Frontend do onboarding com vitória rápida (§8.1, §16 fase 20).
- **2026-08-06** — F14 (Fase 24) — Tema escuro + motion subtil + dashboard melhorado + lembretes in-app (§12.0/§12.1, §12.4, §8.16, §13.1/§13.3).
- **2026-08-06** — F13 — Polish transversal de experiência (§13.1, §12.0, §16 fase 23 — subconjunto).
- **2026-08-06** — F9 (Fase 19) — Frontend de analytics em 3 níveis + relatório de época partilhável (§8.15, §10.1–10.7).
- **2026-08-06** — F9 (Fase 19) — Camada de servidor de analytics em 3 níveis + relatório de época partilhável (§3.10, §8.15, §10.1–10.6, §16 fase 19).
- **2026-08-06** — F6 (Fase 16) — Frontend de competições e classificação (§8.11, §16 fase 16).
- **2026-08-06** — F6 (Fase 16) — Camada de servidor de competições e classificação (§3.7, §8.11, §16 fase 16).
- **2026-08-06** — F6 (Fase 16) — Base de dados de competições e classificação por inserção manual (§3.7, §16 fase 16).
- **2026-08-06** — F5 (Fase 15) — Frontend de "dia de jogo": abas Plano, Ao Vivo, Scouting, tempos por blocos e cronologia (§3.7, §8.11, §10.4, §16 fase 15).
- **2026-08-06** — F5 (Fase 15) — Camada de actions de "dia de jogo", eventos ao vivo com bloco de tempo e scouting no jogo (§3.7, §16 fase 15).
- **2026-08-06** — F5 (Fase 15) — Camada de dados de "dia de jogo", scouting no jogo e tempos por blocos (§3.7, §16 fase 15).
- **2026-08-06** — F3 — Correções de code review (6 issues *major*) sobre as bibliotecas de exercícios e os templates de sessão.
- **2026-08-06** — F3 — Correção M4 da revisão de código: `parteTreino`/`escalaoAlvo` no formulário de exercício (§8.6).
- **2026-08-06** — F1/F0 — Correções minor da revisão de código: UI de overrides, gating de UI do plantel, revalidação e acessibilidade dos formulários de participação.
- **2026-08-06** — F3 — Cobertura de testes das bibliotecas e dos templates de sessão (QA).
- **2026-08-06** — F7 — UI do gerador de comunicações (WhatsApp).
- **2026-08-06** — F3 — UI das bibliotecas (🎒 pessoal / 🏛️ clube) e dos templates de sessão.
- **2026-08-06** — F1 — Correções de code review (6 issues *major*) sobre `AtletaEscalao` e overrides de membro.
- **2026-08-06** — F4 — UI do modelo de jogo (documento vivo) + editor de campo integrado.
- **2026-08-06** — F7 — Backend do gerador de comunicações (WhatsApp).
- **2026-08-06** — F3 — Backend das bibliotecas (🎒 pessoal / 🏛️ clube) e dos templates de sessão.
- **2026-08-06** — F4 — Backend do modelo de jogo (documento vivo) e dos quadros táticos.
- **2026-08-06** — F1 — UI do plantel alinhada com as participações (`AtletaEscalao`).
- **2026-08-06** — F7 M11 — Migração aditiva `f7_modelocomunicacao`.
- **2026-08-06** — F4 M8 — Migração aditiva `f4_modelojogo_quadro`.
- **2026-08-06** — F1 M3 — Switch de código para `AtletaEscalao`.
- **2026-08-06** — F3 M5 — Migração expand `f3a_exercicio_expand`.
- **2026-08-06** — F1 M2 — Migração expand `f1a_atletaescalao_expand`.
- **2026-08-06** — F8 — Integração Google Calendar (§3.12, §8.13, §16 fase 18) implementada.
- **2026-08-06** — F8 FE — UI de integração Google Calendar (§3.12, §8.13).
- **2026-08-05** — F2 — Editor de campo (gate de qualidade) (secção 11).
- **2026-08-05** — F0 — Fundação de permissões (concluído).
- **2026-08-05** — Criação da bíblia v6 (`FutsalManager_Spec_v6.md`).
- **2026-08-05** — Atualização maior: modelo de negócio, ecossistema e novas funcionalidades (pós-brainstorming).

> **Nota:** as entradas abaixo (até 2026-07-31) foram herdadas da `FutsalManager_Spec_v5.md` e mantêm-se como histórico do MVP e do produto final v1.

- **2026-08-02** — Preparação para deploy (Vercel). `binaryTargets` do Prisma; `docs/DEPLOY.md`.
- **2026-08-02** — Gráficos com a cor do clube + fluxo de entrada.
- **2026-08-02** — Rebranding: Mister → Mister + nova identidade visual.
- **2026-08-02** — Fix: sessão obsoleta em `criarClube`.
- **2026-08-02** — Sincronização da bíblia com o código (§3, §12, §5.5 RGPD).
- **2026-08-02** — Decisão RGPD — consentimento tratado pelo clube.
- **2026-08-02** — Auditoria de produção — Fases 0–6 (build, segurança, dados, ops, visual/a11y, testes). 51 testes.
- **2026-08-02** — Grupos D e E (categoria+subcategorias de exercício; gráficos SVG).
- **2026-08-02** — Grupo B (periodização smart + tipo de sessão).
- **2026-08-01** — Grupos A e C (modelo do atleta: posições múltiplas/escalão secundário/foto/encarregado; "Equipa técnica").
- **2026-08-01** — Fases 3–10 implementadas.
- **2026-07-31** — Fases 1–2 + bíblia completa.
- **2026-07-31** — Validação do modelo de dados e decisões de propriedade. *(A decisão "segue a licença" foi revogada em 2026-08-05 — ver §4.2.)*
- **2026-07-31** — Criação da bíblia v5.

---

## 20. Arquitetura multi-desporto e extensibilidade

> Esta secção fixa **como** o produto suporta múltiplas modalidades sem duplicar código, e como um novo desporto poderá ser acrescentado no futuro. É **prescritiva**.

### 20.1 Camadas: agnóstica / parametrizável / específica

O código organiza-se em **três camadas** face à modalidade (secção 1.7.6):

**1. Camada agnóstica — não sabe nada de modalidade.**
Funciona igual em qualquer desporto. Inclui: contas/autenticação, clubes, membros, perfis, **épocas**, **presenças**, **comunicação (WhatsApp)**, **reuniões**, **lembretes**, **caderneta** (a estrutura; o conteúdo pode ser específico), **licenciamento/carteira**, **relatório partilhável** (contentor), **dashboard** (temporal), **agenda/conflitos de pavilhão**. **Regra:** esta camada **nunca** ramifica por modalidade.

**2. Camada parametrizável — comporta-se conforme a modalidade via configuração.**
O comportamento muda por **dados de configuração** (registry `ConfigModalidade` — 20.3), não por `if (modalidade === …)` espalhados. Inclui: **estatísticas de núcleo** (que campos mostrar/agregar — §10.8), **posições** (que opções oferecer — §3.2), **formato de jogo** (`FormatoJogo` e minutos por bloco — §3.7/§10.8), **campo do editor** (fundo SVG por `TipoCampo` — §11.5), **biblioteca curada** (conteúdo por modalidade — §8.6/§8.7), **rótulos** (terminologia FPF por modalidade). **Regra:** a lógica lê a config da modalidade (derivada da secção); acrescentar/afinar uma modalidade é **editar a config**, não reescrever a lógica.

**3. Camada específica — regras que só existem numa modalidade.**
Exceções irredutíveis. Inclui: **faltas acumuladas por parte** e **power play/GR-jogador** (só futsal — §10.5); **foras-de-jogo, cantos, desarmes, remates** como **núcleo** (só futebol — §10.8). **Regra:** isolar em módulos/funções claramente marcados (⚽/🥅), acionados pela config da camada parametrizável; **nunca** contaminam a camada agnóstica.

> **Objetivo (DEVE):** minimizar a camada específica; a maioria das diferenças futsal↔futebol resolve-se na camada **parametrizável** (config), não em ramos `if`.

### 20.2 Secção como entidade e papel de Coordenador

- A **`Secção`** (§3.1.1) é a **única fonte de verdade da modalidade**. Tudo o que precisa de saber a modalidade sobe do `Escalao` → `Seccao.modalidade`. Não há campo `modalidade` disperso por atletas/jogos/exercícios (os campos `modalidade?` em exercício/template/métrica/habilidade são **de organização/filtro**, não de derivação operacional).
- **Invariante:** `@@unique([clubeId, modalidade])` — um clube tem no máximo uma secção por modalidade.
- **Onboarding transparente:** a secção nasce ao criar o primeiro escalão da modalidade (§8.1.1). Quem só faz uma modalidade nunca vê a secção.
- **Coordenador de Secção** (§6.9): âmbito `SECCAO` — "DT de uma modalidade". Escala organizações grandes/multi-desporto sem dar acesso ao resto do clube.
- **Autorização:** `exigirCapacidade` resolve `TODO_CLUBE`/`SECCAO`/`PROPRIOS_ESCALOES` (§6.7); a secção **nunca** é fonte de autorização por si só — é um filtro de contexto de UI (§5.4) validado no servidor pelo âmbito.

### 20.3 Registry `ConfigModalidade`

Módulo puro `lib/modalidade.ts` (sem `"use server"`, testável, importável no cliente) que centraliza a configuração de cada modalidade. Estrutura de referência (⚠️ afinar na implementação, fases 25–29):

```typescript
type Modalidade = "FUTSAL" | "FUTEBOL";

interface ConfigModalidade {
  modalidade: Modalidade;
  rotulo: string;                       // "Futsal" | "Futebol"
  formatosPermitidos: FormatoJogo[];    // FUTSAL: [FUTSAL_5]; FUTEBOL: [FUTEBOL_3_3..FUTEBOL_11]
  formatoPorDefeito: FormatoJogo;
  posicoes: Posicao[];                  // opções do seletor (inclui partilhadas)
  nucleoEstatistico: CampoEstatistica[];// campos de EstatisticaAtleta a mostrar/agregar (§10.8)
  eventosAoVivo: TipoEventoJogo[];      // subconjunto do enum relevante à modalidade
  mostraFaltasAcumuladas: boolean;      // true só futsal
  minutosPorBloco: Record<BlocoTempo, number> | ((formato: FormatoJogo) => Record<BlocoTempo, number>);
  campoPorFormato: Record<FormatoJogo, TipoCampo>; // fundo SVG do editor (§11.5)
  // biblioteca/rotulos curados podem ser referenciados por modalidade
}

const CONFIG_MODALIDADE: Record<Modalidade, ConfigModalidade> = {
  FUTSAL: { /* Apêndice A */ },
  FUTEBOL: { /* Apêndice B */ },
};

// Resolução operacional: sempre a partir da secção do escalão.
function configDaModalidade(m: Modalidade): ConfigModalidade { return CONFIG_MODALIDADE[m]; }
```

**Regras (DEVE):**
- A camada parametrizável (20.1) **lê sempre** a config via `configDaModalidade(modalidade)`, onde `modalidade` vem da secção do escalão em contexto — **nunca** hard-coded no fluxo.
- Adicionar/afinar uma modalidade = **editar `CONFIG_MODALIDADE`** (+ eventuais funções da camada específica), sem tocar na camada agnóstica.
- O registry é a **fonte única** que a UI (seletores, grelhas, editor) e as agregações consultam.

### 20.4 Como adicionar um novo desporto no futuro

> **FUTURO** (nenhum desporto além de futsal/futebol entra na versão atual — §1.6). A arquitetura fica preparada; os passos abaixo são o "manual" de extensão.

1. **Enum `Modalidade`:** acrescentar o novo valor (ex.: `ANDEBOL`). Migração aditiva.
2. **`FormatoJogo` / `TipoCampo`:** acrescentar os formatos e o(s) fundo(s) de campo do novo desporto (Apêndice B como modelo).
3. **`Posicao`:** acrescentar as posições próprias (partilhando `GUARDA_REDES`/`UNIVERSAL` se aplicável).
4. **`EstatisticaAtleta` / `TipoEventoJogo`:** acrescentar os campos/eventos de núcleo próprios (nullable, aditivos).
5. **`CONFIG_MODALIDADE`:** adicionar a entrada do novo desporto (rótulos, formatos, posições, núcleo estatístico, eventos, campo por formato, minutos por bloco).
6. **Camada específica:** isolar as regras irredutíveis do novo desporto (se existirem) em módulos marcados, acionados pela config.
7. **Campo SVG:** desenhar o(s) fundo(s) no `CampoDesenho` (11.5), mantendo 1u=10cm.
8. **Biblioteca curada + habilidades:** conteúdo de arranque do novo desporto (por formato/parte do treino).
9. **Licenciamento:** decidir a modalidade Individual e o pricing de secção (17.1).
10. **Testes + bíblia:** cobrir o novo desporto (schemas, agregações, autorização de secção) e atualizar esta bíblia (nova entrada de changelog + Apêndice próprio).

**Princípio-guia:** se o passo obriga a mexer na **camada agnóstica**, algo está errado — reavaliar para o resolver na config (parametrizável) ou numa função específica isolada.

---

## Apêndice A — Configuração de Futsal ⚽

Referência da entrada `CONFIG_MODALIDADE.FUTSAL` (registry — 20.3). Reflete o comportamento já existente (v6), agora explicitado como configuração.

- **Rótulo:** "Futsal".
- **Formatos permitidos:** `[FUTSAL_5]`. **Formato por defeito:** `FUTSAL_5`.
- **Campo (editor):** `FUTSAL_5` → 40×20 m, viewBox 400×200 (1u=10cm); meio-campo, círculo central (r=30), áreas de baliza (quarto de círculo 6 m), marca de grande penalidade (6 m), **segunda penalidade (10 m)**, balizas 3 m (§11.1).
- **Posições:** `GUARDA_REDES`, `FIXO`, `ALA`, `PIVO`, `UNIVERSAL`.
- **Núcleo estatístico (`EstatisticaAtleta`):** `golos`, `assistencias`, `faltasCometidas`, e (só GR) `defesas`, `golosSofridosGR`. **Não usa:** `remates`, `cantos`, `forasDeJogo`, `desarmes` (ficam a `null`).
- **Estatística de equipa (`Jogo`):** `faltas1aParte`, `faltas2aParte` (**faltas acumuladas por parte** — destaque à 5.ª). **`mostraFaltasAcumuladas = true`.**
- **Eventos ao vivo:** `GOLO`, `ASSISTENCIA`, `FALTA`, `CARTAO_AMARELO`, `CARTAO_VERMELHO`, `SUBSTITUICAO`, `DEFESA`, `GOLO_SOFRIDO`, `TIMEOUT`.
- **Camada específica:** faltas acumuladas por parte; **power play / GR-jogador** (derivado dos eventos de substituição — §10.5); quintetos/rotações.
- **Tempo por bloco (`minutosPorBloco`):** `JOGO_COMPLETO=40`, `MEIA_PARTE=20`, `BLOCO_10MIN=10`, `BLOCO_5MIN=5`, `NAO_JOGOU=0` (§10.1).
- **Biblioteca curada / caderneta:** conteúdo de futsal (v6 — `lib/biblioteca-arranque.ts`, `lib/templates-arranque.ts`).

## Apêndice B — Configuração de Futebol 🥅 (todos os formatos)

Referência da entrada `CONFIG_MODALIDADE.FUTEBOL` (registry — 20.3). **Produto final — todos os formatos.** Dimensões de **referência** (a formação juvenil varia por associação; ⚠️ afinar por formato nas fases 26/28).

- **Rótulo:** "Futebol".
- **Formatos permitidos:** `[FUTEBOL_3_3, FUTEBOL_5_5, FUTEBOL_7, FUTEBOL_9, FUTEBOL_11]`.
- **Formato por defeito por escalão (recomendação, editável):** petizes → `FUTEBOL_3_3`; traquinas → `FUTEBOL_5_5`; Benjamins (Sub-10/11) → `FUTEBOL_7`; Infantis/Iniciados (Sub-12/13) → `FUTEBOL_9`; Juvenis (Sub-15/17)/Juniores (Sub-19)/Seniores → `FUTEBOL_11`.
- **Posições:** `GUARDA_REDES`, `DEFESA_CENTRAL`, `LATERAL_DIREITO`, `LATERAL_ESQUERDO`, `MEDIO_DEFENSIVO`, `MEDIO_CENTRO`, `MEDIO_OFENSIVO`, `EXTREMO_DIREITO`, `EXTREMO_ESQUERDO`, `AVANCADO`, `UNIVERSAL`.
- **Núcleo estatístico (`EstatisticaAtleta`):** `golos`, `assistencias`, `remates`, `cantos`, `forasDeJogo`, `desarmes`, e (só GR) `defesas`, `golosSofridosGR`. `faltasCometidas` opcional. **Não usa:** `faltas1aParte`/`faltas2aParte` (equipa) — **`mostraFaltasAcumuladas = false`**.
- **Eventos ao vivo:** `GOLO`, `ASSISTENCIA`, `FALTA`, `CARTAO_AMARELO`, `CARTAO_VERMELHO`, `SUBSTITUICAO`, `DEFESA`, `GOLO_SOFRIDO`, **`REMATE`**, **`CANTO`**, **`FORA_DE_JOGO`**, **`DESARME`**. (`TIMEOUT` não se aplica.)
- **Camada específica:** foras-de-jogo, cantos, desarmes e remates como núcleo (não existem/não são núcleo em futsal). **Sem** power play nem faltas acumuladas por parte.
- **Campos SVG (`campoPorFormato` / `TipoCampo`) — dimensões e viewBox de referência (1u=10cm):**

| Formato | Dimensões (referência) | viewBox interno | Marcações-chave |
|---|---|---|---|
| `FUTEBOL_3_3` | ~25×15 m (mini-campo) | 250×150 | meio-campo, balizas pequenas; **sem** grandes áreas |
| `FUTEBOL_5_5` | ~40×20 m | 400×200 | meio-campo, círculo central, pequenas áreas, balizas reduzidas |
| `FUTEBOL_7` | ~60×40 m | 600×400 | meio-campo, círculo central, área ~12×24 m, marca de penálti, balizas 6 m |
| `FUTEBOL_9` | ~75×50 m | 750×500 | meio-campo, círculo central, grande área, penálti, balizas |
| `FUTEBOL_11` | 100×64 m (referência) | 1000×640 | meio-campo, círculo central (r≈91,5 dm), grandes áreas (16,5 m), pequenas áreas (5,5 m), penálti (11 m), arcos de área, balizas 7,32 m |

- **Tempo por bloco (`minutosPorBloco`):** parametrizável por formato (o "jogo completo" varia por escalão/formato — ex.: petizes/traquinas jogam menos tempo que juniores). Recomendação base: `JOGO_COMPLETO` = duração regulamentar do formato (ex.: FUTEBOL_11 séniores = 90; escalões jovens menos), `MEIA_PARTE` = metade, `BLOCO_10MIN=10`, `BLOCO_5MIN=5`, `NAO_JOGOU=0`. ⚠️ fixar a tabela exata por formato na fase 28 (§10.8).
- **Biblioteca curada / caderneta:** conteúdo de futebol por formato/parte do treino (fase 29).

## Apêndice C — Matriz de migração v6→v7

> **Pré-requisito de migração:** o schema da v6 tem fases *expand* pendentes não concluídas: `Atleta.escalaoId` (NOT NULL legado), `Atleta.clubeId` (nullable legado), `Exercicio.proprietario @default(CLUBE)` (deve ser `TREINADOR`), `Clube.clubeTecnico` (campo não existe no schema). Antes de aplicar as migrações v7, DEVE concluir-se o *contract* v6: criar `Clube.clubeTecnico Boolean @default(false)`, fixar `Atleta.clubeId` como NOT NULL, remover `Atleta.escalaoId`/`escalaoSecundarioId`/`epocaId` legados, e corrigir `Exercicio.proprietario @default(TREINADOR)`. Este apêndice pressupõe o modelo *contracted* como ponto de partida.

Todas as alterações são **aditivas** (colunas/tabelas novas, nullable ou com default) + **backfill idempotente**. **Nenhum** `DROP`, `RENAME`, `SET NOT NULL` destrutivo sobre dados existentes, **nenhum** `ALTER COLUMN` que perca dados. **Não toca em auth.**

### C.1 Tabelas novas
| Tabela | Descrição | Notas |
|---|---|---|
| `Seccao` | Secção (modalidade) do clube (§3.1.1) | `@@unique([clubeId, modalidade])`, `@@index([clubeId])` |
| `MembroSeccao` | Vínculo membro↔secção (coordenador) | `@@unique([seccaoId, membroClubeId])`, `@@index([membroClubeId])` |

### C.2 Enums novos / alterados
| Enum | Alteração |
|---|---|
| `Modalidade` | **novo** — `FUTSAL`, `FUTEBOL` |
| `PapelSeccao` | **novo** — `COORDENADOR` |
| `FormatoJogo` | **novo** — `FUTSAL_5`, `FUTEBOL_3_3`, `FUTEBOL_5_5`, `FUTEBOL_7`, `FUTEBOL_9`, `FUTEBOL_11` |
| `AmbitoPerfil` | **valor novo** — `SECCAO` (aditivo; `TODO_CLUBE`/`PROPRIOS_ESCALOES` intactos) |
| `Posicao` | **valores novos** — `DEFESA_CENTRAL`, `LATERAL_DIREITO`, `LATERAL_ESQUERDO`, `MEDIO_DEFENSIVO`, `MEDIO_CENTRO`, `MEDIO_OFENSIVO`, `EXTREMO_DIREITO`, `EXTREMO_ESQUERDO`, `AVANCADO` (futsal `GUARDA_REDES`/`FIXO`/`ALA`/`PIVO`/`UNIVERSAL` intactos) |
| `TipoEventoJogo` | **valores novos** — `REMATE`, `CANTO`, `FORA_DE_JOGO`, `DESARME` (existentes intactos) |

### C.3 Colunas novas (todas nullable ou com default)
| Modelo | Coluna | Tipo | Default/Nullable |
|---|---|---|---|
| `Escalao` | `seccaoId` | `String` (FK `Seccao`) | preenchido por **backfill** (C.4); NOT NULL após backfill |
| `Jogo` | `formato` | `FormatoJogo?` | nullable (derivado da secção quando ausente) |
| `Sessao` | `modalidadeAtividade` | `Modalidade?` | nullable — sem backfill (null = herda da secção) |
| `Jogo` | `modalidadeAtividade` | `Modalidade?` | nullable — sem backfill (null = herda da secção) |
| `EstatisticaAtleta` | `remates`, `cantos`, `forasDeJogo`, `desarmes` | `Int?` | nullable |
| `Exercicio` | `modalidade` | `Modalidade?` | nullable (genérico) |
| `ModeloSessao` | `modalidade` | `Modalidade?` | nullable |
| `MetricaConfig` | `modalidade` | `Modalidade?` | nullable |
| `Habilidade` | `modalidade` | `Modalidade?` | nullable |
| `Competicao` | `formatoJogo` | `FormatoJogo?` | ⚠️ distinto do campo `formato FormatoCompeticao` (LIGA/TORNEIO/TACA) já existente; nullable, derivável |
| `Licenca` | `modalidade` | `Modalidade?` | nullable (⚠️ ou derivar da secção do clube técnico — §3.11) |
| `Licenca` | `numSeccoes` | `Int` | default `1` (pricing multi-secção — §17.1) |
| `DiagramaCampo` (Json) | `campo` | `TipoCampo?` (no JSON) | ausente = `FUTSAL_5` (retrocompatível — §11.2) |

### C.4 Backfill (idempotente; execução manual após deploy, como as migrações anteriores)
1. **Secção por clube:** para cada `Clube` existente, criar **uma `Seccao` FUTSAL** (`upsert` por `@@unique([clubeId, modalidade=FUTSAL])`).
2. **Ligar escalões:** `UPDATE Escalao SET seccaoId = <secção FUTSAL do clube>` para todos os escalões do clube (todos os dados existentes são futsal).
3. **`Escalao.seccaoId` NOT NULL:** só depois de 1+2 (evita nulos transitórios).
4. **`Jogo.formato`:** deixar `null` (derivado como `FUTSAL_5` na leitura) **ou** preencher `FUTSAL_5` em jogos existentes (opcional; ambos corretos porque os dados são futsal).
5. **Perfis de arranque:** acrescentar o perfil "Coordenador de Secção" aos clubes existentes é **opcional** (só necessário quando o clube adotar uma segunda secção); a capacidade `CLUBE_SECCOES` é adicionada ao catálogo e aos perfis Admin/DT.
6. **Diagramas:** nenhum backfill — leitura assume `FUTSAL_5` quando `campo` ausente.

### C.5 Garantias de compatibilidade
- Um clube 100% futsal após o backfill comporta-se **exatamente como na v6** (uma única secção FUTSAL, sem seletor de secção, sem UI nova).
- Nenhuma query existente quebra: os filtros por `clubeId`/`epocaId`/`escalaoId` mantêm-se; `seccaoId` é um filtro adicional opcional.
- Diagramas, estatísticas e jogos legados permanecem válidos e legíveis.
- **Rollback de código** possível sem migração inversa enquanto as colunas novas forem nullable e o código antigo as ignorar (exceto `Escalao.seccaoId` NOT NULL, que exige o backfill aplicado — recomenda-se manter `seccaoId` nullable durante uma fase *expand* e torná-lo NOT NULL numa fase *contract*, como no padrão `AtletaEscalao` da v6).

---

**Fim da `FutsalManager_Spec_v7.md`.** A `FutsalManager_Spec_v6.md` mantém-se **intacta** como histórico (detalhe verbatim do changelog anterior a 2026-08-19). Esta v7 é a **bíblia ativa** do produto a partir de 2026-08-19.
