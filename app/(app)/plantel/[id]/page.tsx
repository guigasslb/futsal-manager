import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Pencil, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { obterAtleta, obterEstatisticasAtleta } from "@/lib/actions/atletas";
import { obterCadernetaAtleta } from "@/lib/actions/caderneta";
import { AvatarAtleta } from "@/components/plantel/AvatarAtleta";
import { EstatisticasAtleta } from "@/components/plantel/EstatisticasAtleta";
import { CadernetaAtleta } from "@/components/plantel/CadernetaAtleta";
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

export default async function PerfilAtletaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const res = await obterAtleta(id);
  if (!res.sucesso) notFound();

  const a = res.dados;
  const eGR = a.posicao === "GUARDA_REDES";

  const [resStats, resCaderneta] = await Promise.all([
    obterEstatisticasAtleta(id),
    obterCadernetaAtleta(id),
  ]);

  const metaPartes: string[] = [];
  if (a.posicao) metaPartes.push(LABEL_POSICAO[a.posicao]);
  if (a.numero != null) metaPartes.push(`#${a.numero}`);
  metaPartes.push(a.escalao.nome);
  metaPartes.push(a.epoca.nome);
  if (a.dataNascimento) metaPartes.push(`${calcularIdade(a.dataNascimento)} anos`);

  return (
    <div className="space-y-8">
      {/* Navegação */}
      <div className="flex items-center justify-between">
        <Link
          href="/plantel"
          className="flex items-center gap-1 text-corpo-sec text-cinza-600 hover:text-cinza-900 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Plantel
        </Link>
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
        <AvatarAtleta nome={a.nome} tamanho="xl" />
        <div>
          <h1 className="leading-tight">{a.nome}</h1>
          <p className="mt-1 text-corpo-sec text-cinza-600">{metaPartes.join(" · ")}</p>
        </div>
      </div>

      {/* Abas */}
      <Tabs defaultValue="estatisticas">
        <TabsList>
          <TabsTrigger value="estatisticas">Estatísticas</TabsTrigger>
          <TabsTrigger value="caderneta">Caderneta</TabsTrigger>
          <TabsTrigger value="dados">Dados</TabsTrigger>
        </TabsList>

        <TabsContent value="estatisticas" className="space-y-3">
          <p className="text-corpo-sec text-cinza-500">Estatísticas de {a.epoca.nome}</p>
          {resStats.sucesso ? (
            <EstatisticasAtleta stats={resStats.dados} eGR={eGR} />
          ) : (
            <p className="text-corpo-sec text-vermelho-600">{resStats.erro}</p>
          )}
        </TabsContent>

        <TabsContent value="caderneta">
          {resCaderneta.sucesso ? (
            <CadernetaAtleta atletaId={a.id} habilidades={resCaderneta.dados} />
          ) : (
            <p className="text-corpo-sec text-vermelho-600">{resCaderneta.erro}</p>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
