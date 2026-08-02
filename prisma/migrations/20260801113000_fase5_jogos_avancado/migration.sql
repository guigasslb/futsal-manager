-- CreateEnum
CREATE TYPE "TipoJogo" AS ENUM ('OFICIAL', 'AMIGAVEL');

-- CreateEnum
CREATE TYPE "TipoEventoJogo" AS ENUM ('GOLO', 'ASSISTENCIA', 'FALTA', 'CARTAO_AMARELO', 'CARTAO_VERMELHO', 'SUBSTITUICAO', 'DEFESA', 'GOLO_SOFRIDO', 'TIMEOUT');

-- AlterTable
ALTER TABLE "Jogo" ADD COLUMN     "competicaoId" TEXT,
ADD COLUMN     "faltas1aParte" INTEGER,
ADD COLUMN     "faltas2aParte" INTEGER,
ADD COLUMN     "tipo" "TipoJogo" NOT NULL DEFAULT 'OFICIAL',
ADD COLUMN     "videoUrl" TEXT;

-- CreateTable
CREATE TABLE "Competicao" (
    "id" TEXT NOT NULL,
    "clubeId" TEXT NOT NULL,
    "escalaoId" TEXT NOT NULL,
    "epocaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "TipoJogo" NOT NULL DEFAULT 'OFICIAL',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Competicao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventoJogo" (
    "id" TEXT NOT NULL,
    "jogoId" TEXT NOT NULL,
    "parte" INTEGER NOT NULL,
    "minuto" INTEGER,
    "tipo" "TipoEventoJogo" NOT NULL,
    "atletaId" TEXT,
    "atletaSecundarioId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventoJogo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ObservacaoAdversario" (
    "id" TEXT NOT NULL,
    "clubeId" TEXT NOT NULL,
    "escalaoId" TEXT,
    "equipa" TEXT NOT NULL,
    "jogoObservado" TEXT,
    "competicao" TEXT,
    "sistemaTatico" TEXT,
    "pontosFortes" TEXT,
    "pontosFracos" TEXT,
    "notas" TEXT,
    "diagrama" JSONB,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ObservacaoAdversario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ObservacaoJogadorAdversario" (
    "id" TEXT NOT NULL,
    "observacaoId" TEXT NOT NULL,
    "numero" INTEGER,
    "nome" TEXT,
    "posicao" TEXT,
    "descricao" TEXT,

    CONSTRAINT "ObservacaoJogadorAdversario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Competicao_epocaId_escalaoId_idx" ON "Competicao"("epocaId", "escalaoId");

-- CreateIndex
CREATE INDEX "EventoJogo_jogoId_idx" ON "EventoJogo"("jogoId");

-- CreateIndex
CREATE INDEX "ObservacaoAdversario_clubeId_idx" ON "ObservacaoAdversario"("clubeId");

-- CreateIndex
CREATE INDEX "ObservacaoJogadorAdversario_observacaoId_idx" ON "ObservacaoJogadorAdversario"("observacaoId");

-- CreateIndex
CREATE INDEX "Jogo_competicaoId_idx" ON "Jogo"("competicaoId");

-- AddForeignKey
ALTER TABLE "Jogo" ADD CONSTRAINT "Jogo_competicaoId_fkey" FOREIGN KEY ("competicaoId") REFERENCES "Competicao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Competicao" ADD CONSTRAINT "Competicao_escalaoId_fkey" FOREIGN KEY ("escalaoId") REFERENCES "Escalao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Competicao" ADD CONSTRAINT "Competicao_epocaId_fkey" FOREIGN KEY ("epocaId") REFERENCES "Epoca"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoJogo" ADD CONSTRAINT "EventoJogo_jogoId_fkey" FOREIGN KEY ("jogoId") REFERENCES "Jogo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObservacaoJogadorAdversario" ADD CONSTRAINT "ObservacaoJogadorAdversario_observacaoId_fkey" FOREIGN KEY ("observacaoId") REFERENCES "ObservacaoAdversario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
