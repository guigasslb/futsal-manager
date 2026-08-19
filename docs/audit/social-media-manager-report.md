# Estratégia Social Media — Beatriz Santos (Social Media Manager)

> Análise de potencial orgânico do **Mister** para Instagram e Facebook, focada no ecossistema de futsal de formação em Portugal (AF distritais, grupos de WhatsApp de treinadores, torneios de miúdos).
> Data: 2026-08-11

---

## Features com Potencial "Shareable"

Analisei a landing (`app/page.tsx`), a lista de features implementadas (`CLAUDE.md`) e o código real das features de comunicação e relatórios. O produto tem **três alavancas de conteúdo genuínas** — não inventadas, já construídas:

### 1. Relatório público de fim de época com link partilhável (a joia da coroa)
`app/r/[token]/page.tsx` gera uma **página web pública** (via token) com a **identidade do clube** — logótipo, cor primária, nome — e estatísticas do atleta ou da equipa. Tem botão "Imprimir / Guardar PDF".
- **Porque partilha:** um pai recebe um link com o **nome do filho**, as estatísticas dele (golos, assistências, presenças, minutos) e as **habilidades desbloqueadas na caderneta**, tudo com o **escudo do clube** e cor do clube. Isto é conteúdo que um pai reposta orgulhosamente no story. É o momento "ver o nome do filho num relatório profissional" descrito no briefing — e está literalmente implementado.
- **Nota UGC crítica:** o relatório traz sempre o rodapé "Relatório gerado por Mister" + logo no topo. **Cada partilha de pai = exposição de marca gratuita.** Isto é ouro. (Cuidado RGPD: são dados de menores — a marca não deve repostar relatórios reais de crianças sem consentimento explícito; usar mockups.)

### 2. Relatório individual de desenvolvimento do atleta
`app/(app)/plantel/[id]/relatorio/page.tsx` — cartões de estatísticas (golos/assist. ou defesas/sofridos para GR), **taxa de presença**, **caderneta de habilidades desbloqueadas** em chips, e **observações do treinador**. É o "relatório profissional do miúdo" em formato pronto a imprimir/PDF.
- **Porque partilha:** o treinador entrega isto no fim da época e o pai fotografa/reposta. Momento emocional forte.

### 3. Gerador de comunicações para WhatsApp (o gancho viral B2B)
`app/(app)/comunicacoes/` + `lib/schemas/comunicacao.ts` — gera **texto formatado pronto a colar no grupo de WhatsApp** do escalão. Sete tipos: **Convocatória**, Cancelamento, Mudança de horário/local, **Resultado**, Aviso geral, **Calendário mensal**.
- **Porque partilha:** a convocatória formatada aparece **todas as semanas** no grupo de pais de cada escalão. É a feature com maior frequência de exposição orgânica — dezenas de treinadores a colar mensagens limpas e profissionais onde antes mandavam listas manuais desalinhadas. Cada grupo de WhatsApp é uma vitrine.
- **Oportunidade:** sugerir uma assinatura discreta opcional no template ("via Mister") transforma cada convocatória num anúncio. (Não está no código — é recomendação de produto.)

### 4. Editor de campo com animação de movimentos (conteúdo de marca premium)
Passo 6 do MVP + landing: **editor SVG interativo com animação de exercícios**. Isto é **conteúdo de vídeo nativo para Reels** — um exercício a animar-se no ecrã é hipnótico e imediatamente perceptível como valor por qualquer treinador.

### 5. Gráficos de evolução e rankings próprios (SVG)
`components/graficos/` + página de relatórios — **melhores marcadores**, **melhores assistentes**, evolução por jogo, presença mensal. Rankings são conteúdo social por natureza ("o Pichichi do sub-13"). Carrosséis prontos.

### O que **falta** para maximizar o shareable (gaps honestos)
- **Não há geração de imagem/card social nativo.** Os relatórios são web/PDF, ótimos para pai↔treinador, mas **não há um "cartão quadrado para Instagram"** gerado pela app (ex.: card de MVP do jogo, card de resultado com escudo). Isto é a maior oportunidade de produto para amplificar o orgânico. Hoje o utilizador tem de fazer print e cortar.
- A app **assume-se explicitamente como "não é canal de comunicação"** (ver texto em `comunicacoes/page.tsx`) — filosofia correta, mas significa que a viralidade depende do utilizador copiar/colar. Bom para WhatsApp, fraco para Instagram sem um asset visual pronto.

