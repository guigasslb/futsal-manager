import { listarMembros } from "@/lib/actions/utilizadores";
import { listarPerfis } from "@/lib/actions/perfis";
import { listarEscaloes } from "@/lib/actions/escaloes";
import { UtilizadoresLista } from "@/components/definicoes/UtilizadoresLista";
import { EstadoErro } from "@/components/layout/EstadosUI";

export default async function MembrosPage() {
  const [resMembros, resPerfis, resEscaloes] = await Promise.all([
    listarMembros(),
    listarPerfis(),
    listarEscaloes(),
  ]);
  if (!resMembros.sucesso) return <EstadoErro mensagem={resMembros.erro} />;

  const perfis = resPerfis.sucesso ? resPerfis.dados.map((p) => ({ id: p.id, nome: p.nome })) : [];
  const escaloes = resEscaloes.sucesso
    ? resEscaloes.dados.map((e) => ({ id: e.id, nome: e.nome }))
    : [];

  return <UtilizadoresLista membros={resMembros.dados} perfis={perfis} escaloes={escaloes} />;
}
