import { cn } from "@/lib/utils";
import { company } from "@/lib/company";

// Marca: o "H" do câmbio manual com o ponto no neutro.
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-8 shrink-0", className)}>
      <rect width="32" height="32" rx="8" fill="var(--brand)" />
      <path
        d="M9 8v16M16 8v16M23 8v16M9 16h14"
        stroke="var(--brand-foreground)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx="16" cy="16" r="3.4" fill="var(--brand-accent)" stroke="var(--brand)" strokeWidth="1.6" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="text-base font-semibold tracking-tight">{company.name}</span>
    </span>
  );
}
