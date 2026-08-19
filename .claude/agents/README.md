# Equipa Mister — QA, Personas & Produto

Agentes autónomos e críticos para garantir a qualidade do produto antes de ir a mercado.
Três tipos: **Técnicos** (auditam o código), **Personas** (simulam utilizadores reais) e
**Produto, Marketing & Crescimento** (avaliam o negócio — experiência, marca, mensagem e mercado).

---

## Agentes Técnicos

| Agente | Foco | Quando usar |
|---|---|---|
| `qa-negocio` | Lógica de negócio, invariantes de domínio | Após mudanças a regras de negócio, cálculos, multi-tenancy |
| `qa-funcional` | Cobertura spec vs implementação | Auditorias de completude, pré-release |
| `qa-frontend` | UI/UX, acessibilidade, responsividade | Após mudanças a componentes, novos ecrãs |
| `qa-backend` | Server Actions, segurança, padrões | Após mudanças a actions ou schemas |
| `qa-database` | Schema, índices, N+1, integridade | Após migrations, mudanças de schema |
| `qa-seguranca` | Vulnerabilidades, exposição de dados | Pré-release, após mudanças de auth-adjacentes |
| `qa-testes` | Suite Vitest, cobertura, gaps | Após novas features, pré-release |
| `qa-produto` | Experiência comercial, prontidão para venda | Revisões de produto, decisões de roadmap |

---

## Agentes Persona (utilizadores reais simulados)

| Agente | Persona | Contexto |
|---|---|---|
| `persona-treinador-solo-miudos` | Rui Santos, 34 anos | Treinador solo de Traquinas, sem clube na app, paga €4.99/mês |
| `persona-treinador-solo-seniores` | Miguel Ferreira, 42 anos | Treinador solo de Seniores, Nível 2 FPF, exigente analiticamente |
| `persona-treinador-clube-miudos` | Joana Rodrigues, 28 anos | Treinadora de Benjamins dentro do SLE, membro com perfil Treinador |
| `persona-treinador-clube-seniores` | André Costa, 38 anos | Treinador Sub-17 no SLE, exige analytics avançados |
| `persona-diretor-tecnico` | Carlos Mendes, 52 anos | DT do SLE, supervisiona 5 escalões, decide subscrição de clube |
| `persona-presidente` | Dr. António Silva, 58 anos | Presidente do SLE, decide o orçamento, vê a app 1x/mês |

---

## Agentes de Produto, Marketing & Crescimento

Equipa permanente do produto — não simulam utilizadores nem auditam código linha a linha.
Avaliam o **negócio**: experiência, marca, mensagem, mercado, crescimento e prioridades.

| Agente | Persona | Foco | Quando usar |
|---|---|---|---|
| `ux-specialist` | Marta Sousa, 35 anos | User journeys, friction, mobile-first, time-to-value | Rever onboarding e fluxos diários; caçar fricção |
| `ui-design-reviewer` | Sofia Alves, 31 anos | Consistência visual, marca, tipografia, estados, a11y | Após novos ecrãs/componentes; coerência de marca |
| `marketing-strategist` | Pedro Vieira, 40 anos | Proposta de valor, pricing, diferenciação, landing | Rever posicionamento e mensagens de valor |
| `social-media-manager` | Beatriz Santos, 26 anos | Momentos partilháveis, conteúdo IG/FB, UGC | Planear presença social e conteúdo (escreve `docs/SOCIAL_MEDIA_STRATEGY.md`) |
| `growth-specialist` | Tiago Lopes, 36 anos | Funil de ativação, drop-off, aha moment, upsell | Otimizar conversão do trial e retenção D1 |
| `copywriter-pt` | Ana Ferreira, 33 anos | Copy da landing, microcopy, erros, emails (PT-PT) | Melhorar texto de interface e onboarding (escreve `docs/COPY_IMPROVEMENTS.md`) |
| `product-owner` | Ricardo Faria, 44 anos | Spec vs implementação, backlog, critérios de pronto | Decisões de roadmap e priorização de sprint |
| `competitive-analyst` | Luís Costa, 38 anos | Benchmark vs SportEasy/Spond/TeamSnap, USPs, posicionamento | Analisar mercado e diferenciação |

