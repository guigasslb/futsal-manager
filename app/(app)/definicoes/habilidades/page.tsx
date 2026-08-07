import type { Metadata } from "next";
import { listarHabilidades } from "@/lib/actions/habilidades";
import { HabilidadesLista } from "@/components/definicoes/HabilidadesLista";
import { EstadoErro } from "@/components/layout/EstadosUI";

export const metadata: Metadata = { title: "Definições · Habilidades" };

export default async function HabilidadesPage() {
  const resultado = await listarHabilidades();
  if (!resultado.sucesso) return <EstadoErro mensagem={resultado.erro} />;

  return <HabilidadesLista habilidades={resultado.dados} />;
}
