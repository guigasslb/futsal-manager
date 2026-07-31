"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Pencil, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { criarUtilizador, atualizarUtilizador, redefinirPassword } from "@/lib/actions/utilizadores";

type UtilizadorSemHash = {
  id: string;
  nome: string;
  email: string;
  clubeId: string;
  criadoEm: Date;
};

// ─── Criar ───────────────────────────────────────────────────────────────────

function CriarUtilizadorDialog() {
  const [aberto, setAberto] = useState(false);
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [camposInvalidos, setCamposInvalidos] = useState<Record<string, string>>({});

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setErro(null);
    setCamposInvalidos({});
    startTransition(async () => {
      const res = await criarUtilizador({
        nome: fd.get("nome"),
        email: fd.get("email"),
        passwordInicial: fd.get("passwordInicial"),
      });
      if (res.sucesso) {
        toast.success("Utilizador criado");
        setAberto(false);
      } else {
        setErro(res.erro);
        if (res.camposInvalidos) setCamposInvalidos(res.camposInvalidos);
      }
    });
  }

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          Novo utilizador
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo utilizador</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {erro && !Object.keys(camposInvalidos).length && (
            <p className="text-corpo-sec text-vermelho-600">{erro}</p>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="nome">Nome *</Label>
            <Input id="nome" name="nome" required minLength={2} maxLength={100} />
            {camposInvalidos.nome && (
              <p className="text-legenda text-vermelho-600">{camposInvalidos.nome}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email *</Label>
            <Input id="email" name="email" type="email" required />
            {camposInvalidos.email && (
              <p className="text-legenda text-vermelho-600">{camposInvalidos.email}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="passwordInicial">Password inicial *</Label>
            <Input id="passwordInicial" name="passwordInicial" type="password" required minLength={8} />
            {camposInvalidos.passwordInicial && (
              <p className="text-legenda text-vermelho-600">{camposInvalidos.passwordInicial}</p>
            )}
            <p className="text-legenda text-cinza-400">Mínimo 8 caracteres. O utilizador deve alterá-la no primeiro acesso.</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="submit" disabled={pending}>
              {pending ? "A criar…" : "Criar utilizador"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Editar ───────────────────────────────────────────────────────────────────

function EditarUtilizadorDialog({ utilizador }: { utilizador: UtilizadorSemHash }) {
  const [aberto, setAberto] = useState(false);
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setErro(null);
    startTransition(async () => {
      const res = await atualizarUtilizador(utilizador.id, {
        nome: fd.get("nome"),
        email: fd.get("email"),
      });
      if (res.sucesso) {
        toast.success("Utilizador atualizado");
        setAberto(false);
      } else {
        setErro(res.erro);
      }
    });
  }

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Editar utilizador">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar utilizador</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {erro && <p className="text-corpo-sec text-vermelho-600">{erro}</p>}
          <div className="space-y-1.5">
            <Label htmlFor="nome">Nome *</Label>
            <Input id="nome" name="nome" defaultValue={utilizador.nome} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email *</Label>
            <Input id="email" name="email" type="email" defaultValue={utilizador.email} required />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="submit" disabled={pending}>
              {pending ? "A guardar…" : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Redefinir password ───────────────────────────────────────────────────────

function RedefinirPasswordDialog({ utilizador }: { utilizador: UtilizadorSemHash }) {
  const [aberto, setAberto] = useState(false);
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setErro(null);
    startTransition(async () => {
      const res = await redefinirPassword(utilizador.id, fd.get("novaPassword"));
      if (res.sucesso) {
        toast.success("Password redefinida");
        setAberto(false);
      } else {
        setErro(res.erro);
      }
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
          <DialogTitle>Redefinir password — {utilizador.nome}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {erro && <p className="text-corpo-sec text-vermelho-600">{erro}</p>}
          <div className="space-y-1.5">
            <Label htmlFor="novaPassword">Nova password *</Label>
            <Input id="novaPassword" name="novaPassword" type="password" required minLength={8} />
            <p className="text-legenda text-cinza-400">Mínimo 8 caracteres.</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="submit" disabled={pending}>
              {pending ? "A redefinir…" : "Redefinir password"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Lista principal ──────────────────────────────────────────────────────────

export function UtilizadoresLista({
  utilizadores,
}: {
  utilizadores: UtilizadorSemHash[];
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Utilizadores</h1>
          <p className="mt-1 text-corpo-sec text-cinza-600">
            Todos os utilizadores têm acesso total ao clube.
          </p>
        </div>
        <CriarUtilizadorDialog />
      </div>

      {utilizadores.length === 0 ? (
        <p className="text-corpo-sec text-cinza-600">Nenhum utilizador encontrado.</p>
      ) : (
        <ul className="space-y-2">
          {utilizadores.map((u) => (
            <li
              key={u.id}
              className="flex items-center gap-3 rounded-md border border-cinza-200 bg-white p-4 shadow-card"
            >
              {/* Avatar iniciais */}
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-azul-700 text-white text-legenda font-semibold select-none">
                {u.nome
                  .trim()
                  .split(/\s+/)
                  .filter(Boolean)
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-corpo font-semibold text-cinza-900">{u.nome}</p>
                <p className="text-legenda text-cinza-600">{u.email}</p>
              </div>
              <div className="flex items-center gap-1">
                <EditarUtilizadorDialog utilizador={u} />
                <RedefinirPasswordDialog utilizador={u} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
