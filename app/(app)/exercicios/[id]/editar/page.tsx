import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { obterExercicio } from "@/lib/actions/exercicios";
import { ExercicioForm } from "@/components/exercicios/ExercicioForm";
import { ApagarExercicioButton } from "@/components/exercicios/ApagarExercicioButton";

export default async function EditarExercicioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const res = await obterExercicio(id);
  if (!res.sucesso) notFound();

  const e = res.dados;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/exercicios/${id}`}
          className="flex items-center gap-1 text-corpo-sec text-cinza-600 hover:text-cinza-900 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          {e.nome}
        </Link>
      </div>

      <h1>Editar exercício</h1>

      <ExercicioForm exercicio={e} />

      <div className="border-t border-cinza-200 pt-6">
        <ApagarExercicioButton exercicioId={e.id} nomeExercicio={e.nome} />
      </div>
    </div>
  );
}
