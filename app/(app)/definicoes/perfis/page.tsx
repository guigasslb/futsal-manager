import type { Metadata } from "next";
import { listarPerfis } from "@/lib/actions/perfis";
import { PerfisLista } from "@/components/definicoes/PerfisLista";
import { EstadoErro } from "@/components/layout/EstadosUI";

export const metadata: Metadata = { title: "Definições · Perfis" };

export default async function PerfisPage() {
  const res = await listarPerfis();
  if (!res.sucesso) return <EstadoErro mensagem={res.erro} />;
  return <PerfisLista perfis={res.dados} />;
}
