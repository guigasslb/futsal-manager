# Auditoria de Growth — Tiago Lopes (Growth Specialist)

> Análise de ativação do Mister. Foco: time-to-value, Day-1/Day-7 retention,
> adoção de features. Método: leitura do funil real de entrada
> (`app/page.tsx`, `(auth)/registar`, `(auth)/login`, `criar-clube`, `(app)/layout.tsx`,
> `(app)/dashboard`, `(app)/onboarding`, `(app)/vitoria-rapida`) e das server actions
> de onboarding. Data: 2026-08.

---

## TL;DR (o que importa)

O produto **tem** peças de ativação bem desenhadas — landing clara, registo enxuto,
wizard de setup (`/onboarding`) e um percurso de "vitória rápida" (`/vitoria-rapida`)
com plantel-em-massa → treino de template → convocatória WhatsApp. **O problema é que
essas peças não estão ligadas ao caminho que o utilizador realmente percorre.**

Três quebras matam a ativação de um clube novo:

1. **O registo não faz login automático.** Depois de criar conta, o utilizador é
   atirado de volta para `/login` para escrever email+password *outra vez*.
2. **Criar um clube não cria época nem escalão.** `criarClube()` só cria clube,
   perfis e adesão. `obterEpocaAtiva()` devolve `null`.
3. **O dashboard de um clube novo é um beco.** Sem época ativa, o dashboard faz
   *early-return* com "Nenhuma época ativa → Ir para Épocas". O belíssimo wizard
   `/onboarding` (identidade → escalões → época) **nunca é acionado** — não há
   nenhum redirect para ele. Fica órfão.

Resultado: o novo utilizador cai em `Definições → Épocas` de mão vazia, tem de
descobrir sozinho que precisa de época → escalão → atletas → treino antes de ver
qualquer valor. **O caminho feliz existe no código mas está desligado da porta de entrada.**

---

## Funil de Ativação

| Etapa | Passos | Drop-off estimado | Problema principal |
|---|---|---|---|
| **Registo** | 3 campos (nome, email, password ≥8) | **Baixo** | Enxuto e sem verificação de email — bom. Mas **não faz auto-login**: redireciona para `/login` e obriga a reautenticar. |
| **First Login** | Login manual → `criar-clube` (nome + 2 cores) → `/dashboard` | **Médio** | Dupla entrada de credenciais (fricção evitável). Criar clube é rápido, mas cores obrigam a decisão cosmética antes de qualquer valor. |
| **First Value** | ~7–9 passos, espalhados por 3+ secções | **Alto** | Clube novo não tem época nem escalão → dashboard bloqueado em "Nenhuma época ativa". Wizard `/onboarding` e `/vitoria-rapida` não são forçados nem sugeridos aqui. Utilizador entregue à navegação de Definições. |
| **Habituação D7** | — | **Alto** | Sem notificações push/email. Lembretes só *in-app* ("eventos hoje") — só têm valor se o utilizador **já voltou** e **já tem dados**. Nenhum gancho externo traz o utilizador de volta. |

### Detalhe por etapa

**Etapa 1 — Registo** (`components/auth/RegistarForm.tsx` + `lib/actions/onboarding.ts::registar`)
- 3 campos. Sem verificação de email, sem confirmação de password, sem captcha. Excelente para TTV.
- **Anti-padrão:** após sucesso, `toast("Conta criada. Inicia sessão.")` + `router.push("/login")`.
  O utilizador acabou de provar identidade e é obrigado a prová-la de novo. Cada reautenticação
  é um ponto de abandono e um "porquê?" na cabeça do utilizador.
- Não há "começar sem conta" / trial anónimo. Para um SaaS onde o valor é visual e imediato,
  isto é uma barreira à experimentação.

**Etapa 2 — First Login** (`(app)/layout.tsx`, `criar-clube/page.tsx`)
- Layout protege tudo e, sem adesão ativa, redireciona para `/criar-clube`. Correto.
- `CriarClubeForm` pede nome + cor primária + cor secundária. As cores têm defaults sensatos
  mas estão em destaque — é *branding*, não *valor*. Podia ser um passo opcional pós-ativação.

