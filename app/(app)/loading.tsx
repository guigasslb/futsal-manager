import { SkeletonLista } from "@/components/layout/EstadosUI";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="skeleton-shimmer h-8 w-48 rounded bg-cinza-200" />
      <SkeletonLista linhas={6} />
    </div>
  );
}
