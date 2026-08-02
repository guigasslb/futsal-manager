"use client";

import { useCallback, useRef, useState } from "react";
import {
  MousePointer2,
  User,
  Circle,
  Triangle,
  Goal,
  MoveRight,
  Minus,
  Type,
  Eraser,
  Undo2,
  Trash2,
  Check,
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CAMPO_W, CAMPO_H, LinhasCampo, ElementoSVG } from "./desenho";
import type {
  DiagramaCampo,
  ElementoCampo,
  CorJogador,
} from "@/lib/schemas/exercicio";

type Ferramenta =
  | "selecionar"
  | "jogador"
  | "bola"
  | "cone"
  | "baliza"
  | "seta"
  | "linha"
  | "texto"
  | "apagar";

type EstiloSeta = "movimento" | "passe" | "conducao";

const CORES_JOGADOR: { valor: CorJogador; hex: string; nome: string }[] = [
  { valor: "azul", hex: "#1A2FD4", nome: "Azul" },
  { valor: "vermelho", hex: "#DC2626", nome: "Vermelho" },
  { valor: "amarelo", hex: "#F5C518", nome: "Amarelo" },
  { valor: "verde", hex: "#16A34A", nome: "Verde" },
];

const FERRAMENTAS: { id: Ferramenta; label: string; Icon: typeof User }[] = [
  { id: "selecionar", label: "Selecionar", Icon: MousePointer2 },
  { id: "jogador", label: "Jogador", Icon: User },
  { id: "bola", label: "Bola", Icon: Circle },
  { id: "cone", label: "Cone", Icon: Triangle },
  { id: "baliza", label: "Baliza", Icon: Goal },
  { id: "seta", label: "Seta", Icon: MoveRight },
  { id: "linha", label: "Linha", Icon: Minus },
  { id: "texto", label: "Texto", Icon: Type },
  { id: "apagar", label: "Apagar", Icon: Eraser },
];

