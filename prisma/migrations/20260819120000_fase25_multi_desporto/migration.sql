-- Fase 25 — Fundação multi-desporto (bíblia v7 §3.1.1, §3.2, §3.7, §16, Apêndice C).
--
-- Estrutura:
--   Parte 1 — Contract v6 pendente (§0/Apêndice C pré-requisito):
--     Clube.clubeTecnico, corPrimaria default, Atleta (drop legados + clubeId NOT NULL),
--     Exercicio.proprietario default, Presenca.escalaoId NOT NULL.
--   Parte 2 — Adições v7 (aditivas): enums, Seccao/MembroSeccao, seccaoId, modalidade*,
--     formato/formatoJogo, estatísticas de futebol.
--   Backfill — uma secção FUTSAL por clube + ligação de todos os escalões (Apêndice C.4).
--
-- Todas as adições são nullable/com default. Os DROP/SET NOT NULL são o *contract* da
-- fase expand v6 (dados já migrados por AtletaEscalao/f1b); backfills defensivos garantem
-- ausência de nulos antes de tornar colunas obrigatórias. Não toca em auth.

-- ─────────────────────────────────────────────
-- Parte 2.1 — Novos enums
-- ─────────────────────────────────────────────
CREATE TYPE "Modalidade" AS ENUM ('FUTSAL', 'FUTEBOL');
CREATE TYPE "FormatoJogo" AS ENUM ('FUTSAL_5', 'FUTEBOL_3_3', 'FUTEBOL_5_5', 'FUTEBOL_7', 'FUTEBOL_9', 'FUTEBOL_11');
CREATE TYPE "PapelSeccao" AS ENUM ('COORDENADOR');

-- Novos valores em enums existentes (aditivo).
ALTER TYPE "AmbitoPerfil" ADD VALUE IF NOT EXISTS 'SECCAO';

ALTER TYPE "Posicao" ADD VALUE IF NOT EXISTS 'DEFESA_CENTRAL';
ALTER TYPE "Posicao" ADD VALUE IF NOT EXISTS 'LATERAL_DIREITO';
ALTER TYPE "Posicao" ADD VALUE IF NOT EXISTS 'LATERAL_ESQUERDO';
ALTER TYPE "Posicao" ADD VALUE IF NOT EXISTS 'MEDIO_DEFENSIVO';
ALTER TYPE "Posicao" ADD VALUE IF NOT EXISTS 'MEDIO_CENTRO';
ALTER TYPE "Posicao" ADD VALUE IF NOT EXISTS 'MEDIO_OFENSIVO';
ALTER TYPE "Posicao" ADD VALUE IF NOT EXISTS 'EXTREMO_DIREITO';
ALTER TYPE "Posicao" ADD VALUE IF NOT EXISTS 'EXTREMO_ESQUERDO';
ALTER TYPE "Posicao" ADD VALUE IF NOT EXISTS 'AVANCADO';

ALTER TYPE "TipoEventoJogo" ADD VALUE IF NOT EXISTS 'REMATE';
ALTER TYPE "TipoEventoJogo" ADD VALUE IF NOT EXISTS 'CANTO';
ALTER TYPE "TipoEventoJogo" ADD VALUE IF NOT EXISTS 'FORA_DE_JOGO';
ALTER TYPE "TipoEventoJogo" ADD VALUE IF NOT EXISTS 'DESARME';

-- ─────────────────────────────────────────────
-- Parte 1 — Contract v6 + Clube
-- ─────────────────────────────────────────────

-- Clube: flag de clube técnico + default da cor Mister (novos registos apenas).
ALTER TABLE "Clube" ADD COLUMN IF NOT EXISTS "clubeTecnico" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Clube" ALTER COLUMN "corPrimaria" SET DEFAULT '#F0531E';

-- Exercicio: exercício criado por um treinador é pessoal por defeito (§4.2).
ALTER TABLE "Exercicio" ALTER COLUMN "proprietario" SET DEFAULT 'TREINADOR';

