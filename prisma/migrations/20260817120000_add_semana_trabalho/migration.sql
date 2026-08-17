-- Semana de trabalho (§8.9.1, decisão 2026-08-16)
-- Migração aditiva: todas as colunas são opcionais (nullable), sem perda de dados.

-- Enums
CREATE TYPE "ModoSemana" AS ENUM ('ESTRUTURADO', 'TEXTO_LIVRE');
CREATE TYPE "MomentoSemana" AS ENUM ('MD_MENOS_3', 'MD_MENOS_2', 'MD_MENOS_1', 'MD_MAIS_1', 'ATIVACAO', 'TAPER', 'LIVRE');

-- Planeamento: formalização opcional da semana.
-- modoSemana é NULLABLE (bíblia §3.5): null = semana não formalizada; só preenchido quando o treinador formaliza.
ALTER TABLE "Planeamento" ADD COLUMN IF NOT EXISTS "nome" TEXT;
ALTER TABLE "Planeamento" ADD COLUMN IF NOT EXISTS "modoSemana" "ModoSemana";
ALTER TABLE "Planeamento" ADD COLUMN IF NOT EXISTS "notaSemana" TEXT;

-- Sessao: posição do dia na semana (modo ESTRUTURADO). Opcional, nunca bloqueia a sessão.
ALTER TABLE "Sessao" ADD COLUMN IF NOT EXISTS "momentoSemana" "MomentoSemana";