**Etapa 3 — First Value** (a quebra principal)
- `criarClube()` cria `Clube` + `Perfil`(s) + `MembroClube`. **Não cria `Epoca` nem `Escalao`.**
- `obterEpocaAtiva()` → `null` (não há época `ativa: true`).
- `dashboard/page.tsx` faz `if (!clubeId || !epoca) return <EstadoVazio "Nenhuma época ativa" />`.
  Este *early-return* acontece **antes** do `BannerVitoriaRapida` e antes de qualquer atalho útil.
  O único CTA é "Ir para Épocas".
- O wizard `/onboarding` (que cria escalões + época) **não tem nenhum redirect a apontar-lhe**
  (confirmado: nenhum `redirect("/onboarding")` no código). Só é alcançável por link manual
  dentro do banner "sem escalões" da própria `/vitoria-rapida` — que por sua vez também não
  é o destino pós-criação de clube.
- `/vitoria-rapida` ("Começar") só aparece na navegação quando `plantelVazio` — mas para lá
  chegar o utilizador tem de passar o bloqueio da época primeiro.

**Etapa 4 — Habituação**
- Lembretes de "hoje" no dashboard (`construirLembretesHoje`) — bom, mas 100% in-app e passivo.
- Sem push, sem email de resumo, sem lembrete de "tens treino amanhã, marca presenças".
- O dashboard só ganha vida com dados (próximo treino/jogo, stats). Um clube nas primeiras
  semanas vê sobretudo estados vazios → pouca razão para voltar diariamente.

---

## "Aha Moment" — Atual vs Ideal

**Atual:** Difuso e adiado. Na prática, o primeiro momento em que o utilizador sente valor
tangível é quando **gera a primeira convocatória de WhatsApp** (passo 3 da vitória rápida) —
um texto pronto a colar no grupo dos pais. Mas para lá chegar precisa de época + escalão +
atletas + jogo, e o caminho até lá não está sinalizado a partir do dashboard bloqueado.
Muitos utilizadores nunca chegam a este momento.

**Ideal:** O "aha" deve ser **a convocatória partilhável gerada em <5 minutos**, porque é o
output que o treinador reconhece imediatamente como "isto poupa-me tempo real todas as semanas".
Deve ser o **destino explícito do onboarding**, não uma feature escondida no fim de um percurso
opcional. Um segundo "aha" de retenção é o **dashboard-herói com o próximo treino + botão
"Marcar presenças"** — mas esse só cria hábito depois de já existirem dados.

Regra de ouro: o onboarding tem de **produzir** o aha, não apenas configurar as condições para
ele. Hoje configura (clube, cores) e pára antes do valor.

---

## Time-to-Value

**"Quanto tempo leva um novo utilizador a ver o primeiro valor real?"**

- **Caminho atual (real):** ~7 a 9 passos distribuídos por Registo → Login (2ª vez) →
  Criar clube → *bloqueio* → Definições/Épocas (criar + ativar) → Definições/Escalões (criar) →
  Plantel (criar atletas) → Treinos/novo → abrir sessão → marcar presenças.
  Estimativa realista: **15–25 minutos**, com pelo menos um ponto onde o utilizador tem de
  *adivinhar* a ordem correta (época antes de escalão antes de atleta antes de treino).
  Marcar presenças — o pedido explícito da auditoria — **não está** em nenhum percurso guiado.

- **Caminho desenhado mas desligado (`/vitoria-rapida`):** 3 passos (plantel em massa →
  treino de template → convocatória) — **~5 minutos** — *se* época e escalões já existirem.
  Como não existem por defeito, este percurso arranca partido (mostra "sem escalões").

Veredicto de TTV: **o produto tem um caminho de 5 minutos, mas serve ao utilizador um de 20.**

---

## Top 5 Oportunidades de Melhoria de Conversão

1. **[Quick win — impacto alto, esforço baixo] Auto-login no registo.**
   Em `registar()`, autenticar a sessão logo após criar o utilizador (em vez de
   `push("/login")`). Elimina a dupla entrada de credenciais e um ponto de abandono inteiro.
   *(Nota: toca no fluxo de sessão/auth — requer autorização explícita antes de mexer.)*

2. **[Quick win] Criar época + escalões por defeito ao criar o clube.**
   Em `criarClube()`, dentro da transação, criar uma `Epoca` "2026/2027" com `ativa: true`
   e 1–2 escalões-semente (ex.: "Seniores"). Só isto **desbloqueia o dashboard** e faz o
   `/vitoria-rapida` arrancar inteiro. É a correção de maior ROI do relatório.

