import Link from "next/link";
import { Plus, Calendar, Trophy, Users, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { obterEpocaAtiva, obterClubeIdAtual } from "@/lib/epoca-context";
import { EstadoVazio } from "@/components/layout/EstadosUI";

function formatarDataHora(data: Date): string {
  return new Date(data).toLocaleString("pt-PT", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatarData(data: Date): string {
  return new Date(data).toLocaleDateString("pt-PT", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

export default async function DashboardPage() {
  const clubeId = await obterClubeIdAtual();
  const epoca = await obterEpocaAtiva();

  if (!clubeId || !epoca) {
    return (
      <div className="space-y-6">
        <h1>Início</h1>
        <EstadoVazio
          titulo="Nenhuma época ativa"
          descricao="Define uma época ativa em Definições → Épocas para começar."
          acao={
            <Button asChild>
              <Link href="/definicoes/epocas">Ir para Épocas</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const agora = new Date();

  const [proximaSessao, proximoJogo, nAtletas, nSessoes, nJogos] = await Promise.all([
    prisma.sessao.findFirst({
      where: { epocaId: epoca.id, escalao: { clubeId }, data: { gte: agora } },
      include: { escalao: { select: { nome: true } } },
      orderBy: { data: "asc" },
    }),
    prisma.jogo.findFirst({
      where: { epocaId: epoca.id, escalao: { clubeId }, data: { gte: agora } },
      include: { escalao: { select: { nome: true } } },
      orderBy: { data: "asc" },
    }),
    prisma.atleta.count({ where: { epocaId: epoca.id, ativo: true, escalao: { clubeId } } }),
    prisma.sessao.count({ where: { epocaId: epoca.id, escalao: { clubeId } } }),
    prisma.jogo.count({ where: { epocaId: epoca.id, escalao: { clubeId } } }),
  ]);

  const semEventos = !proximaSessao && !proximoJogo;

  return (
    <div className="space-y-8">
      <h1>Início</h1>

      {/* Próximos eventos */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-cinza-200 bg-white p-5 shadow-card">
          <p className="mb-2 flex items-center gap-1.5 text-legenda font-medium uppercase tracking-wide text-cinza-500">
            <Calendar className="h-4 w-4" />
            Próximo treino
          </p>
          {proximaSessao ? (
            <>
              <p className="text-corpo font-semibold text-cinza-900 capitalize">
                {formatarDataHora(proximaSessao.data)}
              </p>
              <p className="text-corpo-sec text-cinza-600">
                {proximaSessao.escalao.nome}
                {proximaSessao.local ? ` · ${proximaSessao.local}` : ""}
              </p>
              <div className="mt-3 flex gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link href={`/treinos/${proximaSessao.id}`}>Ver</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/treinos/${proximaSessao.id}`}>
                    <ClipboardCheck className="h-4 w-4" />
                    Presenças
                  </Link>
                </Button>
              </div>
            </>
          ) : (
            <p className="text-corpo-sec text-cinza-500">Sem treinos agendados.</p>
          )}
        </div>

        <div className="rounded-lg border border-cinza-200 bg-white p-5 shadow-card">
          <p className="mb-2 flex items-center gap-1.5 text-legenda font-medium uppercase tracking-wide text-cinza-500">
            <Trophy className="h-4 w-4" />
            Próximo jogo
          </p>
          {proximoJogo ? (
            <>
              <p className="text-corpo font-semibold text-cinza-900 capitalize">
                {formatarData(proximoJogo.data)}
              </p>
              <p className="text-corpo-sec text-cinza-600">
                vs {proximoJogo.adversario} ({proximoJogo.casaFora === "CASA" ? "Casa" : "Fora"})
              </p>
              <div className="mt-3 flex gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link href={`/jogos/${proximoJogo.id}`}>Ver</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/jogos/${proximoJogo.id}`}>
                    <Users className="h-4 w-4" />
                    Convocatória
                  </Link>
                </Button>
              </div>
            </>
          ) : (
            <p className="text-corpo-sec text-cinza-500">Sem jogos agendados.</p>
          )}
        </div>
      </div>

      {semEventos && (
        <p className="text-corpo-sec text-cinza-500">
          Ainda não há treinos ou jogos agendados nesta época.
        </p>
      )}

      {/* Ações rápidas */}
      <div className="space-y-3">
        <p className="text-legenda font-medium uppercase tracking-wide text-cinza-500">
          Ações rápidas
        </p>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/treinos/novo">
              <Plus className="h-4 w-4" />
              Nova sessão
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/jogos/novo">
              <Plus className="h-4 w-4" />
              Novo jogo
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/plantel/novo">
              <Plus className="h-4 w-4" />
              Novo atleta
            </Link>
          </Button>
        </div>
      </div>

      {/* Resumo */}
      <div className="space-y-3">
        <p className="text-legenda font-medium uppercase tracking-wide text-cinza-500">
          Resumo — {epoca.nome}
        </p>
        <p className="text-corpo text-cinza-900">
          {nAtletas} atletas · {nSessoes} sessões · {nJogos} jogos nesta época
        </p>
      </div>
    </div>
  );
}
