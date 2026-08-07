"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
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
import { registarResultadoExterno } from "@/lib/actions/competicoes";

export function ResultadoExternoForm({ competicaoId }: { competicaoId: string }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setErro(null);

    const dataStr = String(fd.get("data") ?? "").trim();
    const dados = {
      competicaoId,
      equipaCasa: String(fd.get("equipaCasa") ?? "").trim(),
      equipaFora: String(fd.get("equipaFora") ?? "").trim(),
      golosCasa: Number(fd.get("golosCasa") ?? 0),
      golosFora: Number(fd.get("golosFora") ?? 0),
      ...(dataStr !== "" ? { data: dataStr } : {}),
    };

    startTransition(async () => {
      const res = await registarResultadoExterno(dados);
      if (res.sucesso) {
        toast.success("Resultado registado");
        setAberto(false);
        router.refresh();
      } else {
        setErro(res.erro);
      }
    });
  }

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="h-4 w-4" />
          Adicionar resultado
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar resultado</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {erro && <p className="text-corpo-sec text-vermelho-600">{erro}</p>}

          <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="equipaCasa">Equipa da casa *</Label>
              <Input id="equipaCasa" name="equipaCasa" required maxLength={100} placeholder="ex: FC Porto" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="golosCasa" className="sr-only">
                Golos da casa
              </Label>
              <Input
                id="golosCasa"
                name="golosCasa"
                type="number"
                min={0}
                max={99}
                required
                defaultValue={0}
                className="w-16 text-center"
                aria-label="Golos da equipa da casa"
              />
            </div>
            <div className="space-y-1.5" />
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="equipaFora">Equipa visitante *</Label>
              <Input id="equipaFora" name="equipaFora" required maxLength={100} placeholder="ex: Benfica" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="golosFora" className="sr-only">
                Golos do visitante
              </Label>
              <Input
                id="golosFora"
                name="golosFora"
                type="number"
                min={0}
                max={99}
                required
                defaultValue={0}
                className="w-16 text-center"
                aria-label="Golos da equipa visitante"
              />
            </div>
            <div className="space-y-1.5" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="data">Data (opcional)</Label>
            <Input id="data" name="data" type="date" />
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={pending}>
              {pending ? "A guardar…" : "Adicionar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
