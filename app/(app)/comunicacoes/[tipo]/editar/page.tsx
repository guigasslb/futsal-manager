import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { EstadoErro } from "@/components/layout/EstadosUI";
import { EditorModelo } from "@/components/comunicacoes/EditorModelo";
import { InstalarModelosButton } from "@/components/comunicacoes/InstalarModelosButton";
import { listarModelosComunicacao } from "@/lib/actions/comunicacao";
import { obterMembroAtual } from "@/lib/permissoes";
import { placeholdersDoTemplate } from "@/lib/comunicacao-utils";
import { MODELOS_COMUNICACAO_SEED } from "@/lib/comunicacao-modelos";
import {
  LABEL_TIPO_COMUNICACAO,
  TIPOS_COMUNICACAO,
  type TipoComunicacaoValor,
} from "@/lib/schemas/comunicacao";

/** Aceita o tipo em minúsculas na URL (`/comunicacoes/convocatoria/editar`). */
function tipoValido(valor: string): TipoComunicacaoValor | undefined {
  const alvo = valor.toUpperCase();
  return TIPOS_COMUNICACAO.find((t) => t === alvo);
}

export const metadata: Metadata = { title: "Editar modelo de comunicação" };

export default async function EditarModeloComunicacaoPage({
  params,
}: {
  params: Promise<{ tipo: string }>;
}) {
  const { tipo: tipoParam } = await params;
  const tipo = tipoValido(tipoParam);
  if (!tipo) notFound();

  const membro = await obterMembroAtual();
  if (!membro?.capacidades.includes("COMUNICACOES_GERIR")) {
    return <EstadoErro mensagem="Não tens permissão para gerir comunicações." />;
  }

  const res = await listarModelosComunicacao();
  if (!res.sucesso) return <EstadoErro mensagem={res.erro} />;

  const doClube = res.dados.find((m) => m.tipo === tipo && m.clubeId !== null);
  const global = res.dados.find((m) => m.tipo === tipo && m.clubeId === null);
  const seed = MODELOS_COMUNICACAO_SEED.find((m) => m.tipo === tipo);

  // Campos sugeridos: os do template atual + os do modelo de arranque, para que
  // um campo removido do texto continue a poder ser reinserido.
  const placeholdersDisponiveis = [
    ...new Set([
      ...placeholdersDoTemplate(doClube?.template ?? ""),
      ...placeholdersDoTemplate(global?.template ?? seed?.template ?? ""),
    ]),
  ];

  const cabecalho = (
    <>
      <Link
        href="/comunicacoes"
        className="flex w-fit items-center gap-1 text-corpo-sec text-cinza-600 hover:text-cinza-900 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Comunicações
      </Link>
      <div>
        <h1>{LABEL_TIPO_COMUNICACAO[tipo]}</h1>
        <p className="mt-1 text-corpo-sec text-cinza-600">
          Template usado para gerar as mensagens deste tipo.
        </p>
      </div>
    </>
  );

  // Sem cópia do clube: o modelo global é apenas de leitura (§3.9).
  if (!doClube) {
    const template = global?.template ?? seed?.template ?? "";
    return (
      <div className="space-y-6">
        {cabecalho}
        <div className="rounded-md border border-ambar-500/30 bg-ambar-500/10 px-4 py-3 text-corpo text-cinza-900">
          Este é o template global da plataforma e não pode ser alterado. Instala a
          cópia do clube para o personalizares.
        </div>
        <pre className="whitespace-pre-wrap break-words rounded-md border border-cinza-200 bg-white p-4 font-sans text-corpo text-cinza-900 shadow-card">
          {template}
        </pre>
        <InstalarModelosButton rotulo="Instalar templates base" variant="default" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {cabecalho}
      <EditorModelo
        modelo={{ id: doClube.id, nome: doClube.nome, template: doClube.template }}
        placeholdersDisponiveis={placeholdersDisponiveis}
      />
    </div>
  );
}
