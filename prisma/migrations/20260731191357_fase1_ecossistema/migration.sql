/*
  Warnings:

  - You are about to drop the column `clubeId` on the `Utilizador` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "EstadoMembro" AS ENUM ('ATIVO', 'INATIVO', 'CONVIDADO');

-- CreateEnum
CREATE TYPE "AmbitoPerfil" AS ENUM ('TODO_CLUBE', 'PROPRIOS_ESCALOES');

-- CreateEnum
CREATE TYPE "TipoConsentimento" AS ENUM ('DADOS', 'IMAGEM');

-- CreateEnum
CREATE TYPE "PropriedadeConteudo" AS ENUM ('CLUBE', 'TREINADOR');

-- DropForeignKey
ALTER TABLE "Utilizador" DROP CONSTRAINT "Utilizador_clubeId_fkey";

-- DropIndex
DROP INDEX "Utilizador_clubeId_idx";

-- AlterTable
ALTER TABLE "Atleta" ADD COLUMN     "dataIngresso" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Clube" ADD COLUMN     "email" TEXT,
ADD COLUMN     "morada" TEXT,
ADD COLUMN     "telefone" TEXT;

-- AlterTable
ALTER TABLE "Escalao" ADD COLUMN     "visivelOutrosTreinadores" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Exercicio" ADD COLUMN     "origemSeed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "proprietario" "PropriedadeConteudo" NOT NULL DEFAULT 'CLUBE';

-- AlterTable
ALTER TABLE "Utilizador" DROP COLUMN "clubeId",
ADD COLUMN     "telefone" TEXT;

-- CreateTable
CREATE TABLE "MembroClube" (
    "id" TEXT NOT NULL,
    "utilizadorId" TEXT NOT NULL,
    "clubeId" TEXT NOT NULL,
    "perfilId" TEXT NOT NULL,
    "estado" "EstadoMembro" NOT NULL DEFAULT 'ATIVO',
    "dataEntrada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataSaida" TIMESTAMP(3),

    CONSTRAINT "MembroClube_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Perfil" (
    "id" TEXT NOT NULL,
    "clubeId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "ambito" "AmbitoPerfil" NOT NULL DEFAULT 'PROPRIOS_ESCALOES',
    "capacidades" TEXT[],
    "sistema" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Perfil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AtribuicaoEscalao" (
    "id" TEXT NOT NULL,
    "membroClubeId" TEXT NOT NULL,
    "escalaoId" TEXT NOT NULL,

    CONSTRAINT "AtribuicaoEscalao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consentimento" (
    "id" TEXT NOT NULL,
    "atletaId" TEXT NOT NULL,
    "tipo" "TipoConsentimento" NOT NULL,
    "concedido" BOOLEAN NOT NULL DEFAULT false,
    "encarregadoEducacao" TEXT,
    "dataConsentimento" TIMESTAMP(3),

    CONSTRAINT "Consentimento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MembroClube_clubeId_idx" ON "MembroClube"("clubeId");

-- CreateIndex
CREATE INDEX "MembroClube_utilizadorId_idx" ON "MembroClube"("utilizadorId");

-- CreateIndex
CREATE UNIQUE INDEX "MembroClube_utilizadorId_clubeId_key" ON "MembroClube"("utilizadorId", "clubeId");

-- CreateIndex
CREATE INDEX "Perfil_clubeId_idx" ON "Perfil"("clubeId");

-- CreateIndex
CREATE INDEX "AtribuicaoEscalao_escalaoId_idx" ON "AtribuicaoEscalao"("escalaoId");

-- CreateIndex
CREATE UNIQUE INDEX "AtribuicaoEscalao_membroClubeId_escalaoId_key" ON "AtribuicaoEscalao"("membroClubeId", "escalaoId");

-- CreateIndex
CREATE INDEX "Consentimento_atletaId_idx" ON "Consentimento"("atletaId");

-- CreateIndex
CREATE UNIQUE INDEX "Consentimento_atletaId_tipo_key" ON "Consentimento"("atletaId", "tipo");

-- AddForeignKey
ALTER TABLE "MembroClube" ADD CONSTRAINT "MembroClube_utilizadorId_fkey" FOREIGN KEY ("utilizadorId") REFERENCES "Utilizador"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembroClube" ADD CONSTRAINT "MembroClube_clubeId_fkey" FOREIGN KEY ("clubeId") REFERENCES "Clube"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembroClube" ADD CONSTRAINT "MembroClube_perfilId_fkey" FOREIGN KEY ("perfilId") REFERENCES "Perfil"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Perfil" ADD CONSTRAINT "Perfil_clubeId_fkey" FOREIGN KEY ("clubeId") REFERENCES "Clube"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtribuicaoEscalao" ADD CONSTRAINT "AtribuicaoEscalao_membroClubeId_fkey" FOREIGN KEY ("membroClubeId") REFERENCES "MembroClube"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtribuicaoEscalao" ADD CONSTRAINT "AtribuicaoEscalao_escalaoId_fkey" FOREIGN KEY ("escalaoId") REFERENCES "Escalao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consentimento" ADD CONSTRAINT "Consentimento_atletaId_fkey" FOREIGN KEY ("atletaId") REFERENCES "Atleta"("id") ON DELETE CASCADE ON UPDATE CASCADE;
