-- Fase 31 (§17.1 / §8.1) — plano escolhido no onboarding fica como licença PENDENTE.
-- Novo estado para representar uma subscrição escolhida mas ainda não paga/ativada.
-- `IF NOT EXISTS` torna a migração idempotente perante reexecuções.
ALTER TYPE "EstadoLicenca" ADD VALUE IF NOT EXISTS 'PENDENTE';
