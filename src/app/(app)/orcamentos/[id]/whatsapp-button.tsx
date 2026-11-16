"use client";

import { startTransition } from "react";
import { MessageCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

// Abre o WhatsApp com a mensagem pronta; num rascunho, também marca o orçamento como enviado.
export function WhatsAppButton({ href, onSend, label }: { href: string; onSend?: () => Promise<unknown>; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        if (onSend) startTransition(() => void onSend());
      }}
      className={buttonVariants({ size: "lg", variant: onSend ? "default" : "outline" })}
    >
      <MessageCircle aria-hidden="true" />
      {label}
      <span className="sr-only">(abre o WhatsApp em nova aba)</span>
    </a>
  );
}
