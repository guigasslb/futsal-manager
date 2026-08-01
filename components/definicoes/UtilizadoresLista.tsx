"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, KeyRound, Trash2, UsersRound } from "lucide-react";
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
import {
  convidarMembro,
  atribuirPerfilMembro,
  atribuirEscaloesMembro,
  redefinirPasswordMembro,
  removerMembro,
  type MembroLista,
} from "@/lib/actions/utilizadores";

type PerfilBasico = { id: string; nome: string };
type EscalaoBasico = { id: string; nome: string };

function iniciais(nome: string) {
  return nome.trim().split(/\s+/).filter(Boolean).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

function ConvidarDialog({ perfis }: { perfis: PerfilBasico[] }) {
  const [aberto, setAberto] = useState(false);
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [perfilId, setPerfilId] = useState<string>(perfis[0]?.id ?? "");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setErro(null);
    startTransition(async () => {
      const res = await convidarMembro({
        nome: fd.get("nome"),
        email: fd.get("email"),
        passwordInicial: fd.get("passwordInicial"),
        perfilId,
      });
      if (res.sucesso) {
        toast.success("Membro adicionado");
        setAberto(false);
      } else setErro(res.erro);
    });
  }

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          Adicionar membro
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar membro</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {erro && <p className="text-corpo-sec text-vermelho-600">{erro}</p>}
          <div className="space-y-1.5">
            <Label htmlFor="nome">Nome *</Label>
            <Input id="nome" name="nome" required minLength={2} maxLength={100} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email *</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="passwordInicial">Password inicial *</Label>
            <Input id="passwordInicial" name="passwordInicial" type="password" required minLength={8} />
          </div>
          <div className="space-y-1.5">
            <Label>Perfil *</Label>
            <Select value={perfilId} onValueChange={setPerfilId}>
              <SelectTrigger><SelectValue placeholder="Seleciona" /></SelectTrigger>
              <SelectContent>
                {perfis.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={pending || !perfilId}>
              {pending ? "A adicionar…" : "Adicionar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RedefinirPasswordDialog({ membro }: { membro: MembroLista }) {
  const [aberto, setAberto] = useState(false);
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setErro(null);
    startTransition(async () => {
      const res = await redefinirPasswordMembro(membro.membroId, fd.get("novaPassword"));
      if (res.sucesso) {
        toast.success("Password redefinida");
        setAberto(false);
      } else setErro(res.erro);
    });
  }

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Redefinir password">
          <KeyRound className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Redefinir password — {membro.nome}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {erro && <p className="text-corpo-sec text-vermelho-600">{erro}</p>}
          <div className="space-y-1.5">
            <Label htmlFor="novaPassword">Nova password *</Label>
            <Input id="novaPassword" name="novaPassword" type="password" required minLength={8} />
          </div>
          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={pending}>
              {pending ? "A redefinir…" : "Redefinir"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function UtilizadoresLista({
  membros,
  perfis,
  escaloes,
}: {
  membros: MembroLista[];
  perfis: PerfilBasico[];
  escaloes: EscalaoBasico[];
}) {
  const [pending, startTransition] = useTransition();

  function mudarPerfil(membroId: string, perfilId: string) {
    startTransition(async () => {
      const res = await atribuirPerfilMembro(membroId, perfilId);
      if (res.sucesso) toast.success("Perfil atualizado");
      else toast.error(res.erro);
    });
  }

  function alternarEscalao(membro: MembroLista, escalaoId: string) {
    const atuais = new Set(membro.escaloesAtribuidos);
    if (atuais.has(escalaoId)) atuais.delete(escalaoId);
    else atuais.add(escalaoId);
    startTransition(async () => {
      const res = await atribuirEscaloesMembro(membro.membroId, [...atuais]);
      if (!res.sucesso) toast.error(res.erro);
    });
  }

  function remover(membroId: string) {
    startTransition(async () => {
      const res = await removerMembro(membroId);
      if (res.sucesso) toast.success("Membro removido");
      else toast.error(res.erro);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Equipa técnica</h1>
          <p className="mt-1 text-corpo-sec text-cinza-600">
            Treinadores e responsáveis do clube. Atribui cada um ao perfil e aos escalões que gere.
          </p>
        </div>
        <ConvidarDialog perfis={perfis} />
      </div>

      {membros.length === 0 ? (
        <p className="text-corpo-sec text-cinza-600">Nenhum membro.</p>
      ) : (
        <ul className="space-y-2">
          {membros.map((m) => (
            <li
              key={m.membroId}
              className="rounded-md border border-cinza-200 bg-white p-4 shadow-card"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-azul-700 text-white text-legenda font-semibold select-none">
                  {iniciais(m.nome)}
                </div>
                <div className="flex-1">
                  <p className="text-corpo font-semibold text-cinza-900">{m.nome}</p>
                  <p className="text-legenda text-cinza-600">{m.email}</p>
                </div>
                <div className="w-48">
                  <Select
                    value={m.perfilId}
                    onValueChange={(v) => mudarPerfil(m.membroId, v)}
                    disabled={pending}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {perfis.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <RedefinirPasswordDialog membro={m} />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Remover membro">
                      <Trash2 className="h-4 w-4 text-vermelho-600" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remover «{m.nome}» do clube?</AlertDialogTitle>
                      <AlertDialogDescription>
                        O membro perde o acesso ao clube. Os dados do clube mantêm-se.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => remover(m.membroId)}
                        className="bg-vermelho-600 hover:bg-vermelho-600/90 text-white"
                      >
                        Remover
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              {escaloes.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-cinza-100 pt-3">
                  <span className="flex items-center gap-1 text-legenda text-cinza-500">
                    <UsersRound className="h-3.5 w-3.5" /> Escalões:
                  </span>
                  {escaloes.map((e) => {
                    const ativo = m.escaloesAtribuidos.includes(e.id);
                    return (
                      <button
                        key={e.id}
                        onClick={() => alternarEscalao(m, e.id)}
                        disabled={pending}
                        className={`rounded-full border px-2.5 py-0.5 text-legenda transition-colors ${
                          ativo
                            ? "border-azul-700 bg-azul-50 text-azul-700"
                            : "border-cinza-200 text-cinza-500 hover:bg-cinza-50"
                        }`}
                      >
                        {e.nome}
                      </button>
                    );
                  })}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
