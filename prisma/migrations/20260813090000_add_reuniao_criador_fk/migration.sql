-- Integridade referencial de Reuniao.criadorId → Utilizador.
-- Antes: criadorId era NOT NULL e sem FK (podia ficar órfão ao apagar o utilizador).
-- Depois: criadorId nullable com FK ON DELETE SET NULL — se o utilizador for
-- apagado, a reunião preserva-se sem criador (o histórico não é perdido).

-- AlterTable
ALTER TABLE "Reuniao" ALTER COLUMN "criadorId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Reuniao_criadorId_idx" ON "Reuniao"("criadorId");

-- AddForeignKey
ALTER TABLE "Reuniao" ADD CONSTRAINT "Reuniao_criadorId_fkey" FOREIGN KEY ("criadorId") REFERENCES "Utilizador"("id") ON DELETE SET NULL ON UPDATE CASCADE;
