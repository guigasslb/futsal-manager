import { AlertCircle, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── Loading ──────────────────────────────────────────────────────────────────

export function SkeletonLinha({ className }: { className?: string }) {
  return <div className={cn("h-5 animate-pulse rounded bg-cinza-200", className)} />;
}

export function SkeletonCartao({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-md border border-cinza-200 bg-white p-4 shadow-card", className)}>
      <div className="space-y-3">
        <SkeletonLinha className="h-4 w-2/3" />
        <SkeletonLinha className="h-4 w-1/2" />
        <SkeletonLinha className="h-4 w-3/4" />
      </div>
    </div>
  );
}

export function SkeletonLista({ linhas = 4 }: { linhas?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: linhas }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-md border border-cinza-200 bg-white p-4"
        >
          <div className="h-10 w-10 animate-pulse rounded-full bg-cinza-200" />
          <div className="flex-1 space-y-2">
            <SkeletonLinha className="h-4 w-40" />
            <SkeletonLinha className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Estado vazio ──────────────────────────────────────────────────────────────

interface EstadoVazioProps {
  titulo: string;
  descricao?: string;
  acao?: React.ReactNode;
  className?: string;
}

export function EstadoVazio({ titulo, descricao, acao, className }: EstadoVazioProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-center", className)}>
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-azul-50">
        <Inbox className="h-8 w-8 text-cinza-400" />
      </div>
      <h3 className="text-subtitulo text-cinza-900">{titulo}</h3>
      {descricao && (
        <p className="mt-1 max-w-sm text-corpo-sec text-cinza-600">{descricao}</p>
      )}
      {acao && <div className="mt-6">{acao}</div>}
    </div>
  );
}

// ─── Estado de erro (bloco de conteúdo) ──────────────────────────────────────
// Erros de operação são toasts (Sonner). Este componente é para erros de página/bloco.

interface EstadoErroProps {
  mensagem?: string;
  tentarNovamente?: () => void;
  className?: string;
}

export function EstadoErro({
  mensagem = "Ocorreu um erro inesperado.",
  tentarNovamente,
  className,
}: EstadoErroProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 text-center",
        className,
      )}
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-vermelho-600/10">
        <AlertCircle className="h-8 w-8 text-vermelho-600" />
      </div>
      <h3 className="text-subtitulo text-cinza-900">Algo correu mal</h3>
      <p className="mt-1 max-w-sm text-corpo-sec text-cinza-600">{mensagem}</p>
      {tentarNovamente && (
        <Button variant="outline" className="mt-6" onClick={tentarNovamente}>
          Tentar novamente
        </Button>
      )}
    </div>
  );
}
