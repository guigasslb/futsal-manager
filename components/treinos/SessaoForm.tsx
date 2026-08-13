"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
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
import { criarSessao, atualizarSessao } from "@/lib/actions/treinos";
import { verificarConflitoAgenda } from "@/lib/actions/agenda";
import type { ConflitoAgenda } from "@/lib/utils/agenda-conflitos";
import { TIPOS_SESSAO, LABEL_TIPO_SESSAO } from "@/lib/schemas/treino";
import type { Escalao, Sessao, TipoSessao } from "@prisma/client";

const SENTINEL_NONE = "__none__";

function paraInputDateTime(date: Date | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60000);
  return local.toISOString().slice(0, 16);
}

type EscalaoBasico = Pick<Escalao, "id" | "nome">;
type SessaoParaEdicao = Pick<
  Sessao,
  "id" | "data" | "escalaoId" | "tipoSessao" | "planeamentoId" | "duracaoMin" | "objetivo" | "local" | "notas"
>;
type PlaneamentoBasico = {
  id: string;
  escalaoId: string;
  tipo: "SEMANAL" | "MENSAL";
  dataInicio: Date;
  dataFim: Date;
  microciclo: number | null;
};

function labelPlaneamento(p: PlaneamentoBasico): string {
  const opt: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short" };
  const intervalo = `${new Date(p.dataInicio).toLocaleDateString("pt-PT", opt)} – ${new Date(p.dataFim).toLocaleDateString("pt-PT", opt)}`;
  const tipo = p.tipo === "SEMANAL" ? "Semanal" : "Mensal";
  const micro = p.microciclo != null ? ` · Micro ${p.microciclo}` : "";
  return `${tipo} · ${intervalo}${micro}`;
}

