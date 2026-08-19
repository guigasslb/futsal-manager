import { AlertCircle } from "lucide-react";
import { LogoIcon } from "@/components/layout/Logo";

/**
 * Degradação graciosa do AppLayout quando a base de dados está inacessível
 * (ex.: Supabase P1001 / pool esgotado P2024). Server Component puro — não
 * depende de dados de BD nem de auth, apenas do branding Mister.
 *
 * O retry usa `<a href=".">`, que recarrega a rota atual sem exigir um Client
 * Component (evita bundle JS extra num ecrã de erro).
 */
export function ServicoIndisponivel() {
  return (
    <div className="flex min-h-screen flex-col bg-cinza-50">
      <header className="flex h-16 items-center gap-3 border-b border-cinza-200 bg-white px-4 md:px-6">
        <LogoIcon size={32} />
        <span
          className="text-lg font-bold text-cinza-900"
          style={{
            fontFamily:
              "var(--font-display), 'Bricolage Grotesque', system-ui, sans-serif",
          }}
        >
          Mister
        </span>
      </header>

      <main className="flex flex-1 items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-ambar-500/10">
            <AlertCircle className="h-8 w-8 text-ambar-600" aria-hidden />
          </div>
          <h1 className="text-subtitulo text-cinza-900">
            Serviço temporariamente indisponível
          </h1>
          <p className="mt-2 text-corpo-sec text-cinza-600">
            Não foi possível contactar a base de dados neste momento. É
            normalmente temporário — tenta novamente dentro de alguns instantes.
          </p>
          <a
            href="."
            className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-md bg-primary px-6 text-corpo font-medium text-white transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Tentar novamente
          </a>
        </div>
      </main>
    </div>
  );
}
