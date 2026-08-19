# Mister

Training Management System dedicado ao futsal. Implementação da especificação v4.0.

Stack: Next.js 15 (App Router) · React 19 · TypeScript strict · Prisma + PostgreSQL · Auth.js v5 · Zod · Tailwind + shadcn/ui.

## Setup

Requer Node 18.18+ e uma base de dados PostgreSQL (ex: Supabase).

```bash
# 1. Instalar dependências
npm install

# 2. Configurar ambiente
cp .env.example .env.local
#    - DATABASE_URL: string de ligação PostgreSQL
#    - AUTH_SECRET: gerar com `npx auth secret`

# 3. Base de dados
npx prisma migrate dev --name init
npx prisma generate
npx prisma db seed

# 4. Arrancar
npm run dev
```

App em http://localhost:3000 (redireciona para /login).

### Login inicial (do seed)

```
goncalo@jsc.pt / futsal2026
adjunto@jsc.pt / futsal2026
```

As passwords podem ser definidas por `SEED_PASS_GONCALO` / `SEED_PASS_ADJUNTO` antes de correr o seed.

## Scripts

| Comando | Ação |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção (gera Prisma Client) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Migração de desenvolvimento |
| `npm run db:seed` | Popular a base de dados |
| `npm run db:studio` | Prisma Studio |

## Estado da implementação (ordem da secção 18)

- [x] **1. Fundações** — projeto, Tailwind, tokens de design, schema Prisma completo (16 entidades, 8 enums), Auth.js + middleware, helper de época ativa, seed. Login a funcionar e a redirecionar para o dashboard.
- [ ] 2. Layout + Época (navegação responsiva, SeletorEpoca, guarda de rotas)
- [ ] 3. Definições base (escalões, épocas, utilizadores, métricas, habilidades)
- [ ] 4. Plantel
- [ ] 5. Exercícios (sem campo)
- [ ] 6. Editor de campo (SVG)
- [ ] 7. Treinos
- [ ] 8. Presenças
- [ ] 9. Jogos + convocatória
- [ ] 10. Estatísticas
- [ ] 11. Agregações
- [ ] 12. Caderneta
- [ ] 13. Dashboard
- [ ] 14. Estados e polish

## Notas de arquitetura

- **Época ativa** (`lib/epoca-context.ts`): resolve por cookie `epoca_ativa`, com fallback para a época `ativa: true`. Todas as queries de dados filtram por época + clube do utilizador autenticado.
- **Resultado<T>** (`lib/utils.ts`): tipo de retorno consistente de todas as Server Actions (secção 10.1).
- **Validação Zod** partilhada em `lib/schemas/`, fonte única de verdade.
- Interface 100% em português de Portugal.
