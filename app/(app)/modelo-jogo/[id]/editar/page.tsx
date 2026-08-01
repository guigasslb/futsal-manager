import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { obterModeloJogo } from "@/lib/actions/modeloJogo";
import { ModeloJogoForm } from "@/components/modelo-jogo/ModeloJogoForm";
import { ApagarModeloJogoButton } from "@/components/modelo-jogo/ApagarModeloJogoButton";

export default async function EditarModeloJogoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const res = await obterModeloJogo(id);
  if (!res.sucesso) notFound();
  const m = res.dados;

  return (
    <div className="space-y-6">
      <Link href={`/modelo-jogo/${id}`} className="flex w-fit items-center gap-1 text-corpo-sec text-cinza-600 hover:text-cinza-900 transition-colors">
        <ChevronLeft className="h-4 w-4" />
        {m.nome}
      </Link>
      <h1>Editar modelo</h1>
      <ModeloJogoForm modelo={m} />
      <div className="border-t border-cinza-200 pt-6">
        <ApagarModeloJogoButton id={m.id} nome={m.nome} />
      </div>
    </div>
  );
}
