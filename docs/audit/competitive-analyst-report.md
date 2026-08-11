# Análise Competitiva — Luís Costa (Competitive Analyst)

> **Contexto:** avaliação do FutsalCoach (SaaS de gestão de treino de futsal, PT-PT) face aos principais concorrentes relevantes para o mercado português. Data: 2026-08. Base: features implementadas (secção "Estado dos passos" do CLAUDE.md), landing/pricing atual (`app/page.tsx`), visão do produto (`Spec_v6` §1–5, §17–18) e conhecimento de mercado de SaaS desportivo europeu.
>
> **Nota metodológica sobre os concorrentes escolhidos:** a tabela usa **SportEasy** (líder francófono, forte penetração no sul da Europa), **Spond** (nórdico, gratuito, em expansão europeia rápida) e **TeamSnap** (referência EUA, benchmark de funcionalidade). O concorrente **direto no mercado PT** não é nenhum destes — é o **Dossier do Treinador** (PT, individual, uma equipa por conta), citado na própria bíblia como referência. Ele é tratado à parte porque joga noutra liga (individual-only, sem camada de clube).

---

## Tabela Comparativa

Legenda: ✅ forte / cobre bem · ⚠️ parcial ou fraco · ❌ ausente

| Feature | FutsalCoach | SportEasy | Spond | TeamSnap |
|---|---|---|---|---|
| **Gestão de plantel/atletas** | ✅ Multi-escalão, N-N atleta↔escalão, posições múltiplas, histórico, encarregado de educação | ✅ Roster por equipa, perfis de pais | ✅ Membros e grupos | ✅ Roster robusto |
| **Gestão de treinos e exercícios** | ✅✅ **Editor de campo SVG animado, biblioteca pessoal+clube, templates de sessão, partes do treino** | ❌ Sem desenho de exercícios | ❌ Sem desenho de exercícios | ❌ Sem desenho de exercícios |
| **Gestão de jogos e competições** | ✅ Convocatória, stats de futsal, blocos de tempo, scouting, competições+classificação (manual) | ⚠️ Jogos e onze, resultados básicos | ⚠️ Eventos, sem stats de jogo | ⚠️ Jogos, resultados, sem tática |
| **Presenças e assiduidade** | ✅ Marcação por sessão, motivos (lesão/doença), taxa de presença | ✅✅ RSVP nativo, lembretes automáticos | ✅✅ RSVP nativo (core), lembretes | ✅✅ Availability tracking (core) |
| **Analytics e estatísticas** | ✅✅ **3 níveis (atleta/equipa/clube), gráficos próprios, stats de futsal, caderneta de evolução** | ⚠️ Estatísticas básicas | ❌ Praticamente nenhuma | ⚠️ Básicas |
| **Comunicação (pais, convocatórias)** | ⚠️ **Gerador de texto para WhatsApp; sem contas de pais, sem push, sem chat in-app** | ✅✅ Chat in-app, contas de pais, push, mural | ✅✅ **Mensagens best-in-class**, push, contas de pais | ✅✅ Chat, push, contas de pais |
| **Periodização e planeamento** | ✅✅ **Micro/mesociclos, períodos, planeamento semanal/mensal** | ❌ | ❌ | ❌ |
| **Multi-utilizador / gestão de clube** | ✅ Perfis configuráveis, overrides, branding, analytics de clube | ✅ SportEasy for Clubs | ✅ Spond Club | ✅ TeamSnap for Clubs |
| **Modelo de jogo / tática** | ✅✅ Documento vivo, bolas paradas, quadro tático por jogo | ❌ | ❌ | ❌ |
| **Pagamentos / cobrança de quotas** | ❌ Fora do âmbito v1 | ✅ Recolha de pagamentos | ✅✅ Spond Pay (motor de receita) | ✅ Payments/dues |
| **Preço** | €4,99/mês individual · €15–34/mês clube · **sem free/trial** | **Freemium** (grátis + Premium ~€8/mês/equipa) | **Grátis** (monetiza via Club/Pay) | ~$10+/mês (premium) |
| **Mobile experience** | ⚠️ **PWA responsiva, sem app nativa, sem push** | ✅✅ App nativa iOS/Android | ✅✅ App nativa excelente | ✅✅ App nativa madura |
| **Língua PT / terminologia local** | ✅✅ **PT-PT nativo, terminologia FPF, conformidade Modelo 2 (planeada)** | ⚠️ PT disponível, mas FR-first e genérico | ⚠️ Multi-idioma, sem termos de futsal | ❌ Inglês/US-cêntrico |
| **Especificidade futsal** | ✅✅ **Campo com dimensões corretas, faltas acumuladas, power play/GR-jogador, quintetos/rotações, blocos de tempo** | ❌ Futebol adaptado | ❌ Genérico multi-desporto | ❌ Genérico multi-desporto |

---

## USPs Confirmados (diferenciadores reais)

