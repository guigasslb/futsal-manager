import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { cardQuerySchema, LABEL_TIPO_CARD } from "@/lib/schemas/social";
import { validarTokenCard } from "@/lib/social/token";
import {
  obterCardMvp,
  obterCardRanking,
  obterCardResultado,
  type CardMvpData,
  type CardRankingData,
  type CardResultadoData,
  type IdentidadeClubeCard,
} from "@/lib/social/card-data";

// Prisma exige runtime Node; o card é sempre dinâmico (dados por pedido).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TAMANHO = 1080;
const TINTA = "#141210";
const TINTA_SUAVE = "#26221E";
const CLARO = "#F4F1EC";
const MUTED = "#A8A29A";
const LARANJA_MARCA = "#F0531E";

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function normalizarHex(cor: string, fallback: string): string {
  return /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.test(cor.trim()) ? cor.trim() : fallback;
}

function iniciais(nome: string): string {
  return nome.trim().charAt(0).toUpperCase() || "F";
}

/** Emblema do clube: logótipo se disponível, senão inicial em bloco de cor. */
function Emblema({
  clube,
  accent,
  usarLogo,
}: {
  clube: IdentidadeClubeCard;
  accent: string;
  usarLogo: boolean;
}) {
  if (usarLogo && clube.logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={clube.logoUrl}
        alt=""
        width={132}
        height={132}
        style={{ width: 132, height: 132, borderRadius: 24, objectFit: "contain" }}
      />
    );
  }
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 132,
        height: 132,
        borderRadius: 24,
        backgroundColor: accent,
        color: "#FFFFFF",
        fontSize: 68,
        fontWeight: 800,
      }}
    >
      {iniciais(clube.nome)}
    </div>
  );
}

function Cabecalho({
  clube,
  accent,
  usarLogo,
  etiqueta,
}: {
  clube: IdentidadeClubeCard;
  accent: string;
  usarLogo: boolean;
  etiqueta: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
      <Emblema clube={clube} accent={accent} usarLogo={usarLogo} />
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", fontSize: 44, fontWeight: 800, color: CLARO }}>
          {clube.nome}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 8,
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: accent,
          }}
        >
          {etiqueta}
        </div>
      </div>
    </div>
  );
}

function Rodape() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 44,
          height: 44,
          borderRadius: 12,
          backgroundColor: LARANJA_MARCA,
          color: "#FFFFFF",
          fontSize: 26,
          fontWeight: 800,
        }}
      >
        F
      </div>
      <div style={{ display: "flex", fontSize: 30, fontWeight: 700, color: MUTED }}>
        FutsalCoach
      </div>
    </div>
  );
}

/** Estrutura comum a todos os cards (1080×1080). */
function Moldura({
  clube,
  accent,
  usarLogo,
  etiqueta,
  children,
}: {
  clube: IdentidadeClubeCard;
  accent: string;
  usarLogo: boolean;
  etiqueta: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: TAMANHO,
        height: TAMANHO,
        padding: 80,
        backgroundColor: TINTA,
        justifyContent: "space-between",
      }}
    >
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: 0,
          left: 0,
          width: TAMANHO,
          height: 16,
          backgroundColor: accent,
        }}
      />
      <Cabecalho clube={clube} accent={accent} usarLogo={usarLogo} etiqueta={etiqueta} />
      <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>
        {children}
      </div>
      <Rodape />
    </div>
  );
}

function ConteudoResultado({ d, accent }: { d: CardResultadoData; accent: string }) {
  const emCasa = d.casaFora === "CASA";
  const esquerda = emCasa ? d.clube.nome : d.adversario;
  const direita = emCasa ? d.adversario : d.clube.nome;
  const golosEsquerda = emCasa ? d.golosMarcados : d.golosSofridos;
  const golosDireita = emCasa ? d.golosSofridos : d.golosMarcados;

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", flex: 1, fontSize: 52, fontWeight: 800, color: CLARO }}>
          {esquerda}
        </div>
        <div style={{ display: "flex", padding: "0 24px", fontSize: 40, fontWeight: 700, color: MUTED }}>
          vs
        </div>
        <div
          style={{
            display: "flex",
            flex: 1,
            fontSize: 52,
            fontWeight: 800,
            color: CLARO,
            justifyContent: "flex-end",
            textAlign: "right",
          }}
        >
          {direita}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 40,
          marginTop: 48,
          marginBottom: 48,
        }}
      >
        <div style={{ display: "flex", fontSize: 220, fontWeight: 800, color: CLARO }}>
          {golosEsquerda}
        </div>
        <div style={{ display: "flex", fontSize: 160, fontWeight: 700, color: accent }}>–</div>
        <div style={{ display: "flex", fontSize: 220, fontWeight: 800, color: CLARO }}>
          {golosDireita}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          fontSize: 34,
          color: MUTED,
        }}
      >
        {[formatarData(d.data), d.escalaoNome, d.competicao ?? undefined]
          .filter(Boolean)
          .join("  ·  ")}
      </div>
    </div>
  );
}

