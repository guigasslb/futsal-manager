"use client";

import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      position="top-center"
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
