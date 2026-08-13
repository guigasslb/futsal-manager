"use client";

import { useEffect } from "react";

/**
 * Error boundary raiz — cobre erros no root layout e em rotas fora do grupo (app).
 * Tem de renderizar o seu próprio <html>/<body> porque substitui o layout raiz.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Ponto de integração de monitorização de erros (ex.: Sentry). Ver docs/deploy.
    console.error("GlobalError:", error);
  }, [error]);

  return (
    <html lang="pt-PT">
      <body
        style={{
          fontFamily: "Inter, system-ui, sans-serif",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          margin: 0,
          background: "#FAF9F7",
          color: "#1A1D29",
        }}
      >
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
            Ocorreu um erro inesperado
          </h1>
          <p style={{ fontSize: 14, color: "#4A4F63", marginBottom: 20 }}>
            Pedimos desculpa. Tenta novamente; se o problema persistir, contacta o suporte.
          </p>
          <button
            onClick={reset}
            style={{
              height: 44,
              padding: "0 20px",
              borderRadius: 8,
              border: "none",
              background: "#C7430F",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  );
}
