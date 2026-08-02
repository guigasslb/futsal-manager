/*
  Warnings:

  - You are about to drop the column `categoria` on the `Exercicio` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "CategoriaExercicioPrincipal" AS ENUM ('ATAQUE', 'DEFESA', 'TRANSICAO', 'BOLAS_PARADAS', 'FISICO', 'GUARDA_REDES', 'OUTRO');

-- DropIndex
DROP INDEX "Exercicio_clubeId_categoria_idx";

-- AlterTable
ALTER TABLE "Exercicio" DROP COLUMN "categoria",
ADD COLUMN     "categoriaPrincipal" "CategoriaExercicioPrincipal",
ADD COLUMN     "subcategoriaId" TEXT;

-- DropEnum
DROP TYPE "CategoriaExercicio";

-- CreateTable
CREATE TABLE "SubcategoriaExercicio" (
    "id" TEXT NOT NULL,
    "clubeId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "categoria" "CategoriaExercicioPrincipal" NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "sistema" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubcategoriaExercicio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SubcategoriaExercicio_clubeId_categoria_idx" ON "SubcategoriaExercicio"("clubeId", "categoria");

-- CreateIndex
CREATE INDEX "Exercicio_clubeId_categoriaPrincipal_idx" ON "Exercicio"("clubeId", "categoriaPrincipal");

-- CreateIndex
CREATE INDEX "Exercicio_subcategoriaId_idx" ON "Exercicio"("subcategoriaId");

-- AddForeignKey
ALTER TABLE "Exercicio" ADD CONSTRAINT "Exercicio_subcategoriaId_fkey" FOREIGN KEY ("subcategoriaId") REFERENCES "SubcategoriaExercicio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubcategoriaExercicio" ADD CONSTRAINT "SubcategoriaExercicio_clubeId_fkey" FOREIGN KEY ("clubeId") REFERENCES "Clube"("id") ON DELETE CASCADE ON UPDATE CASCADE;
