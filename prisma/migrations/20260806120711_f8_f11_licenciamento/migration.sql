-- CreateEnum
CREATE TYPE "TipoLicenca" AS ENUM ('INDIVIDUAL', 'CLUBE');

-- CreateEnum
CREATE TYPE "TierClube" AS ENUM ('PEQUENO', 'MEDIO', 'GRANDE', 'PARCEIRO');

-- CreateEnum
CREATE TYPE "EstadoLicenca" AS ENUM ('ATIVA', 'EXPIRADA', 'CANCELADA', 'SUSPENSA');

-- CreateEnum
CREATE TYPE "CicloFaturacao" AS ENUM ('MENSAL', 'ANUAL');

-- CreateEnum
CREATE TYPE "TipoMovimento" AS ENUM ('CREDITO_ABSORCAO', 'DEBITO_COMPRA', 'REEMBOLSO', 'AJUSTE');

-- AlterTable
ALTER TABLE "Clube" ADD COLUMN     "onboardingConcluido" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Jogo" ADD COLUMN     "googleEventId" TEXT;

-- AlterTable
ALTER TABLE "Reuniao" ADD COLUMN     "googleEventId" TEXT;

-- AlterTable
ALTER TABLE "Sessao" ADD COLUMN     "googleEventId" TEXT;

-- CreateTable
CREATE TABLE "IntegracaoCalendario" (
    "id" TEXT NOT NULL,
    "utilizadorId" TEXT NOT NULL,
    "provedor" TEXT NOT NULL DEFAULT 'google',
    "refreshToken" TEXT NOT NULL,
    "calendarioId" TEXT,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegracaoCalendario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Licenca" (
    "id" TEXT NOT NULL,
    "tipo" "TipoLicenca" NOT NULL,
    "tier" "TierClube",
    "estado" "EstadoLicenca" NOT NULL DEFAULT 'ATIVA',
    "ciclo" "CicloFaturacao" NOT NULL,
    "precoCentimos" INTEGER,
    "utilizadorId" TEXT,
    "clubeId" TEXT,
    "dataInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataRenovacao" TIMESTAMP(3),
    "dataFim" TIMESTAMP(3),
    "paddleSubscriptionId" TEXT,
    "paddleCustomerId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Licenca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Carteira" (
    "id" TEXT NOT NULL,
    "utilizadorId" TEXT NOT NULL,
    "saldoCentimos" INTEGER NOT NULL DEFAULT 0,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Carteira_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimentoCarteira" (
    "id" TEXT NOT NULL,
    "carteiraId" TEXT NOT NULL,
    "tipo" "TipoMovimento" NOT NULL,
    "valorCentimos" INTEGER NOT NULL,
    "descricao" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MovimentoCarteira_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IntegracaoCalendario_utilizadorId_key" ON "IntegracaoCalendario"("utilizadorId");

-- CreateIndex
CREATE UNIQUE INDEX "Licenca_utilizadorId_key" ON "Licenca"("utilizadorId");

-- CreateIndex
CREATE UNIQUE INDEX "Licenca_clubeId_key" ON "Licenca"("clubeId");

-- CreateIndex
CREATE UNIQUE INDEX "Carteira_utilizadorId_key" ON "Carteira"("utilizadorId");

-- CreateIndex
CREATE INDEX "MovimentoCarteira_carteiraId_idx" ON "MovimentoCarteira"("carteiraId");

-- AddForeignKey
ALTER TABLE "IntegracaoCalendario" ADD CONSTRAINT "IntegracaoCalendario_utilizadorId_fkey" FOREIGN KEY ("utilizadorId") REFERENCES "Utilizador"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Licenca" ADD CONSTRAINT "Licenca_utilizadorId_fkey" FOREIGN KEY ("utilizadorId") REFERENCES "Utilizador"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Licenca" ADD CONSTRAINT "Licenca_clubeId_fkey" FOREIGN KEY ("clubeId") REFERENCES "Clube"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Carteira" ADD CONSTRAINT "Carteira_utilizadorId_fkey" FOREIGN KEY ("utilizadorId") REFERENCES "Utilizador"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimentoCarteira" ADD CONSTRAINT "MovimentoCarteira_carteiraId_fkey" FOREIGN KEY ("carteiraId") REFERENCES "Carteira"("id") ON DELETE CASCADE ON UPDATE CASCADE;
