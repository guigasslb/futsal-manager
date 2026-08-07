import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ModeloJogoForm } from "@/components/modelo-jogo/ModeloJogoForm";
import { listarEscaloes } from "@/lib/actions/escaloes";
import { listarEpocas } from "@/lib/actions/epocas";
import { obterEpocaAtiva } from "@/lib/epoca-context";

export const metadata: Metadata = { title: "Novo modelo de jogo" };

export default async function NovoModeloJogoPage() {
  const [resEscaloes, resEpocas, epocaAtiva] = await Promise.all([
    listarEscaloes(),
    listarEpocas(),
    obterEpocaAtiva(),
  ]);

  return (
    <div className="space-y-6">
      <Link
        href="/modelo-jogo"
        className="flex w-fit items-center gap-1 text-corpo-sec text-cinza-600 hover:text-cinza-900 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Modelo de jogo
      </Link>
      <h1>Nova representação</h1>
      <ModeloJogoForm
        escaloes={resEscaloes.sucesso ? resEscaloes.dados : []}
        epocas={resEpocas.sucesso ? resEpocas.dados : []}
        epocaAtivaId={epocaAtiva?.id ?? null}
      />
    </div>
  );
}
