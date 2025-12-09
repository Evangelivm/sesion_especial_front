import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "FSY Sesion Especial Lima 2026",
  description: "Sistema del FSY Sesion Especial Lima 2026",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <Toaster position="top-center" richColors />
        {children}
      </body>
    </html>
  );
}
