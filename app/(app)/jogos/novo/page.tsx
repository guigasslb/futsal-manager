import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { listarEscaloes } from "@/lib/actions/escaloes";
import { JogoForm } from "@/components/jogos/JogoForm";
import { EstadoErro } from "@/components/layout/EstadosUI";

export default async function NovoJogoPage() {
  const resEscaloes = await listarEscaloes();
  if (!resEscaloes.sucesso) return <EstadoErro mensagem={resEscaloes.erro} />;

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

      <JogoForm escaloes={resEscaloes.dados} />
    </div>
  );
}
