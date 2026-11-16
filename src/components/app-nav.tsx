"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Painel", match: (p: string) => p === "/" },
  { href: "/agenda", label: "Agenda", match: (p: string) => p.startsWith("/agenda") },
  { href: "/orcamentos", label: "Orçamentos", match: (p: string) => p.startsWith("/orcamentos") },
  { href: "/ordens", label: "Ordens de serviço", match: (p: string) => p.startsWith("/ordens") },
  { href: "/clientes", label: "Clientes", match: (p: string) => p.startsWith("/clientes") || p.startsWith("/veiculos") },
  { href: "/servicos", label: "Serviços", match: (p: string) => p.startsWith("/servicos") },
];

export function AppNav({ className }: { className?: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Principal" className={className}>
      <ul className="flex gap-1">
        {items.map((item) => {
          const active = item.match(pathname);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex h-9 items-center rounded-lg px-3 text-sm whitespace-nowrap text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                  active && "bg-muted font-medium text-foreground",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
