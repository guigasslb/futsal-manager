"use client";

// Editor do template de comunicação do clube (bíblia §3.9, §8.12).
// Só se editam modelos do próprio clube — os globais do seed são apenas leitura
// (o backend recusa a edição; a UI oferece antes «Instalar templates base»).

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TextoGerado } from "@/components/comunicacoes/AccoesTexto";
import { editarModeloComunicacao } from "@/lib/actions/comunicacao";
import {
  placeholdersDoTemplate,
  substituirPlaceholders,
} from "@/lib/comunicacao-utils";
import { rotuloPlaceholder } from "@/lib/comunicacao-cliente";

export function EditorModelo({
  modelo,
  placeholdersDisponiveis,
}: {
  modelo: { id: string; nome: string; template: string };
  placeholdersDisponiveis: string[];
}) {
  const router = useRouter();
  const [nome, setNome] = useState(modelo.nome);
  const [template, setTemplate] = useState(modelo.template);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const areaRef = useRef<HTMLTextAreaElement>(null);

  // Pré-visualização com valores de exemplo (o rótulo de cada campo entre aspas).
  const preVisualizacao = useMemo(() => {
    const exemplo = Object.fromEntries(
      placeholdersDoTemplate(template).map((c) => [c, `«${rotuloPlaceholder(c)}»`]),
    );
    return substituirPlaceholders(template, exemplo);
  }, [template]);

  /** Insere `{{chave}}` na posição do cursor (ou no fim, se a área não tiver foco). */
  function inserirPlaceholder(chave: string) {
    const marca = `{{${chave}}}`;
    const area = areaRef.current;
    if (!area) {
      setTemplate((t) => t + marca);
      return;
    }
    const inicio = area.selectionStart ?? template.length;
    const fim = area.selectionEnd ?? template.length;
    const novo = template.slice(0, inicio) + marca + template.slice(fim);
    setTemplate(novo);
    requestAnimationFrame(() => {
      area.focus();
      const cursor = inicio + marca.length;
      area.setSelectionRange(cursor, cursor);
    });
  }

  function submeter(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);
    startTransition(async () => {
      const res = await editarModeloComunicacao({ id: modelo.id, nome, template });
      if (res.sucesso) {
        toast.success("Template guardado");
        router.push("/comunicacoes");
        router.refresh();
      } else {
        setErro(res.erro);
        toast.error(res.erro);
      }
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={submeter} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="nome">Nome do template *</Label>
          <Input
            id="nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            minLength={1}
            maxLength={100}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="template">Texto do template *</Label>
          <Textarea
            id="template"
            ref={areaRef}
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            required
            minLength={1}
            maxLength={5000}
            rows={16}
            className="font-mono text-corpo-sec"
          />
          <p className="text-legenda text-cinza-500">
            Formatação do WhatsApp: *negrito*, _itálico_. Campos por preencher escrevem-se
            entre chavetas duplas, por exemplo {"{{nomeEquipa}}"}. Os campos sem valor são
            removidos ao gerar a mensagem.
          </p>
        </div>

        {erro && <p className="text-corpo-sec text-vermelho-600">{erro}</p>}

        <Button type="submit" disabled={pending}>
          <Save className="h-4 w-4" />
          {pending ? "A guardar…" : "Guardar template"}
        </Button>
      </form>

      <div className="space-y-5">
        <div className="space-y-2">
          <h2 className="text-subtitulo text-cinza-900">Campos disponíveis</h2>
          <p className="text-legenda text-cinza-500">
            Clica num campo para o inserir na posição do cursor.
          </p>
          <ul className="flex flex-wrap gap-2">
            {placeholdersDisponiveis.map((chave) => (
              <li key={chave}>
                <button
                  type="button"
                  onClick={() => inserirPlaceholder(chave)}
                  title={`Inserir {{${chave}}}`}
                  className="min-h-[44px] rounded-full border border-cinza-200 bg-white px-3 py-1.5 text-legenda text-cinza-700 shadow-card transition-colors hover:border-primary/25 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {rotuloPlaceholder(chave)}
                  <span className="ml-1.5 font-mono text-cinza-400">
                    {`{{${chave}}}`}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-2">
          <h2 className="text-subtitulo text-cinza-900">Pré-visualização</h2>
          <TextoGerado texto={preVisualizacao} />
        </div>
      </div>
    </div>
  );
}
