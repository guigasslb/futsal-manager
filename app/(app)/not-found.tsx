import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-azul-50">
        <FileQuestion className="h-8 w-8 text-cinza-400" />
      </div>
      <h3 className="text-subtitulo text-cinza-900">Página não encontrada</h3>
      <p className="mt-1 max-w-sm text-corpo-sec text-cinza-600">
        O recurso que procuras não existe ou foi removido.
      </p>
      <Button asChild className="mt-6">
        <Link href="/dashboard">Voltar ao início</Link>
      </Button>
    </div>
  );
}
