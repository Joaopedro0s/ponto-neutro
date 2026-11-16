import { GaugeIllustration } from "@/components/gauge-illustration";

export function EmptyState({ title, description, children }: { title: string; description?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed bg-card/40 px-6 py-10 text-center">
      <GaugeIllustration className="mb-2 w-20" />
      <p className="font-display text-xl font-semibold tracking-wide">{title}</p>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}
