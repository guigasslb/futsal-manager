"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

export function Toaster(props: ToasterProps) {
  const { resolvedTheme } = useTheme();

  return (
    <Sonner
      position="top-center"
      theme={(resolvedTheme as ToasterProps["theme"]) ?? "dark"}
      toastOptions={{
        classNames: {
          toast:
            "rounded-md border border-cinza-200 bg-white text-cinza-900 shadow-card",
          success: "text-verde-600",
          error: "text-vermelho-600",
        },
      }}
      {...props}
    />
  );
}
