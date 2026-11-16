import { cn } from "@/lib/utils";

// Tabela de dados: cabeçalho fixo em rótulo técnico, linhas com hover e foco visível.
export function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div className="overflow-clip rounded-xl border bg-card">
      <table className={cn("w-full border-collapse text-sm", className)} {...props} />
    </div>
  );
}
export const thClass = "eyebrow sticky top-0 z-10 bg-surface px-4 py-3 text-left first:pl-5 last:pr-5";
export const tdClass = "px-4 py-3 align-middle first:pl-5 last:pr-5";
export const trClass = "border-t transition-colors duration-150 hover:bg-surface-2 focus-within:bg-surface-2";
