import Link from "next/link";
import {
  Plus,
  Calendar,
  Trophy,
  Users,
  ClipboardCheck,
  UserPlus,
  CalendarPlus,
  ChevronRight,
  Dumbbell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { obterEpocaAtiva, obterClubeIdAtual } from "@/lib/epoca-context";
import { obterClubeAtivo } from "@/lib/permissoes";
import { EstadoVazio } from "@/components/layout/EstadosUI";

function formatarDataHora(data: Date): string {
  return new Date(data).toLocaleString("pt-PT", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatarData(data: Date): string {
  return new Date(data).toLocaleDateString("pt-PT", {
    weekday: "long",
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

  const [clube, proximaSessao, proximoJogo, nAtletas, nSessoes, nJogos] = await Promise.all([
    obterClubeAtivo(),
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

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div>
        <h1>Início</h1>
        <p className="mt-1 text-corpo-sec text-cinza-500">
          {clube?.nome ?? "Clube"} · Época {epoca.nome}
        </p>
      </div>

      {/* Próximos eventos */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Próximo treino */}
        <div className="card-base p-5">
          <div className="mb-3 flex items-center gap-2.5">
            <span className="chip-clube flex h-9 w-9 items-center justify-center rounded-lg">
              <Calendar className="h-5 w-5" />
            </span>
            <p className="text-legenda font-semibold uppercase tracking-wide text-cinza-500">
              Próximo treino
            </p>
          </div>
          {proximaSessao ? (
            <>
              <p className="text-titulo-seccao font-semibold text-cinza-900 first-letter:uppercase">
                {formatarDataHora(proximaSessao.data)}
              </p>
              <p className="mt-0.5 text-corpo-sec text-cinza-600">
                {proximaSessao.escalao.nome}
                {proximaSessao.local ? ` · ${proximaSessao.local}` : ""}
              </p>
              <div className="mt-4 flex gap-2">
                <Button asChild size="sm">
                  <Link href={`/treinos/${proximaSessao.id}`}>Ver sessão</Link>
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
            <div className="flex flex-col items-start gap-3 py-2">
              <p className="text-corpo-sec text-cinza-500">Sem treinos agendados.</p>
              <Button asChild size="sm" variant="outline">
                <Link href="/treinos/novo">
                  <Plus className="h-4 w-4" />
                  Agendar treino
                </Link>
              </Button>
            </div>
          )}
        </div>

        {/* Próximo jogo */}
        <div className="card-base p-5">
          <div className="mb-3 flex items-center gap-2.5">
            <span className="chip-clube flex h-9 w-9 items-center justify-center rounded-lg">
              <Trophy className="h-5 w-5" />
            </span>
            <p className="text-legenda font-semibold uppercase tracking-wide text-cinza-500">
              Próximo jogo
            </p>
          </div>
          {proximoJogo ? (
            <>
              <p className="text-titulo-seccao font-semibold text-cinza-900 first-letter:uppercase">
                {formatarData(proximoJogo.data)}
              </p>
              <p className="mt-0.5 text-corpo-sec text-cinza-600">
                vs {proximoJogo.adversario} ({proximoJogo.casaFora === "CASA" ? "Casa" : "Fora"})
              </p>
              <div className="mt-4 flex gap-2">
                <Button asChild size="sm">
                  <Link href={`/jogos/${proximoJogo.id}`}>Ver jogo</Link>
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
            <div className="flex flex-col items-start gap-3 py-2">
              <p className="text-corpo-sec text-cinza-500">Sem jogos agendados.</p>
              <Button asChild size="sm" variant="outline">
                <Link href="/jogos/novo">
                  <Plus className="h-4 w-4" />
                  Registar jogo
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Ações rápidas */}
      <div className="space-y-3">
        <p className="text-legenda font-semibold uppercase tracking-wide text-cinza-500">
          Ações rápidas
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <AcaoRapida href="/treinos/novo" icon={CalendarPlus} titulo="Nova sessão" desc="Planear um treino" />
          <AcaoRapida href="/jogos/novo" icon={Trophy} titulo="Novo jogo" desc="Registar um jogo" />
          <AcaoRapida href="/plantel/novo" icon={UserPlus} titulo="Novo atleta" desc="Adicionar ao plantel" />
        </div>
      </div>

      {/* Resumo */}
      <div className="space-y-3">
        <p className="text-legenda font-semibold uppercase tracking-wide text-cinza-500">
          Resumo — {epoca.nome}
        </p>
        <div className="grid grid-cols-3 gap-3">
          <StatTile valor={nAtletas} label="atletas" icon={Users} />
          <StatTile valor={nSessoes} label="sessões" icon={Dumbbell} />
          <StatTile valor={nJogos} label="jogos" icon={Trophy} />
        </div>
      </div>
    </div>
  );
}

function AcaoRapida({
  href,
  icon: Icon,
  titulo,
  desc,
}: {
  href: string;
  icon: typeof Plus;
  titulo: string;
  desc: string;
}) {
  return (
    <Link href={href} className="card-base card-hover group flex items-center gap-3 p-4">
      <span className="chip-clube flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
        <Icon className="h-5 w-5" />
      </span>
      <div className="flex-1">
        <p className="text-corpo font-semibold text-cinza-900">{titulo}</p>
        <p className="text-legenda text-cinza-500">{desc}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-cinza-300 transition-transform group-hover:translate-x-0.5 group-hover:text-cinza-400" />
    </Link>
  );
}

function StatTile({
  valor,
  label,
  icon: Icon,
}: {
  valor: number;
  label: string;
  icon: typeof Plus;
}) {
  return (
    <div className="card-base flex flex-col gap-1 p-4">
      <Icon className="h-4 w-4 text-cinza-300" />
      <span className="text-[28px] font-bold leading-none text-cinza-900 tabular-nums">{valor}</span>
      <span className="text-legenda text-cinza-500">{label}</span>
    </div>
  );
}
