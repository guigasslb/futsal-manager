import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { listarObservacoes } from "@/lib/actions/scouting";
import { ScoutingLista } from "@/components/jogos/ScoutingLista";
import { EstadoErro } from "@/components/layout/EstadosUI";

export const metadata: Metadata = { title: "Scouting" };

export default async function ScoutingPage() {
  const res = await listarObservacoes();
  if (!res.sucesso) return <EstadoErro mensagem={res.erro} />;

  return (
    <div className="space-y-6">
      <Link href="/jogos" className="flex w-fit items-center gap-1 text-corpo-sec text-cinza-600 hover:text-cinza-900 transition-colors">
        <ChevronLeft className="h-4 w-4" />
        Jogos
      </Link>
      <ScoutingLista observacoes={res.dados} />
    </div>
  );
}