---

## Bio Instagram (150 caracteres)

> **⚽ Futsal a sério, não futebol adaptado.**
> App de gestão para treinadores e clubes 🇵🇹
> Plantel · Treinos · Estatísticas · Relatórios
> 👇 Experimenta grátis

*(Versão curta alternativa, ~140 car.):*
> ⚽ A app dos treinadores de futsal em Portugal 🇵🇹
> Treinos, estatísticas e relatórios dos teus atletas.
> Grátis para começar 👇

---

## 10 Posts Instagram

| # | Tipo | Caption | Momento ideal |
|---|------|---------|---------------|
| 1 | **Reel** | "Quantas vezes já mandaste a convocatória à mão no grupo de pais? 😅 Vê como fica em 10 segundos." — screen-record do gerador de convocatória a produzir o texto limpo, a colar no WhatsApp. CTA: "Link na bio." | **Domingo 20h** (treinadores a preparar a semana) |
| 2 | **Reel** | "Isto não é um quadro branco. É o teu exercício a ganhar vida." — editor de campo a animar um movimento pressing. Som trending. CTA: "Desenha o teu primeiro exercício grátis." | **Terça 21h** (pico de treinadores online) |
| 3 | **Carrossel** | "O relatório de fim de época que os pais vão querer emoldurar 🖼️" — 5 slides mostrando um relatório de atleta (mockup): capa com escudo → golos/assist. → presenças → caderneta de habilidades → observações do treinador. | **Fim de época (maio/junho)** ou **início (setembro)** |
| 4 | **Story (série)** | Enquete: "Como registas as estatísticas dos jogos? 📊" opções: Caderno / Excel / Cabeça / Não registo. Segundo story: "Há forma melhor 👀" → swipe up para landing. | **Segunda 12h** (pausa de almoço) |
| 5 | **Post estático / Carrossel** | "Pichichi do escalão 🏆" — card de ranking de melhores marcadores (mockup com nomes fictícios). "Faz o ranking do teu escalão automaticamente." | **Após jornadas de fim de semana — Domingo 19h** |
| 6 | **Reel (talking head)** | Treinador real (parceiro/depoimento): "Passava domingos a fazer contas. Agora tenho tudo no telemóvel." — 20s, autêntico, beira-campo. | **Quinta 20h** |
| 7 | **Carrossel educativo** | "5 estatísticas que devias registar nos teus sub-12 (e porquê)" — valor puro sobre metodologia de futsal, marca subtil. Posiciona o Mister como autoridade. | **Quarta 18h** |
| 8 | **Story interativo** | "Marca o treinador que ainda anda com o caderno 📒➡️📱" + sticker de partilha. Ativa tags e alcance. | **Sexta 17h** |
| 9 | **Reel** | "Do caos ao plantel organizado em 2 minutos" — antes/depois: lista manual desorganizada vs. plantel por escalão na app, com posições e números. | **Terça 13h** |
| 10 | **Carrossel** | "A caderneta de habilidades: gamificação a sério na formação ⭐" — mostra habilidades por nível a desbloquear. Fala à filosofia de desenvolvimento do jovem atleta. | **Segunda 21h** |

**Regra de conteúdo dos mockups:** nunca usar estatísticas/nomes reais de menores nos posts da marca (RGPD — dados de crianças). Usar sempre atletas fictícios ou clubes-parceiros com consentimento assinado.

---

## Content Calendar Semanal

| Dia | Tipo de Conteúdo | Exemplo |
|-----|------------------|---------|
| **Segunda** | Educativo / valor (carrossel ou story de enquete) | "5 métricas para os teus sub-12" · enquete "como registas estatísticas?" |
| **Terça** | Feature reel (produto em ação) | Editor de campo animado · gerador de convocatória |
| **Quarta** | Autoridade / metodologia futsal | Dicas de treino, periodização, futsal ≠ futebol |
| **Quinta** | Prova social / depoimento | Reel de treinador real, print de mensagem de utilizador |
| **Sexta** | Comunidade / engagement | "Marca um treinador", memes de beira-campo, UGC repost |
| **Sábado** | Bastidores / cultura futsal | Jogos de miúdos, ambiente de pavilhão, torneios distritais |
| **Domingo** | Resultado / ranking + CTA forte | Card de "Pichichi da semana", "prepara a semana com a app" |

