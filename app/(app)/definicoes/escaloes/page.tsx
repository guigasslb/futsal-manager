import { listarEscaloes } from "@/lib/actions/escaloes";
import { EscaloesLista } from "@/components/definicoes/EscaloesLista";
import { EstadoErro } from "@/components/layout/EstadosUI";

export default async function EscaloesPage() {
  const resultado = await listarEscaloes();
  if (!resultado.sucesso) return <EstadoErro mensagem={resultado.erro} />;

  return <EscaloesLista escaloes={resultado.dados} />;
}
