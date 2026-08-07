import type { Metadata } from "next";
import { listarEscaloes } from "@/lib/actions/escaloes";
import { EscaloesLista } from "@/components/definicoes/EscaloesLista";
import { EstadoErro } from "@/components/layout/EstadosUI";

export const metadata: Metadata = { title: "Definições · Escalões" };

export default async function EscaloesPage() {
  const resultado = await listarEscaloes();
  if (!resultado.sucesso) return <EstadoErro mensagem={resultado.erro} />;

  return <EscaloesLista escaloes={resultado.dados} />;
}
