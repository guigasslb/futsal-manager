import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import {
  obterCompeticao,
  obterClassificacao,
  type LinhaClassificacao,
} from "@/lib/actions/competicoes";
import { listarEscaloes } from "@/lib/actions/escaloes";
import { listarEpocas } from "@/lib/actions/epocas";
import { CompeticaoDetalhe } from "@/components/competicoes/CompeticaoDetalhe";

export const metadata: Metadata = { title: "Detalhe da competição" };

export default async function CompeticaoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [resComp, resClass, resEsc, resEpocas] = await Promise.all([
    obterCompeticao(id),
    obterClassificacao(id),
    listarEscaloes(),
    listarEpocas(),
  ]);

  if (!resComp.sucesso) notFound();

  const classificacao: LinhaClassificacao[] = resClass.sucesso ? resClass.dados : [];
  const escaloes = resEsc.sucesso
    ? resEsc.dados.map((e) => ({ id: e.id, nome: e.nome }))
    : [];
  const epocas = resEpocas.sucesso
    ? resEpocas.dados.map((ep) => ({ id: ep.id, nome: ep.nome, ativa: ep.ativa }))
    : [];

  return (
    <div className="space-y-6">
      <Link
        href="/jogos/competicoes"
        className="flex w-fit items-center gap-1 text-corpo-sec text-cinza-600 hover:text-cinza-900 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Competições
      </Link>

      <CompeticaoDetalhe
        competicao={resComp.dados}
        classificacao={classificacao}
        escaloes={escaloes}
        epocas={epocas}
      />
    </div>
  );
}