function novoId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function EditorCampo({
  valor,
  onChange,
}: {
  valor: DiagramaCampo;
  onChange: (d: DiagramaCampo) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [ferramenta, setFerramenta] = useState<Ferramenta>("selecionar");
  const [corJogador, setCorJogador] = useState<CorJogador>("azul");
  const [estiloSeta, setEstiloSeta] = useState<EstiloSeta>("movimento");
  const [orientacaoBaliza, setOrientacaoBaliza] = useState<
    "horizontal" | "vertical"
  >("vertical");
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);
  const [historico, setHistorico] = useState<ElementoCampo[][]>([]);
  const [caminhoAtual, setCaminhoAtual] = useState<{ x: number; y: number }[]>([]);
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [textoInline, setTextoInline] = useState<{ x: number; y: number } | null>(
    null,
  );

  const elementos = valor.elementos;

  const registarHistorico = useCallback(() => {
    setHistorico((h) => [...h.slice(-30), elementos]);
  }, [elementos]);

  const aplicar = useCallback(
    (novos: ElementoCampo[]) => {
      // Preserva os passos de animação ao editar os elementos.
      onChange({ versao: valor.passos?.length ? 2 : 1, elementos: novos, passos: valor.passos });
    },
    [onChange, valor.passos],
  );

  function capturarPasso() {
    const posicoes = elementos
      .filter((el): el is Extract<ElementoCampo, { x: number; y: number }> => "x" in el && "y" in el)
      .map((el) => ({ elementoId: el.id, x: el.x, y: el.y }));
    const passos = valor.passos ?? [];
    onChange({
      versao: 2,
      elementos,
      passos: [...passos, { id: novoId(), ordem: passos.length, posicoes }],
    });
  }

  function limparPassos() {
    onChange({ versao: 1, elementos, passos: [] });
  }

  function coordsDoEvento(e: React.PointerEvent): { x: number; y: number } | null {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * CAMPO_W;
    const y = ((e.clientY - rect.top) / rect.height) * CAMPO_H;
    return {
      x: Math.max(0, Math.min(CAMPO_W, x)),
      y: Math.max(0, Math.min(CAMPO_H, y)),
    };
  }

  function proximoNumero(cor: CorJogador): number {
    const numeros = elementos
      .filter((el) => el.tipo === "jogador" && el.cor === cor)
      .map((el) => (el.tipo === "jogador" ? (el.numero ?? 0) : 0));
    return numeros.length ? Math.max(...numeros) + 1 : 1;
  }

  function elementoEmPonto(x: number, y: number): ElementoCampo | null {
    // Procura de trás para a frente (elementos por cima primeiro)
    for (let i = elementos.length - 1; i >= 0; i--) {
      const el = elementos[i];
      if ("x" in el && "y" in el) {
        if (Math.hypot(el.x - x, el.y - y) <= 14) return el;
      } else if (el.pontos.length) {
        for (const p of el.pontos) {
          if (Math.hypot(p.x - x, p.y - y) <= 14) return el;
        }
      }
    }
    return null;
  }

  function handlePointerDown(e: React.PointerEvent) {
    if (textoInline) return;
    const coords = coordsDoEvento(e);
    if (!coords) return;
    const { x, y } = coords;

    switch (ferramenta) {
      case "selecionar": {
        const alvo = elementoEmPonto(x, y);
        if (alvo) {
          setSelecionadoId(alvo.id);
          if ("x" in alvo) setArrastando(alvo.id);
        } else {
          setSelecionadoId(null);
        }
        break;
      }
      case "apagar": {
        const alvo = elementoEmPonto(x, y);
        if (alvo) {
          registarHistorico();
          aplicar(elementos.filter((el) => el.id !== alvo.id));
          setSelecionadoId(null);
        }
        break;
      }
      case "jogador": {
        registarHistorico();
        aplicar([
          ...elementos,
          {
            id: novoId(),
            tipo: "jogador",
            x,
            y,
            cor: corJogador,
            numero: proximoNumero(corJogador),
          },
        ]);
        break;
      }
      case "bola": {
        registarHistorico();
        aplicar([...elementos, { id: novoId(), tipo: "bola", x, y }]);
        break;
      }
      case "cone": {
        registarHistorico();
        aplicar([...elementos, { id: novoId(), tipo: "cone", x, y }]);
        break;
      }
      case "baliza": {
        registarHistorico();
        aplicar([
          ...elementos,
          { id: novoId(), tipo: "baliza", x, y, orientacao: orientacaoBaliza },
        ]);
        break;
      }
      case "seta":
      case "linha": {
        setCaminhoAtual((c) => [...c, { x, y }]);
        break;
      }
      case "texto": {
        setTextoInline({ x, y });
        break;
      }
    }
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (ferramenta !== "selecionar" || !arrastando) return;
    const coords = coordsDoEvento(e);
    if (!coords) return;
    aplicar(
      elementos.map((el) =>
        el.id === arrastando && "x" in el ? { ...el, x: coords.x, y: coords.y } : el,
      ),
    );
  }

  function handlePointerUp() {
    if (arrastando) {
      // Regista o movimento no histórico ao largar (uma entrada por drag)
      setHistorico((h) => [...h.slice(-30), elementos]);
      setArrastando(null);
    }
  }

  function concluirCaminho() {
    if (caminhoAtual.length < 2) {
      setCaminhoAtual([]);
      return;
    }
    registarHistorico();
    if (ferramenta === "seta") {
      aplicar([
        ...elementos,
        {
          id: novoId(),
          tipo: "seta",
          estilo: estiloSeta,
          cor: "#1A1D29",
          pontos: caminhoAtual,
        },
      ]);
    } else {
      aplicar([
        ...elementos,
        { id: novoId(), tipo: "linha", cor: "#1A1D29", pontos: caminhoAtual },
      ]);
    }
    setCaminhoAtual([]);
  }

  function confirmarTexto(conteudo: string) {
    if (textoInline && conteudo.trim()) {
      registarHistorico();
      aplicar([
        ...elementos,
        {
          id: novoId(),
          tipo: "texto",
          x: textoInline.x,
          y: textoInline.y,
          conteudo: conteudo.trim().slice(0, 120),
        },
      ]);
    }
    setTextoInline(null);
  }

  function anular() {
    if (!historico.length) return;
    const anterior = historico[historico.length - 1];
    aplicar(anterior);
    setSelecionadoId(null);
    setHistorico((h) => h.slice(0, -1));
  }

  function limparTudo() {
    registarHistorico();
    aplicar([]);
    setSelecionadoId(null);
    setCaminhoAtual([]);
  }

  function apagarSelecionado() {
    if (!selecionadoId) return;
    registarHistorico();
    aplicar(elementos.filter((el) => el.id !== selecionadoId));
    setSelecionadoId(null);
  }

  const desenhandoCaminho = ferramenta === "seta" || ferramenta === "linha";

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      {/* Barra de ferramentas */}
      <div className="flex flex-shrink-0 flex-wrap gap-1.5 lg:w-40 lg:flex-col">
        {FERRAMENTAS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setFerramenta(id);
              setCaminhoAtual([]);
              setSelecionadoId(null);
            }}
            className={`flex items-center gap-2 rounded-md border px-3 py-2 text-corpo-sec transition-colors ${
              ferramenta === id
                ? "border-primary bg-primary/5 text-primary"
                : "border-cinza-200 text-cinza-700 hover:bg-cinza-50"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}

        <div className="mt-2 flex gap-1.5 lg:flex-col">
          <Button type="button" variant="outline" size="sm" onClick={anular} disabled={!historico.length}>
            <Undo2 className="h-4 w-4" />
            Anular
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-vermelho-600"
                disabled={!elementos.length}
              >
                <Trash2 className="h-4 w-4" />
                Limpar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Limpar todo o diagrama?</AlertDialogTitle>
                <AlertDialogDescription>
                  Todos os elementos serão removidos. Podes anular esta ação.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={limparTudo}
                  className="bg-vermelho-600 hover:bg-vermelho-600/90 text-white"
                >
                  Limpar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Campo + controlos contextuais */}
      <div className="flex-1 space-y-3">
        <div className="relative">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${CAMPO_W} ${CAMPO_H}`}
            className="w-full h-auto touch-none rounded-md border border-cinza-300"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onDoubleClick={desenhandoCaminho ? concluirCaminho : undefined}
          >
            <LinhasCampo />
            {elementos.map((el) => (
              <ElementoSVG key={el.id} elemento={el} selecionado={el.id === selecionadoId} />
            ))}
            {/* Caminho em construção */}
            {caminhoAtual.length > 0 && (
              <>
                <path
                  d={caminhoAtual
                    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
                    .join(" ")}
                  fill="none"
                  stroke="#F5C518"
                  strokeWidth={2}
                  strokeDasharray="4 3"
                />
                {caminhoAtual.map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y} r={3} fill="#F5C518" />
                ))}
              </>
            )}
          </svg>

          {/* Input de texto inline */}
          {textoInline && (
            <input
              autoFocus
              className="absolute rounded border border-primary bg-white px-2 py-1 text-corpo-sec shadow"
              style={{
                left: `${(textoInline.x / CAMPO_W) * 100}%`,
                top: `${(textoInline.y / CAMPO_H) * 100}%`,
                transform: "translate(-50%, -50%)",
              }}
              placeholder="Texto…"
              onKeyDown={(e) => {
                if (e.key === "Enter") confirmarTexto((e.target as HTMLInputElement).value);
                if (e.key === "Escape") setTextoInline(null);
              }}
              onBlur={(e) => confirmarTexto(e.target.value)}
            />
          )}
        </div>

        {/* Controlos contextuais */}
        <div className="flex flex-wrap items-center gap-3 rounded-md bg-cinza-50 p-3 text-corpo-sec">
          {ferramenta === "jogador" && (
            <div className="flex items-center gap-2">
              <span className="text-cinza-600">Cor:</span>
              {CORES_JOGADOR.map((c) => (
                <button
                  key={c.valor}
                  type="button"
                  aria-label={c.nome}
                  onClick={() => setCorJogador(c.valor)}
                  className={`h-6 w-6 rounded-full border-2 ${
                    corJogador === c.valor ? "border-cinza-900" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          )}

          {ferramenta === "seta" && (
            <div className="flex items-center gap-2">
              <span className="text-cinza-600">Estilo:</span>
              {(
                [
                  { v: "movimento", l: "Movimento (—)" },
                  { v: "passe", l: "Passe (- -)" },
                  { v: "conducao", l: "Condução (~)" },
                ] as const
              ).map((o) => (
                <button
                  key={o.v}
                  type="button"
                  onClick={() => setEstiloSeta(o.v)}
                  className={`rounded border px-2 py-1 ${
                    estiloSeta === o.v
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-cinza-200"
                  }`}
                >
                  {o.l}
                </button>
              ))}
            </div>
          )}

          {ferramenta === "baliza" && (
            <div className="flex items-center gap-2">
              <span className="text-cinza-600">Orientação:</span>
              {(
                [
                  { v: "vertical", l: "Vertical" },
                  { v: "horizontal", l: "Horizontal" },
                ] as const
              ).map((o) => (
                <button
                  key={o.v}
                  type="button"
                  onClick={() => setOrientacaoBaliza(o.v)}
                  className={`rounded border px-2 py-1 ${
                    orientacaoBaliza === o.v
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-cinza-200"
                  }`}
                >
                  {o.l}
                </button>
              ))}
            </div>
          )}

          {desenhandoCaminho && (
            <div className="flex items-center gap-2">
              <span className="text-cinza-600">
                {caminhoAtual.length === 0
                  ? "Toca no campo para adicionar pontos"
                  : `${caminhoAtual.length} ponto(s) — duplo-clique ou concluir`}
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={concluirCaminho}
                disabled={caminhoAtual.length < 2}
              >
                <Check className="h-4 w-4" />
                Concluir
              </Button>
              {caminhoAtual.length > 0 && (
                <Button type="button" size="sm" variant="ghost" onClick={() => setCaminhoAtual([])}>
                  Cancelar
                </Button>
              )}
            </div>
          )}

          {ferramenta === "selecionar" && selecionadoId && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="text-vermelho-600"
              onClick={apagarSelecionado}
            >
              <Trash2 className="h-4 w-4" />
              Apagar selecionado
            </Button>
          )}

          {ferramenta === "selecionar" && !selecionadoId && (
            <span className="text-cinza-500">
              Toca num elemento para o selecionar e arrastar.
            </span>
          )}
        </div>

        {/* Passos de animação (secção 11) */}
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-cinza-200 p-3 text-corpo-sec">
          <span className="font-medium text-cinza-700">Animação:</span>
          <Button type="button" size="sm" variant="outline" onClick={capturarPasso}>
            <Camera className="h-4 w-4" />
            Capturar passo
          </Button>
          <span className="text-cinza-500">{valor.passos?.length ?? 0} passo(s)</span>
          {(valor.passos?.length ?? 0) > 0 && (
            <Button type="button" size="sm" variant="ghost" className="text-vermelho-600" onClick={limparPassos}>
              Limpar passos
            </Button>
          )}
          <span className="text-legenda text-cinza-400">
            Posiciona os elementos e captura cada momento (A→B). O primeiro passo é a posição inicial.
          </span>
        </div>
      </div>
    </div>
  );
}
