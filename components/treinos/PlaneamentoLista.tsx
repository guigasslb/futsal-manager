"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, CalendarRange } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  criarPlaneamento,
  atualizarPlaneamento,
  apagarPlaneamento,
  type PlaneamentoComRelacoes,
} from "@/lib/actions/periodizacao";
import { LABEL_TIPO_PLANEAMENTO, LABEL_PERIODO } from "@/lib/schemas/planeamento";

type EscalaoBasico = { id: string; nome: string };

function dataInput(d: Date | null | undefined): string {
  if (!d) return "";
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
}

function PlaneamentoForm({
  escaloes,
  planeamento,
  onDone,
}: {
  escaloes: EscalaoBasico[];
  planeamento?: PlaneamentoComRelacoes;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [escalaoId, setEscalaoId] = useState(planeamento?.escalaoId ?? escaloes[0]?.id ?? "");
  const [tipo, setTipo] = useState(planeamento?.tipo ?? "SEMANAL");
  const [periodo, setPeriodo] = useState(planeamento?.periodo ?? "");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setErro(null);
    const meso = String(fd.get("mesociclo") ?? "").trim();
    const micro = String(fd.get("microciclo") ?? "").trim();
    const dados = {
      escalaoId,
      tipo,
      periodo: periodo || undefined,
      mesociclo: meso ? Number(meso) : undefined,
      microciclo: micro ? Number(micro) : undefined,
      dataInicio: String(fd.get("dataInicio")),
      dataFim: String(fd.get("dataFim")),
      objetivos: String(fd.get("objetivos") ?? "").trim() || undefined,
    };
    startTransition(async () => {
      const res = planeamento
        ? await atualizarPlaneamento(planeamento.id, dados)
        : await criarPlaneamento(dados);
      if (res.sucesso) {
        toast.success(planeamento ? "Planeamento atualizado" : "Planeamento criado");
        onDone();
      } else setErro(res.erro);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {erro && <p className="text-corpo-sec text-vermelho-600">{erro}</p>}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Escalão *</Label>
          <Select value={escalaoId} onValueChange={setEscalaoId}>
            <SelectTrigger><SelectValue placeholder="Seleciona" /></SelectTrigger>
            <SelectContent>
              {escaloes.map((e) => (
                <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Tipo</Label>
          <Select value={tipo} onValueChange={(v) => setTipo(v as typeof tipo)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="SEMANAL">Semanal</SelectItem>
              <SelectItem value="MENSAL">Mensal</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="dataInicio">Início *</Label>
          <Input id="dataInicio" name="dataInicio" type="date" required defaultValue={dataInput(planeamento?.dataInicio)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dataFim">Fim *</Label>
          <Input id="dataFim" name="dataFim" type="date" required defaultValue={dataInput(planeamento?.dataFim)} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label>Período</Label>
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="PREPARATORIO">Preparatório</SelectItem>
              <SelectItem value="COMPETITIVO">Competitivo</SelectItem>
              <SelectItem value="TRANSICAO">Transição</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="mesociclo">Mesociclo</Label>
          <Input id="mesociclo" name="mesociclo" type="number" min={1} max={99} defaultValue={planeamento?.mesociclo ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="microciclo">Microciclo</Label>
          <Input id="microciclo" name="microciclo" type="number" min={1} max={99} defaultValue={planeamento?.microciclo ?? ""} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="objetivos">Objetivos</Label>
        <Textarea id="objetivos" name="objetivos" rows={3} maxLength={2000} defaultValue={planeamento?.objetivos ?? ""} />
      </div>
      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={pending || !escalaoId}>
          {pending ? "A guardar…" : "Guardar"}
        </Button>
      </div>
    </form>
  );
}

function CriarDialog({ escaloes }: { escaloes: EscalaoBasico[] }) {
  const [aberto, setAberto] = useState(false);
  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4" />Novo planeamento</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Novo planeamento</DialogTitle></DialogHeader>
        <PlaneamentoForm escaloes={escaloes} onDone={() => setAberto(false)} />
      </DialogContent>
    </Dialog>
  );
}

function EditarDialog({ escaloes, planeamento }: { escaloes: EscalaoBasico[]; planeamento: PlaneamentoComRelacoes }) {
  const [aberto, setAberto] = useState(false);
  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Editar"><Pencil className="h-4 w-4" /></Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Editar planeamento</DialogTitle></DialogHeader>
        <PlaneamentoForm escaloes={escaloes} planeamento={planeamento} onDone={() => setAberto(false)} />
      </DialogContent>
    </Dialog>
  );
}

function formatarIntervalo(a: Date, b: Date): string {
  const opt: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short" };
  return `${new Date(a).toLocaleDateString("pt-PT", opt)} – ${new Date(b).toLocaleDateString("pt-PT", opt)}`;
}

export function PlaneamentoLista({
  planeamentos,
  escaloes,
}: {
  planeamentos: PlaneamentoComRelacoes[];
  escaloes: EscalaoBasico[];
}) {
  const [pending, startTransition] = useTransition();

  function apagar(id: string) {
    startTransition(async () => {
      const res = await apagarPlaneamento(id);
      if (res.sucesso) toast.success("Planeamento apagado");
      else toast.error(res.erro);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Periodização</h1>
          <p className="mt-1 text-corpo-sec text-cinza-600">
            Planos semanais e mensais por escalão, organizados em ciclos.
          </p>
        </div>
        <CriarDialog escaloes={escaloes} />
      </div>

      {planeamentos.length === 0 ? (
        <p className="rounded-md border border-dashed border-cinza-300 p-6 text-center text-corpo-sec text-cinza-500">
          Ainda não planeaste esta época. Cria o primeiro microciclo.
        </p>
      ) : (
        <ul className="space-y-2">
          {planeamentos.map((p) => (
            <li key={p.id} className="flex items-center gap-3 rounded-md border border-cinza-200 bg-white p-4 shadow-card">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-azul-50">
                <CalendarRange className="h-5 w-5 text-azul-700" />
              </div>
              <div className="flex-1">
                <p className="text-corpo font-semibold text-cinza-900">
                  {LABEL_TIPO_PLANEAMENTO[p.tipo]} · {formatarIntervalo(p.dataInicio, p.dataFim)}
                </p>
                <p className="text-legenda text-cinza-500">
                  {p.escalao.nome}
                  {p.periodo ? ` · ${LABEL_PERIODO[p.periodo]}` : ""}
                  {p.mesociclo != null ? ` · Meso ${p.mesociclo}` : ""}
                  {p.microciclo != null ? ` · Micro ${p.microciclo}` : ""}
                  {` · ${p._count.sessoes} sessão(ões)`}
                </p>
              </div>
              <EditarDialog escaloes={escaloes} planeamento={p} />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Apagar" disabled={pending}>
                    <Trash2 className="h-4 w-4 text-vermelho-600" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Apagar este planeamento?</AlertDialogTitle>
                    <AlertDialogDescription>
                      As sessões associadas mantêm-se, apenas deixam de estar ligadas a este planeamento.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => apagar(p.id)} className="bg-vermelho-600 hover:bg-vermelho-600/90 text-white">
                      Apagar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
