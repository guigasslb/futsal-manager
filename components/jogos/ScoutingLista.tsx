"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Eye, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { criarObservacao, atualizarObservacao, apagarObservacao } from "@/lib/actions/scouting";
import type { ObservacaoAdversario } from "@prisma/client";

function Form({ obs, onDone }: { obs?: ObservacaoAdversario; onDone: () => void }) {
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setErro(null);
    const dados = {
      equipa: String(fd.get("equipa")),
      jogoObservado: String(fd.get("jogoObservado") ?? "").trim() || undefined,
      sistemaTatico: String(fd.get("sistemaTatico") ?? "").trim() || undefined,
      pontosFortes: String(fd.get("pontosFortes") ?? "").trim() || undefined,
      pontosFracos: String(fd.get("pontosFracos") ?? "").trim() || undefined,
      notas: String(fd.get("notas") ?? "").trim() || undefined,
    };
    startTransition(async () => {
      const res = obs ? await atualizarObservacao(obs.id, dados) : await criarObservacao(dados);
      if (res.sucesso) {
        toast.success(obs ? "Observação atualizada" : "Observação criada");
        onDone();
      } else setErro(res.erro);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {erro && <p className="text-corpo-sec text-vermelho-600">{erro}</p>}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="equipa">Equipa *</Label>
          <Input id="equipa" name="equipa" required maxLength={100} defaultValue={obs?.equipa ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sistemaTatico">Sistema tático</Label>
          <Input id="sistemaTatico" name="sistemaTatico" maxLength={100} defaultValue={obs?.sistemaTatico ?? ""} placeholder="ex: 3-1" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="jogoObservado">Jogo observado</Label>
        <Input id="jogoObservado" name="jogoObservado" maxLength={100} defaultValue={obs?.jogoObservado ?? ""} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="pontosFortes">Pontos fortes</Label>
          <Textarea id="pontosFortes" name="pontosFortes" rows={3} defaultValue={obs?.pontosFortes ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pontosFracos">Pontos fracos</Label>
          <Textarea id="pontosFracos" name="pontosFracos" rows={3} defaultValue={obs?.pontosFracos ?? ""} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="notas">Notas</Label>
        <Textarea id="notas" name="notas" rows={3} defaultValue={obs?.notas ?? ""} />
      </div>
      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={pending}>{pending ? "A guardar…" : "Guardar"}</Button>
      </div>
    </form>
  );
}

export function ScoutingLista({ observacoes }: { observacoes: ObservacaoAdversario[] }) {
  const [criar, setCriar] = useState(false);
  const [editar, setEditar] = useState<ObservacaoAdversario | null>(null);
  const [pending, startTransition] = useTransition();

  function apagar(id: string) {
    startTransition(async () => {
      const res = await apagarObservacao(id);
      if (res.sucesso) toast.success("Observação apagada");
      else toast.error(res.erro);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Observação de adversários</h1>
          <p className="mt-1 text-corpo-sec text-cinza-600">Scouting: pontos fortes, fracos e sistema.</p>
        </div>
        <Dialog open={criar} onOpenChange={setCriar}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4" />Nova observação</Button></DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Nova observação</DialogTitle></DialogHeader>
            <Form onDone={() => setCriar(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {observacoes.length === 0 ? (
        <p className="rounded-md border border-dashed border-cinza-300 p-6 text-center text-corpo-sec text-cinza-500">
          Ainda não há observações.
        </p>
      ) : (
        <ul className="space-y-2">
          {observacoes.map((o) => (
            <li key={o.id} className="rounded-md border border-cinza-200 bg-white p-4 shadow-card">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-azul-50">
                  <Eye className="h-5 w-5 text-azul-700" />
                </div>
                <div className="flex-1">
                  <p className="text-corpo font-semibold text-cinza-900">{o.equipa}</p>
                  <p className="text-legenda text-cinza-500">
                    {o.sistemaTatico ? `Sistema ${o.sistemaTatico}` : "Sem sistema"}
                    {o.jogoObservado ? ` · ${o.jogoObservado}` : ""}
                  </p>
                </div>
                <Button variant="ghost" size="icon" aria-label="Editar" onClick={() => setEditar(o)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Apagar" disabled={pending}>
                      <Trash2 className="h-4 w-4 text-vermelho-600" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Apagar observação de «{o.equipa}»?</AlertDialogTitle>
                      <AlertDialogDescription>Esta ação é irreversível.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => apagar(o.id)} className="bg-vermelho-600 hover:bg-vermelho-600/90 text-white">Apagar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              {(o.pontosFortes || o.pontosFracos) && (
                <div className="mt-3 grid grid-cols-2 gap-3 border-t border-cinza-100 pt-3 text-legenda">
                  {o.pontosFortes && <div><span className="text-verde-600 font-medium">Fortes:</span> <span className="text-cinza-600">{o.pontosFortes}</span></div>}
                  {o.pontosFracos && <div><span className="text-vermelho-600 font-medium">Fracos:</span> <span className="text-cinza-600">{o.pontosFracos}</span></div>}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <Dialog open={editar !== null} onOpenChange={(v) => !v && setEditar(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar observação</DialogTitle></DialogHeader>
          {editar && <Form obs={editar} onDone={() => setEditar(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
