import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { listarPlaneamentos } from "@/lib/actions/periodizacao";
import { listarEscaloes } from "@/lib/actions/escaloes";
import { PlaneamentoLista } from "@/components/treinos/PlaneamentoLista";
import { EstadoErro } from "@/components/layout/EstadosUI";

export const metadata: Metadata = { title: "Periodização" };

export default async function PeriodizacaoPage() {
  const [resPlan, resEsc] = await Promise.all([listarPlaneamentos(), listarEscaloes()]);
  if (!resPlan.sucesso) return <EstadoErro mensagem={resPlan.erro} />;

  const escaloes = resEsc.sucesso ? resEsc.dados.map((e) => ({ id: e.id, nome: e.nome })) : [];

  return (
    <div className="space-y-6">
      <Link
        href="/treinos"
        className="flex w-fit items-center gap-1 text-corpo-sec text-cinza-600 hover:text-cinza-900 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Treinos
      </Link>
      <PlaneamentoLista planeamentos={resPlan.dados} escaloes={escaloes} />
    </div>
  );
}
