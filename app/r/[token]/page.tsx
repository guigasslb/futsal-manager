import type { Metadata } from "next";
import type {
  AnaliticoAtleta,
  AnaliticoEscalao,
} from "@/lib/actions/analise";
import { obterRelatorioPorToken } from "@/lib/actions/analise";
import { LABEL_TIPO_RELATORIO } from "@/lib/schemas/analise";
import { PainelRelatorio } from "@/components/analiticos/PainelRelatorio";
import { BotaoImprimir } from "@/components/relatorios/BotaoImprimir";
import { LogoIcon } from "@/components/layout/Logo";

export const metadata: Metadata = {
  title: "Relatório — FutsalCoach",
  robots: { index: false, follow: false },
};

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

function formatarDataHora(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function assunto(tipo: string, dados: unknown, fallback: string): string {
  if (tipo === "EPOCA_ATLETA") return (dados as AnaliticoAtleta).atleta.nome;
  if (tipo === "EPOCA_EQUIPA") return (dados as AnaliticoEscalao).escalao.nome;
  return fallback;
}

export default async function RelatorioPublicoPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const res = await obterRelatorioPorToken(token);

  if (!res.sucesso) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cinza-50 p-6">
        <div className="max-w-md rounded-xl border border-cinza-200 bg-white p-8 text-center shadow-card">
          <div className="mb-4 flex justify-center">
            <LogoIcon size={48} />
          </div>
          <h1 className="text-titulo-seccao text-cinza-900">Relatório indisponível</h1>
          <p className="mt-2 text-corpo-sec text-cinza-600">
            Este relatório expirou ou não existe. Pede um novo link a quem o partilhou.
          </p>
        </div>
      </main>
    );
  }

  const { clube, epoca, tipo, dados, geradoEm } = res.dados;
  const hslClube = hexParaHslVar(clube.corPrimaria);
  const estiloClube = {
    "--cor-primaria": clube.corPrimaria,
    "--cor-secundaria": clube.corSecundaria,
    ...(hslClube ? { "--primary": hslClube, "--ring": hslClube } : {}),
  } as React.CSSProperties;

  const titulo = assunto(tipo, dados, clube.nome);

  return (
    <main className="min-h-screen bg-cinza-50 py-8" style={estiloClube}>
      <div className="mx-auto max-w-[900px] px-4">
        {/* Barra de ações (não impressa) */}
        <div className="mb-6 flex items-center justify-between print:hidden">
          <span className="flex items-center gap-2 text-legenda font-medium text-cinza-500">
            <LogoIcon size={22} />
            FutsalCoach
          </span>
          <BotaoImprimir label="Imprimir / Guardar PDF" />
        </div>

        <article className="rounded-xl border border-cinza-200 bg-white p-6 shadow-card sm:p-8 print:border-0 print:shadow-none">
          {/* Cabeçalho com identidade do clube */}
          <header className="mb-6 flex items-center gap-4 border-b border-cinza-200 pb-5">
            {clube.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={clube.logoUrl}
                alt=""
                aria-hidden
                className="h-14 w-14 flex-shrink-0 rounded-lg object-contain"
              />
            ) : (
              <span
                className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg text-titulo-seccao font-bold text-white"
                style={{ backgroundColor: "var(--cor-primaria, #F0531E)" }}
                aria-hidden
              >
                {clube.nome.charAt(0).toUpperCase()}
              </span>
            )}
            <div className="min-w-0">
              <p className="text-legenda uppercase tracking-wide text-cinza-500">
                {clube.nome} · {LABEL_TIPO_RELATORIO[tipo]}
              </p>
              <h1 className="leading-tight">{titulo}</h1>
              <p className="mt-0.5 text-corpo-sec text-cinza-600">
                {epoca.nome} · gerado a {formatarDataHora(geradoEm)}
              </p>
            </div>
          </header>

          <PainelRelatorio relatorio={res.dados} />
        </article>

        <p className="mt-6 text-center text-legenda text-cinza-400 print:hidden">
          Relatório gerado por FutsalCoach
        </p>
      </div>
    </main>
  );
}
