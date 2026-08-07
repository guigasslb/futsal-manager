"use client";

// Gerador de mensagens para o WhatsApp (bíblia §3.9, §8.12).
//
// Fluxo: escolher o tipo → preencher/rever o contexto (pré-preenchido a partir
// de um jogo, quando aplicável) → pré-visualizar → gerar o texto final no
// servidor → copiar ou partilhar no WhatsApp.
//
// A pré-visualização é feita no cliente com `substituirPlaceholders`
// (módulo puro); o texto final vem sempre do servidor, que é quem resolve o
// modelo do clube com fallback para o global.

import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AccoesTexto, TextoGerado } from "@/components/comunicacoes/AccoesTexto";
import {
  gerarCalendarioTexto,
  gerarTextoComunicacao,
  obterContextoConvocatoria,
  obterContextoResultado,
} from "@/lib/actions/comunicacao";
import {
  LABEL_TIPO_COMUNICACAO,
  TIPOS_COMUNICACAO,
  type TipoComunicacaoValor,
} from "@/lib/schemas/comunicacao";
import {
  placeholdersDoTemplate,
  substituirPlaceholders,
} from "@/lib/comunicacao-utils";
import {
  DICA_PLACEHOLDER,
  MESES_PT,
  placeholderMultilinha,
  rotuloPlaceholder,
  tipoUsaCalendario,
  tipoUsaJogo,
} from "@/lib/comunicacao-cliente";

export type ModeloCliente = {
  id: string;
  tipo: TipoComunicacaoValor;
  nome: string;
  template: string;
  doClube: boolean;
};

export type JogoOpcao = {
  id: string;
  rotulo: string;
};

/** Modelo em vigor para um tipo: variante do clube → fallback global (igual ao servidor). */
function modeloDoTipo(
  modelos: readonly ModeloCliente[],
  tipo: TipoComunicacaoValor,
): ModeloCliente | undefined {
  return (
    modelos.find((m) => m.tipo === tipo && m.doClube) ??
    modelos.find((m) => m.tipo === tipo)
  );
}

/** Valores conhecidos à partida (clube/treinador), limitados aos campos do template. */
function contextoInicial(
  template: string,
  base: Readonly<Record<string, string>>,
): Record<string, string> {
  const ctx: Record<string, string> = {};
  for (const chave of placeholdersDoTemplate(template)) {
    const valor = base[chave];
    if (valor !== undefined) ctx[chave] = valor;
  }
  return ctx;
}

