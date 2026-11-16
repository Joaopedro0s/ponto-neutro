"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { buttonVariants } from "@/components/ui/button";
import type { Tone } from "@/lib/labels";
import { spDay, spTime } from "@/lib/schedule";
import { cn } from "@/lib/utils";

export type GridColumn = { key: string; title: string; subtitle?: string; isToday: boolean; day: string; closedFrom: number | null };
export type GridBlock = {
  id: string;
  col: number;
  start: number;
  end: number;
  lane: number;
  lanes: number;
  timeLabel: string;
  dateLabel: string;
  service: string;
  plate: string;
  customer: string;
  proName: string;
  proInitials: string;
  color: string;
  status: { label: string; tone: Tone };
  canceled: boolean;
  notes: string | null;
};

const START = 8 * 60; // 08:00
const END = 18 * 60; // 18:00
const HOUR = 64; // px por hora
const PAD = 12; // folga no topo e na base para os rótulos 08:00 e 18:00
const px = (min: number) => ((min - START) / 60) * HOUR;
const HOURS = Array.from({ length: (END - START) / 60 + 1 }, (_, i) => START / 60 + i);

/** Linha da hora atual: calculada no navegador (e atualizada a cada minuto) para não divergir do servidor. */
function NowLine({ columns }: { columns: GridColumn[] }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);
  if (!now) return null;
  const col = columns.findIndex((c) => c.day === spDay(now));
  const [h, m] = spTime(now).split(":").map(Number);
  const min = h * 60 + m;
  if (col === -1 || min < START || min > END) return null;
  return (
    <div
      className="pointer-events-none absolute z-20 h-0.5 bg-primary"
      style={{ top: px(min), left: `${(col / columns.length) * 100}%`, width: `${100 / columns.length}%` }}
      aria-hidden="true"
    >
      <span className="absolute -top-[5px] -left-[5px] size-3 rounded-full bg-primary" />
    </div>
  );
}

