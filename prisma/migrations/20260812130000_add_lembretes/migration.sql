-- P2.1 (§3.15/§8.19): sistema de Lembretes/Tarefas persistido.
-- Duas tabelas: Lembrete (a tarefa) e LembreteDestinatario (destinatários + estado `visto`).
--
-- NOTA de modelação: criadoPorId e utilizadorId referenciam "Utilizador" (a pessoa),
-- não "Perfil" — no FutsalCoach o Perfil é um pacote de capacidades (papel), pelo que
-- criador/destinatário têm de ser pessoas para o estado `visto` e o filtro
-- "criados por mim / onde sou destinatário" fazerem sentido.

-- CreateTable
CREATE TABLE "Lembrete" (
    "id" TEXT NOT NULL,
    "clubeId" TEXT NOT NULL,
    "criadoPorId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "dataLimite" TIMESTAMP(3),
    "concluido" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lembrete_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LembreteDestinatario" (
    "id" TEXT NOT NULL,
    "lembreteId" TEXT NOT NULL,
    "utilizadorId" TEXT NOT NULL,
    "visto" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LembreteDestinatario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Lembrete_clubeId_idx" ON "Lembrete"("clubeId");

-- CreateIndex
CREATE INDEX "Lembrete_criadoPorId_idx" ON "Lembrete"("criadoPorId");

-- CreateIndex
CREATE INDEX "LembreteDestinatario_utilizadorId_idx" ON "LembreteDestinatario"("utilizadorId");

-- CreateIndex
CREATE UNIQUE INDEX "LembreteDestinatario_lembreteId_utilizadorId_key" ON "LembreteDestinatario"("lembreteId", "utilizadorId");

-- AddForeignKey
ALTER TABLE "Lembrete" ADD CONSTRAINT "Lembrete_clubeId_fkey" FOREIGN KEY ("clubeId") REFERENCES "Clube"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lembrete" ADD CONSTRAINT "Lembrete_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "Utilizador"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LembreteDestinatario" ADD CONSTRAINT "LembreteDestinatario_lembreteId_fkey" FOREIGN KEY ("lembreteId") REFERENCES "Lembrete"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LembreteDestinatario" ADD CONSTRAINT "LembreteDestinatario_utilizadorId_fkey" FOREIGN KEY ("utilizadorId") REFERENCES "Utilizador"("id") ON DELETE CASCADE ON UPDATE CASCADE;
