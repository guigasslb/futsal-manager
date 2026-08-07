import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { listarEscaloes } from "@/lib/actions/escaloes";
import { listarCompeticoes } from "@/lib/actions/competicoes";
import { JogoForm } from "@/components/jogos/JogoForm";
import { EstadoErro } from "@/components/layout/EstadosUI";

export const metadata: Metadata = { title: "Novo jogo" };

export default async function NovoJogoPage() {
  const [resEscaloes, resComp] = await Promise.all([listarEscaloes(), listarCompeticoes()]);
  if (!resEscaloes.sucesso) return <EstadoErro mensagem={resEscaloes.erro} />;
  const competicoes = resComp.sucesso
    ? resComp.dados.map((c) => ({ id: c.id, nome: c.nome, escalaoId: c.escalaoId }))
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/jogos"
          className="flex items-center gap-1 text-corpo-sec text-cinza-600 hover:text-cinza-900 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Jogos
        </Link>
      </div>

      <h1>Novo jogo</h1>

      <JogoForm escaloes={resEscaloes.dados} competicoes={competicoes} />
    </div>
  );
}