export function AgendaGrid({ columns, blocks }: { columns: GridColumn[]; blocks: GridBlock[] }) {
  const [selected, setSelected] = useState<GridBlock | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (selected) dialogRef.current?.showModal();
  }, [selected]);

  return (
    <div className="rounded-xl border bg-card">
      {/* Cabeçalho das colunas */}
      <div className="sticky top-0 z-30 grid rounded-t-xl border-b bg-card" style={{ gridTemplateColumns: `3.5rem repeat(${columns.length}, minmax(0, 1fr))` }}>
        <div />
        {columns.map((c) => (
          <div key={c.key} className={cn("border-l px-3 py-3", c.isToday && "bg-accent-soft")}>
            <p className={cn("font-display text-lg leading-tight font-semibold tracking-wide uppercase", c.isToday && "text-primary")}>{c.title}</p>
            {c.subtitle && <p className="truncate text-xs text-muted-foreground">{c.subtitle}</p>}
          </div>
        ))}
      </div>

      <div className="grid" style={{ gridTemplateColumns: `3.5rem minmax(0, 1fr)` }}>
        {/* Eixo de horas */}
        <div className="relative" style={{ height: px(END) + PAD * 2 }} aria-hidden="true">
          {HOURS.map((h) => (
            <span key={h} className="absolute right-2 -translate-y-1/2 font-mono text-xs text-muted-foreground" style={{ top: px(h * 60) + PAD }}>
              {String(h).padStart(2, "0")}:00
            </span>
          ))}
        </div>

        <div className="relative" style={{ height: px(END) + PAD * 2 }}>
          <div className="absolute inset-x-0 grid" style={{ top: PAD, bottom: PAD, gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
            {columns.map((c, ci) => (
              <div
                key={c.key}
                className={cn("relative border-l", c.isToday && "bg-accent-soft/40")}
                // Linhas de hora cheias e de meia hora tracejadas, como uma régua
                style={{
                  backgroundImage: `linear-gradient(to bottom, var(--border) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, var(--border) 50%, transparent) 1px, transparent 1px)`,
                  backgroundSize: `100% ${HOUR}px, 100% ${HOUR / 2}px`,
                }}
              >
                {c.closedFrom !== null && (
                  <div
                    className="absolute inset-x-0 bottom-0 flex items-start justify-center pt-3 text-xs text-muted-foreground [background:repeating-linear-gradient(135deg,transparent_0_6px,var(--surface-2)_6px_8px)]"
                    style={{ top: px(c.closedFrom) }}
                  >
                    Fechado
                  </div>
                )}
                {blocks
                  .filter((b) => b.col === ci)
                  .map((b) => {
                    const height = Math.max(px(b.end) - px(b.start) - 2, 26);
                    const compact = height < 56;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setSelected(b)}
                        className={cn(
                          "@container absolute z-10 flex scroll-mt-24 flex-col justify-start overflow-hidden rounded-md border-l-[3px] px-2 py-1 text-left transition-[filter,transform] duration-150 hover:brightness-125 focus-visible:z-30",
                          b.canceled && "opacity-45",
                        )}
                        style={{
                          top: px(b.start) + 1,
                          height,
                          left: `calc(${(b.lane / b.lanes) * 100}% + 3px)`,
                          width: `calc(${100 / b.lanes}% - 6px)`,
                          borderLeftColor: b.color,
                          background: `color-mix(in oklab, ${b.color} 22%, var(--surface))`,
                        }}
                      >
                        {/* Faixa estreita: só o início; o horário completo e as iniciais aparecem quando cabem. */}
                        <span className={cn("flex w-full items-center justify-between gap-1 font-mono text-xs whitespace-nowrap", b.canceled && "line-through")}>
                          <span className="hidden @[7.5rem]:inline">{b.timeLabel}</span>
                          <span className="@[7.5rem]:hidden">{b.timeLabel.slice(0, 5)}</span>
                          <span className="hidden shrink-0 rounded bg-background/50 px-1 font-sans font-semibold @[5.5rem]:inline" aria-hidden="true">
                            {b.proInitials}
                          </span>
                        </span>
                        <span className={cn("block truncate text-sm leading-tight font-medium", compact && "text-xs")}>{b.service}</span>
                        {!compact && <span translate="no" className="plate block truncate text-xs text-muted-foreground">{b.plate}</span>}
                        <span className="sr-only">
                          {compact && `, placa ${b.plate}`}, {b.proName}, {b.status.label}
                        </span>
                      </button>
                    );
                  })}
              </div>
            ))}
          </div>
          <div className="pointer-events-none absolute inset-x-0" style={{ top: PAD, bottom: PAD }}>
            <NowLine columns={columns} />
          </div>
        </div>
      </div>

      <dialog
        ref={dialogRef}
        onClose={() => setSelected(null)}
        onClick={(e) => e.target === dialogRef.current && dialogRef.current?.close()}
        aria-labelledby="agendamento-titulo"
        className="m-auto w-[min(28rem,calc(100vw-2rem))] animate-enter overscroll-contain rounded-2xl border bg-surface-2 p-0 text-foreground backdrop:bg-black/60"
      >
        {selected && (
          <div className="flex flex-col gap-4 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="eyebrow">{selected.dateLabel}</p>
                <h2 id="agendamento-titulo" className="mt-1 font-display text-2xl font-semibold tracking-wide uppercase">
                  {selected.service}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => dialogRef.current?.close()}
                className={buttonVariants({ variant: "ghost", size: "icon" })}
                aria-label="Fechar detalhes"
              >
                <X aria-hidden="true" />
              </button>
            </div>
            <dl className="grid grid-cols-[7rem_1fr] gap-x-3 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Horário</dt>
              <dd className="font-mono">{selected.timeLabel}</dd>
              <dt className="text-muted-foreground">Cliente</dt>
              <dd>{selected.customer}</dd>
              <dt className="text-muted-foreground">Veículo</dt>
              <dd>
                <Link href={`/veiculos/${selected.plate}`} className="plate text-primary underline-offset-4 hover:underline">
                  {selected.plate}
                </Link>
              </dd>
              <dt className="text-muted-foreground">Profissional</dt>
              <dd className="flex items-center gap-2">
                <span className="size-2.5 rounded-full" style={{ background: selected.color }} aria-hidden="true" />
                {selected.proName}
              </dd>
              <dt className="text-muted-foreground">Situação</dt>
              <dd>
                <StatusBadge {...selected.status} />
              </dd>
              {selected.notes && (
                <>
                  <dt className="text-muted-foreground">Observações</dt>
                  <dd>{selected.notes}</dd>
                </>
              )}
            </dl>
            <div className="flex flex-wrap gap-2">
              <Link href={`/agenda/${selected.id}`} className={buttonVariants({ size: "lg" })}>
                Abrir agendamento
              </Link>
              <button type="button" onClick={() => dialogRef.current?.close()} className={buttonVariants({ variant: "outline", size: "lg" })}>
                Fechar
              </button>
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}
