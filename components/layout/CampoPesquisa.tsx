"use client";

import { useState, useEffect, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function CampoPesquisa({ placeholder = "Pesquisar…" }: { placeholder?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [valor, setValor] = useState(searchParams.get("q") ?? "");

  // Debounce: atualiza a URL 300ms após parar de escrever
  useEffect(() => {
    const atual = searchParams.get("q") ?? "";
    if (valor === atual) return;
    const t = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (valor) params.set("q", valor);
      else params.delete("q");
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`);
      });
    }, 300);
    return () => clearTimeout(t);
  }, [valor, pathname, router, searchParams]);

  return (
    <div className="relative w-full max-w-xs">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cinza-400" />
      <Input
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        placeholder={placeholder}
        className="pl-9"
        aria-label="Pesquisar"
      />
    </div>
  );
}
