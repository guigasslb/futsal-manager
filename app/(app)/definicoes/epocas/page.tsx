import type { Metadata } from "next";
import { listarEpocas } from "@/lib/actions/epocas";
import { obterMembroAtual } from "@/lib/permissoes";
import { EpocasLista } from "@/components/definicoes/EpocasLista";
import { EstadoErro } from "@/components/layout/EstadosUI";

export const metadata: Metadata = { title: "Definições · Épocas" };

export default async function EpocasPage() {
  const [resultado, membro] = await Promise.all([
    listarEpocas(),
    obterMembroAtual(),
  ]);
  if (!resultado.sucesso) return <EstadoErro mensagem={resultado.erro} />;

  // Entry point do wizard «Nova Época» (§8.21): só para quem tem CLUBE_EPOCAS
  // (Administrador ou Treinador Individual). A própria página do wizard também
  // valida no servidor — este flag apenas evita mostrar um botão inútil.
  const podeUsarWizard = membro?.capacidades.includes("CLUBE_EPOCAS") ?? false;

  return <EpocasLista epocas={resultado.dados} podeUsarWizard={podeUsarWizard} />;
}
