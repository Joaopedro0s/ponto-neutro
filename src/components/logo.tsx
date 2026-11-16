import { cn } from "@/lib/utils";
import { company } from "@/lib/company";

/*
 * Marca Ponto Neutro: o padrão em H do câmbio com a posição neutra (o centro) em laranja.
 * O quadro grafite faz o símbolo funcionar igual no tema escuro, em fundo claro (PDF) e a 16px.
 * As mesmas formas estão em src/app/icon.svg, src/app/apple-icon.tsx e src/lib/quote-pdf.tsx.
 */
export const LOGO = {
  tile: "#151515",
  line: "#ffffff",
  neutral: "#ff422a",
  // H de três vias: 1ª/2ª, 3ª/4ª e 5ª/ré, ligadas pela travessa do neutro.
  path: "M9.5 8v16M16 8v16M22.5 8v16M9.5 16h13",
} as const;

export function LogoMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 32 32" role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true} className={cn("size-8 shrink-0", className)}>
      <rect width="32" height="32" rx="8" fill={LOGO.tile} />
      <path d={LOGO.path} stroke={LOGO.line} strokeWidth="2.6" strokeLinecap="round" fill="none" />
      <circle cx="16" cy="16" r="3.8" fill={LOGO.neutral} stroke={LOGO.tile} strokeWidth="1.8" />
    </svg>
  );
}

/** Versão horizontal: símbolo + wordmark condensada. O texto herda a cor (funciona em fundo claro ou escuro). */
export function Logo({ className, size = "md", slogan = false }: { className?: string; size?: "md" | "lg"; slogan?: boolean }) {
  return (
    <span className={cn("inline-flex items-center", size === "lg" ? "gap-4" : "gap-2.5", className)}>
      <LogoMark className={size === "lg" ? "size-14" : "size-8"} />
      <span className="flex flex-col">
        <span translate="no" className={cn("font-display leading-none font-bold tracking-[0.06em] uppercase", size === "lg" ? "text-[2.5rem]" : "text-xl")}>
          Ponto <span className="text-primary">Neutro</span>
        </span>
        {slogan && <span className="mt-2 text-sm text-muted-foreground">{company.slogan}</span>}
      </span>
    </span>
  );
}
