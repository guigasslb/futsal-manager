import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { obterModeloJogo } from "@/lib/actions/modeloJogo";
import { LABEL_MOMENTO } from "@/lib/schemas/modeloJogo";
import { diagramaSchema } from "@/lib/schemas/exercicio";
import { CampoFutsal } from "@/components/campo/CampoFutsal";
import { CampoAnimado } from "@/components/campo/CampoAnimado";

export default async function DetalheModeloJogoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const res = await obterModeloJogo(id);
  if (!res.sucesso) notFound();
  const m = res.dados;
  const diag = diagramaSchema.safeParse(m.diagrama);
  const diagrama = diag.success ? diag.data : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/modelo-jogo" className="flex items-center gap-1 text-corpo-sec text-cinza-600 hover:text-cinza-900 transition-colors">
          <ChevronLeft className="h-4 w-4" />
          Modelo de jogo
        </Link>
        <Button asChild variant="outline">
          <Link href={`/modelo-jogo/${m.id}/editar`}><Pencil className="h-4 w-4" />Editar</Link>
        </Button>
      </div>

      <div className="space-y-2">
        <h1>{m.nome}</h1>
        <Badge variant="secondary">{LABEL_MOMENTO[m.momento]}</Badge>
      </div>

      {diagrama && diagrama.elementos.length > 0 && (
        <div className="max-w-2xl rounded-lg border border-cinza-200 bg-white p-5 shadow-card">
          {diagrama.passos && diagrama.passos.length > 0 ? (
            <CampoAnimado diagrama={diagrama} />
          ) : (
            <CampoFutsal diagrama={diagrama} />
          )}
        </div>
      )}

      {m.principios && (
        <div className="rounded-lg border border-cinza-200 bg-white p-5 shadow-card">
          <p className="text-legenda font-medium uppercase tracking-wide text-cinza-500">Princípios</p>
          <p className="mt-1 text-corpo text-cinza-900 whitespace-pre-wrap">{m.principios}</p>
        </div>
      )}
    </div>
  );
}