**Cadência recomendada:** 4–5 posts no feed/semana + stories diários. **60% valor/educação, 30% produto, 10% venda direta** — o ecossistema de treinadores rejeita conteúdo excessivamente comercial; ganha-se confiança com utilidade.

---

## Hashtag Strategy

**Principal:** **#Mister**

**Secundárias (marca/categoria):**
`#futsal` `#gestãodesportiva` `#treinadordefutsal` `#treinodefutsal` `#futsalformação` `#desportoportugues` `#appdesporto` `#coachingfutsal`

**Nicho PT (futsal português — alcance qualificado):**
`#futsalportugal` `#futsaljovem` `#futsalformacao` `#formacaofutsal` `#futsaldistrital` `#futsalsub13` `#futsalsub15` `#academiafutsal` `#pavilhao` `#futsalPT` `#treinadoresportugal` `#escolinhasfutsal`

**Estratégia de mix:** 3–5 de alcance amplo (`#futsal`, `#desportoportugues`) + 8–10 de nicho PT (menor volume, **muito maior taxa de conversão** — treinadores e pais portugueses) + `#Mister` sempre. Rotar por associações distritais em campanhas locais (ex.: `#AFLisboa` `#AFPorto`) quando fizer sentido geográfico.

---

## Avaliação de Potencial Social

**"O Mister tem potencial orgânico nas redes sociais? MÉDIO-ALTO — porquê?"**

**Argumentos a favor (o que puxa para ALTO):**
- **Loop de UGC embutido e já implementado:** o relatório público (`/r/[token]`) e as convocatórias de WhatsApp carregam marca Mister em cada partilha. Todas as semanas, dezenas de grupos de pais veem uma convocatória limpa; no fim de época, pais repostam relatórios com o nome do filho. **Este é o motor orgânico mais forte que uma app deste nicho pode ter** — a distribuição acontece nos canais onde os treinadores e pais já vivem (WhatsApp dos escalões).
- **Nicho apaixonado e identitário:** "futsal a sério, não futebol adaptado" é um posicionamento com bandeira. O ecossistema PT (AF distritais, grupos de treinadores) é pequeno, denso e altamente conectado — boca-a-boca corre depressa.
- **Conteúdo visual nativo pronto:** editor de campo animado = Reels; rankings e gráficos SVG = carrosséis; relatórios = provas sociais. Não é preciso inventar conteúdo, é preciso capturá-lo.

**Argumentos que travam (o que segura em MÉDIO):**
- **Falta um asset social nativo.** A app gera web/PDF e texto de WhatsApp — perfeito para pai↔treinador, mas **não gera um card quadrado pronto para Instagram** (card de MVP, card de resultado com escudo). Sem isso, a viralidade no Instagram depende de o utilizador fazer print e editar. **Recomendação de produto prioritária: gerar cards sociais partilháveis** (resultado do jogo, MVP, ranking) com escudo do clube + marca discreta. Seria o multiplicador orgânico nº1.
- **Mercado B2B/nicho tem teto de alcance.** Não é conteúdo de massas — é conteúdo qualificado. O crescimento é sólido mas gradual; não esperar viralidade explosiva, esperar **comunidade fiel de alta conversão**.
- **RGPD limita a marca:** dados de menores impedem a Mister de repostar relatórios reais de crianças. O UGC mais poderoso (pai orgulhoso) tem de vir *do* utilizador, não *da* marca — o que é bom para autenticidade mas reduz o controlo editorial.

**Veredicto:** **MÉDIO-ALTO.** O produto tem um motor de distribuição orgânica genuíno e já construído (relatórios com marca + convocatórias de WhatsApp), num nicho denso e apaixonado. O que separa "médio" de "alto" é uma única feature de produto — **geração de cards sociais nativos** — que transformaria cada jogo, cada MVP e cada ranking num anúncio pronto a postar. Com isso, sobe claramente para ALTO.
