import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { listarEscaloes } from "@/lib/actions/escaloes";
import { listarPlaneamentos } from "@/lib/actions/periodizacao";
import { SessaoForm } from "@/components/treinos/SessaoForm";
import { EstadoErro } from "@/components/layout/EstadosUI";

export const metadata: Metadata = { title: "Novo treino" };

export default async function NovaSessaoPage() {
  const [resEscaloes, resPlan] = await Promise.all([
    listarEscaloes(),
    listarPlaneamentos(),
  ]);
  if (!resEscaloes.sucesso) return <EstadoErro mensagem={resEscaloes.erro} />;

  const planeamentos = resPlan.sucesso ? resPlan.dados : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/treinos"
          className="flex items-center gap-1 text-corpo-sec text-cinza-600 hover:text-cinza-900 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Treinos
        </Link>
      </div>

      <h1>Nova sessão</h1>

      <SessaoForm escaloes={resEscaloes.dados} planeamentos={planeamentos} />
    </div>
  );
}
