import { cn } from "@/lib/utils";
import type { Tone } from "@/lib/labels";

const tones: Record<Tone, string> = {
  neutral: "bg-muted text-foreground/80",
  info: "bg-sky-100 text-sky-900",
  progress: "bg-amber-100 text-amber-900",
  success: "bg-emerald-100 text-emerald-900",
  danger: "bg-red-100 text-red-900",
};

export function StatusBadge({ label, tone, className }: { label: string; tone: Tone; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 w-fit shrink-0 items-center rounded-full px-2.5 text-xs font-medium whitespace-nowrap",
        tones[tone],
        className,
      )}
    >
      {label}
    </span>
  );
}
