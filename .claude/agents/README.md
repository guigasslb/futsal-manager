# Equipa de QA & Personas — FutsalCoach

Agentes autónomos e críticos para garantir a qualidade do produto antes de ir a mercado.
Dois tipos: **Técnicos** (auditam o código) e **Personas** (simulam utilizadores reais).

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

## Filosofia

Estes agentes são **críticos por design**. Não estão aqui para validar — estão aqui para encontrar problemas.

Os agentes técnicos reportam com ficheiro e linha exactos.
Os agentes persona falam na primeira pessoa — como o utilizador real pensaria e sentiria.

O produto vai ser vendido a treinadores com dinheiro real. A barra é alta.
