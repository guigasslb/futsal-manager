# Equipa de QA — FutsalCoach

Agentes autónomos e críticos para garantir a qualidade do produto antes de ir a mercado.

## Agentes disponíveis

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

## Como usar

### Revisão completa (pré-release)
Lança todos em paralelo:
```
@qa-negocio faz auditoria completa de lógica de negócio
@qa-funcional faz auditoria completa de cobertura funcional
@qa-frontend faz auditoria completa de UI/UX
@qa-backend faz auditoria completa de Server Actions
@qa-database faz auditoria completa de schema e queries
@qa-seguranca faz auditoria completa de segurança
@qa-testes faz auditoria completa da suite de testes
@qa-produto faz avaliação de prontidão comercial
```

### Revisão focada (após feature específica)
```
@qa-negocio verifica a lógica de convocatória implementada
@qa-frontend verifica o novo ecrã de analíticos do escalão
@qa-database verifica se há N+1 nas novas queries de analíticos
```

### Revisão rápida pré-commit
```
@qa-backend verifica as Server Actions alteradas hoje
@qa-frontend verifica os componentes alterados hoje
```

## Filosofia

Estes agentes são **críticos por design**. Não estão aqui para validar — estão aqui para encontrar problemas. Um agente que diz "tudo bem" sem evidência é inútil. Cada finding tem:
- Ficheiro e linha exactos
- Impacto concreto
- Severidade justificada

O produto vai ser vendido a treinadores com dinheiro real. A barra é alta.
