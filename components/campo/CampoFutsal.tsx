import { FormatoJogo } from "@prisma/client";
import { CampoDesenho } from "./CampoDesenho";
import type { DiagramaCampo } from "@/lib/schemas/exercicio";

/**
 * Alias retrocompatível de {@link CampoDesenho}. Mantém a assinatura histórica
 * (só `diagrama`/`className`) e passa a suportar o `formato` do diagrama (§11.5).
 * Diagramas legados sem `campo` continuam a render como futsal.
 */
export function CampoFutsal({
  diagrama,
  formato,
  className,
}: {
  diagrama: DiagramaCampo;
  formato?: FormatoJogo;
  className?: string;
}) {
  return <CampoDesenho diagrama={diagrama} formato={formato} className={className} />;
}
