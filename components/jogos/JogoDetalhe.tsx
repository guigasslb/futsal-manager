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
  definirConvocatoria,
  guardarEstatisticas,
  guardarRelatorio,
} from "@/lib/actions/jogos";
import { LABEL_UTILIZACAO } from "@/lib/schemas/jogo";
import type { Posicao, Utilizacao } from "@prisma/client";

type Atleta = { id: string; nome: string; numero: number | null; posicao: Posicao | null };

type EstatLinha = {
  atletaId: string;
  utilizacao: Utilizacao;
  minutos: number | null;
  golos: number;
  assistencias: number;
  defesas: number | null;
  golosSofridosGR: number | null;
  faltasCometidas: number | null;
};

export function JogoDetalhe({
  jogoId,
  atletas,
  convocadosIniciais,
  estatisticasIniciais,
  relatorioInicial,
}: {
  jogoId: string;
  atletas: Atleta[];
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

  const [pendingConv, startConv] = useTransition();
  const [pendingEstat, startEstat] = useTransition();
  const [pendingRel, startRel] = useTransition();

  const atletaPorId = new Map(atletas.map((a) => [a.id, a]));
  const convocadosLista = atletas.filter((a) => convocados.has(a.id));

  function alternarConvocado(id: string) {
    setConvocados((prev) => {
      const novo = new Set(prev);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }

  function guardarConvocatoria() {
    startConv(async () => {
      const res = await definirConvocatoria(jogoId, [...convocados]);
      if (res.sucesso) toast.success("Convocatória guardada");
      else toast.error(res.erro);
    });
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
      }
    );
  }

  function atualizarEstat(id: string, patch: Partial<EstatLinha>) {
    setEstatisticas((prev) => ({
      ...prev,
      [id]: { ...estatDe(id), ...patch, atletaId: id },
    }));
  }

  function guardarEstat() {
    const payload = convocadosLista.map((a) => estatDe(a.id));
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