function ConteudoMvp({ d, accent }: { d: CardMvpData; accent: string }) {
  const linhas: string[] = [];
  if (d.golos > 0) linhas.push(`${d.golos} ${d.golos === 1 ? "golo" : "golos"}`);
  if (d.assistencias > 0)
    linhas.push(`${d.assistencias} ${d.assistencias === 1 ? "assistência" : "assistências"}`);
  if (d.eGuardaRedes && d.defesas != null && d.defesas > 0)
    linhas.push(`${d.defesas} ${d.defesas === 1 ? "defesa" : "defesas"}`);

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div
        style={{
          display: "flex",
          fontSize: 40,
          fontWeight: 700,
          letterSpacing: 3,
          textTransform: "uppercase",
          color: accent,
        }}
      >
        Homem do jogo
      </div>
      <div style={{ display: "flex", marginTop: 20, fontSize: 108, fontWeight: 800, color: CLARO, lineHeight: 1.05 }}>
        {d.atleta}
      </div>
      <div style={{ display: "flex", marginTop: 32, fontSize: 46, fontWeight: 700, color: "#FFFFFF" }}>
        {linhas.length > 0 ? linhas.join("  ·  ") : "Desempenho decisivo"}
      </div>
      <div style={{ display: "flex", marginTop: 40, fontSize: 34, color: MUTED }}>
        {[formatarData(d.data), `vs ${d.adversario}`, d.escalaoNome].join("  ·  ")}
      </div>
    </div>
  );
}

function ConteudoRanking({ d, accent }: { d: CardRankingData; accent: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div
        style={{
          display: "flex",
          fontSize: 40,
          fontWeight: 700,
          letterSpacing: 3,
          textTransform: "uppercase",
          color: accent,
          marginBottom: 28,
        }}
      >
        Top 5 marcadores
      </div>
      {d.top.length === 0 ? (
        <div style={{ display: "flex", fontSize: 44, color: MUTED }}>
          Ainda sem golos registados esta época.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {d.top.map((m, i) => (
            <div
              key={`${m.nome}-${i}`}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "18px 28px",
                borderRadius: 18,
                backgroundColor: TINTA_SUAVE,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 56,
                    height: 56,
                    borderRadius: 14,
                    backgroundColor: accent,
                    color: "#FFFFFF",
                    fontSize: 32,
                    fontWeight: 800,
                  }}
                >
                  {i + 1}
                </div>
                <div style={{ display: "flex", fontSize: 46, fontWeight: 700, color: CLARO }}>
                  {m.nome}
                </div>
              </div>
              <div style={{ display: "flex", fontSize: 46, fontWeight: 800, color: CLARO }}>
                {m.golos}
              </div>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: "flex", marginTop: 34, fontSize: 34, color: MUTED }}>
        {[d.epocaNome, d.escalaoNome].join("  ·  ")}
      </div>
    </div>
  );
}

function render(
  clube: IdentidadeClubeCard,
  accent: string,
  usarLogo: boolean,
  etiqueta: string,
  conteudo: React.ReactNode,
): ImageResponse {
  return new ImageResponse(
    (
      <Moldura clube={clube} accent={accent} usarLogo={usarLogo} etiqueta={etiqueta}>
        {conteudo}
      </Moldura>
    ),
    {
      width: TAMANHO,
      height: TAMANHO,
      headers: {
        "Cache-Control": "private, max-age=300",
        "Content-Type": "image/png",
      },
    },
  );
}

export async function GET(req: NextRequest): Promise<Response> {
  const parsed = cardQuerySchema.safeParse(
    Object.fromEntries(req.nextUrl.searchParams),
  );
  if (!parsed.success) {
    return new Response("Parâmetros inválidos", { status: 400 });
  }
  const { tipo, jogoId, escalaoId, epocaId, token } = parsed.data;

  if (!validarTokenCard(tipo, { jogoId, escalaoId, epocaId }, token)) {
    return new Response("Token inválido", { status: 403 });
  }

  const accentDe = (clube: IdentidadeClubeCard) =>
    normalizarHex(clube.corPrimaria, LARANJA_MARCA);

  try {
    if (tipo === "resultado") {
      const res = await obterCardResultado(jogoId!);
      if (!res.ok) return new Response(res.mensagem, { status: res.status });
      const accent = accentDe(res.dados.clube);
      const conteudo = <ConteudoResultado d={res.dados} accent={accent} />;
      const etiqueta = LABEL_TIPO_CARD.resultado;
      try {
        return render(res.dados.clube, accent, true, etiqueta, conteudo);
      } catch {
        return render(res.dados.clube, accent, false, etiqueta, conteudo);
      }
    }

    if (tipo === "mvp") {
      const res = await obterCardMvp(jogoId!);
      if (!res.ok) return new Response(res.mensagem, { status: res.status });
      const accent = accentDe(res.dados.clube);
      const conteudo = <ConteudoMvp d={res.dados} accent={accent} />;
      const etiqueta = LABEL_TIPO_CARD.mvp;
      try {
        return render(res.dados.clube, accent, true, etiqueta, conteudo);
      } catch {
        return render(res.dados.clube, accent, false, etiqueta, conteudo);
      }
    }

    // ranking
    const res = await obterCardRanking(escalaoId!, epocaId!);
    if (!res.ok) return new Response(res.mensagem, { status: res.status });
    const accent = accentDe(res.dados.clube);
    const conteudo = <ConteudoRanking d={res.dados} accent={accent} />;
    const etiqueta = LABEL_TIPO_CARD.ranking;
    try {
      return render(res.dados.clube, accent, true, etiqueta, conteudo);
    } catch {
      return render(res.dados.clube, accent, false, etiqueta, conteudo);
    }
  } catch {
    return new Response("Não foi possível gerar o card", { status: 500 });
  }
}
