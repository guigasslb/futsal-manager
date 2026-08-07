-- F6 (Fase 16) — Competições e tabelas de classificação por inserção manual (bíblia §3.7, §16 fase 16)
-- A classificação é CALCULADA (obterClassificacao) a partir dos resultados inseridos + jogos próprios.
-- Todos os campos novos são opcionais/com default, compatíveis com dados existentes.

-- CreateEnum: formato da competição (determina a apresentação da classificação)
CREATE TYPE "FormatoCompeticao" AS ENUM ('LIGA', 'TORNEIO', 'TACA');

-- AlterTable: formato da prova na competição
ALTER TABLE "Competicao" ADD COLUMN     "formato" "FormatoCompeticao" NOT NULL DEFAULT 'LIGA';

-- CreateTable: resultados inseridos manualmente (todas as equipas) para a classificação
CREATE TABLE "ResultadoCompeticao" (
    "id" TEXT NOT NULL,
    "competicaoId" TEXT NOT NULL,
    "data" TIMESTAMP(3),
    "equipaCasa" TEXT NOT NULL,
    "equipaFora" TEXT NOT NULL,
    "golosCasa" INTEGER NOT NULL,
    "golosFora" INTEGER NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResultadoCompeticao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ResultadoCompeticao_competicaoId_idx" ON "ResultadoCompeticao"("competicaoId");

-- AddForeignKey
ALTER TABLE "ResultadoCompeticao" ADD CONSTRAINT "ResultadoCompeticao_competicaoId_fkey" FOREIGN KEY ("competicaoId") REFERENCES "Competicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
