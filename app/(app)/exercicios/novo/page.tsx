import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ExercicioForm } from "@/components/exercicios/ExercicioForm";

export default function NovoExercicioPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/exercicios"
          className="flex items-center gap-1 text-corpo-sec text-cinza-600 hover:text-cinza-900 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Exercícios
        </Link>
      </div>

      <h1>Novo exercício</h1>

      <ExercicioForm />
    </div>
  );
}
