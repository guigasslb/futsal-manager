import Link from "next/link";
import { Plus, Dumbbell, MapPin, Users, List, CalendarDays, CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listarSessoes } from "@/lib/actions/treinos";
import { listarEscaloes } from "@/lib/actions/escaloes";
import { EstadoErro, EstadoVazio } from "@/components/layout/EstadosUI";
import { CalendarioTreinos } from "@/components/treinos/CalendarioTreinos";

function formatarDataHora(data: Date): string {
  return new Date(data).toLocaleString("pt-PT", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const PRESENTES = new Set(["PRESENTE", "ATRASADO"]);

export default async function TreinosPage({
  searchParams,
}: {
  searchParams: Promise<{ escalaoId?: string; vista?: string; mes?: string }>;
}) {
  const { escalaoId, vista, mes } = await searchParams;
  const ehCalendario = vista === "calendario";

  const [resEscaloes, resSessoes] = await Promise.all([
    listarEscaloes(),
    listarSessoes(escalaoId),
  ]);

  if (!resEscaloes.sucesso) return <EstadoErro mensagem={resEscaloes.erro} />;
  if (!resSessoes.sucesso) return <EstadoErro mensagem={resSessoes.erro} />;

  const escaloes = resEscaloes.dados;
  const sessoes = resSessoes.dados;

  // Mês a mostrar no calendário (default: mês atual)
  const agora = new Date();
  let anoCal = agora.getFullYear();
  let mesCal = agora.getMonth();
  if (mes && /^\d{4}-\d{2}$/.test(mes)) {
    const [a, m] = mes.split("-").map(Number);
    anoCal = a;
    mesCal = m - 1;
  }
  const qsEscalao = escalaoId ? `escalaoId=${escalaoId}&` : "";
  const hrefLista = `/treinos?${qsEscalao}vista=lista`;
  const hrefCalendario = `/treinos?${qsEscalao}vista=calendario`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1>Treinos</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/treinos/periodizacao">
              <CalendarRange className="h-4 w-4" />
              Periodização
            </Link>
          </Button>
          <Button asChild>
            <Link href="/treinos/novo">
              <Plus className="h-4 w-4" />
              Nova sessão
            </Link>
          </Button>
        </div>
      </div>

      {escaloes.length > 0 && (
        <div className="-mb-px flex flex-wrap border-b border-cinza-200">
          <Link
            href="/treinos"
            className={`px-4 py-2.5 text-corpo font-medium border-b-2 transition-colors ${
              !escalaoId
                ? "border-primary text-primary"
                : "border-transparent text-cinza-600 hover:text-cinza-900"
            }`}
          >
            Todos
          </Link>
          {escaloes.map((e) => (
            <Link
              key={e.id}
              href={`/treinos?escalaoId=${e.id}`}
              className={`px-4 py-2.5 text-corpo font-medium border-b-2 transition-colors ${
                escalaoId === e.id
                  ? "border-primary text-primary"
                  : "border-transparent text-cinza-600 hover:text-cinza-900"
              }`}
            >
              {e.nome}
            </Link>
          ))}
        </div>
      )}

      {/* Toggle lista / calendário */}
      <div className="flex gap-1 rounded-md border border-cinza-200 p-1 w-fit">
        <Link
          href={hrefLista}
          className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-corpo-sec font-medium transition-colors ${
            !ehCalendario ? "bg-primary text-white" : "text-cinza-600 hover:bg-cinza-50"
          }`}
        >
          <List className="h-4 w-4" />
          Lista
        </Link>
        <Link
          href={hrefCalendario}
          className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-corpo-sec font-medium transition-colors ${
            ehCalendario ? "bg-primary text-white" : "text-cinza-600 hover:bg-cinza-50"
          }`}
        >
          <CalendarDays className="h-4 w-4" />
          Calendário
        </Link>
      </div>

      {sessoes.length === 0 ? (
        <EstadoVazio
          titulo="Sem sessões nesta época"
          descricao="Cria a primeira sessão de treino."
          acao={
            <Button asChild>
              <Link href="/treinos/novo">
                <Plus className="h-4 w-4" />
                Criar sessão
              </Link>
            </Button>
          }
        />
      ) : ehCalendario ? (
        <CalendarioTreinos
          sessoes={sessoes.map((s) => ({
            id: s.id,
            data: s.data,
            escalaoNome: s.escalao.nome,
          }))}
          ano={anoCal}
          mes={mesCal}
          hrefBase={hrefCalendario}
        />
      ) : (
        <ul className="space-y-3">
          {sessoes.map((s) => {
            const presentes = s.presencas.filter((p) => PRESENTES.has(p.estado)).length;
            return (
              <li key={s.id}>
                <Link
                  href={`/treinos/${s.id}`}
                  className="block rounded-lg border border-cinza-200 bg-white p-4 shadow-card transition-all hover:border-azul-300 hover:shadow-md"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-corpo font-semibold text-cinza-900 capitalize">
                      {formatarDataHora(s.data)}
                    </p>
                    <span className="rounded-full bg-primary/5 px-2.5 py-0.5 text-legenda text-primary">
                      {s.escalao.nome}
                    </span>
                  </div>
                  {s.objetivo && (
                    <p className="mt-1 text-corpo-sec text-cinza-600 line-clamp-1">{s.objetivo}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-4 text-legenda text-cinza-500">
                    <span className="flex items-center gap-1">
                      <Dumbbell className="h-3.5 w-3.5" />
                      {s._count.exercicios} exercício(s)
                    </span>
                    {s.presencas.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {presentes}/{s.presencas.length} presentes
                      </span>
                    )}
                    {s.local && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {s.local}
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
