-- CreateEnum
CREATE TYPE "Posicao" AS ENUM ('GUARDA_REDES', 'FIXO', 'ALA', 'PIVO', 'UNIVERSAL');

-- CreateEnum
CREATE TYPE "CategoriaExercicio" AS ENUM ('ATIVACAO', 'TECNICA_INDIVIDUAL', 'FINALIZACAO', 'POSSE_BOLA', 'TRANSICOES', 'SITUACOES_JOGO', 'JOGO_REDUZIDO', 'BOLAS_PARADAS', 'FISICO', 'OUTRO');

-- CreateEnum
CREATE TYPE "EstadoPresenca" AS ENUM ('PRESENTE', 'FALTA', 'FALTA_JUSTIFICADA', 'LESIONADO', 'ATRASADO');

-- CreateEnum
CREATE TYPE "CasaFora" AS ENUM ('CASA', 'FORA');

-- CreateEnum
CREATE TYPE "Utilizacao" AS ENUM ('TITULAR', 'UTILIZADO', 'NAO_UTILIZADO');

-- CreateEnum
CREATE TYPE "TipoMetrica" AS ENUM ('NUMERO', 'BOOLEANO', 'ESCALA');

-- CreateEnum
CREATE TYPE "NivelHabilidade" AS ENUM ('BASICO', 'INTERMEDIO', 'AVANCADO');

-- CreateEnum
CREATE TYPE "EstadoHabilidade" AS ENUM ('NAO_INICIADO', 'EM_PROGRESSO', 'DESBLOQUEADO');

