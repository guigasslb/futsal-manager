import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { listarEpocas } from "@/lib/actions/epocas";
import { obterEpocaAtiva } from "@/lib/epoca-context";
import { obterMembroAtual } from "@/lib/permissoes";
import { BarraTopo } from "@/components/layout/BarraTopo";
import { Navegacao } from "@/components/layout/Navegacao";

/** Converte um hex (#rrggbb) para "H S% L%" (formato das CSS vars do shadcn). */
function hexParaHslVar(hex: string): string | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Sessão obsoleta (JWT válido mas utilizador já não existe — ex.: BD reseeded):
  // enviar para /login (e não forçar /criar-clube).
  const utilizadorExiste = await prisma.utilizador.findUnique({
    where: { id: session.user.id },
    select: { id: true },
  });
  if (!utilizadorExiste) redirect("/login");

  // Sem clube ativo → onboarding (criar clube ou aceitar convite).
  const membro = await obterMembroAtual();
  if (!membro) redirect("/criar-clube");

  const [epocasResult, epocaAtiva] = await Promise.all([
    listarEpocas(),
    obterEpocaAtiva(),
  ]);
  const epocas = epocasResult.sucesso ? epocasResult.dados : [];
  const clube = membro.clube;

  // A cor do clube alimenta os acentos (via --cor-primaria) e a primária do
  // shadcn/ui (via --primary/--ring), para os botões seguirem o clube.
  const hslClube = hexParaHslVar(clube.corPrimaria);
  const estiloClube = {
    "--cor-primaria": clube.corPrimaria,
    "--cor-secundaria": clube.corSecundaria,
    ...(hslClube ? { "--primary": hslClube, "--ring": hslClube } : {}),
  } as React.CSSProperties;

  return (
    <div className="flex min-h-screen flex-col" style={estiloClube}>
      <BarraTopo
        nomeUtilizador={session.user.name ?? "Utilizador"}
        epocas={epocas}
        epocaAtivaId={epocaAtiva?.id ?? null}
      />

      <div className="flex flex-1 overflow-hidden">
        <Navegacao />

        <main className="app-surface flex-1 overflow-y-auto p-4 pb-20 md:pb-8 md:p-8">
          {/* Marca de água do clube (logótipo), visível em todos os tamanhos */}
          {clube.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={clube.logoUrl} alt="" aria-hidden className="club-watermark" />
          )}
          <div className="app-content mx-auto max-w-[1200px]">
            {!epocaAtiva && (
              <div className="mb-4 rounded-md border border-ambar-500/30 bg-ambar-500/10 px-4 py-3 text-corpo text-cinza-900">
                Nenhuma época ativa —{" "}
                <a href="/definicoes/epocas" className="font-medium underline">
                  define uma nas Definições
                </a>
                .
              </div>
            )}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
