import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { obterClubeAtivo } from "@/lib/permissoes";
import { obterEpocaAtiva } from "@/lib/epoca-context";
import { listarEscaloes } from "@/lib/actions/escaloes";
import { listarEpocas } from "@/lib/actions/epocas";
import { EstadoErro } from "@/components/layout/EstadosUI";
import { WizardOnboarding } from "@/components/onboarding/WizardOnboarding";

export const metadata: Metadata = { title: "Bem-vindo" };

/**
 * Wizard de setup do clube (§8.1) — mostrado pós-primeiro-login para clubes
 * reais. Cada passo (identidade, escalões, época) é saltável. A conclusão é
 * persistida em `Clube.onboardingConcluido` (partilhada entre dispositivos):
 * uma vez concluído, a página redireciona para o dashboard.
 */
export default async function OnboardingPage() {
  const clube = await obterClubeAtivo();
  if (!clube) return <EstadoErro mensagem="Sem clube ativo." />;

  // Setup já concluído neste clube → não voltar a mostrar o wizard.
  if (clube.onboardingConcluido) redirect("/dashboard");

  const [resEscaloes, resEpocas, epocaAtiva] = await Promise.all([
    listarEscaloes(),
    listarEpocas(),
    obterEpocaAtiva(),
  ]);

  return (
    <WizardOnboarding
      clube={clube}
      escaloesIniciais={resEscaloes.sucesso ? resEscaloes.dados : []}
      epocasIniciais={resEpocas.sucesso ? resEpocas.dados : []}
      epocaAtivaId={epocaAtiva?.id ?? null}
    />
  );
}
