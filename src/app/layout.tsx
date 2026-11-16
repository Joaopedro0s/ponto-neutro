import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Geist, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { company } from "@/lib/company";

// Corpo: Geist · títulos e números: Barlow Condensed (sinalização) · placas e códigos: JetBrains Mono
const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const barlow = Barlow_Condensed({ variable: "--font-barlow", subsets: ["latin"], weight: ["500", "600", "700"] });
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"], weight: ["400", "500"] });

export const metadata: Metadata = {
  title: { default: company.fullName, template: `%s · ${company.name}` },
  description: "Agenda, orçamentos e ordens de serviço para estéticas e oficinas automotivas (demonstração com dados fictícios).",
};

export const viewport: Viewport = { themeColor: "#000000", colorScheme: "dark" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geist.variable} ${barlow.variable} ${jetbrains.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">
        {children}
      </body>
    </html>
  );
}
