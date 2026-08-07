import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MigalhaItem {
  /** Texto a mostrar. */
  label: string;
  /** Se presente, o item é um link para o nível anterior. O último item (página
   *  atual) não deve ter `href`. */
  href?: string;
}

/**
 * Migalhas de navegação (breadcrumbs) para páginas de detalhe.
 * Ex.: Plantel → Nome do Atleta.
 *
 * O último item representa a página atual e é marcado com `aria-current="page"`.
 */
export function Breadcrumbs({
  items,
  className,
}: {
  items: MigalhaItem[];
  className?: string;
}) {
  return (
    <nav aria-label="Navegação estrutural" className={cn("min-w-0", className)}>
      <ol className="flex flex-wrap items-center gap-1 text-corpo-sec text-cinza-600">
        {items.map((item, i) => {
          const ultimo = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`} className="flex items-center gap-1 min-w-0">
              {item.href && !ultimo ? (
                <Link
                  href={item.href}
                  className="transition-colors hover:text-cinza-900"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={ultimo ? "page" : undefined}
                  className={cn("truncate", ultimo && "font-medium text-cinza-900")}
                >
                  {item.label}
                </span>
              )}
              {!ultimo && (
                <ChevronRight
                  className="h-4 w-4 flex-shrink-0 text-cinza-400"
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
