import Link from "next/link";
import { exigirAdminPlataforma } from "@/lib/admin-guard";
import { Logo } from "@/components/layout/Logo";

// Backoffice interno do produto Mister (§ Fase 1). Shell mínimo e próprio,
// distinto do shell da app (BarraTopo/Navegacao dependem de clube/época, que
// não existem no contexto de plataforma). A marca é sempre Mister (fixa); não
// há cor de clube aqui.
export const metadata = {
  title: "Mister Admin",
};

const TABS = [
  { href: "/admin", rotulo: "Licenças" },
  { href: "/admin/monitorizacao", rotulo: "Monitorização" },
] as const;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Guarda de plataforma: redireciona para /dashboard se não for admin.
  await exigirAdminPlataforma();

  return (
    <div className="flex min-h-screen flex-col bg-[#EDEBE7]">
      {/* Barra de topo — fundo escuro (preto quente da marca), wordmark + "Admin". */}
      <header className="bg-[#141210] text-white">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center gap-3 px-4">
          <Link href="/admin" className="flex items-center gap-2">
            <Logo size={20} variant="dark" />
          </Link>
          <span
            className="rounded-full bg-[#F0531E] px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-white"
            aria-label="Backoffice de plataforma"
          >
            Admin
          </span>
        </div>

        {/* Navegação por tabs. */}
        <nav
          className="mx-auto flex max-w-[1200px] gap-1 px-4"
          aria-label="Navegação do backoffice"
        >
          {TABS.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className="border-b-2 border-transparent px-3 py-2.5 text-sm font-medium text-white/70 transition-colors hover:border-[#F0531E] hover:text-white"
            >
              {tab.rotulo}
            </Link>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-[1200px] flex-1 p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}
