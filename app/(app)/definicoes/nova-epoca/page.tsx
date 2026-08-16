import type { Metadata } from "next";
import { verificarElegibilidadeWizard } from "@/lib/actions/novaEpoca";
import { WizardNovaEpoca } from "@/components/definicoes/WizardNovaEpoca";
import { EstadoErro } from "@/components/layout/EstadosUI";

export const metadata: Metadata = { title: "Definições · Nova época" };

// Wizard «Nova Época» (secção 8.21). O gating de acesso é feito na Server Action
// `verificarElegibilidadeWizard` (exige a capacidade CLUBE_EPOCAS — Administrador
// ou Treinador Individual). Os treinadores adicionados por um DT (cenário D) não
// têm a capacidade, pelo que recebem a mensagem de erro em vez do wizard.
export default async function NovaEpocaPage() {
  const resultado = await verificarElegibilidadeWizard();
  if (!resultado.sucesso) return <EstadoErro mensagem={resultado.erro} />;

  return <WizardNovaEpoca elegibilidade={resultado.dados} />;
}
