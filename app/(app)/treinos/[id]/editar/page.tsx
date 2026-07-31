import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { obterSessao } from "@/lib/actions/treinos";
import { listarEscaloes } from "@/lib/actions/escaloes";
import { SessaoForm } from "@/components/treinos/SessaoForm";
import { ApagarSessaoButton } from "@/components/treinos/ApagarSessaoButton";
import { EstadoErro } from "@/components/layout/EstadosUI";

export default async function EditarSessaoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [resSessao, resEscaloes] = await Promise.all([
    obterSessao(id),
    listarEscaloes(),
  ]);

  if (!resSessao.sucesso) notFound();
  if (!resEscaloes.sucesso) return <EstadoErro mensagem={resEscaloes.erro} />;

  const s = resSessao.dados;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/treinos/${id}`}
          className="flex items-center gap-1 text-corpo-sec text-cinza-600 hover:text-cinza-900 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar à sessão
        </Link>
      </div>

      <h1>Editar sessão</h1>

      <SessaoForm escaloes={resEscaloes.dados} sessao={s} />

      <div className="border-t border-cinza-200 pt-6">
        <ApagarSessaoButton sessaoId={s.id} />
      </div>
    </div>
  );
}
