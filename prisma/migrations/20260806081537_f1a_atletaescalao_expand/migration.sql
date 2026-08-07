-- CreateEnum
CREATE TYPE "TipoParticipacao" AS ENUM ('PRINCIPAL', 'SIMULTANEA', 'OCASIONAL');

-- CreateEnum
CREATE TYPE "EstadoParticipacao" AS ENUM ('ATIVO', 'TRANSICAO_PERMANENTE', 'INATIVO');

-- CreateEnum
CREATE TYPE "MotivoFalta" AS ENUM ('LESAO', 'DOENCA', 'OUTRO', 'SEM_JUSTIFICACAO');

-- AlterTable
ALTER TABLE "Atleta" ADD COLUMN     "clubeId" TEXT;

-- AlterTable
ALTER TABLE "Presenca" ADD COLUMN     "escalaoId" TEXT,
ADD COLUMN     "motivo" "MotivoFalta";

-- CreateTable
CREATE TABLE "AtletaEscalao" (
    "id" TEXT NOT NULL,
    "atletaId" TEXT NOT NULL,
    "escalaoId" TEXT NOT NULL,
    "epocaId" TEXT NOT NULL,
    "tipo" "TipoParticipacao" NOT NULL DEFAULT 'PRINCIPAL',
    "estado" "EstadoParticipacao" NOT NULL DEFAULT 'ATIVO',
    "numero" INTEGER,
    "dataInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataFim" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AtletaEscalao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AtletaEscalao_escalaoId_epocaId_estado_idx" ON "AtletaEscalao"("escalaoId", "epocaId", "estado");

-- CreateIndex
CREATE INDEX "AtletaEscalao_atletaId_epocaId_idx" ON "AtletaEscalao"("atletaId", "epocaId");

-- CreateIndex
CREATE UNIQUE INDEX "AtletaEscalao_atletaId_escalaoId_epocaId_key" ON "AtletaEscalao"("atletaId", "escalaoId", "epocaId");

-- CreateIndex
CREATE INDEX "Atleta_clubeId_idx" ON "Atleta"("clubeId");

-- CreateIndex
CREATE INDEX "Presenca_escalaoId_idx" ON "Presenca"("escalaoId");

-- AddForeignKey
ALTER TABLE "Atleta" ADD CONSTRAINT "Atleta_clubeId_fkey" FOREIGN KEY ("clubeId") REFERENCES "Clube"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtletaEscalao" ADD CONSTRAINT "AtletaEscalao_atletaId_fkey" FOREIGN KEY ("atletaId") REFERENCES "Atleta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtletaEscalao" ADD CONSTRAINT "AtletaEscalao_escalaoId_fkey" FOREIGN KEY ("escalaoId") REFERENCES "Escalao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtletaEscalao" ADD CONSTRAINT "AtletaEscalao_epocaId_fkey" FOREIGN KEY ("epocaId") REFERENCES "Epoca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Presenca" ADD CONSTRAINT "Presenca_escalaoId_fkey" FOREIGN KEY ("escalaoId") REFERENCES "Escalao"("id") ON DELETE SET NULL ON UPDATE CASCADE;
