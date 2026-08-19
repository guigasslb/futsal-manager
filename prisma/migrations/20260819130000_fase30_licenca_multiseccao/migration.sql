-- Fase 30 — Licença multi-secção (bíblia v7 §3.11, §17.1, §16 Fase 30, Apêndice C.3).
--
-- Última migração em falta para completar a v7 (Apêndice C.3). Adiciona ao modelo
-- `Licenca` os dois campos multi-secção:
--   - `modalidade` (Modalidade?)  — Individual: modalidade contratada; null em Clube.
--   - `numSeccoes` (Int, default 1) — Clube: nº de secções faturadas (pricing §17.1).
--
-- Ambas as colunas são aditivas (nullable / com default). O backfill é idempotente e
-- não destrói dados existentes (100% futsal). Não toca em auth.

-- ─────────────────────────────────────────────
-- Colunas novas (aditivas)
-- ─────────────────────────────────────────────
ALTER TABLE "Licenca" ADD COLUMN IF NOT EXISTS "modalidade" "Modalidade";
ALTER TABLE "Licenca" ADD COLUMN IF NOT EXISTS "numSeccoes" INTEGER NOT NULL DEFAULT 1;

-- ─────────────────────────────────────────────
-- Backfill (idempotente)
-- ─────────────────────────────────────────────

-- Individual: modalidade contratada = FUTSAL (todos os dados existentes são futsal).
UPDATE "Licenca" l
SET "modalidade" = 'FUTSAL'
WHERE l."tipo" = 'INDIVIDUAL'
  AND l."modalidade" IS NULL;

-- Clube: default FUTSAL (editável depois; a licença de Clube não fixa modalidade logicamente).
UPDATE "Licenca" l
SET "modalidade" = 'FUTSAL'
WHERE l."tipo" = 'CLUBE'
  AND l."modalidade" IS NULL;

-- numSeccoes: contar secções ativas por clube (default 1 mantém-se para clubes sem secções).
UPDATE "Licenca" l
SET "numSeccoes" = (
  SELECT COUNT(*)::int FROM "Seccao" s
  WHERE s."clubeId" = l."clubeId"
)
WHERE l."clubeId" IS NOT NULL
  AND l."numSeccoes" = 1
  AND EXISTS (SELECT 1 FROM "Seccao" s WHERE s."clubeId" = l."clubeId");
