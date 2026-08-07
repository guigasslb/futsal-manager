import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonCartao } from "@/components/layout/EstadosUI";

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Cabeçalho: título + ação */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-28 rounded-md" />
      </div>
      {/* Tabs por escalão */}
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-md" />
        ))}
      </div>
      {/* Cartões de jogos */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCartao key={i} />
        ))}
      </div>
    </div>
  );
}
