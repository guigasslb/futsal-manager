import Link from "next/link";
import { Users, CalendarRange, BarChart2, BookOpen, UserCog } from "lucide-react";

const SECCOES = [
  { href: "/definicoes/escaloes", label: "Escalões", descricao: "Criar e gerir os escalões do clube", icon: Users },
  { href: "/definicoes/epocas", label: "Épocas", descricao: "Criar épocas e definir a época ativa", icon: CalendarRange },
  { href: "/definicoes/metricas", label: "Métricas", descricao: "Configurar métricas de estatísticas de jogo", icon: BarChart2 },
  { href: "/definicoes/habilidades", label: "Habilidades", descricao: "Catálogo de habilidades para a caderneta", icon: BookOpen },
  { href: "/definicoes/utilizadores", label: "Utilizadores", descricao: "Gerir utilizadores e passwords", icon: UserCog },
];

export default function DefinicoesPage() {
  return (
    <div className="space-y-6">
      <h1>Definições</h1>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {SECCOES.map(({ href, label, descricao, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex min-h-[44px] items-center gap-4 rounded-md border border-cinza-200 bg-white p-4 shadow-card hover:border-azul-100 hover:bg-azul-50 transition-colors"
          >
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-azul-50">
              <Icon className="h-5 w-5 text-azul-700" />
            </div>
            <div>
              <p className="text-corpo font-semibold text-cinza-900">{label}</p>
              <p className="text-corpo-sec text-cinza-600">{descricao}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
