-- Performance: índices compostos na tabela Presenca para queries analíticas
CREATE INDEX IF NOT EXISTS "Presenca_escalaoId_estado_idx" ON "Presenca"("escalaoId", "estado");
CREATE INDEX IF NOT EXISTS "Presenca_sessaoId_estado_idx" ON "Presenca"("sessaoId", "estado");
