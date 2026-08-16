-- §4.2.1 — Snapshot só-de-leitura de exercícios do treinador em sessões do clube.
-- Congela nome/descrição/objetivo/diagrama no momento em que um exercício
-- proprietario = TREINADOR é adicionado a uma sessão, para o clube reconstruir o
-- histórico depois de o treinador (e o master editável) saírem. Imutável.
ALTER TABLE "SessaoExercicio"
  ADD COLUMN "snapNome"      TEXT,
  ADD COLUMN "snapDescricao" TEXT,
  ADD COLUMN "snapObjetivo"  TEXT,
  ADD COLUMN "snapDiagrama"  JSONB,
  ADD COLUMN "snapCriadoEm"  TIMESTAMP(3);
