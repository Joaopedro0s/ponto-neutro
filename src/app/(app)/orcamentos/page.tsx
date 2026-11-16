import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, tdClass, thClass, trClass } from "@/components/ui/table";
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

      <form role="search" className="mb-5 flex max-w-2xl gap-2">
        <Label htmlFor="q" className="sr-only">
          Buscar por cliente, placa ou número
        </Label>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input id="q" name="q" type="search" defaultValue={q} placeholder="Cliente, placa ou número" autoComplete="off" spellCheck={false} className="pl-9 sm:h-11" />
        </div>
        {status && <input type="hidden" name="situacao" value={status} />}
        <Button type="submit" size="lg" className="sm:h-11">
          Buscar
        </Button>
      </form>

      {/* Abas de situação: rolam na própria faixa no celular */}
      <nav aria-label="Filtrar por situação" className="-mx-4 mb-5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <ul className="flex w-max gap-1 rounded-lg border bg-surface p-1">
          {[undefined, ...STATUSES].map((s) => (
            <li key={s ?? "todos"}>
              <Link
                href={href(s)}
                aria-current={status === s ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-10 items-center gap-2 rounded-md px-3.5 text-sm whitespace-nowrap text-muted-foreground transition-colors duration-150 hover:text-foreground sm:min-h-8",
                  status === s && "bg-surface-2 font-medium text-foreground",
                )}
              >
                {s ? quoteStatus[s].label : "Todos"}
                <span className="rounded-full bg-background/60 px-1.5 text-xs tabular-nums">{countOf(s)}</span>
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
          <Link href={q || status ? "/orcamentos" : "/orcamentos/novo"} className={buttonVariants({ variant: "outline", size: "lg" })}>
            {q || status ? "Limpar filtros" : "Novo orçamento"}
          </Link>
        </EmptyState>
      ) : (
        <>
          <div className="hidden md:block">
            <Table>
              <caption className="sr-only">Orçamentos</caption>
              <thead>
                <tr>
                  <th scope="col" className={thClass}>Número</th>
                  <th scope="col" className={thClass}>Cliente</th>
                  <th scope="col" className={thClass}>Veículo</th>
                  <th scope="col" className={thClass}>Data</th>
                  <th scope="col" className={thClass}>Situação</th>
                  <th scope="col" className={`${thClass} text-right`}>Total</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((x) => (
                  <tr key={x.id} className={trClass}>
                    <td className={tdClass}>
                      <Link href={`/orcamentos/${x.id}`} className="font-mono font-medium text-primary underline-offset-4 hover:underline">
                        {formatQuoteNumber(x.number)}
                      </Link>
                    </td>
                    <td className={tdClass}>{x.customer.name}</td>
                    <td className={tdClass}>
                      <span className="plate">{x.vehicle.plate}</span>
                      <span className="block text-xs text-muted-foreground">{x.vehicle.model}</span>
                    </td>
                    <td className={`${tdClass} text-muted-foreground tabular-nums`}>{formatDate(x.createdAt)}</td>
                    <td className={tdClass}>
                      <StatusBadge {...quoteStatus[x.status]} />
                    </td>
                    <td className={`${tdClass} text-right font-medium whitespace-nowrap tabular-nums`}>{formatBRL(x.total)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>

          <ul className="flex flex-col gap-2 md:hidden">
            {quotes.map((x) => (
              <li key={x.id}>
                <Link href={`/orcamentos/${x.id}`} className="block rounded-xl border bg-card p-4 transition-colors duration-150 hover:border-input">
                  <span className="flex items-center justify-between gap-3">
                    <span className="font-mono text-sm font-medium text-primary">{formatQuoteNumber(x.number)}</span>
                    <StatusBadge {...quoteStatus[x.status]} />
                  </span>
                  <span className="mt-2 flex items-end justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block truncate">{x.customer.name}</span>
                      <span className="block text-sm text-muted-foreground">
                        <span className="plate">{x.vehicle.plate}</span> · {formatDate(x.createdAt)}
                      </span>
                    </span>
                    <span className="font-display text-xl font-semibold tabular-nums">{formatBRL(x.total)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
