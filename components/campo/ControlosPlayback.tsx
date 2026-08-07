"use client";

import { Play, Pause, RotateCcw, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ControlosPlaybackProps {
  aPlay: boolean;
  loop: boolean;
  velocidade: 0.5 | 1 | 2;
  onPlay: () => void;
  onPause: () => void;
  onReiniciar: () => void;
  onVelocidade: (v: 0.5 | 1 | 2) => void;
  onToggleLoop: () => void;
}

const VELOCIDADES: (0.5 | 1 | 2)[] = [0.5, 1, 2];

export function ControlosPlayback({
  aPlay,
  loop,
  velocidade,
  onPlay,
  onPause,
  onReiniciar,
  onVelocidade,
  onToggleLoop,
}: ControlosPlaybackProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={aPlay ? onPause : onPlay}
        aria-label={aPlay ? "Pausar animação" : "Reproduzir animação"}
      >
        {aPlay ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        {aPlay ? "Pausar" : "Reproduzir"}
      </Button>

      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={onReiniciar}
        aria-label="Reiniciar animação"
      >
        <RotateCcw className="h-4 w-4" />
        Reiniciar
      </Button>

      <Button
        type="button"
        size="sm"
        variant={loop ? "default" : "outline"}
        onClick={onToggleLoop}
        aria-pressed={loop}
        aria-label="Repetir em ciclo"
      >
        <Repeat className="h-4 w-4" />
        Repetir
      </Button>

      <div
        className="flex items-center gap-1"
        role="group"
        aria-label="Velocidade de reprodução"
      >
        <span className="text-legenda text-cinza-500">Velocidade:</span>
        {VELOCIDADES.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onVelocidade(v)}
            aria-pressed={velocidade === v}
            className={`min-w-11 rounded border px-2 py-1 text-corpo-sec transition-colors ${
              velocidade === v
                ? "border-primary bg-primary/5 text-primary"
                : "border-cinza-200 text-cinza-700 hover:bg-cinza-50"
            }`}
          >
            ×{v}
          </button>
        ))}
      </div>
    </div>
  );
}
