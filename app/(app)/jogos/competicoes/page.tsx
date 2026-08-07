import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { listarCompeticoes } from "@/lib/actions/competicoes";
import { listarEscaloes } from "@/lib/actions/escaloes";
import { listarEpocas } from "@/lib/actions/epocas";
import { CompeticoesLista } from "@/components/jogos/CompeticoesLista";
import { EstadoErro } from "@/components/layout/EstadosUI";

export const metadata: Metadata = { title: "Competições" };

export default async function CompeticoesPage() {
  const [resComp, resEsc, resEpocas] = await Promise.all([
    listarCompeticoes(),
    listarEscaloes(),
    listarEpocas(),
  ]);
  if (!resComp.sucesso) return <EstadoErro mensagem={resComp.erro} />;
  const escaloes = resEsc.sucesso ? resEsc.dados.map((e) => ({ id: e.id, nome: e.nome })) : [];
  const epocas = resEpocas.sucesso
    ? resEpocas.dados.map((ep) => ({ id: ep.id, nome: ep.nome, ativa: ep.ativa }))
    : [];

  return (
    <div className="space-y-6">
      <Link href="/jogos" className="flex w-fit items-center gap-1 text-corpo-sec text-cinza-600 hover:text-cinza-900 transition-colors">
        <ChevronLeft className="h-4 w-4" />
        Jogos
      </Link>
      <CompeticoesLista competicoes={resComp.dados} escaloes={escaloes} epocas={epocas} />
    </div>
  );
}
