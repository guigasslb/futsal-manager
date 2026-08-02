-- CreateEnum
CREATE TYPE "TipoSessao" AS ENUM ('NORMAL', 'ABERTO', 'CAPTACAO', 'EVENTO');

-- AlterTable
ALTER TABLE "Sessao" ADD COLUMN     "tipoSessao" "TipoSessao" NOT NULL DEFAULT 'NORMAL';
