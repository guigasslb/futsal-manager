-- Índice em Sessao.data para verificarConflitoAgenda
CREATE INDEX IF NOT EXISTS "Sessao_data_idx" ON "Sessao"("data");

-- Índice em Jogo.data para verificarConflitoAgenda
CREATE INDEX IF NOT EXISTS "Jogo_data_idx" ON "Jogo"("data");
