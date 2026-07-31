"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  definirConvocatoria,
  guardarEstatisticas,
  guardarRelatorio,
} from "@/lib/actions/jogos";
import { LABEL_UTILIZACAO } from "@/lib/schemas/jogo";
import type { Posicao, TipoMetrica, Utilizacao } from "@prisma/client";

type Atleta = { id: string; nome: string; numero: number | null; posicao: Posicao | null };

type Metrica = { id: string; nome: string; tipo: TipoMetrica; ativa: boolean };

type EstatLinha = {
  atletaId: string;
  utilizacao: Utilizacao;
  minutos: number | null;
  golos: number;
  assistencias: number;
  defesas: number | null;
  golosSofridosGR: number | null;
  faltasCometidas: number | null;
  valoresMetricas: Record<string, number>;
};

export function JogoDetalhe({
  jogoId,
  atletas,
  metricas,
  convocadosIniciais,
  estatisticasIniciais,
  relatorioInicial,
}: {
  jogoId: string;
  atletas: Atleta[];
  metricas: Metrica[];
  convocadosIniciais: string[];
  estatisticasIniciais: Record<string, EstatLinha>;
  relatorioInicial: string;
}) {
  const [convocados, setConvocados] = useState<Set<string>>(
    () => new Set(convocadosIniciais),
  );
  const [estatisticas, setEstatisticas] = useState<Record<string, EstatLinha>>(
    estatisticasIniciais,
  );
  const [relatorio, setRelatorio] = useState(relatorioInicial);
  const [confirmarRemocao, setConfirmarRemocao] = useState<string[] | null>(null);

  const [pendingConv, startConv] = useTransition();
  const [pendingEstat, startEstat] = useTransition();
  const [pendingRel, startRel] = useTransition();

  const atletaPorId = new Map(atletas.map((a) => [a.id, a]));
  const convocadosLista = atletas.filter((a) => convocados.has(a.id));

  // Atletas que tinham estatísticas gravadas (chaves de estatisticasIniciais)
  const comEstatisticas = new Set(Object.keys(estatisticasIniciais));

  function alternarConvocado(id: string) {
    setConvocados((prev) => {
      const novo = new Set(prev);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }

  function gravarConvocatoria() {
    startConv(async () => {
      const res = await definirConvocatoria(jogoId, [...convocados]);
      if (res.sucesso) {
        toast.success("Convocatória guardada");
        setConfirmarRemocao(null);
      } else {
        toast.error(res.erro);
      }
    });
  }

  function guardarConvocatoria() {
    // Convocados originais que foram removidos E têm estatísticas registadas (secção 22.4)
    const removidosComStats = convocadosIniciais.filter(
      (id) => !convocados.has(id) && comEstatisticas.has(id),
    );
    if (removidosComStats.length > 0) {
      setConfirmarRemocao(removidosComStats);
      return;
    }
    gravarConvocatoria();
  }

  function estatDe(id: string): EstatLinha {
    return (
      estatisticas[id] ?? {
        atletaId: id,
        utilizacao: "NAO_UTILIZADO",
        minutos: null,
        golos: 0,
        assistencias: 0,
        defesas: null,
        golosSofridosGR: null,
        faltasCometidas: null,
        valoresMetricas: {},
      }
    );
  }

  function atualizarMetrica(atletaId: string, metricaId: string, valor: number | null) {
    setEstatisticas((prev) => {
      const atual = estatDe(atletaId);
      const valores = { ...atual.valoresMetricas };
      if (valor == null) delete valores[metricaId];
      else valores[metricaId] = valor;
      return { ...prev, [atletaId]: { ...atual, valoresMetricas: valores, atletaId } };
    });
  }

  function atualizarEstat(id: string, patch: Partial<EstatLinha>) {
    setEstatisticas((prev) => ({
      ...prev,
      [id]: { ...estatDe(id), ...patch, atletaId: id },
    }));
  }

  function guardarEstat() {
    const payload = convocadosLista.map((a) => {
      const e = estatDe(a.id);
      return {
        ...e,
        valoresMetricas: Object.entries(e.valoresMetricas).map(([metricaId, valor]) => ({
          metricaId,
          valor,
        })),
      };
    });
    startEstat(async () => {
      const res = await guardarEstatisticas(jogoId, payload);
      if (res.sucesso) toast.success("Estatísticas guardadas");
      else toast.error(res.erro);
    });
  }

  function guardarRel() {
    startRel(async () => {
      const res = await guardarRelatorio(jogoId, relatorio);
      if (res.sucesso) toast.success("Relatório guardado");
      else toast.error(res.erro);
    });
  }

  return (
    <Tabs defaultValue="convocatoria">
      <TabsList>
        <TabsTrigger value="convocatoria">Convocatória</TabsTrigger>
        <TabsTrigger value="estatisticas">Estatísticas</TabsTrigger>
        <TabsTrigger value="relatorio">Relatório</TabsTrigger>
      </TabsList>

      {/* ─── Convocatória ─── */}
      <TabsContent value="convocatoria" className="space-y-4">
        {atletas.length === 0 ? (
          <p className="rounded-md border border-dashed border-cinza-300 p-4 text-center text-corpo-sec text-cinza-500">
            Não há atletas neste escalão nesta época.
          </p>
        ) : (
          <>
            <ul className="space-y-2">
              {atletas.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center gap-3 rounded-md border border-cinza-200 bg-white p-2.5 shadow-card"
                >
                  <input
                    type="checkbox"
                    id={`conv-${a.id}`}
                    checked={convocados.has(a.id)}
                    onChange={() => alternarConvocado(a.id)}
                    className="h-5 w-5 accent-azul-700"
                  />
                  <label htmlFor={`conv-${a.id}`} className="flex-1 text-corpo text-cinza-900">
                    {a.numero != null && <span className="mr-1 text-cinza-400">#{a.numero}</span>}
                    {a.nome}
                  </label>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between">
              <p className="text-corpo-sec text-cinza-600">{convocados.size} convocado(s)</p>
              <Button onClick={guardarConvocatoria} disabled={pendingConv}>
                <Check className="h-4 w-4" />
                {pendingConv ? "A guardar…" : "Guardar convocatória"}
              </Button>
            </div>
          </>
        )}
      </TabsContent>

      {/* ─── Estatísticas ─── */}
      <TabsContent value="estatisticas" className="space-y-4">
        {convocadosLista.length === 0 ? (
          <p className="rounded-md border border-dashed border-cinza-300 p-4 text-center text-corpo-sec text-cinza-500">
            Define a convocatória primeiro para registar estatísticas.
          </p>
        ) : (
          <>
            <div className="space-y-3">
              {convocadosLista.map((a) => {
                const e = estatDe(a.id);
                const eGR = atletaPorId.get(a.id)?.posicao === "GUARDA_REDES";
                return (
                  <div
                    key={a.id}
                    className="rounded-md border border-cinza-200 bg-white p-3 shadow-card"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-corpo font-medium text-cinza-900">
                        {a.numero != null && (
                          <span className="mr-1 text-cinza-400">#{a.numero}</span>
                        )}
                        {a.nome}
                        {eGR && <span className="ml-1 text-legenda text-cinza-500">(GR)</span>}
                      </p>
                      <Select
                        value={e.utilizacao}
                        onValueChange={(v) => atualizarEstat(a.id, { utilizacao: v as Utilizacao })}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(["TITULAR", "UTILIZADO", "NAO_UTILIZADO"] as const).map((u) => (
                            <SelectItem key={u} value={u}>
                              {LABEL_UTILIZACAO[u]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <CampoNum
                        label="Minutos"
                        valor={e.minutos}
                        onChange={(n) => atualizarEstat(a.id, { minutos: n })}
                      />
                      {eGR ? (
                        <>
                          <CampoNum
                            label="Defesas"
                            valor={e.defesas}
                            onChange={(n) => atualizarEstat(a.id, { defesas: n })}
                          />
                          <CampoNum
                            label="Golos sofridos"
                            valor={e.golosSofridosGR}
                            onChange={(n) => atualizarEstat(a.id, { golosSofridosGR: n })}
                          />
                          <CampoNum
                            label="Faltas"
                            valor={e.faltasCometidas}
                            onChange={(n) => atualizarEstat(a.id, { faltasCometidas: n })}
                          />
                        </>
                      ) : (
                        <>
                          <CampoNum
                            label="Golos"
                            valor={e.golos}
                            onChange={(n) => atualizarEstat(a.id, { golos: n ?? 0 })}
                          />
                          <CampoNum
                            label="Assistências"
                            valor={e.assistencias}
                            onChange={(n) => atualizarEstat(a.id, { assistencias: n ?? 0 })}
                          />
                          <CampoNum
                            label="Faltas"
                            valor={e.faltasCometidas}
                            onChange={(n) => atualizarEstat(a.id, { faltasCometidas: n })}
                          />
                        </>
                      )}
                    </div>

                    {/* Métricas configuráveis */}
                    {metricas.length > 0 && (
                      <div className="mt-2 grid grid-cols-2 gap-2 border-t border-cinza-100 pt-2 sm:grid-cols-4">
                        {metricas.map((m) => (
                          <CampoMetrica
                            key={m.id}
                            metrica={m}
                            valor={e.valoresMetricas[m.id] ?? null}
                            onChange={(n) => atualizarMetrica(a.id, m.id, n)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end">
              <Button onClick={guardarEstat} disabled={pendingEstat}>
                <Check className="h-4 w-4" />
                {pendingEstat ? "A guardar…" : "Guardar estatísticas"}
              </Button>
            </div>
          </>
        )}
      </TabsContent>

      {/* ─── Relatório ─── */}
      <TabsContent value="relatorio" className="space-y-4">
        <Textarea
          value={relatorio}
          onChange={(e) => setRelatorio(e.target.value)}
          rows={8}
          maxLength={5000}
          placeholder="Reflexão pós-jogo…"
        />
        <div className="flex justify-end">
          <Button onClick={guardarRel} disabled={pendingRel}>
            <Check className="h-4 w-4" />
            {pendingRel ? "A guardar…" : "Guardar relatório"}
          </Button>
        </div>
      </TabsContent>

      {/* Confirmação de remoção com estatísticas (secção 22.4) */}
      <AlertDialog
        open={confirmarRemocao !== null}
        onOpenChange={(aberto) => !aberto && setConfirmarRemocao(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover da convocatória?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmarRemocao && confirmarRemocao.length === 1
                ? "Este atleta tem estatísticas registadas neste jogo que serão apagadas:"
                : "Estes atletas têm estatísticas registadas neste jogo que serão apagadas:"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <ul className="list-disc pl-5 text-corpo-sec text-cinza-900">
            {confirmarRemocao?.map((id) => (
              <li key={id}>{atletaPorId.get(id)?.nome ?? "Atleta"}</li>
            ))}
          </ul>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={gravarConvocatoria}
              className="bg-vermelho-600 hover:bg-vermelho-600/90 text-white"
            >
              Remover e apagar estatísticas
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Tabs>
  );
}

function CampoNum({
  label,
  valor,
  onChange,
}: {
  label: string;
  valor: number | null;
  onChange: (n: number | null) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-legenda text-cinza-500">{label}</label>
      <Input
        type="number"
        min={0}
        value={valor ?? ""}
        onChange={(e) => {
          const v = e.target.value.trim();
          onChange(v === "" ? null : Number(v));
        }}
        className="h-9"
      />
    </div>
  );
}

function CampoMetrica({
  metrica,
  valor,
  onChange,
}: {
  metrica: Metrica;
  valor: number | null;
  onChange: (n: number | null) => void;
}) {
  const label = (
    <label className="text-legenda text-cinza-500">
      {metrica.nome}
      {!metrica.ativa && <span className="ml-1 text-cinza-400">(inativa)</span>}
    </label>
  );

  // BOOLEANO: sim/não → 1/0
  if (metrica.tipo === "BOOLEANO") {
    return (
      <div className="space-y-1">
        {label}
        <Select
          value={valor == null ? "" : String(valor)}
          onValueChange={(v) => onChange(v === "" ? null : Number(v))}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="—" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Sim</SelectItem>
            <SelectItem value="0">Não</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  }

  // ESCALA: 1 a 5
  if (metrica.tipo === "ESCALA") {
    return (
      <div className="space-y-1">
        {label}
        <Select
          value={valor == null ? "" : String(valor)}
          onValueChange={(v) => onChange(v === "" ? null : Number(v))}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="—" />
          </SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 4, 5].map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  // NUMERO
  return (
    <div className="space-y-1">
      {label}
      <Input
        type="number"
        min={0}
        value={valor ?? ""}
        onChange={(e) => {
          const v = e.target.value.trim();
          onChange(v === "" ? null : Number(v));
        }}
        className="h-9"
      />
    </div>
  );
}
