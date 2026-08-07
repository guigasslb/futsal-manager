import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonCartao } from "@/components/layout/EstadosUI";

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      {/* Cartões de indicadores */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-md" />
        ))}
      </div>
      {/* Gráficos */}
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <SkeletonCartao key={i} className="h-64" />
        ))}
      </div>
    </div>
  );
}
