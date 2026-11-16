"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, FileText, Gauge, ListChecks, LogOut, Menu, Users, Wrench, X } from "lucide-react";
import { Logo } from "@/components/logo";
import { logout } from "@/app/login/actions";
import { initials } from "@/lib/professionals";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/", label: "Painel", icon: Gauge, match: (p: string) => p === "/" },
  { href: "/agenda", label: "Agenda", icon: CalendarDays, match: (p: string) => p.startsWith("/agenda") },
  { href: "/clientes", label: "Clientes", icon: Users, match: (p: string) => p.startsWith("/clientes") || p.startsWith("/veiculos") },
  { href: "/orcamentos", label: "Orçamentos", icon: FileText, match: (p: string) => p.startsWith("/orcamentos") },
  { href: "/ordens", label: "Ordens de serviço", icon: Wrench, match: (p: string) => p.startsWith("/ordens") },
  { href: "/servicos", label: "Serviços", icon: ListChecks, match: (p: string) => p.startsWith("/servicos") },
];
// No celular, os quatro primeiros ficam na barra; o resto vai para "Mais".
const PRIMARY = ITEMS.slice(0, 4);
const MORE = ITEMS.slice(4);

function LogoutButton({ className }: { className?: string }) {
  return (
    <form action={logout}>
      <button type="submit" className={className}>
        <LogOut className="size-4" aria-hidden="true" />
        Sair
      </button>
    </form>
  );
}

/** Barra lateral fixa (a partir de 1024px). */
export function Sidebar({ userName }: { userName: string }) {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r bg-surface lg:flex">
      <Link href="/" className="flex h-16 items-center px-5" aria-label="Ponto Neutro, ir para o painel">
        <Logo />
      </Link>
      <nav aria-label="Principal" className="flex-1 px-3 py-4">
        <ul className="flex flex-col gap-1">
          {ITEMS.map(({ href, label, icon: Icon, match }) => {
            const active = match(pathname);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex h-10 items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground transition-colors duration-150 hover:bg-surface-2 hover:text-foreground",
                    active && "bg-accent-soft font-medium text-foreground",
                  )}
                >
                  {active && <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-primary" aria-hidden="true" />}
                  <Icon className={cn("size-[18px]", active && "text-primary")} aria-hidden="true" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="flex items-center gap-3 border-t p-4">
        <span className="grid size-9 place-items-center rounded-full bg-surface-2 font-display text-sm font-semibold" aria-hidden="true">
          {initials(userName)}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm">{userName}</span>
        <LogoutButton className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground" />
      </div>
    </aside>
  );
}

/** Barra inferior do celular, com menu "Mais" para o restante e a saída. */
export function BottomNav({ userName }: { userName: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  const panelRef = useRef<HTMLDivElement>(null);
  const moreActive = MORE.some((i) => i.match(pathname));

  // Fecha ao navegar (ajuste de estado durante a renderização, sem efeito).
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  // Com o menu aberto: foco no primeiro item e Esc fecha.
  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const itemClass = (active: boolean) =>
    cn(
      "flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-xs transition-colors duration-150",
      active ? "text-primary" : "text-muted-foreground hover:text-foreground",
    );

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-background/70 lg:hidden" onClick={() => setOpen(false)} aria-hidden="true" />}
      {open && (
        <div
          ref={panelRef}
          id="menu-mais"
          role="dialog"
          aria-label="Mais opções"
          className="fixed inset-x-3 bottom-20 z-50 animate-enter overscroll-contain rounded-2xl border bg-surface-2 p-2 lg:hidden"
        >
          <ul>
            {MORE.map(({ href, label, icon: Icon, match }) => (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={match(pathname) ? "page" : undefined}
                  className={cn("flex min-h-12 items-center gap-3 rounded-lg px-3 text-sm hover:bg-surface", match(pathname) && "text-primary")}
                >
                  <Icon className="size-5" aria-hidden="true" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex items-center gap-3 border-t px-3 pt-3 pb-1">
            <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{userName}</span>
            <LogoutButton className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-sm hover:bg-surface" />
          </div>
        </div>
      )}
      <nav aria-label="Principal" className="fixed inset-x-0 bottom-0 z-50 border-t bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden">
        <ul className="flex">
          {PRIMARY.map(({ href, label, icon: Icon, match }) => (
            <li key={href} className="flex flex-1">
              <Link href={href} aria-current={match(pathname) ? "page" : undefined} className={itemClass(match(pathname))}>
                <Icon className="size-5" aria-hidden="true" />
                {label}
              </Link>
            </li>
          ))}
          <li className="flex flex-1">
            <button
              type="button"
              aria-expanded={open}
              aria-controls={open ? "menu-mais" : undefined}
              onClick={() => setOpen((o) => !o)}
              className={itemClass(open || moreActive)}
            >
              {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
              Mais
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}
