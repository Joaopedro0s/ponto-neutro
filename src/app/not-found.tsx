import Link from "next/link";
import { GaugeIllustration } from "@/components/gauge-illustration";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-16 text-center">
      <GaugeIllustration className="mb-2 w-32" />
      <p className="eyebrow">Erro 404</p>
      <h1 className="font-display text-4xl font-bold tracking-wide uppercase">Rota não encontrada</h1>
      <p className="max-w-sm text-sm text-muted-foreground">O endereço pode estar errado ou o registro foi excluído.</p>
      <Link href="/" className={buttonVariants({ size: "lg", className: "mt-3" })}>
        Voltar ao painel
      </Link>
    </div>
  );
}
