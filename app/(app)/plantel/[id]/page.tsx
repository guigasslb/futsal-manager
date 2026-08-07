import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { obterAtleta, obterEstatisticasAtleta } from "@/lib/actions/atletas";
import { obterCadernetaAtleta } from "@/lib/actions/caderneta";
import {
  obterEvolucaoAtleta,
  obterPresencasMensal,
  obterAnaliticoAtleta,
} from "@/lib/actions/analise";
import { listarParticipacoes } from "@/lib/actions/participacoes";
import { listarEscaloes } from "@/lib/actions/escaloes";
import { obterMembroAtual } from "@/lib/permissoes";
import { AvatarAtleta } from "@/components/plantel/AvatarAtleta";
import { EstatisticasAtleta } from "@/components/plantel/EstatisticasAtleta";
import { CadernetaAtleta } from "@/components/plantel/CadernetaAtleta";
import { ParticipacoesAtleta } from "@/components/plantel/ParticipacoesAtleta";
import { PainelAtleta } from "@/components/analiticos/PainelAtleta";
import { GerarRelatorioBotao } from "@/components/relatorios/GerarRelatorioBotao";
import { EstadoVazio } from "@/components/layout/EstadosUI";
import { LABEL_POSICAO } from "@/lib/schemas/atleta";

function calcularIdade(dataNascimento: Date): number {
  const hoje = new Date();
  const nasc = new Date(dataNascimento);
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return idade;
}

