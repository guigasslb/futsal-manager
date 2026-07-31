"use client";

import { EstadoErro } from "@/components/layout/EstadosUI";

export default function Error({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <EstadoErro
      mensagem="Ocorreu um erro inesperado nesta página."
      tentarNovamente={reset}
    />
  );
}
