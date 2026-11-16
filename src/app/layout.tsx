import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { company } from "@/lib/company";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: company.fullName, template: `%s · ${company.name}` },
  description: "Agenda, orçamentos e ordens de serviço para estéticas e oficinas automotivas (demonstração com dados fictícios).",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {children}
        <footer className="px-4 py-4 text-center text-xs text-muted-foreground">
          Projeto de demonstração · empresa, pessoas e valores são fictícios.
        </footer>
      </body>
    </html>
  );
}