export function SessaoForm({
  escaloes,
  sessao,
  escalaoIdInicial,
  planeamentos = [],
}: {
  escaloes: EscalaoBasico[];
  sessao?: SessaoParaEdicao;
  escalaoIdInicial?: string;
  planeamentos?: PlaneamentoBasico[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [escalaoId, setEscalaoId] = useState<string>(
    sessao?.escalaoId ?? escalaoIdInicial ?? "",
  );
  const [tipoSessao, setTipoSessao] = useState<TipoSessao>(sessao?.tipoSessao ?? "NORMAL");
  const [planeamentoId, setPlaneamentoId] = useState<string>(
    sessao?.planeamentoId ?? SENTINEL_NONE,
  );

  // Aviso não-bloqueante de conflito de pavilhão (F3.3 — §8.16).
  const [conflitos, setConflitos] = useState<ConflitoAgenda[]>([]);
  const [dataValor, setDataValor] = useState<string>(paraInputDateTime(sessao?.data));
  const [localValor, setLocalValor] = useState<string>(sessao?.local ?? "");
  const [duracaoValor, setDuracaoValor] = useState<string>(
    sessao?.duracaoMin != null ? String(sessao.duracaoMin) : "",
  );

  const planeamentosDoEscalao = planeamentos.filter((p) => p.escalaoId === escalaoId);
  const mostrarAviso = tipoSessao === "NORMAL" && planeamentoId === SENTINEL_NONE && planeamentosDoEscalao.length > 0;

  // Verificação após-debounce (~800ms). Sem local ou escalão → não verifica.
  // Falha de rede → silêncio total (funcionalidade secundária, não bloqueante).
  useEffect(() => {
    const local = localValor.trim();
    if (!local || !dataValor || !escalaoId) {
      setConflitos([]);
      return;
    }
    let cancelado = false;
    const timer = setTimeout(async () => {
      try {
        const n = Number(duracaoValor);
        const duracaoMin =
          duracaoValor.trim() !== "" && Number.isFinite(n) ? n : undefined;
        const res = await verificarConflitoAgenda({
          data: new Date(dataValor),
          local,
          tipo: "TREINO",
          duracaoMin,
          excluirId: sessao?.id,
          escalaoId,
        });
        if (cancelado) return;
        setConflitos(
          res.sucesso && res.dados.conflitos.length > 0 ? res.dados.conflitos : [],
        );
      } catch {
        if (!cancelado) setConflitos([]);
      }
    }, 800);
    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [dataValor, localValor, duracaoValor, escalaoId, sessao?.id]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setErros({});
    setErroGeral(null);

    const duracaoRaw = String(fd.get("duracaoMin") ?? "").trim();

    const dados = {
      data: String(fd.get("data")),
      escalaoId: escalaoId || undefined,
      tipoSessao,
      planeamentoId: planeamentoId !== SENTINEL_NONE ? planeamentoId : null,
      duracaoMin: duracaoRaw !== "" ? Number(duracaoRaw) : undefined,
      objetivo: String(fd.get("objetivo") ?? "").trim() || undefined,
      local: String(fd.get("local") ?? "").trim() || undefined,
      notas: String(fd.get("notas") ?? "").trim() || undefined,
    };

    startTransition(async () => {
      const res = sessao
        ? await atualizarSessao(sessao.id, dados)
        : await criarSessao(dados);
      if (res.sucesso) {
        toast.success(sessao ? "Sessão atualizada" : "Sessão criada");
        router.push(`/treinos/${res.dados.id}`);
        router.refresh();
      } else {
        setErroGeral(res.erro);
        if (res.camposInvalidos) setErros(res.camposInvalidos);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-5">
      {erroGeral && !Object.keys(erros).length && (
        <p className="text-corpo-sec text-vermelho-600">{erroGeral}</p>
      )}

      {/* Tipo de sessão */}
      <div className="space-y-1.5">
        <Label>Tipo de sessão *</Label>
        <Select value={tipoSessao} onValueChange={(v) => setTipoSessao(v as TipoSessao)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIPOS_SESSAO.map((t) => (
              <SelectItem key={t} value={t}>{LABEL_TIPO_SESSAO[t]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="data">Data e hora *</Label>
          <Input
            id="data"
            name="data"
            type="datetime-local"
            required
            defaultValue={paraInputDateTime(sessao?.data)}
            onChange={(e) => setDataValor(e.target.value)}
          />
          {erros.data && <p className="text-legenda text-vermelho-600">{erros.data}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="duracaoMin">Duração (min)</Label>
          <Input
            id="duracaoMin"
            name="duracaoMin"
            type="number"
            min={1}
            max={300}
            defaultValue={sessao?.duracaoMin ?? ""}
            placeholder="ex: 80"
            onChange={(e) => setDuracaoValor(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Escalão *</Label>
        <Select
          value={escalaoId}
          onValueChange={(v) => {
            setEscalaoId(v);
            setPlaneamentoId(SENTINEL_NONE); // reset planeamento ao mudar escalão
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleciona um escalão" />
          </SelectTrigger>
          <SelectContent>
            {escaloes.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {erros.escalaoId && <p className="text-legenda text-vermelho-600">{erros.escalaoId}</p>}
      </div>

      {/* Planeamento — só para treino normal */}
      {tipoSessao === "NORMAL" && (
        <div className="space-y-1.5">
          <Label>Planeamento</Label>
          {planeamentosDoEscalao.length === 0 ? (
            <p className="text-legenda text-cinza-500">
              Nenhum planeamento para este escalão.{" "}
              <Link href="/treinos/periodizacao" className="underline hover:text-cinza-700">
                Criar planeamento
              </Link>
            </p>
          ) : (
            <>
              <Select value={planeamentoId} onValueChange={setPlaneamentoId}>
                <SelectTrigger>
                  <SelectValue placeholder="— Nenhum —" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SENTINEL_NONE}>— Nenhum —</SelectItem>
                  {planeamentosDoEscalao.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {labelPlaneamento(p)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {mostrarAviso && (
                <p className="flex items-center gap-1 text-legenda text-ambar-600">
                  <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                  Recomendado associar a um planeamento.
                </p>
              )}
            </>
          )}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="objetivo">Objetivo</Label>
        <Input
          id="objetivo"
          name="objetivo"
          defaultValue={sessao?.objetivo ?? ""}
          maxLength={500}
          placeholder="ex: 1x1 ofensivo e finalização"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="local">Local</Label>
        <Input
          id="local"
          name="local"
          defaultValue={sessao?.local ?? ""}
          maxLength={100}
          placeholder="ex: Pavilhão Municipal"
          onChange={(e) => setLocalValor(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notas">Notas</Label>
        <Textarea
          id="notas"
          name="notas"
          defaultValue={sessao?.notas ?? ""}
          maxLength={2000}
          rows={3}
        />
      </div>

      {conflitos.length > 0 && (
        <div role="alert" className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          <p className="font-medium">Possível conflito de pavilhão</p>
          <ul className="mt-1 list-disc pl-4">
            {conflitos.map((c, i) => (
              <li key={i}>
                {c.tipo === "TREINO" ? "Treino" : "Jogo"} do {c.escalaoNome} — {format(c.data, "HH:mm", { locale: pt })}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={pending || !escalaoId}>
          {pending ? "A guardar…" : sessao ? "Guardar alterações" : "Criar sessão"}
        </Button>
        <Button type="button" variant="outline" disabled={pending} onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
