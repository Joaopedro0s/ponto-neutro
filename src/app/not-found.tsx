import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-16 text-center">
      <p className="text-sm font-medium text-muted-foreground">Erro 404</p>
      <h1 className="text-2xl font-semibold tracking-tight">Página não encontrada</h1>
      <p className="max-w-sm text-sm text-muted-foreground">O endereço pode estar errado ou o registro foi excluído.</p>
      <Link href="/" className={buttonVariants({ size: "lg", className: "mt-2" })}>
        Voltar ao painel
      </Link>
    </div>
  );
}
