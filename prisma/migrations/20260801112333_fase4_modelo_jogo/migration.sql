-- CreateEnum
CREATE TYPE "MomentoJogo" AS ENUM ('ORG_OFENSIVA', 'ORG_DEFENSIVA', 'TRANS_OFENSIVA', 'TRANS_DEFENSIVA', 'BOLAS_PARADAS');

-- CreateTable
CREATE TABLE "ModeloJogo" (
    "id" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "proprietario" "PropriedadeConteudo" NOT NULL DEFAULT 'CLUBE',
    "clubeProprietarioId" TEXT,
    "nome" TEXT NOT NULL,
    "momento" "MomentoJogo" NOT NULL,
    "principios" TEXT,
    "diagrama" JSONB,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModeloJogo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuadroTatico" (
    "id" TEXT NOT NULL,
    "jogoId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "diagrama" JSONB,
    "notas" TEXT,

    CONSTRAINT "QuadroTatico_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ModeloJogo_clubeProprietarioId_idx" ON "ModeloJogo"("clubeProprietarioId");

-- CreateIndex
CREATE INDEX "ModeloJogo_autorId_idx" ON "ModeloJogo"("autorId");

-- CreateIndex
CREATE INDEX "QuadroTatico_jogoId_idx" ON "QuadroTatico"("jogoId");

-- AddForeignKey
ALTER TABLE "ModeloJogo" ADD CONSTRAINT "ModeloJogo_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Utilizador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuadroTatico" ADD CONSTRAINT "QuadroTatico_jogoId_fkey" FOREIGN KEY ("jogoId") REFERENCES "Jogo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
