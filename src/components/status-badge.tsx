import { cn } from "@/lib/utils";
import type { Tone } from "@/lib/labels";

// Selo de situação: fundo suave + texto na cor do status (≥ 4,5:1) + ponto. A palavra sempre acompanha a cor.
const tones: Record<Tone, string> = {
  neutral: "bg-surface-2 text-muted-foreground",
  info: "bg-info-soft text-info",
  progress: "bg-warning-soft text-warning",
  success: "bg-success-soft text-success",
  danger: "bg-danger-soft text-danger-fg",
};

export function StatusBadge({ label, tone, className }: { label: string; tone: Tone; className?: string }) {
  return (
    <span className={cn("inline-flex h-6 w-fit shrink-0 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium whitespace-nowrap", tones[tone], className)}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {label}
    </span>
  );
}
