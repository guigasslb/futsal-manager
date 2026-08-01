-- CreateEnum
CREATE TYPE "AmbitoReuniao" AS ENUM ('CLUBE', 'ESCALAO');

-- CreateTable
CREATE TABLE "Reuniao" (
    "id" TEXT NOT NULL,
    "clubeId" TEXT NOT NULL,
    "ambito" "AmbitoReuniao" NOT NULL DEFAULT 'CLUBE',
    "escalaoId" TEXT,
    "titulo" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "participantes" TEXT,
    "ordemTrabalhos" TEXT,
    "ata" TEXT,
    "criadorId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reuniao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Reuniao_clubeId_idx" ON "Reuniao"("clubeId");

-- AddForeignKey
ALTER TABLE "Reuniao" ADD CONSTRAINT "Reuniao_clubeId_fkey" FOREIGN KEY ("clubeId") REFERENCES "Clube"("id") ON DELETE CASCADE ON UPDATE CASCADE;
