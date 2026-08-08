"use client";

import { useTransition } from "react";
import Link from "next/link";
import { LogOut, KeyRound, Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { terminarSessao } from "@/lib/actions/auth-actions";
import { SeletorEpoca } from "@/components/layout/SeletorEpoca";
import { AlternadorTema } from "@/components/layout/AlternadorTema";
import { Logo } from "@/components/layout/Logo";
import type { Epoca } from "@prisma/client";

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

interface Props {
  nomeUtilizador: string;
  epocas: Epoca[];
  epocaAtivaId: string | null;
  /** Há treino ou jogo hoje (F14 / §8.16) — mostra o indicador no cabeçalho. */
  eventoHoje?: boolean;
}

export function BarraTopo({
  nomeUtilizador,
  epocas,
  epocaAtivaId,
  eventoHoje = false,
}: Props) {
  const [pending, startTransition] = useTransition();

  return (
    <header className="topbar-glass sticky top-0 z-30 flex h-16 items-center justify-between border-b border-cinza-200/60 px-4 gap-3 print:hidden md:px-6">
      {/* Marca FutsalCoach */}
      <Link href="/dashboard" className="flex items-center shrink-0 transition-transform hover:scale-[1.02]">
        <Logo size={20} variant="dark" />
      </Link>

      {/* Seletor de época + ações + menu do utilizador */}
      <div className="flex items-center gap-2 ml-auto sm:gap-3">
        <SeletorEpoca epocas={epocas} epocaAtivaId={epocaAtivaId} />

        {/* Indicador de evento hoje (treino/jogo) → dashboard */}
        <Link
          href="/dashboard"
          aria-label={
            eventoHoje ? "Tens um evento hoje — ver dashboard" : "Ir para o dashboard"
          }
          className="relative flex h-9 w-9 items-center justify-center rounded-full text-cinza-500 transition-colors hover:bg-cinza-100 hover:text-cinza-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
        >
          <Bell className="h-[18px] w-[18px]" aria-hidden />
          {eventoHoje && (
            <span className="absolute right-2 top-2 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-vermelho-600 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-vermelho-600" />
            </span>
          )}
        </Link>

        {/* Alternador de tema claro/escuro */}
        <AlternadorTema />

        {/* Menu utilizador */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex h-9 w-9 items-center justify-center rounded-full text-white text-legenda font-semibold select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
              style={{ backgroundColor: "var(--cor-primaria, #F0531E)" }}
              aria-label={`Menu de ${nomeUtilizador}`}
            >
              {iniciais(nomeUtilizador)}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-3 py-2">
              <p className="text-corpo font-medium text-cinza-900 truncate">
                {nomeUtilizador}
              </p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/definicoes/utilizadores" className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-cinza-400" />
                Alterar password
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={pending}
              onSelect={() => {
                startTransition(() => terminarSessao());
              }}
              className="flex items-center gap-2 text-vermelho-600 focus:text-vermelho-600"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