3. **[Médio] Forçar o wizard `/onboarding` no primeiro acesso.**
   No `(app)/layout.tsx`, quando `!clube.onboardingConcluido`, redirecionar para `/onboarding`
   (a página já protege contra reentrada). O wizard existe, está bem feito, e está desligado —
   basta ligar a porta.

4. **[Médio] Transformar o dashboard vazio numa checklist de ativação, não num beco.**
   Substituir o *early-return* "Nenhuma época ativa" por um cartão de progresso
   ("Clube ✓ · Época ☐ · Escalão ☐ · Plantel ☐ · 1º treino ☐") com CTAs diretos e link
   proeminente para `/vitoria-rapida`. O utilizador nunca deve ver um ecrã sem próximo passo óbvio.

5. **[Médio/Alto] Ganchos de retorno externos (retenção D1–D7).**
   Email/WhatsApp de "tens treino amanhã — marca presenças" e resumo semanal. Hoje toda a
   retenção depende de o utilizador *lembrar-se* de voltar. Um único lembrete transacional por
   semana muda a curva de D7. (Reutiliza a infra de comunicação/WhatsApp já existente.)

---

## Proposta de Onboarding Simplificado (<5 min)

Fluxo alternativo, reduzindo o TTV para minutos e terminando **no aha (convocatória)**:

```
1. Registo (nome, email, password)  ──►  AUTO-LOGIN  (sem 2ª autenticação)
        │
2. "Cria o teu clube" — só o NOME (cores/logo ficam para depois, opcional)
        │  ao submeter, criarClube() cria também:
        │    • Época ativa "2026/2027"
        │    • Escalão-semente "Seniores" (editável)
        ▼
3. VITÓRIA RÁPIDA (destino forçado, não o dashboard):
   Passo 1 · Plantel em massa    → cola/escreve 8–12 nomes (30 s)
   Passo 2 · 1º treino template  → 1 clique (template curado já instalado)
   Passo 3 · Convocatória WhatsApp → gera texto → **AHA** (copiar/partilhar)
        ▼
4. "Ir para o painel" → dashboard já com dados (herói = próximo treino,
   botão "Marcar presenças" à vista)
```

Diferenças-chave face ao atual:
- **Zero decisões cosméticas antes do valor** (cores → Definições, depois).
- **Época/escalão nascem com o clube** → nada bloqueia.
- **O onboarding é o percurso de valor**, não um setup que pára antes do valor.
- **Termina num output partilhável** que o treinador leva para o grupo de WhatsApp — o que
  gera boca-a-boca (o partilhado *é* marketing: outros treinadores veem o formato e perguntam).

Adição de retenção: ao concluir, oferecer "Queres um lembrete no dia do treino?" (opt-in) —
transforma um evento único num hábito semanal.

---

## Veredicto de Growth

**A app está preparada para crescer organicamente? PARCIALMENTE.**

**Porquê:** A matéria-prima de um funil de ativação de topo **já está construída** — registo
enxuto, wizard de setup, percurso de vitória rápida de 3 passos, e um output naturalmente viral
(convocatória de WhatsApp que circula em grupos de pais/treinadores). O produto sabe qual é o
seu aha.

Mas **está desligado nas junções que mais importam:** o registo não continua a sessão, criar
clube deixa o ambiente sem época/escalão, e o dashboard de estreia é um beco em vez de um
trampolim para o percurso de valor que existe logo ao lado. Hoje, o utilizador que persiste
até ao valor fá-lo **apesar** do onboarding, não **através** dele — e a curva de retenção não
tem nenhum gancho externo que combata o esquecimento.

São correções de baixo/médio esforço com efeito desproporcional: ligar o auto-login, semear
época+escalão, forçar o wizard e apontá-lo ao aha. Feito isto, o Mister passa de
"cresce se o utilizador for teimoso" para "vende-se sozinho nos primeiros 5 minutos" — e o
output partilhável fecha o loop de crescimento orgânico.

**Prioridade de execução:** #2 (semear época/escalão) → #1 (auto-login) → #3 (forçar wizard)
→ #4 (dashboard-checklist) → #5 (lembretes). As duas primeiras, sozinhas, provavelmente
duplicam a taxa de utilizadores que chegam ao primeiro valor.
```
