import type { Metadata } from "next";
import { verificarElegibilidadeWizard } from "@/lib/actions/novaEpoca";
import { obterSeccoes } from "@/lib/actions/seccoes";
import { listarEscaloes } from "@/lib/actions/escaloes";
import { WizardNovaEpoca } from "@/components/definicoes/WizardNovaEpoca";
import { EstadoErro } from "@/components/layout/EstadosUI";

export const metadata: Metadata = { title: "Definições · Nova época" };

// Wizard «Nova Época» (secção 8.21). O gating de acesso é feito na Server Action
// `verificarElegibilidadeWizard` (exige a capacidade CLUBE_EPOCAS — Administrador
// ou Treinador Individual). Os treinadores adicionados por um DT (cenário D) não
// têm a capacidade, pelo que recebem a mensagem de erro em vez do wizard.
export default async function NovaEpocaPage() {
  const [resultado, resSeccoes, resEscaloes] = await Promise.all([
    verificarElegibilidadeWizard(),
    obterSeccoes(),
    listarEscaloes(),
  ]);
  if (!resultado.sucesso) return <EstadoErro mensagem={resultado.erro} />;

  // §8.21 v7: dados de secção para o wizard agrupar os escalões por modalidade
  // (só têm efeito quando o clube tem >1 secção).
  const seccoes = resSeccoes.sucesso
    ? resSeccoes.dados.map((s) => ({ id: s.id, nome: s.nome, modalidade: s.modalidade }))
    : [];
  const seccaoPorEscalao: Record<string, string | null> = {};
  if (resEscaloes.sucesso) {
    for (const e of resEscaloes.dados) seccaoPorEscalao[e.id] = e.seccaoId ?? null;
  }

  return (
    <WizardNovaEpoca
      elegibilidade={resultado.dados}
      seccoes={seccoes}
      seccaoPorEscalao={seccaoPorEscalao}
    />
  );
}
