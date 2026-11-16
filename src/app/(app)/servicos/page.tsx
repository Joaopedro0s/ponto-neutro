import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatBRL, formatDuration } from "@/lib/format";
import { serviceCategoryLabel } from "@/lib/labels";
import type { ServiceCategory } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "Catálogo de serviços" };

export default async function ServicesPage() {
  await requireUser();
  const services = await db.service.findMany({ orderBy: [{ active: "desc" }, { name: "asc" }] });
  const categories = Object.keys(serviceCategoryLabel) as ServiceCategory[];

  return (
    <>
      <PageHeader title="Catálogo de serviços" description="Preço de mão de obra e duração estimada. Peças entram à parte no orçamento.">
        <Link href="/servicos/novo" className={buttonVariants({ size: "lg" })}>
          <Plus aria-hidden="true" />
          Novo serviço
        </Link>
      </PageHeader>
      <div className="flex flex-col gap-8">
        {categories.map((cat) => {
          const list = services.filter((s) => s.category === cat);
          if (!list.length) return null;
          return (
            <section key={cat} aria-labelledby={`cat-${cat}`}>
              <h2 id={`cat-${cat}`} className="eyebrow mb-3">
                {serviceCategoryLabel[cat]}
              </h2>
              <ul className="divide-y rounded-xl border bg-card">
                {list.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/servicos/${s.id}`}
                      className="flex flex-col gap-1 p-4 transition-colors hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:flex-row sm:items-center sm:gap-4"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium">
                          {s.name}
                          {!s.active && <span className="ml-2 text-xs font-normal text-muted-foreground">(inativo)</span>}
                        </span>
                        {s.description && <span className="block text-sm text-muted-foreground">{s.description}</span>}
                      </span>
                      <span className="flex gap-4 text-sm tabular-nums sm:justify-end">
                        <span className="text-muted-foreground">{formatDuration(s.durationMinutes)}</span>
                        <span className="w-24 font-medium sm:text-right">{formatBRL(s.price)}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </>
  );
}
