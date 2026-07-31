# FutsalManager — Instruções do projeto

Training Management System dedicado ao futsal. A **bíblia** do produto é `docs/FutsalManager_Spec_v5.md` — **fonte única de verdade** do produto final. (`docs/FutsalManager_Spec_v4_MVP_historico.md` é o histórico do MVP, arquivado — não usar como referência ativa.)

## Documentação (regra inquebrável)

- **Uma única bíblia:** `docs/FutsalManager_Spec_v5.md`. Sem ficheiros de informação funcional espalhados.
- **Nenhuma alteração de código sem atualizar a bíblia no mesmo passo.** A documentação nunca fica atrás do código.
- Toda a modificação à bíblia regista-se no **changelog dentro do próprio documento** (secção 19), com **data e descrição** da alteração.
- Objetivo: se o código se perder, a bíblia permite **recriar tudo do zero a 100%**.

## Regras de leitura da bíblia

- Segue a bíblia **à letra**. Nomes de campos, tipos, assinaturas e terminologia são especificação, não sugestão.
- **DEVE** = obrigatório · **DEVERIA** = recomendado · **FUTURO** = não implementar agora.
- Implementa pela ordem das fases (secção 16). Cada fase fica funcional e testada antes de avançar.
- Não introduzas desvios sem instrução explícita. Em dúvida, pergunta antes de decidir.

> **Nota de estado:** o MVP (secções abaixo) está concluído e aprovado. A partir daqui construímos o **produto final** definido no `Spec_v5`.

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

### Conformidade adicional com a spec
- [x] Métricas configuráveis capturadas por jogo (ValorMetrica, input adapta ao tipo).
- [x] Confirmação ao remover convocado com estatísticas (secção 22.4).
- [x] Pesquisa por nome no plantel e exercícios.
- [x] Toggle lista/calendário mensal nos treinos.
- [x] Aviso de número duplicado no plantel (secção 22.8).
- [x] Testes Vitest: schemas Zod, DiagramaCampo e agregações (secção 15) — 33 testes.

## Comandos

`npm run dev` · `npm run typecheck` · `npm run lint` · `npm run test` · `npm run db:migrate` · `npm run db:seed` · `npm run db:studio`

Definição de pronto de cada funcionalidade: secção 24.
