import { listarEpocas } from "@/lib/actions/epocas";
import { EpocasLista } from "@/components/definicoes/EpocasLista";
import { EstadoErro } from "@/components/layout/EstadosUI";

export default async function EpocasPage() {
  const resultado = await listarEpocas();
  if (!resultado.sucesso) return <EstadoErro mensagem={resultado.erro} />;

  return <EpocasLista epocas={resultado.dados} />;
}
