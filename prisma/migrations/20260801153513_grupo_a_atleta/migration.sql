/*
  Warnings:

  - You are about to drop the column `posicao` on the `Atleta` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Atleta" DROP COLUMN "posicao",
ADD COLUMN     "encarregadoContacto" TEXT,
ADD COLUMN     "encarregadoEmail" TEXT,
ADD COLUMN     "encarregadoNome" TEXT,
ADD COLUMN     "escalaoSecundarioId" TEXT,
ADD COLUMN     "fotoUrl" TEXT,
ADD COLUMN     "posicoes" "Posicao"[];

-- CreateIndex
CREATE INDEX "Atleta_escalaoSecundarioId_idx" ON "Atleta"("escalaoSecundarioId");

-- AddForeignKey
ALTER TABLE "Atleta" ADD CONSTRAINT "Atleta_escalaoSecundarioId_fkey" FOREIGN KEY ("escalaoSecundarioId") REFERENCES "Escalao"("id") ON DELETE SET NULL ON UPDATE CASCADE;
