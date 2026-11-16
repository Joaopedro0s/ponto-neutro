import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import type { Prisma } from "@/generated/prisma/client";

export const metadata: Metadata = { title: "Clientes" };

// shortcut: lista sem paginação, até 200 clientes; paginar se a base crescer além disso.
const LIMIT = 200;

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

  const [customers, total] = await Promise.all([
    db.customer.findMany({
      where,
      orderBy: { name: "asc" },
      take: LIMIT,
      select: {
        id: true,
        name: true,
        phone: true,
        vehicles: { select: { plate: true, model: true }, orderBy: { createdAt: "asc" } },
        appointments: { select: { startsAt: true }, orderBy: { startsAt: "desc" }, take: 1, where: { status: "COMPLETED" } },
      },
    }),
    db.customer.count(),
  ]);

  return (
    <>
      <PageHeader title="Clientes" description={`${total} clientes cadastrados`}>
        <Link href="/clientes/novo" className={buttonVariants({ size: "lg" })}>
          <Plus aria-hidden="true" />
          Novo cliente
        </Link>
      </PageHeader>

      <form role="search" className="mb-4 flex max-w-xl gap-2">
        <Label htmlFor="q" className="sr-only">
          Buscar por nome, telefone, e-mail ou placa
        </Label>
        <Input id="q" name="q" type="search" defaultValue={q} placeholder="Nome, telefone, e-mail ou placa" className="h-10" />
        <Button type="submit" variant="outline" size="lg" className="h-10">
          <Search aria-hidden="true" />
          Buscar
        </Button>
      </form>

      {customers.length === 0 ? (
        q ? (
          <EmptyState title={`Nenhum cliente encontrado para “${q}”`} description="Confira a grafia ou busque pela placa do veículo.">
            <Link href="/clientes" className={buttonVariants({ variant: "outline" })}>
              Limpar busca
            </Link>
          </EmptyState>
        ) : (
          <EmptyState title="Nenhum cliente cadastrado" description="Cadastre o primeiro cliente para começar a agendar serviços.">
            <Link href="/clientes/novo" className={buttonVariants()}>
              Novo cliente
            </Link>
          </EmptyState>
        )
      ) : (
        <>
          {q && (
            <p className="mb-2 text-sm text-muted-foreground" role="status">
              {customers.length} resultado{customers.length === 1 ? "" : "s"} para “{q}”
            </p>
          )}
          <ul className="divide-y rounded-xl border bg-card">
            {customers.map((c) => (
              <li key={c.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:gap-4">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/clientes/${c.id}`}
                    className="rounded font-medium hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                  >
                    {c.name}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {c.phone}
                    {c.appointments[0] && <> · última visita em {formatDate(c.appointments[0].startsAt)}</>}
                  </p>
                </div>
                <ul className="flex flex-wrap gap-1.5" aria-label={`Veículos de ${c.name}`}>
                  {c.vehicles.map((v) => (
                    <li key={v.plate}>
                      <Link
                        href={`/veiculos/${v.plate}`}
                        title={v.model}
                        className="inline-flex h-7 items-center rounded-md border bg-background px-2 font-mono text-xs tracking-wider hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                      >
                        <span className="sr-only">Histórico da placa </span>
                        {v.plate}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
