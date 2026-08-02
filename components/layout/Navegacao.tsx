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
      <nav className="hidden md:flex w-[224px] flex-shrink-0 flex-col border-r border-cinza-200/70 bg-white/60 print:hidden">
        <p className="px-5 pt-5 pb-2 text-legenda font-semibold uppercase tracking-wider text-cinza-400">
          Menu
        </p>
        <ul className="flex flex-col gap-1 px-3">
          {ITENS.map(({ href, label, icon: Icon }) => {
            const on = ativo(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={on ? "page" : undefined}
                  className={cn("nav-item", on && "nav-item-active")}
                >
                  <Icon
                    className={cn("h-5 w-5 flex-shrink-0", !on && "text-cinza-400")}
                    style={on ? { color: "var(--cor-primaria, #1A2FD4)" } : undefined}
                  />
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ── Bottom nav (móvel) ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-cinza-200 bg-white md:hidden print:hidden">
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
                      ? "bg-primary/10 text-primary"
                      : "text-cinza-600 active:bg-primary/5",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{label}</span>
                </Link>
              ))}
            </div>
          </>
        )}

        <div className="flex h-16 items-stretch">
          {ITENS_BOTTOM.map(({ href, label, icon: Icon }) => {
            const on = ativo(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={on ? "page" : undefined}
                className="flex flex-1 flex-col items-center justify-center gap-1 text-legenda font-medium text-cinza-400"
                style={on ? { color: "var(--cor-primaria, #1A2FD4)" } : undefined}
              >
                <span
                  className="flex h-7 w-12 items-center justify-center rounded-full transition-colors"
                  style={on ? { backgroundColor: "color-mix(in srgb, var(--cor-primaria, #1A2FD4) 14%, white)" } : undefined}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span>{label}</span>
              </Link>
            );
          })}
          {(() => {
            const on = maisAberto || ITENS_MAIS.some(({ href }) => ativo(href));
            return (
              <button
                onClick={() => setMaisAberto((v) => !v)}
                className="flex flex-1 flex-col items-center justify-center gap-1 text-legenda font-medium text-cinza-400"
                style={on ? { color: "var(--cor-primaria, #1A2FD4)" } : undefined}
                aria-label="Mais opções"
              >
                <span
                  className="flex h-7 w-12 items-center justify-center rounded-full transition-colors"
                  style={on ? { backgroundColor: "color-mix(in srgb, var(--cor-primaria, #1A2FD4) 14%, white)" } : undefined}
                >
                  <MoreHorizontal className="h-5 w-5" />
                </span>
                <span>Mais</span>
              </button>
            );
          })()}
        </div>
      </nav>
    </>
  );
}
