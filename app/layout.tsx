import type { Metadata, Viewport } from "next";
import { Inter, Bricolage_Grotesque } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { RegistarSW } from "@/components/layout/RegistarSW";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: { default: "Mister", template: "Mister – %s" },
  description: "Gestão de treino e desenvolvimento do atleta, dedicada ao futsal",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Mister", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#141210",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-PT"
      className={`${inter.variable} ${display.variable}`}
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider>
          {children}
          <Toaster />
          <RegistarSW />
        </ThemeProvider>
      </body>
    </html>
  );
}
