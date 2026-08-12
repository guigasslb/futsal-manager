-- P2.4 (§8.17): perfil do treinador / histórico de carreira.
-- Tabela RegistoCarreira — passagens de carreira (clube/escalão/épocas/conquistas).
--
-- NOTA de modelação: utilizadorId referencia "Utilizador" (a pessoa), não "Perfil".
-- O histórico de carreira é PORTÁTIL e pertence à pessoa (§17.3 — "o que crias é teu
-- para toda a carreira"), independente de qualquer clube; por isso o campo `clube` é
-- texto livre (o treinador pode ter treinado em clubes fora do sistema).

-- CreateTable
CREATE TABLE "RegistoCarreira" (
    "id" TEXT NOT NULL,
    "utilizadorId" TEXT NOT NULL,
    "clube" TEXT NOT NULL,
    "escalao" TEXT NOT NULL,
    "epocaInicio" TEXT NOT NULL,
    "epocaFim" TEXT,
    "conquistas" TEXT,
    "notas" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegistoCarreira_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RegistoCarreira_utilizadorId_idx" ON "RegistoCarreira"("utilizadorId");

-- AddForeignKey
ALTER TABLE "RegistoCarreira" ADD CONSTRAINT "RegistoCarreira_utilizadorId_fkey" FOREIGN KEY ("utilizadorId") REFERENCES "Utilizador"("id") ON DELETE CASCADE ON UPDATE CASCADE;
