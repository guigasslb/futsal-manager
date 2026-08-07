// Cópia para a área de transferência resiliente a contextos sem Clipboard API
// (ex.: http local em tablet). Função de cliente pura — importada apenas por
// Client Components. Sem "use server"/"use client": é um módulo utilitário.

export async function copiarTexto(texto: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(texto);
      return true;
    } catch {
      // Sem permissão ou contexto inseguro — tenta a alternativa abaixo.
    }
  }
  if (typeof document === "undefined") return false;
  try {
    const campo = document.createElement("textarea");
    campo.value = texto;
    campo.setAttribute("readonly", "");
    campo.style.position = "fixed";
    campo.style.top = "-1000px";
    campo.style.opacity = "0";
    document.body.appendChild(campo);
    campo.select();
    const copiado = document.execCommand("copy");
    document.body.removeChild(campo);
    return copiado;
  } catch {
    return false;
  }
}