-- Atleta: backfill defensivo de clubeId (a partir do escalão legado) ANTES de dropar/NOT NULL.
UPDATE "Atleta" a
SET "clubeId" = e."clubeId"
FROM "Escalao" e
WHERE a."escalaoId" = e."id"
  AND a."clubeId" IS NULL;

ALTER TABLE "Atleta" ALTER COLUMN "clubeId" SET NOT NULL;

-- Remoção dos campos legados (substituídos por AtletaEscalao).
ALTER TABLE "Atleta" DROP CONSTRAINT IF EXISTS "Atleta_escalaoId_fkey";
ALTER TABLE "Atleta" DROP CONSTRAINT IF EXISTS "Atleta_escalaoSecundarioId_fkey";
ALTER TABLE "Atleta" DROP CONSTRAINT IF EXISTS "Atleta_epocaId_fkey";
DROP INDEX IF EXISTS "Atleta_escalaoId_idx";
DROP INDEX IF EXISTS "Atleta_escalaoSecundarioId_idx";
DROP INDEX IF EXISTS "Atleta_epocaId_idx";
DROP INDEX IF EXISTS "Atleta_epocaId_escalaoId_ativo_idx";
ALTER TABLE "Atleta" DROP COLUMN IF EXISTS "escalaoId";
ALTER TABLE "Atleta" DROP COLUMN IF EXISTS "escalaoSecundarioId";
ALTER TABLE "Atleta" DROP COLUMN IF EXISTS "epocaId";
CREATE INDEX IF NOT EXISTS "Atleta_clubeId_ativo_idx" ON "Atleta" ("clubeId", "ativo");

-- Presenca: backfill defensivo de escalaoId (a partir da sessão) ANTES de NOT NULL.
UPDATE "Presenca" p
SET "escalaoId" = s."escalaoId"
FROM "Sessao" s
WHERE p."sessaoId" = s."id"
  AND p."escalaoId" IS NULL;

ALTER TABLE "Presenca" ALTER COLUMN "escalaoId" SET NOT NULL;

-- ─────────────────────────────────────────────
-- Parte 2.2/2.3 — Secções
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Seccao" (
  "id"         TEXT NOT NULL,
  "clubeId"    TEXT NOT NULL,
  "modalidade" "Modalidade" NOT NULL,
  "nome"       TEXT,
  "criadoEm"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Seccao_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Seccao_clubeId_modalidade_key" ON "Seccao" ("clubeId", "modalidade");
