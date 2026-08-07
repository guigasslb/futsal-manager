-- CreateEnum
CREATE TYPE "TipoComunicacao" AS ENUM ('CONVOCATORIA', 'CANCELAMENTO', 'MUDANCA_HORARIO', 'MUDANCA_LOCAL', 'RESULTADO', 'AVISO_GERAL', 'CALENDARIO_MENSAL');

-- CreateTable
CREATE TABLE "ModeloComunicacao" (
    "id" TEXT NOT NULL,
    "tipo" "TipoComunicacao" NOT NULL,
    "nome" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "clubeId" TEXT,
    "origemSeed" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModeloComunicacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ModeloComunicacao_tipo_idx" ON "ModeloComunicacao"("tipo");

-- CreateIndex
CREATE INDEX "ModeloComunicacao_clubeId_idx" ON "ModeloComunicacao"("clubeId");

-- CreateIndex
CREATE UNIQUE INDEX "ModeloComunicacao_clubeId_tipo_key" ON "ModeloComunicacao"("clubeId", "tipo");

-- AddForeignKey
ALTER TABLE "ModeloComunicacao" ADD CONSTRAINT "ModeloComunicacao_clubeId_fkey" FOREIGN KEY ("clubeId") REFERENCES "Clube"("id") ON DELETE CASCADE ON UPDATE CASCADE;

