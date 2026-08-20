import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { listarEscaloes } from "@/lib/actions/escaloes";
import { listarEpocas } from "@/lib/actions/epocas";
import { WizardCompeticao } from "@/components/competicoes/WizardCompeticao";
import { EstadoErro } from "@/components/layout/EstadosUI";

export const metadata: Metadata = { title: "Competições · Nova" };

export default async function NovaCompeticaoPage() {
  const [resEsc, resEpocas] = await Promise.all([listarEscaloes(), listarEpocas()]);

  if (!resEsc.sucesso) return <EstadoErro mensagem={resEsc.erro} />;
  if (!resEpocas.sucesso) return <EstadoErro mensagem={resEpocas.erro} />;

  const escaloes = resEsc.dados.map((e) => ({ id: e.id, nome: e.nome }));
  const epocas = resEpocas.dados.map((ep) => ({ id: ep.id, nome: ep.nome, ativa: ep.ativa }));

  return (
    <div className="space-y-6">
      <Link
        href="/jogos/competicoes"
        className="flex w-fit items-center gap-1 text-corpo-sec text-cinza-600 transition-colors hover:text-cinza-900"
      >
        <ChevronLeft className="h-4 w-4" />
        Competições
      </Link>
      <WizardCompeticao escaloes={escaloes} epocas={epocas} />
    </div>
  );
}
