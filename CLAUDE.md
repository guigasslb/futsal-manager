# FutsalManager — Instruções do projeto

Training Management System dedicado ao futsal. A especificação em `docs/FutsalManager_Spec_v4.md` é a **fonte única de verdade** ("a bíblia").

## Regras de leitura da spec

- Segue a spec **à letra**. Nomes de campos, tipos, assinaturas e terminologia são especificação, não sugestão.
- **DEVE** = obrigatório · **DEVERIA** = recomendado · **NÃO FAZ PARTE DO MVP** = não implementar agora.
- Implementa pela ordem da **secção 18**. Cada passo tem de ficar funcional e testado antes de avançar.
- Não introduzas desvios sem instrução explícita. Em dúvida, pergunta antes de decidir.

## Stack

Next.js 15 (App Router) · React 19 · TypeScript strict · Prisma + PostgreSQL (Supabase) · Auth.js v5 · Zod · Tailwind + shadcn/ui.

## Convenções fixas

- **Server Actions**, não REST (exceto o handler do Auth.js). Todas começam com `"use server"`.
- Toda a validação com **Zod** em `lib/schemas/` — fonte única, partilhada cliente/servidor.
- Todas as actions: validam input → verificam `auth()` → obtêm época via `obterEpocaAtiva()` → devolvem `Resultado<T>` (`lib/utils.ts`) → `revalidatePath()`.
- Todas as queries filtram pelo **clube** do utilizador autenticado e, quando aplicável, pela **época ativa**.
- Interface 100% em **português de Portugal**, com a terminologia do Anexo A.
- Sistema de design da secção 19 (tokens de cor, tipografia, alvos de toque ≥44px). Sem dark mode no MVP.

## Estado dos passos (secção 18)

- [x] **1. Fundações** — config, schema Prisma (16 entidades, 8 enums), Auth.js + middleware, `obterEpocaAtiva()`, seed, login funcional.
- [x] **2. Layout + Época** — BarraTopo, Navegacao (sidebar+bottom-nav), SeletorEpoca, EstadosUI, stubs de rotas.
- [x] **3. Definições base** — CRUD de escalões, épocas, utilizadores, métricas, habilidades.
- [x] **4. Plantel** — CRUD de atletas, lista c/ tabs por escalão, perfil (sem estatísticas).
- [x] **5. Exercícios** — CRUD da biblioteca (sem editor de campo).
- [x] **6. Editor de campo (SVG)** — CampoFutsal, MiniaturaCampo, EditorCampo interativo.
- [x] **7. Treinos** — CRUD de sessões, gestão de exercícios (reordenar), lista c/ tabs.
- [x] **8. Presenças** — marcação por sessão (upsert em lote).
- [x] **9. Jogos + convocatória** — CRUD de jogos, abas convocatória/estatísticas/relatório.
- [x] **10. Estatísticas** — grelha por atleta convocado (campos de GR condicionais), upsert.
- [x] **11. Agregações** — `obterEstatisticasAtleta` no perfil (golos, jogos, taxa presença).
- [x] **12. Caderneta** — progresso de habilidades por atleta/época, agrupado por nível.
- [x] **13. Dashboard** — próximo treino/jogo, ações rápidas, resumo da época.
- [x] **14. Estados e polish** — not-found, redirects para /dashboard, estados vazios.

## Comandos

`npm run dev` · `npm run typecheck` · `npm run lint` · `npm run db:migrate` · `npm run db:seed` · `npm run db:studio`

Definição de pronto de cada funcionalidade: secção 24.
