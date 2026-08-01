import { listarReunioes } from "@/lib/actions/reunioes";
import { listarEscaloes } from "@/lib/actions/escaloes";
import { ReunioesLista } from "@/components/reunioes/ReunioesLista";
import { EstadoErro } from "@/components/layout/EstadosUI";

export default async function ReunioesPage() {
  const [resReunioes, resEsc] = await Promise.all([listarReunioes(), listarEscaloes()]);
  if (!resReunioes.sucesso) return <EstadoErro mensagem={resReunioes.erro} />;
  const escaloes = resEsc.sucesso ? resEsc.dados.map((e) => ({ id: e.id, nome: e.nome })) : [];

  return <ReunioesLista reunioes={resReunioes.dados} escaloes={escaloes} />;
}
