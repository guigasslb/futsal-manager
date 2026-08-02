# Guia de deploy — FutsalCoach

Complemento operacional da bíblia (`FutsalManager_Spec_v5.md`, secção 15). Passos para colocar a app em produção.

## 0. Deploy rápido no Vercel (recomendado)

1. Criar conta em **vercel.com** com "Continue with GitHub".
2. **Add New → Project** → importar o repo `guigasslb/futsal-manager` (branch `main`).
3. Vercel deteta Next.js automaticamente (build `npm run build`, que corre `prisma generate && next build`).
4. **Environment Variables** — adicionar (secção 1): `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `AUTH_TRUST_HOST=true`.
5. **Deploy**. No fim, a app fica em `https://<projeto>.vercel.app`.
6. Migrações: a BD Supabase já tem o schema aplicado (`prisma migrate deploy` já corrido em dev). Numa BD nova, correr `npx prisma migrate deploy` com o `DATABASE_URL` de produção antes do primeiro acesso.

> Prisma: o `generator` inclui `binaryTargets = ["native", "rhel-openssl-3.0.x"]` para o runtime serverless do Vercel. Cada `git push` para `main` faz redeploy automático.

## 1. Variáveis de ambiente (obrigatórias)

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | Ligação da app — pooler Supabase (Transaction, porta 6543, `?pgbouncer=true`) |
| `DIRECT_URL` | Ligação direta (porta 5432) — usada pelas migrações Prisma |
| `AUTH_SECRET` | Segredo do Auth.js — gerar com `npx auth secret` |
| `SEED_PASS_GONCALO`, `SEED_PASS_ADJUNTO` | **Obrigatórias em produção** se o seed for corrido (o seed aborta sem elas) |
| `AUTH_TRUST_HOST` | `true` se atrás de proxy e o host não for auto-detetado (não é preciso no Vercel) |

> **Segurança:** nunca commitar `.env`. Injetar via secrets do host. Rodar `AUTH_SECRET` e a password da BD sempre que houver suspeita de exposição.

## 2. Migrações da base de dados

Em produção usar **sempre** `migrate deploy` (nunca `migrate dev` — este pode fazer reset):

```bash
npx prisma migrate deploy
```

Aplica todas as migrações pendentes de `prisma/migrations/` de forma não-destrutiva. Correr no pipeline de deploy, antes de arrancar a app.

## 3. Build

```bash
npm ci
npm run build   # corre `prisma generate` + `next build`
npm run start
```

A build corre ESLint e typecheck — falha se houver erros. Verificar localmente antes de fazer push.

## 4. Seed (só a 1.ª vez / ambiente novo)

```bash
SEED_PASS_GONCALO=... SEED_PASS_ADJUNTO=... npm run db:seed
```

Idempotente (não faz nada se o clube já existir). **Falha em produção sem as passwords** — por design, para nunca criar contas com credencial pública.

## 5. Cabeçalhos de segurança

Configurados em `next.config.js` (`headers()`): CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy. Rever a CSP se se adicionarem origens externas (ex.: novo CDN de imagens).

## 6. Pendente / a configurar antes de tráfego real

- **Monitorização de erros** — integrar Sentry (ou equivalente). Ponto de ligação já preparado em `app/global-error.tsx` (`console.error` a substituir pela captura). Sem isto, erros de produção não deixam rasto.
- **Backups da BD** — confirmar backups automáticos + teste de restauro no plano Supabase.
- **RGPD (menores) — consentimento tratado pelo clube (decisão 2026-08-02).** O consentimento parental (dados + imagem) é **recolhido pelo clube no ato de inscrição**, fora da aplicação (formulário/papel). A app assume que esse consentimento existe para os atletas registados. *Melhorias futuras (não bloqueadoras):* registo do consentimento na app (modelo `Consentimento` já existe no schema, por ligar) e hard-delete de dados pessoais (direito ao esquecimento) — atualmente `apagarAtleta` é soft-delete.
- **Rate-limiting de login** — atual é em memória (single-instance). Para multi-instância, migrar para store partilhado.

## 7. Dependências

`npm audit` fica limpo de críticas/high no runtime de produção. As restantes (vitest/vite/esbuild) são **dev-only** (nunca vão para produção); limpar exigiria `vitest@4` (breaking) — reavaliar quando for oportuno.
