import type { Metadata } from "next";
import { listarMetricas } from "@/lib/actions/metricas";
import { MetricasLista } from "@/components/definicoes/MetricasLista";
import { EstadoErro } from "@/components/layout/EstadosUI";

export const metadata: Metadata = { title: "Definições · Métricas" };

export default async function MetricasPage() {
  const resultado = await listarMetricas();
  if (!resultado.sucesso) return <EstadoErro mensagem={resultado.erro} />;

  return <MetricasLista metricas={resultado.dados} />;
}