1. **Metodologia de treino, não logística.** O editor de campo interativo com animação A→B, a biblioteca dupla (pessoal portátil 🎒 + clube 🏛️), os templates de sessão e a periodização em micro/mesociclos colocam o FutsalCoach numa categoria que **nenhum dos três concorrentes toca**. SportEasy, Spond e TeamSnap são ferramentas de *organização de equipa* (quem vem ao treino, quando é o jogo, avisa os pais). O FutsalCoach é uma ferramenta de *conteúdo e método de treino*. Este é o fosso mais defensável.

2. **Futsal a sério, em PT-PT, com terminologia FPF.** Num mercado onde os concorrentes internacionais tratam o futsal como "futebol adaptado" (campo errado, sem faltas acumuladas, sem power play/GR-jogador, sem blocos de tempo, sem quintetos/rotações), o FutsalCoach fala a língua exata do treinador português de futsal. A conformidade planeada com o Modelo 2 da FPF, se concretizada, transforma isto de "simpático" em "indispensável" para clubes federados.

3. **Desenvolvimento do atleta como produto emocional.** A caderneta de habilidades + analytics em 3 níveis + relatório de fim de época partilhável constroem uma narrativa de progresso do jogador que os pais valorizam e que nenhum concorrente entrega. É o argumento de retenção e de venda ao clube, não apenas uma feature.

4. **Modelo "2 em 1" (individual → clube) com portabilidade de conteúdo.** A arquitetura multi-tenant única (clube técnico invisível) e a propriedade do conteúdo decidida pelo treinador (a biblioteca pessoal viaja com ele) criam um percurso de venda orgânico — o treinador adota sozinho, demonstra ao clube, o clube absorve. Spond e SportEasy têm camada de clube, mas não têm este mecanismo de portabilidade de trabalho criativo do treinador.

---

## Vulnerabilidades Competitivas

1. **Comunicação com pais é o must-have onde o FutsalCoach está mais fraco.** Spond e SportEasy ganharam o mercado amador europeu precisamente com **contas de pais + chat in-app + notificações push + RSVP num toque**. O FutsalCoach entrega apenas um *gerador de texto para copiar para WhatsApp* e adia o portal de pais para FUTURO. Para muitos clubes amadores, "avisar e confirmar os pais" é a razão nº1 para adotar uma app. Não é um detalhe — é a categoria em que os líderes são fortíssimos e o FutsalCoach oferece o mínimo. Mitiga-se pelo facto de o WhatsApp já ser o canal real de facto em Portugal, mas o RSVP estruturado e o push continuam a faltar.

2. **Ausência de app nativa e de notificações push.** Os três concorrentes têm apps nativas maduras; o FutsalCoach é PWA sem push. Para o "modo beira-campo" e para lembretes de treino/jogo (que a bíblia até simula in-app), a falta de push é uma desvantagem de engagement real. A PWA cobre o essencial, mas a perceção de "app a sério" no telemóvel dos pais e atletas conta.

3. **Sem cobrança de quotas / pagamentos.** Spond Pay e os pagamentos do SportEasy/TeamSnap não são só uma feature — são um motor de adoção e de receita (e, no caso do Spond, o que sustenta a gratuitidade). Muitos clubes escolhem a ferramenta pela recolha de mensalidades. O FutsalCoach exclui isto da v1, o que fecha uma porta de entrada comercial relevante junto de direções de clube.

4. **Vender contra o "grátis".** O maior risco não é uma feature — é o modelo. O Spond é **gratuito** e o SportEasy tem tier grátis. O FutsalCoach pede €4,99/mês ao treinador individual **sem trial e sem freemium**, num mercado amador com baixa disposição para pagar. O valor justifica-se para o treinador sério (treino+método+desenvolvimento), mas a fricção de "porquê pagar se o Spond é grátis?" existirá em cada conversa de vendas e não há um tier de entrada para desarmar essa objeção.

---

## Pricing Benchmark

**Individual — €4,99/mês (ou €49/ano):**
- **Posicionamento: na média-baixa em valor absoluto, mas exposto pelo modelo.** €49/ano é mais barato que o TeamSnap (~$100+/ano) e comparável ao SportEasy Premium. O problema não é o número — é competir contra o **grátis do Spond** e o **freemium do SportEasy** sem qualquer ponto de entrada sem custo. Para um treinador que só quer "avisar os pais e marcar presenças", €4,99 parece caro face ao Spond; para um treinador que quer desenhar treinos, periodizar e acompanhar o desenvolvimento, €4,99 é uma pechincha (não há alternativa a esse preço). **A perceção de preço depende inteiramente de o produto conseguir comunicar que não é uma ferramenta de logística — é uma ferramenta de método.**