function formatarData(date: Date): string {
  return new Date(date).toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export const metadata: Metadata = { title: "Perfil do atleta" };

export default async function PerfilAtletaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const res = await obterAtleta(id);
  if (!res.sucesso) notFound();

  const a = res.dados;
  const eGR = a.posicoes.includes("GUARDA_REDES");

  const [
    resStats,
    resCaderneta,
    resEvolucao,
    resPresencas,
    resParticipacoes,
    resEscaloes,
    membro,
    resAnalitico,
  ] = await Promise.all([
    obterEstatisticasAtleta(id),
    obterCadernetaAtleta(id),
    obterEvolucaoAtleta(id),
    obterPresencasMensal(id),
    listarParticipacoes(id),
    listarEscaloes(),
    obterMembroAtual(),
    obterAnaliticoAtleta(id, a.participacaoContexto?.escalaoId),
  ]);

  // Gating de UI das ações de participação (secção 6.7). O servidor continua a
  // ser a autoridade — isto apenas evita oferecer ações que iriam falhar.
  const capacidades = new Set(membro?.capacidades ?? []);
  const podeGerirPlantel = capacidades.has("PLANTEL_GERIR");
  const podeTerminarParticipacao = capacidades.has("PROMOVER_ATLETAS");
  const podeVerRelatorios = capacidades.has("RELATORIOS_VER");
  const todosEscaloes = resEscaloes.sucesso
    ? resEscaloes.dados.map((e) => ({ id: e.id, nome: e.nome }))
    : [];
  // Âmbito PROPRIOS_ESCALOES limita as ações aos escalões atribuídos: associar
  // exige capacidade no destino e transferir exige-a na origem e no destino.
  const escaloesGeriveis =
    membro?.ambito === "TODO_CLUBE"
      ? todosEscaloes
      : todosEscaloes.filter((e) => membro?.escaloesAtribuidos.includes(e.id));

  const ctx = a.participacaoContexto;
  // Contexto das estatísticas: escalão da participação em contexto + número desse escalão.
  const erroParticipacoes = !resParticipacoes.sucesso
    ? resParticipacoes.erro
    : !resEscaloes.sucesso
      ? resEscaloes.erro
      : null;
  const contextoStats = [
    a.epocaNome,
    ctx?.escalaoNome,
    ctx?.numero != null ? `#${ctx.numero}` : null,
  ].filter((v): v is string => v != null);
  const metaPartes: string[] = [];
  if (a.posicoes.length) metaPartes.push(a.posicoes.map((p) => LABEL_POSICAO[p]).join(", "));
  if (ctx?.numero != null) metaPartes.push(`#${ctx.numero}`);
  for (const p of a.participacoes) {
    metaPartes.push(p.tipo === "PRINCIPAL" ? p.escalaoNome : `+ ${p.escalaoNome}`);
  }
  metaPartes.push(a.epocaNome);
  if (a.dataNascimento) metaPartes.push(`${calcularIdade(a.dataNascimento)} anos`);

  return (
    <div className="space-y-8">
      {/* Navegação */}
      <div className="flex items-center justify-between">
        <Breadcrumbs
          items={[{ label: "Plantel", href: "/plantel" }, { label: a.nome }]}
        />
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/plantel/${a.id}/relatorio`}>
              <FileText className="h-4 w-4" />
              Relatório
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/plantel/${a.id}/editar`}>
              <Pencil className="h-4 w-4" />
              Editar
            </Link>
          </Button>
        </div>
      </div>

      {/* Cabeçalho de identidade */}
      <div className="flex items-center gap-5">
        <AvatarAtleta nome={a.nome} tamanho="xl" fotoUrl={a.fotoUrl} />
        <div>
          <h1 className="leading-tight">{a.nome}</h1>
          <p className="mt-1 text-corpo-sec text-cinza-600">{metaPartes.join(" · ")}</p>
        </div>
      </div>

      {/* Abas */}
      <Tabs defaultValue="estatisticas">
        <TabsList>
          <TabsTrigger value="estatisticas">Estatísticas</TabsTrigger>
          <TabsTrigger value="analiticos">Analíticos</TabsTrigger>
          <TabsTrigger value="caderneta">Caderneta</TabsTrigger>
          <TabsTrigger value="participacoes">Participações</TabsTrigger>
          <TabsTrigger value="dados">Dados</TabsTrigger>
        </TabsList>

        <TabsContent value="estatisticas" className="space-y-3">
          <p className="text-corpo-sec text-cinza-500">
            Estatísticas de {contextoStats.join(" · ")}
          </p>
          {resStats.sucesso ? (
            <EstatisticasAtleta
              stats={resStats.dados}
              eGR={eGR}
              evolucao={resEvolucao.sucesso ? resEvolucao.dados : undefined}
              presencas={resPresencas.sucesso ? resPresencas.dados : undefined}
            />
          ) : (
            <p className="text-corpo-sec text-vermelho-600">{resStats.erro}</p>
          )}
        </TabsContent>

        <TabsContent value="analiticos" className="space-y-4">
          {resAnalitico.sucesso ? (
            <>
              {podeVerRelatorios && (
                <div className="flex justify-end print:hidden">
                  <GerarRelatorioBotao
                    tipo="EPOCA_ATLETA"
                    atletaId={a.id}
                    escalaoId={a.participacaoContexto?.escalaoId}
                  />
                </div>
              )}
              <PainelAtleta dados={resAnalitico.dados} />
            </>
          ) : resAnalitico.erro === "Sem permissão" ? (
            <EstadoVazio
              titulo="Sem acesso aos analíticos"
              descricao="Os analíticos e relatórios exigem a permissão «Ver relatórios». Pede ao administrador do clube para a atribuir."
            />
          ) : (
            <EstadoVazio titulo="Analíticos indisponíveis" descricao={resAnalitico.erro} />
          )}
        </TabsContent>

        <TabsContent value="caderneta">
          {resCaderneta.sucesso ? (
            <CadernetaAtleta atletaId={a.id} habilidades={resCaderneta.dados} />
          ) : (
            <p className="text-corpo-sec text-vermelho-600">{resCaderneta.erro}</p>
          )}
        </TabsContent>

        <TabsContent value="participacoes">
          {resParticipacoes.sucesso && resEscaloes.sucesso ? (
            <ParticipacoesAtleta
              atletaId={a.id}
              nomeAtleta={a.nome}
              epocaIdAtual={a.epocaId}
              participacoes={resParticipacoes.dados}
              escaloesGeriveis={escaloesGeriveis}
              podeGerir={podeGerirPlantel}
              podeTerminar={podeTerminarParticipacao}
            />
          ) : (
            <p className="text-corpo-sec text-vermelho-600">{erroParticipacoes}</p>
          )}
        </TabsContent>

        <TabsContent value="dados" className="space-y-4">
          {a.dataNascimento || a.observacoes ? (
            <div className="rounded-lg border border-cinza-200 bg-white p-5 shadow-card space-y-4">
              {a.dataNascimento && (
                <div>
                  <p className="text-legenda uppercase tracking-wide text-cinza-500">
                    Data de nascimento
                  </p>
                  <p className="text-corpo text-cinza-900">{formatarData(a.dataNascimento)}</p>
                </div>
              )}
              {a.observacoes && (
                <div>
                  <p className="text-legenda uppercase tracking-wide text-cinza-500">
                    Observações
                  </p>
                  <p className="text-corpo text-cinza-900 whitespace-pre-wrap">
                    {a.observacoes}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-corpo-sec text-cinza-500">Sem dados pessoais adicionais.</p>
          )}

          {(a.encarregadoNome || a.encarregadoContacto || a.encarregadoEmail) && (
            <div className="rounded-lg border border-cinza-200 bg-white p-5 shadow-card space-y-3">
              <p className="text-corpo font-semibold text-cinza-900">Encarregado de educação</p>
              {a.encarregadoNome && (
                <div>
                  <p className="text-legenda uppercase tracking-wide text-cinza-500">Nome</p>
                  <p className="text-corpo text-cinza-900">{a.encarregadoNome}</p>
                </div>
              )}
              <div className="flex flex-wrap gap-6">
                {a.encarregadoContacto && (
                  <div>
                    <p className="text-legenda uppercase tracking-wide text-cinza-500">Contacto</p>
                    <p className="text-corpo text-cinza-900">{a.encarregadoContacto}</p>
                  </div>
                )}
                {a.encarregadoEmail && (
                  <div>
                    <p className="text-legenda uppercase tracking-wide text-cinza-500">Email</p>
                    <p className="text-corpo text-cinza-900">{a.encarregadoEmail}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
