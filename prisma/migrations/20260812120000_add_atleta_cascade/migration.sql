-- P1.3 (RGPD — hard-delete de menores): as relações que referenciam Atleta.atletaId
-- e que eram obrigatórias tinham ON DELETE (implícito) RESTRICT, o que bloqueava o
-- apagamento definitivo do atleta. Passam a ON DELETE CASCADE para que o hard-delete
-- remova irreversivelmente todos os dados pessoais associados.
--
-- As restantes relações de Atleta (Consentimento, AtletaEscalao, EventoJogo,
-- ProgressoHabilidade) já tinham Cascade. ValorMetrica cascateia via EstatisticaAtleta.

-- DropForeignKey
ALTER TABLE "Presenca" DROP CONSTRAINT "Presenca_atletaId_fkey";

-- DropForeignKey
ALTER TABLE "Convocatoria" DROP CONSTRAINT "Convocatoria_atletaId_fkey";

-- DropForeignKey
ALTER TABLE "EstatisticaAtleta" DROP CONSTRAINT "EstatisticaAtleta_atletaId_fkey";

-- AddForeignKey
ALTER TABLE "Presenca" ADD CONSTRAINT "Presenca_atletaId_fkey" FOREIGN KEY ("atletaId") REFERENCES "Atleta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Convocatoria" ADD CONSTRAINT "Convocatoria_atletaId_fkey" FOREIGN KEY ("atletaId") REFERENCES "Atleta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstatisticaAtleta" ADD CONSTRAINT "EstatisticaAtleta_atletaId_fkey" FOREIGN KEY ("atletaId") REFERENCES "Atleta"("id") ON DELETE CASCADE ON UPDATE CASCADE;
