"use client";

import { useEffect } from "react";

export function RegistarSW() {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Falha silenciosa — a app funciona na mesma sem SW.
      });
    }
  }, []);
  return null;
}
