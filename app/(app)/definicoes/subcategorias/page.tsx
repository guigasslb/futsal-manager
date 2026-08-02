import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { listarSubcategorias } from "@/lib/actions/subcategorias";
import { SubcategoriasLista } from "@/components/definicoes/SubcategoriasLista";

export default async function SubcategoriasPage() {
  const res = await listarSubcategorias();
  const subcategorias = res.sucesso ? res.dados : [];

  return (
    <div className="space-y-6">
      <Link
        href="/definicoes"
        className="flex w-fit items-center gap-1 text-corpo-sec text-cinza-600 hover:text-cinza-900 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Definições
      </Link>
      <SubcategoriasLista subcategorias={subcategorias} />
    </div>
  );
}