> `social-media-manager` e `copywriter-pt` **escrevem entregáveis** em `docs/` (têm `Write`).
> Os restantes só leem e reportam. `ux-specialist` e `growth-specialist` podem correr comandos (`Bash`) para inspecionar o funil e os fluxos.

---

## Como usar

### Auditoria técnica completa (pré-release)
```
@qa-negocio faz auditoria completa
@qa-funcional faz auditoria completa
@qa-frontend faz auditoria completa
@qa-backend faz auditoria completa
@qa-database faz auditoria completa
@qa-seguranca faz auditoria completa
@qa-testes faz auditoria completa
@qa-produto faz avaliação de prontidão comercial
```

### Teste de personas (perspectiva de utilizador)
```
@persona-treinador-solo-miudos avalia a experiência de onboarding e uso diário
@persona-treinador-solo-seniores avalia analytics e periodização
@persona-treinador-clube-miudos avalia permissões e fluxos de clube
@persona-treinador-clube-seniores avalia profundidade de análise
@persona-diretor-tecnico avalia visão de clube e coordenação
@persona-presidente avalia imagem, segurança e ROI
```

### Revisão focada (após feature específica)
```
@qa-negocio verifica a lógica de convocatória
@persona-treinador-solo-miudos testa o novo fluxo de onboarding
@persona-diretor-tecnico avalia o novo relatório de clube
```

---

## Como invocar toda a equipa

### Auditoria completa de produto (produto + marca + mercado)
Perspetiva de negócio, ideal antes de uma ronda de investimento, um lançamento, ou uma decisão de roadmap:
```
@product-owner faz avaliação de alinhamento spec vs implementação e prioriza a próxima sprint
@ux-specialist mapeia os user journeys e lista os friction points por severidade
@ui-design-reviewer faz checklist de consistência visual e acessibilidade
@growth-specialist analisa o funil de ativação e propõe o aha moment
@marketing-strategist pontua a landing page e recomenda posicionamento
@competitive-analyst compara com SportEasy/Spond/TeamSnap e valida os USPs
@copywriter-pt revê a copy da landing e do in-app e escreve os emails de onboarding
@social-media-manager desenha a estratégia de conteúdo e os 10 posts exemplo
```

### Auditoria de lançamento (go-to-market)
Foco em vender: mensagem, mercado, conversão e conteúdo:
```
@marketing-strategist avalia a proposta de valor e o pricing da landing
@competitive-analyst confirma a diferenciação e as vulnerabilidades competitivas
@copywriter-pt melhora a copy da landing e escreve os emails de onboarding
@growth-specialist otimiza o funil de registo → primeiro valor
@social-media-manager cria a estratégia de redes sociais e o content calendar
```

### Auditoria de experiência (produto usável e bonito)
Foco em quem usa: fluxos, fricção e coerência visual:
```
@ux-specialist avalia onboarding, uso diário e experiência mobile
@ui-design-reviewer verifica marca, tipografia, espaçamento, estados e a11y
@copywriter-pt corrige o microcopy, estados vazios e mensagens de erro
@growth-specialist mede o time-to-value e os pontos de abandono
```

### Revisão focada (após uma feature ou ecrã específico)
```
@ux-specialist avalia a fricção do novo fluxo de convocatória
@ui-design-reviewer verifica a consistência visual do novo ecrã de analíticos
@copywriter-pt revê o texto do novo estado vazio
@product-owner confirma se a feature cumpre a spec e a definição de pronto
```

### Combinar com a equipa técnica e as personas
A auditoria mais completa possível cruza as três lentes — **negócio** (esta equipa), **código** (agentes técnicos) e **utilizador** (personas):
```
# Negócio
@product-owner + @growth-specialist + @marketing-strategist

# Código
@qa-funcional + @qa-frontend + @qa-seguranca

# Utilizador
@persona-treinador-solo-miudos + @persona-presidente
```

---

## Filosofia

Estes agentes são **críticos por design**. Não estão aqui para validar — estão aqui para encontrar problemas.

Os agentes técnicos reportam com ficheiro e linha exactos.
Os agentes persona falam na primeira pessoa — como o utilizador real pensaria e sentiria.
Os agentes de produto, marketing e crescimento avaliam o negócio como profissionais céticos — cada crítica vem com o sítio exato e a alternativa concreta.

O produto vai ser vendido a treinadores com dinheiro real. A barra é alta.
