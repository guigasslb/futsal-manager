-- CreateEnum
CREATE TYPE "TipoPlaneamento" AS ENUM ('SEMANAL', 'MENSAL');

-- CreateEnum
CREATE TYPE "PeriodoEpoca" AS ENUM ('PREPARATORIO', 'COMPETITIVO', 'TRANSICAO');

-- AlterTable
ALTER TABLE "Sessao" ADD COLUMN     "mesociclo" INTEGER,
ADD COLUMN     "microciclo" INTEGER,
ADD COLUMN     "planeamentoId" TEXT;

-- CreateTable
CREATE TABLE "Planeamento" (
    "id" TEXT NOT NULL,
    "clubeId" TEXT NOT NULL,
    "escalaoId" TEXT NOT NULL,
    "epocaId" TEXT NOT NULL,
    "tipo" "TipoPlaneamento" NOT NULL DEFAULT 'SEMANAL',
    "periodo" "PeriodoEpoca",
    "mesociclo" INTEGER,
    "microciclo" INTEGER,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3) NOT NULL,
    "objetivos" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Planeamento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Planeamento_epocaId_escalaoId_idx" ON "Planeamento"("epocaId", "escalaoId");

-- AddForeignKey
ALTER TABLE "Planeamento" ADD CONSTRAINT "Planeamento_escalaoId_fkey" FOREIGN KEY ("escalaoId") REFERENCES "Escalao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Planeamento" ADD CONSTRAINT "Planeamento_epocaId_fkey" FOREIGN KEY ("epocaId") REFERENCES "Epoca"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sessao" ADD CONSTRAINT "Sessao_planeamentoId_fkey" FOREIGN KEY ("planeamentoId") REFERENCES "Planeamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;
