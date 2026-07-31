import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { listarEscaloes } from "@/lib/actions/escaloes";
import { AtletaForm } from "@/components/plantel/AtletaForm";
import { EstadoErro } from "@/components/layout/EstadosUI";

export default async function NovoAtletaPage() {
  const resEscaloes = await listarEscaloes();
  if (!resEscaloes.sucesso) return <EstadoErro mensagem={resEscaloes.erro} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/plantel"
          className="flex items-center gap-1 text-corpo-sec text-cinza-600 hover:text-cinza-900 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Plantel
        </Link>
      </div>

      <h1>Novo atleta</h1>

      <AtletaForm escaloes={resEscaloes.dados} />
    </div>
  );
}
