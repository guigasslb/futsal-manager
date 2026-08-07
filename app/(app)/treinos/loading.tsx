import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonLista } from "@/components/layout/EstadosUI";

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Cabeçalho: título + ação */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>
      {/* Alternância lista/calendário + tabs por escalão */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-md" />
          ))}
        </div>
        <Skeleton className="h-9 w-28 rounded-md" />
      </div>
      {/* Lista de sessões */}
      <SkeletonLista linhas={6} />
    </div>
  );
}
