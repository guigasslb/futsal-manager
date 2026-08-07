-- AlterTable
ALTER TABLE "MembroClube" ADD COLUMN     "capacidadesExtra" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "capacidadesRevogadas" TEXT[] DEFAULT ARRAY[]::TEXT[];
