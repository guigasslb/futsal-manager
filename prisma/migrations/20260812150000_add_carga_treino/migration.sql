-- P4.8 (§8.20): Carga de treino — RPE / ACWR.
--
-- Duas alterações:
--   1. Coluna `rpeSessao` (1-10) no `Sessao` — RPE atribuído pelo treinador à
--      sessão. Multiplicado pela duração dá a carga (sRPE); base do ACWR semanal.
--   2. Tabela `RpeAtleta` — RPE individual reportado por cada atleta para uma
--      sessão (1-10). A média por sessão pode alimentar a carga do escalão.

-- AlterTable
ALTER TABLE "Sessao" ADD COLUMN "rpeSessao" INTEGER;

-- CreateTable
CREATE TABLE "RpeAtleta" (
    "id" TEXT NOT NULL,
    "sessaoId" TEXT NOT NULL,
    "atletaId" TEXT NOT NULL,
    "rpe" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RpeAtleta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RpeAtleta_atletaId_idx" ON "RpeAtleta"("atletaId");

-- CreateIndex
CREATE INDEX "RpeAtleta_sessaoId_idx" ON "RpeAtleta"("sessaoId");

-- CreateIndex
CREATE UNIQUE INDEX "RpeAtleta_sessaoId_atletaId_key" ON "RpeAtleta"("sessaoId", "atletaId");

-- AddForeignKey
ALTER TABLE "RpeAtleta" ADD CONSTRAINT "RpeAtleta_sessaoId_fkey" FOREIGN KEY ("sessaoId") REFERENCES "Sessao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RpeAtleta" ADD CONSTRAINT "RpeAtleta_atletaId_fkey" FOREIGN KEY ("atletaId") REFERENCES "Atleta"("id") ON DELETE CASCADE ON UPDATE CASCADE;
