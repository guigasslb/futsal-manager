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
  MapPin,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { obterEpocaAtiva, obterClubeIdAtual } from "@/lib/epoca-context";
import { obterClubeAtivo, obterMembroAtual } from "@/lib/permissoes";
import { EstadoVazio } from "@/components/layout/EstadosUI";

function dataLonga(data: Date): string {
  return new Date(data).toLocaleString("pt-PT", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function dataCurta(data: Date): string {
  return new Date(data).toLocaleDateString("pt-PT", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

function diasAte(data: Date): string {
  const ms = new Date(data).getTime() - Date.now();
  const dias = Math.ceil(ms / 86_400_000);
  if (dias <= 0) return "hoje";
  if (dias === 1) return "amanhã";
  return `faltam ${dias} dias`;
}

/** Motivo subtil de campo de futsal para o cartão-herói. */
function MotivoCampo() {
  return (
    <svg
      viewBox="0 0 400 200"
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.13]"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <g fill="none" stroke="#fff" strokeWidth="2">
        <rect x="8" y="8" width="384" height="184" rx="6" />
        <line x1="200" y1="8" x2="200" y2="192" />
        <circle cx="200" cy="100" r="34" />
        <circle cx="200" cy="100" r="3" fill="#fff" />
        <path d="M8 62 A60 60 0 0 1 8 138" />
        <path d="M392 62 A60 60 0 0 0 392 138" />
      </g>
    </svg>
  );
}

export default async function DashboardPage() {
  const session = await auth();
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

  // Qual evento é o mais próximo → vai para o herói; o outro fica como secundário.
  const sessaoT = proximaSessao ? new Date(proximaSessao.data).getTime() : Infinity;
  const jogoT = proximoJogo ? new Date(proximoJogo.data).getTime() : Infinity;
  const heroiEhJogo = jogoT < sessaoT;

  // Identidade: nome + papel (perfil) / clube · escalões · época.
  const membro = await obterMembroAtual();
  const perfilNome = membro?.perfil.nome ?? "Treinador";
  const escaloesAtribuidos = membro?.escaloesAtribuidos ?? [];
  const escaloesNomes = escaloesAtribuidos.length
    ? (
        await prisma.escalao.findMany({
          where: { id: { in: escaloesAtribuidos } },
          select: { nome: true },
          orderBy: { ordem: "asc" },
        })
      ).map((e) => e.nome)
    : [];

  return (
    <div className="space-y-8">
      {/* Identidade (compacto — pensado para tablet) */}
      <div>
        <p className="font-display text-[18px] font-bold leading-tight tracking-[-0.01em] text-cinza-900">
          {session?.user?.name ?? "Treinador"}{" "}
          <span className="font-medium text-cinza-500">· {perfilNome}</span>
        </p>
        <p className="mt-0.5 text-corpo-sec text-cinza-500">
          <span className="font-semibold text-cinza-900">{clube?.nome ?? "Clube"}</span>
          {escaloesNomes.length > 0 && ` · ${escaloesNomes.join(" · ")}`}
          {` · Época ${epoca.nome}`}
        </p>
      </div>

      {/* Herói + secundário */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Cartão-herói: próximo evento mais próximo */}
        <div className="lg:col-span-2">
          {heroiEhJogo && proximoJogo ? (
            <div className="hero-card court-motif p-6 sm:p-7">
              <MotivoCampo />
              <div className="relative">
                <div className="flex items-center gap-2 text-corpo-sec font-semibold uppercase tracking-wide text-white/80">
                  <Trophy className="h-4 w-4" /> Próximo jogo · {diasAte(proximoJogo.data)}
                </div>
                <p className="mt-3 text-[26px] font-bold leading-tight">
                  vs {proximoJogo.adversario}
                </p>
                <p className="mt-1 text-corpo text-white/85">
                  {dataLonga(proximoJogo.data)} · {proximoJogo.escalao.nome} ·{" "}
                  {proximoJogo.casaFora === "CASA" ? "Casa" : "Fora"}
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  <Link href={`/jogos/${proximoJogo.id}`} className="hero-btn-solid">
                    <Users className="h-4 w-4" /> Convocatória
                  </Link>
                  <Link href={`/jogos/${proximoJogo.id}`} className="hero-btn">
                    Ver jogo <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          ) : proximaSessao ? (
            <div className="hero-card court-motif p-6 sm:p-7">
              <MotivoCampo />
              <div className="relative">
                <div className="flex items-center gap-2 text-corpo-sec font-semibold uppercase tracking-wide text-white/80">
                  <Calendar className="h-4 w-4" /> Próximo treino · {diasAte(proximaSessao.data)}
                </div>
                <p className="mt-3 text-[26px] font-bold capitalize leading-tight">
                  {dataLonga(proximaSessao.data)}
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-corpo text-white/85">
                  <span>{proximaSessao.escalao.nome}</span>
                  {proximaSessao.local && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {proximaSessao.local}
                    </span>
                  )}
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  <Link href={`/treinos/${proximaSessao.id}`} className="hero-btn-solid">
                    <ClipboardCheck className="h-4 w-4" /> Marcar presenças
                  </Link>
                  <Link href={`/treinos/${proximaSessao.id}`} className="hero-btn">
                    Ver sessão <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            /* Sem eventos futuros */
            <div className="hero-card court-motif p-6 sm:p-7">
              <MotivoCampo />
              <div className="relative">
                <p className="text-corpo-sec font-semibold uppercase tracking-wide text-white/80">
                  Agenda
                </p>
                <p className="mt-3 text-[22px] font-bold leading-tight">
                  Sem treinos ou jogos agendados
                </p>
                <p className="mt-1 text-corpo text-white/85">
                  Planeia o próximo passo da época.
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  <Link href="/treinos/novo" className="hero-btn-solid">
                    <Plus className="h-4 w-4" /> Agendar treino
                  </Link>
                  <Link href="/jogos/novo" className="hero-btn">
                    Registar jogo <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Coluna secundária: o outro evento */}
        <div className="space-y-4">
          {heroiEhJogo ? (
            <EventoSecundario
              tipo="treino"
              titulo={proximaSessao ? dataCurta(proximaSessao.data) : null}
              sub={proximaSessao ? proximaSessao.escalao.nome : null}
              href={proximaSessao ? `/treinos/${proximaSessao.id}` : "/treinos/novo"}
              vazio="Sem treinos agendados"
            />
          ) : (
            <EventoSecundario
              tipo="jogo"
              titulo={proximoJogo ? `vs ${proximoJogo.adversario}` : null}
              sub={proximoJogo ? dataCurta(proximoJogo.data) : null}
              href={proximoJogo ? `/jogos/${proximoJogo.id}` : "/jogos/novo"}
              vazio="Sem jogos agendados"
            />
          )}

          {/* Mini-resumo */}
          <div className="card-base p-4">
            <p className="text-legenda font-semibold uppercase tracking-wide text-cinza-400">
              Época {epoca.nome}
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <MiniStat valor={nAtletas} label="atletas" />
              <MiniStat valor={nSessoes} label="sessões" />
              <MiniStat valor={nJogos} label="jogos" />
            </div>
          </div>
        </div>
      </div>

      {/* Ações rápidas */}
      <div className="space-y-3">
        <p className="text-legenda font-semibold uppercase tracking-wide text-cinza-400">
          Ações rápidas
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <AcaoRapida href="/treinos/novo" icon={CalendarPlus} titulo="Nova sessão" desc="Planear um treino" />
          <AcaoRapida href="/jogos/novo" icon={Trophy} titulo="Novo jogo" desc="Registar um jogo" />
          <AcaoRapida href="/plantel/novo" icon={UserPlus} titulo="Novo atleta" desc="Adicionar ao plantel" />
        </div>
      </div>
    </div>
  );
}

function EventoSecundario({
  tipo,
  titulo,
  sub,
  href,
  vazio,
}: {
  tipo: "treino" | "jogo";
  titulo: string | null;
  sub: string | null;
  href: string;
  vazio: string;
}) {
  const Icon = tipo === "jogo" ? Trophy : Calendar;
  const label = tipo === "jogo" ? "Próximo jogo" : "Próximo treino";
  return (
    <Link href={href} className="card-base card-hover group block p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="chip-clube flex h-8 w-8 items-center justify-center rounded-lg">
          <Icon className="h-4 w-4" />
        </span>
        <p className="text-legenda font-semibold uppercase tracking-wide text-cinza-400">{label}</p>
        <ChevronRight className="ml-auto h-4 w-4 text-cinza-300 transition-transform group-hover:translate-x-0.5" />
      </div>
      {titulo ? (
        <>
          <p className="text-corpo font-semibold capitalize text-cinza-900">{titulo}</p>
          {sub && <p className="text-legenda text-cinza-500">{sub}</p>}
        </>
      ) : (
        <p className="text-corpo-sec text-cinza-500">{vazio}</p>
      )}
    </Link>
  );
}

function MiniStat({ valor, label }: { valor: number; label: string }) {
  return (
    <div>
      <p className="text-[22px] font-bold leading-none tabular-nums text-cinza-900">{valor}</p>
      <p className="mt-1 text-legenda text-cinza-500">{label}</p>
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
      <span className="chip-clube flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl">
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
