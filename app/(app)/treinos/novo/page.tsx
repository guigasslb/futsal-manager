import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { listarEscaloes } from "@/lib/actions/escaloes";
import { SessaoForm } from "@/components/treinos/SessaoForm";
import { EstadoErro } from "@/components/layout/EstadosUI";

export const metadata: Metadata = { title: "Novo treino" };

/** Data pré-preenchida (default 20h00) quando se cria a partir de uma semana. */
function dataInicialDe(data?: string): Date | undefined {
  if (!data || !/^\d{4}-\d{2}-\d{2}$/.test(data)) return undefined;
  const d = new Date(`${data}T20:00`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export default async function NovaSessaoPage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string; escalaoId?: string }>;
}) {
  const { data, escalaoId } = await searchParams;
  const resEscaloes = await listarEscaloes();
  if (!resEscaloes.sucesso) return <EstadoErro mensagem={resEscaloes.erro} />;

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

      <SessaoForm
        escaloes={resEscaloes.dados}
        escalaoIdInicial={escalaoId}
        dataInicial={dataInicialDe(data)}
      />
    </div>
  );
}
