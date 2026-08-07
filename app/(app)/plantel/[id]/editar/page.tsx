import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { obterAtleta } from "@/lib/actions/atletas";
import { listarEscaloes } from "@/lib/actions/escaloes";
import { AtletaForm } from "@/components/plantel/AtletaForm";
import { ApagarAtletaButton } from "@/components/plantel/ApagarAtletaButton";
import { EstadoErro } from "@/components/layout/EstadosUI";

export const metadata: Metadata = { title: "Editar atleta" };

export default async function EditarAtletaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [resAtleta, resEscaloes] = await Promise.all([
    obterAtleta(id),
    listarEscaloes(),
  ]);

  if (!resAtleta.sucesso) notFound();
  if (!resEscaloes.sucesso) return <EstadoErro mensagem={resEscaloes.erro} />;

  const atleta = resAtleta.dados;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/plantel/${id}`}
          className="flex items-center gap-1 text-corpo-sec text-cinza-600 hover:text-cinza-900 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          {atleta.nome}
        </Link>
      </div>

      <h1>Editar atleta</h1>

      <AtletaForm escaloes={resEscaloes.dados} atleta={atleta} />

      <div className="border-t border-cinza-200 pt-6">
        <ApagarAtletaButton atletaId={atleta.id} nomeAtleta={atleta.nome} />
      </div>
    </div>
  );
}
