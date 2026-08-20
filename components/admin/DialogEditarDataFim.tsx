"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarClock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { editarDataFimLicenca } from "@/lib/actions/admin-licencas";

/** Converte uma Date (ou null) no formato YYYY-MM-DD para o input type=date. */
function paraInputDate(d: Date | null): string {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toISOString().slice(0, 10);
}

export function DialogEditarDataFim({
  licencaId,
  titular,
  dataFimInicial,
}: {
  licencaId: string;
  titular: string;
  dataFimInicial: Date | null;
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [pending, startTransition] = useTransition();

  const [semExpiracao, setSemExpiracao] = useState<boolean>(dataFimInicial === null);
  const [data, setData] = useState<string>(paraInputDate(dataFimInicial));
  const [erro, setErro] = useState<string | null>(null);

  function repor() {
    setSemExpiracao(dataFimInicial === null);
    setData(paraInputDate(dataFimInicial));
    setErro(null);
  }

  function handleGuardar() {
    setErro(null);

    if (!semExpiracao && !data) {
      setErro("Indica uma data de fim ou marca “Sem expiração”.");
      return;
    }

    const dados = {
      licencaId,
      dataFim: semExpiracao ? null : new Date(data),
    };

    startTransition(async () => {
      const res = await editarDataFimLicenca(dados);
      if (res.sucesso) {
        toast.success("Data de fim atualizada");
        setAberto(false);
        router.refresh();
      } else {
        setErro(res.erro);
      }
    });
  }

  return (
    <Dialog
      open={aberto}
      onOpenChange={(v) => {
        if (pending) return;
        if (v) repor();
        setAberto(v);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <CalendarClock className="h-4 w-4" />
          Editar data
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar data de fim</DialogTitle>
          <DialogDescription>{titular}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-1">
          {erro && (
            <p role="alert" className="text-corpo-sec text-vermelho-600">
              {erro}
            </p>
          )}

          <div className="flex items-center justify-between rounded-md border border-cinza-200 p-3">
            <div>
              <Label htmlFor="sem-expiracao">Sem expiração</Label>
              <p className="text-legenda text-cinza-500">
                A licença fica perpétua (sem data de fim).
              </p>
            </div>
            <Switch
              id="sem-expiracao"
              checked={semExpiracao}
              onCheckedChange={setSemExpiracao}
              disabled={pending}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="data-fim">Data de fim</Label>
            <Input
              id="data-fim"
              type="date"
              value={data}
              disabled={semExpiracao || pending}
              onChange={(e) => setData(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => setAberto(false)}
          >
            Cancelar
          </Button>
          <Button type="button" disabled={pending} onClick={handleGuardar}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