**Clube — €15 (≤2 escalões) a €34 (≤8 escalões):**
- **Posicionamento: competitivo e provavelmente subvalorizado.** Um clube de formação com 4–8 escalões a pagar €19–34/mês é barato face ao custo de gerir metodologia, analytics e relatórios manualmente. Comparado com planos de clube internacionais (que rapidamente escalam por equipa/atleta), o modelo por nº de escalões é generoso e fácil de vender. O tier "Parceiro" negociado é a jogada certa para os fundadores. **Há margem para subir preços de clube no futuro** sem perder competitividade.

**Modelo freemium vs subscription:**
- **O FutsalCoach NÃO tem free tier nem trial** (decisão explícita §17.6). Isto é a fraqueza estrutural do pricing. Num mercado onde os líderes usam o grátis como arma de aquisição, "compra directa sem experimentar" é atrito máximo. **Recomendação forte:** introduzir pelo menos um **trial de 14–30 dias** ou um **tier grátis limitado** (ex.: 1 escalão, 1 época, sem analytics de clube) para o treinador individual. O vídeo demo público não substitui a experiência de ter o próprio plantel lá dentro.

---

## Oportunidades de Nicho no Mercado Português

- **Futsal é desporto de topo em Portugal, não um nicho marginal.** A FPF tem uma base federada enorme de futsal de formação (milhares de clubes e escalões). Os concorrentes internacionais servem este universo mal — como "futebol adaptado". Existe um vazio real de uma ferramenta *séria*, em PT-PT, feita para futsal.

- **Localização como fosso, não como tradução.** PT-PT nativo + terminologia FPF + (planeado) documentos federativos Modelo 2 é algo que Spond/SportEasy não vão fazer para um mercado do tamanho de Portugal. É defensável precisamente porque é "pequeno demais" para os gigantes investirem.

- **O mercado PT já vive no WhatsApp.** O gerador de conteúdo WhatsApp, apesar de ser a versão fraca da comunicação, está alinhado com o comportamento real dos clubes portugueses — que não vão migrar os pais para outra app de mensagens. Isto atenua parcialmente a vulnerabilidade de comunicação: em Portugal, "gerar a convocatória bonita para colar no grupo de WhatsApp" pode ser suficiente e até preferido.

- **Ausência de concorrente PT credível na camada de clube.** O Dossier do Treinador é individual e limitado. Não há um SaaS português a servir a gestão de *clube* de futsal com método + analytics. O FutsalCoach pode ser o primeiro a ocupar esse espaço antes que apareça outro.

- **Parceiros fundadores + FPF como alavanca institucional.** O caminho de parceiros fundadores (patrocínio mútuo) e uma eventual aproximação institucional à federação/associações distritais é uma via de aquisição que os concorrentes internacionais não conseguem replicar localmente.

---

## Posicionamento Recomendado (1 parágrafo executivo)

O FutsalCoach **não deve tentar ganhar no campo onde o Spond e o SportEasy são imbatíveis** — logística, RSVP nativo e comunicação com pais em app grátis. Deve posicionar-se como **"o cérebro de treino do futsal português"**: a plataforma de método, desenho de exercícios, periodização, modelo de jogo, estatística específica de futsal e desenvolvimento do atleta que **nenhuma ferramenta de logística tem** — tudo em PT-PT com terminologia FPF. A mensagem de vendas é "as outras apps dizem-te *quem* vem ao treino; o FutsalCoach ajuda-te a decidir *o que* treinar e a mostrar *como* o teu atleta evoluiu". Complementa (não substitui) o WhatsApp e as apps grátis numa primeira fase, e captura o treinador sério e o clube de formação federado que querem elevar a metodologia. A curto prazo, fecha a fricção de aquisição com um trial/tier grátis e resolve o gap de push/mobile; a médio prazo, a conformidade FPF e (se viável) a cobrança de quotas transformam-no de "ferramenta do treinador" em "sistema operativo do clube de futsal".

---

## Veredicto Competitivo

**"O FutsalCoach consegue competir e ganhar no mercado português? — SIM, COM CONDIÇÕES."**

Consegue **ganhar no nicho** do futsal de formação português porque tem um diferenciador que os líderes não têm e não terão (método + tática + desenvolvimento + futsal a sério + PT-PT/FPF) e um mercado real e mal servido. Mas **não ganha por si só** — precisa de cumprir três condições:

1. **Desarmar a objeção do "grátis":** introduzir trial ou tier grátis limitado; nunca vender como "mais uma app de gestão de equipa" (perde contra o Spond), mas sempre como ferramenta de método e desenvolvimento.
2. **Fechar o gap de engagement mobile:** notificações push (PWA push é viável) e, idealmente, RSVP estruturado — mesmo mantendo o WhatsApp como canal de saída para os pais.
3. **Concretizar a conformidade FPF:** é o que converte "produto simpático" em "produto obrigatório" para o clube federado, e é o fosso que nenhum concorrente internacional atravessa.

Se estas três condições forem cumpridas, o FutsalCoach não só compete — **domina o seu nicho** em Portugal, porque estará sozinho a servi-lo bem.
