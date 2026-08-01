"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Dumbbell,
  Trophy,
  Settings,
  Users2,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ITENS = [
  { href: "/dashboard", label: "Início", icon: LayoutDashboard },
  { href: "/plantel", label: "Plantel", icon: Users },
  { href: "/treinos", label: "Treinos", icon: CalendarCheck },
  { href: "/exercicios", label: "Exercícios", icon: Dumbbell },
  { href: "/jogos", label: "Jogos", icon: Trophy },
  { href: "/reunioes", label: "Reuniões", icon: Users2 },
  { href: "/definicoes", label: "Definições", icon: Settings },
];

const ITENS_BOTTOM = ITENS.slice(0, 4);
const ITENS_MAIS = ITENS.slice(4);

export function Navegacao() {
  const pathname = usePathname();
  const [maisAberto, setMaisAberto] = useState(false);

  const ativo = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      {/* ── Sidebar (tablet / PC) ── */}
      <nav className="hidden md:flex w-[220px] flex-shrink-0 flex-col border-r border-cinza-200 bg-white">
        <ul className="flex flex-col gap-1 p-3">
          {ITENS.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex min-h-[44px] items-center gap-3 rounded-md px-3 py-2 text-corpo font-medium transition-colors",
                  ativo(href)
                    ? "bg-azul-100 text-azul-700"
                    : "text-cinza-600 hover:bg-azul-50 hover:text-azul-700",
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 flex-shrink-0",
                    ativo(href) ? "text-azul-700" : "text-cinza-400",
                  )}
                />
                <span>{label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* ── Bottom nav (móvel) ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-cinza-200 bg-white md:hidden">
        {/* Menu "Mais" expandido */}
        {maisAberto && (
          <>
            {/* overlay para fechar ao clicar fora */}
            <div
              className="fixed inset-0 z-30"
              onClick={() => setMaisAberto(false)}
            />
            <div className="absolute bottom-full left-0 right-0 z-40 border-t border-cinza-200 bg-white shadow-md">
              {ITENS_MAIS.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMaisAberto(false)}
                  className={cn(
                    "flex min-h-[44px] items-center gap-3 px-6 py-2 text-corpo font-medium",
                    ativo(href)
                      ? "bg-azul-100 text-azul-700"
                      : "text-cinza-600 active:bg-azul-50",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{label}</span>
                </Link>
              ))}
            </div>
          </>
        )}

        <div className="flex h-14 items-stretch">
          {ITENS_BOTTOM.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 text-legenda font-medium",
                ativo(href) ? "text-azul-700" : "text-cinza-400",
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          ))}
          <button
            onClick={() => setMaisAberto((v) => !v)}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 text-legenda font-medium",
              maisAberto ||
              ITENS_MAIS.some(({ href }) => ativo(href))
                ? "text-azul-700"
                : "text-cinza-400",
            )}
            aria-label="Mais opções"
          >
            <MoreHorizontal className="h-5 w-5" />
            <span>Mais</span>
          </button>
        </div>
      </nav>
    </>
  );
}
