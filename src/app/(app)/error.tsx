"use client";

import { useEffect } from "react";
import { GaugeIllustration } from "@/components/gauge-illustration";
import { Button } from "@/components/ui/button";

export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => console.error(error), [error]);

  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-xl border bg-card px-6 py-12 text-center">
      <GaugeIllustration value={0.95} tone="danger" className="mb-2 w-28" />
      <h1 className="font-display text-3xl font-bold tracking-wide uppercase">Algo saiu do ponto</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Não foi possível carregar esta página. Pode ser uma falha momentânea de conexão com o banco. Tente de novo em instantes.
      </p>
      <Button size="lg" className="mt-2" onClick={() => retry()}>
        Tentar novamente
      </Button>
    </div>
  );
}
