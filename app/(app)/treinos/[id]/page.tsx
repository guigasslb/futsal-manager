import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, MapPin, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { obterSessao } from "@/lib/actions/treinos";
import { listarExercicios } from "@/lib/actions/exercicios";
import { listarAtletas } from "@/lib/actions/atletas";
import { obterEpocaAtiva } from "@/lib/epoca-context";
import { GestorExercicios } from "@/components/treinos/GestorExercicios";
import {
  MarcadorPresencas,
  type PresencaInicial,
} from "@/components/treinos/MarcadorPresencas";
import { RegistoRpeSessao } from "@/components/treinos/RegistoRpeSessao";

function formatarDataHora(data: Date): string {
  return new Date(data).toLocaleString("pt-PT", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const metadata: Metadata = { title: "Detalhe do treino" };

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

  const presencasIniciais: Record<string, PresencaInicial> = {};
  for (const p of s.presencas)
    presencasIniciais[p.atletaId] = { estado: p.estado, motivo: p.motivo };

  const foraDaEpoca =
    epoca && (new Date(s.data) < epoca.dataInicio || new Date(s.data) > epoca.dataFim);

  return (
    <div className="space-y-6">
      {/* Navegação */}
      <div className="flex items-center justify-between">
        <Breadcrumbs
          items={[
            { label: "Treinos", href: "/treinos" },
            { label: s.escalao.nome },
          ]}
        />
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

      {/* Duas colunas. Em mobile as presenças vêm primeiro (tarefa mais frequente
          no arranque do treino); em desktop mantém-se exercícios à esquerda. */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="order-2 lg:order-1">
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
        </div>

        <div className="order-1 lg:order-2">
          <MarcadorPresencas
            sessaoId={s.id}
            atletas={atletas.map((a) => ({
              id: a.id,
              nome: a.nome,
              // Número da participação neste escalão (F1).
              numero: a.participacaoContexto?.numero ?? s.numeroPorAtleta[a.id] ?? null,
            }))}
            presencasIniciais={presencasIniciais}
          />
        </div>
      </div>

      {/* P4.8 (§8.20): RPE da sessão — alimenta a análise de carga/ACWR do escalão. */}
      <RegistoRpeSessao sessaoId={s.id} rpeInicial={s.rpeSessao} />

      {s.notas && (
        <div className="rounded-lg border border-cinza-200 bg-white p-5 shadow-card">
          <p className="text-legenda font-medium uppercase tracking-wide text-cinza-500">Notas</p>
          <p className="mt-1 text-corpo text-cinza-900 whitespace-pre-wrap">{s.notas}</p>
        </div>
      )}
    </div>
  );
}
