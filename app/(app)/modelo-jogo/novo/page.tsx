import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ModeloJogoForm } from "@/components/modelo-jogo/ModeloJogoForm";

export default function NovoModeloJogoPage() {
  return (
    <div className="space-y-6">
      <Link
        href="/modelo-jogo"
        className="flex w-fit items-center gap-1 text-corpo-sec text-cinza-600 hover:text-cinza-900 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Modelo de jogo
      </Link>
      <h1>Nova representação</h1>
      <ModeloJogoForm />
    </div>
  );
}
