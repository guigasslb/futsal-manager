-- Campo `afixada` no modelo `Reuniao` (bíblia §3 — reuniões).
--
-- Indica se uma reunião está afixada no Dashboard/Início para ficar sempre
-- visível no painel de arranque, independentemente da data.
--
-- Coluna aditiva (NOT NULL com default false): não destrói dados existentes
-- e todas as reuniões atuais ficam como não afixadas. Não toca em auth.

-- AlterTable
ALTER TABLE "Reuniao" ADD COLUMN IF NOT EXISTS "afixada" BOOLEAN NOT NULL DEFAULT false;
