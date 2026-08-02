import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Pencil, MapPin, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { obterSessao } from "@/lib/actions/treinos";
import { listarExercicios } from "@/lib/actions/exercicios";
import { listarAtletas } from "@/lib/actions/atletas";
import { obterEpocaAtiva } from "@/lib/epoca-context";
import { GestorExercicios } from "@/components/treinos/GestorExercicios";
import { MarcadorPresencas } from "@/components/treinos/MarcadorPresencas";
import type { EstadoPresenca } from "@prisma/client";

function formatarDataHora(data: Date): string {
  return new Date(data).toLocaleString("pt-PT", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function DetalheSessaoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const res = await obterSessao(id);
  if (!res.sucesso) notFound();

  const s = res.dados;

  const [resExercicios, resAtletas, epoca] = await Promise.all([
    listarExercicios(),
    listarAtletas(s.escalaoId),
    obterEpocaAtiva(),
  ]);

  const biblioteca = resExercicios.sucesso ? resExercicios.dados : [];
  const atletas = resAtletas.sucesso ? resAtletas.dados : [];

  const presencasIniciais: Record<string, EstadoPresenca> = {};
  for (const p of s.presencas) presencasIniciais[p.atletaId] = p.estado;

  const foraDaEpoca =
    epoca && (new Date(s.data) < epoca.dataInicio || new Date(s.data) > epoca.dataFim);

  return (
    <div className="space-y-6">
      {/* Navegação */}
      <div className="flex items-center justify-between">
        <Link
          href="/treinos"
          className="flex items-center gap-1 text-corpo-sec text-cinza-600 hover:text-cinza-900 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Treinos
        </Link>
        <Button asChild variant="outline">
          <Link href={`/treinos/${s.id}/editar`}>
            <Pencil className="h-4 w-4" />
            Editar
          </Link>
        </Button>
      </div>

      {/* Cabeçalho */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="capitalize">{formatarDataHora(s.data)}</h1>
          <span className="rounded-full bg-primary/5 px-2.5 py-0.5 text-legenda text-primary">
            {s.escalao.nome}
          </span>
        </div>
        <div className="flex flex-wrap gap-4 text-corpo-sec text-cinza-600">
          {s.duracaoMin && (
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {s.duracaoMin} min
            </span>
          )}
          {s.local && (
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {s.local}
            </span>
          )}
        </div>
        {s.objetivo && <p className="text-corpo text-cinza-900">Objetivo: {s.objetivo}</p>}
        {foraDaEpoca && (
          <p className="flex items-center gap-1.5 text-legenda text-ambar-600">
            <AlertTriangle className="h-4 w-4" />
            A data está fora do intervalo da época ativa.
          </p>
        )}
      </div>

      {/* Duas colunas */}
      <div className="grid gap-6 lg:grid-cols-2">
        <GestorExercicios
          sessaoId={s.id}
          exercicios={s.exercicios.map((se) => ({
            id: se.id,
            ordem: se.ordem,
            duracaoMin: se.duracaoMin,
            exercicio: {
              id: se.exercicio.id,
              nome: se.exercicio.nome,
              categoriaPrincipal: se.exercicio.categoriaPrincipal,
            },
          }))}
          biblioteca={biblioteca.map((b) => ({
            id: b.id,
            nome: b.nome,
            categoriaPrincipal: b.categoriaPrincipal,
            duracaoMin: b.duracaoMin,
          }))}
        />

        <MarcadorPresencas
          sessaoId={s.id}
          atletas={atletas.map((a) => ({ id: a.id, nome: a.nome, numero: a.numero }))}
          presencasIniciais={presencasIniciais}
        />
      </div>

      {s.notas && (
        <div className="rounded-lg border border-cinza-200 bg-white p-5 shadow-card">
          <p className="text-legenda font-medium uppercase tracking-wide text-cinza-500">Notas</p>
          <p className="mt-1 text-corpo text-cinza-900 whitespace-pre-wrap">{s.notas}</p>
        </div>
      )}
    </div>
  );
}
