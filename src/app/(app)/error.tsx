"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => console.error(error), [error]);

  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-xl border p-6">
      <h1 className="text-lg font-semibold">Não foi possível carregar esta página</h1>
      <p className="text-sm text-muted-foreground">
        Pode ser uma falha momentânea de conexão com o banco. Tente de novo em instantes.
      </p>
      <Button onClick={() => retry()}>Tentar novamente</Button>
    </div>
  );
}
