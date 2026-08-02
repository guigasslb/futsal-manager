import { obterClubeAtivo } from "@/lib/permissoes";
import { BrandingForm } from "@/components/definicoes/BrandingForm";
import { EstadoErro } from "@/components/layout/EstadosUI";

export default async function ClubePage() {
  const clube = await obterClubeAtivo();
  if (!clube) return <EstadoErro mensagem="Sem clube ativo." />;

  return (
    <div className="space-y-6">
      <div>
        <h1>Clube</h1>
        <p className="mt-1 text-corpo-sec text-cinza-600">
          Identidade do clube: nome, cores e logótipo.
        </p>
      </div>
      <BrandingForm clube={clube} />
    </div>
  );
}
