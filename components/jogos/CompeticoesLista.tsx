"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Trophy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { criarCompeticao, apagarCompeticao, type CompeticaoComRelacoes } from "@/lib/actions/competicoes";
import { LABEL_TIPO_JOGO } from "@/lib/schemas/jogo";

type EscalaoBasico = { id: string; nome: string };

function CriarDialog({ escaloes }: { escaloes: EscalaoBasico[] }) {
  const [aberto, setAberto] = useState(false);
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [escalaoId, setEscalaoId] = useState(escaloes[0]?.id ?? "");
  const [tipo, setTipo] = useState("OFICIAL");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setErro(null);
    startTransition(async () => {
      const res = await criarCompeticao({ nome: fd.get("nome"), tipo, escalaoId });
      if (res.sucesso) {
        toast.success("Competição criada");
        setAberto(false);
      } else setErro(res.erro);
    });
  }

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4" />Nova competição</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Nova competição</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {erro && <p className="text-corpo-sec text-vermelho-600">{erro}</p>}
          <div className="space-y-1.5">
            <Label htmlFor="nome">Nome *</Label>
            <Input id="nome" name="nome" required maxLength={100} placeholder="ex: Liga distrital" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="OFICIAL">Oficial</SelectItem>
                  <SelectItem value="AMIGAVEL">Amigável</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Escalão *</Label>
              <Select value={escalaoId} onValueChange={setEscalaoId}>
                <SelectTrigger><SelectValue placeholder="Seleciona" /></SelectTrigger>
                <SelectContent>
                  {escaloes.map((e) => (<SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={pending || !escalaoId}>{pending ? "A criar…" : "Criar"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CompeticoesLista({
  competicoes,
  escaloes,
}: {
  competicoes: CompeticaoComRelacoes[];
  escaloes: EscalaoBasico[];
}) {
  const [pending, startTransition] = useTransition();

  function apagar(id: string) {
    startTransition(async () => {
      const res = await apagarCompeticao(id);
      if (res.sucesso) toast.success("Competição apagada");
      else toast.error(res.erro);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Competições</h1>
          <p className="mt-1 text-corpo-sec text-cinza-600">Provas em disputa nesta época.</p>
        </div>
        <CriarDialog escaloes={escaloes} />
      </div>

      {competicoes.length === 0 ? (
        <p className="rounded-md border border-dashed border-cinza-300 p-6 text-center text-corpo-sec text-cinza-500">
          Sem competições nesta época.
        </p>
      ) : (
        <ul className="space-y-2">
          {competicoes.map((c) => (
            <li key={c.id} className="flex items-center gap-3 rounded-md border border-cinza-200 bg-white p-4 shadow-card">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-azul-50">
                <Trophy className="h-5 w-5 text-azul-700" />
              </div>
              <div className="flex-1">
                <p className="text-corpo font-semibold text-cinza-900">{c.nome}</p>
                <p className="text-legenda text-cinza-500">
                  {LABEL_TIPO_JOGO[c.tipo]} · {c.escalao.nome} · {c._count.jogos} jogo(s)
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Apagar" disabled={pending}>
                    <Trash2 className="h-4 w-4 text-vermelho-600" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Apagar «{c.nome}»?</AlertDialogTitle>
                    <AlertDialogDescription>Os jogos mantêm-se, apenas deixam de estar ligados a esta competição.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => apagar(c.id)} className="bg-vermelho-600 hover:bg-vermelho-600/90 text-white">Apagar</AlertDialogAction>
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
