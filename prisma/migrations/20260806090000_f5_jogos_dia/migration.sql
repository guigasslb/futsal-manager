-- F5 (Fase 15) — Dia de jogo, scouting no jogo e tempos por blocos (bíblia §3.7, §16 fase 15)
-- Todos os campos novos são opcionais/com default, compatíveis com dados existentes.

-- CreateEnum
CREATE TYPE "BlocoTempo" AS ENUM ('JOGO_COMPLETO', 'MEIA_PARTE', 'BLOCO_10MIN', 'BLOCO_5MIN', 'NAO_JOGOU');

-- AlterTable: plano de dia de jogo na convocatória
ALTER TABLE "Convocatoria" ADD COLUMN     "posicaoPrevista" "Posicao",
ADD COLUMN     "titularPrevisto" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: tempo de jogo por bloco na estatística do atleta
ALTER TABLE "EstatisticaAtleta" ADD COLUMN     "blocoTempo" "BlocoTempo";

-- AlterTable: bloco de tempo no evento ao vivo (substituições / tempos por blocos)
ALTER TABLE "EventoJogo" ADD COLUMN     "bloco" "BlocoTempo";

-- AlterTable: scouting contextualizado no jogo
ALTER TABLE "ObservacaoAdversario" ADD COLUMN     "jogoId" TEXT;

-- CreateIndex
CREATE INDEX "ObservacaoAdversario_jogoId_idx" ON "ObservacaoAdversario"("jogoId");

-- AddForeignKey
ALTER TABLE "ObservacaoAdversario" ADD CONSTRAINT "ObservacaoAdversario_jogoId_fkey" FOREIGN KEY ("jogoId") REFERENCES "Jogo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
