"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditorCampo } from "@/components/campo/EditorCampo";
import { CampoFutsal } from "@/components/campo/CampoFutsal";
import { CampoAnimado } from "@/components/campo/CampoAnimado";
import { atualizarModeloJogo } from "@/lib/actions/modeloJogo";
import { DIAGRAMA_VAZIO_V2, type DiagramaCampo } from "@/lib/schemas/exercicio";
import type { MomentoJogo, PropriedadeConteudo } from "@prisma/client";

/**
 * Campos do modelo reenviados em cada gravação. `atualizarModeloJogo` valida o
 * documento completo, por isso o diagrama nunca é gravado isoladamente — caso
 * contrário, os restantes campos seriam limpos (ver `modeloJogoSchema`).
 */
export type ModeloParaDiagrama = {
  id: string;
  nome: string;
  momento: MomentoJogo;
  principios: string | null;
  proprietario: PropriedadeConteudo;
  escalaoId: string | null;
  epocaId: string | null;
  subprincipiosLista: string[];
};

export function DiagramaModeloJogo({
  modelo,
  diagramaInicial,
}: {
  modelo: ModeloParaDiagrama;
  diagramaInicial: DiagramaCampo | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editar, setEditar] = useState(false);
  const [diagrama, setDiagrama] = useState<DiagramaCampo>(
    diagramaInicial ?? DIAGRAMA_VAZIO_V2,
  );
  // Cópia de segurança para restaurar ao cancelar a edição.
  const [gravado, setGravado] = useState<DiagramaCampo>(
    diagramaInicial ?? DIAGRAMA_VAZIO_V2,
  );

  const temElementos = gravado.elementos.length > 0;
  const temAnimacao = (gravado.passos?.length ?? 0) > 0;

  function guardar() {
    startTransition(async () => {
      const res = await atualizarModeloJogo(modelo.id, {
        nome: modelo.nome,
        momento: modelo.momento,
        principios: modelo.principios ?? undefined,
        subprincipios: modelo.subprincipiosLista,
        proprietario: modelo.proprietario,
        escalaoId: modelo.escalaoId,
        epocaId: modelo.epocaId,
        diagrama,
      });
      if (res.sucesso) {
        setGravado(diagrama);
        setEditar(false);
        toast.success("Diagrama guardado");
        router.refresh();
      } else {
        toast.error(res.erro);
      }
    });
  }

  function cancelar() {
    setDiagrama(gravado);
    setEditar(false);
  }

  return (
    <section className="space-y-3 rounded-lg border border-cinza-200 bg-white p-5 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-subtitulo text-cinza-900">Representação gráfica</h2>
        {!editar && (
          <Button variant="outline" size="sm" onClick={() => setEditar(true)}>
            {temElementos ? (
              <>
                <Pencil className="h-4 w-4" />
                Editar diagrama
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Adicionar diagrama
              </>
            )}
          </Button>
        )}
      </div>

      {editar ? (
        <div className="space-y-4">
          <EditorCampo valor={diagrama} onChange={setDiagrama} />
          <div className="flex gap-3">
            <Button onClick={guardar} disabled={pending}>
              {pending ? "A guardar…" : "Guardar diagrama"}
            </Button>
            <Button variant="outline" onClick={cancelar} disabled={pending}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : temElementos ? (
        <div className="max-w-2xl">
          {temAnimacao ? (
            <CampoAnimado diagrama={gravado} />
          ) : (
            <CampoFutsal diagrama={gravado} />
          )}
        </div>
      ) : (
        <p className="text-corpo-sec text-cinza-500">
          Sem diagrama. Desenha o posicionamento e os movimentos deste momento.
        </p>
      )}
    </section>
  );
}