-- CreateTable
CREATE TABLE "Clube" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "corPrimaria" TEXT NOT NULL DEFAULT '#1A2FD4',
    "corSecundaria" TEXT NOT NULL DEFAULT '#FFD700',
    "logoUrl" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Clube_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Utilizador" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "clubeId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Utilizador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Epoca" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3) NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT false,
    "clubeId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Epoca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Escalao" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "idadeMin" INTEGER,
    "idadeMax" INTEGER,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "clubeId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Escalao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Atleta" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "dataNascimento" TIMESTAMP(3),
    "posicao" "Posicao",
    "numero" INTEGER,
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "escalaoId" TEXT NOT NULL,
    "epocaId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Atleta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exercicio" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "objetivo" TEXT,
    "duracaoMin" INTEGER,
    "categoria" "CategoriaExercicio",
    "diagrama" JSONB,
    "clubeId" TEXT NOT NULL,
    "criadorId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exercicio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sessao" (
    "id" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "duracaoMin" INTEGER,
    "objetivo" TEXT,
    "local" TEXT,
    "notas" TEXT,
    "escalaoId" TEXT NOT NULL,
    "epocaId" TEXT NOT NULL,
    "criadorId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sessao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessaoExercicio" (
    "id" TEXT NOT NULL,
    "sessaoId" TEXT NOT NULL,
    "exercicioId" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "duracaoMin" INTEGER,
    "notas" TEXT,

    CONSTRAINT "SessaoExercicio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Presenca" (
    "id" TEXT NOT NULL,
    "sessaoId" TEXT NOT NULL,
    "atletaId" TEXT NOT NULL,
    "estado" "EstadoPresenca" NOT NULL DEFAULT 'PRESENTE',
    "justificacao" TEXT,

    CONSTRAINT "Presenca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Jogo" (
    "id" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "adversario" TEXT NOT NULL,
    "casaFora" "CasaFora" NOT NULL DEFAULT 'CASA',
    "competicao" TEXT,
    "golosMarcados" INTEGER,
    "golosSofridos" INTEGER,
    "local" TEXT,
    "relatorio" TEXT,
    "escalaoId" TEXT NOT NULL,
    "epocaId" TEXT NOT NULL,
    "criadorId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Jogo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Convocatoria" (
    "id" TEXT NOT NULL,
    "jogoId" TEXT NOT NULL,
    "atletaId" TEXT NOT NULL,
    "convocado" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Convocatoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstatisticaAtleta" (
    "id" TEXT NOT NULL,
    "jogoId" TEXT NOT NULL,
    "atletaId" TEXT NOT NULL,
    "utilizacao" "Utilizacao" NOT NULL DEFAULT 'NAO_UTILIZADO',
    "minutos" INTEGER,
    "golos" INTEGER NOT NULL DEFAULT 0,
    "assistencias" INTEGER NOT NULL DEFAULT 0,
    "defesas" INTEGER,
    "golosSofridosGR" INTEGER,
    "faltasCometidas" INTEGER,

    CONSTRAINT "EstatisticaAtleta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetricaConfig" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "TipoMetrica" NOT NULL DEFAULT 'NUMERO',
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "clubeId" TEXT NOT NULL,

    CONSTRAINT "MetricaConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ValorMetrica" (
    "id" TEXT NOT NULL,
    "metricaId" TEXT NOT NULL,
    "estatisticaId" TEXT NOT NULL,
    "valor" INTEGER NOT NULL,

    CONSTRAINT "ValorMetrica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Habilidade" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "nivel" "NivelHabilidade" NOT NULL DEFAULT 'BASICO',
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "clubeId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Habilidade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgressoHabilidade" (
    "id" TEXT NOT NULL,
    "atletaId" TEXT NOT NULL,
    "habilidadeId" TEXT NOT NULL,
    "epocaId" TEXT NOT NULL,
    "estado" "EstadoHabilidade" NOT NULL DEFAULT 'NAO_INICIADO',
    "dataDesbloqueio" TIMESTAMP(3),
    "notas" TEXT,

    CONSTRAINT "ProgressoHabilidade_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Utilizador_email_key" ON "Utilizador"("email");

-- CreateIndex
CREATE INDEX "Utilizador_clubeId_idx" ON "Utilizador"("clubeId");

-- CreateIndex
CREATE INDEX "Epoca_clubeId_idx" ON "Epoca"("clubeId");

-- CreateIndex
CREATE INDEX "Escalao_clubeId_idx" ON "Escalao"("clubeId");

-- CreateIndex
CREATE INDEX "Atleta_escalaoId_idx" ON "Atleta"("escalaoId");

-- CreateIndex
CREATE INDEX "Atleta_epocaId_idx" ON "Atleta"("epocaId");

-- CreateIndex
CREATE INDEX "Atleta_epocaId_escalaoId_ativo_idx" ON "Atleta"("epocaId", "escalaoId", "ativo");

-- CreateIndex
CREATE INDEX "Exercicio_clubeId_idx" ON "Exercicio"("clubeId");

-- CreateIndex
CREATE INDEX "Exercicio_clubeId_categoria_idx" ON "Exercicio"("clubeId", "categoria");

-- CreateIndex
CREATE INDEX "Sessao_epocaId_escalaoId_data_idx" ON "Sessao"("epocaId", "escalaoId", "data");

-- CreateIndex
CREATE INDEX "SessaoExercicio_sessaoId_idx" ON "SessaoExercicio"("sessaoId");

-- CreateIndex
CREATE UNIQUE INDEX "SessaoExercicio_sessaoId_ordem_key" ON "SessaoExercicio"("sessaoId", "ordem");

-- CreateIndex
CREATE INDEX "Presenca_atletaId_idx" ON "Presenca"("atletaId");

-- CreateIndex
CREATE UNIQUE INDEX "Presenca_sessaoId_atletaId_key" ON "Presenca"("sessaoId", "atletaId");

-- CreateIndex
CREATE INDEX "Jogo_epocaId_escalaoId_data_idx" ON "Jogo"("epocaId", "escalaoId", "data");

-- CreateIndex
CREATE INDEX "Convocatoria_atletaId_idx" ON "Convocatoria"("atletaId");

-- CreateIndex
CREATE UNIQUE INDEX "Convocatoria_jogoId_atletaId_key" ON "Convocatoria"("jogoId", "atletaId");

-- CreateIndex
CREATE INDEX "EstatisticaAtleta_atletaId_idx" ON "EstatisticaAtleta"("atletaId");

-- CreateIndex
CREATE UNIQUE INDEX "EstatisticaAtleta_jogoId_atletaId_key" ON "EstatisticaAtleta"("jogoId", "atletaId");

-- CreateIndex
CREATE INDEX "MetricaConfig_clubeId_idx" ON "MetricaConfig"("clubeId");

-- CreateIndex
CREATE UNIQUE INDEX "ValorMetrica_metricaId_estatisticaId_key" ON "ValorMetrica"("metricaId", "estatisticaId");

-- CreateIndex
CREATE INDEX "Habilidade_clubeId_idx" ON "Habilidade"("clubeId");

-- CreateIndex
CREATE INDEX "ProgressoHabilidade_atletaId_epocaId_idx" ON "ProgressoHabilidade"("atletaId", "epocaId");

-- CreateIndex
CREATE UNIQUE INDEX "ProgressoHabilidade_atletaId_habilidadeId_epocaId_key" ON "ProgressoHabilidade"("atletaId", "habilidadeId", "epocaId");

-- AddForeignKey
ALTER TABLE "Utilizador" ADD CONSTRAINT "Utilizador_clubeId_fkey" FOREIGN KEY ("clubeId") REFERENCES "Clube"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Epoca" ADD CONSTRAINT "Epoca_clubeId_fkey" FOREIGN KEY ("clubeId") REFERENCES "Clube"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Escalao" ADD CONSTRAINT "Escalao_clubeId_fkey" FOREIGN KEY ("clubeId") REFERENCES "Clube"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Atleta" ADD CONSTRAINT "Atleta_escalaoId_fkey" FOREIGN KEY ("escalaoId") REFERENCES "Escalao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Atleta" ADD CONSTRAINT "Atleta_epocaId_fkey" FOREIGN KEY ("epocaId") REFERENCES "Epoca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exercicio" ADD CONSTRAINT "Exercicio_clubeId_fkey" FOREIGN KEY ("clubeId") REFERENCES "Clube"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exercicio" ADD CONSTRAINT "Exercicio_criadorId_fkey" FOREIGN KEY ("criadorId") REFERENCES "Utilizador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sessao" ADD CONSTRAINT "Sessao_escalaoId_fkey" FOREIGN KEY ("escalaoId") REFERENCES "Escalao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sessao" ADD CONSTRAINT "Sessao_epocaId_fkey" FOREIGN KEY ("epocaId") REFERENCES "Epoca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sessao" ADD CONSTRAINT "Sessao_criadorId_fkey" FOREIGN KEY ("criadorId") REFERENCES "Utilizador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessaoExercicio" ADD CONSTRAINT "SessaoExercicio_sessaoId_fkey" FOREIGN KEY ("sessaoId") REFERENCES "Sessao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessaoExercicio" ADD CONSTRAINT "SessaoExercicio_exercicioId_fkey" FOREIGN KEY ("exercicioId") REFERENCES "Exercicio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Presenca" ADD CONSTRAINT "Presenca_sessaoId_fkey" FOREIGN KEY ("sessaoId") REFERENCES "Sessao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Presenca" ADD CONSTRAINT "Presenca_atletaId_fkey" FOREIGN KEY ("atletaId") REFERENCES "Atleta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Jogo" ADD CONSTRAINT "Jogo_escalaoId_fkey" FOREIGN KEY ("escalaoId") REFERENCES "Escalao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Jogo" ADD CONSTRAINT "Jogo_epocaId_fkey" FOREIGN KEY ("epocaId") REFERENCES "Epoca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Jogo" ADD CONSTRAINT "Jogo_criadorId_fkey" FOREIGN KEY ("criadorId") REFERENCES "Utilizador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Convocatoria" ADD CONSTRAINT "Convocatoria_jogoId_fkey" FOREIGN KEY ("jogoId") REFERENCES "Jogo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Convocatoria" ADD CONSTRAINT "Convocatoria_atletaId_fkey" FOREIGN KEY ("atletaId") REFERENCES "Atleta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstatisticaAtleta" ADD CONSTRAINT "EstatisticaAtleta_jogoId_fkey" FOREIGN KEY ("jogoId") REFERENCES "Jogo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstatisticaAtleta" ADD CONSTRAINT "EstatisticaAtleta_atletaId_fkey" FOREIGN KEY ("atletaId") REFERENCES "Atleta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetricaConfig" ADD CONSTRAINT "MetricaConfig_clubeId_fkey" FOREIGN KEY ("clubeId") REFERENCES "Clube"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValorMetrica" ADD CONSTRAINT "ValorMetrica_metricaId_fkey" FOREIGN KEY ("metricaId") REFERENCES "MetricaConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValorMetrica" ADD CONSTRAINT "ValorMetrica_estatisticaId_fkey" FOREIGN KEY ("estatisticaId") REFERENCES "EstatisticaAtleta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Habilidade" ADD CONSTRAINT "Habilidade_clubeId_fkey" FOREIGN KEY ("clubeId") REFERENCES "Clube"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressoHabilidade" ADD CONSTRAINT "ProgressoHabilidade_atletaId_fkey" FOREIGN KEY ("atletaId") REFERENCES "Atleta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressoHabilidade" ADD CONSTRAINT "ProgressoHabilidade_habilidadeId_fkey" FOREIGN KEY ("habilidadeId") REFERENCES "Habilidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressoHabilidade" ADD CONSTRAINT "ProgressoHabilidade_epocaId_fkey" FOREIGN KEY ("epocaId") REFERENCES "Epoca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
