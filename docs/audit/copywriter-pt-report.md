# Auditoria de Copy — Ana Ferreira (Copywriter PT)

> Âmbito: landing page (`app/page.tsx`), dashboard (`app/(app)/dashboard/page.tsx`),
> estados de UI (`components/layout/EstadosUI.tsx`) e microcopy de três fluxos-chave
> (`AtletaForm`, `VitoriaRapida`, `GeradorComunicacao`).
> Data: 2026-08-11 · Variante: PT-PT.

---

## Resumo executivo

O produto está **muito acima da média em microcopy in-app** — botões específicos,
estados vazios com próximo passo, terminologia de futsal correta e PT-PT limpo (nada de
BR). O elo fraco é a **landing page**: fala de *funcionalidades*, não de *problemas*, e
desperdiça a melhor frase do produto ("Futsal a sério, não futebol adaptado"), que está
enterrada a meio da página em vez de ser a headline.

Há **um erro gramatical a corrigir já** ("Tudo o do plano Individual") e **uma
inconsistência de vocabulário** entre "template" (anglicismo) e "modelo" (PT-PT) usados
para a mesma coisa em ecrãs diferentes.

---

## Landing Page — Avaliação

| Elemento | Original | Problema | Proposta |
|---|---|---|---|
| Headline | "A plataforma de gestão de futsal para treinadores e clubes" | Orientada à categoria, não ao problema. É o molde SaaS mais genérico que existe ("A plataforma de X para Y"). Não diz o que o treinador ganha. | **"Trata do teu escalão de futsal em minutos, não em serões."** |
| Subheadline | "Plantel, treinos, jogos, estatísticas, comunicação e muito mais — tudo num só lugar." | Lista de features + clichés ("e muito mais", "tudo num só lugar"). Zero benefício. | **"Plantel, treinos e estatísticas num só sítio — e a convocatória sai pronta para o WhatsApp da equipa."** |
| CTA principal (hero) | "Registar grátis" | Acionável e claro ✅. Mas "grátis" não diz o quê (teste? plano gratuito?). | Manter "Registar grátis" e acrescentar micro-linha por baixo: **"Sem cartão de crédito. Pronto a usar hoje."** |
| CTA secundário | "Entrar" | Correto ✅ | Manter. |
| Secção features (título) | "Tudo o que o treinador precisa" | Aceitável, mas passivo. | **"Tudo o que fazes ao domingo, resolvido durante a semana."** (opcional; o atual serve) |
| Sub-secção features | "Futsal a sério, não futebol adaptado. Feito para a beira-campo real." | **É a melhor copy da página** — tem posicionamento e personalidade. Está enterrada. | **Promover a headline/eyebrow do hero.** É este o diferenciador. |
| Título pricing | "Um preço simples, dois modos" | Bom ✅ | Manter. |
| Sub pricing | "Começa sozinho como treinador ou traz o clube inteiro." | Bom, humano ✅ | Manter. |
| Plano Clube — item 1 | "Tudo o do plano Individual" | **ERRO GRAMATICAL.** Falta palavra. Não é PT-PT válido. | **"Tudo o que tens no plano Individual"** |
| Justificação de preço | (nenhuma) | Os planos são listas de features. €4,99 e €15 aparecem sem ancoragem de valor. | Acrescentar uma linha de valor por plano (ver abaixo). |
| Prova social | (inexistente) | Nenhum testemunho, número de clubes, ou logótipo. Numa página de venda, custa conversão. | Adicionar faixa "Usado por treinadores de X clubes" ou 1–2 testemunhos curtos quando existirem. |

### Micro-copy de valor sugerido para o pricing
- **Individual** — eyebrow: *"Menos de um café por semana."*
- **Clube** — eyebrow: *"Um preço para o clube todo, não por treinador."*

### Alternativas de headline (para A/B)
1. **"Trata do teu escalão de futsal em minutos, não em serões."** — benefício de tempo (recomendada).
2. **"Feito para o futsal. Não é futebol adaptado."** — posicionamento/diferenciação.
3. **"Do plantel à convocatória sem sair do WhatsApp do costume."** — fluxo concreto que o treinador reconhece.

---

## Microcopy In-App — Problemas e Propostas

| Localização | Original | Problema | Proposta PT-PT |
|---|---|---|---|
| `VitoriaRapida` (passos 2 e 3) | "template", "template curado", "Instalar templates de arranque" | **Anglicismo** e — pior — **incoerente** com `GeradorComunicacao`, que usa "modelo" para o mesmo conceito. | **"modelo", "modelo pronto a usar", "Instalar modelos de arranque"** (uniformizar em "modelo" em todo o produto). |
| `VitoriaRapida` (aviso sem escalões) | "…em setup do clube para poderes…" | **Anglicismo** "setup". | **"…nas definições do clube para poderes…"** |
| `VitoriaRapida` (progresso) | "Tudo pronto! 🎉" | Emoji fora do tom da marca (assertiva, sóbria). O resto do produto não usa emoji. | **"Tudo pronto."** (sem emoji) ou o ícone de check já existente. |
| `EstadosUI` → `EstadoErro` | "Algo correu mal" / "Ocorreu um erro inesperado." | Genérico e sem próximo passo. Diz *que* falhou, não *o que fazer*. | Título: **"Não conseguimos carregar isto"**; corpo: **"Verifica a ligação e tenta novamente. Se continuar, avisa-nos."** |
| `VitoriaRapida` (falha em lote) | "Não foi possível criar: {nomes}." | Diz quem falhou, não porquê nem o que fazer. | **"Não conseguimos criar: {nomes}. Confirma que o número não está repetido e tenta de novo."** |
| `GeradorComunicacao` (sem modelos) | "Ainda não há modelos de comunicação disponíveis. Instala os modelos base em Comunicações." | Bom, mas não é acionável no sítio (obriga a navegar). | Acrescentar botão inline **"Instalar modelos base"** em vez de só indicar o caminho. |
| Dashboard (metadata/nav) | Título "Início" vs botão "Ir para o painel" vs conceito "dashboard" | Três nomes para o mesmo ecrã. | Escolher **um**: recomendo **"Início"** em todo o lado ("Ir para o início"). |
| `AtletaForm` (botões) | "Criar atleta" / "Guardar alterações" / "Cancelar" / "A guardar…" | **Exemplar** ✅ — específicos, com estado de progresso. Nada a mudar. | Manter como referência para os outros forms. |
| Dashboard (estados vazios) | "A época está pronta a arrancar" + CTAs; "Começa em 10 minutos" | **Exemplares** ✅ — motivacionais e com próximo passo claro. | Manter. |

