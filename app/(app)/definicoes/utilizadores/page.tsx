import { listarUtilizadores } from "@/lib/actions/utilizadores";
import { UtilizadoresLista } from "@/components/definicoes/UtilizadoresLista";
import { EstadoErro } from "@/components/layout/EstadosUI";

export default async function UtilizadoresPage() {
  const resultado = await listarUtilizadores();
  if (!resultado.sucesso) return <EstadoErro mensagem={resultado.erro} />;

  return <UtilizadoresLista utilizadores={resultado.dados} />;
}
