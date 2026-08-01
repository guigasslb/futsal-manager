import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { RegistarSW } from "@/components/layout/RegistarSW";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "FutsalManager",
  description: "Gestão de treino e equipas dedicada ao futsal",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Futsal", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#1A2FD4",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-PT" className={inter.variable}>
      <body>
        {children}
        <Toaster />
        <RegistarSW />
      </body>
    </html>
  );
}
