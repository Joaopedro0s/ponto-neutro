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
const PAD = 12; // folga para os rótulos 08:00 e 18:00
const LANE_MIN = 144; // largura mínima de cada faixa: horário e serviços comuns ("Lavagem técnica") cabem inteiros
const AXIS = 56;
const POP_W = 288;
const px = (min: number) => ((min - START) / 60) * HOUR;
const HOURS = Array.from({ length: (END - START) / 60 + 1 }, (_, i) => START / 60 + i);

/** Linha da hora atual: calculada no navegador (atualizada a cada minuto) para não divergir do servidor. */
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

/**
 * Grade de horas. `compact` (semana): o bloco mostra só horário e serviço; os detalhes ficam no popover,
 * que abre ao clicar ou ao focar o bloco pelo teclado.
 */
export function AgendaGrid({ columns, blocks, compact = false }: { columns: GridColumn[]; blocks: GridBlock[]; compact?: boolean }) {
  const [open, setOpen] = useState<{ block: GridBlock; top: number; left: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const buttons = useRef(new Map<string, HTMLButtonElement>());

  // Largura mínima de cada coluna: o maior número de faixas lado a lado vezes a largura mínima da faixa.
  const minCol = columns.map((_, ci) => Math.max(LANE_MIN, ...blocks.filter((b) => b.col === ci).map((b) => b.lanes * LANE_MIN)));
  const template = `${AXIS}px ${minCol.map((w) => `minmax(${w}px, 1fr)`).join(" ")}`;

  function show(block: GridBlock, el: HTMLElement) {
    const wrap = wrapRef.current!;
    const box = wrap.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    // À direita do bloco; se não couber, à esquerda.
    const right = r.right - box.left + wrap.scrollLeft + 8;
    const left = right + POP_W > wrap.scrollWidth ? r.left - box.left + wrap.scrollLeft - POP_W - 8 : right;
    setOpen({ block, top: r.top - box.top, left: Math.max(8, left) });
  }
  const close = (returnFocus = false) => {
    if (returnFocus && open) buttons.current.get(open.block.id)?.focus();
    setOpen(null);
  };

  // Esc fecha e devolve o foco ao bloco; clique fora fecha.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        buttons.current.get(open.block.id)?.focus();
        setOpen(null);
      }
    };
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!popRef.current?.contains(t) && !buttons.current.get(open.block.id)?.contains(t)) setOpen(null);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  return (
    <div
      ref={wrapRef}
      className="relative overflow-x-auto overscroll-x-contain rounded-xl border bg-card"
      onBlur={(e) => {
        // Fecha quando o foco sai da grade e do popover.
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(null);
      }}
    >
      {/* Cabeçalho das colunas */}
      <div className="grid border-b" style={{ gridTemplateColumns: template }}>
        <div />
        {columns.map((c) => (
          <div key={c.key} className={cn("border-l px-3 py-3", c.isToday && "bg-surface-2")}>
            <p className="font-display text-lg leading-tight font-semibold tracking-wide uppercase">{c.title}</p>
            {c.subtitle && <p className="truncate text-xs text-muted-foreground">{c.subtitle}</p>}
          </div>
        ))}
      </div>

      <div className="relative grid" style={{ gridTemplateColumns: template, height: px(END) + PAD * 2 }}>
        {/* Eixo de horas */}
        <div className="relative" aria-hidden="true">
          {HOURS.map((h) => (
            <span key={h} className="absolute right-2 -translate-y-1/2 font-mono text-xs text-muted-foreground" style={{ top: px(h * 60) + PAD }}>
              {String(h).padStart(2, "0")}:00
            </span>
          ))}
        </div>

        {columns.map((c, ci) => (
          <div
            key={c.key}
            className={cn("relative border-l", c.isToday && "bg-surface-2/50")}
            // Linhas de hora cheia e de meia hora: a régua de horários
            style={{
              backgroundImage: `linear-gradient(to bottom, var(--border) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, var(--border) 50%, transparent) 1px, transparent 1px)`,
              backgroundSize: `100% ${HOUR}px, 100% ${HOUR / 2}px`,
              backgroundPosition: `0 ${PAD}px`,
            }}
          >
            {c.closedFrom !== null && (
              <div
                className="absolute inset-x-0 flex items-start justify-center bg-surface-2 pt-3 text-xs text-muted-foreground"
                style={{ top: px(c.closedFrom) + PAD, bottom: 0 }}
              >
                Fechado
              </div>
            )}
            {blocks
              .filter((b) => b.col === ci)
              .map((b) => {
                const height = Math.max(px(b.end) - px(b.start) - 2, 26);
                const tall = !compact && height >= 64;
                const isOpen = open?.block.id === b.id;
                return (
                  <button
                    key={b.id}
                    ref={(el) => {
                      if (el) buttons.current.set(b.id, el);
                    }}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={isOpen ? "agenda-popover" : undefined}
                    onClick={(e) => {
                      if (!isOpen) return show(b, e.currentTarget);
                      // Enter/Espaço (detail 0) com o popover aberto: leva o foco para dentro dele; clique do mouse fecha.
                      if (e.detail === 0) popRef.current?.querySelector<HTMLElement>("a, button")?.focus();
                      else close();
                    }}
                    onFocus={(e) => e.currentTarget.matches(":focus-visible") && show(b, e.currentTarget)}
                    className={cn(
                      "absolute z-10 flex scroll-mt-24 flex-col justify-start overflow-hidden rounded-md border-l-[3px] px-2 py-1 text-left transition-[filter] duration-150 hover:brightness-125 focus-visible:z-30",
                      b.canceled && "opacity-45",
                      isOpen && "brightness-125",
                    )}
                    style={{
                      top: px(b.start) + PAD + 1,
                      height,
                      left: `calc(${(b.lane / b.lanes) * 100}% + 3px)`,
                      width: `calc(${100 / b.lanes}% - 6px)`,
                      borderLeftColor: b.color,
                      background: `color-mix(in oklab, ${b.color} 22%, var(--surface))`,
                    }}
                  >
                    <span className={cn("flex w-full items-center justify-between gap-1 font-mono text-xs whitespace-nowrap", b.canceled && "line-through")}>
                      <span className="truncate">{b.timeLabel}</span>
                      {!compact && (
                        <span className="shrink-0 rounded bg-background/50 px-1 font-sans font-semibold" aria-hidden="true">
                          {b.proInitials}
                        </span>
                      )}
                    </span>
                    <span className="block w-full truncate text-sm leading-tight font-medium">{b.service}</span>
                    {tall && (
                      <span translate="no" className="plate block truncate text-xs text-muted-foreground">
                        {b.plate}
                      </span>
                    )}
                    <span className="sr-only">
                      , {b.proName}, {b.status.label}
                    </span>
                  </button>
                );
              })}
          </div>
        ))}

        <div className="pointer-events-none absolute right-0" style={{ left: AXIS, top: PAD, bottom: PAD }}>
          <NowLine columns={columns} />
        </div>
      </div>

      {open && (
        <div
          ref={popRef}
          id="agenda-popover"
          role="dialog"
          aria-labelledby="agenda-popover-titulo"
          className="absolute z-40 flex animate-enter flex-col gap-3 rounded-xl border border-border-strong bg-surface-2 p-4"
          style={{ top: open.top, left: open.left, width: POP_W }}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="eyebrow">{open.block.dateLabel}</p>
              <h2 id="agenda-popover-titulo" className="mt-1 font-display text-xl leading-tight font-semibold tracking-wide uppercase">
                {open.block.service}
              </h2>
            </div>
            <button type="button" onClick={() => close(true)} className={buttonVariants({ variant: "ghost", size: "icon-sm" })} aria-label="Fechar detalhes">
              <X aria-hidden="true" />
            </button>
          </div>
          <dl className="grid grid-cols-[5.5rem_1fr] gap-x-3 gap-y-1.5 text-sm">
            <dt className="text-muted-foreground">Horário</dt>
            <dd className="font-mono">{open.block.timeLabel}</dd>
            <dt className="text-muted-foreground">Cliente</dt>
            <dd className="truncate" title={open.block.customer}>
              {open.block.customer}
            </dd>
            <dt className="text-muted-foreground">Veículo</dt>
            <dd>
              <Link href={`/veiculos/${open.block.plate}`} translate="no" className="plate underline underline-offset-4 hover:text-muted-foreground">
                {open.block.plate}
              </Link>
            </dd>
            <dt className="text-muted-foreground">Profissional</dt>
            <dd className="flex items-center gap-2">
              <span className="size-2.5 shrink-0 rounded-full" style={{ background: open.block.color }} aria-hidden="true" />
              {open.block.proName}
            </dd>
            <dt className="text-muted-foreground">Situação</dt>
            <dd>
              <StatusBadge {...open.block.status} />
            </dd>
            {open.block.notes && (
              <>
                <dt className="text-muted-foreground">Observações</dt>
                <dd>{open.block.notes}</dd>
              </>
            )}
          </dl>
          <Link href={`/agenda/${open.block.id}`} className={buttonVariants({ size: "lg", className: "w-full" })}>
            Abrir agendamento
          </Link>
        </div>
      )}
    </div>
  );
}
