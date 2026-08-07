-- F9 (Fase 19) — Analytics em 3 níveis + relatório de época partilhável (bíblia §3.10, §8.15, §16 fase 19)
-- Link público (token não-adivinhável) com snapshot IMUTÁVEL dos dados e identidade do clube.
-- Campos scalar-only (sem FK) conforme o modelo da bíblia §3.10 — o snapshot é auto-suficiente.

-- CreateEnum: tipo de relatório partilhável
CREATE TYPE "TipoRelatorio" AS ENUM ('EPOCA_ATLETA', 'EPOCA_EQUIPA', 'EPOCA_CLUBE');

-- CreateTable: relatório de época partilhável
CREATE TABLE "RelatorioPartilhado" (
    "id" TEXT NOT NULL,
    "clubeId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "tipo" "TipoRelatorio" NOT NULL,
    "epocaId" TEXT NOT NULL,
    "escalaoId" TEXT,
    "atletaId" TEXT,
    "dadosSnapshot" JSONB,
    "expiraEm" TIMESTAMP(3),
    "criadorId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RelatorioPartilhado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: token único (segmento de URL público)
CREATE UNIQUE INDEX "RelatorioPartilhado_token_key" ON "RelatorioPartilhado"("token");

-- CreateIndex
CREATE INDEX "RelatorioPartilhado_clubeId_idx" ON "RelatorioPartilhado"("clubeId");
