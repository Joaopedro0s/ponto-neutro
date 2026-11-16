import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, tdClass, thClass, trClass } from "@/components/ui/table";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatBRL, formatDate } from "@/lib/format";
import { initials } from "@/lib/professionals";
import type { Prisma } from "@/generated/prisma/client";

export const metadata: Metadata = { title: "Clientes" };

// shortcut: lista sem paginação, até 200 clientes; paginar se a base crescer além disso.
const LIMIT = 200;

function Avatar({ name }: { name: string }) {
  return (
    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-2 font-display text-sm font-semibold text-muted-foreground" aria-hidden="true">
      {initials(name)}
    </span>
  );
}

function PlateChips({ plates, owner }: { plates: { plate: string; model: string }[]; owner: string }) {
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label={`Veículos de ${owner}`}>
      {plates.map((v) => (
        <li key={v.plate}>
          <Link
            href={`/veiculos/${v.plate}`}
            title={v.model}
            translate="no"
            className="plate inline-flex min-h-9 items-center rounded-md border border-input bg-surface-2 px-2 text-xs transition-colors duration-150 hover:border-primary hover:text-primary sm:min-h-7"
          >
            <span className="sr-only">Histórico da placa </span>
            {v.plate}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default async function CustomersPage({ searchParams }: PageProps<"/clientes">) {
  await requireUser();
  const q = String((await searchParams).q ?? "").trim();
  const digits = q.replace(/\D/g, "");
  const plate = q.toUpperCase().replace(/[^A-Z0-9]/g, "");

  const where: Prisma.CustomerWhereInput = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          ...(digits.length >= 4 ? [{ phone: { contains: digits.slice(-4) } }] : []),
          ...(plate.length >= 3 ? [{ vehicles: { some: { plate: { contains: plate } } } }] : []),
        ],
      }
    : {};

  const [rows, total] = await Promise.all([
    db.customer.findMany({
      where,
      orderBy: { name: "asc" },
      take: LIMIT,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        vehicles: { select: { plate: true, model: true }, orderBy: { createdAt: "asc" } },
        appointments: { select: { startsAt: true }, orderBy: { startsAt: "desc" }, take: 1, where: { status: "COMPLETED" } },
        // Total gasto = orçamentos cujas OS já foram entregues (mesma regra do faturamento)
        quotes: { where: { workOrder: { status: "DELIVERED" } }, select: { total: true } },
      },
    }),
    db.customer.count(),
  ]);
  const customers = rows.map((c) => ({ ...c, spent: c.quotes.reduce((s, q) => s + Number(q.total), 0), lastVisit: c.appointments[0]?.startsAt }));

  return (
    <>
      <PageHeader title="Clientes" description={`${total} clientes cadastrados`}>
        <Link href="/clientes/novo" className={buttonVariants({ size: "lg" })}>
          <Plus aria-hidden="true" />
          Novo cliente
        </Link>
      </PageHeader>

      <form role="search" className="mb-5 flex max-w-2xl gap-2">
        <Label htmlFor="q" className="sr-only">
          Buscar por nome, telefone, e-mail ou placa
        </Label>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input id="q" name="q" type="search" defaultValue={q} placeholder="Nome, telefone, e-mail ou placa" autoComplete="off" spellCheck={false} className="pl-9 sm:h-11" />
        </div>
        <Button type="submit" size="lg" className="sm:h-11">
          Buscar
        </Button>
      </form>

      {customers.length === 0 ? (
        q ? (
          <EmptyState title={`Nada encontrado para “${q}”`} description="Confira a grafia ou busque pela placa do veículo.">
            <Link href="/clientes" className={buttonVariants({ variant: "outline", size: "lg" })}>
              Limpar busca
            </Link>
          </EmptyState>
        ) : (
          <EmptyState title="Nenhum cliente cadastrado" description="Cadastre o primeiro cliente para começar a agendar serviços.">
            <Link href="/clientes/novo" className={buttonVariants({ size: "lg" })}>
              Novo cliente
            </Link>
          </EmptyState>
        )
      ) : (
        <>
          {q && (
            <p className="mb-3 text-sm text-muted-foreground" role="status">
              {customers.length} resultado{customers.length === 1 ? "" : "s"} para “{q}”
            </p>
          )}

          {/* Tablet e desktop: tabela */}
          <div className="hidden md:block">
            <Table>
              <caption className="sr-only">Clientes</caption>
              <thead>
                <tr>
                  <th scope="col" className={thClass}>
                    Cliente
                  </th>
                  <th scope="col" className={thClass}>
                    Telefone
                  </th>
                  <th scope="col" className={thClass}>
                    Veículos
                  </th>
                  <th scope="col" className={thClass}>
                    Última visita
                  </th>
                  <th scope="col" className={`${thClass} text-right`}>
                    Total gasto
                  </th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} className={trClass}>
                    <td className={tdClass}>
                      <span className="flex items-center gap-3">
                        <Avatar name={c.name} />
                        <span className="min-w-0">
                          <Link href={`/clientes/${c.id}`} className="block font-medium underline-offset-4 hover:text-primary hover:underline">
                            {c.name}
                          </Link>
                          {c.email && <span className="block truncate text-xs text-muted-foreground">{c.email}</span>}
                        </span>
                      </span>
                    </td>
                    <td className={`${tdClass} whitespace-nowrap text-muted-foreground tabular-nums`}>{c.phone}</td>
                    <td className={tdClass}>
                      <PlateChips plates={c.vehicles} owner={c.name} />
                    </td>
                    <td className={`${tdClass} whitespace-nowrap text-muted-foreground tabular-nums`}>{c.lastVisit ? formatDate(c.lastVisit) : "—"}</td>
                    <td className={`${tdClass} text-right font-medium whitespace-nowrap tabular-nums`}>{formatBRL(c.spent)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>

          {/* Celular: cartões compactos */}
          <ul className="flex flex-col gap-2 md:hidden">
            {customers.map((c) => (
              <li key={c.id} className="rounded-xl border bg-card p-4">
                <div className="flex items-center gap-3">
                  <Avatar name={c.name} />
                  <div className="min-w-0 flex-1">
                    <Link href={`/clientes/${c.id}`} className="block truncate font-medium">
                      {c.name}
                    </Link>
                    <p className="text-sm text-muted-foreground tabular-nums">{c.phone}</p>
                  </div>
                  <p className="text-right text-sm">
                    <span className="block font-medium tabular-nums">{formatBRL(c.spent)}</span>
                    <span className="block text-xs text-muted-foreground">{c.lastVisit ? formatDate(c.lastVisit) : "sem visita"}</span>
                  </p>
                </div>
                {c.vehicles.length > 0 && (
                  <div className="mt-3">
                    <PlateChips plates={c.vehicles} owner={c.name} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
