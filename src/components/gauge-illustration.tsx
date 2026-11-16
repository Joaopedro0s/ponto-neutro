import { cn } from "@/lib/utils";

// Ilustração dos estados vazio, 404 e erro: um mostrador com o ponteiro parado (no zero, no meio ou no vermelho).
export function GaugeIllustration({ value = 0, tone = "muted", className }: { value?: number; tone?: "muted" | "accent" | "danger"; className?: string }) {
  const angle = -120 + Math.min(Math.max(value, 0), 1) * 240; // de -120° a +120°
  const needle = tone === "danger" ? "var(--danger)" : tone === "accent" ? "var(--primary)" : "var(--muted-foreground)";
  const ticks = Array.from({ length: 13 }, (_, i) => -120 + i * 20);
  return (
    <svg viewBox="0 0 120 84" aria-hidden="true" className={cn("w-28", className)}>
      <path d="M18 74 A48 48 0 1 1 102 74" fill="none" stroke="var(--border)" strokeWidth="6" strokeLinecap="round" />
      <path d="M86 32 A48 48 0 0 1 102 74" fill="none" stroke="var(--danger)" strokeOpacity="0.55" strokeWidth="6" strokeLinecap="round" />
      {ticks.map((t) => (
        <line key={t} x1="60" y1="20" x2="60" y2={t % 60 === 0 ? 27 : 24} stroke="var(--muted-foreground)" strokeWidth="1.5" transform={`rotate(${t} 60 62)`} />
      ))}
      <line x1="60" y1="62" x2="60" y2="28" stroke={needle} strokeWidth="3" strokeLinecap="round" transform={`rotate(${angle} 60 62)`} />
      <circle cx="60" cy="62" r="6" fill="var(--surface-2)" stroke={needle} strokeWidth="2.5" />
    </svg>
  );
}
