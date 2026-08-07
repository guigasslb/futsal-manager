-- CreateEnum
CREATE TYPE "TipoQuadroTatico" AS ENUM ('GERAL', 'BOLA_PARADA');

-- AlterTable
ALTER TABLE "ModeloJogo" ADD COLUMN     "epocaId" TEXT,
ADD COLUMN     "escalaoId" TEXT,
ADD COLUMN     "subprincipios" JSONB;

-- AlterTable
ALTER TABLE "QuadroTatico" ADD COLUMN     "tipo" "TipoQuadroTatico" NOT NULL DEFAULT 'GERAL';

-- CreateIndex
CREATE INDEX "ModeloJogo_clubeProprietarioId_escalaoId_epocaId_idx" ON "ModeloJogo"("clubeProprietarioId", "escalaoId", "epocaId");

-- CreateIndex
CREATE INDEX "ModeloJogo_escalaoId_idx" ON "ModeloJogo"("escalaoId");

-- CreateIndex
CREATE INDEX "ModeloJogo_epocaId_idx" ON "ModeloJogo"("epocaId");

-- AddForeignKey
ALTER TABLE "ModeloJogo" ADD CONSTRAINT "ModeloJogo_escalaoId_fkey" FOREIGN KEY ("escalaoId") REFERENCES "Escalao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModeloJogo" ADD CONSTRAINT "ModeloJogo_epocaId_fkey" FOREIGN KEY ("epocaId") REFERENCES "Epoca"("id") ON DELETE SET NULL ON UPDATE CASCADE;
