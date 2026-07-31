import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { obterJogo } from "@/lib/actions/jogos";
import { listarEscaloes } from "@/lib/actions/escaloes";
import { JogoForm } from "@/components/jogos/JogoForm";
import { EstadoErro } from "@/components/layout/EstadosUI";

export default async function EditarJogoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [resJogo, resEscaloes] = await Promise.all([obterJogo(id), listarEscaloes()]);

  if (!resJogo.sucesso) notFound();
  if (!resEscaloes.sucesso) return <EstadoErro mensagem={resEscaloes.erro} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/jogos/${id}`}
          className="flex items-center gap-1 text-corpo-sec text-cinza-600 hover:text-cinza-900 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar ao jogo
        </Link>
      </div>

      <h1>Editar jogo</h1>

      <JogoForm escaloes={resEscaloes.dados} jogo={resJogo.dados} />
    </div>
  );
}
