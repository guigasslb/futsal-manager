-- CreateIndex
CREATE INDEX "EventoJogo_atletaId_idx" ON "EventoJogo"("atletaId");

-- CreateIndex
CREATE INDEX "Planeamento_clubeId_idx" ON "Planeamento"("clubeId");

-- AddForeignKey
ALTER TABLE "ModeloJogo" ADD CONSTRAINT "ModeloJogo_clubeProprietarioId_fkey" FOREIGN KEY ("clubeProprietarioId") REFERENCES "Clube"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Planeamento" ADD CONSTRAINT "Planeamento_clubeId_fkey" FOREIGN KEY ("clubeId") REFERENCES "Clube"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Competicao" ADD CONSTRAINT "Competicao_clubeId_fkey" FOREIGN KEY ("clubeId") REFERENCES "Clube"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoJogo" ADD CONSTRAINT "EventoJogo_atletaId_fkey" FOREIGN KEY ("atletaId") REFERENCES "Atleta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObservacaoAdversario" ADD CONSTRAINT "ObservacaoAdversario_clubeId_fkey" FOREIGN KEY ("clubeId") REFERENCES "Clube"("id") ON DELETE CASCADE ON UPDATE CASCADE;
