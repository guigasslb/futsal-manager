-- CreateEnum
CREATE TYPE "ParteTreino" AS ENUM ('AQUECIMENTO', 'PRINCIPAL', 'JOGO_REDUZIDO', 'RETORNO_CALMA');

-- AlterTable
ALTER TABLE "Exercicio" ADD COLUMN     "autorId" TEXT,
ADD COLUMN     "clubeProprietarioId" TEXT,
ADD COLUMN     "escalaoAlvo" TEXT,
ADD COLUMN     "parteTreino" "ParteTreino";

-- CreateTable
CREATE TABLE "PartilhaExercicioClube" (
    "id" TEXT NOT NULL,
    "exercicioId" TEXT NOT NULL,
    "clubeId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartilhaExercicioClube_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModeloSessao" (
    "id" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "proprietario" "PropriedadeConteudo" NOT NULL DEFAULT 'TREINADOR',
    "clubeProprietarioId" TEXT,
    "origemSeed" BOOLEAN NOT NULL DEFAULT false,
    "nome" TEXT NOT NULL,
    "objetivoTatico" TEXT,
    "faseEpoca" "PeriodoEpoca",
    "escalaoAlvo" TEXT,
    "duracaoMin" INTEGER,
    "descricao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModeloSessao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModeloSessaoExercicio" (
    "id" TEXT NOT NULL,
    "modeloSessaoId" TEXT NOT NULL,
    "exercicioId" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "duracaoMin" INTEGER,
    "parteTreino" "ParteTreino",
    "notas" TEXT,

    CONSTRAINT "ModeloSessaoExercicio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PartilhaExercicioClube_clubeId_idx" ON "PartilhaExercicioClube"("clubeId");

-- CreateIndex
CREATE UNIQUE INDEX "PartilhaExercicioClube_exercicioId_clubeId_key" ON "PartilhaExercicioClube"("exercicioId", "clubeId");

-- CreateIndex
CREATE INDEX "ModeloSessao_clubeProprietarioId_idx" ON "ModeloSessao"("clubeProprietarioId");

-- CreateIndex
CREATE INDEX "ModeloSessao_autorId_idx" ON "ModeloSessao"("autorId");

-- CreateIndex
CREATE INDEX "ModeloSessaoExercicio_modeloSessaoId_idx" ON "ModeloSessaoExercicio"("modeloSessaoId");

-- CreateIndex
CREATE INDEX "ModeloSessaoExercicio_exercicioId_idx" ON "ModeloSessaoExercicio"("exercicioId");

-- CreateIndex
CREATE UNIQUE INDEX "ModeloSessaoExercicio_modeloSessaoId_ordem_key" ON "ModeloSessaoExercicio"("modeloSessaoId", "ordem");

-- CreateIndex
CREATE INDEX "Exercicio_autorId_idx" ON "Exercicio"("autorId");

-- CreateIndex
CREATE INDEX "Exercicio_clubeProprietarioId_idx" ON "Exercicio"("clubeProprietarioId");

-- CreateIndex
CREATE INDEX "Exercicio_parteTreino_idx" ON "Exercicio"("parteTreino");

-- AddForeignKey
ALTER TABLE "Exercicio" ADD CONSTRAINT "Exercicio_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Utilizador"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exercicio" ADD CONSTRAINT "Exercicio_clubeProprietarioId_fkey" FOREIGN KEY ("clubeProprietarioId") REFERENCES "Clube"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartilhaExercicioClube" ADD CONSTRAINT "PartilhaExercicioClube_exercicioId_fkey" FOREIGN KEY ("exercicioId") REFERENCES "Exercicio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartilhaExercicioClube" ADD CONSTRAINT "PartilhaExercicioClube_clubeId_fkey" FOREIGN KEY ("clubeId") REFERENCES "Clube"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModeloSessao" ADD CONSTRAINT "ModeloSessao_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Utilizador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModeloSessao" ADD CONSTRAINT "ModeloSessao_clubeProprietarioId_fkey" FOREIGN KEY ("clubeProprietarioId") REFERENCES "Clube"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModeloSessaoExercicio" ADD CONSTRAINT "ModeloSessaoExercicio_modeloSessaoId_fkey" FOREIGN KEY ("modeloSessaoId") REFERENCES "ModeloSessao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModeloSessaoExercicio" ADD CONSTRAINT "ModeloSessaoExercicio_exercicioId_fkey" FOREIGN KEY ("exercicioId") REFERENCES "Exercicio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
