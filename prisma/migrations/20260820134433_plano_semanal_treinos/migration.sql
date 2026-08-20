-- AlterTable
ALTER TABLE "Sessao" ADD COLUMN     "personalizada" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "planoSemanalDiaId" TEXT,
ADD COLUMN     "planoSemanalId" TEXT;

-- CreateTable
CREATE TABLE "PlanoSemanal" (
    "id" TEXT NOT NULL,
    "clubeId" TEXT NOT NULL,
    "escalaoId" TEXT NOT NULL,
    "epocaId" TEXT NOT NULL,
    "nome" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadorId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanoSemanal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanoSemanalDia" (
    "id" TEXT NOT NULL,
    "planoSemanalId" TEXT NOT NULL,
    "diaSemana" INTEGER NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFim" TEXT NOT NULL,
    "local" TEXT,
    "tipoSessao" "TipoSessao" NOT NULL DEFAULT 'NORMAL',

    CONSTRAINT "PlanoSemanalDia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlanoSemanal_epocaId_escalaoId_idx" ON "PlanoSemanal"("epocaId", "escalaoId");

-- CreateIndex
CREATE INDEX "PlanoSemanal_clubeId_idx" ON "PlanoSemanal"("clubeId");

-- CreateIndex
CREATE INDEX "PlanoSemanalDia_planoSemanalId_idx" ON "PlanoSemanalDia"("planoSemanalId");

-- CreateIndex
CREATE UNIQUE INDEX "PlanoSemanalDia_planoSemanalId_diaSemana_key" ON "PlanoSemanalDia"("planoSemanalId", "diaSemana");

-- AddForeignKey
ALTER TABLE "PlanoSemanal" ADD CONSTRAINT "PlanoSemanal_clubeId_fkey" FOREIGN KEY ("clubeId") REFERENCES "Clube"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanoSemanal" ADD CONSTRAINT "PlanoSemanal_escalaoId_fkey" FOREIGN KEY ("escalaoId") REFERENCES "Escalao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanoSemanal" ADD CONSTRAINT "PlanoSemanal_epocaId_fkey" FOREIGN KEY ("epocaId") REFERENCES "Epoca"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanoSemanal" ADD CONSTRAINT "PlanoSemanal_criadorId_fkey" FOREIGN KEY ("criadorId") REFERENCES "Utilizador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanoSemanalDia" ADD CONSTRAINT "PlanoSemanalDia_planoSemanalId_fkey" FOREIGN KEY ("planoSemanalId") REFERENCES "PlanoSemanal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sessao" ADD CONSTRAINT "Sessao_planoSemanalId_fkey" FOREIGN KEY ("planoSemanalId") REFERENCES "PlanoSemanal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sessao" ADD CONSTRAINT "Sessao_planoSemanalDiaId_fkey" FOREIGN KEY ("planoSemanalDiaId") REFERENCES "PlanoSemanalDia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