CREATE INDEX IF NOT EXISTS "Seccao_clubeId_idx" ON "Seccao" ("clubeId");
ALTER TABLE "Seccao" DROP CONSTRAINT IF EXISTS "Seccao_clubeId_fkey";
ALTER TABLE "Seccao" ADD CONSTRAINT "Seccao_clubeId_fkey"
  FOREIGN KEY ("clubeId") REFERENCES "Clube" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "MembroSeccao" (
  "id"            TEXT NOT NULL,
  "seccaoId"      TEXT NOT NULL,
  "membroClubeId" TEXT NOT NULL,
  "papel"         "PapelSeccao" NOT NULL DEFAULT 'COORDENADOR',
  "criadoEm"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MembroSeccao_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "MembroSeccao_seccaoId_membroClubeId_key" ON "MembroSeccao" ("seccaoId", "membroClubeId");
CREATE INDEX IF NOT EXISTS "MembroSeccao_membroClubeId_idx" ON "MembroSeccao" ("membroClubeId");
ALTER TABLE "MembroSeccao" DROP CONSTRAINT IF EXISTS "MembroSeccao_seccaoId_fkey";
ALTER TABLE "MembroSeccao" ADD CONSTRAINT "MembroSeccao_seccaoId_fkey"
  FOREIGN KEY ("seccaoId") REFERENCES "Seccao" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MembroSeccao" DROP CONSTRAINT IF EXISTS "MembroSeccao_membroClubeId_fkey";
ALTER TABLE "MembroSeccao" ADD CONSTRAINT "MembroSeccao_membroClubeId_fkey"
  FOREIGN KEY ("membroClubeId") REFERENCES "MembroClube" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─────────────────────────────────────────────
-- Parte 2.4 — Escalao.seccaoId (expand: nullable)
-- ─────────────────────────────────────────────
ALTER TABLE "Escalao" ADD COLUMN IF NOT EXISTS "seccaoId" TEXT;
CREATE INDEX IF NOT EXISTS "Escalao_seccaoId_idx" ON "Escalao" ("seccaoId");
ALTER TABLE "Escalao" DROP CONSTRAINT IF EXISTS "Escalao_seccaoId_fkey";
ALTER TABLE "Escalao" ADD CONSTRAINT "Escalao_seccaoId_fkey"
  FOREIGN KEY ("seccaoId") REFERENCES "Seccao" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─────────────────────────────────────────────
-- Parte 2.6/2.7/2.8/2.9 — colunas de modalidade / formato / estatísticas
-- ─────────────────────────────────────────────
ALTER TABLE "Exercicio"     ADD COLUMN IF NOT EXISTS "modalidade" "Modalidade";
ALTER TABLE "ModeloSessao"  ADD COLUMN IF NOT EXISTS "modalidade" "Modalidade";
ALTER TABLE "MetricaConfig" ADD COLUMN IF NOT EXISTS "modalidade" "Modalidade";
ALTER TABLE "Habilidade"    ADD COLUMN IF NOT EXISTS "modalidade" "Modalidade";

ALTER TABLE "Sessao" ADD COLUMN IF NOT EXISTS "modalidadeAtividade" "Modalidade";

ALTER TABLE "Jogo" ADD COLUMN IF NOT EXISTS "formato" "FormatoJogo";
ALTER TABLE "Jogo" ADD COLUMN IF NOT EXISTS "modalidadeAtividade" "Modalidade";

ALTER TABLE "Competicao" ADD COLUMN IF NOT EXISTS "formatoJogo" "FormatoJogo";

ALTER TABLE "EstatisticaAtleta" ADD COLUMN IF NOT EXISTS "remates" INTEGER;
ALTER TABLE "EstatisticaAtleta" ADD COLUMN IF NOT EXISTS "cantos" INTEGER;
ALTER TABLE "EstatisticaAtleta" ADD COLUMN IF NOT EXISTS "forasDeJogo" INTEGER;
ALTER TABLE "EstatisticaAtleta" ADD COLUMN IF NOT EXISTS "desarmes" INTEGER;

-- ─────────────────────────────────────────────
-- Backfill (idempotente) — Apêndice C.4
-- ─────────────────────────────────────────────
-- 1. Uma secção FUTSAL por clube existente (todos os dados atuais são futsal).
INSERT INTO "Seccao" ("id", "clubeId", "modalidade", "nome", "criadoEm")
SELECT gen_random_uuid()::text, c."id", 'FUTSAL', 'Futsal', NOW()
FROM "Clube" c
ON CONFLICT ("clubeId", "modalidade") DO NOTHING;

-- 2. Ligar todos os escalões existentes à secção FUTSAL do respetivo clube.
UPDATE "Escalao" e
SET "seccaoId" = s."id"
FROM "Seccao" s
WHERE s."clubeId" = e."clubeId"
  AND s."modalidade" = 'FUTSAL'
  AND e."seccaoId" IS NULL;

-- ─────────────────────────────────────────────
-- Recriar FKs como RESTRICT para alinhar com schema (colunas agora NOT NULL)
-- ─────────────────────────────────────────────
ALTER TABLE "Atleta" DROP CONSTRAINT IF EXISTS "Atleta_clubeId_fkey";
ALTER TABLE "Atleta" ADD CONSTRAINT "Atleta_clubeId_fkey"
  FOREIGN KEY ("clubeId") REFERENCES "Clube" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Presenca" DROP CONSTRAINT IF EXISTS "Presenca_escalaoId_fkey";
ALTER TABLE "Presenca" ADD CONSTRAINT "Presenca_escalaoId_fkey"
  FOREIGN KEY ("escalaoId") REFERENCES "Escalao" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
