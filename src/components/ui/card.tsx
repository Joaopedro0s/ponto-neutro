import { cn } from "@/lib/utils";

// Cartão: superfície nível 1 + borda sutil. Profundidade por contraste, sem sombra.
export function Card({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("rounded-xl border bg-card p-5", className)} {...props} />;
}

/** Cabeçalho de cartão: rótulo técnico (caixa alta) + ação opcional à direita. */
export function CardHeader({ title, id, action, description }: { title: string; id?: string; action?: React.ReactNode; description?: string }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h2 id={id} className="eyebrow">
          {title}
        </h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}
