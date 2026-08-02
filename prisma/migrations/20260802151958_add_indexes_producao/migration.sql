-- CreateIndex
CREATE INDEX "Competicao_clubeId_idx" ON "Competicao"("clubeId");

-- CreateIndex
CREATE INDEX "Competicao_escalaoId_idx" ON "Competicao"("escalaoId");

-- CreateIndex
CREATE INDEX "Jogo_escalaoId_idx" ON "Jogo"("escalaoId");

-- CreateIndex
CREATE INDEX "MembroClube_perfilId_idx" ON "MembroClube"("perfilId");

-- CreateIndex
CREATE INDEX "Planeamento_escalaoId_idx" ON "Planeamento"("escalaoId");

-- CreateIndex
CREATE INDEX "ProgressoHabilidade_habilidadeId_idx" ON "ProgressoHabilidade"("habilidadeId");

-- CreateIndex
CREATE INDEX "Sessao_escalaoId_idx" ON "Sessao"("escalaoId");

-- CreateIndex
CREATE INDEX "Sessao_planeamentoId_idx" ON "Sessao"("planeamentoId");

-- CreateIndex
CREATE INDEX "SessaoExercicio_exercicioId_idx" ON "SessaoExercicio"("exercicioId");

-- CreateIndex
CREATE INDEX "ValorMetrica_estatisticaId_idx" ON "ValorMetrica"("estatisticaId");
