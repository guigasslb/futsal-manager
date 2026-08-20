"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { ModoTreino, type ExercicioModo } from "@/components/treinos/ModoTreino";

/**
 * Botão de arranque do modo treino (Melhoria 3/4.2). Abre o overlay de condução
 * em ecrã cheio e, ao terminar, leva o treinador ao bloco de RPE para registar a
 * carga da sessão (foco automático — §8.20).
 */
export function IniciarTreinoBotao({ exercicios }: { exercicios: ExercicioModo[] }) {
  const [aberto, setAberto] = useState(false);
  const semExercicios = exercicios.length === 0;

  function terminar() {
    setAberto(false);
    // Foca o bloco de carga (RPE) para registar o esforço percebido logo a seguir.
    requestAnimationFrame(() => {
      const alvo = document.getElementById("carga-sessao");
      if (!alvo) return;
      alvo.scrollIntoView({ behavior: "smooth", block: "center" });
      const primeiro = alvo.querySelector<HTMLButtonElement>("button");
      primeiro?.focus();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        disabled={semExercicios}
        className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-lg bg-laranja-600 text-subtitulo font-semibold text-white transition-colors hover:bg-[#A8370C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-40 sm:w-auto sm:px-8"
      >
        <Play className="h-5 w-5" fill="currentColor" />
        {semExercicios ? "Sem exercícios para conduzir" : "Iniciar treino"}
      </button>

      {aberto && <ModoTreino exercicios={exercicios} onFinish={terminar} />}
    </>
  );
}
