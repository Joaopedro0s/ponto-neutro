import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatBRL, formatDate } from "@/lib/format";
import { formatQuoteNumber, quoteStatus } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { Prisma } from "@/generated/prisma/client";
import type { QuoteStatus } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "Orçamentos" };

// shortcut: mostra os 100 mais recentes do filtro, sem paginação; paginar se a base crescer.
const LIMIT = 100;
const STATUSES = Object.keys(quoteStatus) as QuoteStatus[];

export default async function QuotesPage({ searchParams }: PageProps<"/orcamentos">) {
  await requireUser();
  const sp = await searchParams;
  const q = String(sp.q ?? "").trim();
  const status = STATUSES.find((s) => s === sp.situacao);
  const number = Number(q.replace(/\D/g, ""));
  const plate = q.toUpperCase().replace(/[^A-Z0-9]/g, "");

  const search: Prisma.QuoteWhereInput = q
    ? {
        OR: [
          { customer: { name: { contains: q, mode: "insensitive" } } },
          ...(plate.length >= 3 ? [{ vehicle: { plate: { contains: plate } } }] : []),
          ...(number > 0 && number < 2 ** 31 ? [{ number }] : []),
        ],
      }
    : {};

  const [quotes, counts] = await Promise.all([
    db.quote.findMany({
      where: { ...search, ...(status ? { status } : {}) },
      orderBy: { createdAt: "desc" },
      take: LIMIT,
      select: {
        id: true,
        number: true,
        status: true,
        total: true,
        createdAt: true,
        customer: { select: { name: true } },
        vehicle: { select: { plate: true, model: true } },
      },
    }),
    db.quote.groupBy({ by: ["status"], where: search, _count: true }),
  ]);
  const countOf = (s?: QuoteStatus) => counts.filter((c) => !s || c.status === s).reduce((n, c) => n + c._count, 0);
  const href = (s?: QuoteStatus) => `/orcamentos?${new URLSearchParams({ ...(q ? { q } : {}), ...(s ? { situacao: s } : {}) })}`;

  return (
    <>
      <PageHeader title="Orçamentos" description={`${countOf()} orçamentos${q ? ` para “${q}”` : ""}`}>
        <Link href="/orcamentos/novo" className={buttonVariants({ size: "lg" })}>
          <Plus aria-hidden="true" />
          Novo orçamento
        </Link>
      </PageHeader>

      <form role="search" className="mb-4 flex max-w-xl gap-2">
        <Label htmlFor="q" className="sr-only">
          Buscar por cliente, placa ou número
        </Label>
        <Input id="q" name="q" type="search" defaultValue={q} placeholder="Cliente, placa ou número" className="h-10" />
        {status && <input type="hidden" name="situacao" value={status} />}
        <Button type="submit" variant="outline" size="lg" className="h-10">
          <Search aria-hidden="true" />
          Buscar
        </Button>
      </form>

      <nav aria-label="Filtrar por situação" className="mb-4 overflow-x-auto">
        <ul className="flex gap-1">
          {[undefined, ...STATUSES].map((s) => (
            <li key={s ?? "todos"}>
              <Link
                href={href(s)}
                aria-current={status === s ? "page" : undefined}
                className={cn(
                  "inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm whitespace-nowrap text-muted-foreground hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                  status === s && "bg-muted font-medium text-foreground",
                )}
              >
                {s ? quoteStatus[s].label : "Todos"}
                <span className="tabular-nums text-xs text-foreground/70">{countOf(s)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {quotes.length === 0 ? (
        <EmptyState
          title={q || status ? "Nenhum orçamento encontrado" : "Nenhum orçamento ainda"}
          description={q || status ? "Tente outra busca ou outra situação." : "Crie o primeiro orçamento a partir do catálogo de serviços."}
        >
          <Link href={q || status ? "/orcamentos" : "/orcamentos/novo"} className={buttonVariants({ variant: "outline" })}>
            {q || status ? "Limpar filtros" : "Novo orçamento"}
          </Link>
        </EmptyState>
      ) : (
        <ul className="divide-y rounded-xl border bg-card">
          {quotes.map((x) => (
            <li key={x.id}>
              <Link
                href={`/orcamentos/${x.id}`}
                className="flex flex-col gap-1 p-4 transition-colors hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:flex-row sm:items-center sm:gap-4"
              >
                <span className="w-24 shrink-0 font-medium tabular-nums">{formatQuoteNumber(x.number)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{x.customer.name}</span>
                  <span className="block text-sm text-muted-foreground">
                    <span className="font-mono">{x.vehicle.plate}</span> · {x.vehicle.model} · {formatDate(x.createdAt)}
                  </span>
                </span>
                <span className="flex items-center justify-between gap-3 sm:justify-end">
                  <StatusBadge {...quoteStatus[x.status]} />
                  <span className="w-28 text-right font-medium tabular-nums">{formatBRL(x.total)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