### Nota positiva (não mexer)
O microcopy de estados vazios e de botões é **de nível profissional**: `EstadoVazio`
com título + descrição + ação, "Marcar presenças", "Adicionar atleta", "Agendar treino".
A terminologia de futsal (escalão, plantel, convocatória, presença, pivô, ala, fixo,
guarda-redes) está **correta e consistente**.

---

## Tom de Voz — Consistência

**PT-PT: correto e limpo.** Verificado:
- "utilizadores" (não "usuários") ✅
- "definições" (não "configurações") ✅ — exceto o lapso "setup do clube" na Vitória Rápida.
- "guardar" (não "salvar"), "eliminar"/"remover" (não "deletar"), "época", "escalão" ✅
- Forma de tratamento **"tu"** consistente entre landing e app ("Começa", "Trata",
  "Podes escolher") ✅ — coerente e adequada ao público (treinadores).

**Inconsistências reais a resolver:**
1. **"template" vs "modelo"** — o mesmo conceito com dois nomes em ecrãs diferentes.
   Uniformizar em **"modelo"** (PT-PT).
2. **"Início" vs "painel" vs "dashboard"** — três nomes para o mesmo ecrã. Uniformizar.
3. **Emoji pontual** ("🎉") destoa da voz assertiva e sóbria do resto do produto.

**Veredicto de tom:** a voz é coerente e credível. As três inconsistências acima são
pequenas e de correção rápida, mas numa auditoria de venda contam.

---

## 3 Emails de Onboarding

> Tom: assertivo, "tu", PT-PT, sem jargão. Uma ação clara por email.

### Email 1 — Boas-vindas (imediato após registo)

**Assunto:** Bem-vindo ao Mister — o teu escalão começa aqui

**Corpo:**

Olá {primeiro_nome},

Bem-vindo ao Mister. Foi feito para o futsal a sério — não é futebol adaptado.

O caminho mais rápido para veres valor é montares o teu primeiro escalão. Em cerca de
10 minutos ficas com o plantel carregado, o primeiro treino agendado e a primeira
convocatória pronta para o WhatsApp.

**➡️ [Começar a montar o escalão]({link_vitoria_rapida})**

Qualquer dúvida, responde a este email. Lemos todas.

Até já,
Equipa Mister

---

### Email 2 — D+1 (registou-se, mas ainda não inseriu dados)

**Assunto:** {primeiro_nome}, o teu plantel ainda está à espera

**Corpo:**

Olá {primeiro_nome},

Reparámos que ainda não adicionaste atletas. É o primeiro passo — e é o mais rápido.

Não precisas de preencher tudo: **nome, número e escalão** de cada atleta chega para
arrancar. Os detalhes (posições, contactos, foto) preenches quando te der jeito.

**➡️ [Adicionar o plantel em 3 minutos]({link_plantel_massa})**

Com o plantel montado, o treino e a convocatória saem num instante.

Equipa Mister

---

### Email 3 — D+7 (tem plantel, mas nenhuma sessão criada)

**Assunto:** Falta o mais importante: o primeiro treino

**Corpo:**

Olá {primeiro_nome},

Já tens o plantel — boa. Falta pôr o Mister a trabalhar por ti: **agendar o
primeiro treino**.

Não começas do zero. Escolhe um dos nossos modelos prontos, mete a data e o escalão, e
está feito. Depois é só marcar presenças no telemóvel, à beira do campo.

**➡️ [Agendar o primeiro treino]({link_treino_novo})**

E se preferires ver primeiro como funciona, responde a este email que marcamos 10
minutos contigo.

Equipa Mister

---

## Veredicto de Copy

**"A copy está ao nível de um produto profissional pronto para venda?"**

### PARCIALMENTE.

- **Microcopy in-app: SIM.** Botões específicos, estados vazios com próximo passo,
  mensagens de erro maioritariamente acionáveis, terminologia de futsal correta e PT-PT
  impecável. É trabalho de qualidade e deve servir de padrão.

- **Landing page: NÃO, ainda.** Vende features, não resultados. A headline é genérica e
  o melhor argumento do produto ("Futsal a sério, não futebol adaptado") está escondido.
  Falta prova social e ancoragem de valor no pricing.

**Bloqueadores antes de venda (rápidos):**
1. Corrigir o erro **"Tudo o do plano Individual"** → "Tudo o que tens no plano Individual".
2. Reescrever **headline + subheadline** para benefício/posicionamento (propostas acima).
3. Uniformizar **"template" → "modelo"** e **"Início/painel/dashboard"** num só nome.
4. Substituir **"setup do clube" → "definições do clube"**.

Com estes quatro pontos resolvidos e uma faixa de prova social, a landing sobe de
"competente" para "pronta a converter".