export function GeradorComunicacao({
  modelos,
  jogos,
  valoresBase,
  tipoInicial = "CONVOCATORIA",
  jogoInicial = "",
}: {
  modelos: ModeloCliente[];
  jogos: JogoOpcao[];
  valoresBase: Record<string, string>;
  tipoInicial?: TipoComunicacaoValor;
  jogoInicial?: string;
}) {
  const [tipo, setTipo] = useState<TipoComunicacaoValor>(tipoInicial);
  const [jogoId, setJogoId] = useState(jogoInicial);
  const [contexto, setContexto] = useState<Record<string, string>>(() =>
    contextoInicial(modeloDoTipo(modelos, tipoInicial)?.template ?? "", valoresBase),
  );

  const agora = useMemo(() => new Date(), []);
  const [mes, setMes] = useState(agora.getMonth() + 1);
  const [ano, setAno] = useState(agora.getFullYear());

  const [textoFinal, setTextoFinal] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [aCarregarJogo, setACarregarJogo] = useState(false);
  const [pending, startTransition] = useTransition();

  const modelo = modeloDoTipo(modelos, tipo);
  const template = modelo?.template ?? "";
  const placeholders = useMemo(() => placeholdersDoTemplate(template), [template]);
  const preVisualizacao = useMemo(
    () => substituirPlaceholders(template, contexto),
    [template, contexto],
  );

  // Contexto a partir do jogo escolhido (convocatória / resultado).
  useEffect(() => {
    if (!tipoUsaJogo(tipo) || jogoId === "") return;

    let cancelado = false;
    setACarregarJogo(true);
    void (async () => {
      try {
        const dados =
          tipo === "CONVOCATORIA"
            ? await obterContextoConvocatoria(jogoId)
            : await obterContextoResultado(jogoId);
        if (cancelado) return;
        setContexto(dados);
        setTextoFinal(null);
        setErro(null);
      } catch {
        if (!cancelado) {
          toast.error("Não foi possível carregar os dados do jogo");
        }
      } finally {
        if (!cancelado) setACarregarJogo(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [tipo, jogoId]);

  function alterarTipo(valor: string) {
    const novo = valor as TipoComunicacaoValor;
    setTipo(novo);
    setJogoId("");
    setTextoFinal(null);
    setErro(null);
    setContexto(contextoInicial(modeloDoTipo(modelos, novo)?.template ?? "", valoresBase));
  }

  function alterarCampo(chave: string, valor: string) {
    setContexto((atual) => ({ ...atual, [chave]: valor }));
    setTextoFinal(null);
  }

  function submeter(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);
    startTransition(async () => {
      const res = tipoUsaCalendario(tipo)
        ? await gerarCalendarioTexto(mes, ano)
        : await gerarTextoComunicacao({ tipo, contexto, modeloId: modelo?.id });
      if (res.sucesso) {
        setTextoFinal(res.dados);
      } else {
        setTextoFinal(null);
        setErro(res.erro);
        toast.error(res.erro);
      }
    });
  }

  if (!modelo) {
    return (
      <p className="rounded-md border border-dashed border-cinza-300 p-6 text-center text-corpo-sec text-cinza-500">
        Ainda não há modelos de comunicação disponíveis. Instala os modelos base em
        Comunicações.
      </p>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={submeter} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="tipo">Tipo de comunicação *</Label>
          <Select value={tipo} onValueChange={alterarTipo}>
            <SelectTrigger id="tipo">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIPOS_COMUNICACAO.map((t) => (
                <SelectItem key={t} value={t}>
                  {LABEL_TIPO_COMUNICACAO[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-legenda text-cinza-500">
            Modelo em uso: {modelo.nome} ({modelo.doClube ? "do clube" : "global"})
          </p>
        </div>

        {/* Contexto a partir de um jogo */}
        {tipoUsaJogo(tipo) && (
          <div className="space-y-1.5">
            <Label htmlFor="jogo">Jogo</Label>
            {jogos.length === 0 ? (
              <p className="text-corpo-sec text-cinza-500">
                Não há jogos nesta época para pré-preencher a mensagem. Podes preencher
                os campos manualmente.
              </p>
            ) : (
              <Select value={jogoId} onValueChange={setJogoId}>
                <SelectTrigger id="jogo">
                  <SelectValue placeholder="Escolher jogo…" />
                </SelectTrigger>
                <SelectContent>
                  {jogos.map((j) => (
                    <SelectItem key={j.id} value={j.id}>
                      {j.rotulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {aCarregarJogo && (
              <p className="flex items-center gap-1.5 text-legenda text-cinza-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />A carregar dados do jogo…
              </p>
            )}
          </div>
        )}

        {/* Calendário mensal: gerado no servidor a partir de treinos e jogos do mês */}
        {tipoUsaCalendario(tipo) ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="mes">Mês *</Label>
              <Select value={String(mes)} onValueChange={(v) => setMes(Number(v))}>
                <SelectTrigger id="mes">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MESES_PT.map((nome, i) => (
                    <SelectItem key={nome} value={String(i + 1)}>
                      {nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ano">Ano *</Label>
              <Input
                id="ano"
                type="number"
                min={2000}
                max={2100}
                value={ano}
                onChange={(e) => setAno(Number(e.target.value))}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {placeholders.length === 0 ? (
              <p className="text-corpo-sec text-cinza-500">
                Este modelo não tem campos a preencher.
              </p>
            ) : (
              placeholders.map((chave) => (
                <div key={chave} className="space-y-1.5">
                  <Label htmlFor={`campo-${chave}`}>{rotuloPlaceholder(chave)}</Label>
                  {placeholderMultilinha(chave) ? (
                    <Textarea
                      id={`campo-${chave}`}
                      rows={4}
                      maxLength={5000}
                      value={contexto[chave] ?? ""}
                      placeholder={DICA_PLACEHOLDER[chave]}
                      onChange={(e) => alterarCampo(chave, e.target.value)}
                    />
                  ) : (
                    <Input
                      id={`campo-${chave}`}
                      maxLength={5000}
                      value={contexto[chave] ?? ""}
                      placeholder={DICA_PLACEHOLDER[chave]}
                      onChange={(e) => alterarCampo(chave, e.target.value)}
                    />
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {erro && <p className="text-corpo-sec text-vermelho-600">{erro}</p>}

        <Button type="submit" disabled={pending}>
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {pending ? "A gerar…" : "Gerar mensagem"}
        </Button>
      </form>

      {/* Pré-visualização e texto final */}
      <div className="space-y-3">
        <h2 className="text-subtitulo text-cinza-900">
          {textoFinal ? "Mensagem gerada" : "Pré-visualização"}
        </h2>

        {textoFinal ? (
          <>
            <TextoGerado texto={textoFinal} />
            <AccoesTexto texto={textoFinal} />
          </>
        ) : tipoUsaCalendario(tipo) ? (
          <p className="rounded-md border border-dashed border-cinza-300 p-6 text-center text-corpo-sec text-cinza-500">
            O calendário é montado no servidor com os treinos e jogos do mês. Escolhe o
            mês e clica em «Gerar mensagem».
          </p>
        ) : (
          <>
            <TextoGerado texto={preVisualizacao} />
            <p className="text-legenda text-cinza-500">
              Pré-visualização local. Clica em «Gerar mensagem» para obter o texto final
              e as opções de partilha.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
