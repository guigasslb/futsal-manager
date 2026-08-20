-- Equipas da competição + agendamento de jogos (quadro competitivo).
--
-- Suporta: registar as equipas participantes numa competição (EquipaCompeticao),
-- gerar o quadro competitivo e agendar jogos ainda sem resultado.
--
-- ResultadoCompeticao passa a modelar jogos AGENDADOS (sem golos) além dos REALIZADOS:
--   - golosCasa / golosFora tornam-se NULLABLE (jogos agendados ainda não têm resultado);
--   - ronda    = jornada (LIGA) ou fase eliminatória (TORNEIO/TAÇA);
--   - dataHora = data e hora do jogo (NULL = por definir);
--   - estado   = AGENDADO (default) | REALIZADO.
--
-- Tornar golosCasa/golosFora nullable é aditivo (DROP NOT NULL não remove dados;
-- os valores existentes preservam-se). Não toca em auth.

-- CreateEnum
CREATE TYPE "EstadoResultado" AS ENUM ('AGENDADO', 'REALIZADO');

-- AlterTable
ALTER TABLE "ResultadoCompeticao" ADD COLUMN     "dataHora" TIMESTAMP(3),
ADD COLUMN     "estado" "EstadoResultado" NOT NULL DEFAULT 'AGENDADO',
ADD COLUMN     "ronda" INTEGER,
ALTER COLUMN "golosCasa" DROP NOT NULL,
ALTER COLUMN "golosFora" DROP NOT NULL;

-- CreateTable
CREATE TABLE "EquipaCompeticao" (
    "id" TEXT NOT NULL,
    "competicaoId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "posicao" INTEGER,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EquipaCompeticao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EquipaCompeticao_competicaoId_idx" ON "EquipaCompeticao"("competicaoId");

-- CreateIndex
CREATE UNIQUE INDEX "EquipaCompeticao_competicaoId_nome_key" ON "EquipaCompeticao"("competicaoId", "nome");

-- AddForeignKey
ALTER TABLE "EquipaCompeticao" ADD CONSTRAINT "EquipaCompeticao_competicaoId_fkey" FOREIGN KEY ("competicaoId") REFERENCES "Competicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
